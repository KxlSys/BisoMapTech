## 2024-05-30 - Form Array Filtering
**Learning:** In complex form components (like `OnboardingStepper`), keystrokes in any input field (like `fullName` or `bio`) trigger a re-render of the entire component. If large array operations (like filtering `TECH_OPTIONS` which has many entries) are placed in the render body without memoization, they execute unnecessarily on every keystroke, potentially causing input lag.
**Action:** Always wrap derived list computations in `useMemo` when they depend on specific input state, especially in large form components with many independent inputs.
