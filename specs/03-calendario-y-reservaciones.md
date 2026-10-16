# SPEC 03 — Calendario y ciclo de reservaciones

> **Estado:** Approved
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-16
> **Objetivo:** Implementar en la API la disponibilidad explícita y el ciclo de solicitudes, aceptación y cancelación de reservaciones para las publicaciones del directorio.

## Scope

**In:**

- Persistencia de ventanas disponibles y bloqueos manuales por publicación, con aislamiento por tenant.
- Intervalos con inicio y fin en formato semiabierto `[inicio, fin)`; se rechazan intervalos vacíos o invertidos. Cada publicación tiene una zona horaria IANA, los intervalos se validan en hora local y se almacenan como instantes UTC.
- Consulta de disponibilidad para los próximos 365 días. Solo se aceptan reservaciones cuyo intervalo completo se encuentre dentro de ese horizonte.
- Un intervalo reservable debe estar contenido en una ventana disponible explícita y no traslaparse con un bloqueo, una solicitud vigente o una reservación aceptada pendiente de pago.
- Modo de reservación configurable por publicación: aprobación del proveedor o instantáneo. El modo predeterminado es aprobación del proveedor.
- Retención de intervalos mientras una solicitud espera aprobación y mientras una reservación aceptada espera el pago que se integrará en una especificación futura. El valor predeterminado de retención es 24 horas, configurable a nivel del sistema; un tiempo de respuesta configurado en la publicación lo reemplaza para solicitudes que requieren aprobación.
- Ciclo de estados de reservación: `REQUESTED`, `ACCEPTED_AWAITING_PAYMENT`, `REJECTED`, `EXPIRED` y `CANCELLED`. Una reservación instantánea pasa directamente a `ACCEPTED_AWAITING_PAYMENT`.
- Cliente y proveedor pueden cancelar una reservación antes de que concluya el flujo de pago. Se conserva actor y motivo, y el intervalo vuelve a estar disponible.
- Emisión transaccional de eventos de dominio para solicitudes, aceptación, rechazo, expiración y cancelación, sin entrega a proveedores externos.
- Endpoints API para consultar disponibilidad, administrar ventanas y bloqueos, crear y listar reservaciones, y aceptar, rechazar o cancelar una reservación.
- Validación de payloads con Zod, contratos compartidos, pruebas unitarias y pruebas e2e de la API.
- Autorización basada en la identidad y el tenant existentes: un cliente solo gestiona sus reservaciones; el proveedor solo administra la disponibilidad y las decisiones de sus propias publicaciones.

**Out of scope (for future specs):**

- Cobro, reembolsos, comisiones, links de pago, facturación y conciliación financiera.
- Sincronización, importación o exportación de calendarios externos (iCal/Google/Apple).
- Interfaz de usuario web o móvil.
- Horarios semanales recurrentes e inventario/capacidad de varias unidades; una publicación admite una sola reservación por intervalo.
- Notificaciones por email, SMS, push o WhatsApp. Los eventos de dominio quedan disponibles para integraciones futuras.
- Reglas configurables de cancelación, cargos, reembolsos o disputas.
- Reservaciones de grupo, planes de eventos con múltiples publicaciones y contribuciones de pago.

## Data model

Adiciones a `packages/database/prisma/schema.prisma` (se agregan las relaciones indicadas a `Tenant`, `Listing` y `User` existentes):

