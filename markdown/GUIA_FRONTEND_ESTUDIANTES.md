# Guía del frontend para estudiantes

Esta guía explica cómo está organizado el frontend actual y qué infraestructura ya puedes reutilizar para implementar la página de tareas. El proyecto conserva la autenticación, la navegación, el cliente HTTP, los componentes comunes y la administración de usuarios; la página de tareas, su CSS Module y su servicio deben ser creados como parte del ejercicio.

## 1. Antes de empezar

### Fuente de verdad del contrato

Consulta [`FRONTEND_IMPLEMENTATION.md`](./FRONTEND_IMPLEMENTATION.md) antes de implementar llamadas al backend. Ese documento define los endpoints, los DTO, las validaciones, los parámetros de consulta y las respuestas. Si esta guía y el backend difieren, prevalece el contrato del backend.

No inventes campos como prioridad, fecha límite, propietario o estado adicional: el modelo de tarea disponible solo contempla título, descripción, estado de completado e información de creación.

### Tecnologías y convenciones

- React con JavaScript y componentes funcionales.
- Vite como servidor de desarrollo y herramienta de build.
- React Router DOM para navegación.
- Axios a través de un cliente compartido.
- CSS Modules para estilos de página.
- Estado local con hooks de React, principalmente `useState` y `useEffect`.
- No se requiere instalar otra dependencia para implementar la página.

## 2. Preparar y ejecutar el proyecto

Desde la carpeta raíz del frontend:

```bash
npm install
npm run dev
```

El frontend usa `http://localhost:8080` como URL predeterminada del backend. Se puede configurar en `.env.development` o `.env.production`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

También existe `.env.example` como referencia. Las variables `VITE_*` se incluyen en el código que llega al navegador; no guardes secretos en ellas.

Comandos disponibles:

```bash
npm run dev       # Servidor local de Vite
npm run lint      # Revisión estática con Oxlint
npm run build     # Build de producción
npm run preview   # Previsualizar el build local
```

El backend debe estar iniciado y configurado para aceptar el origen local de Vite, normalmente `http://localhost:5173`.

## 3. Mapa del frontend actual

```text
src/
├── App.jsx
├── main.jsx
├── index.css
├── components/
│   ├── common/
│   │   ├── Alert.jsx                 # Mensajes de estado/error
│   │   ├── Alert.module.css
│   │   ├── Button.jsx                # Botón con variantes
│   │   ├── Button.module.css
│   │   ├── Card.jsx                  # Contenedor visual
│   │   ├── Card.module.css
│   │   ├── Input.jsx                 # Campo de formulario
│   │   ├── Input.module.css
│   │   ├── Modal.jsx                 # Diálogo accesible
│   │   └── Modal.module.css
│   └── layout/
│       ├── Footer.jsx
│       ├── Footer.module.css
│       ├── Header.jsx
│       ├── Header.module.css
│       └── ProtectedRoute.jsx
├── hooks/
│   ├── authContext.js
│   └── useAuth.jsx
├── pages/
│   ├── ChangePassword/
│   ├── Dashboard/
│   ├── Forbidden/
│   ├── Login/
│   ├── NotFound/
│   ├── Register/
│   └── Users/
├── routes/
│   ├── Routes.module.css
│   └── index.jsx
├── services/
│   ├── api.js                        # Cliente Axios e interceptors
│   ├── authService.js
│   └── userService.js                # Ejemplo de service CRUD existente
└── utils/
    └── tokenManager.js

markdown/
├── FRONTEND.md
├── FRONTEND_IMPLEMENTATION.md        # Contrato del backend para el cliente
└── INFORME_REVISION_CODIGO.md
```

### Archivos que debe crear el estudiante

Mantén el patrón de carpeta por página:

```text
src/
├── pages/
│   └── Tasks/
│       ├── Tasks.jsx
│       └── Tasks.module.css
└── services/
    └── taskService.js
```

No es necesario crear un nuevo cliente Axios, un nuevo hook de autenticación ni instalar un gestor de estado.

## 4. Qué hace cada zona importante

