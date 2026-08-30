## 2026-08-19 - [Hoisting string conversions outside loops in array processing]
**Learning:** Hoisting invariant properties outside large iterative array loops (such as `currentUser.city?.toLowerCase()`) and replacing higher-level array methods like `.filter(...).length` with a manual loop and counter when determining overlaps (like tech stack matching) significantly reduces memory allocation and garbage collection overhead in hot path matching algorithms.
**Action:** When implementing high-frequency matching/filtering algorithms on large candidate arrays, aggressively hoist invariant transformations (like object lookups and `.toLowerCase()`) out of the loop and prefer manual iterating counters over chainable array methods for simple intersection checks.

## 2026-08-30 - [Convert O(N) array search inside double loop to O(1) Map lookup]
**Learning:** Using `.find()` inside nested loops to find an object based on multiple properties (`week` and `day`) causes an O(N^2) time complexity during render, leading to unnecessary re-renders. A better approach is to pre-compute a lookup `Map` with string keys or map it to a 2D array, ensuring O(1) performance and maintaining safety regardless of array order or sparsity.
**Action:** Always pre-compute a lookup map or structure outside nested loops when matching items by properties, rather than relying on index assumptions or `.find()`.
