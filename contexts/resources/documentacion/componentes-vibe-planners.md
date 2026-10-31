# Componentes de Vibe Planners

Inventario de **71 componentes** para `packages/ui`, tomado de la biblioteca del lienzo de diseño. Un componente se define por su nombre, sus variantes y sus estados.

## Tokens de diseño

| Token                           | Valor                                   |
| ------------------------------- | --------------------------------------- |
| Ciruela (texto, fondos oscuros) | `#2B1B3D`                               |
| Crema (fondo de página)         | `#FFF8F1`                               |
| Frambuesa (acción principal)    | `#C42A50`                               |
| Ámbar (acento, etiquetas)       | `#F6B93B`                               |
| Arena (bordes, deshabilitado)   | `#E6D9CC`                               |
| Tipografía                      | Plus Jakarta Sans (400, 600, 800)       |
| Espaciado base                  | 8 px                                    |
| Radios                          | 12 campos · 16 tarjetas · 22–24 botones |
| Área táctil mínima              | 44 px                                   |

## Base (6)

Carpeta sugerida: `packages/ui/src/base/`

| Componente    | Variantes                                                          | Estados                                           | Dónde se usa              |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------- | ------------------------- |
| Button        | primario, secundario, texto, oscuro, destructivo, ícono            | normal, foco, presionado, cargando, deshabilitado | Todas                     |
| Chip / filtro | activo, inactivo, punteado                                         | normal, foco                                      | Resultados, categorías    |
| StatusBadge   | confirmado, por confirmar, bloqueado, garantía, cancelado, urgente | —                                                 | Reservas, finanzas, admin |
| Seal          | top, verificado, anunciado, nuevo                                  | —                                                 | Tarjetas, perfil          |
| Avatar        | 32, 44, 64, 88; grupo; con insignia                                | con imagen, sin imagen                            | Perfil, chat, equipo      |
| Logo          | claro, oscuro, ícono de app                                        | —                                                 | Nav, emails               |

## Formularios (15)

Carpeta sugerida: `packages/ui/src/forms/`

| Componente                | Variantes                                 | Estados                            | Dónde se usa          |
| ------------------------- | ----------------------------------------- | ---------------------------------- | --------------------- |
| Input                     | con ayuda, con ícono                      | normal, foco, error, deshabilitado | Todas                 |
| PasswordInput             | con fuerza                                | visible, oculto                    | Login, registro       |
| Select / Combobox         | autocompletar ciudad                      | abierto, cerrado, vacío            | Búsqueda, publicación |
| MultiSelect / Tags        | chips removibles                          | vacío, con valores                 | Etiquetas             |
| Textarea                  | con contador                              | normal, error                      | Reseñas, descripción  |
| Checkbox / Radio / Toggle | grupo                                     | marcado, desmarcado, deshabilitado | Filtros, ajustes      |
| SearchBar                 | píldora, con filtros                      | vacío, con texto                   | Home, resultados      |
| PhoneInput                | con selector de país                      | error, válido                      | Login, registro       |
| OTPInput                  | 6 dígitos                                 | error, reenvío                     | Verificación          |
| DatePicker                | fecha fija, rango, flexible               | día libre, ocupado, elegido        | Búsqueda, reserva     |
| NumberStepper             | invitados                                 | mín., máx.                         | Cotización            |
| RangeSlider               | precio                                    | —                                  | Filtros               |
| FileUpload                | dropzone, miniaturas                      | cargando, error                    | Publicación, KYC      |
| CardInput                 | campos alojados por el proveedor de pagos | error                              | Pago                  |
| RatingInput               | 1–5 por criterio                          | —                                  | Reseña                |

## Navegación (9)

Carpeta sugerida: `packages/ui/src/navigation/`

| Componente         | Variantes                        | Estados                    | Dónde se usa         |
| ------------------ | -------------------------------- | -------------------------- | -------------------- |
| TopNav             | público, cliente con sesión      | activo, con notificaciones | Web                  |
| Sidebar            | proveedor, backoffice, planeador | activo, inactivo           | Paneles              |
| TabBar             | 4 pestañas                       | activa                     | Móvil                |
| Tabs / Segmented   | pestañas, segmentado             | activa                     | Varias               |
| Stepper / Progress | 3–6 pasos                        | completado, actual         | Onboarding, anuncios |
| Breadcrumb         | —                                | —                          | Detalle              |
| Pagination         | páginas, cargar más              | actual, deshabilitada      | Resultados           |
| Menu / OrgSwitcher | —                                | abierto, cerrado           | Proveedor            |
| Footer             | —                                | —                          | Público              |

## Datos (12)

Carpeta sugerida: `packages/ui/src/data/`

