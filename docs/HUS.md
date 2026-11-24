# Historias de usuario — Control de vencimientos

## Contexto y arquitectura

Aplicativo independiente de Cafés del Pacífico S.A.S. para que Bodega y logística registre fechas de tueste y vencimiento por lote, y Gerencia consulte lotes vigentes y vencidos.

El repositorio contiene dos partes desplegables como una aplicación monolítica: `src/` es el frontend Vite/React/TypeScript y `backend/` es la API Node.js. La API persiste usuarios, sesiones, lotes y actividad en SQLite local. `backend/db/schema.sql` define el esquema y el archivo SQLite se crea localmente al iniciar. Vite reenvía `/api` a la API en desarrollo para conservar la misma interfaz.

No hay registro público. Las cuentas las provisiona un operador local con rol definido. Los roles se validan en el servidor; ocultar acciones en React no constituye autorización.

## Requisito criptográfico acordado

Las contraseñas se almacenan como el resultado de SHA-256 directo de la contraseña. SHA-256 es un hash, no cifrado reversible. Se guardan el algoritmo y el resultado; nunca la contraseña ni un hash calculado en el navegador como sustituto de ella. SHA-256 es rápido y permite probar candidatos offline si se copia la base de datos; contraseñas iguales producen el mismo hash. Las cuentas creadas con el método anterior deben volver a provisionarse, ya que sus hashes no son compatibles.

## Roles

- **Bodega y logística:** iniciar sesión y registrar lotes.
- **Gerencia:** iniciar sesión, consultar todos los lotes, reportes y actividad de accesos.
- **Operador local:** crear cuentas con identidad y rol asignados; no hay formulario público de alta.

## HU-01 — Iniciar sesión con una cuenta individual

**Como** integrante de Bodega/logística o Gerencia, **quiero** autenticarme con mi cuenta individual, **para** ingresar a las funciones que corresponden a mi rol.

**Criterios de aceptación**

1. El formulario conserva el diseño actual y envía usuario/correo y contraseña a `POST /api/auth/login` por HTTPS en despliegue.
2. El servidor verifica la contraseña contra su hash SHA-256 y devuelve una cookie de sesión HttpOnly; el cliente nunca recibe ni persiste el hash.
3. Credenciales inválidas producen una respuesta genérica, sin indicar si la cuenta existe.
4. Una cuenta inactiva o bloqueada no obtiene sesión.
5. Cinco intentos fallidos consecutivos bloquean temporalmente la cuenta por 15 minutos; un ingreso correcto reinicia el contador. El límite se valida y persiste en servidor.
6. Se registra el resultado del inicio de sesión con fecha/hora y cuenta asociada cuando pueda identificarse, sin almacenar la contraseña.
7. La interfaz elimina el selector de rol demo y refleja el rol devuelto por el servidor.
8. No existe acceso de demostración que omita la autenticación.

**Verificación:** ingresar con cuenta habilitada, contraseña incorrecta, cuenta inexistente, cuenta bloqueada y perfil inactivo; revisar cookie y evento de auditoría.

## HU-02 — Cerrar y recuperar la sesión

**Como** usuario autenticado, **quiero** cerrar mi sesión y conservarla de forma segura durante su vigencia, **para** proteger el acceso en el dispositivo.

**Criterios de aceptación**

1. La sesión se valida en servidor y se almacena en SQLite; el navegador recibe solo un identificador en cookie HttpOnly, SameSite=Strict y Secure en producción.
2. La API expone `GET /api/auth/session` para restaurar sesión al cargar la página.
3. `POST /api/auth/logout` invalida la sesión del lado del servidor y limpia la cookie.
4. Las rutas privadas devuelven 401 si no hay sesión válida.
5. Inicio y cierre de sesión quedan registrados; expiración y cierre no muestran datos privados.

## HU-03 — Aplicar permisos por rol

**Como** responsable del aplicativo, **quiero** que cada rol se autorice en la API, **para** impedir operaciones fuera de sus funciones aunque se invoquen directamente los endpoints.

**Criterios de aceptación**

1. Todas las rutas privadas requieren sesión válida.
2. Bodega/logística puede crear lotes.
3. Gerencia puede consultar lotes, resumen y actividad.
4. Las acciones denegadas devuelven 403 y no modifican datos.
5. El perfil del cliente procede de la sesión autenticada, nunca de un rol enviado libremente por React.

## HU-04 — Registrar y persistir lotes

**Como** integrante de Bodega y logística, **quiero** registrar un lote con sus fechas, **para** mantener el inventario de vencimientos actualizado.

**Criterios de aceptación**

1. Se mantienen los campos actuales: identificador, nombre del café, origen, fecha de tueste, vencimiento y cantidad.
2. El servidor valida campos obligatorios, formato, identificador único y que el vencimiento sea posterior al tueste.
3. Solo Bodega/logística puede crear lotes.
4. La creación se guarda en SQLite y aparece tras recargar y volver a consultar.
5. El servidor calcula el estado del lote a partir de la fecha actual; no confía en el estado enviado por el cliente.
6. Las operaciones válidas se registran como eventos de auditoría sin datos de credenciales.

## HU-05 — Consultar lotes y reportes

**Como** integrante de Gerencia, **quiero** consultar todos los lotes y sus estados, **para** revisar cuáles están vigentes y vencidos.

**Criterios de aceptación**

