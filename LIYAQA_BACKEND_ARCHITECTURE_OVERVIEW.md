# Liyaqa Backend Architecture Overview

## Executive Summary

Liyaqa's backend is a **enterprise-grade, multi-tenant SaaS platform** built with Kotlin and Spring Boot 3.5.7. The architecture demonstrates sophisticated patterns for multi-tenancy, security-first design, comprehensive audit logging, and clean code organization. The codebase uses **feature-based architecture** rather than layer-based organization, with each feature module containing all necessary layers (domain, data, service, controller, dto).

**Key Characteristics:**
- Language: Kotlin (modern, concise, null-safe)
- Framework: Spring Boot 3.5.7
- JDK: 21
- Build Tool: Gradle Kotlin DSL
- Database: PostgreSQL with Liquibase migrations
- Session/Cache: Redis
- Security: JWT + Spring Security with fine-grained RBAC

---

## Project Structure

```
liyaqa-backend/
├── src/main/kotlin/com/liyaqa/backend/
│   ├── core/                          # Foundation: Base entities, multi-tenancy config
│   │   ├── config/                    # MultiTenancyConfig, security configurations
│   │   ├── context/                   # TenantContext (thread-local tenant isolation)
│   │   └── domain/base/               # BaseEntity (audit timestamps, tenantId)
│   │
│   ├── internal/                      # Internal Control Plane (Liyaqa Team)
│   │   ├── employee/                  # Internal employee management + RBAC
│   │   │   ├── domain/                # Employee, EmployeeGroup, Permission, PredefinedGroups
│   │   │   ├── service/               # EmployeeService (with audit trails)
│   │   │   ├── controller/            # REST API (/api/v1/internal/employees)
│   │   │   ├── data/                  # EmployeeRepository, EmployeeGroupRepository
│   │   │   └── dto/                   # Request/response DTOs with companion mappers
│   │   │
│   │   ├── tenant/                    # Tenant (customer) management
│   │   │   ├── domain/                # Tenant, TenantStatus, PlanTier, SubscriptionStatus
│   │   │   ├── service/               # TenantService
│   │   │   ├── controller/            # TenantController
│   │   │   ├── data/                  # TenantRepository
│   │   │   └── dto/                   # TenantCreateRequest, TenantResponse, etc.
│   │   │
│   │   ├── facility/                  # Facility management (internal control)
│   │   │   ├── domain/                # SportFacility, FacilityBranch, FacilityStatus
│   │   │   ├── service/               # FacilityService
│   │   │   ├── controller/            # FacilityController
│   │   │   ├── data/                  # SportFacilityRepository, FacilityBranchRepository
│   │   │   └── dto/                   # Facility DTOs
│   │   │
│   │   ├── auth/                      # Internal authentication
│   │   │   ├── controller/            # AuthenticationController, login/logout endpoints
│   │   │   ├── service/               # AuthenticationService, SessionService
│   │   │   ├── dto/                   # LoginRequest, AuthenticationResponse, etc.
│   │   │
│   │   ├── audit/                     # Comprehensive audit logging
│   │   │   ├── domain/                # AuditLog, AuditAction, EntityType, AuditLogBuilder
│   │   │   ├── service/               # AuditService (async batch writes)
│   │   │   ├── data/                  # AuditLogRepository
│   │   │   └── service/               # AuditAnalyticsService
│   │   │
│   │   ├── shared/                    # Cross-cutting concerns
│   │   │   ├── config/                # RedisConfig, EmailConfig, AsyncConfig
│   │   │   ├── security/              # JwtTokenProvider, SecurityConfig, RequirePermission annotation
│   │   │   ├── exception/             # Custom exceptions (EmployeeNotFoundException, etc.)
│   │   │   ├── util/                  # toResponse(), toBasicResponse() extension functions
│   │   │
│   │   └── controller/                # Shared internal controllers
│   │       └── AnalyticsController
│   │
│   ├── facility/                      # Tenant-Facing Features (Sports Facility Employees)
│   │   ├── employee/                  # Facility employee management (separate from internal)
│   │   │   ├── domain/                # FacilityEmployee, FacilityEmployeeGroup, FacilityPermission
│   │   │   ├── service/               # FacilityEmployeeService, FacilityEmployeeGroupService
│   │   │   ├── controller/            # FacilityEmployeeController
│   │   │   ├── repository/            # FacilityEmployeeRepository
│   │   │   └── dto/                   # FacilityEmployeeCreateRequest, etc.
│   │   │
│   │   ├── booking/                   # Court/facility booking system
│   │   │   ├── domain/                # Booking, Court, BookingStatus, PaymentStatus
│   │   │   ├── service/               # BookingService, CourtService, BookingEmailService
│   │   │   ├── controller/            # BookingController, CourtController
│   │   │   ├── data/                  # BookingRepository, CourtRepository
│   │   │   └── dto/                   # BookingCreateRequest, BookingResponse, etc.
│   │   │
│   │   ├── membership/                # Member + membership plan management
│   │   │   ├── domain/                # Member, Membership, MembershipPlan, Discount
│   │   │   ├── service/               # MemberService, MembershipService, DiscountService
│   │   │   ├── controller/            # MemberController, MembershipPlanController
│   │   │   ├── data/                  # MemberRepository, MembershipRepository, etc.
│   │   │   └── dto/                   # MemberDto, MembershipPlanDto, etc.
│   │   │
│   │   ├── trainer/                   # Personal trainer booking system
│   │   │   ├── domain/                # Trainer, TrainerAvailability, TrainerBooking, TrainerReview
│   │   │   ├── service/               # TrainerBookingService
│   │   │   ├── controller/            # MemberTrainerController
│   │   │   ├── data/                  # TrainerRepositories (all trainer-related repos)
│   │   │
│   │   ├── auth/                      # Member authentication
│   │   │   ├── controller/            # MemberAuthController, MemberProfileController
│   │   │   ├── service/               # MemberAuthenticationService, MemberAuthEmailService
│   │   │   └── dto/                   # Member auth DTOs
│   │   │
│   ├── api/                           # Public API (external integrations)
│   │   ├── domain/                    # ApiKey, ApiKeyStatus, ApiKeyEnvironment, ApiScopes
│   │   ├── security/                  # ApiKeyAuthenticationFilter
│   │   ├── service/                   # ApiKeyService (key generation, validation)
│   │   ├── data/                      # ApiKeyRepository
│   │   ├── v1/controller/             # PublicFacilityController, PublicBookingController
│   │   └── v1/dto/                    # Public API DTOs
│   │
│   ├── payment/                       # Payment processing
│   │   ├── domain/                    # PaymentTransaction
│   │   ├── service/                   # PaymentService
│   │   ├── controller/                # PaymentWebhookController
│   │   ├── data/                      # PaymentTransactionRepository
│   │   ├── gateway/                   # StripePaymentGateway, PaymentGateway interface
│   │   └── config/                    # PaymentConfig
│   │
│   ├── shared/                        # Cross-tenant shared features
│   │   ├── analytics/                 # Analytics and reporting
│   │   ├── notification/              # Multi-channel notifications
│   │   │   ├── domain/                # Notification, NotificationTemplate, NotificationPreference
│   │   │   ├── service/               # NotificationService
│   │   │   ├── service/channel/       # EmailChannelProvider, InAppChannelProvider, etc.
│   │   │   └── controller/            # NotificationController
│   │   │
│   │   └── config/                    # Shared application configurations
│
├── src/main/resources/
│   ├── application.yaml               # Spring Boot configuration (DB, Redis, JWT, etc.)
│   ├── db/changelog/
│   │   ├── db.changelog-master.xml    # Liquibase master changelog
│   │   └── *.xml                      # Individual migration changesets
│
├── build.gradle.kts                   # Gradle build configuration
├── settings.gradle.kts                # Gradle settings
├── docker-compose.yml                 # Local PostgreSQL + Redis
├── .gitignore                         # Git ignore rules
├── CLAUDE.md                          # Developer guidance for Claude AI
├── README.md                          # Project overview
├── CONFIGURATION.md                   # Configuration guide
├── FACILITY_MANAGEMENT.md             # Facility feature docs
├── TENANT_MANAGEMENT.md               # Tenant feature docs
└── HELP.md                            # Quick reference
```

