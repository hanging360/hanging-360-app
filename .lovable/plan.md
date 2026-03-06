

## Plan: App-style icon buttons in a horizontal row

Transform the role buttons from horizontal list items into app-icon style: icon centered on top, label below, all three side by side.

### Changes

**`src/index.css`**
- `.home-roles`: change to `flex-direction: row`, `justify-content: center`, `gap: 1.5rem`
- `.role-btn`: make square-ish, `flex-direction: column`, `align-items: center`, `justify-content: center`, padding `1rem`, width ~`90px`, remove horizontal layout styles
- `.role-icon`: increase size to `48px` with larger border-radius
- `.role-label`: center text, `font-size: 0.8rem`, `margin-top: 0.25rem`
- Remove `.role-chevron` styles (no longer needed)
- Remove `.role-subtitle` styles (empty anyway)

**`src/screens/HomeScreen.tsx`**
- Remove the chevron `›` span from each button
- Remove the subtitle span
- Increase SVG icon size from 18 to 24
- Simplify button markup to just icon + label

Result:
```text
  [👤]    [🔧]    [📣]
 Client  Technician  Promotional
```

