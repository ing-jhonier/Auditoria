# Credenciales de cuentas del proyecto

Estas son diez cuentas ficticias para el laboratorio local Cafés del Pacífico. Los nombres identifican funciones y turnos. Para facilitar la demostración, todas usan la misma contraseña débil de laboratorio; no son cuentas de personas reales y no deben usarse en producción.

| Usuario | Nombre | Rol | Contraseña inicial |
|---|---|---|---|
| `gerencia.principal` | Gerencia principal | Gerencia | `cafe123` |
| `gerencia.operaciones` | Gerencia de operaciones | Gerencia | `cafe123` |
| `bodega.turno01` | Bodega turno 01 | Bodega y logística | `cafe123` |
| `bodega.turno02` | Bodega turno 02 | Bodega y logística | `cafe123` |
| `bodega.turno03` | Bodega turno 03 | Bodega y logística | `cafe123` |
| `bodega.turno04` | Bodega turno 04 | Bodega y logística | `cafe123` |
| `bodega.turno05` | Bodega turno 05 | Bodega y logística | `cafe123` |
| `bodega.turno06` | Bodega turno 06 | Bodega y logística | `cafe123` |
| `bodega.turno07` | Bodega turno 07 | Bodega y logística | `cafe123` |
| `bodega.turno08` | Bodega turno 08 | Bodega y logística | `cafe123` |

La contraseña común de laboratorio es `cafe123`. El hash almacenado para cada cuenta es SHA-256 directo sin sal. Este archivo contiene credenciales deliberadamente débiles para la demostración; no las uses con datos reales ni despliegues la aplicación en producción.

Base local: `backend/data/cafes.sqlite`. Las diez cuentas listadas se sincronizan con esta contraseña en la base local.
