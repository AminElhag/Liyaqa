# Liyaqa Architecture - Quick Reference

## Key Takeaway: Feature-Based Organization

```
Each feature is SELF-CONTAINED with all layers:
✓ domain/     - Entities with business logic
✓ data/       - Repositories with rich queries
✓ service/    - Business logic with audit
✓ controller/ - REST endpoints with permission checks
✓ dto/        - Request/response objects with mappers
```

## Backend Module Structure

```
liyaqa-backend/
├── core/                    # Foundation
├── internal/                # Internal control plane
│   ├── employee/           # Employee CRUD + RBAC
│   ├── tenant/             # Customer organizations
│   ├── facility/           # Sport facilities (internal)
│   ├── auth/               # Internal login/JWT
│   ├── audit/              # Comprehensive audit trail
│   └── shared/             # Config, security, exceptions
├── facility/                # Tenant-facing features
│   ├── employee/           # Facility staff
│   ├── booking/            # Court bookings
│   ├── membership/         # Members & plans
│   ├── trainer/            # Trainer booking system
│   └── auth/               # Member login
├── api/                     # Public API (API keys)
├── payment/                 # Stripe integration
└── shared/                  # Notifications, analytics
```

## Stack

- **Language:** Kotlin
- **Framework:** Spring Boot 3.5.7
- **DB:** PostgreSQL (with Liquibase)
- **Cache:** Redis (sessions + token blacklist)
- **Security:** JWT + Spring Security
- **Build:** Gradle Kotlin DSL

## 7 Critical Architecture Patterns

### 1. Feature-Based (Not Layer-Based)

```kotlin
// RIGHT: Feature is self-contained
facility/booking/
├── domain/Booking.kt
├── data/BookingRepository.kt
├── service/BookingService.kt
├── controller/BookingController.kt
└── dto/BookingDto.kt

// WRONG: Organizing by layer
domain/booking/
service/booking/
controller/booking/
```

### 2. DTO Mappers with Companion Objects

```kotlin
data class EmployeeResponse(...) {
    companion object {
        fun from(employee: Employee): EmployeeResponse = ...
    }
}

// Usage
val response = EmployeeResponse.from(employee)
val list = employees.map { EmployeeResponse.from(it) }
```

### 3. Rich Domain Models

```kotlin
@Entity
class Employee(...) : BaseEntity() {
    fun getFullName() = "$firstName $lastName"
    fun isAccountLocked() = lockedUntil?.isAfter(Instant.now()) ?: false
    fun hasPermission(permission: Permission) = 
        groups.flatMap { it.permissions }.contains(permission)
}
```

### 4. Service Layer with Audit

```kotlin
@Service
@Transactional
class EmployeeService(...) {
    fun createEmployee(request: CreateEmployeeRequest, creator: Employee): EmployeeResponse {
        // Validate
        // Create
        val saved = employeeRepository.save(employee)
        // Notify
        emailService.sendWelcomeEmail(...)
        // Audit
        auditService.logEmployeeCreated(saved, creator, ...)
        // Return
        return EmployeeResponse.from(saved)
    }
}
```

### 5. Controllers with Permission Checks

```kotlin
@RestController
@RequestMapping("/api/v1/internal/employees")
class EmployeeController(private val employeeService: EmployeeService) {
    @PostMapping
    @RequirePermission(Permission.EMPLOYEE_CREATE)
    @ResponseStatus(HttpStatus.CREATED)
    fun createEmployee(
        @Valid @RequestBody request: CreateEmployeeRequest,
        @CurrentEmployee currentEmployee: Employee
    ): EmployeeResponse = employeeService.createEmployee(request, currentEmployee)
}
```

### 6. Multi-Tenancy with BaseEntity

```kotlin
@MappedSuperclass
abstract class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null

    @Column(name = "tenant_id", nullable = false)
    open var tenantId: String = ""

    @CreatedDate
    var createdAt: Instant = Instant.now()

    @LastModifiedDate
    var updatedAt: Instant = Instant.now()
}

// All entities extend BaseEntity
@Entity
class Booking(...) : BaseEntity()
```

### 7. Async Audit Service

```kotlin
@Service
class AuditService(...) {
    @Async("auditExecutor")
    fun enqueueAuditLog(audit: AuditLog) {
        auditQueue.offer(audit)
        if (queueSize.incrementAndGet() >= batchSize) {
            flushAuditLogs()  // Batch write to DB
        }
    }
    
    // Performance: 1000-5000 logs/sec, P99 < 5ms latency
}
```

## Security Model

**Three Authentication Layers:**

1. **Internal (JWT)**
   - Employee login → JWT token
   - Header: `Authorization: Bearer eyJhbGc...`
   - 40+ permissions in groups

2. **Facility (Separate Auth)**
   - FacilityEmployee login
   - FacilityPermission enum
   - Scoped to facility

3. **Public API (API Key)**
   - Header: `Authorization: Bearer lyk_live_xxxxx`
   - BCrypt hashed keys
   - Scoped permissions

**Permission Examples:**
```kotlin
enum class Permission {
    EMPLOYEE_VIEW, EMPLOYEE_CREATE, EMPLOYEE_UPDATE, EMPLOYEE_DELETE,
    TENANT_VIEW, TENANT_CREATE, TENANT_UPDATE, TENANT_DELETE,
    FACILITY_VIEW, FACILITY_CREATE, FACILITY_UPDATE, FACILITY_DELETE,
    AUDIT_VIEW_LOGS, AUDIT_EXPORT_REPORTS,
    // ... 40+ total
}
```

**Groups:**
- Super Admin (all permissions)
- Support Agent
- Support Manager
- Sales
- Finance

## REST Endpoints

**Pattern:** `/api/v1/{module}/{resource}`

