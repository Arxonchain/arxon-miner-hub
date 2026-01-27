import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitResponse,
  RATE_LIMITS,
} from "../_shared/rateLimiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SignupBody = {
  email?: unknown;
  password?: unknown;
  // Optional: if the frontend later adds reCAPTCHA.
  token?: unknown;
};

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...headers,
      "Content-Type": "application/json",
    },
  });
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  ms: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "unknown")
    .split(",")[0]
    .trim();
  const rl = checkRateLimit(`auth-signup:${ip}`, RATE_LIMITS.auth);
  if (!rl.allowed) {
    return rateLimitResponse(rl, corsHeaders);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as SignupBody;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    console.log("auth-signup request", { email, ip });

    if (!email || !password) {
      return jsonResponse({ success: false, error: "Missing email or password" }, 400, rateLimitHeaders(rl));
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
      console.error("auth-signup misconfigured: missing required secrets");
      return jsonResponse({ success: false, error: "Server misconfigured" }, 500, rateLimitHeaders(rl));
    }

    // NOTE: no reCAPTCHA here (kept intentionally minimal/fast for reliability).

    // 1) Best-effort create user via Admin API (more resilient than /signup)
    // IMPORTANT: This must fail-fast. Even if creation times out, we still proceed
    // to the token step because the user may already exist (or creation may have
    // succeeded but the response was delayed).
    const adminUrl = `${SUPABASE_URL}/auth/v1/admin/users`;
    try {
      const createRes = await fetchWithTimeout(
        adminUrl,
        {
          method: "POST",
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            email_confirm: true,
          }),
        },
        20_000
      );

      const createBody = await createRes.text().catch(() => ""); // always consume

      if (!createRes.ok && createRes.status !== 422) {
        // Don't hard-fail here; token step might still succeed (existing account).
        console.error("auth-signup admin create failed", createRes.status, createBody);
      } else {
        console.log("auth-signup admin create result", {
          status: createRes.status,
          body: createBody?.slice?.(0, 500) ?? "",
        });
      }
    } catch (e) {
      console.error("auth-signup admin create timeout/error", String(e));
      // continue
    }

    // 2) Issue a session (client will setSession locally)
    const tokenUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const tryToken = async (ms: number) => {
      const tokenRes = await fetchWithTimeout(
        tokenUrl,
        {
          method: "POST",
          headers: {
            apikey: ANON_KEY,
            Authorization: `Bearer ${ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
        ms
      );

      // Always consume body exactly once (Deno resource safety)
      const raw = await tokenRes.text().catch(() => "");
      let tokenJson: any = null;
      try {
        tokenJson = raw ? JSON.parse(raw) : null;
      } catch {
        tokenJson = null;
      }

      return { tokenRes, tokenJson, raw };
    };

    try {
      // Token attempts (handles eventual consistency if user creation completes a moment later)
      const attempts = [
        { ms: 8_000, delayMs: 0 },
        { ms: 8_000, delayMs: 3000 },
        { ms: 8_000, delayMs: 3000 },
      ];

      let tokenRes: Response | null = null;
      let tokenJson: any = null;
      let tokenRaw = "";

      for (const attempt of attempts) {
        if (attempt.delayMs) await new Promise((r) => setTimeout(r, attempt.delayMs));
        ({ tokenRes, tokenJson, raw: tokenRaw } = await tryToken(attempt.ms));

        if (tokenRes.ok && tokenJson?.access_token && tokenJson?.refresh_token) {
          return jsonResponse({ success: true, session: tokenJson }, 200, rateLimitHeaders(rl));
        }

        // Only retry on invalid credentials; other errors break early.
        const retryable = tokenRes.status === 400 || tokenRes.status === 401;
        if (!retryable) break;
      }

      if (!tokenRes) {
        console.error("auth-signup token failed: no response");
        return jsonResponse(
          { success: false, error: "Server busy" },
          503,
          rateLimitHeaders(rl)
        );
      }

      {
        const status = tokenRes.status;
        const text = tokenJson ? JSON.stringify(tokenJson) : tokenRaw;
        console.error("auth-signup token failed", status, text);

        // Use 503 for transient backend issues so the client can show "server busy".
        const isTransient = status >= 500 || status === 429;
        return jsonResponse(
          { success: false, error: isTransient ? "Server busy" : "Invalid credentials" },
          isTransient ? 503 : 401,
          rateLimitHeaders(rl)
        );
      }
    } catch (e) {
      console.error("auth-signup token timeout/error", String(e));
      return jsonResponse(
        { success: false, error: "Server busy" },
        503,
        rateLimitHeaders(rl)
      );
    }
  } catch (e) {
    console.error("auth-signup unexpected error", e);
    return jsonResponse({ success: false, error: "Unexpected error" }, 500, rateLimitHeaders(rl));
  }
});
