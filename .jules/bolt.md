## 2024-06-02 - Debounce Inputs & Memoization Patterns
**Learning:** For extensive list renderings or heavily loaded map pages (like `PlacesPage`), binding search inputs directly to a state that triggers fetch or re-renders the root component blocks the main thread. While `filter-panel.tsx` successfully implemented a local debounced state, this pattern was inconsistently applied.
**Action:** When working on complex React views with heavy children or lists, always decouple fast-changing input state (`localSearch`) from the expensive render-triggering state (`searchQuery` or `search`). Additionally, extract large repetitive map items (`displayedPlaces.map(...)`) into `React.memo` components with `useCallback` for their event handlers.

## 2024-06-03 - Leaflet Marker Icon Updates
**Learning:** In Leaflet, redefining all markers completely when only a single marker's focus state changes can be expensive and cause slight UI flickering. Using `marker.setIcon()` avoids recreating marker nodes.
**Action:** Track `focusedPlaceId` changes via a ref, grab the previously focused marker to reset its icon, and then set the new focused marker's icon.
## 2026-06-14 - Isolated search input state to prevent full page re-renders
**Learning:** Found that linking a search input directly to a debounced `useState` in a parent component (like `ContributorsPage`, `PlacesPage`, or `FilterPanel`) causes the entire parent component (including large lists and Leaflet maps) to re-render synchronously on every single keystroke.
**Action:** Extract input into a dedicated `DebouncedInput` component that manages its own local keystroke state. This confines keystroke re-renders solely to the `DebouncedInput` component, updating the parent only after the user stops typing.
