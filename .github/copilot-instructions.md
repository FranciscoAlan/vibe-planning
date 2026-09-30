# Copilot Instructions

## Product Context

Vibe Planners is a platform that allows users to efficiently plan and manage events, integrating booking, payments, communication, and administration functionalities within a modular monorepo.

### Agents

See [../AGENTS.md](../AGENTS.md) for the list of available specialized agents.

### Key technical decisions

- Modular monorepo with TurboRepo.
- Modular backend with NestJS.
- Web frontend with Next.js (App Router).
- Mobile app with React Native + Expo.
- Admin panel with React/Vite or Next.js.
- PostgreSQL database with ORM (Prisma or TypeORM).
- Shared validations with Zod or Yup.
- Reusable web design system with Tailwind + Radix.

# Monorepo Structure for Vibe Planners

vibe-planners-monorepo/
├── apps/ # Executable applications
│ ├── api/ # Modular backend (NestJS)
│ │ ├── src/
│ │ │ ├── modules/ # Domain-driven architecture
│ │ │ │ ├── identity/ # Auth, profiles, roles, KYC
│ │ │ │ ├── directory/ # Listings, categories, rules, pricing
│ │ │ │ ├── booking/ # Reservations, availability, iCal synchronization
│ │ │ │ ├── finance/ # Payments (Stripe), commissions, invoicing
│ │ │ │ ├── search/ # Elasticsearch integration
│ │ │ │ ├── chat/ # WebSockets, messaging, moderation
│ │ │ │ └── admin/ # Dynamic parameters, configurations
│ │ │ ├── common/ # Filters, guards, global interceptors
│ │ │ └── main.ts
│ │
│ ├── web/ # Web platform (Next.js - App Router)
│ │ ├── src/
│ │ │ ├── app/
│ │ │ │ ├── (public)/ # Home, Search, Listing details, SEO
│ │ │ │ ├── (auth)/ # Onboarding, Login
│ │ │ │ ├── (dashboard)/# Providers and planners panel
│ │ │ │ └── (client)/ # Client profile, history, favorites
│ │ │ ├── components/ # Web-specific UI
│ │ │ └── lib/ # API clients, web utilities
│ │
│ ├── mobile/ # Mobile app (React Native + Expo)
│ │ ├── src/
│ │ │ ├── screens/ # App views
│ │ │ ├── navigation/ # Stack and Tab navigators
│ │ │ └── hooks/ # Custom hooks, API calls
│ │
│ └── backoffice/ # Super-Admin panel (React/Vite or Next.js)
│ └── src/ # Management of bans, support, KPIs, validations
│
├── packages/ # Shared libraries (The power of the monorepo)
│ ├── database/ # ORM (Prisma or TypeORM)
│ │ ├── schema.prisma # Table and relationship definitions
│ │ ├── migrations/ # DB version control
│ │ └── seeders/ # Initial data (catalogs, roles)
│ │
│ ├── shared-types/ # Shared TypeScript Interfaces, DTOs, Enums
│ │ └── src/ # Ex: IBooking, IUser, UserRoleEnum
│ │
│ ├── shared-validations/ # Validation schemas (Zod or Yup)
│ │ └── src/ # Validate the form in frontend and the payload in backend
│ │
│ ├── ui/ # Design system (Reusable web components)
│ │ └── src/ # Buttons, Modals, Inputs (Tailwind + Radix)
│ │
│ └── config/ # Base inheritable configurations
│ ├── eslint-config/
│ ├── tsconfig/
│ └── tailwind-config/
│
├── docker/ # Local infrastructure
│ ├── docker-compose.yml # Brings up PostgreSQL, Redis, Elasticsearch locally
│ └── init-scripts/
│
├── .github/ # CI/CD (GitHub Actions)
│ └── workflows/
│ ├── deploy-dev.yml
│ ├── deploy-qa.yml
│ └── deploy-prod.yml
│
├── scripts/ # Utility scripts for development and maintenance
│ └── README.md # Documentation for available scripts
│
├── specs/ # Specifications feature description or requirements of the project (API contracts, design specs, etc.)
│ └── <module-name>/ # Specifications for a specific module
│ └── README.md # Documentation for available specifications
│
├── docs/ # Project documentation
│
├── AGENTS.md # List of available specialized agents
├── package.json # Global scripts (turbo run build, dev, lint)
└── turbo.json # Cache and task dependency configuration

---

## 1) General Principles

- Follow a modular architecture for both backend and frontend.
- Use shared types and validations to ensure consistency across the monorepo.
- Keep UI components reusable and consistent with the design system.
- Maintain clear separation of concerns between different layers (API, business logic, presentation).
- Use environment-specific configurations for local development, staging, and production.
- Ensure CI/CD pipelines are properly configured for automated testing and deployment.
- Document the architecture, coding standards, and best practices for the team.

## 2) Backend Principles

