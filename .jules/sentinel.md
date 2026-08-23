## 2025-02-14 - Fix Client-Side XSS in User-Controlled URLs
**Vulnerability:** Clickable links generated from third-party APIs (LinkPreview) and user attachments (AttachmentRenderer) failed to sanitize URL protocols.
**Learning:** Checking for `http(s)` using regex in one part of the code does not protect other dynamic variables containing URLs. Using `json.data.url` or `attachment_url` directly in `window.open` or `href` attributes exposes the application to `javascript:` based client-side XSS.
**Prevention:** Implement a universal `isSafeUrl` check utilizing the native Web API `URL()` constructor to strictly enforce `http:`, `https:`, or `blob:` protocols before rendering dynamic links. Do not rely solely on simple regex logic.
