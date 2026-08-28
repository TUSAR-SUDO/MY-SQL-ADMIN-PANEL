/**
 * Public API base URL.
 *
 * Previously this was a build-time env var (VITE_PUBLIC_API_BASE).
 * Now it's fetched from the Settings collection in MongoDB via
 * /api/public-settings, so you can change it from the admin panel
 * without rebuilding.
 *
 * Fallback: the old env var, then same-origin.
 */
let cachedBase = null;

export const getPublicApiBase = async () => {
  if (cachedBase) return cachedBase;
  try {
    const res = await fetch('/api/public-settings');
    const data = await res.json();
    if (data.publicApiBase) {
      cachedBase = data.publicApiBase;
    }
  } catch {
    // ignore
  }
  if (!cachedBase) {
    cachedBase =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_API_BASE) ||
      window.location.origin;
  }
  return cachedBase;
};

// Synchronous version for render-time usage (returns cached or env var)
export const PUBLIC_API_BASE =
  cachedBase ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_API_BASE) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

export const sessionUrl = (slug) => `${PUBLIC_API_BASE}/api/public/projects/${slug}/session`;
