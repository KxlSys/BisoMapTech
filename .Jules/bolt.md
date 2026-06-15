## 2024-05-28 - Optimize Leaflet Marker Updates
**Learning:** React Leaflet implementations often recreate all markers when a single property like `focusedProfileId` changes if dependencies are broad.
**Action:** When working with Leaflet markers in React, avoid putting the focused ID in the main layer creation dependency array. Instead, use a secondary `useEffect` to find the specific Leaflet marker instance and update its icon or state directly. This turns an O(N) DOM operation (recreating hundreds of markers) into an O(1) operation (updating just 1-2 markers), vastly improving interaction performance on maps with many points.

## 2024-06-05 - Onboarding Tech Search Debouncing
**Learning:** In the onboarding stepper, the tech search input filtered a large list (`TECH_OPTIONS`) synchronously on every keystroke, causing the root component to re-render and producing noticeable UI lag.
**Action:** Decouple the fast-changing input state (`localTechSearch`) from the expensive render-triggering state (`techSearch`) and use a standard `useEffect` debounce pattern (300ms) to synchronize the two.
