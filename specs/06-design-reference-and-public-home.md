# SPEC 06 — Referencia de diseño y home pública responsive

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-01
> **Objetivo:** Consolidar la documentación de los diseños locales y reemplazar la home web por una experiencia pública responsive en español con componentes compartidos e interacciones de demostración.

## Why this spec exists

`contexts/resources/guides.md` es un historial de entregas que mezcla requisitos, propuestas, incidentes y pendientes ya resueltos. El índice local contiene 232 enlaces únicos y existen sus 232 archivos HTML; esta comprobación no acredita su calidad visual ni su funcionalidad.

La ruta `/` muestra actualmente un panel de planeador en inglés, no la home pública del diseño. `packages/ui` solo exporta `Button`, con una paleta distinta de la propuesta visual.

## Scope

**In:**

- Reemplazar y renombrar `contexts/resources/guides.md` como `contexts/resources/design-reference.md`, redactado en inglés.
- Organizar la referencia por áreas y flujos: público, cuenta, cliente, proveedor, planeador, backoffice, comunicación, sistema y biblioteca visual.
- Conservar requisitos útiles, restricciones y decisiones pendientes vigentes; eliminar cronología, posiciones de artboards, incidentes de publicación, repeticiones y ofertas de próximos pasos.
- Contrastar cobertura y referencias con `contexts/resources/index.html` y los HTML locales. Registrar discrepancias sin inventar una solución ni considerar las maquetas como requisitos aprobados.
- Actualizar `contexts/resources/README.md` en inglés para enlazar la referencia y explicar el paquete. Actualizar referencias al nombre antiguo, si existen.
- Enlazar `contexts/resources/documentacion/componentes-vibe-planners.md` como inventario estimado no vinculante; conservarlo sin reescribir sus tablas ni duplicarlas en la referencia.
- Adoptar los tokens del diseño en la configuración compartida, cargar Plus Jakarta Sans y construir la home pública responsive en `apps/web`.
- Crear únicamente los componentes compartidos necesarios: `Input`, `Select`, `Chip`, `Seal`, `Logo`, `Rating` y `ListingCard`; adaptar el `Button` existente conservando sus variantes públicas.
- Implementar navegación pública, campos de ciudad, fecha y servicio, categorías, destacados, selección local de favoritos y avisos accesibles para funciones pendientes.
- Usar datos de demostración identificados y fotografías locales con procedencia documentada y texto alternativo.
- Verificar interacciones, teclado, estados vacíos, contraste, carga de imágenes y ausencia de desbordamiento en escritorio y móvil con Playwright.

**Out of scope (for future specs):**

- Implementar las 232 pantallas o convertir las 71 filas del inventario en componentes obligatorios.
- Modificar los HTML exportados, el índice o los originales de `fuente-lienzo/` para corregir o rediseñar las maquetas.
- Integrar API, autenticación, disponibilidad real, reservas, pagos, KYC, mapas o proveedores de mensajes.
- Crear `/search`, `/register` o flujos de alta de proveedor.
- Persistir favoritos o búsquedas entre sesiones.
- Implementar traducciones completas, selector de idioma o versiones inglesas de pantallas y emails.
- Rediseñar login, dashboard o account; desarrollar móvil nativo o backoffice.
- Aprobar textos legales, políticas, comisiones, impuestos, niveles o reglas de negocio sugeridas por los diseños.

## Data model

No se introducen modelos de base de datos, contratos de API ni almacenamiento persistente.

Los fixtures de `apps/web/src/components/home/home-demo-data.ts` usan estas estructuras locales:

- Categoría: `id` y `label` en español.
- Publicación de demostración: `id`, `title`, `city`, `categoryId`, `imageSrc`, `imageAlt`, `priceFrom`, `currency`, `rating` y `seal` opcional.
- `currency` usa `MXN`; precios, calificaciones y sellos son datos ficticios, no evidencia de proveedores reales.
- Estado de búsqueda: `city`, `eventDate` y `categoryId`, con valores editables y filtros aplicados al pulsar Buscar.
- Estado de favoritos: conjunto de identificadores en memoria, perdido al recargar o desmontar la home.

Buscar filtra por ciudad y categoría. Ciudad se compara sin distinguir mayúsculas ni acentos y admite coincidencia parcial. Ciudad vacía y categoría sin selección no restringen resultados. La fecha se conserva como preferencia tentativa durante la interacción, pero no filtra ni afirma disponibilidad.

Seleccionar una categoría aplica el filtro de categoría y sincroniza el selector del buscador. Restablecer filtros limpia campos y filtros aplicados, pero no modifica favoritos. Un aviso visible identifica el conjunto como datos de demostración.

## Implementation plan

