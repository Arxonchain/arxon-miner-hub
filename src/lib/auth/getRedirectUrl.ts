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
  return getAuthRedirectUrl("/reset-password");
}

/**
 * Returns the email confirmation redirect URL
 */
export function getEmailConfirmRedirectUrl(): string {
  return getAuthRedirectUrl("/auth/confirm?next=/");
}
