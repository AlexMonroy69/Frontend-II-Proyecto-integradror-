# Taller: CRUD básico de tareas

## 1. Propósito

Implementar una página de tareas en el frontend existente, conectada al backend y accesible para un usuario autenticado. El taller se enfoca en las cuatro operaciones CRUD:

- **Create:** crear una tarea.
- **Read:** listar las tareas del usuario.
- **Update:** editar una tarea.
- **Delete:** eliminar una tarea.

El estudiante debe crear la página, su CSS Module y el service de tareas, e integrar la página con las rutas y la navegación que ya existen.

## 2. Alcance del taller

### Incluido

- Consultar y mostrar la lista de tareas.
- Crear una tarea.
- Editar una tarea existente.
- Eliminar una tarea.
- Validar los campos antes de enviar.
- Mostrar estados de carga, lista vacía y errores.
- Proteger la página para que solo sea accesible con sesión iniciada.
- Usar el cliente Axios y los componentes existentes.
- Diseñar la página con CSS Modules.

### Fuera de alcance

No implementar en este taller:

- Paginación en la interfaz.
- Búsqueda o filtros.
- Ordenamiento.
- Controles para cambiar de página.
- Un botón separado de “completar tarea” que use el endpoint `PATCH`.
- Cambios de autenticación, configuración Axios o administración de usuarios.
- Nuevas dependencias.

El campo `completed` forma parte del modelo del backend. Al crear, se debe enviar `false`. Al editar, se debe conservar y enviar el valor actual para cumplir el contrato de `PUT`; no es necesario agregar una acción independiente para completar tareas en este taller.

## 3. Documentación de referencia

- [`FRONTEND_IMPLEMENTATION.md`](./FRONTEND_IMPLEMENTATION.md): contrato oficial del backend: endpoints, modelos, respuestas, validaciones y errores.
- [`GUIA_FRONTEND_ESTUDIANTES.md`](./GUIA_FRONTEND_ESTUDIANTES.md): mapa de archivos, recursos existentes y patrones del frontend.

Si esta actividad y cualquier ejemplo difieren del contrato del backend, usa el contrato de `FRONTEND_IMPLEMENTATION.md`.

## 4. Archivos que debe crear

```text
src/
├── pages/
│   └── Tasks/
│       ├── Tasks.jsx
│       └── Tasks.module.css
└── services/
    └── taskService.js
```

### `src/services/taskService.js`

Implementa aquí las funciones que comunican la aplicación con los endpoints de tareas. Separa las peticiones HTTP de la presentación y del estado React.

Funciones esperadas:

| Función                    | Petición                                                                   |
| -------------------------- | -------------------------------------------------------------------------- |
| `getTasks()`               | `GET /tasks`                                                               |
| `getTask(id)`              | `GET /tasks/{id}`; opcional si la edición usa la tarea que ya está cargada |
| `createTask(taskData)`     | `POST /tasks`                                                              |
| `updateTask(id, taskData)` | `PUT /tasks/{id}`                                                          |
| `deleteTask(id)`           | `DELETE /tasks/{id}`                                                       |

Importa el cliente Axios existente desde `./api`. No crees una instancia Axios nueva ni agregues `/api` a estas rutas: el cliente compartido ya tiene `/api` como prefijo.

Para ajustarse al patrón de los otros services, las funciones pueden devolver `response.data`. El método DELETE responde `204 No Content` y no tiene datos que la página necesite leer.

## 5. Archivos existentes que debe reutilizar

