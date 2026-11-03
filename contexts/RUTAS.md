# Rutas de Vibe Planners

Generado desde `routes.manifest.json`.

## Web (apps/web)

### (public) (23)

| Ruta                        | Pantalla                             | Roles  | Móvil | Diseño                   |
| --------------------------- | ------------------------------------ | ------ | ----- | ------------------------ |
| `/`                         | Home sin sesión                      | public | sí    | Home.dc.html             |
| `/search`                   | Resultados de búsqueda               | public | sí    | Resultados.dc.html       |
| `/search/map`               | Resultados en mapa                   | public | sí    | ResultadosMapa.dc.html   |
| `/listings/[slug]`          | Detalle de publicación               | public | sí    | Detalle.dc.html          |
| `/listings/[slug]/gallery`  | Visor de galería                     | public | sí    | DetalleGaleria.dc.html   |
| `/listings/[slug]/location` | Ubicación y mapa                     | public | —     | DetalleUbicacion.dc.html |
| `/providers/[id]`           | Perfil del proveedor                 | public | sí    | PerfilProveedor.dc.html  |
| `/help`                     | Ayuda y soporte                      | public | sí    | Ayuda.dc.html            |
| `/help/[slug]`              | Artículo de ayuda                    | public | sí    | NxArticulo.dc.html       |
| `/legal/[slug]`             | Páginas legales                      | public | sí    | Legal.dc.html            |
| `/legal/cancellation`       | Política de cancelación y reembolsos | public | sí    | NxPolCancel.dc.html      |
| `/legal/refunds`            | Política de devoluciones             | public | sí    | NxPolDevol.dc.html       |
| `/legal/modifications`      | Política de modificaciones           | public | sí    | NxPolModif.dc.html       |
| `/legal/ads-policy`         | Políticas de anuncios                | public | sí    | AdPoliticas.dc.html      |
| `/trust`                    | Centro de confianza y seguridad      | public | sí    | NxConfianza.dc.html      |
| `/services`                 | Servicios                            | public | sí    | CnServicios.dc.html      |
| `/about`                    | Acerca de                            | public | sí    | PgAcerca.dc.html         |
| `/news`                     | News                                 | public | sí    | CnNews.dc.html           |
| `/blog`                     | Blog                                 | public | sí    | CnBlog.dc.html           |
| `/community`                | Community                            | public | sí    | CnCommunity.dc.html      |
| `/contribute/[code]`        | Aportación pública                   | public | —     | FinAporta.dc.html        |
| `/maintenance`              | Mantenimiento                        | public | sí    | CtaMantenimiento.dc.html |
| `/not-found`                | Error 404                            | public | sí    | Cta404.dc.html           |

### (auth) (12)

| Ruta                     | Pantalla                     | Roles  | Móvil | Diseño               |
| ------------------------ | ---------------------------- | ------ | ----- | -------------------- |
| `/login`                 | Iniciar sesión               | public | sí    | Login.dc.html        |
| `/register`              | Registro por correo          | public | sí    | Registro.dc.html     |
| `/verify`                | Verificación por SMS         | public | —     | Verificacion.dc.html |
| `/sso`                   | Acceso con SSO               | public | sí    | NxSSO.dc.html        |
| `/account-suspended`     | Cuenta suspendida            | auth   | sí    | NxSuspendida.dc.html |
| `/onboarding`            | Onboarding: elegir perfil    | auth   | sí    | Onboarding.dc.html   |
| `/onboarding/client/2`   | Onboarding cliente, paso 2   | auth   | sí    | Onboarding2.dc.html  |
| `/onboarding/client/3`   | Onboarding cliente, paso 3   | auth   | sí    | Onboarding3.dc.html  |
| `/onboarding/provider/2` | Onboarding proveedor, paso 2 | auth   | sí    | ProvOnb2.dc.html     |
| `/onboarding/provider/3` | Onboarding proveedor, paso 3 | auth   | sí    | ProvOnb3.dc.html     |
| `/onboarding/planner/2`  | Onboarding planeador, paso 2 | auth   | sí    | PlanOnb2.dc.html     |
| `/onboarding/planner/3`  | Onboarding planeador, paso 3 | auth   | sí    | PlanOnb3.dc.html     |

