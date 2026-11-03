Generé las rutas de las páginas como un manifiesto, un script que crea los archivos y un documento legible. Los tres archivos son routes.manifest.json, generate-routes.mjs y RUTAS.md.

Qué incluye
routes.manifest.json: la fuente única de las rutas. Tiene 129 rutas (98 web y 31 de backoffice), y cada una indica su URL, grupo de rutas, roles permitidos, el artboard de diseño y si tiene versión móvil.
generate-routes.mjs: un script de Node sin dependencias, que crea la estructura a partir del manifiesto.
RUTAS.md: las mismas rutas en tablas, por app y por grupo.
Cómo se organizan
apps/web (Next.js 15, App Router):
Grupo (public), con 23 rutas, como /, /search, /listings/[slug], /help y /legal/[slug].
Grupo (auth), con 12 rutas, como /login, /register, /sso y /onboarding/....
Grupo (client), con 34 rutas, como /home, /plan, /bookings/[id] y /settings/....
Grupo (dashboard), con 29 rutas: el proveedor bajo /dashboard/... y el planeador bajo /planner.
apps/backoffice (Vite): 31 rutas planas, como /kyc, /disputes/[id] y /analytics/executive. Genera también un router.tsx con React Router.
apps/mobile (Expo Router): 87 pantallas con la misma estructura de grupos que la web.
Qué crea el script

Cada pantalla recibe un archivo mínimo con su título, sus roles y una referencia a su artboard de diseño. También crea el diseño base de cada grupo y una tabla de rutas por app (routes.ts) con una función pathFor() para armar enlaces. Las pantallas con parámetros ya traen el manejo de [id] o [slug].

Cómo usarlo

Desde la raíz del monorepo, con el script y el manifiesto en scripts/:

node scripts/generate-routes.mjs --dry-run: solo muestra lo que haría.
node scripts/generate-routes.mjs: crea los archivos que falten.
--only web, --only backoffice o --only mobile: genera solo una app.
--force: sobrescribe los archivos existentes.

No sobrescribe nada que ya exista, salvo con --force.

Lo que comprobé

Ejecuté el script en una carpeta vacía de prueba: creó 223 archivos y, al correrlo otra vez, omitió los 223 sin tocarlos. También revisé a mano algunos de los archivos generados y la sintaxis del script. No lo probé dentro de tu monorepo, y no compilé los archivos generados con TypeScript, así que corre --dry-run primero y valida con tu lint y build.

Lo que debes saber
Estas rutas son una propuesta mía, no salen de tu documento. Los nombres en inglés (/bookings, /dashboard/ads) son una convención que puedes cambiar editando solo el manifiesto.
Los roles son una propuesta. Cuándo aplica cada permiso lo debes definir tú, y falta implementar las guardas de acceso. El script solo deja los roles anotados.
Subdominios: News y Community aparecen como /news y /community. Tu documento los pide como subdominios, lo que requiere reescrituras por host.
/listings/[slug]/gallery está pensada como ruta interceptada (modal) de Next.js, que hay que implementar a mano.
Backoffice: React Router no está en tus dependencias. El script avisa con el comando para instalarlo.
No son rutas: los componentes, emails, plantillas de SMS y push y estados vacíos. La pantalla “Reportes” de la tanda anterior quedó reemplazada por la nueva versión de KPIs.
