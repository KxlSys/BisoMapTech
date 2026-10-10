# Sentinel Security Journal

## 2026-10-08 - Event-Loop Denial of Service in source-map-js

**Vulnerability:** A High-severity event-loop Denial of Service (DoS) vulnerability (GHSA-68fv-2mgg-jv7q / CVE-2024-53382) affected `source-map-js` versions 1.0.0 through 1.2.1. Specially crafted indexed source maps with malicious section offsets could lock the event loop during parsing.

**Learning:** `source-map-js` entered the dependency graph as a transitive build-time dependency via CSS and PostCSS tools (`tailwindcss` and `@tailwindcss/vite`). Even when dependencies are build-time only, vulnerable packages can stall CI/CD build processes or local development environments.

**Prevention:** Use package manager `overrides` in `package.json` to enforce patched transitive dependency versions (`source-map-js@^1.2.2`) when parent packages have not yet released updated lockfiles. Run `npm audit` in CI pipelines to catch transitive vulnerability regressions early.

## 2026-10-09 - DOM XSS via Unsanitized Dynamic External URLs

**Vulnerability:** Dynamic external URLs (e.g. `place.website`, `profile.github_url`, `repo.url`) rendered directly into `<a href="...">` or `window.open(...)` allowed potential DOM Cross-Site Scripting (XSS) if populated with `javascript:` or `data:` pseudo-protocols.

**Learning:** Relying solely on basic input validation at creation time is insufficient because stored database records, third-party imports, or API responses may bypass client-side checks. External URLs must always be validated and sanitized prior to rendering into interactive DOM attributes.

**Prevention:** Always use the native `URL` constructor to enforce allowed schemes (`http:` and `https:`) via a centralized helper like `getSafeUrl()` before binding URLs to `href` or passing them to navigation APIs.
