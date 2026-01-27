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

function isTransientSignupError(msg: string) {
  const m = msg.toLowerCase();
  return (
    m.includes("server misconfigured") ||
    m.includes("server busy") ||
    m.includes("timeout") ||
    m.includes("timed out") ||
    m.includes("failed to fetch") ||
    m.includes("504") ||
    m.includes("503") ||
    m.includes("502") ||
    m.includes("context deadline exceeded") ||
    m.includes("request_timeout") ||
    m.includes("processing this request timed out") ||
    // Supabase client error when the functions endpoint can't be reached
    m.includes("failed to send a request to the edge function") ||
    m.includes("edge function") ||
    m.includes("functions/v1")
  );
}

export async function signUpWithFallback(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<SignUpResult> {
  const normalizedEmail = email.trim().toLowerCase();

  // Try fast backend-assisted signup first (if available).
  try {
    const { data: fnData, error: fnError } = await withTimeout(
      supabase.functions.invoke("auth-signup", {
        body: { email: normalizedEmail, password },
      }),
      15_000,
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
        15_000,
        "Connection timed out. The server may be busy - please try again."
      );

      if (setSessionError) {
        // If we can't start a session, fall back to browser signup.
        // (This also covers cases where the backend created the user but token exchange failed.)
        // Continue to fallback below.
      } else {
        return { error: null, user: sessionData?.session?.user ?? null };
      }
    }

    // If the backend returns a non-transient business error (e.g. validation), surface it.
    if (fnError || (fnData as any)?.error) {
      const err = toError(fnError ?? (fnData as any)?.error, "Sign up failed");
      if (!isTransientSignupError(err.message)) {
        return { error: err, user: null };
      }
      // transient -> fallback
    }
  } catch (e) {
    const err = toError(e, "Sign up failed");
    if (!isTransientSignupError(err.message)) {
      // unexpected but non-transient -> surface
      return { error: err, user: null };
    }
    // transient -> fallback
  }

  // Fallback: browser signup (can keep connection open longer than the backend function).
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      }),
      60_000,
      "Connection timed out. The server may be busy - please try again."
    );

    if (error) return { error: toError(error, "Sign up failed"), user: null };
    return { error: null, user: data?.user ?? null };
  } catch (e) {
    return { error: toError(e, "Sign up failed"), user: null };
  }
}