---

## Architecture Patterns

### 1. Feature-Based Organization (NOT Layer-Based)

**Critical Design Principle:** Each feature module is self-contained with all layers.

```kotlin
// CORRECT: Feature-based (com/liyaqa/backend/facility/booking/)
feature/booking/
├── domain/       # Booking, Court entities
├── data/         # BookingRepository, CourtRepository
├── service/      # BookingService, CourtService
├── controller/   # BookingController, CourtController
└── dto/          # BookingCreateRequest, BookingResponse, etc.

// WRONG: Layer-based (avoid this!)
domain/booking/      # Don't organize like this
data/booking/
service/booking/
controller/booking/
```

**Benefits:**
- Easier to understand features (all code for a feature in one place)
- Simpler to onboard new developers
- Better separation of concerns
- Easier to extract features to microservices later

### 2. Multi-Tenancy with Row-Level Isolation

**Strategy:** Discriminator-based (DISCRIMINATOR in application.yaml)

```kotlin
// All entities extend BaseEntity
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

    @Version
    var version: Long = 0
}

// TenantContext manages tenant isolation throughout request lifecycle
object TenantContext {
    private val currentTenant = ThreadLocal<String>()

    fun setTenantId(tenantId: String) = currentTenant.set(tenantId)
    fun getTenantId(): String = currentTenant.get() ?: 
        throw IllegalStateException("No tenant context available")
    fun clear() = currentTenant.remove()
}
```