```prisma
enum BookingMode {
  REQUEST_APPROVAL
  INSTANT

  @@map("booking_mode")
}

enum ReservationStatus {
  REQUESTED
  ACCEPTED_AWAITING_PAYMENT
  REJECTED
  EXPIRED
  CANCELLED

  @@map("reservation_status")
}

model ListingBookingSettings {
  id                    String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId              String     @map("tenant_id") @db.Uuid
  listingId             String     @unique @map("listing_id") @db.Uuid
  bookingMode           BookingMode @default(REQUEST_APPROVAL) @map("booking_mode")
  timezoneId            String     @map("timezone_id")
  confirmationTimeHours Int?       @map("confirmation_time_hours")
  createdAt             DateTime   @default(now()) @map("created_at")
  updatedAt             DateTime   @updatedAt @map("updated_at")
  tenant                Tenant     @relation(fields: [tenantId], references: [id])
  listing               Listing    @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@index([tenantId, listingId])
  @@map("listing_booking_settings")
}

model AvailabilityWindow {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  listingId String   @map("listing_id") @db.Uuid
  startAt   DateTime @map("start_at") @db.Timestamptz(6)
  endAt     DateTime @map("end_at") @db.Timestamptz(6)
  createdAt DateTime @default(now()) @map("created_at")
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@index([tenantId, listingId, startAt, endAt])
  @@map("availability_windows")
}

model AvailabilityBlock {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  listingId String   @map("listing_id") @db.Uuid
  startAt   DateTime @map("start_at") @db.Timestamptz(6)
  endAt     DateTime @map("end_at") @db.Timestamptz(6)
  reason    String?
  createdAt DateTime @default(now()) @map("created_at")
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@index([tenantId, listingId, startAt, endAt])
  @@map("availability_blocks")
}

model Reservation {
  id                    String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId              String            @map("tenant_id") @db.Uuid
  listingId             String            @map("listing_id") @db.Uuid
  customerId            String            @map("customer_id") @db.Uuid
  startAt               DateTime          @map("start_at") @db.Timestamptz(6)
  endAt                 DateTime          @map("end_at") @db.Timestamptz(6)
  timezoneId            String            @map("timezone_id")
  status                ReservationStatus @default(REQUESTED)
  expiresAt             DateTime?         @map("expires_at") @db.Timestamptz(6)
  cancelledById         String?           @map("cancelled_by_id") @db.Uuid
  cancellationReason    String?           @map("cancellation_reason")
  createdAt             DateTime          @default(now()) @map("created_at")
  updatedAt             DateTime          @updatedAt @map("updated_at")
  tenant                Tenant            @relation(fields: [tenantId], references: [id])
  listing               Listing           @relation(fields: [listingId], references: [id])
  customer              User              @relation("ReservationCustomer", fields: [customerId], references: [id])
  cancelledBy           User?             @relation("ReservationCancelledBy", fields: [cancelledById], references: [id])
  events                BookingOutboxEvent[]

  @@index([tenantId, listingId, startAt, endAt])
  @@index([tenantId, customerId, createdAt])
  @@index([status, expiresAt])
  @@map("reservations")
}

model BookingOutboxEvent {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId      String    @map("tenant_id") @db.Uuid
  reservationId String    @map("reservation_id") @db.Uuid
  eventType     String    @map("event_type")
  payload       Json
  occurredAt    DateTime  @default(now()) @map("occurred_at")
  publishedAt   DateTime? @map("published_at") @db.Timestamptz(6)
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  reservation   Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)

  @@index([tenantId, occurredAt])
  @@index([publishedAt, occurredAt])
  @@map("booking_outbox_events")
}
```

`Tenant` agrega colecciones para la configuración, ventanas, bloqueos, reservaciones y eventos; `Listing` agrega relaciones con `ListingBookingSettings`, `AvailabilityWindow`, `AvailabilityBlock` y `Reservation`; `User` agrega relaciones separadas para reservaciones como cliente y como actor de cancelación. `ListingBookingSettings` se crea cuando el proveedor configura el calendario. La zona IANA es obligatoria para esa configuración; una publicación existente sin configuración aún no se puede reservar. El modo predeterminado es `REQUEST_APPROVAL`; el tiempo de confirmación es opcional y, si falta, se usa el valor de sistema de 24 horas.

Los eventos del outbox se escriben en la misma transacción que el cambio de estado. Una futura especificación implementará su entrega y reintentos.

## Implementation plan

1. Extender `packages/database/prisma/schema.prisma` con los modelos, estados y relaciones indicados; generar la migración mediante `@vibe-planners/database` y regenerar el cliente Prisma. Verificación: la migración aplica y el cliente se genera sin errores.
2. Añadir contratos en `packages/shared-types/src/booking.ts` y exportarlos desde `packages/shared-types/src/index.ts`; añadir esquemas y validaciones en `packages/shared-validations/src/booking.schema.ts` y exportarlos desde `packages/shared-validations/src/index.ts`. Verificación: el build de ambos workspaces pasa.
3. Implementar en `apps/api/src/modules/booking/booking.service.ts` las operaciones para configurar el calendario de una publicación, administrar ventanas y bloqueos y consultar disponibilidad. Validar publicación publicada, tenant, zona IANA, horizonte de 365 días, contención en ventana y ausencia de traslapes; añadir pruebas del servicio.
4. Reemplazar el controlador placeholder en `apps/api/src/modules/booking/booking.controller.ts` e integrar el servicio en `apps/api/src/modules/booking/booking.module.ts`. Exponer las rutas de configuración, calendario y reservaciones, validar entradas y aplicar autorización de cliente/proveedor. Verificación: cada ruta tiene una prueba de controlador para éxito y rechazo por permisos o validación.
5. Implementar el ciclo de reservación en `BookingService`: cálculo de expiración, aceptación/rechazo/cancelación, expiración efectiva al consultar o modificar una solicitud vencida, prevención atómica de traslapes y registro transaccional de eventos outbox. Verificación: pruebas cubren solicitudes concurrentes, liberación del horario al expirar/cancelar y eventos asociados a cada transición.
6. Añadir pruebas e2e en `apps/api/test/booking.e2e-spec.ts` para consulta de disponibilidad, solicitud, decisión del proveedor, cancelación y aislamiento entre tenants. Verificación final: pasan las pruebas enfocadas de `apps/api`, `npm run build --workspace @vibe-planners/api` y `npm run lint --workspace @vibe-planners/api`.

