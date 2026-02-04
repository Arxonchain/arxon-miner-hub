/**
 * Returns the appropriate redirect URL for auth callbacks.
 * Uses window.location.origin to work with any domain (custom or Lovable).
 */
export function getAuthRedirectUrl(path = "/"): string {
  const origin = window.location.origin;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

/**
 * Returns the password reset redirect URL.
 * IMPORTANT: Route through /auth/confirm so we can reliably exchange PKCE codes,
 * token_hash links, and legacy OTP tokens before showing /reset-password.
 */
export function getPasswordResetRedirectUrl(): string {
  // Supabase appends tokens (code/token_hash/token/etc). AuthConfirm turns those into a session.
  return getAuthRedirectUrl("/auth/confirm?next=/reset-password");
}

/**
 * Returns the email confirmation redirect URL
 */
export function getEmailConfirmRedirectUrl(): string {
  return getAuthRedirectUrl("/auth/confirm?next=/");
}

/**
 * Returns the magic-link redirect URL for password change flow.
 * The user clicks a magic link → lands on /auth/confirm → goes to /change-password
 */
export function getMagicLinkRedirectUrl(): string {
  return getAuthRedirectUrl("/auth/confirm?next=/change-password");
}
