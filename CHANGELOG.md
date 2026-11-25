# Historial de versiones

## 1.3.0 — 2026-11-25

### Sin datos ficticios ni simulados (`feature/sin-mocks`)

- Eliminados todos los archivos y fallbacks de datos simulados (`marfilData.js`, `adminMockData.js`, `HeroSectionPrototype.jsx`, `VITE_DEMO_OFFLINE` y `.env.local` demo).
- La PWA (`HomeScreen`, `HeroSection`, `MenuScreen`) y el panel admin (`DashboardView`, `App`) consumen 100 % datos reales desde la API, mostrando estados de carga y error con botón **Reintentar** si el servidor no responde.
- `npm run db:seed` ahora siembra únicamente el catálogo real y una cuenta administradora inicial (`soloCatalogo: true`); los datos de demostración quedan bajo `npm run db:seed -- --demo`.

### Validaciones en todos los formularios (`feature/validaciones`)

- Utilidades reutilizables `reglas` + hook `useFormulario` en ambas aplicaciones con validación por campo (`onBlur`/envío), errores en línea con `aria-invalid`/`aria-describedby`, foco automático al primer error y mapeo de errores `detalles[]` de la API.
- Cobertura en PWA (`AuthScreen`, `ProfileScreen`, `ReservationWizard` en sus 6 pasos) y panel admin (`LoginScreen` sin credenciales precargadas, `WalkInModal`, `ReservationsTableView`, `PromotionsModule`, `LudotecaModule`, `StaffSettingsModule`).
- Esquemas adicionales en backend (`zTelefonoMX`, `zNombrePersona`, `zRutaImagen`) y pruebas unitarias.

### Editor de menú con vista previa PWA (`feature/menu-editor`)

- Migración `003_menu_publicacion.js`: agrega `estado` (`borrador`/`publicado`), `orden`, `actualizado_por` y `actualizado_en` a `productos`.
- Endpoints `POST /api/menu/productos/:id/publicar`, `POST /api/menu/productos/:id/despublicar`, `PATCH /api/menu/orden`, `GET /api/menu/productos?incluirBorradores=1` (solo staff) y `POST /api/uploads/imagen` (validación MIME + magic bytes JPG/PNG/WebP hasta 2 MB).
- Rediseño de `MenuCatalogModule` en el panel admin con editor dividido, **vista previa en vivo** estilo PWA (escritorio y móvil), **vista previa de menú completo**, borradores, duplicado, reordenamiento y subida de fotos.

### Envío y verificación de correos (`feature/correos`)

- Migración `004_verificacion_correo.js`: agrega `email_verificado_en` a `clientes` y crea la tabla `tokens_correo` (tokens hasheados con SHA-256).
- Verificación de dominio MX por DNS y bloqueo de dominios desechables al registrarse o cambiar correo.
- Correos HTML con identidad Café Marfil (`#E12927`, `#1F1410`, `#FCEAE9`, `#FFFFFF`) para verificación de cuenta, bienvenida, recuperación de contraseña, confirmación y cancelación de reservaciones.
- Endpoints `GET /api/auth/verificar`, `POST /api/auth/verificacion/reenviar` (con límite de tasa), `POST /api/auth/password/olvide` y `POST /api/auth/password/restablecer` (revoca sesiones anteriores).
- Bloqueo de canje de beneficios en cuentas en línea sin correo verificado, banner de verificación en la PWA y pantallas de verificación y recuperación de contraseña (`EmailFlowScreen`).

### Actualización

Aplica `npm run db:init --workspace backend` antes de arrancar 1.3.0 para ejecutar las migraciones `003_menu_publicacion.js` y `004_verificacion_correo.js`. Configura las variables `SMTP_*`, `MAIL_FROM` y `APP_URL` en `backend/.env` (en desarrollo usa Mailpit en `127.0.0.1:1025`).

## 1.2.0 — 2026-11-24

### Backend

- Repositorios con Knex para todas las consultas de la aplicación. Rutas, reglas de negocio y persistencia separadas; se elimina el constructor manual de SQL.
- Migraciones versionadas que adoptan la base 1.1.0 y agregan versión de sesión sin borrar datos. El arranque verifica el esquema; no requiere permisos DDL.
- JWT con algoritmo, emisor, audiencia y claims explícitos. Los cambios de credenciales, rol o estado del personal invalidan sesiones anteriores.
- Helmet, límites por IP, configuración validada, respuestas sin caché y errores/logs sin consultas ni tokens de rutas.
- bcrypt costo 12, validación de 72 bytes UTF-8 y comparación de hash para usuarios inexistentes. Nuevos pases de invitado con 128 bits aleatorios.
- Transacciones `READ COMMITTED` y bloqueos para proteger cupos, canjes, sellos y mesas. Las ediciones inválidas revierten también sus efectos secundarios.
- Préstamos solo a mesas ocupadas y de juegos que no requieren reposición. Se impide mover actividades reservadas o bajar su cupo por debajo de la ocupación.
- Cierre ordenado de HTTP/pool y endpoint `/api/ready`.

### Integración y calidad

- Las simulaciones offline de `develop` quedan limitadas a desarrollo con `VITE_DEMO_OFFLINE=true`. En producción los fallos de API se muestran como errores.
- Un solo `package-lock.json` para los tres workspaces; `npm ci` desde la raíz. `dev:all` incluye el backend.
- ESLint, formato y CI con MySQL real, auditoría y compilación de ambas aplicaciones. Pruebas de migración, revocación, permisos, inyección, límites, concurrencia y rollback.

### Actualización

Aplica `npm run db:init --workspace backend` antes de arrancar 1.2.0. Los datos y pases de reservación existentes se conservan; las sesiones anteriores requieren un nuevo login. Usa una cuenta DML dedicada para la API y otra para migraciones. Pasos completos y límites operativos en [backend/README.md](backend/README.md).
