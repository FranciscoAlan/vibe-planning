# SPEC 02 — Modelos de dominio y contratos de Directorio y Publicaciones

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-30
> **Objetivo:** Definir el modelo de datos relacional de Directorio y Publicaciones en Prisma con seeder de catálogos base para México, tipos compartidos, esquemas de validación Zod y endpoints de consulta activos en la API.

---

## Scope

**In:**

- Modelado relacional en `packages/database/prisma/schema.prisma` para el dominio de Directorio:
  - `Category`: catálogo de primer nivel (Locales, Música, Fotografía, etc.) con slug y metadatos.
  - `Subcategory`: especializaciones vinculadas a categorías (ej. Mariachis, DJs, Salones, Jardines).
  - `Listing`: entidad principal de publicación/servicio asociada a `tenant_id` y al proveedor (`owner_id`/`User`).
  - `ListingMedia`: fotos, videos y portafolio de la publicación con orden y metadatos de Cloudinary.
  - `ListingPromotion`: descuentos y promociones temporales o de tracción vinculados a la publicación (porcentaje o monto fijo, rango de fechas de vigencia, código o trigger automático, límite de canjes y estado activo).
  - Estructura de precios híbrida: columnas base (precio mínimo, moneda, unidad de cobro) más campo JSONB estructurado (`pricingRules`) para tarifas por día de la semana, temporada alta y paquetes.
- Migración de Prisma (`packages/database/prisma/migrations/`) generada para incorporar las nuevas tablas e índices compuestos `(tenant_id, id)`.
- Script de seeder inicial (`packages/database/prisma/seed.ts`) que precarga las 10 categorías principales y sus respectivas subcategorías para eventos en México.
- Tipos e interfaces en `packages/shared-types` (`ICategory`, `ISubcategory`, `IListing`, `IListingMedia`, `IListingPromotion`, `ListingStatus`, `PriceUnit`, `DiscountType`).
- Esquemas de validación Zod en `packages/shared-validations` para filtros de consulta, payloads de creación/edición de publicaciones y promociones (`createListingSchema`, `updateListingSchema`, `listingQueryFilterSchema`, `createPromotionSchema`).
- Activación de endpoints de consulta y gestión en `apps/api/src/modules/directory/`:
  - `GET /directory/categories`: lista jerárquica de categorías con sus subcategorías activas.
  - `GET /directory/listings`: búsqueda y listado paginado filtrable por categoría, subcategoría, rango de precio, ubicación y promociones activas.
  - `GET /directory/listings/:id`: detalle completo de la publicación con su galería, reglas de precio y promociones vigentes.
  - `POST /directory/listings` y `PUT /directory/listings/:id`: controladores con validación estricta de DTO contra Zod (validación de payload funcional; persistencia y autorización de proveedor conectada).
  - `POST /directory/listings/:id/promotions`: creación y configuración de promociones/descuentos vinculados a una publicación.
- Pruebas unitarias en `apps/api` con Vitest para validar los servicios y controladores de `directory`.

**Out of scope (for future specs):**

- Modelado y lógica del módulo `booking` (calendario de 365 días, bloqueos de fechas, reservas, iCal) → SPEC futura.
- Modelado y lógica del módulo `finance` (Stripe payments, escrow, dispersión de comisiones, facturación SAT/CFDI) → SPEC futura.
- Subida física de binarios a Cloudinary desde el cliente (los registros guardan URLs/public_ids ya generados) → SPEC futura.
- Interfaz gráfica en `apps/web` (Next.js) o `apps/mobile` (Expo) → SPEC futura.
- Lógica de mensajería en tiempo real y notificaciones → SPEC futura.

---

## Data model

