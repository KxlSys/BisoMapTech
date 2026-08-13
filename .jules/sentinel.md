
## 2024-05-18 - Prevent XSS in message link rendering
**Vulnerability:** User-provided URLs matching a basic HTTP regex in chat messages were directly rendered as anchor tags `href` without scheme validation, allowing `javascript:` URIs (e.g. `javascript://https://example.com`) to execute code on click.
**Learning:** Naive Regex matching for `http://` or `https://` is insufficient because an attacker can embed that string within a `javascript:` payload to bypass the check.
**Prevention:** Always use the native browser `URL` constructor to reliably parse and strictly validate the `protocol` attribute (e.g., ensuring it is `http:` or `https:`) before trusting user input in `href` properties.
