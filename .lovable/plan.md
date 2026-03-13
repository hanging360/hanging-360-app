

## Plan: Restaurar menú en web + agregar botón COMP

### Cambios

**`src/screens/HomeScreen.tsx`**:
1. **Eliminar el bloqueo web** (líneas 55-75): Quitar el `if (!isNative)` que muestra "descarga la app". El menú de roles se mostrará tanto en web como en nativo.
2. **Agregar nuevo rol "COMP"** al array `roles` con:
   - `label: "COMP"`
   - `path: "/comp-appointment"`
   - Icono SVG de log/documento (clipboard con líneas)
3. El `handleRole` ya funciona correctamente para ambos contextos.

**`src/index.css`**:
- Ajustar `.home-roles` si es necesario para acomodar 4 botones en fila (reducir width de `.role-btn` o permitir wrap).

