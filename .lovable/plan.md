

## Plan: Efecto visual "cuadro colgado" + herramientas tiradas

### 1. Logo como cuadro colgado en la pared
- Añadir una "soguita" (línea SVG o pseudo-elemento CSS) que suba desde el logo hacia arriba, simulando que está colgado de un clavo.
- Aplicar `transform: rotate(-4deg)` al contenedor del logo para que se vea inclinado, como un cuadro torcido en la pared.
- Un pequeño punto/clavo en la parte superior de la soga.

### 2. Herramientas tiradas en el fondo del cuadro blanco
- Añadir SVGs decorativos dentro del `home-card` en la parte inferior: tornillos, martillo, taladro, dispersos en ángulos aleatorios.
- Posicionarlos con `position: absolute` en el fondo del card, rotados en distintos ángulos para dar efecto de "tirados".
- Colores grises/metálicos para que se vean como herramientas reales pero no distraigan de los botones.

### Archivos a modificar
- **`src/screens/HomeScreen.tsx`**: Agregar la soga SVG sobre el logo, el clavo, y los SVGs decorativos de herramientas al fondo del card.
- **`src/index.css`**: Estilos para la soga, rotación del logo, posicionamiento absoluto de las herramientas, y `overflow: hidden` en el card para que no se salgan.