| Ubicación                                  | Responsabilidad                                                     | Cómo aprovecharla                                            |
| ------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/routes/index.jsx`                     | Declara las rutas y aplica los wrappers de autenticación/rol        | Agrega aquí el import y la ruta de tareas                    |
| `src/components/layout/Header.jsx`         | Menú principal                                                      | Agrega un enlace a `/tasks` para usuarios autenticados       |
| `src/components/layout/ProtectedRoute.jsx` | Espera la sesión, requiere login y opcionalmente rol admin          | Envuelve `/tasks` con `<ProtectedRoute>` sin `requireAdmin`  |
| `src/hooks/useAuth.jsx`                    | Contexto de sesión, usuario, login/logout y estado de autenticación | No dupliques la lógica de sesión en la página                |
| `src/services/api.js`                      | Base URL, encabezados, bearer token y refresh automático            | Importa su `apiClient` en el service nuevo                   |
| `src/services/userService.js`              | Ejemplo de funciones API separadas de la UI                         | Sigue el patrón de métodos que retornan `response.data`      |
| `src/components/common/`                   | Input, Button, Card, Alert y Modal reutilizables                    | Prefiérelos a recrear controles equivalentes                 |
| `src/index.css`                            | Reset y estilos base globales                                       | Usa el CSS Module para los estilos particulares de tareas    |
| `.env.development`                         | URL local del backend                                               | Cambia el valor solo si el backend se ejecuta en otro origen |

### Componentes comunes disponibles

- `Button`: acepta `children`, `variant`, `type`, `disabled`, `onClick` y `className`. Variantes existentes: `primary`, `secondary`, `danger`, `success` y `outline`. El `type` predeterminado es `button`; usa `type="submit"` en formularios.
- `Input`: acepta `label`, `type`, `value`, `onChange`, `placeholder`, `error`, `disabled`, `className` y `name`. Pasa siempre un `name` para asociar etiqueta e input.
- `Card`: recibe `children` y `className`.
- `Alert`: recibe `type`, `message` y opcionalmente `onClose`. Tipos disponibles: `info`, `success`, `warning` y `error`.
- `Modal`: recibe `isOpen`, `onClose`, `title` y `children`. Ya gestiona cierre con Escape, foco y clic en el fondo.

Los componentes están en `src/components/common/`; sus hojas CSS Module están junto a cada componente.

## 5. Integración de la ruta

La ruta `/tasks` fue retirada intencionalmente para que el estudiante la cree. El fallback `*` existente muestra la página 404 hasta agregarla.

En `src/routes/index.jsx`:

1. Importa la nueva página:

   ```jsx
   import Tasks from "../pages/Tasks/Tasks";
   ```

2. Agrega una ruta protegida dentro de `<Routes>`:

   ```jsx
   <Route
     path="/tasks"
     element={
       <ProtectedRoute>
         <Tasks />
       </ProtectedRoute>
     }
   />
   ```

No pases `requireAdmin`: la lista y las operaciones de tareas corresponden al usuario autenticado y el backend limita automáticamente los resultados al propietario.

En `src/components/layout/Header.jsx`, agrega un `<Link to="/tasks">` dentro del bloque que solo se renderiza cuando `isAuthenticated` es verdadero. No modifiques el flujo de login, registro, logout ni la protección de `/users`.

## 6. Cliente HTTP y service de tareas

### Cliente Axios existente

En `src/services/api.js` ya se crea el cliente con base URL:

```text
VITE_API_BASE_URL + /api
```

Por eso, las llamadas del service deben usar rutas como `/tasks`, no `/api/tasks` ni la URL completa. El cliente ya agrega el access token y se encarga de renovar la sesión ante un `401` cuando corresponde. No agregues otro interceptor en la página.

### Crear `src/services/taskService.js`

Separa las llamadas HTTP de los componentes. El patrón coincide con `src/services/userService.js`:

```js
import apiClient from "./api";

