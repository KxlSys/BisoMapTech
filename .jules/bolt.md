## 2026-08-23 - Duplicate declarations in optimizations
**Learning:** The previous optimizations accidentally introduced duplicate declarations for variables like `currentUserCityLower`, `citySet`, `collaboratingCount`, `collab`, `activeLastWeek`, `weekAgo`, etc, during merging.
**Action:** Verify that variables aren't re-declared when consolidating code, and ensure missing references like `complementary` and `currentUserLevel` are correctly calculated or imported after removing old logic.
