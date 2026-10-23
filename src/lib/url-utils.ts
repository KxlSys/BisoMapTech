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
  // Remove ASCII control characters (0x00-0x1F, 0x7F) and whitespace that browsers might strip or ignore
  const sanitized = urlStr.replace(/[\x00-\x1F\x7F]/g, "").trim();
  if (!sanitized) return false;
  try {
    const parsed = new URL(sanitized);
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

/**
 * Checks whether a path is a safe internal relative redirect path (e.g. "/matching?vue=projets").
 * Prevents Open Redirect vulnerabilities by rejecting absolute URLs (http/https), protocol-relative URLs (//),
 * Windows slashes (/\\), and dangerous schemes (javascript:, data:).
 */
export function isSafeInternalRedirect(path: string | null | undefined): boolean {
  if (!path) return false;
  const sanitized = path.replace(/[\x00-\x1F\x7F]/g, "").trim();
  if (!sanitized) return false;

  if (!sanitized.startsWith("/") || sanitized.startsWith("//") || sanitized.startsWith("/\\")) {
    return false;
  }

  try {
    const url = new URL(sanitized, "http://localhost");
    if (url.origin !== "http://localhost") return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes an internal redirect path, returning fallback (default "/") if unsafe or invalid.
 */
export function sanitizeInternalRedirect(
  path: string | null | undefined,
  fallback: string = "/"
): string {
  if (isSafeInternalRedirect(path)) {
    return path!.replace(/[\x00-\x1F\x7F]/g, "").trim();
  }
  return fallback;
}
