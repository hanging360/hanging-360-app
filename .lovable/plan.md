

## Plan: Ocultar botón "Back" después del login

El objetivo es que cuando el usuario entre al WebView y pase de la página de login (o entre directamente como Client), el botón "Back" desaparezca para que no pueda volver atrás.

### Enfoque

Determinar si el usuario ya pasó del login basándose en la URL inicial del iframe:

- **Client** (`/my-appointment`): No es login, así que el botón Back se muestra inicialmente pero se oculta cuando el iframe carga.
- **Technician** (`/login`): El botón Back se muestra mientras está en login. Una vez que el iframe navega fuera de `/login`, se oculta.
- **Promotional** (`/promotional`): Similar a Client, ocultar el Back tras cargar.

### Implementación en `src/screens/WebViewScreen.tsx`

1. Añadir un estado `showBack` que empiece en `true`.
2. Determinar si la URL inicial es la página de login (`/login`).
3. Si **no es login** (Client, Promotional): ocultar el botón Back inmediatamente (o mostrar solo brevemente).
4. Si **es login**: escuchar el evento `onLoad` del iframe. Debido a restricciones de cross-origin no podemos leer la URL del iframe, así que usaremos un enfoque basado en tiempo o en el número de cargas:
   - Al primer `onLoad` se muestra el Back (están en login).
   - Al segundo `onLoad` (navegación post-login), se oculta el Back.
5. Alternativamente, más simple: **mostrar el botón Back solo cuando la URL inicial contiene `/login`**, y ocultarlo tras el primer `onLoad` del iframe (indicando que el login fue exitoso y redirigió). Para las demás rutas, no mostrar Back nunca.

### Enfoque simplificado elegido

- Si la URL inicial NO es `/login` → no mostrar botón Back.
- Si la URL inicial ES `/login` → mostrar Back inicialmente, ocultarlo tras el segundo `onLoad` del iframe (el primero es la carga de login, el segundo es la redirección post-login).

### Cambios

**`src/screens/WebViewScreen.tsx`:**
- Añadir estado `showBack` y un contador de cargas `loadCount`.
- Condicionar el renderizado del botón Back según `showBack`.
- Manejar `onLoad` en el iframe para detectar navegación post-login.