### (client) (34)

| Ruta                          | Pantalla                      | Roles                     | Móvil | Diseño                    |
| ----------------------------- | ----------------------------- | ------------------------- | ----- | ------------------------- |
| `/home`                       | Home con sesión               | client, provider, planner | sí    | HomeSesion.dc.html        |
| `/plan`                       | Gestión de plan               | client, planner           | sí    | Plan.dc.html              |
| `/plan/budget`                | Presupuesto del evento        | client, planner           | sí    | NyPresupuesto.dc.html     |
| `/plan/guests`                | Lista de invitados            | client, planner           | sí    | NyInvitados.dc.html       |
| `/plan/summary`               | Resumen del evento (KPIs)     | client, planner           | sí    | KpEvento.dc.html          |
| `/plan/quotes`                | Comparador de cotizaciones    | client, planner           | sí    | NxComparador.dc.html      |
| `/plan/contributions/new`     | Crear link de aportación      | client, planner           | sí    | FinLinkAporte.dc.html     |
| `/favorites`                  | Favoritos                     | client, provider, planner | sí    | Favoritos.dc.html         |
| `/favorites/collections/[id]` | Colección                     | client, provider, planner | sí    | CnColeccion.dc.html       |
| `/rewards`                    | Recompensas                   | client, provider, planner | sí    | Recompensas.dc.html       |
| `/mentorship`                 | Mentoría                      | client, provider, planner | sí    | CtaMentoria.dc.html       |
| `/messages`                   | Mensajes                      | client, provider, planner | sí    | Mensajes.dc.html          |
| `/notifications`              | Notificaciones                | client, provider, planner | sí    | CtaNotificaciones.dc.html |
| `/bookings`                   | Mis reservaciones             | client, planner           | sí    | CtaReservaciones.dc.html  |
| `/bookings/[id]`              | Detalle de reserva            | client, planner           | sí    | PgDetalleReserva.dc.html  |
| `/bookings/[id]/checkout`     | Pago de reserva               | client, planner           | sí    | FinCheckout.dc.html       |
| `/bookings/[id]/cancel`       | Cancelar reserva              | client, planner           | sí    | PgCancelar.dc.html        |
| `/bookings/[id]/modify`       | Modificar reserva             | client, planner           | sí    | NxModificar.dc.html       |
| `/bookings/[id]/dispute`      | Abrir disputa o devolución    | client, planner           | sí    | NxDisputa.dc.html         |
| `/bookings/[id]/review`       | Escribir reseña               | client, planner           | sí    | PgResena.dc.html          |
| `/bookings/[id]/contract`     | Contrato de servicio          | client, provider, planner | sí    | NxContrato.dc.html        |
| `/listings/[slug]/quote`      | Solicitar cotización          | client, planner           | sí    | PgCotizacion.dc.html      |
| `/report`                     | Reportar                      | auth                      | sí    | NxReportar.dc.html        |
| `/profile`                    | Mi perfil                     | auth                      | sí    | CtaPerfil.dc.html         |
| `/profile/verification`       | Verificación de identidad     | auth                      | sí    | CtaVerificacion.dc.html   |
| `/settings/security`          | Cuenta y seguridad            | auth                      | sí    | CtaSeguridad.dc.html      |
| `/settings/preferences`       | Notificaciones y preferencias | auth                      | sí    | CtaPreferencias.dc.html   |
| `/settings/privacy`           | Privacidad y datos            | auth                      | sí    | CtaPrivacidad.dc.html     |
| `/settings/activity`          | Historial de actividad        | auth                      | sí    | NxHistorial.dc.html       |
| `/settings/payment-methods`   | Métodos de pago               | client, planner           | sí    | FinMetodos.dc.html        |
| `/payments`                   | Historial de pagos            | client, planner           | sí    | FinHistorial.dc.html      |
| `/support/tickets`            | Mis tickets de soporte        | auth                      | sí    | NxTickets.dc.html         |
| `/support/tickets/[id]`       | Detalle de ticket             | auth                      | sí    | NxTicket.dc.html          |
| `/support/chat`               | Chatbot de soporte            | auth                      | sí    | NxChatbot.dc.html         |

