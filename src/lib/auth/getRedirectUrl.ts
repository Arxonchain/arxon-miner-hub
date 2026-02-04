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
 * Points directly to /reset-password - Supabase will append the recovery tokens.
 */
export function getPasswordResetRedirectUrl(): string {
  // Direct to reset-password page - Supabase appends tokens as hash or query params
  return getAuthRedirectUrl("/reset-password");
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
