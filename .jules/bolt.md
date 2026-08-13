## 2025-02-14 - Redundant string operations inside .filter()
**Learning:** Found a case where `searchQuery.toLowerCase()` was being repeatedly called inside a `.filter()` callback in a `useMemo` hook that iterated over the entire user profile array, causing redundant string allocations.
**Action:** Always hoist invariant string operations like `.toLowerCase()` out of `.filter()` callbacks, and return the original array reference rather than a new filtered copy when the filter criteria are empty (e.g. `!searchQuery`).
