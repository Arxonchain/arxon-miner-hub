import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitResponse,
  RATE_LIMITS,
} from "../_shared/rateLimiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SignupBody = {
  email?: unknown;
  password?: unknown;
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
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    console.log("auth-signup request", { email, ip });

    if (!email || !password) {
      return jsonResponse(
        { success: false, error: "Missing email or password" },
        400,
        rateLimitHeaders(rl)
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const ANON_KEY =
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
      "";

    if (!SUPABASE_URL || !ANON_KEY) {
      console.error("auth-signup misconfigured: missing required secrets");
      return jsonResponse(
        { success: false, error: "Server misconfigured" },
        500,
        rateLimitHeaders(rl)
      );
    }

    // Use the standard /signup endpoint (no abort timeout — just let fetch run)
    const signupUrl = `${SUPABASE_URL}/auth/v1/signup`;

    const signupRes = await fetch(signupUrl, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const raw = await signupRes.text().catch(() => "");
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }

    console.log("auth-signup /signup result", {
      status: signupRes.status,
      snippet: raw?.slice?.(0, 300) ?? "",
    });

    // If signup returned a session directly, we're done
    if (signupRes.ok && json?.access_token && json?.refresh_token) {
      return jsonResponse(
        { success: true, session: json },
        200,
        rateLimitHeaders(rl)
      );
    }

    // If email already exists (422) or signup OK without session, try token
    if (
      signupRes.ok ||
      signupRes.status === 422 ||
      signupRes.status === 400
    ) {
      const tokenUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const tokenRaw = await tokenRes.text().catch(() => "");
      let tokenJson: any = null;
      try {
        tokenJson = tokenRaw ? JSON.parse(tokenRaw) : null;
      } catch {
        tokenJson = null;
      }

      if (tokenRes.ok && tokenJson?.access_token && tokenJson?.refresh_token) {
        return jsonResponse(
          { success: true, session: tokenJson },
          200,
          rateLimitHeaders(rl)
        );
      }

      console.error("auth-signup token failed", {
        status: tokenRes.status,
        snippet: tokenRaw?.slice?.(0, 300) ?? "",
      });
    }

    // Something went wrong
    const isTransient = signupRes.status >= 500 || signupRes.status === 429;
    return jsonResponse(
      { success: false, error: isTransient ? "Server busy" : "Sign up failed" },
      isTransient ? 503 : signupRes.status,
      rateLimitHeaders(rl)
    );
  } catch (e) {
    console.error("auth-signup unexpected error", e);
    return jsonResponse(
      { success: false, error: "Server busy" },
      503,
      rateLimitHeaders(rl)
    );
  }
});
