# Guía de uso — Cafés del Pacífico

## ¿Para qué sirve?

La aplicación permite registrar lotes de café y vigilar sus fechas de tueste y vencimiento. Guarda la información en una base SQLite local en el computador donde se ejecuta el backend.

## Aclaración sobre los usuarios que dicen “turno”

La aplicación **no administra turnos de trabajo, horarios, asistencia ni personal**. El texto `turno01`, `turno02` y así sucesivamente es solo parte del nombre de ocho cuentas de Bodega y logística. Se usó para distinguir cuentas cuando no se proporcionaron nombres de empleados; no significa que el sistema conozca o controle esos turnos.

Las cuentas actuales son dos de Gerencia y ocho de Bodega y logística. Los nombres visibles también son genéricos. Antes de asignar cuentas al personal, conviene reemplazar esos identificadores por nombres de usuario y nombres visibles de las personas responsables. Las credenciales iniciales están en [CREDENCIALES_CUENTAS.md](CREDENCIALES_CUENTAS.md).

## Iniciar la aplicación

Desde PowerShell, en la carpeta raíz del proyecto:

```powershell
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador. El frontend usa el puerto 5173 y la API local escucha en `http://127.0.0.1:3000`. La información se guarda en `backend/data/cafes.sqlite` y permanece después de cerrar o reiniciar la aplicación en ese computador.

## Iniciar sesión

Para la demostracion local usa `auditoria.lab` con la contrasena `cafe123`. Las demas cuentas operativas conservan las credenciales indicadas en `CREDENCIALES_CUENTAS.md`; no publiques ese archivo.

La aplicacion no tiene registro publico. La cuenta sintetica `auditoria.lab` se crea al iniciar la API en modo no productivo. La CLI permite contrasenas debiles para esta demostracion y almacena SHA-256 directo sin sal.

## Qué muestra cada sección del menú

- **Resumen:** indicadores generales, los cinco lotes que requieren más atención, el pulso del inventario y actividad reciente.
- **Lotes:** inventario completo. Permite buscar y filtrar; Bodega y logística también puede registrar lotes.
- **Reportes:** solo para Gerencia. Presenta la distribución porcentual por estado y el detalle completo que alimenta el análisis.
- **Actividad:** muestra eventos de negocio existentes, como la creacion de lotes; no registra accesos de autenticacion en el laboratorio.

Las vistas reutilizan los mismos lotes, pero cada sección responde una pregunta distinta: qué atender ahora, qué hay en inventario, cómo se distribuyen los vencimientos y qué acciones quedaron registradas.

## Qué puede hacer cada rol

### Bodega y logística

- Consultar los lotes registrados.
- Registrar un lote nuevo con identificador, tipo de café, origen, fecha de tueste, vencimiento y cantidad.
- Buscar por lote, café u origen y filtrar por estado.

### Gerencia

- Consultar y filtrar lotes.
- Revisar el resumen y el reporte de vencimientos.
- Consultar los eventos de negocio que muestra la vista Actividad.

La interfaz oculta reportes y actividad a Bodega, pero en el laboratorio la API no aplica autorizacion por rol: una sesion valida de Bodega puede invocar esas rutas directamente. Las rutas privadas siguen requiriendo sesion.

## Registrar un lote

1. Inicia sesión con una cuenta de Bodega y logística.
2. Abre la acción para registrar un lote.
3. Completa todos los campos. El identificador debe ser único.
4. Ingresa una fecha de vencimiento posterior a la fecha de tueste.
5. Guarda el registro. El lote queda persistido en SQLite y aparece en la lista.

## Cómo leer los estados

El estado se calcula usando la fecha actual de Bogotá y la fecha de vencimiento:

- **Vencido:** la fecha de vencimiento ya pasó.
- **Próximo a vencer:** vence hoy o dentro de los próximos 30 días.
- **Vigente:** vence en más de 30 días.

Los contadores y filtros se basan en esos estados. Si todavía no hay lotes, la lista y el reporte estarán vacíos o mostrarán ceros.

## Qué significa “Actividad”

La vista puede mostrar eventos de negocio existentes, como creacion de lotes. En el laboratorio no se registran eventos de login correcto, fallido ni logout; por tanto, no es una bitacora de autenticacion.

## Datos y alcance local

La base SQLite es local al computador y no sincroniza automáticamente con otras instalaciones. Para que varias personas compartan la misma información, el backend y la base tendrían que estar alojados en un servidor accesible para ellas. El frontend por sí solo no comparte la base.

El backend almacena SHA-256 directo sin sal para las contrasenas; el campo de sal compatible con la base queda vacio. El algoritmo es rapido y una contrasena debil puede ser vulnerable a prueba offline si se obtiene la base. Las contrasenas operativas aparecen en texto claro en el archivo de credenciales: no lo publiques.
