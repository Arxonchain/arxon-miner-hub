export type RecoveryUrlParams = {
  /** Supabase uses `type=recovery` for password reset flows */
  type: string;
  accessToken: string | null;
  refreshToken: string | null;
  /** PKCE code */
  code: string | null;
  /** Newer email template param */
  tokenHash: string | null;
  /** Older templates sometimes use `token=` */
  token: string | null;
  /** Older OTP flows sometimes include an email */
  email: string | null;
};

/**
 * Parse all possible recovery URL formats from Supabase:
 * 1. Hash fragment: #access_token=xxx&refresh_token=xxx&type=recovery
 * 2. Token hash: ?token_hash=xxx&type=recovery
 * 3. PKCE code: ?code=xxx
 * 4. Legacy token: ?token=xxx&type=recovery
 */
export function parseRecoveryUrl(): RecoveryUrlParams {
  const rawHash = window.location.hash || "";
  const hash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;

  const hashParams = new URLSearchParams(hash);
  const searchParams = new URLSearchParams(window.location.search);

  const type = (hashParams.get("type") || searchParams.get("type") || "").toLowerCase();

  return {
    type,
    accessToken: hashParams.get("access_token") || searchParams.get("access_token"),
    refreshToken: hashParams.get("refresh_token") || searchParams.get("refresh_token"),
    code: searchParams.get("code") || hashParams.get("code"),
    tokenHash: searchParams.get("token_hash") || hashParams.get("token_hash"),
    token: searchParams.get("token") || hashParams.get("token"),
    email: searchParams.get("email") || hashParams.get("email"),
  };
}

export function looksLikeRecoveryLink(params: RecoveryUrlParams) {
  return (
    params.type === "recovery" ||
    Boolean(params.code) ||
    Boolean(params.tokenHash) ||
    Boolean(params.token) ||
    Boolean(params.accessToken) ||
    Boolean(params.refreshToken)
  );
}