### (dashboard) (29)

| Ruta                               | Pantalla                         | Roles    | Móvil | Diseño                     |
| ---------------------------------- | -------------------------------- | -------- | ----- | -------------------------- |
| `/dashboard`                       | Dashboard del proveedor          | provider | —     | DashboardProveedor.dc.html |
| `/dashboard/calendar`              | Calendario                       | provider | sí    | Calendario.dc.html         |
| `/dashboard/listings`              | Mis publicaciones                | provider | sí    | PgMisPubs.dc.html          |
| `/dashboard/listings/new`          | Crear publicación                | provider | —     | CrearPublicacion.dc.html   |
| `/dashboard/listings/new/location` | Crear publicación: ubicación     | provider | —     | CrearUbicacion.dc.html     |
| `/dashboard/bookings`              | Reservas del proveedor           | provider | sí    | PgReservasProv.dc.html     |
| `/dashboard/messages`              | Mensajes del proveedor           | provider | sí    | Mensajes.dc.html           |
| `/dashboard/market`                | Mercado                          | provider | sí    | CtaMercado.dc.html         |
| `/dashboard/market/performance`    | Rendimiento                      | provider | sí    | KpRendimiento.dc.html      |
| `/dashboard/market/occupancy`      | Ocupación y demanda              | provider | —     | KpOcupacion.dc.html        |
| `/dashboard/market/reports`        | Reportes                         | provider | —     | KpReportes.dc.html         |
| `/dashboard/ads`                   | Anuncios                         | provider | sí    | CtaAnuncios.dc.html        |
| `/dashboard/ads/new/1`             | Crear anuncio, paso 1            | provider | sí    | AdPaso1.dc.html            |
| `/dashboard/ads/new/2`             | Crear anuncio, paso 2            | provider | sí    | AdPaso2.dc.html            |
| `/dashboard/ads/new/3`             | Crear anuncio, paso 3            | provider | sí    | AdPaso3.dc.html            |
| `/dashboard/ads/[id]`              | Detalle de campaña               | provider | sí    | AdDetalle.dc.html          |
| `/dashboard/ads/balance`           | Saldo de anuncios                | provider | sí    | AdSaldo.dc.html            |
| `/dashboard/finance`               | Finanzas                         | provider | sí    | Finanzas.dc.html           |
| `/dashboard/finance/payouts/new`   | Retirar fondos                   | provider | sí    | FinRetiro.dc.html          |
| `/dashboard/finance/invoices`      | Facturas y CFDI                  | provider | sí    | FinFacturas.dc.html        |
| `/dashboard/finance/earnings`      | Ganancias                        | provider | sí    | FinGanancias.dc.html       |
| `/dashboard/finance/taxes`         | Impuestos y retenciones          | provider | sí    | NyImpuestos.dc.html        |
| `/dashboard/team`                  | Equipo y permisos                | provider | sí    | CtaEquipo.dc.html          |
| `/dashboard/subscription`          | Planes de suscripción            | provider | sí    | CtaSuscripcion.dc.html     |
| `/dashboard/integrations`          | Integraciones                    | provider | sí    | PgIntegraciones.dc.html    |
| `/dashboard/settings`              | Configuración de la organización | provider | —     | NxOrgAjustes.dc.html       |
| `/dashboard/settings/security`     | Seguridad de la organización     | provider | —     | NxOrgSeguridad.dc.html     |
| `/planner`                         | Panel del planeador              | planner  | sí    | PgPlaneador.dc.html        |
| `/planner/kpis`                    | KPIs del planeador               | planner  | —     | KpPlaneador.dc.html        |

