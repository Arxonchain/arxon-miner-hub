/**
 * Clears local auth artifacts that can cause recovery/session establishment to fail.
 *
 * Note: We only touch keys that look like they belong to the auth client.
 */
export function clearSupabaseAuthStorage() {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Supabase keys typically start with sb-<project-ref>
      // Some environments include "supabase" in the key.
      if (key.startsWith("sb-") || key.includes("supabase")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore storage access errors (private mode / restricted environments)
  }
}
