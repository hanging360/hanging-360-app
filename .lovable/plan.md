

## Plan: Logo + botones de descarga en la pantalla /v (web)

La pantalla `/v` cuando se accede desde web muestra un mensaje de "descarga la app". Vamos a mejorarla con el logo subido y dos botones de descarga (App Store y Google Play).

### Cambios

**Copiar el logo** del upload a `src/assets/comp-logo.png`

**`src/screens/WebViewScreen.tsx`** — Reemplazar el bloque web (líneas 41-57) con:
- Logo importado desde `@/assets/comp-logo.png`, centrado, ~120px
- Texto "Para acceder, descarga la app"
- Dos botones estilizados: "App Store" y "Google Play" con iconos SVG inline (Apple y Google Play)
- Los botones tendrán `href="#"` como placeholder hasta que el usuario proporcione los links reales
- Estilo coherente con la estética existente (fondo oscuro #1a1a1a, botones con bordes redondeados)

No se necesitan cambios en CSS ya que los estilos irán inline en el componente (consistente con el patrón actual de esa pantalla).

