# EventGo

App web para descubrir planes de tardeo y noche en bares y locales.
Los **clientes** buscan eventos por tipo, día o ciudad; los **comerciantes** registran sus locales y publican eventos.

- Frontend: React 18 + Vite 7 + Tailwind CSS
- Backend: [PocketBase](https://pocketbase.io) 0.34.2 (base de datos, usuarios, archivos y API)

## Arrancar

Necesitas Node.js 20.19 o superior (`.nvmrc`).

```bash
# Terminal 1: backend (http://127.0.0.1:8090, panel de administración en /_/)
npm run backend

# Terminal 2: frontend (http://localhost:5173)
npm install   # solo la primera vez
npm run dev
```

`pocketbase.exe` y `backend/pb_data/` no se suben a git. En un equipo nuevo, descarga
PocketBase 0.34.2 para Windows y deja el `.exe` en `backend/`; al arrancar aplicará las
migraciones y creará una base de datos vacía.

## Estructura

```
backend/
  pb_migrations/   esquema y reglas de acceso de la base de datos (versionado)
  pb_hooks/        lógica de servidor (contador de vistas de eventos)
  pb_data/         datos e imágenes subidas (NO se sube a git)
public/            archivos estáticos (.htaccess para Apache/Hostinger)
src/
  pages/           una página por ruta
  components/      barra de navegación, panel de comerciante y componentes de UI
  contexts/        sesión (AuthContext)
  lib/             cliente de PocketBase, categorías, fechas y utilidades
```

## Reglas y permisos

| Quién | Puede |
|---|---|
| Invitado | Ver título y foto de los próximos eventos |
| Cliente | Ver eventos y locales completos, seguir locales |
| Comerciante | Lo mismo que el cliente + crear/editar/borrar **sus** locales y eventos |

Las reglas se aplican en el servidor (`backend/pb_migrations/1794355200_eventgo_hardening.js`):
nadie puede crear ni modificar registros a nombre de otro usuario, asociar eventos a un local
ajeno, cambiar su tipo de cuenta ni falsear el contador de vistas.

## Variables de entorno

`.env` (cópialo de `.env.example`):

```
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

## Desplegar

`npm run build` genera `dist/`. Súbelo a cualquier hosting estático; el `.htaccess` ya
configura las rutas de la SPA y la caché en Apache. PocketBase debe ejecutarse en un
servidor, con `VITE_POCKETBASE_URL` apuntando a su URL pública.
