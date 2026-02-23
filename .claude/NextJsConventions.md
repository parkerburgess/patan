
### Custom Hooks over raw useEffect
Never place raw `useEffect` calls directly in components. Always extract them
into named custom hooks in the `/hooks` directory using TypeScript (`.ts` or `.tsx`).

**Do this:**
```tsx
function useFetchUserData(userId) { ... }
const user = useFetchUserData(userId);
```

**Not this:**
```tsx
useEffect(() => {
  // fetch user data
}, [userId]);
```

### Custom Hooks over raw useEffect
Custom hooks should:
- Be prefixed with `use`
- Have a name that clearly describes what they do, not how they do it
- Be reusable across components where possible

## General Code Style
- Prefer readable, self-documenting code over comments
- Function and variable names should explain intent
- If a comment is needed to explain what code does, consider renaming instead