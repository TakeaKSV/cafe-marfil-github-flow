# Historial de versiones

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
