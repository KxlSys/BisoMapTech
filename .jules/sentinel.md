# Sentinel Security Journal

## 2026-10-08 - Event-Loop Denial of Service in source-map-js

**Vulnerability:** A High-severity event-loop Denial of Service (DoS) vulnerability (GHSA-68fv-2mgg-jv7q / CVE-2024-53382) affected `source-map-js` versions 1.0.0 through 1.2.1. Specially crafted indexed source maps with malicious section offsets could lock the event loop during parsing.

**Learning:** `source-map-js` entered the dependency graph as a transitive build-time dependency via CSS and PostCSS tools (`tailwindcss` and `@tailwindcss/vite`). Even when dependencies are build-time only, vulnerable packages can stall CI/CD build processes or local development environments.

**Prevention:** Use package manager `overrides` in `package.json` to enforce patched transitive dependency versions (`source-map-js@^1.2.2`) when parent packages have not yet released updated lockfiles. Run `npm audit` in CI pipelines to catch transitive vulnerability regressions early.

## 2026-10-18 - DOM Cross-Site Scripting (XSS) via Unvalidated Link Schemes

**Vulnerability:** User-contributed profile fields such as `github_url` and repository links (`repo.url`, `p.url`) were directly rendered into anchor `href` attributes without validating URL protocols. An attacker could craft a malicious URL payload (e.g., `javascript:alert(document.domain)`) stored in their profile or pinned projects, leading to DOM XSS when clicked by other users or recruiters.

**Learning:** URL validation schemas (e.g., `z.string().url()`) or loose Regex checks do not inherently restrict schemes to `http:` or `https:`, allowing dangerous pseudo-protocols like `javascript:`, `data:`, or `vbscript:` to bypass form validation.

**Prevention:** Always sanitize user-provided external links using a centralized URL validation utility (`isSafeUrl` / `sanitizeUrl`) that uses the native `URL` constructor to enforce an explicit allowlist of safe schemes (`http:`, `https:`, `blob:`). Fall back to `#` or `about:blank` for invalid or dangerous schemes when rendering anchor tags.

## 2026-11-02 - Unchecked Blob/URL Execution in Attachment Click Handlers

**Vulnerability:** Attachment image click handlers opened object/blob URLs using `window.open(decryptedUrl)` without checking the URL scheme. If `decryptedUrl` or message metadata were manipulated or contained an untrusted protocol, it could lead to arbitrary script execution or window navigation.

**Learning:** Event handlers opening new windows via `window.open` on dynamic URL strings must validate the target scheme with `isSafeUrl` and set security options (`noopener,noreferrer`) just like standard anchor tags.

**Prevention:** Always wrap `window.open` calls with `isSafeUrl` checks to restrict window navigation strictly to `http:`, `https:`, or `blob:` protocols.

## 2026-11-18 - Undeletable Invalid URL States & Unchecked Error Fallbacks

**Vulnerability:** In profile editing, dropping repository rows whose `url` failed `getSafeUrl` validation hid invalid or malformed projects from the user's management interface, creating an un-deletable database row. In messaging link previews, error fallbacks constructed preview cards without validating URL protocols.

**Learning:** Filtering out invalid user data during render rather than sanitizing its href prevents users from managing or deleting their own content. Error fallbacks in async fetchers (like Microlink API) must enforce URL scheme checks before assigning state that triggers `window.open`.

**Prevention:** Render user-managed data items using `sanitizeUrl` for safe href fallback so invalid URLs remain visible and deletable by the owner. Ensure all catch/fallback paths in preview helpers explicitly validate URL schemes with `isSafeUrl`.

## 2026-12-05 - CSS/HTML Injection via Unsanitized Inline Style Component Properties

**Vulnerability:** The `ChartStyle` component in `src/components/ui/chart.tsx` generated inline `<style>` tags using `dangerouslySetInnerHTML` by directly string-interpolating `id`, chart `key`, and CSS `color` properties without sanitization. An attacker supplying crafted configuration identifiers or color values could break out of CSS declaration blocks (`}; ...`) or HTML tags (`</style><script>...`) leading to CSS injection or DOM XSS.

**Learning:** Generating dynamic `<style>` strings with `dangerouslySetInnerHTML` bypasses React's automatic HTML escaping, exposing raw string parameters directly to the DOM parser.

**Prevention:** Always sanitize dynamic identifiers (restricting to `[a-zA-Z0-9_-]`) and value properties (stripping `<`, `>`, `{`, `}`, `;`, `"`, `'`, `\`, `/`, `*`, `@`) before interpolating them into inline style tags.
