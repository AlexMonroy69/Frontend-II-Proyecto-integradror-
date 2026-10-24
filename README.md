# Todo App Frontend

Frontend de la aplicación Todo App desarrollado con React, Vite y JavaScript.

## Tecnologías

- React 19
- Vite 8
- React Router DOM 7
- Axios
- CSS Modules

## Documentación para estudiantes

La guía de trabajo del frontend está en [`markdown/GUIA_FRONTEND_ESTUDIANTES.md`](./markdown/GUIA_FRONTEND_ESTUDIANTES.md). Describe los archivos existentes y los que debe crear el estudiante para implementar tareas.

El contrato de endpoints, DTO, filtros y validaciones del backend se documenta en [`markdown/FRONTEND_IMPLEMENTATION.md`](./markdown/FRONTEND_IMPLEMENTATION.md).

## Funcionalidad disponible

- Registro, inicio y cierre de sesión.
- Renovación automática de tokens y consulta del perfil actual.
- Cambio de contraseña propia.
- Dashboard para usuario autenticado.
- Administración de usuarios para el rol `ADMIN`.
- Rutas 403 y 404.
- Infraestructura reutilizable: cliente Axios, rutas protegidas y componentes comunes.

La página de tareas se retiró intencionalmente para que los estudiantes la implementen. Deben crear `src/pages/Tasks/Tasks.jsx`, `src/pages/Tasks/Tasks.module.css` y `src/services/taskService.js`, además de registrar la ruta y el enlace de navegación según la guía.

## Instalar y ejecutar

```bash
npm install
npm run dev
```

El backend local predeterminado está en `http://localhost:8080`. La variable `VITE_API_BASE_URL` se configura en `.env.development` o `.env.production`; `.env.example` sirve como referencia. Las variables `VITE_*` son públicas en el bundle del navegador y no deben contener secretos.

## Scripts

```bash
npm run dev       # Servidor de desarrollo
npm run lint      # Oxlint
npm run build     # Build de producción
npm run preview   # Previsualización local del build
```