```prisma
// packages/database/prisma/schema.prisma (adiciones al modelo existente)

enum ListingStatus {
  DRAFT
  PENDING_REVIEW
  PUBLISHED
  SUSPENDED
  ARCHIVED

  @@map("listing_status")
}

enum PriceUnit {
  PER_EVENT
  PER_HOUR
  PER_PERSON
  PER_DAY

  @@map("price_unit")
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT

  @@map("discount_type")
}

model Category {
  id            String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String
  slug          String        @unique
  description   String?
  icon          String?
  sortOrder     Int           @default(0) @map("sort_order")
  isActive      Boolean       @default(true) @map("is_active")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")
  subcategories Subcategory[]
  listings      Listing[]

  @@map("categories")
}

model Subcategory {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  categoryId  String    @map("category_id") @db.Uuid
  category    Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  name        String
  slug        String    @unique
  description String?
  sortOrder   Int       @default(0) @map("sort_order")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  listings    Listing[]

  @@index([categoryId])
  @@map("subcategories")
}

model Listing {
  id                  String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId            String         @map("tenant_id") @db.Uuid
  tenant              Tenant         @relation(fields: [tenantId], references: [id])
  ownerId             String         @map("owner_id") @db.Uuid
  owner               User           @relation(fields: [ownerId], references: [id])
  categoryId          String         @map("category_id") @db.Uuid
  category            Category       @relation(fields: [categoryId], references: [id])
  subcategoryId       String         @map("subcategory_id") @db.Uuid
  subcategory         Subcategory    @relation(fields: [subcategoryId], references: [id])

  title               String
  slug                String
  description         String
  status              ListingStatus  @default(DRAFT)

  // Ubicación y cobertura
  city                String
  state               String
  country             String         @default("MEX")
  address             String?
  latitude            Float?
  longitude           Float?

  // Estructura de Precios (Híbrida)
  basePrice           Decimal        @map("base_price") @db.Decimal(12, 2)
  currency            String         @default("MXN")
  priceUnit           PriceUnit      @default(PER_EVENT) @map("price_unit")
  pricingRules        Json?          @map("pricing_rules") // Reglas de fin de semana, paquetes, temporadas

  // Capacidades y logística
  minGuests           Int?           @map("min_guests")
  maxGuests           Int?           @map("max_guests")
  leadTimeHours       Int            @default(48) @map("lead_time_hours")
  cancellationPolicy  String?        @map("cancellation_policy")
  serviceRules        String?        @map("service_rules")

  createdAt           DateTime       @default(now()) @map("created_at")
  updatedAt           DateTime       @updatedAt @map("updated_at")

  media               ListingMedia[]
  promotions          ListingPromotion[]

  @@unique([tenantId, slug])
  @@index([tenantId, id])
  @@index([tenantId, categoryId, subcategoryId])
  @@index([tenantId, status])
  @@index([city, state])
  @@map("listings")
}

model ListingPromotion {
  id          String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  listingId   String        @map("listing_id") @db.Uuid
  listing     Listing       @relation(fields: [listingId], references: [id], onDelete: Cascade)
  title       String
  description String?
  code        String?       // Cupón o código promocional opcional
  discountType DiscountType @default(PERCENTAGE) @map("discount_type")
  discountValue Decimal     @map("discount_value") @db.Decimal(12, 2)
  startDate   DateTime      @map("start_date")
  endDate     DateTime      @map("end_date")
  maxRedemptions Int?       @map("max_redemptions")
  redemptionCount Int       @default(0) @map("redemption_count")
  isActive    Boolean       @default(true) @map("is_active")
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  @@index([listingId])
  @@index([code])
  @@map("listing_promotions")
}

model ListingMedia {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  listingId   String   @map("listing_id") @db.Uuid
  listing     Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  url         String
  publicId    String   @map("public_id")
  mediaType   String   @default("image") @map("media_type") // image, video
  sortOrder   Int      @default(0) @map("sort_order")
  isCover     Boolean  @default(false) @map("is_cover")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([listingId])
  @@map("listing_media")
}
```

---

## Implementation plan

1. Actualizar `packages/database/prisma/schema.prisma` agregando los enums `ListingStatus`, `PriceUnit`, `DiscountType` y los modelos `Category`, `Subcategory`, `Listing`, `ListingMedia` y `ListingPromotion` con sus relaciones hacia `Tenant` y `User`.
2. Generar el script de migración SQL usando `npx prisma migrate diff` y actualizar el cliente local en `packages/database`.
3. Crear `packages/database/prisma/seed.ts` configurando el seeder de las 10 categorías base y subcategorías representativas para el mercado de México (Locales, Música, Decoración, Fotografía, Banquetes, Barra de snacks, Meseros, Animadores, Mobiliario, Iluminación).
4. Agregar el script `"db:seed": "prisma db seed"` en `packages/database/package.json` configurando `ts-node` o `tsx`.
5. Definir interfaces y tipos TypeScript en `packages/shared-types` (`src/directory.ts`) para categorías, publicaciones y promociones (`ICategory`, `ISubcategory`, `IListing`, `IListingMedia`, `IListingPromotion`, etc.) y reexportarlos en `src/index.ts`.
6. Diseñar esquemas Zod en `packages/shared-validations` (`src/directory.schema.ts`) con validaciones de rangos de precio, slugs, reglas de pricing JSON, creación de promociones y filtros de búsqueda; reexportar en `src/index.ts`.
7. Actualizar `apps/api/src/modules/directory/directory.service.ts` conectando consultas Prisma a `Category`, `Subcategory`, `Listing` y `ListingPromotion` con filtrado y paginación.
8. Implementar los endpoints en `apps/api/src/modules/directory/directory.controller.ts` reemplazando los stubs `501` con las respuestas tipadas reales para listados, detalle y gestión de promociones.
9. Crear pruebas unitarias en `apps/api/src/modules/directory/directory.service.spec.ts` y `directory.controller.spec.ts` con Vitest validando respuestas esperadas, reglas de descuento y filtros.
10. Validar la compilación global y linter ejecutando `npm run lint` y `npm run build` en el monorepo.