## Acceptance criteria

- [ ] Una ventana disponible puede crearse y consultarse únicamente para una publicación publicada del tenant autenticado.
- [ ] Un intervalo fuera de una ventana disponible, que traslapa un bloqueo o que cae fuera de los siguientes 365 días no puede reservarse.
- [ ] Un intervalo vacío o con fin anterior al inicio se rechaza; intervalos contiguos no se consideran traslapados.
- [ ] Los intervalos se guardan como instantes UTC y la respuesta conserva la zona IANA de la publicación.
- [ ] Las publicaciones nuevas usan `REQUEST_APPROVAL`; una publicación puede elegir `INSTANT`.
- [ ] Una solicitud pendiente retiene el intervalo hasta su vencimiento; el tiempo configurado en la publicación prevalece sobre el valor de sistema de 24 horas.
- [ ] Una solicitud expirada deja de ocupar disponibilidad y su estado pasa a `EXPIRED` cuando se consulta o se intenta modificar.
- [ ] Una publicación no permite dos reservaciones activas que se traslapen, incluso ante solicitudes concurrentes.
- [ ] En modo de aprobación, el proveedor propietario puede aceptar o rechazar; aceptar produce `ACCEPTED_AWAITING_PAYMENT`.
- [ ] En modo instantáneo, la reservación disponible produce `ACCEPTED_AWAITING_PAYMENT` sin aprobación manual.
- [ ] Solo el cliente titular o el proveedor propietario puede cancelar; se registra actor y motivo y el intervalo se libera.
- [ ] La identidad de cliente y proveedor se obtiene del principal autenticado, no de identificadores arbitrarios enviados en el payload.
- [ ] Las operaciones de un tenant no pueden leer ni modificar ventanas, bloqueos o reservaciones de otro tenant.
- [ ] Cada transición genera un evento outbox en la misma transacción; una falla al persistir el evento revierte también la transición.
- [ ] Las pruebas unitarias y e2e enfocadas pasan, además del build y lint de la API.

## Decisions

- **Sí:** desarrollar Calendario y Reservaciones como el siguiente vertical slice, dependiente de SPEC 01 y SPEC 02.
- **Sí:** limitar esta entrega a persistencia, dominio y API; la web y las apps móviles tendrán especificaciones propias.
- **Sí:** usar ventanas disponibles explícitas y bloqueos manuales; no asumir disponibilidad fuera de las ventanas cargadas.
- **Sí:** permitir intervalos con hora, usando zona IANA por publicación y UTC para persistencia.
- **Sí:** mantener una sola reservación concurrente por publicación e intervalo; la capacidad cuantitativa se deja para otra especificación.
- **Sí:** comenzar con aprobación del proveedor y permitir modo instantáneo por publicación.
- **Sí:** mantener las solicitudes y aceptaciones como retenciones hasta 24 horas por defecto o el tiempo de confirmación definido por la publicación.
- **Sí:** aceptar cancelaciones de cliente y proveedor, registrar actor/motivo y liberar el horario; no calcular reembolsos.
- **Sí:** registrar eventos de dominio en un outbox transaccional; la entrega y las notificaciones externas quedan diferidas.
- **No:** incluir pagos, calendarios externos, recurrencias, inventario, interfaz gráfica o el motor de políticas legales en este ciclo.

## Risks

| Risk | Mitigation |
| --- | --- |
| Publicaciones existentes aún no tienen zona horaria ni ventanas disponibles. | Exigir que el proveedor configure la zona IANA y ventanas explícitas antes de permitir solicitudes; no inferir disponibilidad. |
| Solicitudes simultáneas podrían aceptar el mismo intervalo. | Serializar la comprobación y creación por publicación dentro de una transacción y cubrir el caso concurrente con pruebas. |
| Eventos outbox sin consumidor no disparan notificaciones. | Dejar claro que esta entrega solo persiste los eventos; agregar entrega y reintentos en una especificación posterior. |

## What is **not** in this spec

- Integración con Stripe u otro procesador de pagos, reembolsos o liquidación de comisiones.
- Sincronización o exportación de calendarios externos.
- Interfaces web o móvil.
- Capacidad reservable mayor que una unidad y disponibilidad semanal recurrente.
- Envío de email, SMS, push o WhatsApp y entrega/reintentos del outbox.
- Gestión de planes de evento con múltiples servicios.
