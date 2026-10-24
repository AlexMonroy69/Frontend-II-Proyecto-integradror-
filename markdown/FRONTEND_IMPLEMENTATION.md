# Guía de implementación del frontend

Este documento describe el contrato disponible en el backend `todo-app` para que el equipo de frontend pueda implementar el cliente web. Se basa en los controladores, DTO, validaciones y configuración actuales del servicio.

## Contenido

- [Resumen de integración y sesión](#1-resumen-de-integración)
- [Funcionalidad disponible y límites](#2-funcionalidad-que-soporta-la-api)
- [Modelos y paginación](#3-modelos-y-formatos)
- [Registro, login y sesión](#4-autenticación)
- [Endpoints y consultas de tareas](#5-endpoints-de-tareas)
- [Endpoints de usuarios](#6-endpoints-de-usuarios-administración)
- [Validaciones](#7-validaciones-para-formularios)
- [Errores HTTP](#8-errores-y-estados-http)
- [Flujos de interfaz y seguridad](#9-flujos-de-interfaz-recomendados)
- [Ejemplos HTTP](#10-ejemplos-http-completos)
- [Decisiones de producto pendientes](#11-información-pendiente-de-definición-de-producto)
- [Referencias](#12-referencias-de-implementación-del-backend)

## 1. Resumen de integración

| Elemento                           | Valor                                   |
| ---------------------------------- | --------------------------------------- |
| URL local del backend              | `http://localhost:8080`                 |
| Prefijo REST                       | `/api`                                  |
| Formato                            | JSON (`Content-Type: application/json`) |
| Autenticación                      | JWT en `Authorization: Bearer <token>`  |
| Origen CORS configurado localmente | `http://localhost:5173`                 |
| Swagger UI                         | `http://localhost:8080/swagger-ui.html` |
| OpenAPI                            | `http://localhost:8080/api-docs`        |

Configurar la URL del backend mediante una variable de entorno del frontend, por ejemplo `API_BASE_URL=http://localhost:8080`; no concatenar rutas de API por toda la aplicación. En proyectos Vite puede exponerse mediante una variable `VITE_API_BASE_URL`.

El backend permite un único origen CORS, configurable con `CORS_ALLOWED_ORIGIN`. Si el frontend se ejecuta en otro host o puerto, el entorno del backend debe autorizar exactamente ese origen. Se permiten los métodos `GET`, `POST`, `PUT`, `PATCH`, `DELETE` y `OPTIONS`, y los encabezados `Authorization`, `Content-Type` y `Accept`. No enviar cookies ni habilitar `credentials`; la autenticación es por bearer token.

### Contrato actualmente implementado

El backend ofrece access JWT de 1 hora y refresh token opaco con vigencia renovable de 24 horas. Login, registro y refresh responden con `token` (access JWT), `type: "Bearer"`, `refreshToken`, `expiresInSeconds`, `id`, `username`, `email` y `role`. Los tokens se intercambian en JSON, sin cookies. `expiresInSeconds` refleja la configuración efectiva del access token; localmente es `3600`.

| Método | Ruta                       | Solicitud                                            | Resultado                                                      |
| ------ | -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| `GET`  | `/api/auth/me`             | Access JWT                                           | Perfil `id`, `username`, `email`, `role`                       |
| `POST` | `/api/auth/refresh`        | `{ "refreshToken": "..." }`                          | Nuevo access JWT y refresh token rotado                        |
| `POST` | `/api/auth/logout`         | `{ "refreshToken": "..." }`                          | `204`; revoca la sesión actual de inmediato                    |
| `PUT`  | `/api/account/password`    | `{ "currentPassword": "...", "newPassword": "..." }` | `204`; revoca todas las sesiones propias                       |
| `PUT`  | `/api/users/{id}/password` | `{ "newPassword": "..." }`, ADMIN                    | `204`; fija contraseña final y revoca las sesiones del usuario |

Guarda el refresh token en `sessionStorage`: sobrevive a recargas y desaparece al cerrar la pestaña, pero es accesible a JavaScript y requiere mitigaciones XSS. No registrar tokens en logs/telemetría. Cada refresh rota el token; la reutilización de uno anterior revoca toda la sesión. Implementa refresh single-flight para que peticiones concurrentes compartan una única renovación. El access JWT lleva un identificador de sesión y el backend verifica su estado en cada petición protegida.

El refresh token es la única credencial que la guía prescribe guardar en `sessionStorage`; conserva el access token en memoria. Al recargar la aplicación, usa el refresh almacenado para obtener una pareja nueva antes de consultar el perfil.

`POST /api/auth/refresh` no requiere encabezado de access token: envía `{ "refreshToken": "<refresh-token-actual>" }` como JSON. Si tiene éxito (`200`), responde con el mismo `AuthResponse` de login, incluyendo el nuevo refresh token, y se debe sustituir el anterior de inmediato. Si es inválido, expiró o ya se usó, responde `401` sin cuerpo; el reuso revoca la sesión. La vigencia de 24 horas es desde el último refresh exitoso; tras 24 horas sin renovar, el usuario debe iniciar sesión otra vez.

`POST /api/auth/logout` recibe el refresh token actual en JSON y siempre responde `204 No Content`; revoca la sesión si el token corresponde a una sesión conocida. El cliente debe borrar sus credenciales locales tras la respuesta. Cada login o registro crea una sesión distinta; cerrar una no cierra las otras sesiones del usuario.

El cambio propio de contraseña (`PUT /api/account/password`) requiere access JWT y recibe:

```json
{
  "currentPassword": "clave-actual",
  "newPassword": "clave-nueva"
}
```

La contraseña actual incorrecta produce `401` con cuerpo de error y no invalida la sesión vigente; mostrar error en el formulario sin cerrar sesión. Una nueva contraseña con menos de 8 caracteres produce `400`. El éxito es `204` sin cuerpo y revoca todas las sesiones, incluida la actual: borrar tokens y enviar al usuario a iniciar sesión de nuevo.

Listados usan `page` base cero (default 0), `size` default 20 y máximo 100, búsqueda parcial `q`, `sort` y `dir=asc|desc`. Tareas: `createdAt|title|completed`, default `createdAt` descendente, con filtro opcional `completed`; usuarios: `username|email`, default `username` ascendente. `sort` y `dir` son parámetros separados. Respuesta `{ items, page, size, totalItems, totalPages }`. Los sorts no permitidos responden 400; el backend agrega `id` ascendente como desempate estable.

## 2. Funcionalidad que soporta la API

- Registro e inicio de sesión.
- Crear, listar, consultar, editar, completar y eliminar las tareas del usuario autenticado.
- Administración de usuarios, disponible únicamente para usuarios con rol `ADMIN`.
- Las operaciones de tareas siempre están limitadas al propietario autenticado; no se debe enviar un `userId` para seleccionar al propietario.

La API soporta paginación y búsqueda en ambos listados, perfil autenticado, logout y renovación rotatoria. El listado de tareas está filtrado por propietario antes de buscar y paginar.

**Recuperación de contraseña por correo está fuera del alcance y no debe implementarse en el frontend.** No hay flujo ni endpoints de recuperación. Las únicas opciones disponibles son cambiar la propia contraseña desde el perfil autenticado o que un `ADMIN` establezca una nueva contraseña para un usuario.

El backend tampoco ofrece edición de perfil propio, cierre de todas las sesiones desde un endpoint, listado global de tareas para `ADMIN`, ni atributos de tarea como prioridad, vencimiento o fecha de actualización. No construir controles de interfaz que dependan de esos datos o acciones.

## 3. Modelos y formatos

### Usuario autenticado

```ts
type AuthResponse = {
  token: string; // access JWT
  type: "Bearer";
  refreshToken: string;
  expiresInSeconds: number;
  id: number;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
};

type CurrentUser = {
  id: number;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
};

type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

type ErrorResponse = {
  timestamp: string;
  status: number;
  error: string;
  details: string[];
};
```

Registro, login y refresh incluyen el rol en la respuesta. `expiresInSeconds` es el tiempo de vida del access JWT, en segundos, y no del refresh token. El registro público asigna `USER`; el cliente no puede solicitar `ADMIN`. El perfil actual está disponible en `GET /api/auth/me`, que es la fuente recomendada para leer el rol al inicializar la interfaz. No decodificar el JWT para obtener autorización.

### Tarea

```ts
type Task = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string; // fecha/hora ISO local, sin zona horaria garantizada
};
```

`id` y `createdAt` los genera el servidor. El campo `createdAt` es de solo lectura; no incluirlo al crear o editar. La fecha viene como `LocalDateTime`, no como instante UTC con offset. El cliente debe evitar asumir una zona horaria que la respuesta no expresa.

La tarea no incluye `ownerId`, `updatedAt`, fecha límite, prioridad ni estados adicionales: el estado se representa únicamente con `completed`.

### Usuario de administración

```ts
type User = {
  id: number;
  username: string;
  email: string;
};
```

Las respuestas nunca incluyen la contraseña.

El DTO de la colección administrativa `User` no incluye `role`; el rol está disponible en `AuthResponse` y `CurrentUser`.

`GET /api/auth/me` devuelve:

```json
{
  "id": 42,
  "username": "ana",
  "email": "ana@example.com",
  "role": "USER"
}
```

`ErrorResponse.timestamp` también se serializa como fecha/hora local sin zona horaria garantizada.

### Página de resultados

`page` comienza en cero. El tamaño debe ser de 1 a 100; si se omite, el backend usa 20. `totalItems` es el total luego de aplicar propietario/filtros/búsqueda, `totalPages` puede ser cero si no hay resultados, y una página fuera del rango devuelve `items: []` conservando los totales.

```json
{
  "items": [
    {
      "id": 42,
      "title": "Preparar informe",
      "description": "Revisar los datos",
      "completed": false,
      "createdAt": "2026-10-06T12:00:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

## 4. Autenticación

### Registro

`POST /api/auth/register` — público; responde `201 Created` con `AuthResponse`.

```json
{
  "username": "ana",
  "email": "ana@example.com",
  "password": "una-clave-segura"
}
```

El backend crea un usuario con rol `USER` y devuelve access JWT y refresh token de inmediato, por lo que el cliente puede iniciar la sesión sin una segunda llamada.

### Inicio de sesión

`POST /api/auth/login` — público; responde `200 OK` con `AuthResponse`.

```json
{
  "usernameOrEmail": "ana",
  "password": "una-clave-segura"
}
```

`usernameOrEmail` acepta el nombre de usuario o el correo electrónico.

Login y registro responden con esta estructura (los valores son ilustrativos):

```json
{
  "token": "<access-jwt>",
  "type": "Bearer",
  "refreshToken": "<refresh-token>",
  "expiresInSeconds": 3600,
  "id": 42,
  "username": "ana",
  "email": "ana@example.com",
  "role": "USER"
}
```

### Uso y ciclo de vida del token

En cada solicitud protegida enviar `Authorization: Bearer <token>`. El access JWT expira en una hora. Mantener su vencimiento local con `expiresInSeconds` y renovar usando `POST /api/auth/refresh` con `{ "refreshToken": "..." }`; persistir la pareja nueva antes de reanudar solicitudes protegidas. Serializa renovaciones concurrentes como single-flight: reutilizar el refresh anterior invalida la sesión completa y las siguientes solicitudes devuelven `401`.

Para cerrar sesión, llama `POST /api/auth/logout` con el refresh token actual; responde `204` y revoca solo esa sesión, invalidando sus access JWT de inmediato. Después elimina ambos tokens y el perfil local. Refresh/logout se intercambian en JSON, no cookies. El refresh token se almacena en `sessionStorage` (sobrevive recargas, se elimina al cerrar pestaña); por ser accesible desde JavaScript, minimizar exposición y proteger contra XSS. Nunca incluir tokens ni contraseñas en URL, logs o telemetría.

## 5. Endpoints de tareas

Todas las rutas requieren access JWT. La API devuelve únicamente las tareas del usuario autenticado y trata una tarea ajena como no encontrada (`404`). El listado acepta `page` (default 0), `size` (default 20; rango 1–100), `q` (búsqueda parcial insensible a mayúsculas en título y descripción), `completed=true|false`, `sort=createdAt|title|completed` (default `createdAt`) y `dir=asc|desc` (default `desc`). `q` se recorta en los extremos; si queda vacío, no filtra. Devuelve `PageResponse<Task>`; propietario y filtros se aplican en la consulta antes de paginar.

| Método   | Ruta                       | Acceso              | Éxito                          |
| -------- | -------------------------- | ------------------- | ------------------------------ |
| `POST`   | `/api/tasks`               | Usuario autenticado | `201 Created`, tarea           |
| `GET`    | `/api/tasks`               | Usuario autenticado | `200 OK`, `PageResponse<Task>` |
| `GET`    | `/api/tasks/{id}`          | Usuario autenticado | `200 OK`, tarea                |
| `PUT`    | `/api/tasks/{id}`          | Usuario autenticado | `200 OK`, tarea actualizada    |
| `PATCH`  | `/api/tasks/{id}/complete` | Usuario autenticado | `200 OK`, tarea completada     |
| `DELETE` | `/api/tasks/{id}`          | Usuario autenticado | `204 No Content`               |

Ejemplo para traer tareas incompletas que coincidan con “informe”, ordenadas por fecha reciente. Codificar `q` como query parameter (por ejemplo, mediante `URLSearchParams`) para manejar espacios y caracteres especiales:

```http
GET /api/tasks?page=0&size=20&q=informe&completed=false&sort=createdAt&dir=desc
Authorization: Bearer <access-token>
Accept: application/json
```

La respuesta es una página, no un arreglo JSON directo. Ordenamientos empatados se resuelven por `id` ascendente. `sort` inválido, `dir` distinto de `asc|desc`, `page` negativo o `size` fuera de rango responden `400`.

### Crear tarea

`POST /api/tasks`

```json
{
  "title": "Preparar informe",
  "description": "Revisar los datos de esta semana",
  "completed": false
}
```

Aunque el DTO acepta el campo `completed`, el servicio fuerza su valor a `false` al crear. El frontend debe enviar `false` explícitamente para ajustarse al contrato y no presentar la tarea como completada en la solicitud inicial.

### Actualizar tarea

`PUT /api/tasks/{id}` reemplaza los datos editables de la tarea. Enviar siempre el estado actual de `completed`; no usar `PUT` como si fuera una actualización parcial.

```json
{
  "title": "Preparar informe final",
  "description": "Revisar y compartir los datos",
  "completed": false
}
```

El identificador de la ruta determina qué tarea se actualiza. `id` y `createdAt` no se necesitan en el cuerpo.

### Completar y eliminar

- `PATCH /api/tasks/{id}/complete` no requiere cuerpo; establece `completed: true`. Es idempotente para una tarea que ya está completada.
- No existe un endpoint específico para descompletar; cambiar de `true` a `false` mediante `PUT` con los datos editables completos.
- `DELETE /api/tasks/{id}` responde `204` sin cuerpo. Tras un borrado exitoso, retirar la tarea del estado local o volver a cargar el listado.

## 6. Endpoints de usuarios (administración)

Todas las rutas requieren el rol `ADMIN`. Login/registro y `GET /api/auth/me` exponen el rol. El registro público asigna `USER`; el primer `ADMIN` se aprovisiona manualmente. Las respuestas de `/api/users` no incluyen contraseña ni rol.

| Método   | Ruta                       | Acceso  | Éxito                                               |
| -------- | -------------------------- | ------- | --------------------------------------------------- |
| `POST`   | `/api/users`               | `ADMIN` | `201 Created`, usuario                              |
| `GET`    | `/api/users`               | `ADMIN` | `200 OK`, `PageResponse<User>`                      |
| `GET`    | `/api/users/{id}`          | `ADMIN` | `200 OK`, usuario                                   |
| `PUT`    | `/api/users/{id}`          | `ADMIN` | `200 OK`, usuario actualizado                       |
| `DELETE` | `/api/users/{id}`          | `ADMIN` | `204 No Content`                                    |
| `PUT`    | `/api/users/{id}/password` | `ADMIN` | `204 No Content`; fija contraseña y revoca sesiones |

El listado acepta `page`, `size`, `q` (búsqueda parcial insensible a mayúsculas en username/email), `sort=username|email` (default `username`) y `dir=asc|desc` (default `asc`), con el mismo envelope paginado. `q` se recorta; vacío significa sin búsqueda. Ejemplo:

```http
GET /api/users?page=0&size=20&q=ana&sort=username&dir=asc
Authorization: Bearer <access-token-de-admin>
Accept: application/json
```

Crear requiere `username`, `email` y `password`; responde con `User` sin iniciar una sesión para la cuenta creada. Actualizar requiere `username` y `email`; el `{id}` de la ruta es el identificador autoritativo. La actualización de datos del usuario revoca sus sesiones. `PUT /api/users/{id}/password` recibe `{ "newPassword": "..." }` y establece la contraseña final, revocando todas las sesiones de la cuenta. No se puede eliminar un usuario con tareas asociadas (`409`).

## 7. Validaciones para formularios

Validar en el cliente para dar feedback inmediato, pero mantener el backend como autoridad final.

| Campo                       | Restricción                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `username`                  | Obligatorio, no vacío, de 3 a 50 caracteres                                                                 |
| `email`                     | Obligatorio, formato de correo válido, máximo 100 caracteres                                                |
| `password`                  | Obligatorio, mínimo 8 caracteres                                                                            |
| `usernameOrEmail`           | Obligatorio, no vacío                                                                                       |
| Título de tarea (`title`)   | Obligatorio, no vacío, de 3 a 100 caracteres                                                                |
| Descripción (`description`) | Opcional; máximo 500 caracteres                                                                             |
| Estado (`completed`)        | Booleano; enviar siempre al actualizar. `null` es inválido; si se omite, el DTO lo inicializa como `false`. |

Los nombres de usuario y correos deben ser únicos. El backend también evita que el username de una cuenta coincida con el email de otra, y viceversa. Puede reportar un duplicado como `400` o `409`, así que el cliente debe mostrar el mensaje de servidor sin vincular el tratamiento exclusivamente a uno de esos códigos.

## 8. Errores y estados HTTP

Los errores de aplicación manejados por el backend suelen tener esta forma:

```json
{
  "timestamp": "2026-10-06T12:00:00",
  "status": 400,
  "error": "Error de validación",
  "details": ["El título es obligatorio"]
}
```

`details` es una lista de mensajes legibles y puede contener varios errores. No contiene nombres de campos ni códigos estables de validación; mostrar mensajes junto al campo solo cuando puedan asociarse de forma fiable y usar un mensaje general como fallback. No depender del texto exacto para la lógica.

| Estado | Significado y respuesta del frontend                                                                                                                                                                                                                                  |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | Solicitud inválida o validación; mostrar errores y permitir corregir.                                                                                                                                                                                                 |
| `401`  | Login con credenciales inválidas, access JWT ausente/inválido/expirado o refresh inválido. En rutas de recursos, limpiar sesión si el access JWT es rechazado; excepciones: login, refresh y contraseña actual incorrecta en cambio propio (la sesión sigue vigente). |
| `403`  | Usuario autenticado sin rol requerido; mostrar acceso denegado, no repetir la misma solicitud.                                                                                                                                                                        |
| `404`  | Recurso inexistente o tarea que no pertenece al usuario; informar que ya no está disponible y actualizar la vista si aplica.                                                                                                                                          |
| `409`  | Conflicto con datos existentes o intento de borrar usuario con tareas; explicar la acción necesaria.                                                                                                                                                                  |
| `500`  | Error inesperado; mostrar mensaje genérico y permitir reintentar según la operación.                                                                                                                                                                                  |

Casos específicos que afectan el tratamiento de errores:

| Operación                   | Errores relevantes                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Registro                    | `400` validación/identificador ya usado; `409` conflicto de persistencia                                                  |
| Login                       | `400` cuerpo inválido; `401` credenciales incorrectas                                                                     |
| Refresh                     | `400` cuerpo ausente o refresh vacío; `401` token inválido, vencido, reutilizado o sesión revocada (respuesta sin cuerpo) |
| Logout                      | `400` refresh vacío; si el cuerpo es válido, responde `204` aunque el token no identifique una sesión activa              |
| Listados                    | `400` formato de parámetro incorrecto, página negativa, tamaño fuera de `1..100`, sort o dirección inválidos              |
| Crear/actualizar tarea      | `400` validación del cuerpo; `401` access JWT ausente o inválido                                                          |
| Tareas por ID / eliminar    | `400` ID con formato inválido; `404` si no existe o pertenece a otra cuenta                                               |
| Crear/actualizar usuario    | `400` validación o identificador ya usado; `404` al actualizar ID inexistente; `401`/`403` sin autorización admin         |
| Eliminar usuario            | `404` ID inexistente; `409` si tiene tareas; `401`/`403` sin autorización admin                                           |
| Rutas de administración     | `401` sin access JWT; `403` usuario sin rol `ADMIN`                                                                       |
| Cambio propio de contraseña | `400` validación; `401` contraseña actual incorrecta (con cuerpo de error, la sesión sigue activa); `204` éxito           |
| Cambio de contraseña admin  | `400` contraseña inválida; `403` sin `ADMIN`; `404` usuario no encontrado; `204` éxito                                    |

Importante: los errores de validación y de negocio suelen incluir el objeto descrito, pero no todos los errores de seguridad tienen cuerpo JSON. La respuesta a un `401` por falta de autenticación o JWT inválido y algunos `403` pueden venir vacíos. El cliente debe tolerar cuerpo ausente, JSON no parseable o `details` ausente y usar el estado HTTP como fuente para la acción.

Login fallido y contraseña actual incorrecta devuelven `ErrorResponse` con `401`; un access JWT rechazado por el filtro de seguridad devuelve `401` sin cuerpo. Refresh inválido, expirado o reutilizado también devuelve `401` sin cuerpo. Por eso no conviene cerrar sesión ante cualquier `401` globalmente: manejar por ruta y contexto. Logout responde `204` incluso si el refresh token ya no identifica una sesión activa.

Las solicitudes `DELETE` exitosas tienen cuerpo vacío por diseño. No intentar parsear JSON en respuestas `204`.

## 9. Flujos de interfaz recomendados

### Inicialización y sesión

1. Leer solo el refresh token desde `sessionStorage`; mantener el access token en memoria.
2. Si existe refresh token al cargar/reabrir la pestaña, solicitar `/api/auth/refresh`, guardar el refresh rotado en `sessionStorage` y mantener el access token nuevo en memoria. Si responde `401`, borrar el refresh y mostrar sesión cerrada.
3. Con access token vigente, solicitar `GET /api/auth/me` para cargar el perfil y rol actuales.
4. Ante `401` del access JWT en una llamada protegida, coordinar un único refresh, actualizar los tokens y reintentar la solicitud original una sola vez; no reintentar si refresh devuelve `401`. No tratar como expiración un `401` con error de credenciales en `/api/account/password`.
5. Ante logout, cambio de contraseña o refresh inválido/reutilizado, eliminar ambos tokens y el perfil local.
6. No enviar peticiones protegidas antes de inicializar el estado de autenticación.

### Tareas

- Al entrar a la pantalla de tareas, solicitar `GET /api/tasks` y representar estados de carga, lista vacía y error.
- Actualizar el listado tras crear, editar, completar o eliminar; considerar la respuesta de cada mutación como el estado confirmado por el servidor.
- Deshabilitar acciones duplicadas mientras una petición de mutación está en curso.
- Si un `404` ocurre durante una acción sobre tarea, actualizar el listado y notificar que la tarea ya no estaba disponible.

### Seguridad de datos

- Enviar credenciales y datos del usuario solo por HTTPS fuera de desarrollo local.
- No confiar en ocultar controles del frontend para proteger rutas; el backend aplica autorización.
- No incluir contraseña ni token en el estado persistido más allá de lo requerido, ni en registros/analítica.
- Escapar o renderizar como texto los títulos y descripciones; no interpretar contenido de usuario como HTML.

## 10. Ejemplos HTTP completos

Registro:

```http
POST /api/auth/register HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{"username":"ana","email":"ana@example.com","password":"una-clave-segura"}
```

Obtener tareas:

```http
GET /api/tasks HTTP/1.1
Host: localhost:8080
Accept: application/json
Authorization: Bearer <token>
```

El token se obtiene de `token` en la respuesta de registro o login. El valor del encabezado debe ser `Bearer`, un espacio y el token.

## 11. Información pendiente de definición de producto

El backend define el contrato de datos y seguridad, pero no decide las siguientes cuestiones propias del frontend. Se pueden implementar las pantallas principales de registro/login y tareas sin resolverlas:

- Framework, sistema de diseño, branding, idioma final y breakpoints responsive.
- Reglas de UX para formato de fecha y zona horaria, ya que `createdAt` no incluye zona.

## 12. Referencias de implementación del backend

- Controladores: `src/main/java/com/todo/presentation/controller/`
- DTO y validaciones: `src/main/java/com/todo/application/dto/`
- Manejo de errores: `src/main/java/com/todo/presentation/exception/`
- Seguridad JWT y CORS: `src/main/java/com/todo/infrastructure/security/SecurityConfig.java`
- Documentación interactiva: `/swagger-ui.html` y `/api-docs`