getTasks;
getTask(id);
createTask(taskData);
updateTask(id, taskData);
deleteTask(id);
```

Estas funciones representan el contrato actual; no envíes `userId`. El backend deriva el usuario propietario de la sesión autenticada. Las respuestas `204 No Content` no tienen cuerpo; por eso `deleteTask` no debe intentar retornar `response.data`.

## 7. Contrato funcional de tareas

Usa [`FRONTEND_IMPLEMENTATION.md`](./FRONTEND_IMPLEMENTATION.md) para los detalles completos. Este resumen ayuda a implementar la interfaz sin inventar comportamiento:

### Modelo

```js
{
  id: 42,
  title: 'Preparar informe',
  description: 'Revisar los datos',
  completed: false,
  createdAt: '2026-10-06T12:00:00'
}
```

- `id` y `createdAt` los genera el servidor.
- `description` puede ser `null`.
- `completed` es el único estado.
- No envíes `id` ni `createdAt` al crear o actualizar.
- La fecha no garantiza zona horaria; no la presentes como UTC sin conversión justificada.

### Operaciones

| Acción de UI          | Método y ruta                    | Resultado                          |
| --------------------- | -------------------------------- | ---------------------------------- |
| Crear                 | `POST /api/tasks`                | `201`, devuelve la tarea           |
| Listar/buscar/filtrar | `GET /api/tasks`                 | `200`, devuelve página             |
| Consultar una tarea   | `GET /api/tasks/{id}`            | `200`, devuelve tarea              |
| Editar                | `PUT /api/tasks/{id}`            | `200`, devuelve tarea actualizada  |
| Completar             | `PATCH /api/tasks/{id}/complete` | `200`, establece `completed: true` |
| Eliminar              | `DELETE /api/tasks/{id}`         | `204`, sin cuerpo                  |

El cliente Axios añade `/api` a la ruta relativa del service.

### Cuerpos de solicitud

Creación:

```js
{
  title: 'Preparar informe',
  description: 'Revisar los datos',
  completed: false
}
```

El backend fuerza `completed` a `false` al crear; envíalo igualmente como `false`.

Actualización (`PUT` reemplaza los campos editables):

```js
{
  title: 'Preparar informe final',
  description: 'Revisar y compartir los datos',
  completed: false
}
```

Incluye el valor actual de `completed`, incluso si solo cambias el título o la descripción. Para desmarcar una tarea completada no hay endpoint específico: usa `PUT` con todos los campos editables y `completed: false`.

## 8. Búsqueda, filtros, orden y paginación

`GET /tasks` acepta estos parámetros:

| Parámetro   | Uso                  | Reglas                                               |
| ----------- | -------------------- | ---------------------------------------------------- |
| `page`      | Página solicitada    | Base cero; valor inicial `0`                         |
| `size`      | Elementos por página | De 1 a 100; predeterminado 20                        |
| `q`         | Texto de búsqueda    | Busca parcialmente en título y descripción; opcional |
| `completed` | Filtrar estado       | `true` o `false`; opcional                           |
| `sort`      | Campo de orden       | `createdAt`, `title` o `completed`                   |
| `dir`       | Dirección            | `asc` o `desc`; predeterminado `desc`                |

La respuesta es un objeto paginado, no un arreglo:

```js
{
  items: [/* tareas de la página */],
  page: 0,
  size: 20,
  totalItems: 1,
  totalPages: 1
}
```

Usa los valores devueltos por el backend para actualizar la lista y la paginación. `totalPages` puede ser `0` cuando no hay resultados. El backend acepta una página fuera de rango y responde con `items: []`; considera corregir la página si se borró el último elemento de la última página.

Al enviar `q`, utiliza el parámetro de Axios (`{ params }`) para que espacios y caracteres especiales se codifiquen correctamente. Reinicia `page` a `0` cuando cambie la búsqueda o el filtro.

## 9. Validaciones de formularios

Valida antes de hacer la solicitud para dar feedback inmediato; el backend sigue siendo la autoridad final.

| Campo         | Regla                                                   |
| ------------- | ------------------------------------------------------- |
| `title`       | Obligatorio, no vacío, mínimo 3 y máximo 100 caracteres |
| `description` | Opcional; máximo 500 caracteres                         |
| `completed`   | Booleano; debe enviarse siempre al actualizar           |

Al presentar un error del backend, puede haber varios mensajes en `error.response.data.details`. No dependas de que siempre exista un mensaje ni de asociar cada texto a un campo; muestra un mensaje general alternativo cuando la respuesta no tenga detalles legibles.

## 10. Diseño recomendado de la página

Implementa en `Tasks.jsx` una página que gestione su propio estado:

- Colección actual de tareas.
- Estado de carga inicial y de carga de acciones.
- Error de lectura o escritura.
- Parámetros de paginación, filtros y orden.
- Estado del formulario y errores de validación.
- Estado del modal y la tarea en edición (si usas modal).

Un flujo mantenible puede ser:

1. Al montar la página o cambiar los parámetros, pedir la página actual desde `getTasks`.
2. Mostrar un indicador o mensaje mientras se carga.
3. Mostrar errores y ofrecer una acción de reintento cuando la petición falla.
4. Al crear/editar/eliminar/completar, mostrar el resultado y sincronizar la lista o volver a cargarla.
5. Deshabilitar acciones durante una solicitud para evitar envíos duplicados.
6. Al cerrar o reiniciar un formulario, limpiar sus errores y datos temporales.

Mantén las operaciones HTTP en el service y la interacción/estado visual en la página. No captures errores silenciosamente: presenta feedback claro y conserva la posibilidad de reintentar.

## 11. CSS Modules y estilos

En `Tasks.jsx`, importa el módulo local:

```jsx
import styles from "./Tasks.module.css";
```

Aplica clases mediante `styles.nombreDeClase`:

```jsx
<section className={styles.container}>
  <h1 className={styles.title}>Tareas</h1>
