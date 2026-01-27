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

  // DIRECT SIGNUP: Use Supabase Auth directly for maximum reliability.
  // The edge function approach was causing timeouts on production.
  // This approach is more resilient and works even when edge functions are down.
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      }),
      45_000, // 45 second timeout - auth can be slow under load
      "Connection timed out. The server may be busy - please try again."
    );

    if (error) {
      return { error: toError(error, "Sign up failed"), user: null };
    }

    // Check if user was created (auto-confirm is enabled)
    if (data?.user) {
      return { error: null, user: data.user };
    }

    // If we got here without error but no user, something unexpected happened
    return { error: new Error("Sign up completed but no user returned"), user: null };
  } catch (e) {
    const err = toError(e, "Sign up failed");
    
    // For transient errors, provide a clearer message
    if (isTransientSignupError(err.message)) {
      return { 
        error: new Error("Connection timed out. Please check your internet and try again."), 
        user: null 
      };
    }
    
    return { error: err, user: null };
  }
}
