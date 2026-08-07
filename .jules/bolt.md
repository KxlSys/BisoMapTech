
## 2026-08-07 - Memoizing Derived Lists in Large Forms
**Learning:** In large React forms with many independent state variables (like `OnboardingStepper`), inline array derivations (e.g., filtering a list of technologies) execute synchronously on every state update, leading to redundant O(N) operations and main-thread blocking during interactions.
**Action:** Always wrap derived lists (especially those involving `.filter()` or `.map()` on large arrays) in a `useMemo` hook to cache the result, ensuring re-evaluation only occurs when dependencies (like the search query) change.