| Archivo o carpeta                          | Uso en el taller                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| `src/services/api.js`                      | Cliente Axios único, base URL, token de autenticación y renovación de sesión |
| `src/services/userService.js`              | Ejemplo de estructura y estilo para un service                               |
| `src/routes/index.jsx`                     | Registrar `/tasks` dentro de una ruta protegida                              |
| `src/components/layout/Header.jsx`         | Agregar el enlace de navegación a la página                                  |
| `src/components/layout/ProtectedRoute.jsx` | Proteger la página para usuarios autenticados                                |
| `src/components/common/Button.jsx`         | Acciones de crear, guardar, cancelar y eliminar                              |
| `src/components/common/Input.jsx`          | Campos del formulario                                                        |
| `src/components/common/Card.jsx`           | Contenedor visual reutilizable                                               |
| `src/components/common/Alert.jsx`          | Mensajes de éxito o error                                                    |
| `src/components/common/Modal.jsx`          | Opcional: formulario de crear/editar o confirmación                          |
| `src/index.css`                            | Estilos globales; no reemplaza los estilos propios del módulo                |

La página debe manejar su estado local con React. No dupliques el cliente HTTP, la autenticación ni el estado de sesión.

## 6. Contrato de tarea

Una tarea tiene este formato:

```js
{
  id: 42,
  title: 'Preparar informe',
  description: 'Revisar los datos',
  completed: false,
  createdAt: '2026-10-06T12:00:00'
}
```

- `id` y `createdAt` son generados por el backend.
- `description` puede ser `null`.
- `completed` es un booleano.
- No envíes `id` ni `createdAt` al crear o actualizar.
- No agregues propiedades que el backend no define, como prioridad o fecha límite.
- El backend determina el propietario usando la sesión autenticada. No envíes `userId`.

## 7. Operaciones y solicitudes

El cliente Axios tiene como base `VITE_API_BASE_URL + /api`; los paths indicados para el service son relativos a ese prefijo.

### 7.1 Read: listar tareas

```http
GET /api/tasks
```

Para este taller, llama el listado sin parámetros. El backend responde un objeto paginado aunque la actividad no implemente paginación:

```js
{
  items: [
    {
      id: 42,
      title: 'Preparar informe',
      description: 'Revisar los datos',
      completed: false,
      createdAt: '2026-10-06T12:00:00'
    }
  ],
  page: 0,
  size: 20,
  totalItems: 1,
  totalPages: 1
}
```

La interfaz debe mostrar el arreglo `items`. **No** debe construir controles ni estado para `page`, `size` o `totalPages`.

El backend usa por defecto la primera página (`page=0`) y un tamaño de 20 (`size=20`). Por lo tanto, sin paginación en el taller, el listado muestra como máximo esas primeras 20 tareas. Esta es una limitación conocida de la actividad, no un error que se deba resolver agregando controles de paginación.

### 7.2 Create: crear tarea

```http
POST /api/tasks
Content-Type: application/json
```

Cuerpo:

```json
{
  "title": "Preparar informe",
  "description": "Revisar los datos",
  "completed": false
}
```

El backend crea la tarea como no completada. Envía `completed: false` explícitamente.

### 7.3 Update: editar tarea

```http
PUT /api/tasks/{id}
Content-Type: application/json
```

Cuerpo:

```json
{
  "title": "Preparar informe final",
  "description": "Revisar y compartir los datos",
  "completed": false
}
```

`PUT` requiere los campos editables completos; no lo trates como una actualización parcial. Conserva el estado actual de `completed` al guardar una edición. No envíes `id` ni `createdAt` en el cuerpo.

### 7.4 Delete: eliminar tarea

```http
DELETE /api/tasks/{id}
```

El backend responde `204 No Content`. Después de eliminar, actualiza la lista local o vuelve a llamar `getTasks()` para sincronizar la vista.

## 8. Validaciones

Valida antes de enviar la solicitud y presenta el error cerca del formulario cuando sea posible:

| Campo         | Regla                                                        |
| ------------- | ------------------------------------------------------------ |
| `title`       | Obligatorio, no puede quedar vacío, entre 3 y 100 caracteres |
| `description` | Opcional, máximo 500 caracteres                              |

No reemplaces la validación del backend: si el servidor rechaza una solicitud, informa al usuario y permite corregirla.

## 9. Estados de interfaz y errores

La página debe comunicar claramente qué está ocurriendo:

