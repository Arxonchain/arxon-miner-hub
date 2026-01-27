import type { SupabaseClient, User } from "@supabase/supabase-js";

type SignUpResult = { error: Error | null; user: User | null };

function toError(e: unknown, fallback = "Sign up failed"): Error {
  if (e instanceof Error) return e;
  const maybeMsg = (e as any)?.message || (e as any)?.error_description || (e as any)?.error;
  if (typeof maybeMsg === "string" && maybeMsg.trim()) return new Error(maybeMsg);
  // As a last resort, include a compact JSON snapshot so we don't lose the real cause.
  // (Supabase sometimes returns non-Error objects with useful fields.)
  try {
    if (e && typeof e === "object") {
      const anyE = e as any;
      const snapshot = {
        name: anyE?.name,
        status: anyE?.status,
        code: anyE?.code,
        message: anyE?.message,
        error: anyE?.error,
        error_description: anyE?.error_description,
      };
      const str = JSON.stringify(snapshot);
      if (str && str !== "{}") return new Error(str);
    }
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
    m.includes("user already")
  );
}

/**
 * Simple, direct signup with extended timeout.
 * This is the most reliable approach when backend is under load.
 */
export async function signUpWithFallback(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<SignUpResult> {
  const normalizedEmail = email.trim().toLowerCase();

  // Use a promise with timeout that doesn't abort the actual request
  // This prevents the "stuck loading" issue while still allowing the signup to complete
  const timeoutMs = 60_000; // 60 seconds - allows for slow backend
  
  const signupPromise = supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
    },
  });

  try {
    // Create a timeout that rejects if signup takes too long
    const result = await Promise.race([
      signupPromise,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Connection timed out. Please try again."));
        }, timeoutMs);
      }),
    ]);

    if (result.error) {
      const err = toError(result.error, "Sign up failed");
      
      if (looksLikeExistingUser(err.message)) {
        return { error: new Error("This email is already registered. Try signing in instead."), user: null };
      }
      
      // Check for timeout-like errors from Supabase
      const msg = err.message.toLowerCase();
      if (msg.includes("timeout") || msg.includes("504") || msg.includes("context deadline")) {
        return { error: new Error("Server is busy. Please wait a moment and try again."), user: null };
      }

      // Common hard-block config errors
      if (msg.includes("signups not allowed") || msg.includes("signup is disabled") || msg.includes("disable_signup")) {
        return { error: new Error("Signups are currently disabled on the backend."), user: null };
      }
      
      return { error: err, user: null };
    }

    return { error: null, user: result.data?.user ?? null };
  } catch (e) {
    const err = toError(e, "Sign up failed");
    const msg = err.message.toLowerCase();
    
    // If our client-side timeout fired, try to sign in (user may have been created)
    if (msg.includes("timed out") || msg.includes("timeout")) {
      // Wait briefly, then try to sign in
      await new Promise((r) => setTimeout(r, 2000));
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        
        if (!error && data?.user) {
          return { error: null, user: data.user };
        }
      } catch {
        // Ignore sign-in errors
      }
      
      return { error: new Error("Connection timed out. Your account may have been created - try signing in."), user: null };
    }
    
    return { error: err, user: null };
  }
}