- Follow a modular architecture for backend services.
- Use shared types and validations to ensure consistency with the frontend.
- Implement clear separation of concerns between controllers, services, and repositories.
- Ensure proper error handling and logging throughout the backend.
- Use environment-specific configurations for database connections, API keys, and other sensitive information.
- Write automated tests for critical business logic and API endpoints.
- Document API endpoints, data models, and backend architecture for the team.

## 3) Frontend Principles

- HTTP/API calls must be done only from `*.api.service.ts` files.
- Follow a modular architecture for frontend applications.
- Use shared types and validations to ensure consistency with the backend.
- Implement clear separation of concerns between components, state management, and services.
- Ensure proper error handling and user feedback throughout the frontend.
- Use environment-specific configurations for API endpoints and other settings.
- Write automated tests for critical UI components and user interactions.
- Document component usage, state management patterns, and frontend architecture for the team.

## 4) Mobile App Principles

- Follow a modular architecture for the mobile application.
- Use shared types and validations to ensure consistency with the backend.
- Implement clear separation of concerns between screens, navigation, and hooks.
- Ensure proper error handling and user feedback throughout the mobile app.
- Use environment-specific configurations for API endpoints and other settings.
- Write automated tests for critical screens and user interactions.
- Document screen usage, navigation patterns, and mobile architecture for the team.

## 5) Testing Principles

- Write automated tests for critical business logic, API endpoints, and UI components.
- Ensure tests are isolated, repeatable, and maintainable.
- Use appropriate testing frameworks and tools for different layers (unit, integration, end-to-end).
- Maintain a high level of test coverage across the codebase.
- Document testing strategies, patterns, and best practices for the team.

## 6) Documentation Principles

- Maintain up-to-date documentation for the architecture, coding standards, and best practices.
- Ensure documentation is easily accessible and understandable for all team members.
- Ensure documentation is easily accessible and understandable for all team members.
- Regularly review and update documentation to reflect changes in the codebase and architecture.
- Encourage team members to contribute to and improve documentation continuously.
- Use version control and change tracking for documentation to maintain a history of updates and revisions.

## 7) Security Principles

- Follow best practices for securing sensitive data, including encryption and secure storage.
- Implement proper authentication and authorization mechanisms.
- Regularly review and update security policies and practices.
- Conduct security audits and vulnerability assessments periodically.
- Educate team members on security best practices and potential threats.

## 8) Performance Principles

- Optimize critical code paths and algorithms for performance.
- Monitor and profile application performance regularly.
- Implement caching strategies where appropriate to reduce redundant computations and API calls.
- Minimize the use of heavy libraries and dependencies that can impact performance.
- Ensure responsive UI and smooth user interactions by avoiding blocking operations on the main thread.
- Document performance optimization strategies and best practices for the team.

## 9) Accessibility Principles

- Ensure that the application is usable by people with diverse abilities and disabilities.
- Follow established accessibility guidelines and standards (e.g., WCAG).
- Implement keyboard navigation and screen reader support where applicable.
- Use semantic HTML and ARIA roles to improve accessibility.
- Test the application for accessibility regularly and address any issues promptly.
- Document accessibility best practices and guidelines for the team.

## 10) Code Review Principles

- Conduct regular code reviews to ensure code quality and adherence to standards.
- Provide constructive feedback and encourage knowledge sharing among team members.
- Review code for security, performance, and accessibility considerations.
- Ensure that code changes are well-documented and tested before merging.
- Foster a culture of continuous improvement through code review discussions.

## 11) Storage Principles

- Use appropriate storage solutions for different types of data (e.g., relational databases, NoSQL, file storage).
- Ensure data integrity and consistency across storage systems.
- Implement proper backup and recovery mechanisms to prevent data loss.
- Optimize storage usage and performance based on access patterns and data volume.
- Secure stored data through encryption and access controls.
- Document storage strategies and best practices for the team.

## 12) Deployment Principles

- Automate deployment processes to reduce manual errors and improve consistency.
- Use version control and tagging for deployment artifacts.
- Implement rollback mechanisms to quickly revert to a stable state in case of issues.
- Monitor deployed applications for performance, errors, and security vulnerabilities.
- Document deployment procedures and best practices for the team.

## 13) Monitoring and Logging Principles

- Implement comprehensive logging to capture important application events and errors.
- Set up monitoring and alerting to detect and respond to issues promptly.
- Analyze logs and monitoring data to identify trends and potential problems.
- Ensure that sensitive information is not logged or exposed in monitoring systems.
- Document monitoring and logging strategies and best practices for the team.

## 14) Explicit Prohibitions

- Avoid using deprecated or unsafe APIs and libraries.
- Do not hardcode sensitive information such as passwords or API keys.
- Refrain from writing code that bypasses security, performance, or accessibility best practices.
- Avoid introducing unnecessary complexity or technical debt.
- Do not ignore code review feedback or established team guidelines.
- Avoid committing code that has not been properly tested.
- Do not bypass established security protocols or procedures.
- Refrain from making changes that negatively impact performance or maintainability.
- Do not circumvent established testing procedures or quality gates.
- Avoid making changes that compromise the security, performance, or maintainability of the application.
