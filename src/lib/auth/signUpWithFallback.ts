import type { SupabaseClient, User } from "@supabase/supabase-js";
import { withTimeout } from "@/lib/utils";

type SignUpResult = { error: Error | null; user: User | null };

type AuthSignupResponse =
  | { success: true; session: { access_token: string; refresh_token: string } }
  | { success: false; error?: string };

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

function safeMessage(e: unknown, fallback: string) {
  const msg = toError(e, fallback).message;
  return msg.length > 500 ? `${msg.slice(0, 500)}…` : msg;
}

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  ms: number
): Promise<{ status: number; ok: boolean; json: any; raw: string }> {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const raw = await res.text().catch(() => "");
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }
    return { status: res.status, ok: res.ok, json, raw };
  } finally {
    window.clearTimeout(id);
  }
}

/**
 * Calls the backend-assisted signup function via `fetch` so we can see the true HTTP status + body.
 * (supabase.functions.invoke() often hides the JSON body on non-2xx responses)
 */
async function backendAssistedSignup(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<SignUpResult> {
  const baseUrl = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
  if (!baseUrl || !anonKey) {
    return { error: new Error("App misconfigured: missing backend URL/key"), user: null };
  }

  const url = `${baseUrl}/functions/v1/auth-signup`;
  try {
    const { ok, status, json } = await fetchJsonWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      },
      60_000
    );

    const payload = (json ?? {}) as AuthSignupResponse;

    if (ok && (payload as any)?.success && (payload as any)?.session?.access_token && (payload as any)?.session?.refresh_token) {
      const { data: sessionData, error: setSessionError } = await withTimeout(
        supabase.auth.setSession({
          access_token: (payload as any).session.access_token,
          refresh_token: (payload as any).session.refresh_token,
        }),
        25_000,
        "Connection timed out. The server may be busy - please try again."
      );

      if (!setSessionError) {
        return { error: null, user: sessionData?.session?.user ?? null };
      }
    }

    const errText =
      (typeof (payload as any)?.error === "string" && (payload as any).error.trim())
        ? (payload as any).error
        : `Signup failed (${status})`;

    // Helpful message mapping
    if (status === 429) {
      return { error: new Error("Too many signup attempts. Please wait 1 minute and try again."), user: null };
    }

    return { error: new Error(errText), user: null };
  } catch (e) {
    const msg = safeMessage(e, "Sign up failed");
    // AbortError / fetch issues should be treated as transient.
    return { error: new Error(looksTransient(msg) ? "Connection timed out. The server may be busy - please try again." : msg), user: null };
  }
}

/**
 * Signup strategy:
 * 1) Try direct signup first (most reliable when backend is healthy)
 * 2) If that times out / hits 5xx, fall back to backend-assisted signup (bypasses /signup)
 */
export async function signUpWithFallback(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<SignUpResult> {
  const normalizedEmail = email.trim().toLowerCase();

  // Attempt A: direct signup (longer timeout for real-world load)
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

    if (error) {
      const err = toError(error, "Sign up failed");
      if (looksLikeExistingUser(err.message)) {
        return { error: new Error("This email is already registered. Try signing in instead."), user: null };
      }

      // If it looks transient, fall through to backend-assisted attempt.
      if (!looksTransient(err.message)) {
        return { error: err, user: null };
      }
    } else {
      // Even if session is null (email confirmation setups), user creation succeeded.
      return { error: null, user: data?.user ?? null };
    }
  } catch (e) {
    const msg = safeMessage(e, "Sign up failed");
    if (!looksTransient(msg)) {
      return { error: new Error(msg), user: null };
    }
  }

  // Attempt B: backend-assisted signup (bypasses /signup)
  const assisted = await backendAssistedSignup(supabase, normalizedEmail, password);
  if (!assisted.error) return assisted;

  // Final: If account may have been created but session failed, try a single sign-in.
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email: normalizedEmail, password }),
      25_000,
      "Connection timed out. The server may be busy - please try again."
    );
    if (!error && data?.user) return { error: null, user: data.user };
  } catch {
    // ignore
  }

  // Do NOT mask the real failure anymore; return the most informative error.
  return assisted;
}