</section>
```

Define los estilos de la página en `Tasks.module.css`, no en `index.css`. Los selectores de CSS Modules quedan aislados para esta página. El archivo `src/index.css` ya define reset, fuente, colores base y estilos globales básicos. Para conservar coherencia, reutiliza `Card`, `Button`, `Input`, `Alert` y `Modal`.

Verifica que la vista se pueda usar en pantallas angostas: formularios y acciones deben poder ajustarse o apilarse; no dependas de un ancho fijo para la tabla/lista.

## 12. Manejo de errores y seguridad

- Los errores Axios suelen estar en `error.response.data.details`.
- Diferencia el estado de error del estado vacío: una lista sin resultados no es un fallo.
- `401` en rutas protegidas se procesa con el interceptor de sesión; no implementes otro refresh en `Tasks`.
- `403` significa que el usuario no tiene permisos; no reintentes automáticamente la misma acción.
- `404` puede significar que una tarea se eliminó o no pertenece al usuario.
- No registres tokens ni contraseñas en consola.
- No almacenes información de autenticación en la página.
- No solicites ni envíes el propietario de la tarea.
- No envíes `createdAt` en payloads de creación/actualización.

La autorización del frontend mejora la navegación, pero el backend es quien protege realmente los datos y verifica la propiedad de cada tarea.

## 13. Verificación de entrega

Antes de dar por terminada la implementación:

- [ ] `src/pages/Tasks/Tasks.jsx` existe y exporta un componente React funcional.
- [ ] `src/pages/Tasks/Tasks.module.css` contiene los estilos propios de la página.
- [ ] `src/services/taskService.js` usa el `apiClient` existente.
- [ ] Las seis operaciones del contrato están disponibles o la interfaz cubre las que se solicitan.
- [ ] La lista procesa `items` y los metadatos de paginación.
- [ ] Búsqueda, filtro, orden y paginación usan los nombres y valores del contrato.
- [ ] `PUT` envía el conjunto completo de campos editables.
- [ ] Los errores, la carga, el estado vacío y las acciones exitosas tienen feedback visual.
- [ ] La ruta `/tasks` queda protegida para usuarios autenticados, sin requerir rol admin.
- [ ] El encabezado permite llegar a `/tasks` cuando se inició sesión.
- [ ] La interfaz funciona en escritorio y móvil.
- [ ] `npm run lint` termina correctamente.
- [ ] `npm run build` termina correctamente.
