## 2025-05-25 - [Learning] Map Re-renders
**Learning:** The leaflet maps are rendering all profiles/places markers on map updates. By optimizing map renders or using memoization we can reduce rendering time.
**Action:** I will add memoization.

## 2025-05-26 - [Learning] React State Debouncing & Memoization
**Learning:** Binding high-frequency events (like text inputs) directly to global state stores (Zustand/Redux) causes massive unnecessary re-renders across the entire app, especially on complex pages like maps and grids. Additionally, passing inline arrow functions directly as props breaks `React.memo` optimizations.
**Action:** Always debounce global state updates for text inputs using a fast local state and a timeout. Ensure callbacks passed to memoized components are wrapped in `useCallback`.
