# Sentinel Security Journal

## 2026-10-08 - Event-Loop Denial of Service in source-map-js

**Vulnerability:** A High-severity event-loop Denial of Service (DoS) vulnerability (GHSA-68fv-2mgg-jv7q / CVE-2024-53382) affected `source-map-js` versions 1.0.0 through 1.2.1. Specially crafted indexed source maps with malicious section offsets could lock the event loop during parsing.

**Learning:** `source-map-js` entered the dependency graph as a transitive build-time dependency via CSS and PostCSS tools (`tailwindcss` and `@tailwindcss/vite`). Even when dependencies are build-time only, vulnerable packages can stall CI/CD build processes or local development environments.

**Prevention:** Use package manager `overrides` in `package.json` to enforce patched transitive dependency versions (`source-map-js@^1.2.2`) when parent packages have not yet released updated lockfiles. Run `npm audit` in CI pipelines to catch transitive vulnerability regressions early.

## 2026-10-18 - DOM Cross-Site Scripting (XSS) via Unvalidated Link Schemes

**Vulnerability:** User-contributed profile fields such as `github_url` and repository links (`repo.url`, `p.url`) were directly rendered into anchor `href` attributes without validating URL protocols. An attacker could craft a malicious URL payload (e.g., `javascript:alert(document.domain)`) stored in their profile or pinned projects, leading to DOM XSS when clicked by other users or recruiters.

**Learning:** URL validation schemas (e.g., `z.string().url()`) or loose Regex checks do not inherently restrict schemes to `http:` or `https:`, allowing dangerous pseudo-protocols like `javascript:`, `data:`, or `vbscript:` to bypass form validation.

**Prevention:** Always sanitize user-provided external links using a centralized URL validation utility (`isSafeUrl` / `sanitizeUrl`) that uses the native `URL` constructor to enforce an explicit allowlist of safe schemes (`http:`, `https:`, `blob:`). Fall back to `#` or `about:blank` for invalid or dangerous schemes when rendering anchor tags.