**Future Evolution Path:**
- Currently: Row-level isolation (DISCRIMINATOR)
- Future: Schema-per-tenant or Database-per-tenant for higher isolation

### 3. Domain-Driven Design

Each module has a clear domain layer with business logic embedded in entities:

```kotlin
@Entity
class Employee(
    var firstName: String,
    var lastName: String,
    var email: String,
    // ... other fields
    @ManyToMany(fetch = FetchType.EAGER)
    var groups: MutableSet<EmployeeGroup> = mutableSetOf()
) : BaseEntity() {
    
    // Business logic
    fun getFullName() = "$firstName $lastName"
    fun isAccountLocked() = lockedUntil?.isAfter(Instant.now()) ?: false
    fun getAllPermissions(): Set<Permission> = 
        groups.flatMap { it.permissions }.toSet()
    fun hasPermission(permission: Permission): Boolean =
        getAllPermissions().contains(permission)
}
```

**Benefits:**
- Business logic lives near data
- Rich domain models (not anemic)
- Easier to understand business requirements from code

### 4. DTO Mapping Pattern with Companion Objects

```kotlin
data class EmployeeResponse(
    val id: UUID,
    val firstName: String,
    val lastName: String,
    val fullName: String,
    val email: String,
    val groups: List<GroupResponse>,
    val permissions: Set<Permission>,
    // ... other fields
) {
    companion object {
        fun from(employee: Employee): EmployeeResponse {
            return EmployeeResponse(
                id = employee.id!!,
                firstName = employee.firstName,
                lastName = employee.lastName,
                fullName = employee.getFullName(),
                email = employee.email,
                groups = employee.groups.map { GroupResponse.from(it) },
                permissions = employee.getAllPermissions(),
                // ... other mappings
            )
        }
    }
}

// Also available as extension function
fun Employee.toResponse() = EmployeeResponse.from(this)
```

**Pattern Benefits:**
- Single responsibility: DTO knows how to create itself
- Testable: Easy to mock companion object
- Chainable: Works with streams and collections
- Clear: Type-safe companion object syntax

### 5. Service Layer with Comprehensive Audit

```kotlin
@Service
@Transactional
class EmployeeService(
    private val employeeRepository: EmployeeRepository,
    private val auditService: AuditService,
    private val emailService: EmailService
) {
    fun createEmployee(
        request: CreateEmployeeRequest,
        createdBy: Employee
    ): EmployeeResponse {
        // Validation
        if (employeeRepository.existsByEmail(request.email)) {
            throw EmployeeAlreadyExistsException(...)
        }

        // Business logic
        val employee = Employee(
            firstName = request.firstName,
            lastName = request.lastName,
            // ... other fields
            mustChangePassword = true // Force password change
        )

        val savedEmployee = employeeRepository.save(employee)

        // Notifications
        emailService.sendWelcomeEmail(
            savedEmployee.email,
            savedEmployee.getFullName(),
            temporaryPassword
        )

        // Audit (immutable record)
        auditService.logEmployeeCreated(
            employee = savedEmployee,
            createdBy = createdBy,
            initialGroups = employee.groups
        )

        return EmployeeResponse.from(savedEmployee)
    }
}
```

**Key Characteristics:**
- Single responsibility per service method
- All state changes audited
- Error handling with custom exceptions
- Transactional by default
- Dependencies injected

### 6. Repository Pattern with Rich Queries

```kotlin
@Repository
interface EmployeeRepository : JpaRepository<Employee, UUID> {
    // Basic queries
    fun findByEmail(email: String): Employee?
    fun existsByEmail(email: String): Boolean

    // Status-based queries
    fun findByStatus(status: EmployeeStatus): List<Employee>
    fun countByStatus(status: EmployeeStatus): Long

    // Security queries for threat detection
    @Query("""
        SELECT e FROM Employee e 
        WHERE e.failedLoginAttempts > :threshold 
        AND e.status = 'ACTIVE'
    """)
    fun findWithHighFailedAttempts(@Param("threshold") threshold: Int): List<Employee>

    // Permission-based queries
    @Query("""
        SELECT DISTINCT e FROM Employee e 
        JOIN e.groups g 
        JOIN g.permissions p 
        WHERE p = :permission
    """)
    fun findByPermission(@Param("permission") permission: Permission): List<Employee>

    // Complex search supporting admin UI
    @Query("""
        SELECT e FROM Employee e
        WHERE (:searchTerm IS NULL OR
               LOWER(e.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
               LOWER(e.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
               LOWER(e.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')))
        AND (:department IS NULL OR e.department = :department)
        AND (:status IS NULL OR e.status = :status)
        AND (:includeTerminated = true OR e.status != 'TERMINATED')
    """)
    fun searchEmployees(
        @Param("searchTerm") searchTerm: String?,
        @Param("department") department: String?,
        @Param("status") status: String?,
        @Param("includeTerminated") includeTerminated: Boolean,
        pageable: Pageable
    ): Page<Employee>
}
```

