import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type RecoveryUrlParams = {
  type: string;
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  tokenHash: string | null;
};

function parseRecoveryUrl(): RecoveryUrlParams {
  const rawHash = window.location.hash || "";
  const hash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;

  const hashParams = new URLSearchParams(hash);
  const searchParams = new URLSearchParams(window.location.search);

  const type = (hashParams.get("type") || searchParams.get("type") || "").toLowerCase();

  return {
    type,
    accessToken: hashParams.get("access_token") || searchParams.get("access_token"),
    refreshToken: hashParams.get("refresh_token") || searchParams.get("refresh_token"),
    code: searchParams.get("code") || hashParams.get("code"),
    tokenHash: searchParams.get("token_hash") || hashParams.get("token_hash"),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Establishes a password recovery session from whatever URL format the auth email uses.
 * Supports:
 * - #access_token=...&refresh_token=...&type=recovery
 * - ?access_token=...&refresh_token=...&type=recovery
 * - ?code=... (PKCE/code exchange)
 * - ?token_hash=...&type=recovery (OTP verification)
 * - PASSWORD_RECOVERY auth event from Supabase
 */
export function usePasswordRecoverySession() {
  const [checking, setChecking] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Listen for PASSWORD_RECOVERY event from Supabase auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      
      if (event === 'PASSWORD_RECOVERY' && session) {
        setIsValidSession(true);
        setChecking(false);
        // Clean URL after recovery session is established
        window.history.replaceState(null, "", "/reset-password");
      }
    });

    const run = async () => {
      const params = parseRecoveryUrl();

      // Try to establish a session if this looks like a recovery flow.
      // IMPORTANT: never force-fail here — some clients establish the session automatically.
      if (params.type === "recovery") {
        try {
          if (params.accessToken && params.refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: params.accessToken,
              refresh_token: params.refreshToken,
            });
            if (error) {
              console.error("Failed to set session from tokens:", error);
            }
          } else if (params.code) {
            const { error } = await supabase.auth.exchangeCodeForSession(params.code);
            if (error) {
              console.error("Failed to exchange code for session:", error);
            }
          } else if (params.tokenHash) {
            const { error } = await supabase.auth.verifyOtp({
              type: "recovery",
              token_hash: params.tokenHash,
            });
            if (error) {
              console.error("Failed to verify OTP:", error);
            }
          }
        } catch (e) {
          // Do not toast here—fallback to checking whether a session exists anyway.
          console.error("Failed to establish recovery session from URL:", e);
        }
      }

      // Wait for the auth library to settle and persist the session.
      // Extended timeout (8s) for slow devices / networks.
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

      // Clean sensitive params after a session is confirmed.
      if (sessionFound && params.type === "recovery") {
        window.history.replaceState(null, "", "/reset-password");
      }
    };

    run();
    
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { checking, isValidSession };
}
