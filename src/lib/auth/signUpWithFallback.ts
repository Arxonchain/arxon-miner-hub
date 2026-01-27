import type { SupabaseClient, User } from "@supabase/supabase-js";
import { withTimeout } from "@/lib/utils";

type SignUpResult = { error: Error | null; user: User | null };

function toError(e: unknown, fallback = "Sign up failed"): Error {
  if (e instanceof Error) return e;
  const maybeMsg = (e as any)?.message || (e as any)?.error_description || (e as any)?.error;
  if (typeof maybeMsg === "string" && maybeMsg.trim()) return new Error(maybeMsg);
  try {
    const asJson = JSON.stringify(e);
    if (asJson && asJson !== "{}") return new Error(asJson);
  } catch {
    // ignore
  }
  return new Error(fallback);
}

function looksLikeExistingUser(msg: string) {
  const m = msg.toLowerCase();
  return (
    m.includes("already registered") ||
    m.includes("already exists") ||
    m.includes("user already") ||
    m.includes("already been registered")
  );
}

function looksTransient(msg: string) {
  const m = msg.toLowerCase();
  return (
    m.includes("timeout") ||
    m.includes("timed out") ||
    m.includes("server busy") ||
    m.includes("failed to fetch") ||
    m.includes("network") ||
    m.includes("functions") ||
    m.includes("edge function") ||
    m.includes("504") ||
    m.includes("503") ||
    m.includes("502") ||
    m.includes("context deadline exceeded") ||
    m.includes("request_timeout")
  );
}

/**
 * Live is currently experiencing 504 timeouts on the Auth /signup endpoint.
 * Fix: use backend-assisted signup (admin create + password grant) via `auth-signup`.
 */
export async function signUpWithFallback(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<SignUpResult> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1) Preferred path: backend-assisted signup (bypasses /signup)
  try {
    const { data: fnData, error: fnError } = await withTimeout(
      supabase.functions.invoke("auth-signup", {
        body: { email: normalizedEmail, password },
      }),
      25_000,
      "Connection timed out. The server may be busy - please try again."
    );

    const fnMsg =
      (typeof (fnData as any)?.error === "string" ? ((fnData as any).error as string) : "") ||
      (typeof (fnError as any)?.message === "string" ? ((fnError as any).message as string) : "");

    const hasSession =
      !!(fnData as any)?.success &&
      !!(fnData as any)?.session?.access_token &&
      !!(fnData as any)?.session?.refresh_token;

    if (hasSession) {
      const { data: sessionData, error: setSessionError } = await withTimeout(
        supabase.auth.setSession({
          access_token: (fnData as any).session.access_token,
          refresh_token: (fnData as any).session.refresh_token,
        }),
        20_000,
        "Connection timed out. The server may be busy - please try again."
      );

      if (!setSessionError) {
        return { error: null, user: sessionData?.session?.user ?? null };
      }
    }

    if (fnError || (fnData as any)?.error) {
      const err = toError(fnError ?? (fnData as any)?.error, "Sign up failed");

      // If the account already exists, suggest sign-in.
      if (looksLikeExistingUser(err.message)) {
        return { error: new Error("This email is already registered. Try signing in instead."), user: null };
      }

      // If the function was reachable but returned a business error, surface it.
      if (!looksTransient(err.message)) {
        return { error: err, user: null };
      }
    }
  } catch (e) {
    const err = toError(e, "Sign up failed");
    if (!looksTransient(err.message)) {
      return { error: err, user: null };
    }
  }

  // 2) If we timed out / got transient issues, attempt a single sign-in.
  // This covers: user created but session issuance failed.
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email: normalizedEmail, password }),
      20_000,
      "Connection timed out. The server may be busy - please try again."
    );
    if (!error && data?.user) return { error: null, user: data.user };
  } catch {
    // ignore
  }

  return {
    error: new Error("Signup is temporarily overloaded. Please wait 1 minute and try again."),
    user: null,
  };
}