**Pattern Benefits:**
- Rich domain queries at database level
- JPQL for readability over Criteria API
- Pagination support built-in
- Security-aware queries
- Named parameters prevent SQL injection

### 7. Controller with Method-Level Security

```kotlin
@RestController
@RequestMapping("/api/v1/internal/employees")
@CrossOrigin(origins = ["http://localhost:3000"], allowCredentials = "true")
class EmployeeController(
    private val employeeService: EmployeeService
) {
    /**
     * Creates a new employee account.
     * Requires EMPLOYEE_CREATE permission.
     */
    @PostMapping
    @RequirePermission(Permission.EMPLOYEE_CREATE)
    @ResponseStatus(HttpStatus.CREATED)
    fun createEmployee(
        @Valid @RequestBody request: CreateEmployeeRequest,
        @CurrentEmployee currentEmployee: Employee
    ): EmployeeResponse {
        logger.info("Employee creation requested by ${currentEmployee.email}")
        return employeeService.createEmployee(request, currentEmployee)
    }

    /**
     * List employees with filtering and pagination.
     * Requires EMPLOYEE_VIEW permission.
     */
    @GetMapping
    @RequirePermission(Permission.EMPLOYEE_VIEW)
    fun getEmployees(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) department: String?,
        @RequestParam(required = false) status: String?,
        @RequestParam(defaultValue = "false") includeTerminated: Boolean,
        @PageableDefault(size = 20, sort = ["firstName", "lastName"], direction = Sort.Direction.ASC)
        pageable: Pageable,
        @CurrentEmployee currentEmployee: Employee
    ): Page<EmployeeResponse> {
        val filter = EmployeeSearchFilter(...)
        return employeeService.searchEmployees(filter, pageable, currentEmployee)
    }

    /**
     * Update employee.
     * Requires EMPLOYEE_UPDATE permission.
     */
    @PatchMapping("/{id}")
    @RequirePermission(Permission.EMPLOYEE_UPDATE)
    fun updateEmployee(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateEmployeeRequest,
        @CurrentEmployee currentEmployee: Employee
    ): EmployeeResponse {
        return employeeService.updateEmployee(id, request, currentEmployee)
    }
}
```

**Security Patterns:**
- @RequirePermission annotation for method-level security
- @CurrentEmployee for injecting authenticated user
- @Valid for automatic validation
- Proper HTTP status codes (201 for create)
- Pagination with sensible defaults

---

## Security Architecture

### 1. Authentication Layers

**Internal Team (JWT-Based):**
```
Request → JwtAuthenticationFilter → 
SecurityConfig → JwtTokenProvider → 
Employee entity with permissions → 
Method-level @RequirePermission checks
```

**Facility Employees (Separate Auth System):**
```
Request → Facility auth endpoints → 
FacilityAuthenticationService → 
FacilityEmployee entity → 
FacilityPermission checks
```

**Public API (Bearer Token):**
```
Request → ApiKeyAuthenticationFilter → 
ApiKeyService → 
ApiKey validation with scopes → 
Scope-based authorization
```

### 2. Permission Model (Internal)

```kotlin
enum class Permission {
    // Employee Management
    EMPLOYEE_VIEW, EMPLOYEE_CREATE, EMPLOYEE_UPDATE, EMPLOYEE_DELETE,
    
    // Tenant Management
    TENANT_VIEW, TENANT_CREATE, TENANT_UPDATE, TENANT_DELETE,
    
    // Facility Management
    FACILITY_VIEW, FACILITY_CREATE, FACILITY_UPDATE, FACILITY_DELETE,
    
    // Audit & Compliance
    AUDIT_VIEW_LOGS, AUDIT_EXPORT_REPORTS, AUDIT_DELETE_LOGS,
    
    // ... 40+ permissions total
}
```