| Componente                | Variantes                               | Estados                                             | Dónde se usa         |
| ------------------------- | --------------------------------------- | --------------------------------------------------- | -------------------- |
| ListingCard               | normal, anunciada, horizontal, favorita | normal, cargando                                    | Resultados, home     |
| ProviderCard / MentorCard | —                                       | —                                                   | Perfil, mentoría     |
| StatCard                  | —                                       | —                                                   | Dashboards           |
| PromoCard / CouponCard    | —                                       | vigente, vencido                                    | Home, recompensas    |
| Table                     | con orden, selección, acciones          | vacía, cargando                                     | Finanzas, backoffice |
| Rating                    | lectura, entrada                        | —                                                   | Tarjetas, reseña     |
| ProgressBar               | —                                       | —                                                   | Plan, aportaciones   |
| Chart                     | barras, línea, dona                     | vacía                                               | Reportes             |
| ReviewItem                | con fotos                               | —                                                   | Perfil, detalle      |
| Timeline                  | —                                       | completado, pendiente                               | Reserva              |
| Calendar                  | mes, semana, día                        | libre, reservado, por confirmar, bloqueado, elegido | Agenda               |
| CommentThread             | con respuestas                          | —                                                   | Community            |

## Mapa y galería (9)

Carpeta sugerida: `packages/ui/src/media/`

| Componente     | Variantes                          | Estados                       | Dónde se usa        |
| -------------- | ---------------------------------- | ----------------------------- | ------------------- |
| Map            | resultados, detalle, selector      | cargando, error               | Resultados, detalle |
| MapPin         | precio, elegido, visitado, clúster | —                             | Mapa                |
| MapPreviewCard | —                                  | —                             | Mapa                |
| LocationPicker | pin + radio                        | —                             | Crear publicación   |
| GalleryGrid    | 1 + 4                              | —                             | Detalle             |
| Lightbox       | imagen, video                      | anterior, siguiente, zoom     | Detalle             |
| VideoPlayer    | —                                  | pausa, reproducción, silencio | Detalle             |
| Carousel       | con puntos                         | —                             | Home                |
| ImageUploader  | reordenar, portada                 | —                             | Publicación         |

## Superposiciones y estado (7)

Carpeta sugerida: `packages/ui/src/overlays/`

| Componente              | Variantes                            | Estados | Dónde se usa       |
| ----------------------- | ------------------------------------ | ------- | ------------------ |
| Modal                   | confirmación, formulario             | abierto | Cancelar, eliminar |
| BottomSheet / Drawer    | filtros                              | abierto | Móvil, web         |
| Popover / Tooltip       | —                                    | —       | Ayuda              |
| Toast / Alert           | info, atención, error, listo         | —       | Todas              |
| Banner                  | sin conexión, mantenimiento, cookies | —       | Global             |
| EmptyState / ErrorState | vacío, sin resultados, 403, 404, 500 | —       | Todas              |
| Skeleton / Spinner      | tarjeta, lista, tabla                | —       | Todas              |

## Dominio (13)

Carpeta sugerida: `packages/ui/src/domain/`

| Componente                       | Variantes                                        | Estados                       | Dónde se usa     |
| -------------------------------- | ------------------------------------------------ | ----------------------------- | ---------------- |
| ChatBubble                       | recibido, enviado, sistema, adjunto, escribiendo | —                             | Mensajes         |
| QuoteCard                        | —                                                | enviada, aceptada, rechazada  | Mensajes         |
| PriceBreakdown                   | —                                                | —                             | Pago, cotización |
| ContributionLink                 | plantilla                                        | activo, vencido               | Aportaciones     |
| NotificationItem                 | —                                                | nueva, leída                  | Bandeja          |
| VerificationLevel                | 3 niveles                                        | pendiente, verificado         | Perfil           |
| ListingStatus                    | borrador, revisión, publicada, suspendida        | —                             | Publicaciones    |
| ReservationCard                  | —                                                | solicitud, confirmada, pasada | Reservaciones    |
| PaymentMethodCard                | —                                                | principal                     | Pagos            |
| PlanCard                         | básico, pro, premium                             | actual                        | Suscripción      |
| AdPreview                        | resultados, home                                 | —                             | Anuncios         |
| RoleBadge / PermissionMatrix     | —                                                | —                             | Equipo           |
| ModerationItem / ParameterToggle | —                                                | —                             | Backoffice       |

## Reglas de accesibilidad

- El estado nunca depende solo del color: siempre lleva texto.
- Todo control interactivo mide al menos 44 px.
- Los botones de solo ícono llevan `aria-label`.
- Los campos llevan etiqueta visible o `aria-label`.
- Contraste de texto: ciruela sobre crema ≈ 14:1; blanco sobre frambuesa ≈ 5.5:1 (cálculo aproximado, por verificar con una herramienta).

## Notas

- Los mapas del diseño son ilustraciones. Falta elegir el proveedor de mapas y su atribución.
- Los campos de tarjeta deben usar los elementos alojados del proveedor de pagos; no se guardan datos de tarjeta en la plataforma.
- Los textos, montos y comisiones del diseño son marcadores `[...]`.
