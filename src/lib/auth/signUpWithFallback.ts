import type { SupabaseClient, User } from "@supabase/supabase-js";

type SignUpResult = { error: Error | null; user: User | null };

/**
 * BULLETPROOF SIGNUP - Direct Supabase Auth with extended timeout
 * This is the simplest, most reliable approach that works even when
 * edge functions or backend services are slow/down.
 */
export async function signUpWithFallback(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<SignUpResult> {
  const normalizedEmail = email.trim().toLowerCase();
  
  // Create a simple timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Connection timed out. Please check your internet and try again."));
    }, 60000); // 60 second timeout for maximum reliability
  });

  try {
    // Race the signup against the timeout
    const result = await Promise.race([
      supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      }),
      timeoutPromise,
    ]);

    const { data, error } = result as { data: any; error: any };

    if (error) {
      const msg = error.message?.toLowerCase() || "";
      
      // Check for "already registered" - this means user exists
      if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
        return { error: new Error("This email is already registered. Try signing in instead."), user: null };
      }
      
      return { error: new Error(error.message || "Sign up failed"), user: null };
    }

    // Check if user was created (auto-confirm is enabled)
    if (data?.user) {
      return { error: null, user: data.user };
    }

    // If session exists but no user object, extract from session
    if (data?.session?.user) {
      return { error: null, user: data.session.user };
    }

    // If we got here without error but no user, something unexpected happened
    return { error: new Error("Sign up completed but no user returned. Please try signing in."), user: null };
  } catch (e) {
    const err = e instanceof Error ? e : new Error("Sign up failed");
    return { error: err, user: null };
  }
}