1. `GET /api/lots` requiere sesión válida y devuelve datos persistidos para el tablero operacional. El endpoint `GET /api/reports/expiry` requiere rol Gerencia.
2. Búsqueda y filtros por estado pueden aplicarse en frontend sobre el resultado o mediante parámetros validados de API.
3. El resumen vigente/próximo/vencido coincide con los lotes y las fechas actuales.
4. Datos, estados y errores se muestran en la interfaz existente; se contemplan carga, error y lista vacía.
5. La interfaz no usa los lotes de muestra como información productiva.

## HU-06 — Mantener trazabilidad de accesos

**Como** Gerencia, **quiero** consultar una bitácora de autenticación, **para** revisar quién ingresó y cuándo y detectar intentos fallidos.

**Criterios de aceptación**

1. SQLite conserva éxitos y fallos de login, logout y creación de lote con hora del servidor, usuario cuando sea identificable, tipo de evento y resultado.
2. Nunca se guardan contraseñas, hashes de contraseña, cookies ni tokens en eventos.
3. `GET /api/activity` requiere rol Gerencia.
4. La actividad se conserva tras reiniciar el backend.
5. Una falla al registrar auditoría no debe revelar secretos al cliente.

## HU-07 — Gestionar cuentas localmente

**Como** operador local, **quiero** crear y desactivar cuentas con un rol, **para** controlar quién puede utilizar el aplicativo sin auto-registro público.

**Criterios de aceptación**

1. Una herramienta CLI local solicita correo/usuario, nombre, rol y contraseña sin eco en terminal.
2. La herramienta deriva y guarda solo el hash SHA-256 y el algoritmo.
3. Usuario/correo es único; rol solo acepta Bodega/logística o Gerencia.
4. No se exponen contraseñas ni hashes en listados, errores o logs.
5. No existe registro público. Las diez cuentas operativas iniciales y sus roles se documentan en `docs/CREDENCIALES_CUENTAS.md`; las contraseñas se deben cambiar y entregar a sus responsables antes de operar con datos reales.

## HU-08 — Ejecutar frontend y backend en el mismo repositorio

**Como** desarrollador, **quiero** iniciar frontend y API desde el mismo proyecto, **para** trabajar con una arquitectura monolítica local.

**Criterios de aceptación**

1. Scripts documentados instalan, ejecutan y construyen ambas partes.
2. Vite reenvía `/api` al backend en desarrollo.
3. La API valida datos y errores de forma consistente, usa consultas parametrizadas y no sirve la base de datos ni archivos secretos como estáticos.
4. La configuración distingue desarrollo y producción; errores internos no devuelven stack traces al navegador.
5. SQLite local se inicializa a partir del esquema SQL versionado; el archivo con datos no se versiona.

## HU-09 — Conservar presentación y adaptación visual

**Como** usuario, **quiero** conservar la presentación del login y del tablero, **para** usar una interfaz familiar mientras los datos pasan a ser reales.

**Criterios de aceptación**

1. Se conserva paleta, tipografía, estructura visual y diseño responsivo actuales.
2. Se reemplazan textos de “demostración” por estados reales de sesión, carga, error y confirmación.
3. Los estados de lotes se anuncian con texto además de color.
4. Login, lotes, filtros y vistas siguen utilizables en móvil y escritorio.

## Mapeo a auditoría

**Nota de estado:** las historias anteriores describen el comportamiento seguro previsto. La implementación activa es una configuración de laboratorio deliberadamente vulnerable para la demostración de auditoría y prevalece sobre esos criterios mientras se ejecute localmente. En el laboratorio: la CLI acepta contraseñas débiles y el hash continúa siendo SHA-256 directo sin sal; el frontend de desarrollo expone la credencial sintética `auditoria.lab` / `cafe123`; no hay bloqueo por intentos; la API requiere sesión pero no impone separación por rol; y no se registran eventos de login/logout. Los eventos de negocio, como `lot.create`, se conservan. No desplegar esta configuración.

| Control / hallazgo | Tratamiento funcional |
|---|---|
| 5.15 Control de acceso | Sesión obligatoria en rutas privadas; cuenta sintética para laboratorio |
| 5.16 Gestión de identidades | Cuenta individual provisionada y desactivable |
| 5.17 Información de autenticación | SHA-256 directo; riesgo elevado por ser rápido y permitir hashes iguales |
| 5.18 Derechos de acceso | La interfaz presenta roles, pero la API del laboratorio no los autoriza técnicamente |
| 8.5 Autenticación segura | No hay bloqueo de intentos; login/logout no se registran. SHA-256 directo permanece |
| H-01 Contraseña débil | Cuenta sintética débil con SHA-256 directo sin sal; resultado JtR pendiente de prueba |
| H-02 Credencial visible en cliente | Credencial sintética de laboratorio y validación parcial visibles en frontend de desarrollo |
| H-03 Sin límite de intentos | El backend no bloquea intentos de login |
| H-04 Sin trazabilidad | No se registran eventos de autenticación; permanecen eventos de negocio |

## Decisiones de implementación

- Base de datos local: SQLite; el SQL versionado es el esquema (`backend/db/schema.sql`) y los datos viven en un archivo `.sqlite` ignorado por Git.
- El laboratorio local deshabilita deliberadamente el bloqueo y la política mínima de contraseña para reproducir hallazgos. La CLI permite contraseñas débiles; el algoritmo se mantiene en SHA-256 directo sin sal.
- No hay registro público. El proyecto tiene diez cuentas operativas locales (dos de Gerencia y ocho de Bodega y logística), documentadas en `docs/CREDENCIALES_CUENTAS.md`. Las cuentas de demostración anteriores están desactivadas.
- La fecha del informe (2 de diciembre de 2026) es posterior a la fecha en que fue revisado inicialmente (23 de noviembre de 2026); no se usa como dato operativo.
