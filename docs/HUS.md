# Historias de usuario — Control de vencimientos

## Contexto y alcance

Aplicativo independiente de Cafés del Pacífico S.A.S. para que Bodega y logística registren fechas de tueste y vencimiento por lote, y Gerencia consulte cuáles lotes están vigentes o vencidos. Este documento traduce la auditoría entregada a requisitos de interfaz.

El proyecto es exclusivamente un frontend estático. No tiene servidor, autenticación real, persistencia, protección de datos ni bitácora durable. Las interacciones se ejecutan localmente y se reinician al recargar.

## Roles

- **Bodega y logística:** registrar lotes y consultar sus estados de demostración.
- **Gerencia:** consultar lotes y reportes visuales.
- **Responsable del aplicativo:** rol conceptual de administración; el informe no define consola ni permisos administrativos específicos.

## HU-01 — Ingresar a la pantalla de acceso

**Como** integrante de Bodega y logística o Gerencia, **quiero** identificarme en la pantalla de ingreso, **para** acceder al espacio de trabajo de mi perfil.

**Criterios de aceptación**

1. Presenta usuario/correo, contraseña, mostrar/ocultar contraseña y acción de ingreso.
2. Si faltan campos, informa cuáles completar antes de continuar.
3. El error de acceso es genérico; no revela si el usuario o contraseña eran incorrectos.
4. Los errores se anuncian y el formulario muestra un estado de bloqueo ilustrativo.
5. Hay un acceso de demostración para explorar ambos perfiles sin presentarlo como validación real.
6. La pantalla indica que el prototipo no verifica credenciales ni protege datos.

**Verificación manual:** enviar campos vacíos, credenciales de ejemplo y entrar mediante ambos perfiles demo.

## HU-02 — Explorar el tablero según el perfil

**Como** usuario de demostración, **quiero** ver las opciones asociadas a Bodega y logística o Gerencia, **para** entender la separación funcional esperada.

**Criterios de aceptación**

1. El tablero muestra el perfil seleccionado.
2. Bodega y logística puede abrir el registro de lotes.
3. Gerencia puede consultar los lotes y reportes.
4. La navegación permite ver resumen, lotes y actividad ilustrativa.
5. Se aclara que ocultar opciones en el cliente no constituye autorización técnica.

**Verificación manual:** explorar los perfiles y comparar sus opciones visibles.

## HU-03 — Registrar un lote

**Como** integrante de Bodega y logística, **quiero** introducir los datos de un lote, **para** ilustrar el registro de tueste y vencimiento.

**Criterios de aceptación**

1. El formulario solicita identificador, nombre del café, origen, fecha de tueste, fecha de vencimiento y cantidad.
2. Los campos obligatorios no pueden enviarse vacíos.
3. La fecha de vencimiento debe ser posterior a la de tueste.
4. Un lote correcto aparece en la tabla durante la sesión y se confirma visualmente.
5. El estado se muestra como vigente o vencido según las fechas del navegador.
6. Se identifica el alta como demostrativa y no persistente.

**Verificación manual:** probar campos vacíos, fechas invertidas y un lote válido; recargar para confirmar que no persiste.

## HU-04 — Consultar lotes y vencimientos

**Como** integrante de Gerencia, **quiero** consultar los lotes y distinguir los vigentes de los vencidos, **para** revisar el estado del inventario.

**Criterios de aceptación**

1. La tabla presenta identificador, café/origen, fechas de tueste y vencimiento, cantidad y estado.
2. El estado usa texto y un indicador visual, no solo color.
3. La búsqueda encuentra por identificador, café u origen.
4. El filtro permite consultar todos los estados, vigentes, próximos a vencer o vencidos.
5. Las tarjetas resumen reflejan el conteo de los lotes de ejemplo y agregados en sesión.
6. Se identifica que los datos son de muestra; no se afirma su exactitud operativa.

