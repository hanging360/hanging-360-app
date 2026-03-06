

## Plan: Rediseño completo estilo iOS nativo 2026

### Problemas actuales
- Logo diminuto (96px), apenas visible
- Emojis feos como iconos (👤🔧📣)
- Botones enormes y descentrados — el emoji empuja el texto
- Todo se ve en desktop sin optimización móvil
- Textos en inglés

### Cambios

#### `src/screens/HomeScreen.tsx`
- Logo grande: 120px
- Quitar emojis, usar iconos SVG inline (persona, llave inglesa, megáfono) en azul (#007AFF)
- Estilo iOS grouped list: contenedor blanco con bordes redondeados, cada fila separada por línea fina
- Cada fila: icono SVG azul a la izquierda, texto negro, chevron gris a la derecha (›)
- Subtexto descriptivo debajo de cada rol
- Textos en español: "Cliente", "Técnico", "Promocional", "Selecciona tu rol"

#### `src/index.css`
- Font: `-apple-system, SF Pro Display, SF Pro Text` como prioritario
- Fondo: `#f2f2f7` (gris sistema iOS)
- Contenedor de roles: fondo blanco, `border-radius: 12px`, sin gap entre items, separadores internos con `border-bottom: 0.5px solid rgba(0,0,0,0.1)`
- Filas: `padding: 14px 16px`, sin bordes individuales, primer/último con radius
- Active state: `background: #e5e5ea`
- Max-width: 390px centrado (ancho iPhone)
- Logo: 120px, centrado

### Resultado visual esperado
```text
┌─────────────────────────┐
│                         │
│        [LOGO 120px]     │
│       Hanging 360       │
│    Selecciona tu rol    │
│                         │
│  ┌───────────────────┐  │
│  │ 👤  Cliente     › │  │  ← icono SVG azul
│  │─────────────────── │  │  ← separador fino
│  │ 🔧  Técnico     › │  │
│  │─────────────────── │  │
│  │ 📣  Promocional › │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/screens/HomeScreen.tsx` | SVG icons, español, layout iOS grouped |
| `src/index.css` | Estilos iOS nativos completos |