---

## Acceptance criteria

- [x] `packages/database/prisma/schema.prisma` contiene los modelos `Category`, `Subcategory`, `Listing`, `ListingMedia`, `ListingPromotion` y sus enums correspondientes.
- [x] La migración de Prisma se genera limpiamente y el cliente de base de datos compila sin errores de tipos.
- [x] `packages/database/prisma/seed.ts` ejecuta e inserta las 10 categorías principales con sus subcategorías.
- [x] `packages/shared-types` exporta `ICategory`, `ISubcategory`, `IListing`, `IListingMedia`, `IListingPromotion`, `ListingStatus`, `PriceUnit` y `DiscountType`.
- [x] `packages/shared-validations` exporta `createListingSchema`, `updateListingSchema`, `createPromotionSchema` y `listingFilterSchema`, bloqueando payloads inválidos.
- [x] `GET /directory/categories` responde `200` con la lista de categorías y sus subcategorías asociadas.
- [x] `GET /directory/listings` responde `200` con paginación y permite filtrar por `categoryId`, `subcategoryId`, `city`, rango de precios y si tiene promociones activas.
- [x] `GET /directory/listings/:id` responde `200` con el detalle, galería y promociones vigentes, o `404` si la publicación no existe.
- [x] `POST /directory/listings` valida el body contra el schema Zod y retorna `201` con la publicación creada asociada al tenant actual.
- [x] `POST /directory/listings/:id/promotions` valida y crea una promoción asociada a la publicación.
- [x] Las pruebas de Vitest para el módulo `directory` pasan exitosamente (`npm run test --workspace=apps/api`).
- [x] `npm run lint` y `npm run build` pasan exitosamente en todos los paquetes y apps del monorepo.

---

## Decisions

- **Sí:** Abordar en SPEC 02 exclusivamente el dominio de Directorio y Publicaciones. *Razón:* Mantener la especificación atómica, verificable y con alcance acotado antes de abordar calendarios o pasarelas de pago.
- **Sí:** Enfoque híbrido de precios (columnas relacionales clave como `basePrice`, `currency`, `priceUnit` + campo `pricingRules` en JSONB). *Razón:* Otorga máxima flexibilidad para paquetes personalizados y reglas de temporada sin sobrecargar la base de datos con decenas de tablas relacionales rígidas.
- **Sí:** Seeder cerrado precargado para las categorías iniciales en México. *Razón:* Garantiza que los ambientes de desarrollo y pruebas locales cuenten de inmediato con el catálogo oficial sin requerir configuración manual previa.
- **No:** Pantallas de frontend en esta spec. *Razón:* Se acordó consolidar primero la capa de persistencia, tipos compartidos y contratos de API antes de implementar las interfaces de usuario.
- **No:** Módulos `booking` y `finance` en esta spec. *Razón:* Su complejidad de reglas de negocio, sincronización de calendarios y escrow con Stripe requiere especificaciones dedicadas posteriores.

---

## What is **not** in this spec

- Motor de reservas y calendario interactivo de disponibilidad (SPEC de Booking).
- Procesamiento de pagos, comisiones y facturación electrónica (SPEC de Finance).
- Componentes de interfaz gráfica en `apps/web`, `apps/mobile` o `apps/backoffice`.
- Carga de imágenes directas a Cloudinary desde el cliente o servidor.
- Chat y mensajería en tiempo real.

Cada uno de estos puntos se especificará e implementará en sus respectivas fases posteriores.
