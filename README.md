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

Esto inicia Vite en `http://localhost:5173` y la API en `http://127.0.0.1:3001`. Vite reenvía las solicitudes `/api` al backend.

## Crear y desactivar cuentas

No hay registro publico. Las diez cuentas operativas locales estan documentadas en [docs/CREDENCIALES_CUENTAS.md](docs/CREDENCIALES_CUENTAS.md). Las cuentas anteriores de demostracion estan desactivadas.

## Base local

- SQLite se inicializa automáticamente desde `backend/db/schema.sql`.
- Ruta predeterminada: `backend/data/cafes.sqlite`.
- Puedes cambiar la ruta con `DB_PATH`.
- El backend escucha en `127.0.0.1:3001`; configura `API_HOST` y `API_PORT` si necesitas otros valores.
- Cinco fallos de ingreso bloquean durante 15 minutos. El control se guarda en la base local.

## Contraseñas

Por requisito del proyecto, se almacena `SHA-256(sal aleatoria || separador || contraseña)` con una sal diferente por cuenta; el navegador nunca calcula ni guarda el hash. SHA-256 es un hash, no cifrado. SHA-256 directo es rápido y no es resistente a ataques offline si alguien copia la base de datos; la sal no corrige esa limitación. Esta decisión queda registrada en [docs/HUS.md](docs/HUS.md) para que el alcance y el riesgo sean visibles.

## Construcción y producción

```powershell
npm run build
```

Para servir también el frontend compilado desde la API, define `NODE_ENV=production` y `APP_ORIGIN` con el origen HTTPS de despliegue, y ejecuta `node backend/server.js`. En producción la cookie de sesión usa `Secure`.

## Historias de usuario

Las HUs, criterios de aceptación, trazabilidad ISO y límites funcionales están en [docs/HUS.md](docs/HUS.md).