**Group-Based Assignment:**
```kotlin
// Predefined groups (system-created)
Super Admin          // Full system access
Support Agent        // Customer support permissions
Support Manager      // Team management
Sales                // Deal creation
Finance              // Payment processing

// Groups contain permissions
@Entity
class EmployeeGroup(
    var name: String,
    var description: String?,
    @ManyToMany(fetch = FetchType.EAGER)
    var permissions: MutableSet<Permission> = mutableSetOf()
) : BaseEntity()

// Employees assigned to groups
@Entity
class Employee(...) : BaseEntity() {
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "employee_groups",
        joinColumns = [JoinColumn(name = "employee_id")],
        inverseJoinColumns = [JoinColumn(name = "group_id")]
    )
    var groups: MutableSet<EmployeeGroup> = mutableSetOf()
}
```

### 3. Security Configuration

```kotlin
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
class SecurityConfig(
    private val jwtTokenProvider: JwtTokenProvider,
    private val employeeRepository: EmployeeRepository
) {
    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .cors { it.configurationSource(corsConfigurationSource()) }
            .sessionManagement {
                it.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            }
            .exceptionHandling {
                it.authenticationEntryPoint(CustomAuthenticationEntryPoint())
            }
            .authorizeHttpRequests { authz ->
                authz
                    .requestMatchers("/api/v1/internal/auth/login", 
                                   "/api/v1/internal/auth/password-reset/*",
                                   "/actuator/health").permitAll()
                    .anyRequest().authenticated()
            }
            .addFilterBefore(
                JwtAuthenticationFilter(jwtTokenProvider, employeeRepository),
                UsernamePasswordAuthenticationFilter::class.java
            )
        return http.build()
    }
}
```

### 4. Account Lockout Protection

```kotlin
companion object {
    const val MAX_LOGIN_ATTEMPTS = 5
    const val LOCKOUT_DURATION_MINUTES = 30L
}

// In Employee entity
var failedLoginAttempts: Int = 0
var lockedUntil: Instant? = null

fun isAccountLocked(): Boolean =
    lockedUntil?.isAfter(Instant.now()) ?: false
```

---

## Audit & Compliance System

### 1. Immutable Audit Trail

**AuditLog Entity:**
```kotlin
@Entity
class AuditLog(
    var employeeId: UUID,                    // Who performed action
    var employeeEmail: String,
    @Enumerated(EnumType.STRING)
    var action: AuditAction,                 // CREATED, UPDATED, DELETED, etc.
    @Enumerated(EnumType.STRING)
    var entityType: EntityType,              // EMPLOYEE, TENANT, FACILITY, etc.
    var entityId: UUID,                      // Which resource affected
    var description: String?,
    var changesSerialized: String?,          // JSON diff of changes
    var ipAddress: String?,
    var userAgent: String?,
    @Enumerated(EnumType.STRING)
    var riskLevel: RiskLevel,                // CRITICAL, HIGH, MEDIUM, LOW
    @Enumerated(EnumType.STRING)
    var result: AuditResult,                 // SUCCESS, FAILURE, PARTIAL
    var metadata: String?                    // Additional context as JSON
) : BaseEntity() {
    // Immutable - no updates after creation
}
```

### 2. Async Batch Processing

```kotlin
@Service
class AuditService(
    private val auditLogRepository: AuditLogRepository,
    private val objectMapper: ObjectMapper,
    @Value("\${liyaqa.async.audit.batch-size:50}")
    private val batchSize: Int,
    @Value("\${liyaqa.async.audit.batch-timeout-ms:1000}")
    private val batchTimeoutMs: Long
) {
    // Batch write mechanism
    private val auditQueue = ConcurrentLinkedQueue<AuditLog>()
    private val queueSize = AtomicInteger(0)
    
    @Async("auditExecutor")
    fun enqueueAuditLog(audit: AuditLog) {
        auditQueue.offer(audit)
        if (queueSize.incrementAndGet() >= batchSize) {
            flushAuditLogs()
        }
    }

    @Scheduled(fixedDelayString = "\${liyaqa.async.audit.batch-timeout-ms:1000}")
    fun flushAuditLogs() {
        // Batch write to database
    }
}
```

**Performance Characteristics:**
- 1000-5000 logs/second in batch mode
- P99 latency < 5ms for async call
- Graceful degradation to sync write if queue fills
- Guaranteed at-least-once delivery

### 3. Audit Methods

```kotlin
// Creation events
auditService.logEmployeeCreated(employee, createdBy, initialGroups)
auditService.logTenantCreated(tenant, createdBy)

// Update events
auditService.logUpdate(employee, EntityType.EMPLOYEE, id, changes)

// Delete events
auditService.logDelete(employee, EntityType.FACILITY, id, metadata)

// Security events
auditService.logUnauthorizedAccess(employee, action, entityType)
auditService.logFailedLogin(email)
auditService.logAccountLocked(employee)
```

---

## Database Schema Patterns

### 1. Liquibase Migrations

