export type CacheEnvelope<T> = {
  v: 1;
  savedAt: number;
  data: T;
};

export const cacheSet = <T>(key: string, data: T) => {
  try {
    const payload: CacheEnvelope<T> = { v: 1, savedAt: Date.now(), data };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
};

export const cacheGet = <T>(
  key: string,
  opts?: { maxAgeMs?: number }
): { data: T; savedAt: number } | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || parsed.v !== 1 || !parsed.savedAt) return null;

    if (opts?.maxAgeMs && Date.now() - parsed.savedAt > opts.maxAgeMs) {
      return null;
    }

    return { data: parsed.data, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
};
