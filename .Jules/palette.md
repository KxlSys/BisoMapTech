## 2024-08-21 - Accessible Custom Collapsible Panels
**Learning:** Custom accordion or collapsible filter panels built with native `<button>` and conditionally rendered contents often omit crucial ARIA markup, resulting in a poor screen reader experience where users cannot determine the open/close state or map the trigger to the content.
**Action:** Always include `aria-expanded={isOpen}` and `aria-controls="[content-id]"` on the toggle button, and map the corresponding `id` to the content container to ensure proper screen reader accessibility.

## 2024-05-18 - Avoid overriding inner content with aria-label
**Learning:** Applying an `aria-label` to an interactive element (like a button) that already contains rich textual content will completely override the screen reader's reading of that inner content. The screen reader will only announce the `aria-label` and skip everything else inside the button.
**Action:** When a button or link has meaningful inner text, either ensure the `aria-label` completely summarizes the required context, or alternatively use `aria-labelledby` or visually hidden (`sr-only`) text elements within the button to provide supplementary context without obscuring the existing content.
