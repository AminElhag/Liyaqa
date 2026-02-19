# Liyaqa - Complete Project Documentation
**Version:** 1.0.0
**Last Updated:** February 2026
**Status:** Pre-Production

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Technology Stack Details](#3-technology-stack-details)
4. [Module Breakdown](#4-module-breakdown)
5. [Key Features List](#5-key-features-list)
6. [Data Model Summary](#6-data-model-summary)
7. [API Overview](#7-api-overview)
8. [Security Summary](#8-security-summary)
9. [Compliance Features](#9-compliance-features)
10. [Setup & Deployment Guide](#10-setup--deployment-guide)
11. [Known Issues/TODOs](#11-known-issuestodos)
12. [Recommended Improvements](#12-recommended-improvements)
13. [Quick Reference Guide](#13-quick-reference-guide)

---

## 1. Executive Summary

### 1.1 What is Liyaqa?

Liyaqa is a **multi-tenant SaaS platform** for managing gyms, fitness clubs, and sports facilities in the Saudi Arabian market. It provides comprehensive tools for membership management, class scheduling, attendance tracking, billing, and compliance with Saudi regulations.

**Core Value Proposition:**
- **Multi-tenant Architecture:** Single codebase serves multiple clubs with complete data isolation
- **Saudi Market Focus:** Built-in ZATCA e-invoicing, Hijri calendar, prayer time integration, bilingual (Arabic/English)
- **Complete Club Management:** Members, trainers, classes, bookings, payments, attendance, reports
- **Modern Tech Stack:** Spring Boot 3.4.1, Kotlin 2.2.0, React/Next.js, PostgreSQL 16

### 1.2 Project Status

| Aspect | Status | Notes |
|--------|--------|-------|
| **Backend Development** | 85% Complete | Core features implemented, needs optimization |
| **Frontend Development** | 70% Complete | Club and Platform apps in progress |
| **Database Schema** | 90% Complete | 94 migrations, stable schema |
| **API Documentation** | 40% Complete | Swagger available, needs detailed annotations |
| **Test Coverage** | 11% Overall | Service layer 65%, needs improvement |
| **Production Readiness** | 60% | Critical issues identified, 8-10 weeks to production |

### 1.3 Team & Codebase

- **Backend:** 891 Kotlin files, 152,000+ lines of code
- **Frontend:** Monorepo with 2 Next.js apps (Club, Platform)
- **Database:** PostgreSQL 16 with 94 Flyway migrations
- **Deployment:** Docker containerized, AWS-ready

### 1.4 Key Metrics

- **Entities:** 45+ domain entities (Member, Club, Subscription, Booking, etc.)
- **API Endpoints:** 120+ REST endpoints
- **DTOs:** 150+ data transfer objects
- **Business Logic:** 68 service classes
- **Value Objects:** 15+ (Money, Email, PhoneNumber, LocalizedText, etc.)
- **Enums:** 100+ enumeration types

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Club App (Next.js)          │  Platform App (Next.js)          │
│  - Member portal             │  - Internal admin tools          │
│  - Trainer portal            │  - Multi-tenant management       │
│  - Admin dashboard           │  - System monitoring             │
└────────────┬─────────────────┴──────────────────┬───────────────┘
             │                                     │
             │ HTTPS/REST API                     │
             │                                     │
┌────────────▼─────────────────────────────────────▼───────────────┐
│                     API Gateway / Load Balancer                   │
└────────────┬──────────────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────────────┐
│                      Spring Boot Backend                          │
├───────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    API Layer (Controllers)                  │ │
│  │  - REST Controllers (@RestController)                       │ │
│  │  - Request/Response DTOs                                    │ │
│  │  - Input Validation (@Valid)                                │ │
│  └────────────────────┬────────────────────────────────────────┘ │
│                       │                                           │
│  ┌────────────────────▼────────────────────────────────────────┐ │
│  │              Application Layer (Services)                   │ │
│  │  - Business Logic                                           │ │
│  │  - Transaction Management (@Transactional)                  │ │
│  │  - Authorization (@PreAuthorize)                            │ │
│  │  - Event Publishing                                         │ │
│  └────────────────────┬────────────────────────────────────────┘ │
│                       │                                           │
│  ┌────────────────────▼────────────────────────────────────────┐ │
│  │                Domain Layer (Entities)                      │ │
│  │  - Domain Models (@Entity)                                  │ │
│  │  - Value Objects (@Embeddable)                              │ │
│  │  - Domain Events                                            │ │
│  │  - Business Rules                                           │ │
│  └────────────────────┬────────────────────────────────────────┘ │
│                       │                                           │
│  ┌────────────────────▼────────────────────────────────────────┐ │
│  │           Infrastructure Layer (Repositories)               │ │
│  │  - Data Access (JpaRepository)                              │ │
│  │  - Query Methods                                            │ │
│  │  - Custom Queries (@Query)                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────┬───────────────────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────────────────┐
│                     Data Layer                                    │
├───────────────────────────────────────────────────────────────────┤
│  PostgreSQL 16        │  Redis (Cache)    │  S3 (File Storage)   │
│  - Tenant Data        │  - Session Store  │  - Document Storage  │
│  - Multi-tenant       │  - Rate Limiting  │  - Profile Images    │
│  - Discriminator      │  - Distributed    │  - Invoices (PDF)    │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                    External Services                              │
├───────────────────────────────────────────────────────────────────┤
│  PayTabs           │  Twilio          │  Firebase Cloud Messaging│
│  (Payments)        │  (SMS)           │  (Push Notifications)    │
│                    │                  │                          │
│  SendGrid          │  AWS SES         │  Cloudflare              │
│  (Email)           │  (Email Backup)  │  (CDN)                   │
└───────────────────────────────────────────────────────────────────┘
```

### 2.2 Multi-Tenant Architecture

**Strategy:** Discriminator Column (Shared Schema)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tenant Isolation                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HTTP Request → Extract X-Tenant-ID Header                      │
│                 ↓                                                │
│  TenantFilter → Validate tenant exists                          │
│                 ↓                                                │
│  TenantContext (ThreadLocal) → Store tenant_id                  │
│                 ↓                                                │
│  Hibernate Filter → WHERE tenant_id = :currentTenantId          │
│                 ↓                                                │
│  Database Query → Automatic tenant filtering                    │
│                                                                  │
│  All tables (except Club) have tenant_id column                 │
│  Club table: id = tenant_id (self-referencing)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Components:**
- **TenantContext.kt**: ThreadLocal storage for current tenant
- **TenantFilter.kt**: Servlet filter to extract and validate tenant
- **TenantAware.kt**: Interface for tenant-aware entities
- **@FilterDef**: Hibernate filter on all repositories

**See:** MULTI_TENANT_ARCHITECTURE.md for complete details

### 2.3 Request Flow

```
1. Client Request
   ↓
2. CORS Preflight (if cross-origin)
   ↓
3. TenantFilter (extract X-Tenant-ID header)
   ↓
4. CookieAuthenticationFilter (read JWT from cookie)
   ↓
5. CsrfValidationFilter (validate X-CSRF-Token if cookie auth)
   ↓
6. JwtAuthenticationFilter (read JWT from Authorization header)
   ↓
7. Spring Security Authorization Check
   ↓
8. Controller (validate input, map to DTO)
   ↓
9. Service (business logic, transactions)
   ↓
10. Repository (Hibernate filter applied automatically)
    ↓
11. Database (PostgreSQL)
    ↓
12. Response (map to DTO, serialize to JSON)
    ↓
13. GlobalExceptionHandler (if error occurs)
    ↓
14. Client Response (bilingual error if needed)
```

### 2.4 Layer Responsibilities

#### API Layer (Controllers)
- **Input validation** using `@Valid` and Bean Validation
- **Request/Response mapping** between DTOs and domain models
- **HTTP semantics** (status codes, headers, content negotiation)
- **No business logic** - delegate to services

#### Application Layer (Services)
- **Business logic** and workflows
- **Transaction boundaries** using `@Transactional`
- **Authorization** using `@PreAuthorize`
- **Event publishing** for domain events
- **Orchestration** of multiple repositories

#### Domain Layer (Entities)
- **Domain models** with business rules
- **Value objects** for type safety
- **Domain events** for loose coupling
- **Invariants** enforced in constructors

#### Infrastructure Layer (Repositories)
- **Data access** using Spring Data JPA
- **Custom queries** for complex operations
- **No business logic** - pure data access

---

## 3. Technology Stack Details

### 3.1 Backend Stack

| Technology | Version | Purpose | Configuration |
|------------|---------|---------|---------------|
| **Kotlin** | 2.2.0 | Primary language | JVM target 21 |
| **Spring Boot** | 3.4.1 | Application framework | Web, Security, Data JPA |
| **Spring Security** | 6.x | Authentication/Authorization | JWT + Cookie auth |
| **PostgreSQL** | 16 | Primary database | Multi-tenant via discriminator |
| **Hibernate** | 6.x | ORM | Filters for tenant isolation |
| **Flyway** | 10.x | Database migrations | 94 migrations |
| **Redis** | 7.x | Caching, sessions | Distributed lock support |
| **Gradle** | 8.5 | Build tool | Kotlin DSL |

### 3.2 Frontend Stack

| Technology | Version | Purpose | Apps |
|------------|---------|---------|------|
| **Next.js** | 14.x | React framework | Club App, Platform App |
| **React** | 18.x | UI library | TypeScript |
| **TypeScript** | 5.x | Type safety | Strict mode |
| **Tailwind CSS** | 3.x | Styling | Custom theme |
| **Radix UI** | 1.x | Component primitives | Accessible |
| **React Query** | 5.x | Server state management | API caching |
| **Zustand** | 4.x | Client state management | Lightweight |

### 3.3 Infrastructure & DevOps

| Technology | Version | Purpose |
|------------|---------|---------|
| **Docker** | 24.x | Containerization |
| **Docker Compose** | 2.x | Local development |
| **AWS ECS** | - | Container orchestration (planned) |
| **AWS RDS** | PostgreSQL 16 | Managed database |
| **AWS S3** | - | File storage |
| **CloudWatch** | - | Logging & monitoring |
| **Prometheus** | 2.x | Metrics collection |
| **Zipkin** | 2.x | Distributed tracing |

### 3.4 Third-Party Integrations

| Service | Purpose | Environment |
|---------|---------|-------------|
| **PayTabs** | Payment processing | Saudi Arabia |
| **Twilio** | SMS notifications | International |
| **SendGrid** | Transactional email | Primary |
| **AWS SES** | Email backup | Fallback |
| **Firebase Cloud Messaging** | Push notifications | Mobile apps |
| **Cloudflare** | CDN, DDoS protection | Global |

### 3.5 Development Tools

| Tool | Purpose |
|------|---------|
| **IntelliJ IDEA** | Primary IDE |
| **Postman** | API testing |
| **TablePlus** | Database management |
| **Swagger UI** | API documentation |
| **SonarQube** | Code quality analysis (recommended) |
| **JaCoCo** | Test coverage (recommended) |
| **Detekt** | Kotlin linter (recommended) |

---

## 4. Module Breakdown

### 4.1 Backend Module Structure

```
backend/src/main/kotlin/com/liyaqa/
├── auth/                          # Authentication & Authorization
│   ├── api/                       # Auth controllers
│   │   ├── AuthController.kt      # Login, register, refresh
│   │   ├── MeController.kt        # Current user profile
│   │   ├── OAuthController.kt     # OAuth SSO flow
│   │   └── PlatformAuthController.kt  # Internal team auth
│   ├── application/               # Auth services
│   │   ├── AuthService.kt         # Core auth logic
│   │   ├── JwtService.kt          # JWT generation/validation
│   │   ├── OAuthService.kt        # OAuth integration
│   │   └── RefreshTokenService.kt # Refresh token management
│   ├── domain/                    # Auth entities
│   │   ├── User.kt                # User entity
│   │   ├── RefreshToken.kt        # Refresh token entity
│   │   └── OAuthProvider.kt       # OAuth provider config
│   └── infrastructure/            # Auth repositories, security
│       ├── security/
│       │   ├── JwtAuthenticationFilter.kt
│       │   ├── CookieAuthenticationFilter.kt
│       │   └── CsrfValidationFilter.kt
│       └── UserRepository.kt
│
├── membership/                    # Membership Management
│   ├── api/                       # Member controllers
│   │   ├── MemberController.kt    # Member CRUD
│   │   └── MembershipPlanController.kt  # Plan management
│   ├── application/               # Member services
│   │   ├── MemberService.kt       # Core member logic
│   │   ├── MembershipPlanService.kt  # Plan management
│   │   └── FreezeService.kt       # Membership freeze logic
│   ├── domain/                    # Member entities
│   │   ├── Member.kt              # Member entity
│   │   ├── MembershipPlan.kt      # Plan entity
│   │   ├── Freeze.kt              # Freeze entity
│   │   └── MembershipType.kt      # Enum: INDIVIDUAL, FAMILY, etc.
│   └── infrastructure/            # Member repositories
│       ├── MemberRepository.kt
│       └── MembershipPlanRepository.kt
│
├── subscription/                  # Subscription Management
│   ├── api/                       # Subscription controllers
│   │   └── SubscriptionController.kt
│   ├── application/               # Subscription services
│   │   ├── SubscriptionService.kt # Core subscription logic
│   │   └── RenewalService.kt      # Auto-renewal logic
│   ├── domain/                    # Subscription entities
│   │   ├── Subscription.kt        # Subscription entity
│   │   └── SubscriptionStatus.kt  # Enum: ACTIVE, EXPIRED, etc.
│   └── infrastructure/
│       └── SubscriptionRepository.kt
│
├── booking/                       # Class Booking System
│   ├── api/                       # Booking controllers
│   │   ├── BookingController.kt   # Member bookings
│   │   └── ClassScheduleController.kt  # Class schedules
│   ├── application/               # Booking services
│   │   ├── BookingService.kt      # Booking logic (1,244 lines - needs refactoring)
│   │   └── ScheduleService.kt     # Schedule management
│   ├── domain/                    # Booking entities
│   │   ├── Booking.kt             # Booking entity
│   │   ├── ClassSchedule.kt       # Schedule entity
│   │   ├── FitnessClass.kt        # Class definition
│   │   └── BookingStatus.kt       # Enum: CONFIRMED, CANCELLED, etc.
│   └── infrastructure/
│       ├── BookingRepository.kt
│       └── ClassScheduleRepository.kt
│
├── attendance/                    # Attendance Tracking
│   ├── api/                       # Attendance controllers
│   │   └── AttendanceController.kt
│   ├── application/               # Attendance services
│   │   ├── AttendanceService.kt   # Check-in/check-out logic
│   │   └── QrCodeService.kt       # QR code generation
│   ├── domain/                    # Attendance entities
│   │   ├── AttendanceRecord.kt    # Attendance entity
│   │   └── CheckInMethod.kt       # Enum: QR_CODE, CARD, MANUAL
│   └── infrastructure/
│       └── AttendanceRepository.kt
│
├── payment/                       # Payment Processing
│   ├── api/                       # Payment controllers
│   │   └── PaymentController.kt   # Payment endpoints, webhooks
│   ├── application/               # Payment services
│   │   ├── PaymentService.kt      # Payment logic
│   │   ├── InvoiceService.kt      # Invoice generation (688 lines)
│   │   └── RefundService.kt       # Refund processing
│   ├── domain/                    # Payment entities
│   │   ├── Payment.kt             # Payment entity
│   │   ├── Invoice.kt             # Invoice entity
│   │   ├── PaymentMethod.kt       # Enum: CARD, CASH, etc.
│   │   └── PaymentStatus.kt       # Enum: PENDING, COMPLETED, etc.
│   └── infrastructure/
│       ├── PaymentRepository.kt
│       └── InvoiceRepository.kt
│
├── organization/                  # Multi-Tenant Management
│   ├── api/                       # Organization controllers
│   │   ├── OrganizationController.kt  # Organization CRUD
│   │   ├── ClubController.kt      # Club management
│   │   └── LocationController.kt  # Location management
│   ├── application/               # Organization services
│   │   ├── OrganizationService.kt # Organization logic
│   │   ├── ClubService.kt         # Club logic
│   │   └── ClientOnboardingService.kt  # Onboarding (505 lines)
│   ├── domain/                    # Organization entities
│   │   ├── Organization.kt        # Organization entity
│   │   ├── Club.kt                # Club entity (tenant)
│   │   └── Location.kt            # Location entity
│   └── infrastructure/
│       ├── OrganizationRepository.kt
│       └── ClubRepository.kt
│
├── staff/                         # Staff Management
│   ├── api/                       # Staff controllers
│   │   ├── TrainerController.kt   # Trainer management
│   │   └── StaffController.kt     # Staff management
│   ├── application/               # Staff services
│   │   ├── TrainerService.kt      # Trainer logic
│   │   └── StaffService.kt        # Staff logic
│   ├── domain/                    # Staff entities
│   │   ├── Trainer.kt             # Trainer entity
│   │   ├── Staff.kt               # Staff entity
│   │   └── StaffRole.kt           # Enum: ADMIN, RECEPTIONIST, etc.
│   └── infrastructure/
│       ├── TrainerRepository.kt
│       └── StaffRepository.kt
│
├── notification/                  # Notification System
│   ├── application/               # Notification services
│   │   ├── EmailService.kt        # Email sending
│   │   ├── SmsService.kt          # SMS sending
│   │   └── PushNotificationService.kt  # Push notifications
│   ├── domain/                    # Notification entities
│   │   ├── NotificationTemplate.kt # Email/SMS templates
│   │   └── NotificationChannel.kt  # Enum: EMAIL, SMS, PUSH
│   └── infrastructure/
│       └── NotificationRepository.kt
│
├── reporting/                     # Reports & Analytics
│   ├── api/                       # Report controllers
│   │   └── ReportController.kt    # Report generation
│   ├── application/               # Report services
│   │   ├── MemberReportService.kt # Member reports
│   │   ├── FinancialReportService.kt  # Financial reports
│   │   └── AttendanceReportService.kt # Attendance reports
│   └── domain/
│       └── ReportType.kt          # Enum: DAILY, WEEKLY, MONTHLY
│
├── webhook/                       # Webhook System
│   ├── application/               # Webhook services
│   │   ├── WebhookService.kt      # Webhook delivery
│   │   └── WebhookEventPublisher.kt  # Event publishing
│   ├── domain/                    # Webhook entities
│   │   ├── Webhook.kt             # Webhook configuration
│   │   ├── WebhookDelivery.kt     # Delivery log
│   │   └── WebhookEvent.kt        # Event types
│   └── infrastructure/
│       ├── WebhookRepository.kt
│       └── DomainEventWebhookListener.kt
│
├── security/                      # Security & Permissions
│   ├── api/                       # Security controllers
│   │   └── PermissionController.kt
│   ├── application/               # Security services
│   │   ├── PermissionService.kt   # Permission logic (N+1 query issue)
│   │   └── RoleService.kt         # Role management
│   ├── domain/                    # Security entities
│   │   ├── Role.kt                # Role entity
│   │   ├── Permission.kt          # Permission entity
│   │   └── PlatformRole.kt        # Enum: SUPER_ADMIN, SUPPORT, etc.
│   └── infrastructure/
│       ├── RoleRepository.kt
│       └── PermissionRepository.kt
│
├── config/                        # Configuration Classes
│   ├── SecurityConfig.kt          # Spring Security config
│   ├── RedisConfig.kt             # Redis configuration
│   ├── CorsConfig.kt              # CORS configuration
│   ├── WebConfig.kt               # Web MVC configuration
│   ├── AsyncConfig.kt             # Async task configuration
│   ├── SchedulingConfig.kt        # Scheduled task configuration
│   ├── GlobalExceptionHandler.kt  # Global error handling
│   ├── TenantFilter.kt            # Tenant extraction filter
│   └── OpenApiConfig.kt           # Swagger/OpenAPI config
│
├── shared/                        # Shared Components
│   ├── domain/                    # Shared domain models
│   │   ├── ValueObjects.kt        # Money, Email, PhoneNumber, etc.
│   │   ├── BaseEntity.kt          # Base entity with ID, timestamps
│   │   ├── TenantAware.kt         # Interface for tenant entities
│   │   └── LocalizedText.kt       # Bilingual text support
│   ├── utils/                     # Utility classes
│   │   ├── CurrentUserService.kt  # Get current user
│   │   ├── DateUtils.kt           # Date formatting, Hijri conversion
│   │   ├── ValidationUtils.kt     # Custom validators
│   │   └── QrCodeService.kt       # QR code generation
│   └── exceptions/                # Custom exceptions
│       ├── ResourceNotFoundException.kt
│       ├── BusinessRuleViolationException.kt
│       ├── UnauthorizedException.kt
│       └── InvalidInputException.kt
│
└── LiyaqaApplication.kt           # Main application entry point
```

**See:** INFRASTRUCTURE_COMPONENTS.md for complete utility class documentation

### 4.2 Frontend Module Structure

```
frontend/
├── apps/
│   ├── club/                      # Club Management App
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── [locale]/      # Internationalized routes
│   │   │   │   │   ├── (admin)/   # Admin portal
│   │   │   │   │   ├── (member)/  # Member portal
│   │   │   │   │   ├── (trainer)/ # Trainer portal
│   │   │   │   │   └── (auth)/    # Login, register
│   │   │   │   └── api/           # API routes (Next.js)
│   │   │   ├── components/        # Club-specific components
│   │   │   └── lib/               # Club-specific utilities
│   │   └── package.json
│   │
│   └── platform/                  # Internal Platform App
│       ├── src/
│       │   ├── app/
│       │   │   ├── [locale]/
│       │   │   │   ├── (platform)/ # Platform admin
│       │   │   │   └── (auth)/    # Internal auth
│       │   │   └── api/
│       │   ├── components/
│       │   └── lib/
│       └── package.json
│
├── shared/                        # Shared UI Components
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # Reusable UI components
│   │   │   ├── forms/             # Form components
│   │   │   ├── layouts/           # Layout components
│   │   │   └── platform/          # Platform components
│   │   ├── lib/                   # Shared utilities
│   │   │   ├── api-client.ts      # API client
│   │   │   ├── auth.ts            # Auth utilities
│   │   │   └── utils.ts           # General utilities
│   │   └── types/                 # TypeScript types
│   └── package.json
│
└── package.json                   # Monorepo root
```

### 4.3 Database Module Structure

```
backend/src/main/resources/db/migration/
├── V1__initial_schema.sql         # Initial tables
├── V2__add_users.sql              # User authentication
├── V3__add_roles_permissions.sql  # RBAC
├── V4__add_organizations.sql      # Multi-tenant setup
├── V5__add_clubs.sql              # Club entities
├── V6__add_members.sql            # Member management
├── V7__add_membership_plans.sql   # Plans
├── V8__add_subscriptions.sql      # Subscriptions
├── V9__add_bookings.sql           # Class bookings
├── V10__add_attendance.sql        # Attendance tracking
├── V11__add_payments.sql          # Payment processing
├── V12__add_invoices.sql          # Invoicing
├── V13__add_webhooks.sql          # Webhook system
├── ...
├── V93__add_platform_roles.sql    # Platform roles
└── V94__create_shedlock_table.sql # Distributed locking
```

**Total Migrations:** 94 (V1-V94)

---

## 5. Key Features List

### 5.1 Core Features

#### Member Management
- ✅ Member registration with KYC (name, email, phone, national ID)
- ✅ Member profiles with photos
- ✅ Family membership support (primary + dependents)
- ✅ Member status tracking (ACTIVE, SUSPENDED, EXPIRED)
- ✅ Member search and filtering
- ✅ Bulk member import/export
- ✅ Member QR code generation for check-in

#### Membership Plans
- ✅ Flexible plan types (MONTHLY, QUARTERLY, ANNUAL)
- ✅ Plan pricing with VAT calculation (15%)
- ✅ Plan features and limitations
- ✅ Access control by plan (gym only, classes, personal training)
- ✅ Multiple active plans per club
- ✅ Plan freeze rules

#### Subscription Management
- ✅ Subscription creation and activation
- ✅ Subscription renewal (manual + auto-renewal)
- ✅ Subscription cancellation
- ✅ Subscription freeze (pause membership)
- ✅ Expiration notifications
- ✅ Grace period support

#### Class Scheduling
- ✅ Fitness class creation (name, description, duration, capacity)
- ✅ Recurring schedule support (daily, weekly patterns)
- ✅ Trainer assignment
- ✅ Class capacity management
- ✅ Class cancellation
- ✅ Schedule conflicts detection

#### Booking System
- ✅ Member class bookings
- ✅ Booking confirmation
- ✅ Booking cancellation (with time limits)
- ✅ Waitlist support for full classes
- ✅ Booking history
- ⚠️ **Issue:** BookingService needs refactoring (1,244 lines)

#### Attendance Tracking
- ✅ QR code check-in
- ✅ RFID card check-in
- ✅ Manual check-in by staff
- ✅ Check-out tracking
- ✅ Attendance history
- ✅ Attendance reports

#### Payment Processing
- ✅ PayTabs integration (Saudi market)
- ✅ Multiple payment methods (card, cash, bank transfer)
- ✅ Payment status tracking
- ✅ Payment refunds
- ✅ Payment history
- ✅ Webhook support for payment events

#### Invoicing
- ✅ Auto-generated invoices for subscriptions
- ✅ Manual invoice creation
- ✅ Invoice templates (bilingual)
- ✅ VAT calculation (15%)
- ✅ ZATCA-compliant e-invoice format
- ✅ Invoice PDF generation
- ✅ Invoice email delivery

#### Staff Management
- ✅ Trainer profiles
- ✅ Staff profiles (admin, receptionist, etc.)
- ✅ Role-based access control
- ✅ Staff scheduling
- ✅ Trainer certification tracking

#### Reporting & Analytics
- ✅ Member reports (new, active, churned)
- ✅ Financial reports (revenue, payments, outstanding)
- ✅ Attendance reports (daily, weekly, monthly)
- ✅ Class performance reports
- ✅ Export to Excel/CSV

### 5.2 Authentication & Authorization

#### Authentication
- ✅ Email/password login
- ✅ JWT tokens (access + refresh)
- ✅ Cookie-based authentication (web)
- ✅ CSRF protection for cookie auth
- ✅ OAuth 2.0 SSO support (Google, Apple)
- ✅ Multi-factor authentication (MFA)
- ✅ Password reset via email
- ✅ Account verification

#### Authorization
- ✅ Role-based access control (RBAC)
- ✅ Permission-based authorization
- ✅ Method-level security (@PreAuthorize)
- ✅ Tenant isolation enforcement
- ⚠️ **Issue:** Missing authorization in some endpoints (see CODE_QUALITY_REPORT.md)

#### Roles
- **Super Admin** - Full platform access
- **Platform Support** - Read-only platform access
- **Platform Sales** - Organization/club management
- **Club Admin** - Full club access
- **Club Staff** - Limited club access
- **Trainer** - Class and member management
- **Member** - Self-service portal

### 5.3 Multi-Tenant Features

#### Tenant Management
- ✅ Organization creation
- ✅ Club creation (tenant)
- ✅ Tenant configuration (branding, settings)
- ✅ Automatic tenant filtering (all queries)
- ✅ Tenant context propagation (async tasks, events)
- ✅ Cross-tenant data isolation guarantee

#### Tenant Configuration
- ✅ Custom branding (logo, colors, name)
- ✅ Business hours configuration
- ✅ Location management
- ✅ Payment gateway settings
- ✅ Notification preferences
- ✅ Feature flags per tenant

### 5.4 Notification System

#### Email Notifications
- ✅ Welcome email (new member)
- ✅ Subscription confirmation
- ✅ Subscription expiration reminder
- ✅ Booking confirmation
- ✅ Class cancellation notice
- ✅ Payment receipt
- ✅ Password reset email
- ✅ Invoice delivery

#### SMS Notifications
- ✅ Booking confirmation
- ✅ Class reminder (1 hour before)
- ✅ Subscription expiration
- ✅ Payment reminder
- ✅ MFA verification code

#### Push Notifications
- ✅ Firebase Cloud Messaging integration
- ✅ Booking confirmation
- ✅ Class reminder
- ✅ Promotional messages

### 5.5 Webhook System

#### Event Types
- ✅ `member.created`
- ✅ `member.updated`
- ✅ `subscription.created`
- ✅ `subscription.renewed`
- ✅ `subscription.cancelled`
- ✅ `payment.completed`
- ✅ `payment.failed`
- ✅ `booking.created`
- ✅ `booking.cancelled`

#### Features
- ✅ HMAC-SHA256 signature verification
- ✅ Automatic retry with exponential backoff
- ✅ Webhook delivery logs
- ✅ Async event publishing
- ✅ Custom webhook endpoints per tenant

### 5.6 Saudi Compliance Features

#### ZATCA E-Invoicing
- ✅ ZATCA-compliant invoice format
- ✅ QR code on invoices (base64 encoded data)
- ✅ Seller information (VAT number, CR number)
- ✅ Invoice hash generation
- ✅ Invoice counter (sequential)
- ⚠️ **Status:** XML format ready, API integration pending

#### VAT Support
- ✅ 15% VAT calculation
- ✅ VAT breakdown on invoices
- ✅ TaxableFee value object
- ✅ VAT reports

#### Hijri Calendar
- ✅ Hijri date display
- ✅ Hijri date conversion utility
- ✅ Prayer time integration (planned)

#### Localization
- ✅ Bilingual support (Arabic/English)
- ✅ LocalizedText value object
- ✅ RTL layout support (frontend)
- ✅ Arabic error messages
- ✅ Arabic email templates

**See:** SAUDI_COMPLIANCE.md for complete compliance documentation

---

## 6. Data Model Summary

### 6.1 Core Entities

#### User
```kotlin
@Entity
class User(
    @Id val id: UUID,
    val email: Email,
    val phoneNumber: PhoneNumber,
    val passwordHash: String,
    @ManyToMany val roles: Set<Role>,
    val isActive: Boolean,
    val emailVerified: Boolean,
    val mfaEnabled: Boolean
) : BaseEntity(), TenantAware
```

#### Club (Tenant)
```kotlin
@Entity
class Club(
    @Id val id: UUID, // This is the tenant_id
    val nameEn: String,
    val nameAr: String?,
    @ManyToOne val organization: Organization,
    val isActive: Boolean,
    val settings: ClubSettings
) : BaseEntity()
```

#### Member
```kotlin
@Entity
class Member(
    @Id val id: UUID,
    @ManyToOne val user: User,
    @ManyToOne val club: Club,
    val membershipNumber: String,
    val status: MemberStatus,
    val membershipType: MembershipType,
    @OneToMany val subscriptions: List<Subscription>
) : BaseEntity(), TenantAware
```

#### MembershipPlan
```kotlin
@Entity
class MembershipPlan(
    @Id val id: UUID,
    val name: LocalizedText,
    val description: LocalizedText,
    val price: Money,
    val duration: Duration,
    val durationType: DurationType,
    val features: List<PlanFeature>,
    val isActive: Boolean
) : BaseEntity(), TenantAware
```

#### Subscription
```kotlin
@Entity
class Subscription(
    @Id val id: UUID,
    @ManyToOne val member: Member,
    @ManyToOne val membershipPlan: MembershipPlan,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val status: SubscriptionStatus,
    val autoRenew: Boolean
) : BaseEntity(), TenantAware
```

#### Booking
```kotlin
@Entity
class Booking(
    @Id val id: UUID,
    @ManyToOne val member: Member,
    @ManyToOne val classSchedule: ClassSchedule,
    val status: BookingStatus,
    val bookingTime: Instant,
    val notes: String?
) : BaseEntity(), TenantAware
```

#### Payment
```kotlin
@Entity
class Payment(
    @Id val id: UUID,
    val amount: Money,
    @ManyToOne val member: Member,
    val paymentMethod: PaymentMethod,
    val status: PaymentStatus,
    val externalTransactionId: String?,
    @ManyToOne val invoice: Invoice?
) : BaseEntity(), TenantAware
```

#### Invoice
```kotlin
@Entity
class Invoice(
    @Id val id: UUID,
    val invoiceNumber: String,
    @ManyToOne val member: Member,
    val items: List<InvoiceItem>,
    val subtotal: Money,
    val vatAmount: Money,
    val total: Money,
    val status: InvoiceStatus,
    val dueDate: LocalDate,
    val pdfUrl: String?
) : BaseEntity(), TenantAware
```

### 6.2 Value Objects

```kotlin
// Money with currency support
@Embeddable
data class Money(
    val amount: BigDecimal,
    val currency: Currency = Currency.getInstance("SAR")
)

// Email with validation
@Embeddable
data class Email(
    val value: String
) {
    init {
        require(isValid(value)) { "Invalid email" }
    }
}

// Phone number in E.164 format
@Embeddable
data class PhoneNumber(
    val value: String
) {
    init {
        require(value.matches(Regex("^\\+[1-9]\\d{1,14}$"))) {
            "Invalid phone number"
        }
    }
}

// Bilingual text
@Embeddable
data class LocalizedText(
    val en: String,
    val ar: String?
) {
    fun get(locale: String = "en"): String {
        return when (locale) {
            "ar" -> ar ?: en
            else -> en
        }
    }
}

// Fee with automatic VAT calculation
@Embeddable
data class TaxableFee(
    val baseAmount: Money,
    val vatRate: BigDecimal = BigDecimal("0.15")
) {
    val vatAmount: Money get() = Money(
        amount = baseAmount.amount * vatRate,
        currency = baseAmount.currency
    )
    val totalAmount: Money get() = Money(
        amount = baseAmount.amount + vatAmount.amount,
        currency = baseAmount.currency
    )
}
```

**See:** DTO_CATALOG.md for complete DTO documentation

### 6.3 Key Enumerations

```kotlin
enum class MemberStatus {
    ACTIVE, SUSPENDED, EXPIRED, CANCELLED
}

enum class SubscriptionStatus {
    PENDING, ACTIVE, EXPIRED, CANCELLED, FROZEN
}

enum class BookingStatus {
    CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
}

enum class PaymentStatus {
    PENDING, COMPLETED, FAILED, REFUNDED
}

enum class PaymentMethod {
    CARD, CASH, BANK_TRANSFER, WALLET
}

enum class InvoiceStatus {
    DRAFT, SENT, PAID, OVERDUE, CANCELLED
}

enum class MembershipType {
    INDIVIDUAL, FAMILY, STUDENT, CORPORATE
}

enum class PlatformRole {
    SUPER_ADMIN, PLATFORM_SUPPORT, PLATFORM_SALES
}

enum class ClubRole {
    CLUB_ADMIN, CLUB_STAFF, TRAINER, MEMBER
}
```

### 6.4 Database Schema Highlights

**Total Tables:** 45+

**Key Relationships:**
- `Organization` → `Club` (1:N)
- `Club` → `Member` (1:N)
- `Member` → `Subscription` (1:N)
- `Member` → `Booking` (1:N)
- `MembershipPlan` → `Subscription` (1:N)
- `ClassSchedule` → `Booking` (1:N)
- `Member` → `Payment` (1:N)
- `Member` → `Invoice` (1:N)

**Tenant Isolation:**
- All tables (except `clubs`, `organizations`) have `tenant_id` column
- Foreign key: `tenant_id` REFERENCES `clubs(id)`
- Hibernate filter applied automatically

**Indices:**
- Primary keys (UUID)
- Foreign keys
- `tenant_id` on all tenant-aware tables
- Composite indices for common queries
- ⚠️ **Missing:** Several performance-critical indices (see CODE_QUALITY_REPORT.md)

---

## 7. API Overview

### 7.1 API Design Principles

- **RESTful:** Standard HTTP methods (GET, POST, PUT, DELETE, PATCH)
- **JSON:** Request/response format
- **Versioning:** URL-based (`/api/v1/...`) - planned
- **Pagination:** Page-based with metadata
- **Filtering:** Query parameters for filtering
- **Sorting:** Query parameters for sorting
- **Error Handling:** Standardized bilingual error responses

### 7.2 API Endpoints

#### Authentication (`/api/auth`)

```
POST   /api/auth/login                  # Login with email/password
POST   /api/auth/register               # Register new user
POST   /api/auth/refresh                # Refresh access token
POST   /api/auth/logout                 # Logout (invalidate refresh token)
POST   /api/auth/forgot-password        # Request password reset
POST   /api/auth/reset-password         # Reset password with token
POST   /api/auth/verify-email           # Verify email address
GET    /api/auth/csrf                   # Get CSRF token
POST   /api/auth/mfa/verify-login       # Verify MFA code during login
```

#### OAuth (`/api/auth/oauth`)

```
GET    /api/auth/oauth/providers        # List configured OAuth providers
GET    /api/auth/oauth/authorize/:provider  # Initiate OAuth flow
GET    /api/auth/oauth/callback/:provider   # OAuth callback endpoint
```

#### Current User (`/api/me`)

```
GET    /api/me/profile                  # Get current user profile
PUT    /api/me/profile                  # Update current user profile
GET    /api/me/subscriptions            # Get user's subscriptions
GET    /api/me/bookings                 # Get user's bookings
GET    /api/me/payments                 # Get user's payment history
GET    /api/me/attendance               # Get user's attendance history
```

⚠️ **Security Issue:** Missing tenant validation (see CODE_QUALITY_REPORT.md section 2.1)

#### Members (`/api/members`)

```
POST   /api/members                     # Create new member
GET    /api/members                     # List members (paginated)
GET    /api/members/:id                 # Get member details
PUT    /api/members/:id                 # Update member
DELETE /api/members/:id                 # Delete member
GET    /api/members/:id/subscriptions   # Get member's subscriptions
GET    /api/members/:id/qr-code         # Get member's QR code
POST   /api/members/import              # Bulk import members
```

#### Membership Plans (`/api/membership-plans`)

```
POST   /api/membership-plans            # Create plan
GET    /api/membership-plans            # List plans
GET    /api/membership-plans/:id        # Get plan details
PUT    /api/membership-plans/:id        # Update plan
DELETE /api/membership-plans/:id        # Delete plan
```

#### Subscriptions (`/api/subscriptions`)

```
POST   /api/subscriptions               # Create subscription
GET    /api/subscriptions               # List subscriptions (paginated)
GET    /api/subscriptions/:id           # Get subscription details
PUT    /api/subscriptions/:id           # Update subscription
POST   /api/subscriptions/:id/renew     # Renew subscription
POST   /api/subscriptions/:id/cancel    # Cancel subscription
POST   /api/subscriptions/:id/freeze    # Freeze subscription
POST   /api/subscriptions/:id/unfreeze  # Unfreeze subscription
```

#### Bookings (`/api/bookings`)

```
POST   /api/bookings                    # Create booking
GET    /api/bookings                    # List bookings (paginated)
GET    /api/bookings/:id                # Get booking details
DELETE /api/bookings/:id                # Cancel booking
GET    /api/bookings/member/:memberId   # Get member's bookings
```

⚠️ **Security Issue:** Missing ownership check in cancel (see CODE_QUALITY_REPORT.md section 2.1)

#### Class Schedules (`/api/class-schedules`)

```
POST   /api/class-schedules             # Create class schedule
GET    /api/class-schedules             # List schedules (paginated)
GET    /api/class-schedules/:id         # Get schedule details
PUT    /api/class-schedules/:id         # Update schedule
DELETE /api/class-schedules/:id         # Cancel class schedule
GET    /api/class-schedules/:id/bookings # Get bookings for class
```

#### Attendance (`/api/attendance`)

```
POST   /api/attendance/check-in         # Check in (QR code or manual)
POST   /api/attendance/check-out        # Check out
GET    /api/attendance                  # List attendance records
GET    /api/attendance/member/:memberId # Get member's attendance
```

#### Payments (`/api/payments`)

```
POST   /api/payments                    # Create payment
GET    /api/payments                    # List payments (paginated)
GET    /api/payments/:id                # Get payment details
POST   /api/payments/:id/refund         # Refund payment
POST   /api/payments/callback           # Payment gateway webhook (public)
GET    /api/payments/return             # Payment gateway return URL (public)
```

#### Invoices (`/api/invoices`)

```
POST   /api/invoices                    # Create invoice
GET    /api/invoices                    # List invoices (paginated)
GET    /api/invoices/:id                # Get invoice details
PUT    /api/invoices/:id                # Update invoice
POST   /api/invoices/:id/send           # Send invoice via email
GET    /api/invoices/:id/pdf            # Download invoice PDF
POST   /api/invoices/:id/mark-paid      # Mark invoice as paid
```

#### Organizations (`/api/organizations`)

```
POST   /api/organizations               # Create organization (SUPER_ADMIN)
GET    /api/organizations               # List organizations
GET    /api/organizations/:id           # Get organization details
PUT    /api/organizations/:id           # Update organization
DELETE /api/organizations/:id           # Delete organization
```

#### Clubs (`/api/clubs`)

```
POST   /api/clubs                       # Create club (SUPER_ADMIN)
GET    /api/clubs                       # List clubs
GET    /api/clubs/:id                   # Get club details
PUT    /api/clubs/:id                   # Update club
DELETE /api/clubs/:id                   # Delete club
GET    /api/clubs/:id/stats             # Get club statistics
```

#### Reports (`/api/reports`)

```
GET    /api/reports/members             # Member reports
GET    /api/reports/financial           # Financial reports
GET    /api/reports/attendance          # Attendance reports
GET    /api/reports/classes             # Class performance reports
POST   /api/reports/export              # Export report to Excel/CSV
```

#### Platform Auth (`/api/platform/auth`)

```
POST   /api/platform/auth/login         # Internal team login
POST   /api/platform/auth/refresh       # Refresh platform token
POST   /api/platform/auth/send-code     # Send MFA code
POST   /api/platform/auth/verify-code   # Verify MFA code
```

### 7.3 Common Request/Response Patterns

#### Paginated Response
```json
{
  "content": [...],
  "totalElements": 100,
  "totalPages": 10,
  "size": 10,
  "number": 0,
  "first": true,
  "last": false
}
```

#### Error Response (Bilingual)
```json
{
  "status": 404,
  "error": "Not Found",
  "errorAr": "غير موجود",
  "message": "Member not found",
  "messageAr": "العضو غير موجود",
  "timestamp": "2026-02-04T10:30:00Z",
  "path": "/api/members/123"
}
```

#### Validation Error Response
```json
{
  "status": 400,
  "error": "Validation Failed",
  "errorAr": "فشل التحقق",
  "message": "Invalid input",
  "messageAr": "مدخلات غير صحيحة",
  "timestamp": "2026-02-04T10:30:00Z",
  "path": "/api/members",
  "validationErrors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "messageAr": "صيغة البريد الإلكتروني غير صحيحة",
      "rejectedValue": "invalid-email"
    }
  ]
}
```

### 7.4 API Authentication

**Headers Required:**
```
Authorization: Bearer <access_token>    # JWT token
X-Tenant-ID: <club_uuid>                # Tenant identifier
X-CSRF-Token: <csrf_token>              # CSRF token (if using cookie auth)
Accept-Language: en | ar                # Preferred language
```

**Cookie Authentication (Alternative):**
```
Cookie: auth_token=<jwt_token>
```

### 7.5 API Documentation

- **Swagger UI:** Available at `/swagger-ui.html`
- **OpenAPI JSON:** Available at `/v3/api-docs`
- ⚠️ **Status:** Minimal annotations, needs improvement (see CODE_QUALITY_REPORT.md section 5.2)

---

## 8. Security Summary

### 8.1 Authentication Mechanisms

#### JWT Token Authentication
- **Access Token:** 15-minute expiration
- **Refresh Token:** 7-day expiration, stored in database
- **Algorithm:** HMAC-SHA256
- **Claims:** userId, tenantId, roles, permissions
- **Secret:** Configurable via environment variable

#### Cookie-Based Authentication
- **Cookie Name:** `auth_token`
- **HttpOnly:** Yes (prevents XSS)
- **Secure:** Yes (HTTPS only in production)
- **SameSite:** Strict (prevents CSRF)
- **Expiration:** Same as access token (15 minutes)

#### OAuth 2.0 SSO
- **Providers:** Google, Apple
- **Flow:** Authorization Code with PKCE
- **State Parameter:** Random UUID to prevent CSRF
- **Scope:** email, profile

### 8.2 Authorization

#### Role-Based Access Control (RBAC)
```kotlin
@PreAuthorize("hasRole('CLUB_ADMIN')")
fun updateMember(id: UUID, request: UpdateMemberRequest): MemberDto

@PreAuthorize("hasAnyRole('CLUB_ADMIN', 'TRAINER')")
fun createBooking(request: CreateBookingRequest): BookingDto
```

#### Permission-Based Authorization
```kotlin
@PreAuthorize("hasPermission('MEMBER_WRITE')")
fun deleteMember(id: UUID)

@PreAuthorize("hasPermission('FINANCIAL_READ')")
fun getFinancialReports(): ReportDto
```

#### Tenant Isolation
- Automatic filtering via Hibernate filters
- ThreadLocal tenant context
- Validated in TenantFilter
- ⚠️ **Issue:** Some endpoints missing tenant validation (see CODE_QUALITY_REPORT.md)

### 8.3 Security Headers

```kotlin
// X-Frame-Options: SAMEORIGIN (prevents clickjacking)
headers.frameOptions { it.sameOrigin() }

// X-Content-Type-Options: nosniff (prevents MIME sniffing)
headers.contentTypeOptions { }

// X-XSS-Protection: 1; mode=block
headers.xssProtection {
    it.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK)
}

// Referrer-Policy: strict-origin-when-cross-origin
headers.referrerPolicy {
    it.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
}

// Content-Security-Policy
headers.contentSecurityPolicy {
    it.policyDirectives("default-src 'self'")
}

// HTTP Strict Transport Security (HSTS) - production only
if (hstsEnabled) {
    headers.httpStrictTransportSecurity {
        it.maxAgeInSeconds(31536000)
            .includeSubDomains(true)
            .preload(true)
    }
}
```

### 8.4 CORS Configuration

```kotlin
// Production: Explicit allowed origins with credentials
configuration.allowedOrigins = listOf(
    "https://app.liyaqa.com",
    "https://platform.liyaqa.com"
)
configuration.allowCredentials = true

// Development: Patterns without credentials (safe)
configuration.allowedOriginPatterns = listOf("http://localhost:*")
configuration.allowCredentials = false

// Allowed methods
configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")

// Allowed headers
configuration.allowedHeaders = listOf(
    "Authorization", "X-Tenant-ID", "X-CSRF-Token", "Content-Type", ...
)
```

### 8.5 CSRF Protection

- **Enabled for:** Cookie-based authentication only
- **Disabled for:** Bearer token authentication (JWT in header)
- **Token Header:** `X-CSRF-Token`
- **Token Endpoint:** `GET /api/auth/csrf`
- **Validation:** CsrfValidationFilter

### 8.6 Password Security

- **Hashing:** BCrypt with 10 rounds
- **Minimum Length:** 8 characters
- **Complexity Requirements:** At least one uppercase, one lowercase, one digit
- **Password Reset:** Time-limited tokens (15 minutes)
- ⚠️ **Issue:** Reset tokens not cryptographically secure (see CODE_QUALITY_REPORT.md section 2.3)

### 8.7 Rate Limiting

- ⚠️ **Status:** Not implemented (see CODE_QUALITY_REPORT.md section 5.2)
- **Recommendation:** 100 requests/second per user
- **Suggested Tool:** Resilience4j RateLimiter

### 8.8 Known Security Issues

See CODE_QUALITY_REPORT.md Section 2 for detailed security vulnerabilities:
1. Missing tenant validation in MeController
2. Missing authorization in BookingService
3. PII exposure in logs
4. Weak password reset implementation

**See:** ERROR_HANDLING_GUIDE.md for complete error handling and security logging

---

## 9. Compliance Features

### 9.1 ZATCA E-Invoicing (Saudi Arabia)

**Status:** Partially Implemented

#### Phase 1: Generation (Implemented)
- ✅ ZATCA-compliant invoice format
- ✅ QR code generation (TLV format, base64 encoded)
- ✅ Invoice hash (SHA-256)
- ✅ Sequential invoice numbering
- ✅ Seller information (VAT number, CR number)
- ✅ Arabic invoice templates

#### QR Code Contents (TLV Encoded)
1. Seller name (Arabic)
2. VAT registration number
3. Invoice timestamp
4. Invoice total (including VAT)
5. VAT amount

#### Phase 2: Integration (Pending)
- ⚠️ API integration with ZATCA Fatoora portal
- ⚠️ Cryptographic stamp
- ⚠️ Real-time invoice reporting
- ⚠️ Clearance for B2B invoices
- ⚠️ XML format support

### 9.2 VAT Compliance

#### VAT Rate
- **Standard Rate:** 15% (configurable)
- **Applied To:** All membership fees, services, products

#### TaxableFee Value Object
```kotlin
@Embeddable
data class TaxableFee(
    val baseAmount: Money,
    val vatRate: BigDecimal = BigDecimal("0.15") // 15%
) {
    val vatAmount: Money get() = Money(
        amount = baseAmount.amount * vatRate,
        currency = baseAmount.currency
    )
    val totalAmount: Money get() = Money(
        amount = baseAmount.amount + vatAmount.amount,
        currency = baseAmount.currency
    )
}
```

#### VAT on Invoices
```kotlin
data class Invoice(
    val items: List<InvoiceItem>,
    val subtotal: Money,
    val vatAmount: Money, // Calculated: subtotal * 0.15
    val total: Money      // subtotal + vatAmount
)
```

#### VAT Reports
- Monthly VAT summary
- VAT breakdown by transaction
- Export to Excel for accountants

### 9.3 Hijri Calendar Support

```kotlin
// Utility for Hijri date conversion
object HijriCalendarUtils {
    fun gregorianToHijri(gregorianDate: LocalDate): HijriDate {
        // Umm al-Qura calendar conversion
    }

    fun hijriToGregorian(hijriDate: HijriDate): LocalDate {
        // Reverse conversion
    }

    fun formatHijri(date: HijriDate, locale: Locale): String {
        // Format: "١٥ رمضان ١٤٤٧ هـ"
    }
}
```

**Usage:**
- Invoice dates shown in both Gregorian and Hijri
- Reports with Hijri month filtering
- Membership plans with Hijri duration

### 9.4 Prayer Times Integration

**Status:** Planned

```kotlin
// Planned: Prayer time service
interface PrayerTimeService {
    fun getPrayerTimes(date: LocalDate, location: Location): PrayerTimes
}

data class PrayerTimes(
    val fajr: LocalTime,
    val dhuhr: LocalTime,
    val asr: LocalTime,
    val maghrib: LocalTime,
    val isha: LocalTime
)
```

**Use Cases:**
- Gym operating hours adjustment during Ramadan
- Class scheduling around prayer times
- Automated prayer break notifications

### 9.5 Localization (Arabic/English)

#### LocalizedText Value Object
```kotlin
@Embeddable
data class LocalizedText(
    @Column(name = "_en", nullable = false)
    val en: String,
    @Column(name = "_ar")
    val ar: String? = null
) {
    fun get(locale: String = "en"): String {
        return when (locale.lowercase()) {
            "ar" -> ar ?: en
            else -> en
        }
    }
}
```

#### Usage in Entities
```kotlin
class MembershipPlan(
    val name: LocalizedText, // Bilingual plan name
    val description: LocalizedText, // Bilingual description
    val features: List<LocalizedText> // Bilingual features
)
```

#### API Responses
- `Accept-Language` header respected
- Error messages in preferred language
- Email templates in both languages
- Invoice templates in both languages

#### RTL Support (Frontend)
- Tailwind CSS RTL utilities
- Direction auto-detection based on locale
- Arabic font optimization

### 9.6 Saudi PDPL (Personal Data Protection Law)

#### Data Privacy
- ✅ User consent for data collection
- ✅ Data access controls (RBAC)
- ✅ Audit logs for data access
- ⚠️ PII masking in logs (partially implemented)
- ⚠️ Data export for users (planned)
- ⚠️ Data deletion (right to be forgotten) (planned)

#### Consent Management
```kotlin
class User(
    val marketingConsent: Boolean = false,
    val dataProcessingConsent: Boolean = true, // Required
    val consentDate: Instant
)
```

**See:** SAUDI_COMPLIANCE.md for complete compliance documentation

---

## 10. Setup & Deployment Guide

### 10.1 Local Development Setup

#### Prerequisites
- JDK 21
- Kotlin 2.2.0
- PostgreSQL 16
- Redis 7.x
- Node.js 20.x
- Docker & Docker Compose (optional but recommended)

#### Backend Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd liyaqa/backend
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

3. **Environment Variables**
   ```properties
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=liyaqa
   DB_USER=postgres
   DB_PASSWORD=postgres

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # JWT
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRATION=900000 # 15 minutes
   REFRESH_TOKEN_EXPIRATION=604800000 # 7 days

   # CORS
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

   # External Services
   PAYTABS_SERVER_KEY=your-paytabs-key
   PAYTABS_PROFILE_ID=your-profile-id
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   SENDGRID_API_KEY=your-sendgrid-key
   ```

4. **Start Database (Docker)**
   ```bash
   docker-compose up -d postgres redis
   ```

5. **Run Migrations**
   ```bash
   ./gradlew flywayMigrate
   ```

6. **Start Backend**
   ```bash
   ./gradlew bootRun
   ```

   Backend runs on: http://localhost:8080

#### Frontend Setup

1. **Navigate to Frontend**
   ```bash
   cd ../frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   # apps/club/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws

   # apps/platform/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   NEXT_PUBLIC_PLATFORM_MODE=true
   ```

4. **Start Development Servers**
   ```bash
   # Club app
   npm run dev:club
   # Runs on http://localhost:3000

   # Platform app (separate terminal)
   npm run dev:platform
   # Runs on http://localhost:3001
   ```

### 10.2 Docker Deployment

#### Build Images

```bash
# Backend
cd backend
docker build -t liyaqa-backend:latest .

# Frontend - Club App
cd ../frontend
docker build -f apps/club/Dockerfile -t liyaqa-club-app:latest .

# Frontend - Platform App
docker build -f apps/platform/Dockerfile -t liyaqa-platform-app:latest .
```

#### Docker Compose (Production)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: liyaqa
      POSTGRES_USER: liyaqa
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    image: liyaqa-backend:latest
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_HOST: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis

  club-app:
    image: liyaqa-club-app:latest
    environment:
      NEXT_PUBLIC_API_URL: https://api.liyaqa.com
    ports:
      - "3000:3000"

  platform-app:
    image: liyaqa-platform-app:latest
    environment:
      NEXT_PUBLIC_API_URL: https://api.liyaqa.com
    ports:
      - "3001:3000"

volumes:
  postgres_data:
```

### 10.3 AWS Deployment

#### Architecture

```
Route 53 (DNS)
    ↓
CloudFront (CDN)
    ↓
Application Load Balancer
    ├── ECS Cluster (Backend)
    │   └── Fargate Tasks (Spring Boot)
    ├── ECS Cluster (Club App)
    │   └── Fargate Tasks (Next.js)
    └── ECS Cluster (Platform App)
        └── Fargate Tasks (Next.js)
    ↓
RDS PostgreSQL 16 (Multi-AZ)
ElastiCache Redis (Multi-AZ)
S3 (File Storage)
CloudWatch (Monitoring)
```

#### ECS Task Definition (Backend)

```json
{
  "family": "liyaqa-backend",
  "cpu": "1024",
  "memory": "2048",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/liyaqa-backend:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "SPRING_PROFILES_ACTIVE",
          "value": "prod"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:liyaqa/db-password"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:liyaqa/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/liyaqa-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Database Setup (RDS)

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier liyaqa-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16.1 \
  --master-username liyaqa \
  --master-user-password ${DB_PASSWORD} \
  --allocated-storage 100 \
  --multi-az \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "Mon:04:00-Mon:05:00"
```

#### Redis Setup (ElastiCache)

```bash
# Create ElastiCache cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id liyaqa-redis-prod \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.t3.medium \
  --num-cache-nodes 1 \
  --preferred-maintenance-window "Mon:05:00-Mon:06:00"
```

### 10.4 Environment-Specific Configuration

#### Development (`application-dev.yml`)
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/liyaqa
  jpa:
    show-sql: true
    hibernate:
      ddl-auto: validate

logging:
  level:
    com.liyaqa: DEBUG
```

#### Production (`application-prod.yml`)
```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
  jpa:
    show-sql: false
    hibernate:
      ddl-auto: validate

logging:
  level:
    com.liyaqa: INFO
```

### 10.5 Database Migrations

#### Run Migrations

```bash
# Development
./gradlew flywayMigrate

# Production
./gradlew flywayMigrate -Dflyway.url=jdbc:postgresql://prod-db:5432/liyaqa \
  -Dflyway.user=liyaqa \
  -Dflyway.password=${DB_PASSWORD}
```

#### Rollback (Manual)

```bash
# Create rollback script manually
psql -h prod-db -U liyaqa -d liyaqa -f V94__create_shedlock_table.rollback.sql
```

⚠️ **Missing:** Automated rollback scripts (see CODE_QUALITY_REPORT.md section 12 Priority 10)

### 10.6 Monitoring & Observability

#### Prometheus Metrics

```bash
# Metrics endpoint
curl http://localhost:8080/actuator/prometheus
```

#### CloudWatch Integration

```kotlin
// application-prod.yml
management:
  metrics:
    export:
      cloudwatch:
        namespace: Liyaqa
        batch-size: 20
```

#### Distributed Tracing (Zipkin)

```yaml
spring:
  zipkin:
    base-url: http://zipkin:9411
  sleuth:
    sampler:
      probability: 1.0 # 100% sampling in dev, 10% in prod
```

---

## 11. Known Issues/TODOs

### 11.1 Critical Issues (Fix Before Production)

From CODE_QUALITY_REPORT.md:

1. **Security Vulnerabilities**
   - [ ] Missing tenant validation in MeController line 141
   - [ ] Missing authorization check in BookingService line 111
   - [ ] PII exposure in application logs
   - [ ] Weak password reset token implementation

2. **Performance Issues**
   - [ ] N+1 query in PermissionService line 63
   - [ ] N+1 query in SubscriptionService line 149
   - [ ] Missing database indices (bookings.member_id, subscriptions.end_date, etc.)
   - [ ] Unbounded queries without pagination

3. **Code Quality**
   - [ ] BookingService is 1,244 lines (decompose into 4 services)
   - [ ] InvoiceService is 688 lines (decompose into 3 services)
   - [ ] ClientOnboardingService is 505 lines (decompose into 2 services)

### 11.2 High Priority Issues

4. **Test Coverage**
   - [ ] Overall coverage is 11% (target: 80%)
   - [ ] Service layer coverage is 65% (target: 90%)
   - [ ] Controller layer coverage is 22% (target: 80%)
   - [ ] Missing integration tests for critical flows

5. **Architecture**
   - [ ] Tight coupling (SubscriptionService has 10 dependencies)
   - [ ] Layering violations (controllers accessing repositories)
   - [ ] Missing abstractions (PaymentGateway interface)

6. **Resilience**
   - [ ] No rate limiting
   - [ ] No circuit breakers for external services
   - [ ] No fallback mechanisms

### 11.3 Medium Priority Issues

7. **Code Duplication**
   - [ ] 23 duplicate notification methods across services
   - [ ] Duplicated email validation logic
   - [ ] Inconsistent error handling patterns

8. **API Documentation**
   - [ ] Minimal OpenAPI annotations
   - [ ] No request/response examples
   - [ ] No error response documentation

9. **Database**
   - [ ] No migration rollback scripts
   - [ ] Missing indices for performance

10. **Compliance**
    - [ ] ZATCA API integration (Phase 2)
    - [ ] Prayer time integration
    - [ ] Data export for users (PDPL)
    - [ ] Right to be forgotten (PDPL)

### 11.4 Low Priority / Nice-to-Have

11. **Features**
    - [ ] Mobile app (iOS/Android)
    - [ ] WhatsApp notifications
    - [ ] Social media integration
    - [ ] Loyalty program
    - [ ] Referral system

12. **Developer Experience**
    - [ ] GraphQL API (alternative to REST)
    - [ ] Real-time updates (WebSocket)
    - [ ] API versioning (/api/v2)
    - [ ] SDK for third-party integrations

13. **Operations**
    - [ ] Automated backups
    - [ ] Disaster recovery plan
    - [ ] Blue-green deployments
    - [ ] Canary deployments

---

## 12. Recommended Improvements

### 12.1 Short-Term (Week 1-2)

**Priority 1: Security & Performance**
- Fix all security vulnerabilities
- Add tenant validation to all endpoints
- Fix N+1 queries with JOIN FETCH
- Add missing database indices
- Implement rate limiting

**Estimated Effort:** 6-10 days with 2 developers

### 12.2 Mid-Term (Week 3-6)

**Priority 2: Code Quality & Testing**
- Decompose large services (BookingService, InvoiceService, ClientOnboardingService)
- Eliminate code duplication (NotificationService centralization)
- Increase test coverage to 80%
- Add integration tests for critical flows
- Fix layering violations

**Estimated Effort:** 3-4 weeks with 2-3 developers

### 12.3 Long-Term (Week 7-10)

**Priority 3: Architecture & Resilience**
- Add circuit breakers for external services
- Implement proper abstractions (PaymentGateway, EmailProvider)
- Add comprehensive API documentation
- Create migration rollback scripts
- Improve monitoring and alerting

**Estimated Effort:** 3-4 weeks with 1-2 developers

### 12.4 Continuous Improvement

**Establish Quality Gates**
- SonarQube for code quality
- JaCoCo for test coverage (minimum 80%)
- Detekt for Kotlin linting
- ArchUnit for architecture validation

**Monitoring**
- Track API response times (target: P95 < 200ms)
- Monitor error rates (target: < 0.1%)
- Track test coverage trends
- Monitor business metrics (new members, revenue, churn)

**See:** CODE_QUALITY_REPORT.md Section 7 for complete prioritized recommendations

---

## 13. Quick Reference Guide

### 13.1 Common Tasks

#### Start Local Development
```bash
# Start backend
cd backend
./gradlew bootRun

# Start frontend (separate terminal)
cd frontend
npm run dev:club
```

#### Run Tests
```bash
# Backend
./gradlew test

# Frontend
npm run test
```

#### Create Database Migration
```bash
# Create new migration file
cd backend/src/main/resources/db/migration
touch V95__add_new_feature.sql
# Edit file, then run migrations
./gradlew flywayMigrate
```

#### Add New Entity
```kotlin
// 1. Create entity
@Entity
class MyEntity(
    @Id val id: UUID = UUID.randomUUID(),
    val tenantId: UUID, // For tenant isolation
    val name: String
) : BaseEntity(), TenantAware

// 2. Create repository
interface MyEntityRepository : JpaRepository<MyEntity, UUID>

// 3. Create service
@Service
class MyEntityService(
    private val repository: MyEntityRepository
) {
    fun findAll(): List<MyEntity> = repository.findAll()
}

// 4. Create controller
@RestController
@RequestMapping("/api/my-entities")
class MyEntityController(
    private val service: MyEntityService
) {
    @GetMapping
    fun getAll() = service.findAll()
}
```

#### Add New API Endpoint
```kotlin
// 1. Define DTO
data class CreateMyEntityRequest(
    @field:NotBlank val name: String
)

data class MyEntityDto(
    val id: UUID,
    val name: String
)

// 2. Add service method
@Transactional
fun create(request: CreateMyEntityRequest): MyEntity {
    val entity = MyEntity(name = request.name)
    return repository.save(entity)
}

// 3. Add controller method
@PostMapping
fun create(@RequestBody @Valid request: CreateMyEntityRequest): MyEntityDto {
    val entity = service.create(request)
    return mapToDto(entity)
}
```

### 13.2 Troubleshooting

#### Backend Won't Start
```bash
# Check Java version
java -version  # Should be 21

# Check PostgreSQL connection
psql -h localhost -U postgres -d liyaqa

# Check Redis connection
redis-cli ping  # Should return PONG

# Check logs
tail -f logs/liyaqa.log
```

#### Database Migration Fails
```bash
# Check migration status
./gradlew flywayInfo

# Repair checksum mismatch
./gradlew flywayRepair

# Baseline existing database
./gradlew flywayBaseline
```

#### Tests Failing
```bash
# Run single test
./gradlew test --tests "com.liyaqa.membership.MemberServiceTest"

# Run with debug logging
./gradlew test --debug

# Clean and rebuild
./gradlew clean build
```

### 13.3 Key File Locations

```
Backend:
- Main application: backend/src/main/kotlin/com/liyaqa/LiyaqaApplication.kt
- Security config: backend/src/main/kotlin/com/liyaqa/config/SecurityConfig.kt
- Exception handler: backend/src/main/kotlin/com/liyaqa/config/GlobalExceptionHandler.kt
- Migrations: backend/src/main/resources/db/migration/
- Config: backend/src/main/resources/application.yml
- Logging: backend/src/main/resources/logback-spring.xml

Frontend:
- Club app: frontend/apps/club/
- Platform app: frontend/apps/platform/
- Shared components: frontend/shared/
- API client: frontend/shared/src/lib/api-client.ts

Docker:
- Dev compose: docker-compose.yml
- Prod compose: deploy/docker-compose.local-prod.yml
```

### 13.4 Useful Commands

```bash
# Backend
./gradlew bootRun                # Start backend
./gradlew test                   # Run tests
./gradlew build                  # Build JAR
./gradlew flywayMigrate          # Run migrations
./gradlew clean                  # Clean build

# Frontend
npm run dev:club                 # Start club app
npm run dev:platform             # Start platform app
npm run build                    # Build for production
npm run test                     # Run tests
npm run lint                     # Lint code

# Docker
docker-compose up -d             # Start all services
docker-compose down              # Stop all services
docker-compose logs -f backend   # View backend logs
docker-compose ps                # List running services

# Database
psql -h localhost -U postgres -d liyaqa  # Connect to DB
psql -f backup.sql -d liyaqa             # Restore backup
pg_dump liyaqa > backup.sql              # Create backup
```

### 13.5 Environment Variables

**Required:**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=liyaqa
DB_USER=postgres
DB_PASSWORD=your-password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
```

**Optional:**
```bash
PAYTABS_SERVER_KEY=your-key
TWILIO_ACCOUNT_SID=your-sid
SENDGRID_API_KEY=your-key
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

### 13.6 Support & Documentation

- **Technical Documentation:**
  - This file (PROJECT_COMPLETE_DOCUMENTATION.md)
  - DTO_CATALOG.md (all DTOs)
  - MULTI_TENANT_ARCHITECTURE.md (multi-tenancy)
  - SAUDI_COMPLIANCE.md (compliance features)
  - ERROR_HANDLING_GUIDE.md (error handling)
  - INFRASTRUCTURE_COMPONENTS.md (utilities)
  - TESTING_DOCUMENTATION.md (testing)
  - CODE_QUALITY_REPORT.md (quality analysis)

- **API Documentation:**
  - Swagger UI: http://localhost:8080/swagger-ui.html
  - OpenAPI JSON: http://localhost:8080/v3/api-docs

- **Contact:**
  - Development Team: [Contact Info]
  - Technical Lead: [Contact Info]

---

**Document Version:** 1.0.0
**Last Updated:** February 4, 2026
**Maintained By:** Liyaqa Development Team

---

## Appendix: Quick Navigation

For detailed information on specific topics, refer to these specialized documentation files:

1. **DTOs & API Contracts** → DTO_CATALOG.md
2. **Multi-Tenant Architecture** → MULTI_TENANT_ARCHITECTURE.md
3. **Saudi Compliance** → SAUDI_COMPLIANCE.md
4. **Error Handling** → ERROR_HANDLING_GUIDE.md
5. **Infrastructure Components** → INFRASTRUCTURE_COMPONENTS.md
6. **Testing Strategy** → TESTING_DOCUMENTATION.md
7. **Code Quality Analysis** → CODE_QUALITY_REPORT.md
