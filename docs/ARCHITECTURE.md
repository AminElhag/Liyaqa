# Liyaqa Technical Architecture

**Comprehensive Technical Architecture Documentation**

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Multi-Tenancy Architecture](#3-multi-tenancy-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Database Architecture](#6-database-architecture)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [API Architecture](#8-api-architecture)
9. [Payment Processing](#9-payment-processing)
10. [Notification System](#10-notification-system)
11. [Integration Architecture](#11-integration-architecture)
12. [Security Architecture](#12-security-architecture)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Performance & Scalability](#14-performance--scalability)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

Liyaqa follows a modern, modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────┬───────────────────┬──────────────────────────┤
│  Web Frontend   │   Mobile Apps     │    Kiosk Interface       │
│  (Next.js 15)   │  (KMP/Compose)    │  (Next.js Fullscreen)    │
└────────┬────────┴──────────┬────────┴──────────┬───────────────┘
         │                   │                    │
         └───────────────────┴────────────────────┘
                             │
                    REST API over HTTPS
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                      API Gateway Layer                            │
│  (Spring Boot + Spring Security + JWT + Rate Limiting)           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                   Application Layer                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         31 Domain Modules (Bounded Contexts)              │   │
│  │  Membership │ CRM │ Marketing │ Billing │ ... │ Platform │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                 Data Persistence Layer                            │
│              PostgreSQL with Multi-Tenant Isolation               │
└───────────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Principles

**Domain-Driven Design (DDD)**:
- 31 bounded contexts as independent modules
- Rich domain models with business logic
- Ubiquitous language throughout codebase
- Aggregate roots and value objects

**Hexagonal Architecture** (Ports & Adapters):
- Domain layer (pure business logic)
- Application layer (use cases/services)
- Infrastructure layer (persistence, external services)
- API layer (REST controllers)

**Microservices-Ready**:
- Modular design allows future decomposition
- Clear module boundaries
- Minimal coupling between modules
- Shared kernel for cross-cutting concerns

**Multi-Tenancy by Design**:
- Tenant isolation at database, application, and API levels
- Two-tier hierarchy (Organization → Clubs)
- Subdomain-based routing

**Event-Driven Architecture**:
- Domain events for internal communication
- Webhook system for external integrations
- Async processing for long-running tasks

---

## 2. Technology Stack

### 2.1 Backend Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | Spring Boot | 4.0.1 | Backend framework |
| **Language** | Kotlin | 2.2.0 | Primary language |
| **JVM** | Java | 21 | Runtime environment |
| **Database** | PostgreSQL | Latest | Primary data store |
| **ORM** | Spring Data JPA | (via Spring Boot) | Object-relational mapping |
| **Migrations** | Flyway | (via Spring Boot) | Database versioning |
| **Security** | Spring Security | (via Spring Boot) | Authentication/authorization |
| **JWT** | jjwt | 0.12.5 | Token generation |
| **Caching** | Caffeine | 3.1.8 | In-memory caching |
| **PDF Generation** | OpenPDF | 2.0.3 | Invoice/report PDFs |
| **QR Codes** | ZXing | 3.5.2 | QR code generation |
| **Prayer Times** | Batoulapps Adhan | 1.2.1 | Islamic prayer times |
| **Push Notifications** | Firebase Admin SDK | 9.2.0 | FCM integration |
| **API Docs** | SpringDoc OpenAPI | 2.8.0 | API documentation |
| **Job Locking** | ShedLock | 6.0.2 | Distributed scheduling |
| **Retry Logic** | Spring Retry | 2.0.11 | Resilient service calls |

### 2.2 Frontend Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | Next.js | 15.1.0 | React framework with App Router |
| **UI Library** | React | 19.0.0 | UI components |
| **Language** | TypeScript | 5.7.3 | Type safety |
| **Styling** | Tailwind CSS | 3.4.17 | Utility-first CSS |
| **UI Components** | Radix UI + shadcn/ui | Latest | Accessible components |
| **State Management** | Zustand | 5.0.3 | Global state |
| **Data Fetching** | TanStack Query | 5.64.2 | Server state management |
| **Forms** | React Hook Form | 7.54.2 | Form management |
| **Validation** | Zod | 3.24.1 | Schema validation |
| **Internationalization** | next-intl | 3.26.3 | i18n support |
| **Charts** | Recharts | 3.6.0 | Data visualization |
| **HTTP Client** | ky | 1.7.4 | Fetch wrapper |
| **Notifications** | Sonner | 2.0.7 | Toast notifications |
| **Animations** | Framer Motion | 12.27.1 | Animations |

### 2.3 Mobile Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | Kotlin Multiplatform (KMP) | Cross-platform development |
| **UI** | Compose Multiplatform | UI framework |
| **HTTP Client** | Ktor | Network requests |
| **Local Storage** | SQLDelight | Database for offline |
| **Async** | Kotlin Coroutines | Async operations |
| **Push** | Firebase Cloud Messaging | Push notifications |
| **Platforms** | iOS + Android | Single codebase |

### 2.4 Development & Operations

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Build Tool (Backend)** | Gradle | Kotlin build automation |
| **Build Tool (Frontend)** | npm | JavaScript build automation |
| **Version Control** | Git | Source code management |
| **Testing (Backend)** | JUnit 5, Mockito | Unit/integration tests |
| **Testing (Frontend)** | Vitest, Playwright | Unit/E2E tests |
| **Monitoring** | Spring Boot Actuator | Health checks and metrics |

---

## 3. Multi-Tenancy Architecture

### 3.1 Tenant Hierarchy

```
Platform (Liyaqa)
├── Organization A (e.g., "FitLife Saudi Arabia")
│   ├── Club 1 (Riyadh - North Branch)
│   │   ├── Location 1-1 (Main Gym)
│   │   └── Location 1-2 (Annex)
│   ├── Club 2 (Riyadh - East Branch)
│   └── Club 3 (Jeddah Branch)
├── Organization B (e.g., "GymZone")
│   ├── Club 1 (Dammam)
│   └── Club 2 (Khobar)
└── Organization C (e.g., "PowerGym")
    └── Club 1 (Mecca)
```

### 3.2 Tenant Isolation Layers

**1. Database Layer**:
- `organization_id` column on most tables (UUID)
- `club_id` column where club-level isolation needed (UUID)
- Composite indexes on `(organization_id, id)` for performance
- Hibernate `@FilterDef` for automatic query filtering
- Prevents cross-tenant data leakage at query level

**2. Application Layer**:
- `TenantContext` thread-local storage
- Request-scoped tenant information
- Tenant resolution from JWT token or subdomain
- Tenant validation middleware

**3. API Layer**:
- Optional HTTP headers: `X-Organization-Id`, `X-Club-Id`
- JWT claims contain tenant IDs
- Subdomain-based tenant detection
- Tenant validation on each request

### 3.3 Tenant Resolution

**Subdomain-Based Routing**:
```
https://fitlife.liyaqa.com         → Organization: FitLife
https://gymzone.liyaqa.com         → Organization: GymZone
https://platform.liyaqa.com        → Platform Admin (no org)
https://app.liyaqa.com             → Platform Admin (no org)
```

**Resolution Priority**:
1. JWT token claims (`organizationId`, `clubId`)
2. HTTP headers (`X-Organization-Id`, `X-Club-Id`)
3. Subdomain extraction from hostname
4. Default for platform-level users

**TenantContext Implementation**:
```kotlin
// Simplified example
@Component
class TenantInterceptor : HandlerInterceptor {
    override fun preHandle(request: HttpServletRequest, ...): Boolean {
        val tenantId = resolveTenantId(request)
        TenantContext.setCurrentTenant(tenantId)
        return true
    }

    private fun resolveTenantId(request: HttpServletRequest): TenantId {
        // 1. Check JWT claims
        val jwt = extractJwt(request)
        if (jwt != null) return extractTenantFromJwt(jwt)

        // 2. Check headers
        val orgHeader = request.getHeader("X-Organization-Id")
        if (orgHeader != null) return TenantId(organizationId = orgHeader)

        // 3. Check subdomain
        val host = request.getHeader("Host")
        val subdomain = extractSubdomain(host)
        if (subdomain != null) return lookupTenantBySlug(subdomain)

        // 4. Platform level
        return TenantId.platform()
    }
}
```

### 3.4 JPA Tenant Filtering

```kotlin
@Entity
@Table(name = "members")
@FilterDef(name = "organizationFilter", parameters = [ParamDef(name = "orgId", type = String::class)])
@Filter(name = "organizationFilter", condition = "organization_id = :orgId")
class Member(
    @Id val id: UUID,
    @Column(name = "organization_id") val organizationId: UUID,
    // ... other fields
)

// Automatically filters queries by current tenant
```

---

## 4. Backend Architecture

### 4.1 Module Structure (Hexagonal Architecture)

Each domain module follows this structure:

```
com.liyaqa.{module}/
├── domain/
│   ├── model/              # Domain entities (JPA entities)
│   │   ├── Entity.kt
│   │   └── Enums.kt
│   └── ports/              # Repository interfaces (ports)
│       └── EntityRepository.kt
├── application/
│   ├── services/           # Business logic (use cases)
│   │   └── EntityService.kt
│   └── commands/           # Command DTOs (optional)
│       └── EntityCommands.kt
├── api/                    # REST controllers (adapters)
│   ├── EntityController.kt
│   └── EntityDto.kt
└── infrastructure/
    └── persistence/        # JPA repository implementations
        └── JpaEntityRepository.kt
```

### 4.2 Domain Layer

**Purpose**: Pure business logic, independent of frameworks

**Components**:
- **Entities**: Aggregate roots with business logic
- **Value Objects**: Immutable objects (e.g., Money, Address)
- **Enums**: Status enumerations
- **Domain Events**: Events for inter-module communication
- **Repository Interfaces**: Data access contracts (ports)

**Example Entity**:
```kotlin
@Entity
@Table(name = "members")
class Member(
    @Id val id: UUID = UUID.randomUUID(),
    @Column(name = "organization_id", nullable = false) val organizationId: UUID,
    var firstName: String,
    var lastName: String,
    var email: String,
    var phone: String?,
    @Enumerated(EnumType.STRING) var status: MemberStatus,
    @Column(name = "created_at") val createdAt: LocalDateTime = LocalDateTime.now(),
    @Column(name = "updated_at") var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    fun activate() {
        if (status == MemberStatus.PENDING) {
            status = MemberStatus.ACTIVE
            updatedAt = LocalDateTime.now()
        }
    }

    fun freeze() {
        if (status == MemberStatus.ACTIVE) {
            status = MemberStatus.FROZEN
            updatedAt = LocalDateTime.now()
        }
    }
}
```

### 4.3 Application Layer

**Purpose**: Orchestrate business logic, coordinate domain objects

**Components**:
- **Services**: Implement use cases
- **Command DTOs**: Input data for operations
- **Domain Event Handlers**: React to domain events

**Example Service**:
```kotlin
@Service
@Transactional
class MemberService(
    private val memberRepository: MemberRepository,
    private val subscriptionService: SubscriptionService,
    private val notificationService: NotificationService
) {
    fun createMember(command: CreateMemberCommand): Member {
        // Validate
        if (memberRepository.existsByEmail(command.email)) {
            throw DuplicateEmailException()
        }

        // Create domain object
        val member = Member(
            organizationId = TenantContext.currentOrganizationId,
            firstName = command.firstName,
            lastName = command.lastName,
            email = command.email,
            phone = command.phone,
            status = MemberStatus.PENDING
        )

        // Persist
        val savedMember = memberRepository.save(member)

        // Side effects
        notificationService.sendWelcomeEmail(savedMember)

        return savedMember
    }
}
```

### 4.4 API Layer

**Purpose**: Expose HTTP endpoints, handle request/response

**Components**:
- **Controllers**: REST endpoints with Spring MVC annotations
- **DTOs**: Data Transfer Objects for request/response
- **Mappers**: Convert between entities and DTOs

**Example Controller**:
```kotlin
@RestController
@RequestMapping("/api/members")
@SecurityRequirement(name = "bearer-jwt")
class MemberController(
    private val memberService: MemberService
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createMember(
        @Valid @RequestBody request: CreateMemberRequest
    ): MemberResponse {
        val member = memberService.createMember(request.toCommand())
        return MemberResponse.from(member)
    }

    @GetMapping("/{id}")
    fun getMember(@PathVariable id: UUID): MemberResponse {
        val member = memberService.getMemberById(id)
        return MemberResponse.from(member)
    }
}

data class CreateMemberRequest(
    @field:NotBlank val firstName: String,
    @field:NotBlank val lastName: String,
    @field:Email val email: String,
    val phone: String?
) {
    fun toCommand() = CreateMemberCommand(
        firstName = firstName,
        lastName = lastName,
        email = email,
        phone = phone
    )
}

data class MemberResponse(
    val id: UUID,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phone: String?,
    val status: MemberStatus,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(member: Member) = MemberResponse(
            id = member.id,
            firstName = member.firstName,
            lastName = member.lastName,
            email = member.email,
            phone = member.phone,
            status = member.status,
            createdAt = member.createdAt
        )
    }
}
```

### 4.5 Infrastructure Layer

**Purpose**: Technical implementations (database, external services)

**Components**:
- **JPA Repositories**: Spring Data JPA implementations
- **External Service Clients**: Payment gateways, SMS, email
- **Scheduled Jobs**: Background tasks

---

## 5. Frontend Architecture

### 5.1 Next.js 15 App Router Structure

```
frontend/src/
├── app/
│   └── [locale]/           # Internationalized routes
│       ├── (admin)/        # Admin portal (layout group)
│       │   ├── layout.tsx
│       │   ├── page.tsx    # Dashboard
│       │   ├── members/
│       │   ├── classes/
│       │   └── ...
│       ├── (member)/       # Member portal (layout group)
│       │   ├── layout.tsx
│       │   ├── subscriptions/
│       │   └── ...
│       ├── (platform)/     # Platform admin (layout group)
│       │   ├── layout.tsx
│       │   ├── clients/
│       │   └── ...
│       ├── (auth)/         # Auth pages (layout group)
│       │   ├── login/
│       │   └── register/
│       └── (public)/       # Public pages (layout group)
│           └── page.tsx    # Landing page
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── admin/              # Admin-specific components
│   ├── member/             # Member-specific components
│   ├── platform/           # Platform-specific components
│   └── shared/             # Shared components
├── lib/
│   ├── api/                # API client functions
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── query-client.ts     # TanStack Query config
├── queries/                # TanStack Query hooks
│   ├── use-members.ts
│   └── ...
├── types/                  # TypeScript types
│   ├── member.ts
│   └── ...
└── styles/
    └── globals.css         # Global styles
```

### 5.2 Data Fetching Strategy

**TanStack Query** for server state:
```typescript
// queries/use-members.ts
import { useQuery } from '@tanstack/react-query';
import { getMembers } from '@/lib/api/members';

export function useMembers(filters?: MemberFilters) {
  return useQuery({
    queryKey: ['members', filters],
    queryFn: () => getMembers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// In component
function MemberList() {
  const { data: members, isLoading, error } = useMembers({ status: 'ACTIVE' });

  if (isLoading) return <MemberListSkeleton />;
  if (error) return <ErrorState error={error} />;

  return <MemberTable members={members} />;
}
```

**Zustand** for client state:
```typescript
// stores/use-sidebar.ts
import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  isOpen: true,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
}));
```

### 5.3 API Client

**Centralized HTTP client** with ky:
```typescript
// lib/api/client.ts
import ky from 'ky';

const apiClient = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getAuthToken();
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }

        const orgId = getCurrentOrganizationId();
        if (orgId) {
          request.headers.set('X-Organization-Id', orgId);
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          // Refresh token or redirect to login
          await handleUnauthorized();
        }
      },
    ],
  },
});

export default apiClient;
```

### 5.4 Internationalization

**next-intl** for translations:
```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({ children, params: { locale } }) {
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// In components
import { useTranslations } from 'next-intl';

function WelcomeMessage() {
  const t = useTranslations('common');
  return <h1>{t('welcome')}</h1>;
}
```

---

## 6. Database Architecture

### 6.1 Database Schema Organization

**73+ Flyway Migrations** tracking schema evolution

**Key Schema Patterns**:

**1. Multi-Tenant Columns**:
```sql
CREATE TABLE members (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    club_id UUID,
    -- ... other columns
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE INDEX idx_members_org ON members(organization_id);
CREATE INDEX idx_members_org_club ON members(organization_id, club_id);
```

**2. Audit Columns**:
```sql
-- Most tables include
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
created_by UUID,
updated_by UUID
```

**3. Soft Deletes** (selective tables):
```sql
deleted_at TIMESTAMP,
deleted_by UUID
```

### 6.2 Key Tables Summary

| Table | Purpose | Rows (est.) |
|-------|---------|-------------|
| `organizations` | Client organizations | 100-1000 |
| `clubs` | Gym locations | 500-5000 |
| `members` | Gym members | 100K-1M |
| `subscriptions` | Active subscriptions | 50K-500K |
| `membership_contracts` | Legal contracts | 50K-500K |
| `class_sessions` | Class instances | 1M+ |
| `class_bookings` | Member bookings | 5M+ |
| `invoices` | Financial invoices | 1M+ |
| `attendance_records` | Check-ins | 10M+ |
| `leads` | Sales leads | 100K+ |
| `campaigns` | Marketing campaigns | 1K-10K |

### 6.3 Database Performance

**Indexing Strategy**:
- Primary keys (UUID)
- Foreign keys
- Multi-tenant columns (`organization_id`, `club_id`)
- Frequently queried columns (`email`, `phone`, `status`)
- Composite indexes for common query patterns

**Connection Pooling**:
- HikariCP (default in Spring Boot)
- Pool size based on deployment environment
- Connection timeout and validation

**Query Optimization**:
- JPA fetch strategies (LAZY vs. EAGER)
- Query pagination for large datasets
- Database query logging in dev environment

---

## 7. Authentication & Authorization

### 7.1 Authentication Flow

**JWT-Based Authentication**:

```
┌──────┐                          ┌────────┐                     ┌──────────┐
│Client│                          │Backend │                     │Database  │
└──┬───┘                          └───┬────┘                     └────┬─────┘
   │ POST /api/auth/login            │                                │
   │ {email, password}                │                                │
   ├─────────────────────────────────>│ 1. Validate credentials        │
   │                                  ├───────────────────────────────>│
   │                                  │<───────────────────────────────┤
   │                                  │ 2. Generate JWT (access token) │
   │                                  │ 3. Generate refresh token      │
   │                                  ├───────────────────────────────>│
   │                                  │    Store refresh token         │
   │<─────────────────────────────────┤                                │
   │ 200 OK                           │                                │
   │ {accessToken, refreshToken}      │                                │
   │                                  │                                │
   │ GET /api/members                 │                                │
   │ Authorization: Bearer <token>    │                                │
   ├─────────────────────────────────>│ 4. Validate JWT                │
   │                                  │ 5. Extract user & tenant info  │
   │                                  │ 6. Check permissions           │
   │                                  ├───────────────────────────────>│
   │<─────────────────────────────────┤ 7. Execute query with tenant   │
   │ 200 OK {members}                 │    filtering                   │
```

### 7.2 JWT Token Structure

**Access Token** (15 minutes expiry):
```json
{
  "sub": "user-uuid",
  "email": "admin@fitlife.com",
  "roles": ["CLUB_ADMIN"],
  "organizationId": "org-uuid",
  "clubId": "club-uuid",
  "iat": 1704067200,
  "exp": 1704068100
}
```

**Refresh Token** (7 days expiry):
- Stored in database with user association
- Used to obtain new access token
- Single use (invalidated after use, new one issued)
- Can be revoked (logout, security event)

### 7.3 Authorization Model

**Role-Based Access Control (RBAC)**:

| Role | Scope | Permissions |
|------|-------|-------------|
| `SUPER_ADMIN` | Platform | Full system access |
| `PLATFORM_ADMIN` | Platform | Platform features, client management |
| `CLUB_ADMIN` | Organization | Full access to organization/clubs |
| `MANAGER` | Club | Operations management |
| `STAFF` | Club | Reception, basic operations |
| `TRAINER` | Club | Class/PT management |
| `SALES_REP` | Club | CRM and sales features |
| `MEMBER` | Self | Member self-service |

**Permission Checks**:
```kotlin
@PreAuthorize("hasRole('CLUB_ADMIN') or hasRole('MANAGER')")
@PostMapping("/api/members")
fun createMember(@RequestBody request: CreateMemberRequest): MemberResponse {
    // ...
}

@PreAuthorize("hasPermission(#memberId, 'Member', 'UPDATE')")
@PutMapping("/api/members/{memberId}")
fun updateMember(
    @PathVariable memberId: UUID,
    @RequestBody request: UpdateMemberRequest
): MemberResponse {
    // ...
}
```

---

## 8. API Architecture

### 8.1 RESTful API Design

**Endpoint Conventions**:
```
GET    /api/members          # List members (with pagination/filtering)
POST   /api/members          # Create member
GET    /api/members/{id}     # Get member by ID
PUT    /api/members/{id}     # Update member
DELETE /api/members/{id}     # Delete member

GET    /api/members/{id}/subscriptions  # Nested resources
POST   /api/members/bulk     # Bulk operations
GET    /api/members/search   # Search with complex criteria
```

**Response Format**:
```json
{
  "data": { ... },           // Single resource
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z"
  }
}

// Or for collections
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalElements": 157,
    "totalPages": 8
  }
}
```

**Error Response Format**:
```json
{
  "error": {
    "code": "MEMBER_NOT_FOUND",
    "message": "Member with ID abc-123 not found",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/members/abc-123"
  }
}
```

### 8.2 API Versioning

**URL Versioning** (future):
```
/api/v1/members
/api/v2/members
```

Currently single version, versioning strategy prepared for future.

### 8.3 API Documentation

**OpenAPI 3.0 (Swagger)**:
- Auto-generated from Spring Boot controllers
- Available at `/swagger-ui.html`
- Interactive API explorer
- Schema documentation
- Example requests/responses

---

## 9. Payment Processing

### 9.1 Payment Gateway Integration

**Supported Gateways**:
1. **PayTabs** - Card payments (Visa, Mastercard, Mada)
2. **STC Pay** - Digital wallet (Saudi Arabia)
3. **SADAD** - Bank transfer system (Saudi Arabia)
4. **Tamara** - Buy Now Pay Later (BNPL)

### 9.2 Payment Flow

```
┌──────┐              ┌─────────┐          ┌──────────┐         ┌─────────┐
│Client│              │Backend  │          │Payment   │         │Database │
│      │              │         │          │Gateway   │         │         │
└──┬───┘              └────┬────┘          └────┬─────┘         └────┬────┘
   │ 1. Initiate payment   │                    │                    │
   ├──────────────────────>│                    │                    │
   │                       │ 2. Create invoice  │                    │
   │                       ├────────────────────────────────────────>│
   │                       │ 3. Call gateway API│                    │
   │                       ├───────────────────>│                    │
   │                       │<───────────────────┤                    │
   │                       │ 4. Payment URL     │                    │
   │<──────────────────────┤                    │                    │
   │ 5. Redirect URL       │                    │                    │
   │                       │                    │                    │
   │ 6. Complete payment   │                    │                    │
   ├────────────────────────────────────────────>│                    │
   │                       │                    │ 7. Process payment │
   │                       │<───────────────────┤                    │
   │                       │ 8. Webhook callback│                    │
   │                       ├────────────────────────────────────────>│
   │                       │ 9. Update invoice  │                    │
   │<──────────────────────┤                    │                    │
   │ 10. Return to app     │                    │                    │
```

### 9.3 Payment Security

**PCI DSS Compliance**:
- Never store raw card data
- Tokenization via payment gateways
- Secure HTTPS transmission
- PCI-compliant payment forms (gateway-hosted)

**Payment Method Storage**:
```kotlin
@Entity
class SavedPaymentMethod(
    val id: UUID,
    val memberId: UUID,
    val type: PaymentMethodType, // CARD, STC_PAY, BANK_ACCOUNT
    val token: String,           // Gateway token (encrypted)
    val lastFourDigits: String,  // Display purposes
    val expiryMonth: Int?,
    val expiryYear: Int?,
    val isDefault: Boolean
)
```

---

## 10. Notification System

### 10.1 Multi-Channel Architecture

```
┌────────────────┐
│Notification    │
│Service         │
└───────┬────────┘
        │
        ├────────┬────────┬────────┬────────┐
        ▼        ▼        ▼        ▼        ▼
    ┌──────┐ ┌─────┐ ┌────────┐ ┌──────┐
    │Email │ │ SMS │ │WhatsApp│ │ Push │
    └──────┘ └─────┘ └────────┘ └──────┘
        │        │        │         │
        ▼        ▼        ▼         ▼
    ┌──────────────────────────────────┐
    │    External Service APIs         │
    │  (SMTP, Twilio, WhatsApp, FCM)   │
    └──────────────────────────────────┘
```

### 10.2 Notification Delivery

**Queue-Based Delivery**:
- Async notification processing
- Retry logic for failures
- Delivery status tracking
- Fallback channels

**Template System**:
```kotlin
interface NotificationTemplate {
    val type: NotificationType
    fun render(variables: Map<String, Any>): String
}

// Usage
val template = templateService.getTemplate(NotificationType.BOOKING_CONFIRMATION)
val content = template.render(mapOf(
    "memberName" to member.fullName,
    "className" to booking.className,
    "dateTime" to booking.dateTime
))

notificationService.send(
    recipient = member.email,
    channel = Channel.EMAIL,
    content = content
)
```

---

## 11. Integration Architecture

### 11.1 External Service Integration

**Integration Patterns**:
- REST API clients (HTTP)
- OAuth 2.0 authentication (wearables, equipment)
- Webhook callbacks (payment gateways)
- Scheduled sync jobs (equipment, wearables)

**Resilience Patterns**:
```kotlin
@Service
class PaymentGatewayClient(
    private val restClient: RestClient
) {
    @Retryable(
        maxAttempts = 3,
        backoff = Backoff(delay = 1000, multiplier = 2.0)
    )
    @CircuitBreaker(name = "paymentGateway", fallbackMethod = "paymentFallback")
    fun processPayment(request: PaymentRequest): PaymentResponse {
        return restClient.post("/payment", request)
    }

    fun paymentFallback(request: PaymentRequest, ex: Exception): PaymentResponse {
        // Log error, queue for retry, notify admin
        throw PaymentGatewayUnavailableException("Payment gateway temporarily unavailable")
    }
}
```

---

## 12. Security Architecture

### 12.1 Security Layers

**1. Transport Security**:
- HTTPS/TLS for all API communication
- Certificate validation
- HSTS headers in production

**2. Authentication Security**:
- Password hashing (BCrypt with salt)
- JWT tokens with expiration
- Refresh token rotation
- Rate limiting on login endpoint

**3. Authorization Security**:
- Role-based access control
- Permission-based authorization
- Resource-level access checks
- Tenant isolation enforcement

**4. Data Security**:
- Database encryption at rest
- Sensitive data encryption (payment tokens)
- PII data handling (GDPR/PDPA)
- Audit logging

**5. Application Security**:
- Input validation (Hibernate Validator)
- SQL injection prevention (JPA/prepared statements)
- XSS prevention (Content Security Policy)
- CSRF protection (Spring Security)
- CORS configuration

### 12.2 Security Configuration

```yaml
liyaqa:
  security:
    hsts-enabled: true
    hsts-max-age-seconds: 31536000
    content-security-policy: "default-src 'self'; ..."
  cors:
    allowed-origins: "https://app.liyaqa.com"
    allowed-methods: GET,POST,PUT,DELETE,OPTIONS
```

---

## 13. Deployment Architecture

### 13.1 Environment Configuration

**Development**:
- H2 in-memory database
- Mock external services
- Debug logging
- Hot reload

**Staging**:
- PostgreSQL database
- Real external services (test mode)
- Production-like configuration
- Performance testing

**Production**:
- PostgreSQL (managed service recommended)
- Load balancer
- CDN for static assets
- Monitoring and alerting

### 13.2 Deployment Diagram

```
                    ┌─────────────┐
                    │   CDN       │
                    │ (Static)    │
                    └──────┬──────┘
                           │
┌──────────┐     ┌─────────┴──────────┐
│   DNS    │────>│   Load Balancer    │
└──────────┘     │   (SSL/TLS)        │
                 └─────────┬──────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
       ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
       │ App     │    │ App     │   │ App     │
       │ Instance│    │ Instance│   │ Instance│
       │ (Pod 1) │    │ (Pod 2) │   │ (Pod N) │
       └────┬────┘    └────┬────┘   └────┬────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                  ┌────────▼─────────┐
                  │   PostgreSQL     │
                  │   (Primary)      │
                  └────────┬─────────┘
                           │
                  ┌────────▼─────────┐
                  │   PostgreSQL     │
                  │   (Replica)      │
                  └──────────────────┘
```

### 13.3 Scaling Strategy

**Horizontal Scaling**:
- Stateless application servers
- Session data in JWT (no server-side sessions)
- Database connection pooling

**Vertical Scaling**:
- Increase resources (CPU, RAM) per instance
- Optimize JVM heap size
- Database instance sizing

**Caching Strategy**:
- Application-level caching (Caffeine)
- CDN for static assets
- Database query caching

---

## 14. Performance & Scalability

### 14.1 Performance Optimizations

**Backend**:
- Connection pooling (HikariCP)
- Query optimization (indexes, pagination)
- Lazy loading for JPA relationships
- Response compression (gzip)
- Caching (Caffeine)

**Frontend**:
- Code splitting (Next.js automatic)
- Image optimization (next/image)
- Server-side rendering for SEO
- Client-side caching (TanStack Query)
- Bundle size optimization

**Database**:
- Proper indexing strategy
- Query explain analysis
- Partitioning for large tables (future)
- Read replicas for reporting (future)

### 14.2 Scalability Targets

| Metric | Target |
|--------|--------|
| **Concurrent Users** | 10,000+ |
| **API Response Time** | <200ms (p95) |
| **Database Queries** | <50ms (p95) |
| **Uptime** | 99.9% |
| **Organizations** | 1,000+ |
| **Members** | 1M+ |
| **Transactions/day** | 100K+ |

---

## Summary

Liyaqa's architecture is built for:
- **Scalability**: Horizontal scaling, stateless design
- **Maintainability**: Clean architecture, modular design
- **Security**: Multi-layer security, compliance-ready
- **Performance**: Optimized queries, caching, CDN
- **Flexibility**: Multi-tenant, white-label, extensible
- **Reliability**: Error handling, monitoring, resilience patterns

The architecture supports the current requirements while being prepared for future growth and feature additions.

---

*Last Updated: January 2026*
*Version: 1.0*
