## 2024-05-XX - Remove redundant data fetching debounces
**Learning:** Using a debounced input component alongside a debounced data-fetching `useEffect` causes "double debouncing," unnecessarily increasing latency for text search and artificially delaying fast inputs (like dropdown selections).
**Action:** When an input component is already debouncing state changes, data-fetching effects should react immediately without additional `setTimeout` wrappers.
