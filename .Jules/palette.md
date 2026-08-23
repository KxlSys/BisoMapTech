## 2024-08-23 - Adding accessibility to custom accordion filter panels
**Learning:** Custom collapsible filter panels using simple div/button combos need explicit accessibility attributes (aria-expanded and aria-controls) to communicate their state and related content to screen readers.
**Action:** Always include `aria-expanded={isOpen}` and `aria-controls="[content-id]"` on the toggle button, and map the corresponding `id` to the content container for any custom accordion-like structures.
