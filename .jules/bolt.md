## 2024-06-02 - Debounce Inputs & Memoization Patterns
**Learning:** For extensive list renderings or heavily loaded map pages (like `PlacesPage`), binding search inputs directly to a state that triggers fetch or re-renders the root component blocks the main thread. While `filter-panel.tsx` successfully implemented a local debounced state, this pattern was inconsistently applied.
**Action:** When working on complex React views with heavy children or lists, always decouple fast-changing input state (`localSearch`) from the expensive render-triggering state (`searchQuery` or `search`). Additionally, extract large repetitive map items (`displayedPlaces.map(...)`) into `React.memo` components with `useCallback` for their event handlers.

## 2024-06-03 - Leaflet Marker Icon Updates
**Learning:** In Leaflet, redefining all markers completely when only a single marker's focus state changes can be expensive and cause slight UI flickering. Using `marker.setIcon()` avoids recreating marker nodes.
**Action:** Track `focusedPlaceId` changes via a ref, grab the previously focused marker to reset its icon, and then set the new focused marker's icon.

## 2024-06-05 - Onboarding Tech Search Debouncing
**Learning:** In the onboarding stepper, the tech search input filtered a large list (`TECH_OPTIONS`) synchronously on every keystroke, causing the root component to re-render and producing noticeable UI lag.
**Action:** Decouple the fast-changing input state (`localTechSearch`) from the expensive render-triggering state (`techSearch`) and use a standard `useEffect` debounce pattern (300ms) to synchronize the two.

## 2026-06-20 - AdminPage Re-render Optimization
**Learning:** In the `AdminPage` component, local input state was manually debounced causing the large root component to re-render on every keystroke. This anti-pattern can cause measurable input latency on lower-end devices for complex pages.
**Action:** Use the `DebouncedInput` component for search fields in heavy pages to isolate the fast-changing state and avoid unnecessary full-page renders.

## 2024-06-25 - DebouncedInput Component Memoization
**Learning:** The `DebouncedInput` component was used in several places to prevent excessive parent re-renders while typing. However, because `DebouncedInput` itself was not wrapped in `React.memo()`, it was still re-rendering unnecessarily whenever its parent components re-rendered for reasons unrelated to the input (e.g. other form fields changing, complex page state updates). This unnecessary re-rendering could destroy and recreate its internal debouncing logic and cause extra reconciliation work.
**Action:** When creating utility wrapper components designed to optimize performance (like `DebouncedInput`), ensure the component itself is memoized with `React.memo()` so it fully shields itself from irrelevant parent state updates.

## 2024-07-10 - O(n) Single Pass Data Aggregation
**Learning:** Using chained array methods (e.g. `.map().filter()`, `.flatMap()`, and repeated `.filter()` over the same large list like `profiles`) leads to redundant O(n) passes over data and allocates unnecessary intermediate arrays. This blocks the main thread longer than necessary when calculating basic statistics like `uniqueCities`, `uniqueTechs`, or total counts.
**Action:** Consolidate statistical aggregations over large object arrays into a single O(n) `for` loop that updates multiple accumulators (like `Set` objects and primitive counters) in one pass, thereby improving performance and reducing memory overhead.

## 2024-07-18 - Component Map Memoization Pattern
**Learning:** In React components with highly interactive state (like buttons triggering local state changes such as `visibleCount`), mapping over raw datasets to create derived UI objects outside of a `useMemo` block leads to unnecessary O(N) object allocations and garbage collection on every render.
**Action:** When a component derives lists from props or state for rendering, wrap the mapping or filtering logic inside `useMemo` to cache the result, recalculating only when the underlying data changes, thereby freeing up the main thread from redundant object allocations.
