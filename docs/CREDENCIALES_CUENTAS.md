# Credenciales de cuentas del proyecto

Estas son las diez cuentas operativas creadas para el proyecto local Cafés del Pacífico. Los nombres identifican funciones y turnos; asígnalas a las personas autorizadas antes de utilizar el sistema en operación. Las dos cuentas de demostración anteriores quedaron desactivadas.

| Usuario | Nombre | Rol | Contraseña inicial |
|---|---|---|---|
| `gerencia.principal` | Gerencia principal | Gerencia | `Cp#0c1EBgX1jk7dccLBgMm5hE3u7a` |
| `gerencia.operaciones` | Gerencia de operaciones | Gerencia | `Cp#VNFTY4Y28MsaZSu2S1L-OwGY7a` |
| `bodega.turno01` | Bodega turno 01 | Bodega y logística | `Cp#8pq4ibQGwrgKA1oCviq-mPSG7a` |
| `bodega.turno02` | Bodega turno 02 | Bodega y logística | `Cp#oT_QJUN0EQ_hMoKZlU1HTkIV7a` |
| `bodega.turno03` | Bodega turno 03 | Bodega y logística | `Cp#kNKa_OJGGNo-t3xoc9s3whju7a` |
| `bodega.turno04` | Bodega turno 04 | Bodega y logística | `Cp#nQ960xZGSSWZNB3c3yVVqzHe7a` |
| `bodega.turno05` | Bodega turno 05 | Bodega y logística | `Cp#Ls2fwla0J9jbGZBlBBZqnBgp7a` |
| `bodega.turno06` | Bodega turno 06 | Bodega y logística | `Cp#Te5ySOHPVJ2SvVngtZ3ZcM5E7a` |
| `bodega.turno07` | Bodega turno 07 | Bodega y logística | `Cp#V4J-8b3lbpd7v4Eq5zdp2Ar67a` |
| `bodega.turno08` | Bodega turno 08 | Bodega y logística | `Cp#y7J9_SDne1PmrV8vNkBppFOJ7a` |

Las contraseñas son iniciales y únicas por cuenta. Entrégalas individualmente a sus responsables y cámbialas antes de usar estas cuentas con datos o procesos reales. Este archivo contiene secretos en texto claro: mantenlo fuera de repositorios públicos y limita su acceso.

El backend almacena SHA-256 con una sal aleatoria individual; nunca guarda las contraseñas en claro. Base local: `backend/data/cafes.sqlite`.
