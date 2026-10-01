# Vibe Planners — Product Context & Master Architecture

## 1. Executive Summary & Vision

**Vibe Planners** is a multi-sided event planning and management platform connecting event hosts (clients), service providers (individuals and businesses), and professional event planners. Initially focused on the Mexican market, the platform scales to support global multi-currency and multi-language operations.

The platform streamlines discovery, quoting, availability checking, booking, secure escrow-style payments, and collaborative coordination for all types of celebratory events (Weddings, Birthdays, Anniversaries, Baptisms, Quinceañeras, Corporate Gatherings, Holiday Parties / Posadas, etc.).

---

## 2. Target Personas & User Roles

1. **Clients (Hosts / Clientes):**
   - Search, compare, and book verified service providers and venues.
   - Manage event budget and timeline.
   - Create payment contribution links to split costs with co-hosts or guests.
   - Track booking status, chat with providers, and leave verified reviews.

2. **Service Providers (Proveedores):**
   - Individuals and businesses across event categories (venues, catering, music, photography, decor, etc.).
   - Organizational multi-user management (owners, managers, accountants, staff).
   - Manage listings, availability calendar (365 days), pricing rules, and promotions.
   - Receive bookings, manage contracts, invoices (Mexican RFC / foreign entities), and payouts.
   - WhatsApp integration and automated messaging.

3. **Event Planners (Planeadores de Eventos):**
   - Collaborative partner accounts.
   - Curate portfolios of vetted providers and client rosters.
   - Earn split/referral commissions on coordinated services.
   - Coordinate unified master plans with payment schedules for clients.

4. **Super Administrators (Backoffice):**
   - Platform governance, KYC validation, dispute resolution, and content moderation.
   - User, listing, and provider ban/suspension enforcement.
   - Dynamic platform parameters, commission overrides, analytics, and operational metrics.

---

## 3. Categories & Subcategories

Core service categories covered:

- **Venues & Spaces (Locales / Salones / Jardines / Terrazas)**
- **Music & Audio (Músicos, Bandas, Mariachis, DJs, Sonido)**
- **Decoration & Flowers (Decoradores, Floristas, Arreglos, Globos)**
- **Photography & Video (Fotógrafos, Videógrafos, Photo Booths)**
- **Food & Catering (Banquetes, Platillos, Taquizas, Food Trucks)**
- **Bar & Drinks (Barra de snacks, Coctelería, Mesas de dulces)**
- **Staffing & Service (Meseros, Bartenders, Seguridad, Limpieza)**
- **Entertainment & Animation (Animadores, Bailarines, Shows, Magos)**
- **Furniture & Equipment (Mobiliario, Carpas, Pistas de baile, Vajilla)**
- **Lighting & Special Effects (Iluminación arquitectónica, Pirotecnia fría)**

---

## 4. Key Functional Modules & Architecture

### 4.1. Identity, Profiles & Multi-tenancy

- Multi-tenant architecture (single schema with indexed `tenant_id`).
- Phone-first identity linking: unified accounts across OAuth (Google, Apple, Facebook) and passwordless phone OTP / credentials to prevent duplicate profiles.
- Two-factor authentication (TOTP) and session management.
- Multi-organization support for providers (role-based access control for team members).
- Account standing and moderation: suspensions, blacklisting, and KYC verification tiering.

### 4.2. Listings & Directory Management

- Listing metadata: title, description, category/subcategory tags, location, requirements, lead time, min/max guest capacity, cancellation policies.
- Media management: gallery, video showcases, verification badges.
- Pricing engine:
  - Base price, dynamic weekday/weekend/seasonal rates, custom holiday pricing.
  - Milestone discounts, promotional packages, and traction-based discounts.
- Approval workflows: draft, pending review, published, suspended.

### 4.3. Calendar, Scheduling & Availability

- Real-time 365-day availability engine.
- Flexible vs. fixed date rules, preparation lead-time buffers, and operating schedules.
- External calendar synchronization (iCal import/export, Google Calendar).
- Instant booking vs. inquiry-first / request-to-book flows.

### 4.4. Search, Discovery & Ranking Engine

- Geolocation search (city, state, country, radius).
- Filters: event date (fixed or flexible), category, budget range, guest count, amenities, rating, instant book.
- Search result sections: fast tabs, featured / sponsored listings, recently viewed, trending, suggested.
- Proprietary Ranking Algorithm considering:
  - Quality score (cancellations, punctuality, complaint resolution).
  - Review score and sub-ratings (punctuality, cleanliness, value for money, professionalism).
  - Popularity & booking frequency.
  - Price competitiveness and calendar responsiveness.
  - Top Provider badges and verified partner seals.

### 4.5. Finance, Payments & Escrow

- Secure online payments via Stripe (credit/debit cards, bank transfers, OXXO in Mexico).
- Escrow hold: funds secured until service milestone delivery.
- Split / Shared Payments:
  - Contribution templates and payment links for group funding / guest contributions.
- Fiscal & Billing compliance:
  - RFC validation, tax withholding (SAT in Mexico), CFDI generation, corporate entities (LLC / SA de CV).
  - Banking details, payout schedules, and payout fee structures.
- Platform commission calculation:
  - Tiered client fees, provider commission, and planner referral share.

### 4.6. Messaging, Notifications & Automation

- Real-time chat (WebSockets) with file attachments and quote negotiation.
- Automated system messages, booking status updates, and reminders.
- Omnichannel notifications: Email (Resend), SMS (Twilio), Push notifications (Firebase Cloud Messaging).
- WhatsApp Business integration for provider quick-responses.

### 4.7. Reviews, Reputation & Analytics

- Mutual review system (Host reviews Provider; Provider reviews Host).
- Multi-criteria ratings (punctuality, quality, communication, cost/benefit).
- Provider analytics dashboard: views, conversion rate, search impressions, revenue reports.
- Mentorship and community advice system between experienced providers and newcomers.

---

## 5. Implementation Roadmap (Phases)

| Phase       | Title                          | Core Objectives                                                                                                                                       |
| ----------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 1** | **Discovery & Foundation**     | Domain data models in Prisma, API contract definitions, core DTOs & validation schemas, shared UI design tokens.                                      |
| **Phase 2** | **MVP Core**                   | Functional Auth & Identity (phone + OAuth), Listing creation/publishing, Search & Filter engine, Calendar & Booking flow, Stripe payment integration. |
| **Phase 3** | **Multi-tenant & Planners**    | Organization teams & permissions, Event Planner co-management, split payment contribution links, financial & payout dashboard.                        |
| **Phase 4** | **Testing, Real-Time & Comms** | WebSockets chat, omnichannel notifications (SMS/Email/Push), full automated E2E test suites, CI/CD pipeline deployment.                               |
| **Phase 5** | **Soft Launch & Beta**         | Staging dry runs, production deployment, initial provider onboarding in selected pilot regions (e.g., CDMX / GDL / MTY).                              |
