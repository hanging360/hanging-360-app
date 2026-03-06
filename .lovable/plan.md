

## Plan: Logo abre WhatsApp

Hacer que al tocar el logo de Hanging 360 se abra el enlace de WhatsApp `https://wa.me/17863400825`.

### Cambio en `src/screens/HomeScreen.tsx`
- Envolver la imagen del logo (`<img>`) dentro de un `<a>` con `href="https://wa.me/17863400825"` y `target="_blank"`.
- Añadir `cursor: pointer` al logo para indicar que es clickeable.

Es un cambio mínimo de una línea en el JSX.

