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

function cleanJwt(input: string): string {
  return (input ?? "")
    .trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/^['"]+|['"]+$/g, "");
}

function jwtSegments(key: string): number {
  return key.split(".").filter(Boolean).length;
}

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

    const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").trim().replace(/\/$/, "");
    const anonCandidates = [
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "",
    ].map(cleanJwt);
    const ANON_KEY = anonCandidates.find((k) => jwtSegments(k) === 3) || anonCandidates[0] || "";

    const serviceCandidates = [Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""].map(cleanJwt);
    const SERVICE_ROLE_KEY =
      serviceCandidates.find((k) => jwtSegments(k) === 3) || serviceCandidates[0] || "";

    if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
      console.error("auth-signup misconfigured: missing required secrets");
      return jsonResponse(
        { success: false, error: "Server misconfigured" },
        500,
        rateLimitHeaders(rl)
      );
    }

    const anonSegs = jwtSegments(ANON_KEY);
    const serviceSegs = jwtSegments(SERVICE_ROLE_KEY);
    if (anonSegs !== 3 || serviceSegs !== 3) {
      console.error("auth-signup misconfigured: invalid jwt format", {
        anonSegs,
        serviceSegs,
      });
      return jsonResponse(
        { success: false, error: "Server misconfigured" },
        500,
        rateLimitHeaders(rl)
      );
    }

    // IMPORTANT:
    // /auth/v1/signup is timing out under load (it can trigger email workflows).
    // Use Admin API to create + auto-confirm quickly, then issue a session via password grant.
    const adminCreateUrl = `${SUPABASE_URL}/auth/v1/admin/users`;
    const adminRes = await fetch(adminCreateUrl, {
      method: "POST",
      headers: {
        // Gateway validates apikey as a JWT: use anon key.
        apikey: ANON_KEY,
        // Admin authorization must be service role.
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });

    const adminRaw = await adminRes.text().catch(() => "");
    let adminJson: any = null;
    try {
      adminJson = adminRaw ? JSON.parse(adminRaw) : null;
    } catch {
      adminJson = null;
    }

    console.log("auth-signup admin create result", {
      status: adminRes.status,
      snippet: adminRaw?.slice?.(0, 300) ?? "",
    });

    // Accept: created (200/201), already exists (422/409), or minor validation (400)
    // We'll try to exchange credentials for a session either way.
    if (!adminRes.ok && ![400, 409, 422].includes(adminRes.status)) {
      const isTransient = adminRes.status >= 500 || adminRes.status === 429;
      return jsonResponse(
        {
          success: false,
          error: isTransient
            ? "Server busy"
            : (adminJson?.msg || adminJson?.error || "Sign up failed"),
        },
        isTransient ? 503 : adminRes.status,
        rateLimitHeaders(rl)
      );
    }

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

    const isTransient = tokenRes.status >= 500 || tokenRes.status === 429;
    return jsonResponse(
      {
        success: false,
        error: isTransient
          ? "Server busy"
          : (tokenJson?.error_description || tokenJson?.error || "Sign up failed"),
      },
      isTransient ? 503 : tokenRes.status,
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
