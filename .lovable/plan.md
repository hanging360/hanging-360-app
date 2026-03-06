

## Plan: Shrink buttons, add spacing, center with logo

### Changes to `src/index.css`

1. **Separate buttons** — Remove the grouped container background/overflow. Instead, give each `.role-btn` its own `border-radius: 12px`, white background, and no border-bottom. Add `gap: 10px` to `.home-roles` so buttons are spaced apart.

2. **Shrink buttons** — Reduce padding from `14px 16px` to `10px 14px`. Reduce icon square from `32px` to `28px`. Reduce SVG size reference. Reduce font size slightly.

3. **Center alignment** — Keep `.home-roles` at `width: 100%` and centered within the already-centered `.home-screen` container, ensuring buttons align with the logo above.

### Changes to `src/screens/HomeScreen.tsx`

- Remove `role-btn-first` / `role-btn-last` class logic (no longer needed since buttons are individual cards).
- Reduce SVG `width`/`height` from 22 to 18.

