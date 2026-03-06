

## Plan: Animación automática del logo al cargar

Añadir una animación CSS que al abrir la página haga que el logo empiece recto y se incline suavemente hasta quedarse en su posición inclinada (-5deg).

### Cambios en `src/index.css`
- Crear un `@keyframes swing-settle` que vaya de `rotate(0deg)` a `rotate(-5deg)` con un ligero rebote intermedio.
- Aplicar esa animación a `.hanging-frame` con `animation-fill-mode: forwards` para que se quede inclinado.
- El estado inicial será `rotate(0deg)` y terminará en `rotate(-5deg)`.

