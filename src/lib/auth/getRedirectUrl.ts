/**
 * Returns the appropriate redirect URL for auth callbacks.
 * Handles custom domains (arxonchain.xyz) and all deployment environments.
 */
export function getAuthRedirectUrl(path = "/"): string {
  const origin = window.location.origin;
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${origin}${normalizedPath}`;
}

/**
 * Returns the password reset redirect URL
 */
export function getPasswordResetRedirectUrl(): string {
  // Route through /auth/confirm so we can handle all callback formats (PKCE code, token_hash, hash access_token)
  // and then forward into the reset-password page.
  return getAuthRedirectUrl("/auth/confirm?type=recovery&next=/reset-password");
}

/**
 * Returns the email confirmation redirect URL
 */
export function getEmailConfirmRedirectUrl(): string {
  return getAuthRedirectUrl("/auth/confirm?next=/");
}
