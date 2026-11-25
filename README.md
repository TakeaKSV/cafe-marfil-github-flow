# Café Marfil - Monorepo

Ecosistema tecnológico omnicanal para **Café Marfil Urban Brunch & All-Day Dining**.

Versión **1.2.0**. Cambios y notas de actualización en [CHANGELOG.md](CHANGELOG.md).

## Estructura del Proyecto

```text
├── backend/                  # Servicios de backend y APIs
└── frontend/                 # Aplicaciones frontend
    ├── admin/                # Panel de administración backoffice
    └── marfil/               # Aplicación web PWA para clientes
```

## Ejecución

### Backend (API + base de datos)
```bash
npm ci                    # desde la raíz; instala los tres workspaces
cd backend
cp .env.example .env    # y pon ahí los datos de tu MySQL (DB_USER, DB_PASSWORD...)
npm run db:seed
npm run dev
```
Requiere MySQL 8 encendido. La API queda en `http://localhost:3000/api` y los dos frontends ya consumen sus datos de ahí, así que conviene levantarla primero. Detalle de endpoints, modelo de datos y cuentas de ejemplo en [`backend/README.md`](backend/README.md).

### Cliente (Café Marfil PWA)
```bash
cd frontend/marfil
npm run dev
```

### Administrador (Backoffice)
```bash
cd frontend/admin
npm run dev
```

Desde la raíz, `npm run dev:all` inicia API, PWA y admin. `npm run lint`, `npm test` (requiere MySQL) y `npm run build` validan el monorepo; GitHub Actions repite esas verificaciones y la auditoría de dependencias.

La API ya no crea tablas al arrancar: aplica `npm run db:init --workspace backend` antes de iniciar una base existente. La actualización conserva los datos y requiere iniciar sesión nuevamente.

Los datos offline son opcionales: `VITE_DEMO_OFFLINE=true` habilita simulaciones únicamente en desarrollo. En producción, un fallo de la API nunca crea una sesión admin ni una confirmación ficticia de reservación. Consulta la [guía de pruebas aisladas](backend/README.md#validación-reproducible).
