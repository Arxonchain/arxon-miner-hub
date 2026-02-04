import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearSupabaseAuthStorage } from "@/lib/auth/clearSupabaseAuthStorage";
import { looksLikeRecoveryLink, parseRecoveryUrl } from "@/lib/auth/recoveryUrl";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
          // Clear any stale/partial auth state first (common cause of verifyOtp failures)
          // Then ensure we are not currently authenticated with another session.
          clearSupabaseAuthStorage();
          await supabase.auth.signOut().catch(() => {});

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
            // If the link only contains a token (no token_hash/code/access_token) we need the email to verify.
            // Some email templates use `?token=...&type=recovery` (OTP). Supabase requires email+token.
            if (!p.email) {
              setRequiresEmail(true);
            } else {
            // Legacy templates sometimes use `token=`. Some projects still pass the hashed token in `token`.
            // Try token_hash first; if email is present we can also attempt token+email.
            const { error: tokenHashErr } = await supabase.auth.verifyOtp({
              type: "recovery",
              token_hash: p.token,
            });

            if (tokenHashErr && p.email) {
              const { error: tokenErr } = await supabase.auth.verifyOtp({
                type: "recovery",
                email: p.email,
                token: p.token,
              } as any);
              if (tokenErr) setEstablishError(tokenErr.message);
            } else if (tokenHashErr) {
              setEstablishError(tokenHashErr.message);
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
      // Ensure no stale session blocks OTP verification
      clearSupabaseAuthStorage();
      await supabase.auth.signOut().catch(() => {});

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