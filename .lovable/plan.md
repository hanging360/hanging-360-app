

## Plan: Bloquear acceso web desde HomeScreen

El problema es que `HomeScreen` no tiene verificación de plataforma. En navegador web:
1. Muestra la pantalla de roles por un instante
2. Si hay `lastRole`, redirige a `/v`
3. `/v` muestra "descarga la app"

### Cambio

**`src/screens/HomeScreen.tsx`**:
- Importar `Capacitor` de `@capacitor/core`
- Al inicio del componente, si `!Capacitor.isNativePlatform()`, retornar directamente el mensaje "Para acceder, descarga la app" sin mostrar roles ni hacer redirect
- Esto elimina el flash y la redirección en navegador web

