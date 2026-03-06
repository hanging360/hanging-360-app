

## Diagnóstico: El botón Back ya fue eliminado del código

Revisé el código actual de `WebViewScreen.tsx` y **el botón Back ya NO existe en el código**. Solo queda el botón de "casa" (`.webview-home-btn`) que es para cambiar de rol.

El problema es que **la app móvil está cargando una versión cacheada** del código anterior. El `capacitor.config.ts` apunta a:
```
https://5b3efdff-0bb6-4b46-b9a0-9667099613c7.lovableproject.com
```

### Solución

Para que la app móvil refleje los cambios:

1. **Cerrar completamente la app** en el teléfono (no solo minimizar, sino forzar cierre)
2. **Volver a abrir la app** - debería cargar la versión actualizada desde el servidor

Si sigue sin funcionar:
3. **Limpiar caché de la app** desde los ajustes del teléfono
4. O re-sincronizar el proyecto: hacer `git pull` → `npx cap sync` → `npx cap run android/ios`

### Cambio adicional recomendado

Limpiar el CSS residual: la clase `.webview-back` todavía existe en `index.css` (líneas 248-259) aunque ya no se usa. Puedo eliminarla para mantener el código limpio.

