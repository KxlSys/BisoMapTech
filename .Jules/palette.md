## 2024-08-15 - Accessible Accordions
**Learning:** In custom, hand-coded accordion-style filter panels, it's easy to forget standard ARIA attributes (`aria-expanded` and `aria-controls`) because they visually function fine without them. Screen readers need these to announce the state of collapsible content.
**Action:** Always verify `aria-expanded` and `aria-controls` on custom collapsible filter toggles.
