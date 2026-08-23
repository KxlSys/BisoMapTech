## 2026-08-18 - [Accessible Custom Accordions]
**Learning:** Custom accordions (like filter panels) require specific ARIA attributes for screen readers to understand their state and relationship. Specifically, aria-expanded on the trigger and aria-controls linking to the content ID.
**Action:** For custom accordion or collapsible filter panels, always include aria-expanded={isOpen} and aria-controls="[content-id]" on the toggle button, and map the corresponding id to the content container to ensure proper screen reader accessibility.