## Backoffice (apps/backoffice)

### Todas las rutas (31)

| Ruta                     | Pantalla                  | Roles                                       | Móvil | Diseño                  |
| ------------------------ | ------------------------- | ------------------------------------------- | ----- | ----------------------- |
| `/login`                 | Acceso del personal       | public                                      | —     | NxBoAcceso.dc.html      |
| `/`                      | Resumen                   | staff                                       | sí    | Backoffice.dc.html      |
| `/kyc`                   | Verificación KYC          | staff:moderator, staff:admin                | —     | BoKYC.dc.html           |
| `/moderation`            | Moderación                | staff:moderator, staff:admin                | —     | BoModeracion.dc.html    |
| `/disputes`              | Reportes y disputas       | staff:support, staff:finance, staff:admin   | —     | BoDisputas.dc.html      |
| `/disputes/[id]`         | Caso de disputa           | staff:support, staff:finance, staff:admin   | —     | NxBoDisputa.dc.html     |
| `/support`               | Soporte                   | staff:support, staff:admin                  | —     | NxBoSoporte.dc.html     |
| `/chatbot`               | Chatbot                   | staff:support, staff:admin                  | —     | NxBoChatbot.dc.html     |
| `/users`                 | Usuarios y baneos         | staff:support, staff:moderator, staff:admin | —     | BoUsuarios.dc.html      |
| `/users/[id]`            | Usuario 360               | staff:support, staff:moderator, staff:admin | —     | NxBoUsuario.dc.html     |
| `/providers`             | Proveedores               | staff                                       | —     | BoProveedores.dc.html   |
| `/planners`              | Planeadores               | staff                                       | —     | BoPlaneadores.dc.html   |
| `/commissions`           | Comisiones                | staff:finance, staff:admin                  | —     | BoComisiones.dc.html    |
| `/payments`              | Pagos y garantía          | staff:finance, staff:admin                  | —     | FinBoPagos.dc.html      |
| `/ads-review`            | Revisión de anuncios      | staff:moderator, staff:admin                | —     | AdBoAds.dc.html         |
| `/catalog`               | Catálogo                  | staff:admin                                 | —     | CnBoCatalogo.dc.html    |
| `/content`               | Contenido                 | staff:admin                                 | —     | CnBoContenido.dc.html   |
| `/parameters`            | Parámetros dinámicos      | staff:admin                                 | —     | BoParametros.dc.html    |
| `/analytics`             | Analytics                 | staff                                       | —     | BoAnalytics.dc.html     |
| `/analytics/executive`   | Resumen ejecutivo         | staff:admin                                 | sí    | KpEjecutivo.dc.html     |
| `/analytics/marketplace` | Marketplace               | staff:admin                                 | —     | KpMarketplace.dc.html   |
| `/analytics/finance`     | Finanzas de la plataforma | staff:finance, staff:admin                  | —     | KpFinAdmin.dc.html      |
| `/analytics/retention`   | Retención y cohortes      | staff:admin                                 | —     | KpRetencion.dc.html     |
| `/analytics/quality`     | Calidad y fraude          | staff:admin, staff:moderator                | —     | KpCalidad.dc.html       |
| `/analytics/support`     | KPIs de soporte           | staff:support, staff:admin                  | —     | KpSoporte.dc.html       |
| `/analytics/operations`  | KPIs de operaciones       | staff:moderator, staff:admin                | —     | KpOperaciones.dc.html   |
| `/analytics/reports`     | Centro de reportes        | staff:admin                                 | —     | KpReportesAdmin.dc.html |
| `/logs`                  | Logs                      | staff:support, staff:admin                  | —     | BoLogs.dc.html          |
| `/audit`                 | Auditoría                 | staff:admin                                 | —     | NxBoAuditoria.dc.html   |
| `/roles`                 | Roles internos            | staff:admin                                 | —     | NxBoRoles.dc.html       |
| `/health`                | Salud de la plataforma    | staff                                       | —     | NxBoSalud.dc.html       |
