# Sistema de Restricciones por Plan

Este sistema implementa restricciones de acceso a módulos basadas en el plan del usuario.

## Estructura

### Archivos principales:
- `src/utils/planPermissions.ts` - Define los permisos por plan
- `src/components/ProtectedModule.tsx` - Componente que protege módulos
- `src/components/RestrictedAccess.tsx` - Pantalla de acceso denegado
- `src/components/Sidebar.tsx` - Filtra módulos visibles en sidebar

### Planes y módulos permitidos:

| Plan | Módulos incluidos |
|------|-------------------|
| Plan Servicios | Chatbot, Reservas, Recordatorios |
| Plan Servicios Plus | Chatbot, Reservas, Recordatorios, Analíticas |
| Plan Tienda | Chatbot, Pedidos, Analíticas |
| Plan Tienda Plus | Chatbot, Pedidos, Analíticas, Pagos |
| Plan Premium | Todos los módulos |
| Plan Personalizado | Todos los módulos |

## Funcionamiento

1. **Filtrado en Sidebar**: Solo muestra módulos permitidos según el plan
2. **Protección de rutas**: Redirige a pantalla de error si se accede directamente a URL no permitida
3. **Mensaje informativo**: Muestra qué plan se necesita para acceder al módulo

## Uso

Las páginas están protegidas automáticamente:
```tsx
<ProtectedModule module="orders">
  <OrdenesContent />
</ProtectedModule>
```

## Testing

Para probar el sistema:
1. Seleccionar "Plan Servicios" en el header
2. Verificar que solo aparecen Chatbot, Reservas y Recordatorios en sidebar
3. Intentar acceder a `/orders` directamente - debe mostrar pantalla de error
4. Cambiar a otro plan y verificar que los módulos se actualizan

## Backend

El plan se almacena en la tabla `negocios` campo `plan` y se actualiza via:
- Endpoint: `PUT /api/negocio/:id/plan`
- También actualiza automáticamente los módulos correspondientes