```xml
<!-- src/main/resources/db/changelog/001-initial-schema.xml -->
<changeSet id="001-initial-schema" author="liyaqa">
    <createTable tableName="internal_employees">
        <column name="id" type="UUID" defaultValueComputed="gen_random_uuid()">
            <constraints primaryKey="true"/>
        </column>
        <column name="tenant_id" type="VARCHAR(255)">
            <constraints nullable="false"/>
        </column>
        <column name="first_name" type="VARCHAR(255)">
            <constraints nullable="false"/>
        </column>
        <!-- ... more columns -->
        <column name="created_at" type="TIMESTAMP">
            <constraints nullable="false"/>
        </column>
        <column name="updated_at" type="TIMESTAMP"/>
        <column name="version" type="BIGINT" defaultValue="0"/>
    </createTable>
    <createIndex indexName="idx_employee_email" tableName="internal_employees">
        <column name="email"/>
    </createIndex>
</changeSet>
```

### 2. Entity Conventions

All entities follow this pattern:

```kotlin
@Entity
@Table(name = "entity_name", indexes = [
    Index(name = "idx_entity_tenant", columnList = "tenant_id"),
    Index(name = "idx_entity_key", columnList = "key_field")
])
@EntityListeners(AuditingEntityListener::class)
class EntityName(
    @Column(nullable = false)
    var requiredField: String,
    
    @Column(nullable = true)
    var optionalField: String? = null,
    
    @Enumerated(EnumType.STRING)
    var statusField: Status = Status.ACTIVE,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    var parent: ParentEntity? = null
) : BaseEntity() {
    // Business methods
}
```

**Conventions:**
- All entities extend BaseEntity
- UUID primary keys auto-generated
- Foreign keys use LAZY loading
- Enums stored as strings
- All tables indexed by tenant_id

### 3. Recent Migrations

**Changeset 032:** Public API - ApiKey tables with scopes and rate limiting
**Changeset 033:** Personal Trainer Booking - 4 tables (trainers, availability, bookings, reviews)

---

## Configuration & Environment

### Application Properties

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5434}/${DB_NAME:liyaqa}
    username: ${DB_USERNAME:liyaqa}
    password: ${DB_PASSWORD:liyaqa_dev}
  jpa:
    hibernate:
      ddl-auto: validate  # Never auto-create schema
    open-in-view: false   # Prevent lazy loading issues

  liquibase:
    change-log: classpath:db/changelog/db.changelog-master.xml
    enabled: true

  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}

liyaqa:
  multitenancy:
    enabled: true
    strategy: DISCRIMINATOR

  security:
    jwt:
      secret: ${JWT_SECRET:change-this-in-production}
      expiration: 86400000  # 24 hours

  async:
    audit:
      core-pool-size: ${AUDIT_CORE_POOL_SIZE:5}
      max-pool-size: ${AUDIT_MAX_POOL_SIZE:10}
      queue-capacity: ${AUDIT_QUEUE_CAPACITY:1000}
      batch-size: ${AUDIT_BATCH_SIZE:50}
      batch-timeout-ms: ${AUDIT_BATCH_TIMEOUT_MS:1000}
```

### Environment Variables (.env)

```bash
# Database
DB_USERNAME=liyaqa
DB_PASSWORD=change_this_in_production
DB_HOST=localhost
DB_PORT=5434
DB_NAME=liyaqa

# Redis (session storage & token blacklist)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=change_this_in_production

# JWT
JWT_SECRET=CHANGE_THIS_TO_STRONG_RANDOM_SECRET_IN_PRODUCTION

# Email (transactional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
EMAIL_ENABLED=false
EMAIL_FROM=noreply@liyaqa.com

# Application
SPRING_PROFILES_ACTIVE=dev
APP_BASE_URL=http://localhost:8080
SESSION_TIMEOUT_HOURS=8

# Stripe Payment
STRIPE_API_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Audit
AUDIT_CORE_POOL_SIZE=5
AUDIT_MAX_POOL_SIZE=10
AUDIT_BATCH_SIZE=50
AUDIT_BATCH_TIMEOUT_MS=1000
```

---

## API Architecture

### REST Endpoint Patterns

**Internal Endpoints** (`/api/v1/internal/`):
- `/auth/login` - POST - Employee login
- `/auth/refresh` - POST - Refresh tokens
- `/auth/logout` - POST - Logout
- `/employees` - CRUD operations with permissions
- `/tenants` - Tenant management
- `/facilities` - Facility management
- `/system/init-status` - Check initialization

**Facility-Facing Endpoints** (`/api/v1/facility/`):
- `/bookings` - CRUD for court bookings
- `/courts` - Court management
- `/members` - Member management
- `/memberships` - Membership plan management
- `/trainers` - Personal trainer features
- `/employees` - Facility staff management

**Public API Endpoints** (`/api/v1/public/`):
- Bearer token authentication with API keys
- Rate limiting per key
- Scoped permissions (facilities:read, bookings:write, etc.)
- Webhook support

### Response DTO Structure

```kotlin
// Success response
data class ResourceResponse(
    val id: UUID,
    val name: String,
    val status: String,
    val createdAt: Instant,
    val updatedAt: Instant
)

