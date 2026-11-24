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

Abre `http://localhost:5173` en el navegador. El comando inicia el frontend y la API local. La información se guarda en `backend/data/cafes.sqlite` y permanece después de cerrar o reiniciar la aplicación en ese computador.

## Iniciar sesión

Usa el nombre de usuario y la contraseña asignados. La sesión dura hasta ocho horas, salvo que se cierre antes desde el botón de salida. Cinco intentos fallidos bloquean temporalmente ese usuario durante quince minutos.

La aplicación no tiene registro público. Las cuentas las crea un operador local. Actualmente no hay una pantalla para que cada persona cambie su contraseña; las diez cuentas listadas tienen contraseñas iniciales y deben asignarse cuidadosamente.

## Qué puede hacer cada rol

### Bodega y logística

- Consultar los lotes registrados.
- Registrar un lote nuevo con identificador, tipo de café, origen, fecha de tueste, vencimiento y cantidad.
- Buscar por lote, café u origen y filtrar por estado.

### Gerencia

- Consultar y filtrar lotes.
- Revisar el resumen y el reporte de vencimientos.
- Consultar la actividad reciente y la bitácora de accesos.

Los permisos se verifican en el backend. La interfaz no ofrece a Bodega las secciones de reportes y actividad. La aplicación actual no incluye edición ni eliminación de lotes.

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

La bitácora muestra eventos de autenticación y acciones relevantes guardados por el backend, como inicios de sesión correctos o fallidos, cierres de sesión y creación de lotes. Gerencia puede consultar los últimos cien eventos. No es un registro de turnos laborales.

## Datos y alcance local

La base SQLite es local al computador y no sincroniza automáticamente con otras instalaciones. Para que varias personas compartan la misma información, el backend y la base tendrían que estar alojados en un servidor accesible para ellas. El frontend por sí solo no comparte la base.

Las contraseñas se almacenan como SHA-256 con una sal aleatoria individual, según la decisión del proyecto; no se guarda la contraseña en claro en SQLite. Las contraseñas sí aparecen en texto claro en el archivo de credenciales, que debe mantenerse privado y no publicarse.
