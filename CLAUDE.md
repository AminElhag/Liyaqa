# Liyaqa Backend Development Guide

## Language Requirements

Make sure any code added or updated is compatible with Arabic language. The main language of the software should be Arabic and English. That means any string, any error message, any response, any API call should accept Arabic or English and respond as Arabic or English.

Use `LocalizedText` value object for all user-facing text fields:
```kotlin
@Embedded
@AttributeOverrides(
    AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
    AttributeOverride(name = "ar", column = Column(name = "name_ar"))
)
var name: LocalizedText
```

---

## Architecture Overview

### Tech Stack
- **Framework:** Spring Boot 4.0.1
- **Language:** Kotlin 2.2
- **Database:** PostgreSQL with Flyway migrations
- **Architecture:** Domain-Driven Design (DDD) + Hexagonal Architecture

### Project Structure
```
src/main/kotlin/com/liyaqa/
├── config/                     # Spring configurations
├── shared/                     # Shared kernel
│   ├── domain/                 # Value objects, base entities
│   └── infrastructure/         # Cross-cutting concerns
├── auth/                       # Authentication bounded context
│   ├── domain/
│   │   ├── model/              # User, RefreshToken, Role, UserStatus
│   │   └── ports/              # Repository interfaces
│   ├── infrastructure/
│   │   ├── persistence/        # JPA implementations
│   │   └── security/           # JWT provider, filters
│   ├── application/
│   │   ├── commands/           # Auth commands
│   │   └── services/           # AuthService, UserService
│   └── api/                    # Controllers, DTOs
├── organization/               # Organization bounded context
│   ├── domain/
│   │   ├── model/              # Entities, value objects, enums
│   │   └── ports/              # Repository interfaces
│   ├── infrastructure/
│   │   └── persistence/        # JPA implementations
│   ├── application/
│   │   ├── commands/           # Command objects
│   │   └── services/           # Application services
│   └── api/                    # Controllers, DTOs
├── membership/                 # Membership bounded context
│   ├── domain/
│   │   ├── model/              # Member, MembershipPlan, Subscription
│   │   └── ports/              # Repository interfaces
│   ├── infrastructure/
│   │   └── persistence/        # JPA implementations
│   ├── application/
│   │   ├── commands/           # Command objects
│   │   └── services/           # Application services
│   └── api/                    # Controllers, DTOs
├── attendance/                 # Attendance bounded context
│   ├── domain/
│   │   ├── model/              # AttendanceRecord, AttendanceEnums
│   │   └── ports/              # Repository interfaces
│   ├── infrastructure/
│   │   └── persistence/        # JPA implementations
│   ├── application/
│   │   ├── commands/           # Attendance commands
│   │   └── services/           # AttendanceService
│   └── api/                    # Controllers, DTOs
├── billing/                    # Billing bounded context
│   ├── domain/
│   │   ├── model/              # Invoice, InvoiceLineItem, InvoiceSequence
│   │   └── ports/              # Repository interfaces
│   ├── infrastructure/
│   │   ├── persistence/        # JPA implementations
│   │   └── pdf/                # InvoicePdfGenerator (OpenPDF)
│   ├── application/
│   │   ├── commands/           # Invoice commands
│   │   └── services/           # InvoiceService
│   └── api/                    # Controllers, DTOs
└── scheduling/                 # Scheduling bounded context (pending)
```

---

## Multi-Tenancy Model

### Hierarchy
```
Organization (super-tenant)
├── Club A (tenant_id) ──── Data isolated per club
│   ├── Location A-X
│   └── Location A-Y
└── Club B (tenant_id)
    └── Location B-1
```

### Visibility Rules
- **Organization** → sees all clubs and locations under it
- **Club** → sees only its locations (not other clubs)
- **Location** → sees only itself

### Entity Base Classes

| Base Class | Use Case | Has tenant_id | Has organization_id |
|------------|----------|---------------|---------------------|
| `OrganizationLevelEntity` | Top-level entities (Organization) | No | No |
| `BaseEntity` | Standard tenant-scoped entities | Yes | No |
| `OrganizationAwareEntity` | Entities needing cross-club queries | Yes | Yes |

### Context Headers
- `X-Tenant-ID`: Club UUID for tenant-level access
- `X-Organization-ID`: Organization UUID for org-level access
- `X-Super-Tenant: true`: Enable cross-club queries for organization

---

## Coding Patterns

### 1. Creating a New Entity