// Error response
data class ErrorResponse(
    val error: String,
    val message: String,
    val timestamp: Instant,
    val path: String
)

// Paginated response
Page<ResourceResponse>  // Spring Data Page with pagination metadata
```

---

## Technology Stack Deep Dive

### Core Dependencies

```gradle
// Spring Boot
spring-boot-starter-web        # REST APIs
spring-boot-starter-data-jpa   # ORM + database access
spring-boot-starter-security   # Authentication & authorization
spring-boot-starter-validation # Input validation (Jakarta)
spring-boot-starter-actuator   # Monitoring & health checks

// Database & Migration
postgresql                      # PostgreSQL driver
liquibase-core                 # Schema versioning & migrations

// Redis
spring-boot-starter-data-redis # Distributed caching & sessions
lettuce-core                   # High-performance Redis client

// Authentication
jjwt                           # JWT token handling

// Development
spring-boot-devtools           # Hot reload
spring-boot-configuration-processor  # Configuration metadata

// Testing
spring-boot-starter-test       # JUnit 5, Mockito, AssertJ
testcontainers                 # Real PostgreSQL in tests
mockk                          # Kotlin-friendly mocking
```

### Build Tool: Gradle Kotlin DSL

```kotlin
plugins {
    id("org.springframework.boot") version "3.5.7"
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.spring") version "2.1.0"  // Spring compiler plugin
    kotlin("plugin.jpa") version "2.1.0"      // JPA compiler plugin
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    testImplementation("org.testcontainers:postgresql:1.20.5")
}
```

---

## Testing Strategy

### Test Approach

1. **Integration Tests with TestContainers**
   - Real PostgreSQL instance in container
   - Test actual database interactions
   - Verify migration scripts

2. **Mocking with MockK**
   - Kotlin-friendly mocking library
   - Mock external services (email, payment gateways)
   - Mock repositories in unit tests

3. **Security Testing**
   - @WithMockUser for testing secured endpoints
   - Permission verification tests
   - Multi-tenancy isolation tests

### Example Test Structure

```kotlin
@SpringBootTest
@Testcontainers
class EmployeeServiceIntegrationTest {
    
    @Container
    companion object {
        val postgres = PostgreSQLContainer<Nothing>(
            "postgres:15"
        ).apply {
            withDatabaseName("test_liyaqa")
            withUsername("test")
            withPassword("test")
        }
    }

    @Autowired
    private lateinit var employeeService: EmployeeService

    @Test
    fun `should create employee with audit`() {
        val request = CreateEmployeeRequest(...)
        val employee = createTestEmployee()
        
        val result = employeeService.createEmployee(request, employee)
        
        assertThat(result.email).isEqualTo(request.email)
        // Verify audit log created
    }
}
```

---

## Development Workflow & Git

### Git Flow

1. Create feature branch: `feature/description` from main
2. Make changes with tests
3. Ensure all tests pass: `./gradlew test`
4. Create comprehensive pull request with:
   - Feature description
   - Business context
   - Technical implementation details
   - Test coverage
5. Code review & approval
6. Merge to main

### Conventional Commits

```
feat: Add personal trainer booking system
fix: Resolve account lockout false positives
refactor: Restructure audit service for clarity
chore: Update dependencies
docs: Add API documentation
test: Add integration tests for booking conflicts
```

### Important Rules

- NEVER commit directly to main
- NEVER commit .env files
- All changes must compile before committing
- Use git mv when moving files (preserves history)
- Include Claude attribution in commits when using AI:
  ```
  🤖 Generated with Claude Code
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

---

## Critical Development Rules

**When building features, ALWAYS follow these rules:**

1. **Maintain Feature-Based Structure**
   - Each feature owns its domain, service, controller, dto
   - Don't reorganize into layers

2. **Security First Approach**
   - Check permissions in service layer (not just controllers)
   - Audit all state changes
   - Validate at DTO level with Jakarta annotations

3. **Multi-Tenancy Must Be Preserved**
   - All entities must extend BaseEntity (includes tenantId)
   - Always consider tenant isolation
   - Use TenantContext for thread-local tenant access

4. **Database Schema Changes Only via Liquibase**
   - Create XML changeset in db/changelog/
   - Reference in db.changelog-master.xml
   - Run ./gradlew update to apply