**Verificación manual:** combinar búsqueda y filtros y contrastar los totales con las filas.

## HU-05 — Representar intentos fallidos y bloqueo

**Como** responsable del aplicativo, **quiero** ver una respuesta de acceso fallido y un estado de bloqueo, **para** ilustrar los controles recomendados en la auditoría.

**Criterios de aceptación**

1. Enviar datos no vacíos en el formulario simula un intento no validado.
2. El mensaje no revela cuál dato habría sido correcto.
3. Tras tres intentos se muestra un bloqueo demostrativo y se explica cómo reiniciar la vista.
4. Se informa que el contador solo vive en memoria del navegador y no limita intentos reales.
5. El umbral de tres es una decisión visual de prototipo, no una política establecida por el informe.

**Verificación manual:** hacer tres intentos, confirmar el mensaje y recargar para reiniciar.

## HU-06 — Consultar actividad ilustrativa

**Como** usuario o responsable, **quiero** ver eventos recientes de ejemplo, **para** entender cómo podría presentarse la trazabilidad.

**Criterios de aceptación**

1. La actividad presenta actor, perfil, acción y hora ilustrativos.
2. Los accesos y fallos de la sesión se agregan a la vista local.
3. La interfaz identifica los eventos como demostrativos y no persistentes.
4. No se afirma que exista una bitácora de seguridad real.

**Verificación manual:** iniciar acceso demo, generar fallo y comprobar que ambos se muestran; recargar para confirmar que desaparecen.

## HU-07 — Usar el prototipo en móvil y escritorio

**Como** usuario, **quiero** que la interfaz se adapte a mi pantalla, **para** utilizar los flujos de demostración desde móvil o escritorio.

**Criterios de aceptación**

1. Login, tablero, formularios y tabla se adaptan a pantallas estrechas y amplias.
2. Los controles tienen etiquetas comprensibles y foco visible.
3. Los estados se comunican con texto además de color.
4. La tabla puede desplazarse horizontalmente en móvil sin desbordar la página.

**Verificación manual:** revisar visualmente a 375 px y en escritorio.

## Trazabilidad con auditoría

| Control / hallazgo | Representación en interfaz | Límite del frontend estático |
|---|---|---|
| 5.15 Control de acceso | Login y selector de perfil demo | No aplica una política de acceso |
| 5.16 Gestión de identidades | Campo de usuario y perfil visible | No administra cuentas |
| 5.17 Información de autenticación | Campo de contraseña y aviso; no se almacena | No existe hash ni almacenamiento de contraseña |
| 5.18 Derechos de acceso | Vistas diferenciadas por rol | No existe autorización técnica |
| 8.5 Autenticación segura | Error genérico y bloqueo ilustrativo | No hay autenticación, cifrado ni límite efectivo |
| H-01 Contraseña débil | No se usan credenciales reales | No se puede imponer política de contraseña sin autenticación |
| H-02 Credencial en cliente | El código no incorpora contraseñas de acceso | Todo frontend entregado al navegador es inspeccionable |
| H-03 Sin bloqueo de intentos | Se muestra un bloqueo simulado tras tres fallos | Reiniciable; no limita solicitudes reales |
| H-04 Sin trazabilidad | Lista local ilustrativa | No es una bitácora persistente ni evidencia de auditoría |

## Decisiones y datos pendientes

- La auditoría recomienda longitud y complejidad mínimas, pero no define sus valores. No se inventa una política real.
- El umbral de tres intentos sirve solo para ilustrar el estado de bloqueo; el informe no especifica cantidad ni duración.
- Los lotes son ficticios y sus fechas no representan inventario operativo.
- El informe está fechado el 2 de diciembre de 2026, fecha posterior a la fecha actual del entorno (23 de noviembre de 2026). La interfaz no presenta la fecha del informe como vigencia del sistema.
- El informe es un diagnóstico acotado al login, no una certificación ISO.