```kotlin
@Entity
@Table(name = "table_name")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MyEntity(
    id: UUID = UUID.randomUUID(),

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: MyStatus = MyStatus.ACTIVE

) : BaseEntity(id) {
    // Domain methods with business logic
    fun activate() {
        require(status == MyStatus.PENDING) { "Can only activate from PENDING" }
        status = MyStatus.ACTIVE
    }
}
```

### 2. Repository Port (Interface)

```kotlin
interface MyEntityRepository {
    fun save(entity: MyEntity): MyEntity
    fun findById(id: UUID): Optional<MyEntity>
    fun findAll(pageable: Pageable): Page<MyEntity>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
}
```

### 3. JPA Repository Adapter

```kotlin
interface SpringDataMyEntityRepository : JpaRepository<MyEntity, UUID> {
    // Custom query methods
}

@Repository
class JpaMyEntityRepository(
    private val springDataRepository: SpringDataMyEntityRepository
) : MyEntityRepository {
    override fun save(entity: MyEntity) = springDataRepository.save(entity)
    override fun findById(id: UUID) = springDataRepository.findById(id)
    // ... delegate all methods
}
```

### 4. Application Service

```kotlin
@Service
@Transactional
class MyEntityService(
    private val repository: MyEntityRepository
) {
    fun create(command: CreateCommand): MyEntity {
        val entity = MyEntity(name = command.name)
        return repository.save(entity)
    }

    @Transactional(readOnly = true)
    fun getById(id: UUID): MyEntity {
        return repository.findById(id)
            .orElseThrow { NoSuchElementException("Not found: $id") }
    }
}
```

### 5. REST Controller

```kotlin
@RestController
@RequestMapping("/api/my-entities")
class MyEntityController(
    private val service: MyEntityService
) {
    @PostMapping
    fun create(@Valid @RequestBody request: CreateRequest): ResponseEntity<Response> {
        val entity = service.create(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(Response.from(entity))
    }

    @GetMapping("/{id}")
    fun getById(@PathVariable id: UUID): ResponseEntity<Response> {
        return ResponseEntity.ok(Response.from(service.getById(id)))
    }
}
```

### 6. DTOs with Localization

```kotlin
data class CreateRequest(
    @field:NotBlank val nameEn: String,
    val nameAr: String? = null
)

data class Response(
    val id: UUID,
    val name: LocalizedTextResponse,
    val status: MyStatus
) {
    companion object {
        fun from(entity: MyEntity) = Response(
            id = entity.id,
            name = LocalizedTextResponse.from(entity.name),
            status = entity.status
        )
    }
}
```

---

## Git Workflow

### Repository
- **Remote:** https://github.com/AminElhag/Liyaqa.git
- **Main Branch:** `main`

### Branch Naming
- Feature branches: `features/{feature-name}`
- Bug fixes: `fixes/{bug-name}`
- Hotfixes: `hotfixes/{issue-name}`

### Creating a New Feature Branch

**ALWAYS follow this flow for new features:**

```bash
# 1. Switch to main and pull latest
git checkout main
git pull origin main

# 2. Create new feature branch from main
git checkout -b features/my-feature

# 3. Make changes and commit
git add .
git commit -m "Add: feature description"

# 4. Push and create PR
git push -u origin features/my-feature
```

### Commit Message Format
```
<type>: <short description>

<detailed description if needed>
```

Types: `Add`, `Update`, `Fix`, `Remove`, `Refactor`, `Docs`

### Important Rules
1. **Always pull main before creating a new branch**
2. **Never commit directly to main**
3. **No AI attribution in commit messages**
4. **Use descriptive branch names matching the feature**

---

## Database Migrations

Location: `src/main/resources/db/migration/`

Naming: `V{version}__{description}.sql`

Example: `V2__create_organization_tables.sql`

---

## API Response Format

### Success Response
```json
{
    "id": "uuid",
    "name": { "en": "English", "ar": "العربية" },
    "status": "ACTIVE"
}
```

### Paginated Response
```json
{
    "content": [...],
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5,
    "first": true,
    "last": false
}
```

---

## Testing Guidelines

- Unit tests for domain logic
- Integration tests for repositories
- API tests for controllers
- Use `@DataJpaTest` for repository tests
- Use `@WebMvcTest` for controller tests

---

## Current Modules

### Authentication Module (Implemented)
- **Entities:** User, RefreshToken, PasswordResetToken
- **Enums:** Role (SUPER_ADMIN, CLUB_ADMIN, STAFF, MEMBER), UserStatus
- **Features:** JWT authentication, login/register, token refresh, password management, password reset flow
- **Endpoints:** `/api/auth/*`, `/api/users/*`
- **Security:** Stateless JWT, role-based authorization with @PreAuthorize

