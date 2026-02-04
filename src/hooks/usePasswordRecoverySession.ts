import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearSupabaseAuthStorage } from "@/lib/auth/clearSupabaseAuthStorage";
import { looksLikeRecoveryLink, parseRecoveryUrl } from "@/lib/auth/recoveryUrl";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const looksLikeNumericOtp = (token: string) => /^\d{4,10}$/.test(token.trim());

type VerifyAttemptResult = { ok: true } | { ok: false; message: string };

async function verifyRecoveryViaTokenHash(tokenHash: string): Promise<VerifyAttemptResult> {
  const { error } = await supabase.auth.verifyOtp({
    type: "recovery",
    token_hash: tokenHash,
  });
  return error ? { ok: false, message: error.message } : { ok: true };
}

async function verifyRecoveryViaEmailToken(email: string, token: string): Promise<VerifyAttemptResult> {
  const { error } = await supabase.auth.verifyOtp({
    type: "recovery",
    email: email.trim(),
    token,
  } as any);
  return error ? { ok: false, message: error.message } : { ok: true };
}

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
            const res = await verifyRecoveryViaTokenHash(p.tokenHash);
            if (res.ok === false) {
              setEstablishError(res.message);
            }
          } else if (p?.token) {
            // Legacy templates sometimes use `token=`.
            // Some projects pass the token hash in `token` (even if it's numeric).
            // To be maximally compatible we attempt token_hash verification first, then fall back to email+token.
            const asHash = await verifyRecoveryViaTokenHash(p.token);
            if (asHash.ok === false) {
              if (!p.email) {
                // Many OTP-style links require the email address to verify.
                setRequiresEmail(true);
              } else {
                const asToken = await verifyRecoveryViaEmailToken(p.email, p.token);
                if (asToken.ok === false) {
                  setEstablishError(asToken.message);
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

      // Max compatibility: try token_hash first (some templates put it in `token`),
      // then fall back to email+token (OTP-style).
      const asHash = await verifyRecoveryViaTokenHash(p.token);
      if (asHash.ok === false) {
        const asToken = await verifyRecoveryViaEmailToken(email, p.token);
        if (asToken.ok === false) {
          // If it looks like an OTP, give a more actionable error hint.
          if (looksLikeNumericOtp(p.token)) {
            setEstablishError(
              `${asToken.message}. If you requested multiple reset emails, only the most recent link/code will work.`
            );
          } else {
            setEstablishError(asToken.message);
          }
          setChecking(false);
          return false;
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