Explicación de cada Carpeta

assets: Recursos estáticos como el logo "CitrusTrack", iconos, etc.

components:

layout/: Componentes que definen la estructura visual principal, como la Sidebar (menú lateral verde) y la Navbar (barra superior con el usuario).

shared/: Componentes "tontos" (dumb components) y 100% reutilizables en toda la aplicación. Ej: Button.jsx, Card.jsx, KpiCard.jsx (que se usa en el Dashboard y en KPIs), Table.jsx, etc.

hooks: Custom Hooks reutilizables, ej: useAuth para gestionar el estado del usuario, useApi para centralizar llamadas fetch, useNotifications para manejar las alertas push.

modules (la clave de la modularidad):

Cada carpeta dentro de modules representa una sección principal de tu aplicación (cada ítem del Sidebar).

components/ (dentro de un módulo): Componentes que solo se usan dentro de ese módulo. Por ejemplo, RouteSimulator.jsx solo se usa en logistics, por lo que vive ahí y no en components/shared/.

[Nombre]Page.jsx: Es el componente principal de la página/ruta, que ensambla los componentes más pequeños de ese módulo.

services/ (dentro de un módulo): Aquí es donde se define la lógica de negocio y las llamadas a la API específicas de ese módulo. lotsService.js tendrá funciones como getLots(), createLot(), mientras kpiService.js tendrá getKpiData(). Esto facilita enormemente la integración del backend.

services (en la raíz src/):

apiClient.js: Tu "cerebro" de API. Aquí configuras tu cliente (ej. axios) con la URL base del backend, interceptores para añadir el token de autenticación a todas las peticiones, y manejo de errores 401/500.

context: Para el estado global. AuthContext es casi obligatorio para saber quién es el usuario (Admin, Supervisor, etc.) y si está logueado.

routes: Define la lógica de enrutamiento de tu aplicación (usando react-router-dom).

AppRouter.jsx: Define qué componente se muestra para cada URL (ej. /dashboard, /lotes, /configuracion).

PrivateRoute.jsx: Un componente que protege rutas. Si el usuario no está logueado, lo redirige a /login.

styles: Estilos globales, variables CSS (colores, fuentes), etc.

utils: Funciones de ayuda puras y reutilizables en cualquier parte (ej. formatear una fecha).

Esta estructura te permitirá que, cuando trabajes en "Logística y Rutas", puedas enfocarte solo en la carpeta src/modules/logistics/ sin preocuparte por romper algo en src/modules/kpis/.
