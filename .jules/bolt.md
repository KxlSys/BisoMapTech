## 2024-05-24 - [Avoid inner loop Set instantiation]
**Learning:** Instantiating a `Set` for every item in an outer loop (e.g., iterating through N projects and mapping their tech stacks) incurs O(N*M) garbage collection and allocation overhead.
**Action:** Lift static array conversions (e.g. converting a user's tech stack to a `Set` of lowercase strings) outside the main iteration loop. Consolidate operations like `.map().filter()` inside the loop into a single optimized pass.
