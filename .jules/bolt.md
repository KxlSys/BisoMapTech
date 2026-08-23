## 2025-02-09 - Manual Loops for Array Intersections
**Learning:** Using chained array methods like `.filter(...).length` inside heavy O(N) loops (like `calculateMatches`) causes significant memory allocations and garbage collection overhead.
**Action:** Replace `.filter(...).length` with a manual `for` loop and a counter variable to prevent intermediate array allocations in performance-critical code paths.
