## 2026-08-16 - Filter Panel Collapsible ARIA attributes
**Learning:** Custom collapsible panels in filter components (like the Role, Experience Level, and Location filters) initially missed vital accessibility attributes linking the toggle button to its content.
**Action:** Always include `aria-expanded={isOpen}` and `aria-controls="[content-id]"` on the toggle button, and map the corresponding `id` to the content container to ensure proper screen reader support for accordion-style components.
