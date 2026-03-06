

## Plan: Fix button spacing — eliminate dead space

The problem: `.role-text` has `flex: 1` which forces it to stretch across the entire button width, pushing the chevron `›` to the far right edge. This creates a massive empty gap between the text and the chevron.

### Fix in `src/index.css`

1. Remove `flex: 1` from `.role-text` — let it only take the space it needs
2. Remove `min-width: 0` from `.role-text` (no longer needed)
3. Move the chevron right after the text naturally by letting flexbox handle it without forced expansion

The button layout will go from:
```text
[icon]  Client_______________›    (huge gap)
```
To:
```text
[icon]  Client ›                  (compact, natural)
```

### File to modify
| File | Change |
|---|---|
| `src/index.css` | Remove `flex: 1` and `min-width: 0` from `.role-text` |