- **Carga:** mientras se obtiene o actualiza información, muestra un indicador o texto de carga.
- **Lista vacía:** si la petición fue exitosa y `items` está vacío, presenta un mensaje como “No tienes tareas todavía”.
- **Error:** si falla una petición, informa que la operación no se pudo completar. No muestres una lista vacía como si la carga hubiera sido exitosa.
- **Acción en curso:** deshabilita temporalmente el botón correspondiente para evitar envíos repetidos.
- **Éxito:** al guardar o eliminar, actualiza la lista y confirma el resultado de forma visible.

Los errores HTTP pueden incluir mensajes en `error.response.data.details`. Puede haber más de uno o no haber ninguno; usa un mensaje alternativo claro cuando el servidor no proporcione detalles. No registres tokens ni contraseñas en consola.

## 10. Integración de la página

### Registrar la ruta

En `src/routes/index.jsx`:

1. Importa `Tasks` desde `../pages/Tasks/Tasks`.
2. Agrega `/tasks` dentro de `<Routes>`.
3. Envuelve `<Tasks />` con `<ProtectedRoute>`.
4. No actives `requireAdmin`: cualquier usuario autenticado debe trabajar con sus propias tareas.

La ruta `/tasks` actualmente no existe; mientras no se agregue, se mostrará la página 404 existente.

### Agregar el enlace

En `src/components/layout/Header.jsx`, agrega un enlace a `/tasks` en la navegación para usuarios autenticados. Mantén la condición existente de autenticación y no cambies los enlaces administrativos.

## 11. CSS Module

En `Tasks.jsx`, importa el módulo local:

```jsx
import styles from "./Tasks.module.css";
```

Usa clases del módulo, por ejemplo `styles.container` y `styles.title`. Coloca los estilos particulares de esta página en `Tasks.module.css`; evita agregar reglas específicas de tareas a `src/index.css`.

Reutiliza los estilos y controles comunes existentes. Comprueba que formulario, lista y botones sigan siendo utilizables en una pantalla angosta. No hace falta replicar el diseño de la administración de usuarios.

## 12. Verificación manual del taller

La verificación de esta actividad es una comprobación manual de los requisitos, no implica crear una suite de pruebas automatizadas.

1. Inicia el backend y el frontend.
2. Inicia sesión con un usuario regular.
3. Abre `/tasks` y confirma que la ruta está protegida y carga el estilo.
4. Comprueba el estado vacío o que aparecen las tareas devueltas en `items`.
5. Crea una tarea con datos válidos y confirma que aparece.
6. Intenta guardar un título vacío o demasiado corto y confirma que se valida antes de enviar.
7. Edita una tarea y confirma que se conservan los datos no modificados, incluido `completed`.
8. Elimina una tarea y confirma que desaparece.
9. Prueba un error de API o desconecta el backend temporalmente: la interfaz debe informar el fallo y no presentarlo como una lista vacía exitosa.
10. Ejecuta las comprobaciones del proyecto:

```bash
npm run lint
npm run build
```

No es parte de la verificación de este taller que existan búsqueda, filtros, ordenamiento o controles de paginación.

## 13. Criterios de entrega

- [ ] Existe `src/pages/Tasks/Tasks.jsx`.
- [ ] Existe `src/pages/Tasks/Tasks.module.css` y la página lo importa.
- [ ] Existe `src/services/taskService.js` y utiliza el `apiClient` compartido.
- [ ] La página lista tareas leyendo `response.items`.
- [ ] Se puede crear, editar y eliminar una tarea.
- [ ] Los campos cumplen las validaciones del contrato.
- [ ] La edición envía el cuerpo completo requerido por `PUT`.
- [ ] Se muestran carga, error y lista vacía como estados distintos.
- [ ] La ruta `/tasks` está protegida para usuarios autenticados.
- [ ] Hay un enlace a tareas en la navegación autenticada.
- [ ] No se implementaron filtros, búsqueda, ordenamiento ni paginación.
- [ ] `npm run lint` y `npm run build` terminan correctamente.
