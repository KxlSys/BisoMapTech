/**
 * Utility functions for URL validation and sanitization to prevent DOM XSS via dangerous schemes
 * (e.g., javascript:, data:, vbscript:).
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "blob:"]);

/**
 * Checks whether a URL uses a safe protocol (http, https, or blob).
 */
export function isSafeUrl(urlStr: string | null | undefined): boolean {
  if (!urlStr) return false;
  try {
    const parsed = new URL(urlStr);
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL, returning a safe fallback if the URL uses an unsafe protocol or is invalid.
 */
export function sanitizeUrl(
  urlStr: string | null | undefined,
  fallback: string = "#"
): string {
  if (isSafeUrl(urlStr)) {
    return urlStr!;
  }
  return fallback;
}
