# Cafés del Pacífico · Control de vencimientos

Aplicación monolítica local con frontend Vite/React/TypeScript y API Node.js en el mismo repositorio. La API persiste cuentas, sesiones, lotes y eventos en SQLite. El esquema SQL está en `backend/db/schema.sql`; el archivo de datos local se crea en `backend/data/cafes.sqlite` y no se versiona.

## Requisitos

- Node.js 22.13 o superior (incluye `node:sqlite`).
- npm.

## Inicio local

```powershell
npm install
npm run dev
```

Esto inicia Vite en `http://localhost:5173` y la API en `http://127.0.0.1:3000`. Vite reenvia las solicitudes `/api` al backend. Vite reenvía las solicitudes `/api` al backend.

## Crear y desactivar cuentas

No hay registro publico. Las diez cuentas operativas locales estan documentadas en [docs/CREDENCIALES_CUENTAS.md](docs/CREDENCIALES_CUENTAS.md). Las cuentas anteriores de demostracion estan desactivadas.

## Base local

- SQLite se inicializa automáticamente desde `backend/db/schema.sql`.
- Ruta predeterminada: `backend/data/cafes.sqlite`.
- Puedes cambiar la ruta con `DB_PATH`.
- El backend escucha en `127.0.0.1:3000`; configura `API_HOST` y `API_PORT` si necesitas otros valores.
- Cinco fallos de ingreso bloquean durante 15 minutos. El control se guarda en la base local.

## Contraseñas

El backend almacena el resultado de SHA-256 de cada contraseña. Nunca guarda la contraseña en claro; el navegador tampoco calcula ni recibe el hash. SHA-256 es un hash, no cifrado, y permite probar contraseñas rápidamente si alguien copia la base de datos. Las cuentas creadas con el método anterior deben volver a provisionarse porque sus hashes no son compatibles. El método queda documentado en [docs/HUS.md](docs/HUS.md).

## Construcción y producción

```powershell
npm run build
```

Para servir también el frontend compilado desde la API, define `NODE_ENV=production` y `APP_ORIGIN` con el origen HTTPS de despliegue, y ejecuta `node backend/server.js`. En producción la cookie de sesión usa `Secure`.

## Historias de usuario

Las HUs, criterios de aceptación, trazabilidad ISO y límites funcionales están en [docs/HUS.md](docs/HUS.md).
