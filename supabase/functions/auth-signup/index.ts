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

    // 1) Create user via Admin API (more resilient than /signup)
    const adminUrl = `${SUPABASE_URL}/auth/v1/admin/users`;
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
      10_000
    );

    if (!createRes.ok && createRes.status !== 422) {
      const text = await createRes.text().catch(() => "");
      console.error("auth-signup admin create failed", createRes.status, text);
      return jsonResponse(
        { success: false, error: "Unable to create account" },
        502,
        rateLimitHeaders(rl)
      );
    }
    // Note: 422 typically means the email already exists; we still proceed to sign-in.
    await createRes.text().catch(() => ""); // consume

    // 2) Issue a session (client will setSession locally)
    const tokenUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
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
      10_000
    );

    const tokenJson = await tokenRes.json().catch(() => null);
    if (!tokenRes.ok || !tokenJson?.access_token || !tokenJson?.refresh_token) {
      const text = tokenJson ? JSON.stringify(tokenJson) : await tokenRes.text().catch(() => "");
      console.error("auth-signup token failed", tokenRes.status, text);
      return jsonResponse(
        { success: false, error: "Invalid credentials" },
        401,
        rateLimitHeaders(rl)
      );
    }

    return jsonResponse({ success: true, session: tokenJson }, 200, rateLimitHeaders(rl));
  } catch (e) {
    console.error("auth-signup unexpected error", e);
    return jsonResponse({ success: false, error: "Unexpected error" }, 500, rateLimitHeaders(rl));
  }
});