**Internal:** `/api/v1/internal/`
- POST /auth/login
- POST /auth/refresh
- GET /employees, POST /employees, PATCH /employees/{id}
- GET /tenants, POST /tenants
- GET /facilities, POST /facilities

**Facility:** `/api/v1/facility/`
- GET /bookings, POST /bookings
- GET /courts, POST /courts
- GET /members, POST /members
- GET /memberships
- GET /trainers, POST /trainers/{id}/book

**Public API:** `/api/v1/public/`
- Requires API key with scopes
- Rate limited

## Database Conventions

**Migrations (Liquibase):**
```bash
# Create migration
src/main/resources/db/changelog/034-your-feature.xml

# Apply migration
./gradlew update
```

**Entity Conventions:**
```kotlin
@Entity
@Table(name = "feature_name", indexes = [
    Index(name = "idx_tenant", columnList = "tenant_id"),
    Index(name = "idx_status", columnList = "status")
])
@EntityListeners(AuditingEntityListener::class)
class Feature(...) : BaseEntity() {
    @Column(nullable = false)
    var requiredField: String

    @ManyToOne(fetch = FetchType.LAZY)
    var parent: Parent? = null
}
```

**Key Rules:**
- All extend BaseEntity
- LAZY loading by default
- Enums as strings
- UUID primary keys
- Indexes on tenant_id, foreign keys, frequently queried columns

## Configuration

**Environment Variables (.env):**
```bash
# Database
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=liyaqa
DB_PASSWORD=change_in_production

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=change_in_production

# Security
JWT_SECRET=CHANGE_THIS_TO_64_CHAR_RANDOM_STRING

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=app-password

# Application
SPRING_PROFILES_ACTIVE=dev
APP_BASE_URL=http://localhost:8080
SESSION_TIMEOUT_HOURS=8

# Stripe
STRIPE_API_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Audit
AUDIT_BATCH_SIZE=50
AUDIT_BATCH_TIMEOUT_MS=1000
```

## Development Workflow

**Setup:**
```bash
cd liyaqa-backend
docker-compose up -d              # PostgreSQL + Redis
./gradlew update                  # Liquibase migrations
./gradlew bootRun                 # Start server
# http://localhost:8080
```

**Build:**
```bash
./gradlew build                   # Compile
./gradlew test                    # Run tests
./gradlew bootRun                 # Run server
```

**Git Workflow:**
```bash
git checkout -b feature/description
# Make changes
git add .
git commit -m "feat: Add new feature"
git push origin feature/description
# Create PR on GitHub
```

## Frontend Patterns to Replicate

**1. Feature-Based Directory:**
```typescript
features/
├── employees/
│   ├── api/employeeApi.ts
│   ├── components/
│   ├── hooks/useEmployees.ts
│   ├── store/employeeSlice.ts
│   ├── types/index.ts
│   └── utils/employeeMapper.ts
├── tenants/
├── bookings/
└── trainers/
```

**2. Types Mirror Backend:**
```typescript
export enum EmployeeStatus { ACTIVE, INACTIVE, ... }
export interface EmployeeResponse { ... }
export interface CreateEmployeeRequest { ... }
export const mapEmployeeResponse = (r) => ({ ...r, fullName: ... })
```

**3. API Layer:**
```typescript
export const employeeApi = {
    async listEmployees(params) { ... },
    async createEmployee(request) { ... },
    async updateEmployee(id, request) { ... },
    async deleteEmployee(id) { ... }
}
```

**4. State Management (Zustand):**
```typescript
export const useEmployeeStore = create((set) => ({
    employees: [],
    loading: false,
    error: null,
    fetchEmployees: async (params) => { ... },
    createEmployee: async (request) => { ... }
}))
```

**5. Custom Hooks:**
```typescript
export const useEmployees = (params) => {
    const store = useEmployeeStore()
    const canView = usePermission(Permission.EMPLOYEE_VIEW)
    useEffect(() => {
        if (canView) store.fetchEmployees(params)
    }, [canView])
    return { employees: store.employees, ... }
}
```

**6. Permission Guards:**
```typescript
<PermissionGuard permission={Permission.EMPLOYEE_CREATE}>
    <CreateButton />
</PermissionGuard>
```

## Recent Features (PRs #16, #17)

**PR #16: Public API v1**
- ApiKey entity with hashing and scopes
- ApiKeyAuthenticationFilter for Bearer token auth
- Scope-based permissions
- Rate limiting (per hour, per day)
- TEST and LIVE environments

**PR #17: Personal Trainer Booking System**
- Trainer entity with certifications, languages, pricing
- TrainerAvailability (recurring + one-time)
- TrainerBooking with status flow
- TrainerReview with moderation
- Conflict detection, dynamic pricing

## Critical Rules

1. **Feature ownership** - Keep feature self-contained
2. **Service layer permissions** - Check before business logic
3. **Audit everything** - Every state change logged
4. **Preserve multi-tenancy** - All queries filtered by tenant_id
5. **Use Liquibase** - Never modify schema directly
6. **Lazy loading** - Default for relationships
7. **Never commit to main** - Always feature branches

## Documentation Files

- **LIYAQA_BACKEND_ARCHITECTURE_OVERVIEW.md** - Complete backend analysis
- **FRONTEND_ARCHITECTURE_PATTERNS.md** - Frontend implementation guide
- **EXPLORATION_SUMMARY.md** - This exploration's summary
- **QUICK_REFERENCE.md** - This file

## Useful Links

- Backend: /Users/waraiotoko/Liyaqa/liyaqa-backend
- CLAUDE.md: Developer guidance
- README.md: Project overview
- FACILITY_MANAGEMENT.md: Facility features
- TENANT_MANAGEMENT.md: Tenant features
