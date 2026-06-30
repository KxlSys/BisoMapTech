## 2024-06-02 - Debounce Inputs & Memoization Patterns
**Learning:** For extensive list renderings or heavily loaded map pages (like `PlacesPage`), binding search inputs directly to a state that triggers fetch or re-renders the root component blocks the main thread. While `filter-panel.tsx` successfully implemented a local debounced state, this pattern was inconsistently applied.
**Action:** When working on complex React views with heavy children or lists, always decouple fast-changing input state (`localSearch`) from the expensive render-triggering state (`searchQuery` or `search`). Additionally, extract large repetitive map items (`displayedPlaces.map(...)`) into `React.memo` components with `useCallback` for their event handlers.

## 2024-06-03 - Leaflet Marker Icon Updates
**Learning:** In Leaflet, redefining all markers completely when only a single marker's focus state changes can be expensive and cause slight UI flickering. Using `marker.setIcon()` avoids recreating marker nodes.
**Action:** Track `focusedPlaceId` changes via a ref, grab the previously focused marker to reset its icon, and then set the new focused marker's icon.

## 2024-06-05 - Onboarding Tech Search Debouncing
**Learning:** In the onboarding stepper, the tech search input filtered a large list (`TECH_OPTIONS`) synchronously on every keystroke, causing the root component to re-render and producing noticeable UI lag.
**Action:** Decouple the fast-changing input state (`localTechSearch`) from the expensive render-triggering state (`techSearch`) and use a standard `useEffect` debounce pattern (300ms) to synchronize the two.
## 2026-06-24 - Memoization and Set Lookups for Performance\n**Learning:** Recalculating array mappings or filtering directly inside the render loop or inside nested array iteration blocks the main thread. Specifically, `.filter()` combined with `.map().includes()` creates an O(N*M) time complexity.\n**Action:** Use `useMemo` in React components to memoize filtered collections (e.g. `listProfiles`). In algorithmic logic, pre-calculate lowercased values and convert reference arrays to `Set` structures for O(1) membership lookups.
## 2024-06-29 - Cache location API calls
**Learning:** Found that `useLocations` hook calls Supabase `getCities` and `getDepartments` on every component mount, causing redundant network requests and database hits.
**Action:** Implement module-level caching (or use React Query if available) for static/slow-changing data like locations to prevent unnecessary API calls across the application.
## 2024-07-02 - UI Debouncing Component Usage
**Learning:** Re-implementing debounced inputs manually via `useState` + `setTimeout` in parent components (e.g., `AdminPage`, `OnboardingStepper`) leads to redundant boilerplate, potential re-render blocking during fast typing, and inconsistencies across the app.
**Action:** When a debounced text input is required to optimize rendering or fetch performance, always utilize the pre-existing `DebouncedInput` component (`src/components/ui/debounced-input.tsx`) rather than writing custom `useEffect` timeout logic.
