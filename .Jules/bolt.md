## 2024-03-24 - Missing Memoization on Array Slicing causing unnecessary re-renders
**Learning:** Returning a sliced array (e.g., `array.slice(0, 50)`) inside a React component's body creates a new reference on every render. Even though the contents are the same, this causes pure child components (`React.memo`) that depend on it to re-render, especially noticeable when unrelated local state changes occur (like a mobile view toggle).
**Action:** Always wrap array derivations (like `.slice()`, `.filter()`, `.map()`) that are passed as props to child components in a `useMemo` hook to preserve referential equality and avoid unnecessary main-thread work.

## 2025-02-09 - Manual Loops for Array Intersections
**Learning:** Using chained array methods like `.filter(...).length` inside heavy O(N) loops (like `calculateMatches`) causes significant memory allocations and garbage collection overhead.
**Action:** Replace `.filter(...).length` with a manual `for` loop and a counter variable to prevent intermediate array allocations in performance-critical code paths.
