# Café Marfil - Monorepo

Ecosistema tecnológico omnicanal para **Café Marfil Urban Brunch & All-Day Dining**.

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
cd backend
npm install
cp .env.example .env    # y pon ahí los datos de tu MySQL (DB_USER, DB_PASSWORD...)
npm run db:seed
npm run dev
```
Requiere MySQL 8 encendido. La API queda en `http://localhost:3000/api` y los dos frontends ya consumen sus datos de ahí, así que conviene levantarla primero. Detalle de endpoints, modelo de datos y cuentas de ejemplo en [`backend/README.md`](backend/README.md).

### Cliente (Café Marfil PWA)
```bash
cd frontend/marfil
npm install
npm run dev
```

### Administrador (Backoffice)
```bash
cd frontend/admin
npm install
npm run dev
```
