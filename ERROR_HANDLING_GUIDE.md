# Error Handling Guide

Complete documentation of error handling, logging, monitoring, and alerting strategies in the Liyaqa backend.

**Last Updated:** 2026-02-04
**Backend Version:** Spring Boot 3.4.1 | Kotlin 2.2.0

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Global Exception Handling](#global-exception-handling)
3. [Custom Exceptions](#custom-exceptions)
4. [Error Response Structures](#error-response-structures)
5. [Logging Strategy](#logging-strategy)
6. [Monitoring & Metrics](#monitoring--metrics)
7. [Alerting & Notifications](#alerting--notifications)
8. [Distributed Tracing](#distributed-tracing)
9. [Resilience Patterns](#resilience-patterns)
10. [Best Practices](#best-practices)

---

## Architecture Overview

The Liyaqa backend implements a multi-layered error handling strategy:

```
┌─────────────────────────────────────────────────────────────┐
│ HTTP Request                                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │ Security Filters        │
         │ - JWT Authentication    │
         │ - CSRF Validation       │
         │ - Rate Limiting         │
         └──────────┬──────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ Request Logging Filter  │
         │ - MDC Context Setup     │
         │ - Request ID Generation │
         └──────────┬──────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ Controllers             │
         │ - Input Validation      │
         │ - Method-level Security │
         └──────────┬──────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ Services                │
         │ - Business Logic        │
         │ - Exception Throwing    │
         └──────────┬──────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ Global Exception Handler│
         │ - @RestControllerAdvice │
         │ - Bilingual Responses   │
         └──────────┬──────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ Structured Logging      │
         │ - JSON (prod)           │
         │ - Human-readable (dev)  │
         └──────────┬──────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ Monitoring & Metrics    │
         │ - Prometheus            │
         │ - Zipkin Tracing        │
         │ - Custom Metrics        │
         └─────────────────────────┘
```

---

## Global Exception Handling

### @RestControllerAdvice Handler

**Location:** `backend/src/main/kotlin/com/liyaqa/config/GlobalExceptionHandler.kt`

The `GlobalExceptionHandler` provides centralized exception handling with bilingual (English/Arabic) error responses.

#### Supported Exception Types

| Exception Type | HTTP Status | Handler Method | Use Case |
|----------------|-------------|----------------|----------|
| `NoSuchElementException` | 404 NOT_FOUND | `handleNotFound()` | Resource not found (member, subscription, etc.) |
| `IllegalArgumentException` | 400 BAD_REQUEST | `handleBadRequest()` | Invalid input, business rule violations |
| `IllegalStateException` | 409 CONFLICT | `handleConflict()` | State-based operation conflicts |
| `AccessDeniedException` | 403 FORBIDDEN | `handleAccessDenied()` | Authorization failures |
| `DuplicateFieldException` | 409 CONFLICT | `handleDuplicateField()` | Unique constraint violations |
| `DuplicateAgreementException` | 409 CONFLICT | `handleDuplicateAgreement()` | Duplicate agreement titles |
| `MethodArgumentNotValidException` | 400 BAD_REQUEST | `handleValidationErrors()` | Jakarta Bean Validation failures |
| `HttpMessageNotReadableException` | 400 BAD_REQUEST | `handleHttpMessageNotReadable()` | JSON parsing errors |
| `Exception` (catch-all) | 500 INTERNAL_SERVER_ERROR | `handleGenericException()` | Unexpected errors |

#### Example: Resource Not Found

```kotlin
// Service layer throws exception
fun getMember(id: UUID): Member {
    return memberRepository.findById(id)
        .orElseThrow { NoSuchElementException("Member not found: $id") }
}

// Global handler catches and converts to response
@ExceptionHandler(NoSuchElementException::class)
fun handleNotFound(ex: NoSuchElementException, request: HttpServletRequest): ResponseEntity<LocalizedErrorResponse> {
    logger.debug("Resource not found: ${ex.message}")
    return ResponseEntity
        .status(HttpStatus.NOT_FOUND)
        .body(
            LocalizedErrorResponse(
                status = 404,
                error = "Not Found",
                errorAr = "غير موجود",
                message = ex.message ?: "Resource not found",
                messageAr = translateNotFoundMessage(ex.message),
                timestamp = Instant.now(),
                path = request.requestURI
            )
        )
}
```

**Response Example:**
```json
{
  "status": 404,
  "error": "Not Found",
  "errorAr": "غير موجود",
  "message": "Member not found: 123e4567-e89b-12d3-a456-426614174000",
  "messageAr": "العضو غير موجود",
  "timestamp": "2026-02-04T10:15:30.123Z",
  "path": "/api/members/123e4567-e89b-12d3-a456-426614174000"
}
```

#### Example: Business Rule Validation

```kotlin
// Service validates business rules
fun checkIn(command: CheckInCommand): AttendanceRecord {
    val member = memberRepository.findById(command.memberId)
        .orElseThrow { NoSuchElementException("Member not found: ${command.memberId}") }

    // Business rule validation
    if (member.status != MemberStatus.ACTIVE) {
        throw IllegalStateException("Member is not active: ${command.memberId}")
    }

    if (attendanceRepository.existsActiveCheckIn(command.memberId)) {
        throw IllegalStateException("Member is already checked in")
    }

    // ... proceed with check-in
}
```

**Response Example (409 Conflict):**
```json
{
  "status": 409,
  "error": "Conflict",
  "errorAr": "تعارض",
  "message": "Member is already checked in",
  "messageAr": "تم تسجيل الحضور بالفعل",
  "timestamp": "2026-02-04T10:15:30.123Z",
  "path": "/api/attendance/check-in"
}
```

#### Example: Validation Errors

```kotlin
// DTO with validation annotations
data class CreateMemberRequest(
    @field:NotBlank(message = "Email must not be blank")
    @field:Email(message = "Email must be a valid email address")
    val email: String,

    @field:NotBlank(message = "First name must not be blank")
    @field:Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    val firstName: String,

    @field:Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Phone must be a valid phone number")
    val phone: String?
)

// Controller validates automatically
@PostMapping
fun createMember(@Valid @RequestBody request: CreateMemberRequest): MemberDto {
    // Validation happens automatically via @Valid
    return memberService.createMember(request)
}
```

**Response Example (Validation Failure):**
```json
{
  "status": 400,
  "error": "Validation Failed",
  "errorAr": "فشل التحقق",
  "message": "One or more fields have validation errors",
  "messageAr": "يوجد أخطاء في التحقق من حقل واحد أو أكثر",
  "errors": {
    "email": {
      "message": "Email must be a valid email address",
      "messageAr": "البريد الإلكتروني يجب أن يكون بريد إلكتروني صالح"
    },
    "firstName": {
      "message": "First name must not be blank",
      "messageAr": "الاسم الأول لا يمكن أن يكون فارغاً"
    }
  },
  "timestamp": "2026-02-04T10:15:30.123Z",
  "path": "/api/members"
}
```

---

## Custom Exceptions

### DuplicateFieldException

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/exception/DuplicateFieldException.kt`

Used for unique constraint violations on member fields.

```kotlin
class DuplicateFieldException(
    val field: DuplicateField,
    message: String
) : RuntimeException(message)

enum class DuplicateField(
    val fieldName: String,
    val displayName: String,
    val displayNameAr: String
) {
    EMAIL("email", "Email", "البريد الإلكتروني"),
    PHONE("phone", "Phone number", "رقم الهاتف"),
    NATIONAL_ID("nationalId", "National ID", "رقم الهوية الوطنية")
}
```

**Usage Example:**
```kotlin
fun createMember(command: CreateMemberCommand): Member {
    // Check for duplicate email
    if (memberRepository.existsByEmail(command.email)) {
        throw DuplicateFieldException(
            DuplicateField.EMAIL,
            "A member with this email already exists: ${command.email}"
        )
    }

    // ... create member
}
```

**Response Example:**
```json
{
  "status": 409,
  "error": "Conflict",
  "errorAr": "تعارض",
  "field": "email",
  "fieldDisplayName": "Email",
  "fieldDisplayNameAr": "البريد الإلكتروني",
  "message": "A member with this email already exists: john@example.com",
  "messageAr": "يوجد عضو بهذا البريد الإلكتروني بالفعل",
  "timestamp": "2026-02-04T10:15:30.123Z",
  "path": "/api/members"
}
```

### DuplicateAgreementException

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/exception/DuplicateAgreementException.kt`

Used when creating agreements with duplicate title/type combinations.

```kotlin
class DuplicateAgreementException(message: String) : RuntimeException(message)
```

**Usage Example:**
```kotlin
fun createAgreement(command: CreateAgreementCommand): Agreement {
    val existing = agreementRepository.findByTitleAndType(
        command.title.en,
        command.type
    )

    if (existing != null) {
        throw DuplicateAgreementException(
            "An agreement with the same title and type already exists"
        )
    }

    // ... create agreement
}
```

---

## Error Response Structures

### LocalizedErrorResponse

Standard error response with bilingual support.

```kotlin
data class LocalizedErrorResponse(
    val status: Int,              // HTTP status code
    val error: String,            // Error category (English)
    val errorAr: String,          // Error category (Arabic)
    val message: String,          // Detailed message (English)
    val messageAr: String,        // Detailed message (Arabic)
    val timestamp: Instant,       // Error timestamp (ISO-8601)
    val path: String? = null      // Request path
)
```

### LocalizedValidationErrorResponse

Used for validation errors with per-field messages.

```kotlin
data class LocalizedValidationErrorResponse(
    val status: Int,
    val error: String,
    val errorAr: String,
    val message: String,
    val messageAr: String,
    val errors: Map<String, LocalizedFieldError>,  // Field-level errors
    val timestamp: Instant,
    val path: String? = null
)

data class LocalizedFieldError(
    val message: String,      // English error message
    val messageAr: String     // Arabic error message
)
```

### DuplicateFieldErrorResponse

Specialized response for unique constraint violations.

```kotlin
data class DuplicateFieldErrorResponse(
    val status: Int,
    val error: String,
    val errorAr: String,
    val field: String,                  // Field name (e.g., "email")
    val fieldDisplayName: String,       // Display name (English)
    val fieldDisplayNameAr: String,     // Display name (Arabic)
    val message: String,
    val messageAr: String,
    val timestamp: Instant,
    val path: String? = null
)
```

### Translation Strategy

The GlobalExceptionHandler includes translation helpers for common scenarios:

- `translateNotFoundMessage()` - Maps "Member not found" → "العضو غير موجود"
- `translateBadRequestMessage()` - Business rule violations
- `translateConflictMessage()` - State-based conflicts
- `translateValidationMessage()` - Field validation errors
- `translateFieldName()` - Field names (email → البريد الإلكتروني)

---

## Logging Strategy

### Configuration Files

1. **logback-spring.xml** - Main logging configuration
2. **application.yml** - Log levels per profile

### Log Formats

#### Development (Human-Readable)

**Profile:** `dev`, `test`, `local`

```
2026-02-04 10:15:30.123 INFO  [http-nio-8080] c.l.m.a.s.MemberService : Creating new member: john@example.com
2026-02-04 10:15:30.456 DEBUG [http-nio-8080] o.h.SQL :
    insert into members (id, email, first_name, ...) values (?, ?, ?, ...)
2026-02-04 10:15:30.789 ERROR [http-nio-8080] c.l.config.GlobalExceptionHandler : Unexpected error: Database connection failed
```

**Appenders:** `HUMAN_CONSOLE`, `ASYNC_FILE`
**File Location:** `logs/liyaqa.log`
**Rotation:** Daily with 30-day retention, 10GB total cap

#### Production (JSON)

**Profile:** `prod`, `staging`

```json
{
  "timestamp": "2026-02-04T10:15:30.123Z",
  "level": "INFO",
  "thread": "http-nio-8080-exec-1",
  "logger": "com.liyaqa.membership.application.services.MemberService",
  "message": "Creating new member: john@example.com",
  "service": "liyaqa-backend",
  "environment": "production",
  "traceId": "abc123def456",
  "spanId": "789ghi012jkl",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "requestId": "req-xyz789"
}
```

**Appender:** `ASYNC_JSON_CONSOLE`
**Format:** Logstash JSON encoder
**Output:** stdout (for container log collection)

### MDC (Mapped Diagnostic Context)

Thread-local context variables automatically included in logs:

| MDC Key | Source | Description |
|---------|--------|-------------|
| `requestId` | Generated | Unique identifier per HTTP request |
| `traceId` | Zipkin | Distributed trace identifier |
| `spanId` | Zipkin | Span within trace |
| `tenantId` | X-Tenant-ID header | Current tenant context |
| `userId` | JWT authentication | Authenticated user ID |
| `username` | JWT authentication | Authenticated username |

**Setup Location:** `backend/src/main/kotlin/com/liyaqa/config/RequestLoggingFilter.kt`

```kotlin
@Component
class RequestLoggingFilter : OncePerRequestFilter() {
    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, chain: FilterChain) {
        val requestId = UUID.randomUUID().toString()
        MDC.put("requestId", requestId)

        try {
            // Extract tenant from header
            val tenantId = request.getHeader("X-Tenant-ID")
            if (tenantId != null) {
                MDC.put("tenantId", tenantId)
            }

            // Extract user from authentication
            val auth = SecurityContextHolder.getContext().authentication
            if (auth != null && auth.isAuthenticated) {
                MDC.put("userId", auth.principal.toString())
                MDC.put("username", auth.name)
            }

            val startTime = System.currentTimeMillis()
            chain.doFilter(request, response)
            val duration = System.currentTimeMillis() - startTime

            // Log request completion
            val statusCode = response.status
            when {
                statusCode >= 500 -> logger.error("Request failed: {} {} - Status: {} - Duration: {}ms",
                    request.method, request.requestURI, statusCode, duration)
                statusCode >= 400 -> logger.warn("Request warning: {} {} - Status: {} - Duration: {}ms",
                    request.method, request.requestURI, statusCode, duration)
                duration > 2000 -> logger.warn("Slow request: {} {} - Duration: {}ms",
                    request.method, request.requestURI, duration)
                else -> logger.info("Request completed: {} {} - Status: {} - Duration: {}ms",
                    request.method, request.requestURI, statusCode, duration)
            }
        } finally {
            MDC.clear()
        }
    }
}
```

### Log Levels by Component

#### Development (`dev` profile)

```yaml
logging:
  level:
    root: INFO
    com.liyaqa: DEBUG
    org.springframework.web: INFO
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

#### Production (`prod` profile)

```yaml
logging:
  level:
    root: WARN
    com.liyaqa: INFO
    org.hibernate.SQL: WARN
```

### Logging Best Practices

```kotlin
@Service
class MemberService {
    private val logger = LoggerFactory.getLogger(MemberService::class.java)

    fun createMember(command: CreateMemberCommand): Member {
        // DEBUG: Detailed debugging information
        logger.debug("Creating member with email: ${command.email}")

        try {
            val member = Member(...)
            val saved = memberRepository.save(member)

            // INFO: Significant business events
            logger.info("Member created successfully: ${saved.id}")

            return saved
        } catch (e: DuplicateFieldException) {
            // DEBUG: Expected business exceptions (handled by global handler)
            logger.debug("Duplicate member email: ${command.email}")
            throw e
        } catch (e: Exception) {
            // ERROR: Unexpected errors with full stack trace
            logger.error("Failed to create member: ${e.message}", e)
            throw e
        }
    }
}
```

**Log Level Guidelines:**

- **TRACE:** SQL parameter bindings (dev only)
- **DEBUG:** Method entry/exit, business logic details, expected exceptions
- **INFO:** Significant business events (member created, payment processed)
- **WARN:** Degraded functionality, slow requests, handled errors
- **ERROR:** Unexpected errors requiring attention

---

## Monitoring & Metrics

### Spring Boot Actuator

**Exposed Endpoints:**
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when_authorized
```

**Available Endpoints:**

| Endpoint | Purpose | Access |
|----------|---------|--------|
| `/actuator/health` | Application health status | Public |
| `/actuator/health/liveness` | Kubernetes liveness probe | Public |
| `/actuator/health/readiness` | Kubernetes readiness probe | Public |
| `/actuator/info` | Application info (version, git) | Public |
| `/actuator/metrics` | Available metrics list | Public |
| `/actuator/metrics/{metric}` | Specific metric value | Public |
| `/actuator/prometheus` | Prometheus scrape endpoint | Public |

### Custom Health Checks

#### Basic Health Endpoint

**Location:** `backend/src/main/kotlin/com/liyaqa/config/HealthController.kt`

```kotlin
@GetMapping("/api/health")
fun health(): Map<String, Any> {
    return mapOf(
        "status" to "UP",
        "timestamp" to Instant.now(),
        "service" to "liyaqa-backend",
        "version" to "0.0.1-SNAPSHOT"
    )
}
```

#### Platform Health Monitoring

**Location:** `backend/src/main/kotlin/com/liyaqa/platform/api/PlatformHealthController.kt`

Tracks tenant/organization health scores based on:
- Usage metrics (attendance, bookings)
- Engagement (active users, feature adoption)
- Payment health (on-time payments, failed transactions)
- Support interactions (ticket volume, resolution time)

**Endpoints:**
- `GET /api/platform/health/overview` - All tenants summary
- `GET /api/platform/health/at-risk` - Score < 60
- `GET /api/platform/health/{organizationId}` - Specific tenant health
- `GET /api/platform/health/{organizationId}/history` - Historical trend

### Prometheus Metrics

**Configuration:**
```yaml
management:
  metrics:
    export:
      prometheus:
        enabled: true
    tags:
      application: liyaqa-backend
      environment: ${ENVIRONMENT:dev}
```

#### Business Metrics

**Location:** `backend/src/main/kotlin/com/liyaqa/observability/BusinessMetricsService.kt`

```kotlin
@Service
class BusinessMetricsService(private val meterRegistry: MeterRegistry) {

    // Member registration
    fun recordMemberRegistration(tenantId: UUID, membershipType: String) {
        Counter.builder("liyaqa.business.members.registered")
            .tag("tenant_id", tenantId.toString())
            .tag("membership_type", membershipType)
            .register(meterRegistry)
            .increment()
    }

    // Payment tracking
    fun recordPaymentSuccess(tenantId: UUID, amount: BigDecimal, method: String) {
        Counter.builder("liyaqa.business.payments.success")
            .tag("tenant_id", tenantId.toString())
            .tag("payment_method", method)
            .tag("invoice_type", "subscription")
            .register(meterRegistry)
            .increment()

        Counter.builder("liyaqa.business.revenue.total")
            .tag("tenant_id", tenantId.toString())
            .tag("currency", "SAR")
            .register(meterRegistry)
            .increment(amount.toDouble())
    }

    // Class utilization
    fun recordClassCapacityUtilization(tenantId: UUID, utilizationPercent: Double) {
        DistributionSummary.builder("liyaqa.business.classes.capacity.utilization")
            .tag("tenant_id", tenantId.toString())
            .register(meterRegistry)
            .record(utilizationPercent)
    }
}
```

**Available Business Metrics:**

| Metric | Type | Tags | Description |
|--------|------|------|-------------|
| `liyaqa.business.members.registered` | Counter | tenant_id, membership_type | Member registrations |
| `liyaqa.business.checkins.total` | Counter | tenant_id | Total check-ins |
| `liyaqa.business.bookings.created` | Counter | tenant_id, class_type, waitlist | Class bookings |
| `liyaqa.business.payments.success` | Counter | tenant_id, payment_method | Successful payments |
| `liyaqa.business.payments.failed` | Counter | tenant_id, failure_reason | Failed payments |
| `liyaqa.business.revenue.total` | Counter | tenant_id, currency | Total revenue (SAR) |
| `liyaqa.business.revenue.mrr` | Gauge | tenant_id | Monthly Recurring Revenue |
| `liyaqa.business.subscriptions.activated` | Counter | tenant_id | Subscription activations |
| `liyaqa.business.classes.capacity.utilization` | Distribution | tenant_id | Class capacity % |

#### Connection Pool Metrics

**Location:** `backend/src/main/kotlin/com/liyaqa/observability/PoolMonitoringService.kt`

```kotlin
@Service
class PoolMonitoringService(
    private val dataSource: DataSource,
    private val meterRegistry: MeterRegistry
) {

    @Scheduled(fixedRate = 60000) // Every minute
    fun updatePoolMetrics() {
        val hikariPool = (dataSource as HikariDataSource).hikariPoolMXBean

        // Active connections
        Gauge.builder("liyaqa.pool.connection.active") { hikariPool.activeConnections }
            .register(meterRegistry)

        // Idle connections
        Gauge.builder("liyaqa.pool.connection.idle") { hikariPool.idleConnections }
            .register(meterRegistry)

        // Threads waiting for connection
        Gauge.builder("liyaqa.pool.connection.waiting") { hikariPool.threadsAwaitingConnection }
            .register(meterRegistry)

        // Alert if pool is saturated (> 80% utilization)
        val utilization = hikariPool.activeConnections.toDouble() / hikariPool.totalConnections * 100
        if (utilization > 80) {
            logger.warn("Database pool saturation: {}% ({}/{})",
                utilization, hikariPool.activeConnections, hikariPool.totalConnections)
        }
    }
}
```

**Pool Metrics:**

| Metric | Type | Description |
|--------|------|-------------|
| `liyaqa.pool.connection.active` | Gauge | Active database connections |
| `liyaqa.pool.connection.idle` | Gauge | Idle connections in pool |
| `liyaqa.pool.connection.total` | Gauge | Total connections |
| `liyaqa.pool.connection.waiting` | Gauge | Threads waiting for connection |
| `liyaqa.pool.thread.active` | Gauge | Active thread pool threads |
| `liyaqa.pool.thread.queue` | Gauge | Queued tasks |

### Grafana Dashboard Queries

Example Prometheus queries for monitoring:

```promql
# Error rate by endpoint
rate(http_server_requests_seconds_count{status=~"5.."}[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))

# Active tenants
count(increase(liyaqa_business_members_registered[24h]) > 0)

# Revenue per hour
rate(liyaqa_business_revenue_total[1h]) * 3600

# Database pool saturation
(liyaqa_pool_connection_active / liyaqa_pool_connection_total) * 100

# Failed payments by tenant
sum by (tenant_id) (increase(liyaqa_business_payments_failed[1h]))
```

---

## Alerting & Notifications

### Multi-Channel Notification System

**Channels:**
1. **Email** - SMTP (SendGrid, AWS SES)
2. **SMS** - Twilio
3. **Push Notifications** - Firebase Cloud Messaging
4. **Webhooks** - HTTP callbacks to external systems

### Scheduled Alert Jobs

**Location:** `backend/src/main/kotlin/com/liyaqa/notification/infrastructure/jobs/NotificationJobs.kt`

#### Subscription Expiry Alerts

```kotlin
@Scheduled(cron = "0 0 9 * * *") // Daily at 9:00 AM
@SchedulerLock(name = "sendSubscriptionExpiringIn7DaysReminders", lockAtMostFor = "10m")
fun sendSubscriptionExpiringIn7DaysReminders() {
    val today = LocalDate.now()
    val targetDate = today.plusDays(7)

    val subscriptions = subscriptionRepository.findActiveExpiringOn(targetDate)

    subscriptions.forEach { subscription ->
        notificationService.sendNotification(
            CreateNotificationCommand(
                recipientId = subscription.memberId,
                type = NotificationType.SUBSCRIPTION_EXPIRING,
                channel = NotificationChannel.EMAIL,
                priority = NotificationPriority.NORMAL,
                title = LocalizedText(
                    en = "Your subscription expires in 7 days",
                    ar = "اشتراكك ينتهي خلال 7 أيام"
                ),
                body = LocalizedText(
                    en = "Your ${subscription.plan.name.en} subscription expires on ${subscription.endDate}",
                    ar = "اشتراك ${subscription.plan.name.ar} ينتهي في ${subscription.endDate}"
                )
            )
        )
    }

    logger.info("Sent 7-day expiry reminders: ${subscriptions.size}")
}
```

**Alert Schedule:**

| Alert Type | Frequency | Urgency | Channels |
|------------|-----------|---------|----------|
| Subscription expiring (7 days) | Daily 9:00 AM | Normal | Email |
| Subscription expiring (3 days) | Daily 9:00 AM | Normal | Email + SMS |
| Subscription expiring (1 day) | Daily 9:00 AM | High | Email + SMS + Push |
| Subscription expired | Daily 8:00 AM | High | Email + SMS |
| Class reminder (24 hours) | Hourly | Normal | Email + Push |
| Class reminder (1 hour) | Every 15 min | Urgent | SMS + Push |
| Invoice due (3 days) | Daily 10:00 AM | Normal | Email |
| Invoice overdue | Daily 11:00 AM | High | Email + SMS |
| Low classes remaining | Daily 10:30 AM | Normal | Email + Push |

### Webhook Retry Strategy

**Location:** `backend/src/main/kotlin/com/liyaqa/webhook/domain/model/WebhookDelivery.kt`

Exponential backoff with maximum 5 retry attempts:

```kotlin
companion object {
    const val MAX_RETRY_ATTEMPTS = 5
    private val RETRY_DELAYS_SECONDS = listOf(
        60L,      // 1 minute
        300L,     // 5 minutes
        900L,     // 15 minutes
        3600L,    // 1 hour
        7200L     // 2 hours
    )
}

fun markFailed(responseCode: Int?, responseBody: String?, error: String?) {
    lastResponseCode = responseCode
    lastResponseBody = responseBody?.take(10000)
    lastError = error?.take(2000)

    if (attemptCount >= MAX_RETRY_ATTEMPTS) {
        status = DeliveryStatus.EXHAUSTED
        nextRetryAt = null
    } else {
        status = DeliveryStatus.FAILED
        // Exponential backoff
        val delayIndex = (attemptCount - 1).coerceIn(0, RETRY_DELAYS_SECONDS.size - 1)
        nextRetryAt = Instant.now().plusSeconds(RETRY_DELAYS_SECONDS[delayIndex])
    }
}
```

**Webhook Scheduled Jobs:**

```kotlin
@Scheduled(fixedDelay = 30000) // Every 30 seconds
@SchedulerLock(name = "processPendingWebhookDeliveries", lockAtMostFor = "5m")
fun processPendingDeliveries() {
    val processed = webhookDeliveryService.processPendingDeliveries(batchSize = 100)
    if (processed > 0) {
        logger.info("Processed $processed pending webhook deliveries")
    }
}

@Scheduled(fixedDelay = 60000) // Every minute
@SchedulerLock(name = "retryFailedWebhookDeliveries", lockAtMostFor = "5m")
fun retryFailedDeliveries() {
    val retried = webhookDeliveryService.processRetries(batchSize = 50)
    if (retried > 0) {
        logger.info("Retried $retried failed webhook deliveries")
    }
}
```

### Rate Limiting

**Location:** `backend/src/main/kotlin/com/liyaqa/config/RateLimitingFilter.kt`

Database-backed rate limiting with role-based multipliers:

```kotlin
enum class RateLimitTier(val requestsPerMinute: Int) {
    AUTH_LOGIN(5),           // Login attempts
    AUTH_REGISTER(3),        // Registration
    AUTH_PASSWORD(3),        // Password reset
    AUTH_GENERAL(10),        // Other auth endpoints
    RESOURCE_INTENSIVE(10),  // PDF generation, exports
    SEARCH(60),              // Search operations
    WRITE(30),               // Create/Update/Delete
    READ(100)                // Read operations
}

// Role-based multipliers
val multiplier = when (userRole) {
    "SUPER_ADMIN" -> 3.0
    "CLUB_ADMIN" -> 2.0
    "STAFF" -> 1.5
    else -> 1.0
}

val effectiveLimit = (tier.requestsPerMinute * multiplier).toInt()
```

**Response Headers:**
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 27
X-RateLimit-Reset: 1675512345
Retry-After: 60
```

**Error Response (HTTP 429):**
```json
{
  "status": 429,
  "error": "Too Many Requests",
  "errorAr": "طلبات كثيرة جداً",
  "message": "Rate limit exceeded. Please try again later.",
  "messageAr": "تم تجاوز حد الطلبات. يرجى المحاولة مرة أخرى لاحقاً.",
  "timestamp": "2026-02-04T10:15:30.123Z",
  "retryAfter": 60
}
```

---

## Distributed Tracing

### OpenTelemetry + Zipkin

**Configuration:**
```yaml
management:
  tracing:
    sampling:
      probability: 0.1  # 10% sampling in prod, 100% in dev
  zipkin:
    tracing:
      endpoint: http://localhost:9411/api/v2/spans
```

**Location:** `backend/src/main/kotlin/com/liyaqa/config/TracingConfiguration.kt`

### Instrumentation Methods

#### 1. Declarative (Annotation-Based)

```kotlin
@Service
class PaymentService {

    @Observed(
        name = "payment.process",
        contextualName = "process-payment"
    )
    fun processPayment(invoiceId: UUID, paymentMethod: PaymentMethod): Payment {
        // Automatically traced with timing and error info
        return paymentGateway.charge(invoiceId, paymentMethod)
    }
}
```

#### 2. Manual (Programmatic)

```kotlin
@Service
class ReportService(private val tracerProvider: TracerProvider) {

    fun generateReport(reportId: UUID): Report {
        return tracerProvider.trace("report.generate") { span ->
            span.tag("report_id", reportId.toString())
            span.tag("report_type", "monthly")

            try {
                val data = fetchReportData(reportId)
                span.tag("data_size", data.size.toString())

                val report = buildReport(data)
                span.tag("success", "true")

                return report
            } catch (e: Exception) {
                span.tag("error", "true")
                span.tag("error_message", e.message)
                throw e
            }
        }
    }
}
```

#### 3. Automatic (HTTP Requests)

All HTTP requests are automatically instrumented by Spring Boot:

- Request method and path
- HTTP status code
- Request duration
- Client IP address
- Exception details (if any)

### Trace Context Propagation

**MDC Integration:**
```kotlin
// Trace IDs automatically added to MDC for logging
MDC.put("traceId", currentTraceId)
MDC.put("spanId", currentSpanId)

// Logs include trace context
logger.info("Processing payment")
// Output: {"traceId": "abc123", "spanId": "def456", "message": "Processing payment"}
```

**HTTP Header Propagation:**
```
X-B3-TraceId: abc123def456
X-B3-SpanId: 789ghi012jkl
X-B3-ParentSpanId: 345mno678pqr
X-B3-Sampled: 1
```

### Zipkin UI

Access traces at: `http://localhost:9411/zipkin`

**Example Trace:**
```
[========== HTTP Request ==========] (234ms)
  [==== Payment Service ====] (187ms)
    [= Database Query =] (45ms)
    [== PayTabs API ==] (120ms)
    [= Webhook Queue =] (12ms)
  [= Notification Send =] (23ms)
```

---

## Resilience Patterns

### Spring Retry

**Dependencies:**
```kotlin
implementation("org.springframework.retry:spring-retry:2.0.11")
implementation("org.springframework:spring-aspects:6.2.2")
```

#### External Service Retry

```kotlin
@Service
class TwilioSmsService {

    @Retryable(
        retryFor = [RestClientException::class],
        maxAttempts = 3,
        backoff = Backoff(delay = 1000, multiplier = 2.0)
    )
    fun sendSms(to: String, message: String): SmsResponse {
        return twilioClient.messages.create(
            to = PhoneNumber(to),
            from = PhoneNumber(twilioFromNumber),
            body = message
        )
    }

    @Recover
    fun recoverSendSms(e: RestClientException, to: String, message: String): SmsResponse {
        logger.error("Failed to send SMS after 3 attempts: ${e.message}")
        // Return failed response or trigger alert
        return SmsResponse(success = false, error = e.message)
    }
}
```

**Retry Schedule:**
- Attempt 1: Immediate
- Attempt 2: After 1 second (1000ms × 2^0)
- Attempt 3: After 2 seconds (1000ms × 2^1)

#### Payment Gateway Retry

```kotlin
@Service
class PayTabsPaymentService {

    @Retryable(
        retryFor = [RestClientException::class, PaymentGatewayException::class],
        maxAttempts = 3,
        backoff = Backoff(delay = 1000, multiplier = 2.0)
    )
    fun initiatePayment(request: PaymentRequest): PaymentResponse {
        return payTabsClient.createPaymentPage(request)
    }

    @Recover
    fun recoverPayment(e: Exception, request: PaymentRequest): PaymentResponse {
        logger.error("Payment initiation failed after retries: ${e.message}")
        // Mark invoice as payment failed
        invoiceService.markPaymentFailed(request.invoiceId, e.message)
        throw PaymentGatewayException("Payment gateway unavailable", e)
    }
}
```

### Async Exception Handling

**Location:** `backend/src/main/kotlin/com/liyaqa/config/AsyncConfig.kt`

```kotlin
@Configuration
@EnableAsync
class AsyncConfig : AsyncConfigurer {

    override fun getAsyncExecutor(): Executor {
        val executor = ThreadPoolTaskExecutor()
        executor.corePoolSize = 10
        executor.maxPoolSize = 40
        executor.queueCapacity = 500
        executor.setThreadNamePrefix("async-")
        executor.setRejectedExecutionHandler(ThreadPoolExecutor.CallerRunsPolicy())
        executor.initialize()
        return executor
    }

    override fun getAsyncUncaughtExceptionHandler(): AsyncUncaughtExceptionHandler {
        return AsyncUncaughtExceptionHandler { ex, method, params ->
            logger.error("Async execution failed: ${method.name}", ex)

            // TODO: Send alert to monitoring service
            // TODO: Consider implementing circuit breaker for repeated failures
        }
    }
}
```

**Rejection Policy:** `CallerRunsPolicy` provides backpressure - if queue is full, caller thread executes the task.

### Database Transaction Rollback

```kotlin
@Service
@Transactional
class SubscriptionService {

    fun createSubscriptionWithPayment(command: CreateSubscriptionCommand): Subscription {
        try {
            // Create subscription
            val subscription = Subscription(...)
            subscriptionRepository.save(subscription)

            // Generate invoice
            val invoice = invoiceService.generateSubscriptionInvoice(subscription)

            // Attempt payment
            val payment = paymentService.processPayment(invoice.id, command.paymentMethod)

            if (!payment.successful) {
                // Rollback entire transaction
                throw PaymentFailedException("Payment failed: ${payment.errorMessage}")
            }

            // Activate subscription
            subscription.activate()

            return subscription
        } catch (e: Exception) {
            // Transaction automatically rolled back on exception
            logger.error("Subscription creation failed: ${e.message}", e)
            throw e
        }
    }
}
```

### Idempotency Keys

```kotlin
@Service
class PaymentService {

    @Transactional
    fun processPayment(invoiceId: UUID, idempotencyKey: String): Payment {
        // Check for existing payment with same idempotency key
        val existing = paymentRepository.findByIdempotencyKey(idempotencyKey)
        if (existing != null) {
            logger.info("Returning cached payment for idempotency key: $idempotencyKey")
            return existing
        }

        // Process new payment
        val payment = Payment(
            invoiceId = invoiceId,
            idempotencyKey = idempotencyKey,
            ...
        )

        return paymentRepository.save(payment)
    }
}
```

---

## Best Practices

### 1. Exception Hierarchy

```kotlin
// ✅ GOOD: Use standard exceptions with descriptive messages
fun getMember(id: UUID): Member {
    return memberRepository.findById(id)
        .orElseThrow { NoSuchElementException("Member not found: $id") }
}

// ❌ BAD: Creating custom exceptions for everything
class MemberNotFoundException : RuntimeException()
```

**Why:** Standard exceptions (NoSuchElementException, IllegalArgumentException, IllegalStateException) are already handled by GlobalExceptionHandler with proper HTTP status codes and bilingual messages.

### 2. Validation Strategy

```kotlin
// ✅ GOOD: Jakarta Bean Validation on DTOs
data class CreateMemberRequest(
    @field:NotBlank(message = "Email must not be blank")
    @field:Email(message = "Email must be a valid email address")
    val email: String,

    @field:Size(min = 2, max = 50)
    val firstName: String
)

// Controller automatically validates
@PostMapping
fun createMember(@Valid @RequestBody request: CreateMemberRequest): MemberDto

// ❌ BAD: Manual validation in service layer
fun createMember(request: CreateMemberRequest): Member {
    if (request.email.isBlank()) {
        throw IllegalArgumentException("Email is required")
    }
    if (!isValidEmail(request.email)) {
        throw IllegalArgumentException("Invalid email")
    }
    // ... manual validation hell
}
```

### 3. Business Rules as State Checks

```kotlin
// ✅ GOOD: Check state, throw descriptive exception
fun cancelSubscription(subscriptionId: UUID): Subscription {
    val subscription = getSubscription(subscriptionId)

    if (subscription.status == SubscriptionStatus.CANCELLED) {
        throw IllegalStateException("Subscription is already cancelled")
    }

    if (subscription.status == SubscriptionStatus.EXPIRED) {
        throw IllegalStateException("Cannot cancel expired subscription")
    }

    subscription.cancel()
    return subscriptionRepository.save(subscription)
}

// ❌ BAD: Silent failures or boolean returns
fun cancelSubscription(subscriptionId: UUID): Boolean {
    val subscription = getSubscription(subscriptionId)
    if (subscription.status == SubscriptionStatus.CANCELLED) {
        return false // What does false mean? Already cancelled? Error?
    }
    subscription.cancel()
    return true
}
```

### 4. Logging Levels

```kotlin
// ✅ GOOD: Appropriate log levels
fun processPayment(invoiceId: UUID): Payment {
    logger.debug("Processing payment for invoice: $invoiceId")

    try {
        val payment = paymentGateway.charge(invoice)
        logger.info("Payment successful: ${payment.id} - Amount: ${payment.amount}")
        return payment
    } catch (e: PaymentDeclinedException) {
        logger.warn("Payment declined for invoice $invoiceId: ${e.reason}")
        throw e
    } catch (e: Exception) {
        logger.error("Payment processing failed for invoice $invoiceId", e)
        throw e
    }
}

// ❌ BAD: Wrong log levels
fun processPayment(invoiceId: UUID): Payment {
    logger.error("Processing payment") // ERROR for normal operation?

    try {
        val payment = paymentGateway.charge(invoice)
        return payment // No logging of success?
    } catch (e: PaymentDeclinedException) {
        logger.error("Declined", e) // Stack trace for expected business exception?
        throw e
    }
}
```

### 5. Transaction Boundaries

```kotlin
// ✅ GOOD: Transaction at service method level
@Service
@Transactional
class SubscriptionService {

    fun createSubscription(command: CreateSubscriptionCommand): Subscription {
        // All operations in single transaction
        val subscription = Subscription(...)
        subscriptionRepository.save(subscription)

        val invoice = invoiceService.generateInvoice(subscription)

        return subscription
    }
}

// ❌ BAD: Transaction at controller level
@RestController
@Transactional // Don't do this!
class SubscriptionController {
    @PostMapping
    fun create(@RequestBody request: CreateSubscriptionRequest): SubscriptionDto {
        // Transaction spans HTTP request/response serialization
        val subscription = subscriptionService.createSubscription(request)
        return SubscriptionDto.from(subscription)
    }
}
```

### 6. Async Error Handling

```kotlin
// ✅ GOOD: Log errors, continue processing
@Async
fun sendNotifications(memberIds: List<UUID>) {
    memberIds.forEach { memberId ->
        try {
            val member = memberRepository.findById(memberId).orElse(null)
            if (member != null) {
                notificationService.sendEmail(member.email, "Welcome!")
            }
        } catch (e: Exception) {
            // Log error but continue with other members
            logger.error("Failed to send notification to member $memberId", e)
        }
    }
}

// ❌ BAD: Let exception kill entire async task
@Async
fun sendNotifications(memberIds: List<UUID>) {
    memberIds.forEach { memberId ->
        val member = memberRepository.findById(memberId).get() // Throws exception
        notificationService.sendEmail(member.email, "Welcome!")
        // If one fails, entire batch fails
    }
}
```

### 7. Resource Cleanup

```kotlin
// ✅ GOOD: Use try-finally for cleanup
fun processFile(file: MultipartFile): FileMetadata {
    val tempFile = Files.createTempFile("upload-", ".tmp")

    try {
        file.transferTo(tempFile)
        val metadata = extractMetadata(tempFile)
        storageService.store(tempFile, metadata)
        return metadata
    } finally {
        Files.deleteIfExists(tempFile)
    }
}

// ✅ BETTER: Use Kotlin's use() extension
fun processFile(file: MultipartFile): FileMetadata {
    return Files.newInputStream(file.inputStream).use { input ->
        val metadata = extractMetadata(input)
        storageService.store(input, metadata)
        metadata
    }
}
```

### 8. Error Response Consistency

```kotlin
// ✅ GOOD: Let GlobalExceptionHandler handle responses
@PostMapping
fun createMember(@Valid @RequestBody request: CreateMemberRequest): MemberDto {
    val member = memberService.createMember(request)
    return MemberDto.from(member)
}

// Service throws exception
fun createMember(request: CreateMemberRequest): Member {
    if (memberRepository.existsByEmail(request.email)) {
        throw DuplicateFieldException(DuplicateField.EMAIL, "Email already exists")
    }
    return memberRepository.save(Member(...))
}

// ❌ BAD: Manual error responses in controller
@PostMapping
fun createMember(@Valid @RequestBody request: CreateMemberRequest): ResponseEntity<*> {
    return try {
        val member = memberService.createMember(request)
        ResponseEntity.ok(MemberDto.from(member))
    } catch (e: Exception) {
        // Manual error handling - inconsistent with other endpoints
        ResponseEntity.status(400).body(mapOf("error" to e.message))
    }
}
```

### 9. Metrics Instrumentation

```kotlin
// ✅ GOOD: Instrument business-critical operations
@Service
class PaymentService(
    private val metricsService: BusinessMetricsService
) {
    fun processPayment(invoiceId: UUID): Payment {
        val startTime = System.currentTimeMillis()

        return try {
            val payment = paymentGateway.charge(invoice)

            // Record success metrics
            metricsService.recordPaymentSuccess(
                tenantId = invoice.tenantId,
                amount = payment.amount,
                method = payment.method
            )
            metricsService.recordPaymentProcessingTime(
                System.currentTimeMillis() - startTime
            )

            payment
        } catch (e: PaymentException) {
            // Record failure metrics
            metricsService.recordPaymentFailure(
                tenantId = invoice.tenantId,
                reason = e.reason
            )
            throw e
        }
    }
}
```

### 10. Rate Limit Handling

```kotlin
// ✅ GOOD: Client respects rate limit headers
fun makeApiCall(): Response {
    val response = httpClient.get("/api/members")

    if (response.status == 429) {
        val retryAfter = response.headers["Retry-After"]?.toLongOrNull() ?: 60
        logger.warn("Rate limited, retrying after $retryAfter seconds")
        Thread.sleep(retryAfter * 1000)
        return makeApiCall()
    }

    return response
}

// Log current rate limit status
val remaining = response.headers["X-RateLimit-Remaining"]?.toIntOrNull()
val limit = response.headers["X-RateLimit-Limit"]?.toIntOrNull()
if (remaining != null && limit != null && remaining < limit * 0.2) {
    logger.warn("Approaching rate limit: $remaining/$limit remaining")
}
```

---

## Configuration Summary

### Production Checklist

- [ ] **Logging**
  - [ ] JSON format enabled (`spring.profiles.active=prod`)
  - [ ] Log level set to INFO/WARN (`com.liyaqa: INFO`)
  - [ ] Structured logging with MDC context
  - [ ] Log aggregation configured (CloudWatch, Elasticsearch, Loki)

- [ ] **Monitoring**
  - [ ] Prometheus scraping enabled (`/actuator/prometheus`)
  - [ ] Grafana dashboards imported
  - [ ] Alert rules configured
  - [ ] Health check endpoints tested

- [ ] **Tracing**
  - [ ] Zipkin endpoint configured
  - [ ] Sampling rate set (10% recommended)
  - [ ] Trace propagation headers enabled

- [ ] **Alerting**
  - [ ] Email notifications enabled (`liyaqa.email.enabled=true`)
  - [ ] SMS notifications configured (Twilio)
  - [ ] Webhook retry jobs scheduled
  - [ ] Alert thresholds defined

- [ ] **Resilience**
  - [ ] Database connection pool sized correctly (20-40 connections)
  - [ ] Rate limiting enabled
  - [ ] Retry policies configured
  - [ ] Circuit breakers tested

- [ ] **Security**
  - [ ] Error messages don't expose sensitive data
  - [ ] Stack traces disabled in production
  - [ ] Rate limiting protects authentication endpoints
  - [ ] CORS configured correctly

---

## Appendix: Key File Locations

### Exception Handling
- `backend/src/main/kotlin/com/liyaqa/config/GlobalExceptionHandler.kt`
- `backend/src/main/kotlin/com/liyaqa/shared/exception/DuplicateFieldException.kt`
- `backend/src/main/kotlin/com/liyaqa/shared/exception/DuplicateAgreementException.kt`

### Logging
- `backend/src/main/resources/logback-spring.xml`
- `backend/src/main/kotlin/com/liyaqa/config/RequestLoggingFilter.kt`

### Monitoring
- `backend/src/main/kotlin/com/liyaqa/observability/BusinessMetricsService.kt`
- `backend/src/main/kotlin/com/liyaqa/observability/PoolMonitoringService.kt`
- `backend/src/main/kotlin/com/liyaqa/config/HealthController.kt`

### Tracing
- `backend/src/main/kotlin/com/liyaqa/config/TracingConfiguration.kt`
- `backend/src/main/kotlin/com/liyaqa/observability/TracingExamples.kt`

### Resilience
- `backend/src/main/kotlin/com/liyaqa/config/AsyncConfig.kt`
- `backend/src/main/kotlin/com/liyaqa/config/RateLimitingFilter.kt`
- `backend/src/main/kotlin/com/liyaqa/notification/infrastructure/sms/TwilioSmsService.kt`

### Jobs & Scheduling
- `backend/src/main/kotlin/com/liyaqa/config/ShedLockConfig.kt`
- `backend/src/main/kotlin/com/liyaqa/notification/infrastructure/jobs/NotificationJobs.kt`
- `backend/src/main/kotlin/com/liyaqa/webhook/infrastructure/jobs/WebhookRetryJob.kt`

---

**End of Error Handling Guide**