### Organization Module (Implemented)
- **Entities:** Organization, Club, Location
- **Features:** CRUD, status transitions, Zatca compliance fields
- **Endpoints:** `/api/organizations`, `/api/clubs`, `/api/locations`

### Membership Module (Implemented)
- **Entities:** Member, MembershipPlan, Subscription
- **Features:** Member CRUD, plan management, subscription lifecycle (freeze/unfreeze/cancel/renew)
- **Endpoints:** `/api/members/*`, `/api/membership-plans/*`, `/api/subscriptions/*`

### Attendance Module (Implemented)
- **Entities:** AttendanceRecord
- **Enums:** CheckInMethod (MANUAL, QR_CODE, CARD, BIOMETRIC), AttendanceStatus (CHECKED_IN, CHECKED_OUT, AUTO_CHECKED_OUT)
- **Features:** Member check-in/check-out, subscription validation, class deduction for limited plans
- **Endpoints:** `/api/members/{id}/check-in`, `/api/members/{id}/check-out`, `/api/attendance/*`, `/api/locations/{id}/attendance`
- **Business Rules:**
  - Validates active subscription before check-in
  - Prevents double check-in (must check-out first)
  - Auto-deducts class from limited subscriptions
  - Auto-checkout via scheduled job at midnight

### Billing Module (Implemented)
- **Entities:** Invoice, InvoiceLineItem (embedded), InvoiceSequence
- **Enums:** InvoiceStatus (DRAFT, ISSUED, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED), PaymentMethod, LineItemType
- **Features:** Invoice CRUD, VAT calculation (15% Saudi), PDF generation (OpenPDF), subscription-based invoicing
- **Endpoints:** `/api/invoices/*`, `/api/subscriptions/{id}/invoice`, `/api/invoices/{id}/pdf`
- **PDF Generation:** Bilingual invoices (EN/AR) using OpenPDF library
- **Business Rules:**
  - Auto-generated invoice numbers: `INV-{YYYY}-{5-digit-seq}`
  - 15% VAT for Saudi Arabia
  - Status transitions: DRAFT → ISSUED → PAID/OVERDUE

### Dashboard & Reporting (Implemented)
- **Endpoints:**
  - `GET /api/dashboard/summary` - Total members, active subscriptions, today's check-ins, pending invoices
  - `GET /api/dashboard/attendance/today` - Today's attendance list
  - `GET /api/dashboard/subscriptions/expiring` - Subscriptions expiring this week
  - `GET /api/dashboard/invoices/pending` - Unpaid invoices

### Scheduled Jobs (Implemented)
- **Location:** `shared/infrastructure/jobs/ScheduledJobs.kt`
- **Jobs:**
  - `processExpiredSubscriptions` - Daily 1 AM: Expires active subscriptions past end date
  - `processOverdueInvoices` - Daily 2 AM: Marks issued invoices as overdue
  - `autoCheckoutAttendance` - Daily midnight: Auto-checkouts all checked-in members
  - `cleanupExpiredTokens` - Daily 3 AM: Removes expired password reset tokens

### Email Service (Implemented)
- **Location:** `shared/infrastructure/email/`
- **Configuration:** `liyaqa.email.enabled` in application.yml
- **Implementations:**
  - `SmtpEmailService` - Production SMTP email (enabled when `liyaqa.email.enabled=true`)
  - `ConsoleEmailService` - Development console logging (enabled when `liyaqa.email.enabled=false`)
- **Features:** Password reset emails, bilingual support (EN/AR)

### Pending Modules
- Scheduling (class/session booking)

---

## Key Value Objects

| Value Object | Location | Purpose |
|--------------|----------|---------|
| `LocalizedText` | `shared/domain/ValueObjects.kt` | Bilingual text (en/ar) |
| `LocalizedAddress` | `shared/domain/ValueObjects.kt` | Bilingual address |
| `Money` | `shared/domain/ValueObjects.kt` | Currency amounts |
| `Email` | `shared/domain/ValueObjects.kt` | Validated email |
| `PhoneNumber` | `shared/domain/ValueObjects.kt` | Validated phone |
| `TenantId` | `shared/domain/TenantContext.kt` | Tenant identifier |
| `OrganizationId` | `shared/domain/TenantContext.kt` | Organization identifier |

---

## Important Notes

1. **Always use LocalizedText** for user-facing strings
2. **Always add tenant filter** annotations to tenant-scoped entities
3. **Always create migrations** for schema changes
4. **Always validate inputs** in DTOs using Jakarta validation
5. **Keep domain logic in entities**, not in services
6. **Services orchestrate**, entities contain business rules