1. Cotejar `guides.md` con el índice y los HTML locales, empezando por `Home.html`, `App.html` y las referencias de componentes. Clasificar información como descripción visual, propuesta no aprobada, restricción o decisión pendiente. Mantener el sistema ejecutable sin cambios de código.
2. Crear `contexts/resources/design-reference.md` a partir de esa clasificación y retirar `contexts/resources/guides.md` mediante el renombrado. Actualizar el README y los enlaces al nombre anterior. Conservar cobertura por flujos, límites móviles, marcadores, advertencias de pagos, traducciones pendientes y decisiones legales/fiscales sin reproducir el historial.
3. Actualizar `packages/config/tailwind-config/index.js` con ciruela `#2B1B3D`, crema `#FFF8F1`, frambuesa `#C42A50`, ámbar `#F6B93B` y arena `#E6D9CC`. Definir tipografía y radios del diseño: campos de 12 px, tarjetas de 16 px y botones de 22–24 px. Conservar tokens existentes que consuman otras aplicaciones y la extensión `forest` de web; no eliminar compatibilidad ajena a esta entrega.
4. Adaptar `packages/ui/src/button.tsx` para los tokens adoptados, áreas interactivas mínimas de 44 px, foco visible y estados deshabilitado/cargando. Conservar `primary`, `secondary` y `quiet`, atributos HTML y composición con `className`. Crear `input.tsx`, `select.tsx`, `chip.tsx`, `seal.tsx`, `logo.tsx`, `rating.tsx` y `listing-card.tsx` en la misma carpeta; exportarlos y sus tipos desde `index.ts`. No generar esqueletos para el inventario completo.
5. Añadir fotografías en `apps/web/public/images/home/` y registrar origen, autor si está disponible y condiciones de uso en `apps/web/public/images/home/README.md`. No usar fotografías como respaldo de identidades verificadas. Crear los fixtures y composición local en `apps/web/src/components/home/`: `home-demo-data.ts`, `home-experience.tsx`, `home-search.tsx` y `home-nav.tsx`.
6. Reemplazar `apps/web/src/app/(public)/page.tsx` por la home pública del HTML local, con adaptación responsive en lugar de copiar dimensiones fijas. Usar la marca, buscador, categorías y destacados del diseño. Implementar filtros, favoritos, reinicio, estado vacío y avisos pendientes dentro de la composición local. `Iniciar sesión` enlaza `/login`; registro y alta de proveedor muestran un aviso accesible sin navegar a rutas inexistentes. Las tarjetas no simulan reservas ni abren detalles inexistentes.
7. Actualizar `apps/web/src/app/layout.tsx` y `globals.css` para Plus Jakarta Sans con pesos 400, 600 y 800, metadatos públicos en español y estilos de base del diseño. Declarar el idioma español de la home y conservar una declaración de idioma correcta para el contenido inglés de las otras rutas, sin traducirlas. Ajustar `apps/web/tailwind.config.cjs` solo si es necesario para consumir los tokens. Mantener renderizado legible cuando una imagen o la fuente no estén disponibles.
8. Sustituir la prueba del panel anterior en `apps/web/tests/home.spec.ts` por pruebas de la home pública y sus interacciones. Usar viewports de 1440×900, 390×844 y 320×844 mediante la configuración de viewport de las pruebas. Capturar escritorio y móvil y comprobar las imágenes, foco, navegación por teclado, etiquetas, favoritos, filtros y estado vacío. Revisar `/login`, `/dashboard` y `/account` por regresiones de estilos compartidos, sin rediseñarlos. Actualizar `docs/architecture.md` para describir los componentes realmente exportados y enlazar la referencia consolidada.

## Acceptance criteria

