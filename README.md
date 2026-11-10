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
