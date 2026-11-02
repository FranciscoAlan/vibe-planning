# Vibe Planners Design Reference

## Purpose and Sources

This document consolidates the useful design information from the exported canvas. It is a visual reference, not an approved specification for every screen or business rule.

- [Screen index](index.html): entry point to all exported HTML mockups.
- [Component inventory](documentacion/componentes-vibe-planners.md): an estimated inventory of 71 entries, grouped by variants, states and usage.
- [Original canvas](https://claude.ai/artifact/RYZ7UjJbaD4pAsa6tZwwEA): external design source; local exports are a snapshot, not a live mirror.
- `fuente-lienzo/`: original canvas files and positions, retained as a backup.
- [SPEC 06](../../specs/06-design-reference-and-public-home.md): approved scope for the initial public web home and shared components.

Product behavior must follow approved specifications and verified API contracts. A control drawn in a mockup does not imply that its integration exists.

## Export Coverage

The local index was checked on 2026-11-01 using its HTML DOM. It contains 232 unique links, each resolving to an existing HTML file in `paginas/`, with no missing files.

| Index Group                  | Entries |
| ---------------------------- | ------: |
| Logo                         |       1 |
| Web screens                  |      95 |
| Mobile screens               |      89 |
| Backoffice                   |      23 |
| Components and design system |      12 |
| Emails                       |      10 |
| SMS and push template boards |       2 |
| Total                        |     232 |

These are exported artboards, not 232 independently implemented pages. The index categories are preserved as exported and are not an authoritative platform classification.

### Coverage Limitations and Discrepancies

- [App mobile](paginas/App.html) is listed in the web group despite being a mobile exploration mockup.
- [Backoffice mobile](paginas/BackofficeMovil.html) exists, although the final delivery summary describes backoffice as desktop-only. This single condensed mockup does not establish complete mobile backoffice coverage.
- Most mobile mockups are fixed-size 390 x 844 snapshots with reduced content. They do not specify complete scrolling pages, every responsive breakpoint or every interaction state.
- Organization settings and organization security were intentionally described as desktop-oriented; mobile parity must not be inferred from the total count.
- Some component boards use fixed heights and `overflow:hidden`. Earlier resizing claims are not proof that all content fits.
- File existence and DOM inspection do not establish visual quality, accessibility compliance or functional completeness. Verify the relevant mockups in a browser when implementing their slice.

## Visual Language

The [design system board](paginas/SistemaDiseno.html) and [base component board](paginas/Componentes.html) describe the shared visual direction:

- Plum `#2B1B3D`: primary text and dark surfaces.
- Cream `#FFF8F1`: page backgrounds.
- Raspberry `#C42A50`: primary actions.
- Amber `#F6B93B`: accents, categories and labels.
- Sand `#E6D9CC`: borders and disabled surfaces.
- Plus Jakarta Sans at weights 400, 600 and 800.
- An 8 px spacing base, commonly using 8, 16, 24, 32 and 48 px.
- Reference radii: 12 px for fields, 16 px for cards and 22-24 px for buttons.
- A V-shaped logo with an amber spark, in light, dark and app-icon variants.

The design system shows a display/title/body/support scale. Individual pages use their own values, so fixed sizes should not be copied without checking their containers.

States must include text or another accessible indicator, not color alone. Interactive targets should be at least 44 px. Icon-only controls need accessible names, and fields need labels. Focus, loading, disabled and error states must be implemented, not inferred from static drawings.

The source estimates plum-on-cream contrast at approximately 14:1 and white-on-raspberry at approximately 5.5:1. These are unverified estimates, not acceptance evidence. Measure the actual combinations used by the implementation.

## Public Discovery

- [Public home](paginas/Home.html): brand navigation, provider/login/registration access, city/date/service search, category shortcuts and featured listing cards. The mockup uses color blocks for media and placeholders for names, prices and ratings.
- [Mobile exploration](paginas/App.html): search, categories, compact listing cards and bottom navigation for Explore, My plan, Messages and Profile. This is not a prescription to add authenticated navigation to the public web home.
- Search results: search summary, categories, budget/rating/capacity filters, instant-booking/verification/promotion filters, sorting, result count, favorites and pagination.
- [Map results](paginas/ResultadosMapa.html): result list alongside price pins, selected/visited states, clusters, zoom, search-on-map-move and a selected result preview. Mobile uses a map and a bottom sheet.
- [Listing detail](paginas/Detalle.html): gallery, rating and seals, provider summary, description, capacity, notice period, duration, confirmation time, service rules, cancellation policy and reviews. The reservation panel includes price, availability, guests, reservation and quote actions.
- [Gallery viewer](paginas/DetalleGaleria.html): image/video display, previous/next, counter, thumbnails, caption, zoom, save and close. Video includes playback, progress and sound controls.
- [Listing location](paginas/DetalleUbicacion.html): service area, approximate location and external map access; the design says the exact address is shared after confirmation. Treat address disclosure as a security requirement to reconcile with the eventual API.
- Provider profile: cover, avatar, category/location, verification and top-provider seals, save/message actions, rating, completed events, response time, publications, reviews, introduction, service area and reporting.
- Public content: Services for clients/providers/planners, News campaigns, Blog topics and event-related editorial content, Community categories and discussions, and About information.
- Help: topic cards, FAQ accordions, articles, tutorials, support channels and feedback.
- Legal/trust pages: version/date, document navigation, readable sections, cancellation/refund tables, modification policies and support access. The [cancellation policy board](paginas/NxPolCancel.html) uses placeholder thresholds and percentages.

## Account and Onboarding

- Login prioritizes a phone number with country code, followed by social options and email/password. SMS verification uses six digits and a resend countdown.
- Email registration includes name, email, phone, password and terms/privacy acceptance. Phone uniqueness and account activation must follow the approved identity contract, not the drawing alone.
- Onboarding starts with client, provider or event-planner selection and offers continuation or skipping. Profiles may be extended later in the design proposal.
- Client steps collect event type, fixed/flexible date, city and guests, then requested service categories and optional budget.
- Provider steps collect individual/company type, trade name, category, service city and contact; then identity documents, RFC and payout CLABE. The proposal permits drafting a listing while verification is reviewed.
- Planner steps collect brand/name, experience, event types, base city and optional portfolio; then provider invitations, RFC and payout CLABE. Cooperation commission rates remain placeholders.
- Profile includes personal information, verification indicators, profiles, reviews and history.
- Identity verification depicts three levels: contact, identity/document plus selfie, and fiscal details for providers/planners. Required evidence and permissions per level still need a policy.
- Security settings cover phone/email, linked social accounts, TOTP and sessions. Preferences cover channel choices, language, currency and time zone.
- Privacy/data settings cover export, consents and account deletion; legal conditions and retention behavior are not defined by the mockup.
- SSO and [organization security](paginas/NxOrgSeguridad.html) depict identity-provider setup, SAML/OIDC choices, mandatory access policies and team sessions. These are future integration proposals, not selected protocols or implemented capabilities.
- Activity history and suspended-account appeals cover security events and access restrictions.

## Client Planning and Reservations

- Signed-in home includes personalized search, fixed/flexible dates, featured/advertised listings, recent items, promotions, suggestions, notifications and invitations.
- Event plan includes event metadata, edit/add-service actions, budget/paid/pending/service totals and services with explicit booking or quotation states.
- Contributions include progress toward a goal, equal-share/fixed/free-amount templates, shareable payment links and recent contributions. Link creation adds target, participants, expiry, message and preview; the public contribution page does not require an account in the design.
- [Guest list](paginas/NyInvitados.html) adds response counts, companions, contact information, RSVP link, invitations, reminders and contact import. This was introduced as a design extension, not an already-approved product requirement.
- [Event budget](paginas/NyPresupuesto.html) adds budgeted/quoted/paid/available totals and category differences. Calculation semantics require a separate contract.
- Favorites distinguish listings/providers and collections. Collection detail includes notes, estimated total, sharing with collaborators and adding an option to a plan.
- Rewards depict points, level progress, coupon redemption, referrals, coupons and history. Mentorship adds searching, requesting and managing sessions. No points scale, level benefits or earning rules are defined.
- Reservation lists distinguish upcoming, past and cancelled bookings. Quote requests collect event date, guests, place, optional budget and details, without charging on submission.
- Reservation detail depicts request, quote, deposit, service and review milestones, with balances, messages and cancellation actions.
- Modification, cancellation, dispute and reporting flows include reasons, evidence, provider approval, price differences or refund breakdowns. Contracts and quote comparison are additional design proposals.
- Review forms depict criterion ratings, comment and photos. Criterion names vary across listing descriptions and review forms; do not infer a final rating schema from them.
- Payment UI includes deposit/full payment, card/SPEI/OXXO options, totals and cancellation policy; saved methods, optional billing data, payment history and receipts are separate screens.

## Provider and Planner Operations

- Provider desktop navigation covers Dashboard, Calendar, Listings, Ads, Messages, Rewards, Market, Finance, Team, Subscription and Help. Mobile snapshots commonly use Today, Agenda, Messages and Finance instead.
- Dashboard includes new reservations, unread messages, monthly revenue, rating, today's agenda, notifications, listing states and view/conversion summaries.
- Calendar depicts month/week controls, listing filters, confirmed/pending/blocked states, day selection, availability, special prices, promotions, notice/capacity reminders, date blocking and export/sync actions.
- Listing management includes status, views and reservations. Creation covers title/category/subcategory/type, description/tags, location/contact, gallery/cover/order, pricing/discounts, booking rules and review submission.
- [Listing location editor](paginas/CrearUbicacion.html) proposes address search, a pin and service radius. Map-provider selection remains open.
- Provider reservation requests offer quoting/rejection. Messaging includes conversation filters, system messages, attachments, a quote card, reservation context and reporting.
- Finance covers available/protected balances, payouts, net revenue, movements, bank destination, withdrawals, CFDI, earnings periods and per-listing breakdowns.
- [Taxes and withholdings](paginas/NyImpuestos.html) depicts IVA, ISR/IVA withholding, invoice detail and statement download. Rates and formulas explicitly require an accountant.
- Ads cover campaign objectives, approved listings, audience/location, dates, daily budget, review/payment, pause/edit/duplicate, performance, balance and policies. Daily budgeting is a design assumption, not a selected billing model.
- Market/reporting covers category position, quality criteria, response/cancellation rates, comparisons and high-demand dates.
- Team/permissions, subscriptions, organization settings, integrations and planner portfolios are separate operational areas. Drawn role names and plan benefits do not establish authorization or commercial contracts.
- Planner dashboard depicts clients, provider portfolio, coordinated plans and cooperation commissions.

## Backoffice

The 23 backoffice boards cover overview, KYC, moderation, reports/disputes, users/bans, providers, planners, commissions, parameters, analytics, logs, protected payments, ad review, catalog, editorial content, staff access, support, dispute detail, user 360, chatbot, audit, internal roles and platform health.

Actions include review/approve/reject, suspend/ban, payment release/hold/refund, catalog/content editing and parameter changes. Support adds ticket ownership/SLA; dispute detail adds chronology/evidence/decision; user 360 adds internal notes. Staff access depicts SSO and a second factor.

Environment and tenant labels are illustrative. The design is not an authorization policy, payment-release rule or proof of audit logging. Earlier menu updates do not establish that every export has identical navigation.

## Communication and System States

- Ten email designs cover welcome, verification code, quotation/request, booking confirmation, event/payment reminder, receipt, contribution invitation, cancellation/refund, review and account suspension.
- Email proposals use table layouts, inline styles, Arial fallback, preheaders, detail blocks and action buttons. A production logo should use an email-compatible asset; compatibility still needs client testing.
- [SMS templates](paginas/PlantillasSMS.html) contain five Spanish/English message types: verification, booking confirmation, payment reminder, event reminder and new-login security notice.
- SMS character counts are approximate. Encoding and segmentation depend on the actual substituted message, GSM-7 compatibility and provider behavior; do not calculate cost from placeholder counts alone.
- [Push templates](paginas/PlantillasPush.html) contain six Spanish/English types: message, quote/request, booking, payment, contribution and review, with proposed destinations.
- The push item titled "Quotation received" actually describes a new quotation request to a provider. Preserve that discrepancy until message-event names and recipients are specified.
- System boards include empty/no-result states, loading/skeletons, offline, maintenance, 403/404/500, alerts, toasts, confirmations, sharing and cookie consent.
- Support depicts a chatbot with human handoff, ticket list/detail and help articles. Automation behavior, escalation and SLA values remain undefined.

## Component Inventory Status

The [visual inventory](paginas/InventarioComponentes.html) contains 71 rows across seven groups: base, forms, navigation, data, media, overlays/state and domain. Some rows combine multiple concepts, such as Checkbox/Radio/Toggle or Modal variants; rows are not a mandatory one-to-one implementation count.

The Markdown inventory remains an estimate. Its suggested `packages/ui/src/` folders are proposals, not the current repository layout. SPEC 06 defines the smaller initial component set and preserves the existing Button API.

Mockups use individual inline styles; they do not consume a shared implementation of these components or tokens. Changes to the visual board and the Markdown inventory can diverge and require explicit reconciliation when their scope is implemented.

## Security and Integration Constraints

- Card entry must use hosted/tokenized payment-provider elements. The mockup statement that card data is not stored is only true if the integration enforces it; decorative card fields do not establish PCI-safe processing.
- Payment protection, release timing, refunds and provider cancellation promises require verified business rules and legal review. Do not render them as actual guarantees in a demonstration.
- Identity documents, phone numbers, RFC, CLABE, addresses, evidence and activity logs require access controls and data-retention decisions beyond the drawings.
- Google/Apple/Facebook buttons must follow provider branding requirements when real sign-in is implemented.
- Maps are illustrations. Provider, attribution, usage limits and address-disclosure behavior must be specified before integration.
- Twilio, Resend, Firebase, WhatsApp, calendar services and payment providers mentioned in the design are integration references. Their presence in a board does not authorize new service setup.

## Decisions Still Required Beyond SPEC 06

- Legal text, cancellation/modification/refund rules, dispute handling, contracts, privacy, deletion/export and advertising terms.
- Commissions, referral points/levels, subscription benefits/prices, advertising charging model, payout fees/timing and fiscal calculations.
- KYC evidence, verification levels, review periods, organization permissions, internal roles and SSO protocols/policies.
- Map provider, calendar behavior, messaging events/destinations, support escalation and Community moderation.
- Translation architecture and reviewed English UI/email copy. Screens/emails are Spanish-first; only SMS/push already contain both languages.
- Responsive completeness and interaction states for future screens, rather than duplication of every artboard as a production route.

The historical route proposal includes public, auth, client and dashboard groups, plus News/Community subdomains. These remain proposals outside the approved slice. In particular, two `/messages` routes in different Next.js route groups would collide because groups do not change the URL; resolve ownership before adopting that map.

## Initial Implementation Boundary

SPEC 06 adopts the visual tokens and a responsive public web home, using clearly identified demonstration data and local photographs. It includes local city/category filtering, a tentative date, in-memory favorites and accessible notices for unavailable actions.

It does not implement authentication, availability, bookings, payments, persistence, native mobile, backoffice, complete translations or the full estimated component inventory. Subsequent approved specifications must determine those contracts.