- [ ] `design-reference.md` y el README de recursos están en inglés; el antiguo `contexts/resources/guides.md` ya no existe y no quedan enlaces activos hacia él.
- [ ] La referencia conserva los flujos descritos, restricciones de las maquetas y pendientes vigentes, sin cronología ni afirmaciones antiguas de que faltan pantallas posteriormente entregadas.
- [ ] Los conteos publicados corresponden al índice local al ejecutar la entrega; todos los enlaces relativos nuevos resuelven a archivos existentes.
- [ ] Las propuestas de rutas, carpetas y negocio se distinguen de decisiones aprobadas; los conflictos encontrados se documentan explícitamente.
- [ ] El inventario existente queda intacto y enlazado como estimación, no como contrato de 71 componentes.
- [ ] `/` muestra la home pública en español, no el panel de Mariana; las otras rutas permanecen disponibles.
- [ ] La home aplica los cinco colores, la tipografía, los radios y el espaciado base de 8 px del diseño; los controles tienen áreas interactivas de al menos 44 px.
- [ ] Los nuevos componentes se exportan desde `@vibe-planners/ui`; los consumidores existentes de `Button` siguen compilando con sus variantes actuales.
- [ ] Ciudad y categoría filtran fixtures según las reglas indicadas; la selección de categorías sincroniza el selector y el botón de reinicio recupera los destacados.
- [ ] Una búsqueda sin coincidencias muestra un estado vacío con reinicio funcional; la fecha no comunica disponibilidad comprobada.
- [ ] Los favoritos se pueden activar y desactivar con teclado y exponen su estado accesible; recargar elimina esa selección.
- [ ] Los datos ficticios están identificados; ninguna interacción realiza llamadas API, reservas, pagos o escrituras persistentes.
- [ ] Login navega a `/login`; registro y alta de proveedor producen un aviso accesible, sin enlaces `#` ni éxito simulado.
- [ ] Las fotografías se sirven desde archivos locales, tienen texto alternativo, procedencia documentada y fallback legible ante error.
- [ ] Las pruebas enfocadas comprueban que no existe desbordamiento horizontal ni controles superpuestos en 1440×900, 390×844 y 320×844.
- [ ] La navegación por teclado muestra foco visible y nombres accesibles; el contraste de texto normal alcanza 4.5:1 y el de texto grande y controles alcanza 3:1. No se dan por válidas las estimaciones manuales del inventario.
- [ ] Se revisan capturas contra los HTML locales y se comprueba carga real de imágenes; cualquier diferencia deliberada queda explicada.
- [ ] Pasan `npm run lint --workspace=@vibe-planners/web`, `npm run build --workspace=@vibe-planners/web` y `npm run test:e2e --workspace=@vibe-planners/web -- home.spec.ts`.
- [ ] La documentación arquitectónica describe la base compartida resultante; no se han modificado móvil, backoffice, API ni los diseños exportados.

## Decisions

- **Sí:** reunir documentación y una única experiencia web visible. Permite iniciar la implementación sin abarcar todas las áreas del producto.
- **Sí:** `design-reference.md` en inglés, por áreas y flujos, con enlaces a los recursos locales. Sustituye el historial temporal por una referencia mantenible.
- **Sí:** mantener esta spec en español y con los encabezados existentes del repositorio; documentación nueva del producto en inglés y UI en español.
- **No:** conservar incidentes de publicación o posiciones del lienzo como requisitos del producto. No aportan contratos implementables.
- **Sí:** contrastar el texto con los recursos locales y dejar las propuestas sin aprobar identificadas como tales. Una maqueta no decide políticas del negocio.
- **No:** reconciliar ahora cada fila del inventario ni generar componentes vacíos. Su desglose es estimado y la home determina la base necesaria.
- **Sí:** fotos locales de demostración y filtros/favoritos en memoria. Producen una experiencia verificable sin simular integraciones reales.
- **No:** `/search`, autenticación nueva, reservas o disponibilidad real. Requieren contratos y estados que pertenecen a futuras specs.
- **Sí:** mantener tokens antiguos y variantes de Button por compatibilidad; adoptar los nuevos tokens sin rediseñar otros consumidores.
- **Sí:** adoptar los radios del diseño existente aunque superen 8 px. La entrega preserva el sistema visual proporcionado.
- **No:** traducciones completas, móvil nativo y backoffice en esta entrega. Se mantienen como alcance independiente.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Limpiar el historial elimina requisitos únicos o promueve supuestos a reglas aprobadas. | Clasificar por flujo, contrastar HTML y separar pendientes/propuestas de decisiones cerradas. |
| El índice clasifica algunas pantallas por conveniencia, no por plataforma real; los móviles son resúmenes. | No equiparar el conteo con cobertura completa ni convertir pantallazos en especificaciones de todos los estados. |
| Tokens, fuente o Button compartidos afectan login y otros consumidores. | Conservar variantes y tokens existentes, compilar web y revisar las otras rutas sin rediseñarlas. |
| Fixtures y sellos ficticios parecen proveedores reales. | Identificar datos de demostración y no presentar verificación, disponibilidad o transacciones como reales. |
| Fotos o fuente externa fallan o tienen derechos de uso incompatibles. | Fotografías locales con procedencia y condiciones de uso; fallback legible y comprobación de recursos al validar. |
| Maquetas o inventario citan contrastes no medidos. | Medir las combinaciones efectivamente utilizadas y corregir colores de texto/estados sin asumir ratios aproximados. |

## What is **not** in this spec

- Implementación del catálogo completo de pantallas o de componentes estimados.
- Modificación de diseños exportados, API, base de datos, móvil o backoffice.
- Autenticación, pagos, reservas, mapas, persistencia e integraciones reales.
- Decisiones legales, fiscales o comerciales pendientes.
- Internacionalización completa y rediseño de las rutas web restantes.

Cada elemento requiere una especificación posterior si se prioriza.
