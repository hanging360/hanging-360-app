

## Plan: Remove "Hanging 360" text, add white card container

### What changes

1. **Remove the `<h1>Hanging 360</h1>`** from `HomeScreen.tsx`

2. **Wrap logo + buttons in a white rounded card** — Add a new wrapper div (`home-card`) around both `.home-brand` and `.home-roles` in `HomeScreen.tsx`

3. **Style the card in `src/index.css`**:
   - `.home-card`: `background: #ffffff`, `border-radius: 20px`, `padding: 2rem 1.5rem`, `width: 100%`, centered content, flex column with gap

### Files

| File | Change |
|---|---|
| `src/screens/HomeScreen.tsx` | Remove `<h1>`, wrap brand + roles in `<div className="home-card">` |
| `src/index.css` | Add `.home-card` style, adjust `.home-screen` gap |