5. **Lazy Loading Default**
   - Use `@ManyToOne(fetch = FetchType.LAZY)` by default
   - Prevents N+1 query problems
   - Use explicit EAGER loading only when necessary

6. **Comprehensive Audit Logging**
   - EVERY state-changing operation must be logged
   - Use AuditService for consistency
   - Audit is compliance requirement, not optional

---

## Key Metrics & Performance

### System Performance Targets

- **API Response Time:** P95 < 200ms
- **Audit Throughput:** 1000-5000 logs/second
- **Database Connection Pool:** 10 max, 5 min idle
- **Redis Pool:** 8 max active, 2 min idle
- **Session Timeout:** 8 hours (configurable)

### Monitoring & Observability

```
GET /actuator/health                    # Health check
GET /actuator/metrics                   # Prometheus metrics
GET /actuator/metrics/{metric.name}     # Specific metric
```

---

## System Initialization

**First-Time Setup:**

1. Check initialization status: `GET /api/v1/internal/system/init-status`
2. Create system administrator: `POST /api/v1/internal/system/initialize`
3. System creates predefined groups automatically
4. System accounts marked with `isSystemAccount = true`

**Predefined Groups Created:**
- Super Admin
- Support Agent
- Support Manager
- Sales
- Finance

---

## Future Evolution Path

### Planned Features

1. **Schema-per-Tenant Option** - Higher isolation for tier 2+ customers
2. **Event Sourcing** - For complete audit trail beyond current logging
3. **CQRS Pattern** - For read-heavy analytics queries
4. **Microservices** - Extract payment, notification, analytics to separate services
5. **GraphQL Support** - Alternative to REST for complex queries

### Extensibility Points

- **Notification Channels:** Email, SMS, Push, In-App (channel provider pattern)
- **Payment Gateways:** Stripe, PayPal, etc. (PaymentGateway interface)
- **Report Generation:** Analytics service extensible
- **Custom Permissions:** Add facility-level permission system

---

## Summary: Key Takeaways for Frontend Replication

### Architectural Patterns to Replicate

1. **Feature-Based Organization**
   - Organize code by feature, not layer
   - Each feature self-contained with services, routes, components, hooks

2. **Multi-Tenancy Awareness**
   - Store tenantId with all resources
   - Manage tenant context throughout app
   - Enforce tenant isolation at data fetching

3. **Security-First Design**
   - Permission checks before showing features
   - Clear authentication flows
   - Audit log important actions

4. **Rich DTOs**
   - Strongly typed request/response objects
   - Companion object mappers (equivalent to factory functions)
   - Validation at entry point

5. **Clean Service Layer**
   - Business logic isolated from UI
   - Single responsibility per function
   - Error handling with custom exceptions

6. **Comprehensive Testing**
   - Integration tests with real data
   - Component testing for UI features
   - Security/permission testing

### Specific Patterns to Use in Frontend

1. **API Integration Layer**
   ```typescript
   // Mimic backend structure
   api/
   ├── internal/
   │   ├── employees.ts
   │   ├── tenants.ts
   │   └── facilities.ts
   ├── facility/
   │   ├── bookings.ts
   │   ├── members.ts
   │   └── trainers.ts
   └── public/
       └── public-api.ts
   ```

2. **DTO/Type Structure**
   ```typescript
   // Each domain has its types
   types/
   ├── employee.ts
   ├── tenant.ts
   ├── booking.ts
   └── trainer.ts
   ```

3. **Store/State Management**
   ```typescript
   // Feature-based Zustand/Redux
   store/
   ├── employee/
   │   ├── employeeSlice.ts
   │   └── hooks.ts
   ├── booking/
   │   ├── bookingSlice.ts
   │   └── hooks.ts
   ```

4. **Component Structure**
   ```typescript
   // Feature-based components
   components/
   ├── employee/
   │   ├── EmployeeList.tsx
   │   ├── EmployeeForm.tsx
   │   └── EmployeeDetail.tsx
   ├── booking/
   │   ├── BookingList.tsx
   │   └── BookingForm.tsx
   ```

5. **Permission System**
   ```typescript
   // Reuse backend Permission enum
   enum Permission {
     EMPLOYEE_VIEW,
     EMPLOYEE_CREATE,
     // ... mirror backend
   }
   
   // Permission checking utility
   const canCreate = usePermission(Permission.EMPLOYEE_CREATE)
   const canView = usePermission(Permission.EMPLOYEE_VIEW)
   ```

6. **Error Handling**
   ```typescript
   // Custom error types mirroring backend
   class EmployeeNotFoundException extends Error {}
   class UnauthorizedException extends Error {}
   class ValidationException extends Error {}
   ```

---

This architecture represents a mature, production-ready backend with enterprise considerations for security, compliance, and scalability. The patterns here should serve as your template for the frontend application.
