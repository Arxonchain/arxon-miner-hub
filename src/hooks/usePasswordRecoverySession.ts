import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearSupabaseAuthStorage } from "@/lib/auth/clearSupabaseAuthStorage";
import { looksLikeRecoveryLink, parseRecoveryUrl } from "@/lib/auth/recoveryUrl";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const looksLikeNumericOtp = (token: string) => /^\d{4,10}$/.test(token.trim());

export function usePasswordRecoverySession() {
  const [checking, setChecking] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);
  const [establishError, setEstablishError] = useState<string | null>(null);
  const [requiresEmail, setRequiresEmail] = useState(false);

  const params = useMemo(() => {
    try {
      return parseRecoveryUrl();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const p = params;
    const looksLikeRecovery = p ? looksLikeRecoveryLink(p) : false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      
      // Some recovery flows emit PASSWORD_RECOVERY; others can emit SIGNED_IN.
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session && looksLikeRecovery) {
        setIsValidSession(true);
        setChecking(false);
        setRequiresEmail(false);
        window.history.replaceState(null, "", "/reset-password");
      }
    });

    const run = async () => {
      setRequiresEmail(false);
      setEstablishError(null);

      if (looksLikeRecovery) {
        try {
          // If we already have a session (e.g. user came from a callback route that already established it),
          // don't blow it away by clearing storage/signing out.
          const { data: existing } = await supabase.auth.getSession();
          if (existing.session) {
            setIsValidSession(true);
            setChecking(false);
            setRequiresEmail(false);
            window.history.replaceState(null, "", "/reset-password");
            return;
          }

          // For PKCE code exchange, we must NOT clear auth storage up-front because it can contain the code_verifier.
          const isPkceCodeFlow = Boolean(p?.code);
          if (!isPkceCodeFlow) {
            // Clear any stale/partial auth state first (common cause of verifyOtp failures)
            // Then ensure we are not currently authenticated with another session.
            clearSupabaseAuthStorage();
            await supabase.auth.signOut().catch(() => {});
          }

          if (p?.accessToken && p?.refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: p.accessToken,
              refresh_token: p.refreshToken,
            });
            if (error) setEstablishError(error.message);
          } else if (p?.code) {
            const { error } = await supabase.auth.exchangeCodeForSession(p.code);
            if (error) setEstablishError(error.message);
          } else if (p?.tokenHash) {
            // Newer template format
            const { error } = await supabase.auth.verifyOtp({
              type: "recovery",
              token_hash: p.tokenHash,
            });
            if (error) setEstablishError(error.message);
          } else if (p?.token) {
            // Legacy templates sometimes use `token=`.
            // In practice this is often a numeric OTP code which MUST be verified using email+token.
            // Trying it as token_hash first can lead to confusing "invalid/expired" results.
            if (looksLikeNumericOtp(p.token)) {
              setRequiresEmail(true);
            } else {
              // Some projects pass the hashed token in `token`.
              const { error: tokenHashErr } = await supabase.auth.verifyOtp({
                type: "recovery",
                token_hash: p.token,
              });

              if (tokenHashErr) {
                if (!p.email) {
                  setRequiresEmail(true);
                } else {
                  const { error: tokenErr } = await supabase.auth.verifyOtp({
                    type: "recovery",
                    email: p.email,
                    token: p.token,
                  } as any);
                  if (tokenErr) setEstablishError(tokenErr.message);
                }
              }
            }
          }
        } catch (e) {
          console.error("Failed to establish recovery session from URL:", e);
          setEstablishError(e instanceof Error ? e.message : "Failed to establish recovery session");
        }
      }

      const deadline = Date.now() + 8000;
      let sessionFound = false;

      while (!cancelled && Date.now() < deadline) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          sessionFound = true;
          break;
        }
        await sleep(300);
      }

      if (cancelled) return;

      setIsValidSession(sessionFound);
      setChecking(false);

      if (sessionFound && looksLikeRecovery) {
        window.history.replaceState(null, "", "/reset-password");
      }
    };

    run();
    
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const verifyTokenWithEmail = async (email: string) => {
    const p = params;
    if (!p?.token) {
      setEstablishError("Missing token in reset link.");
      return false;
    }
    if (!email.trim()) {
      setEstablishError("Please enter your email address.");
      return false;
    }

    setChecking(true);
    setEstablishError(null);

    try {
      // If we already have a session, no need to verify again.
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        setIsValidSession(true);
        setRequiresEmail(false);
        setChecking(false);
        window.history.replaceState(null, "", "/reset-password");
        return true;
      }

      // Ensure no stale session blocks OTP verification
      clearSupabaseAuthStorage();
      await supabase.auth.signOut().catch(() => {});

      // If token looks like a numeric OTP, verify via email+token directly.
      // Otherwise, attempt token_hash first, then fall back to email+token.
      if (looksLikeNumericOtp(p.token)) {
        const { error } = await supabase.auth.verifyOtp({
          type: "recovery",
          email: email.trim(),
          token: p.token,
        } as any);

        if (error) {
          setEstablishError(error.message);
          setChecking(false);
          return false;
        }
      } else {
        const { error: asHashErr } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: p.token,
        });

        if (asHashErr) {
          const { error: asTokenErr } = await supabase.auth.verifyOtp({
            type: "recovery",
            email: email.trim(),
            token: p.token,
          } as any);

          if (asTokenErr) {
            setEstablishError(asTokenErr.message);
            setChecking(false);
            return false;
          }
        }
      }

      // Poll for session to be safe across browsers
      const deadline = Date.now() + 8000;
      while (Date.now() < deadline) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setIsValidSession(true);
          setRequiresEmail(false);
          setChecking(false);
          window.history.replaceState(null, "", "/reset-password");
          return true;
        }
        await sleep(300);
      }

      setEstablishError("Could not establish session. Please request a new reset link.");
      setChecking(false);
      return false;
    } catch (e) {
      setEstablishError(e instanceof Error ? e.message : "Failed to verify reset token");
      setChecking(false);
      return false;
    }
  };

  return { checking, isValidSession, establishError, params, requiresEmail, verifyTokenWithEmail };
}