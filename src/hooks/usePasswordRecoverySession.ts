import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearSupabaseAuthStorage } from "@/lib/auth/clearSupabaseAuthStorage";
import { looksLikeRecoveryLink, parseRecoveryUrl } from "@/lib/auth/recoveryUrl";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function usePasswordRecoverySession() {
  const [checking, setChecking] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);
  const [establishError, setEstablishError] = useState<string | null>(null);

  const params = useMemo(() => {
    try {
      return parseRecoveryUrl();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      
      if (event === 'PASSWORD_RECOVERY' && session) {
        setIsValidSession(true);
        setChecking(false);
        window.history.replaceState(null, "", "/reset-password");
      }
    });

    const run = async () => {
      const p = params;
      const looksLikeRecovery = p ? looksLikeRecoveryLink(p) : false;

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

  return { checking, isValidSession, establishError, params };
}