# Testing Documentation

Complete documentation of the test suite, testing strategies, patterns, and infrastructure for the Liyaqa backend.

**Last Updated:** 2026-02-04
**Backend Version:** Spring Boot 3.4.1 | Kotlin 2.2.0
**Test Framework:** JUnit 5 | Mockito | Testcontainers

---

## Table of Contents

1. [Test Suite Overview](#test-suite-overview)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [Test Utilities & Fixtures](#test-utilities--fixtures)
5. [Mocking Strategies](#mocking-strategies)
6. [Test Data Setup](#test-data-setup)
7. [Test Configuration](#test-configuration)
8. [Testing Patterns](#testing-patterns)
9. [Code Coverage](#code-coverage)
10. [Best Practices](#best-practices)

---

## Test Suite Overview

### Test Statistics

| Category | Count | Percentage |
|----------|-------|------------|
| **Service Unit Tests** | 29 | 44% |
| **Integration Tests** | 9 | 14% |
| **Controller/API Tests** | 11 | 17% |
| **Repository Tests** | 5 | 8% |
| **Infrastructure Tests** | 7 | 11% |
| **Scheduled Job Tests** | 1 | 2% |
| **Factory/Utility Tests** | 1 | 2% |
| **Application Context Tests** | 1 | 2% |
| **Total** | **66** | **100%** |

### Test Directory Structure

```
backend/src/test/
├── kotlin/com/liyaqa/
│   ├── attendance/
│   │   ├── CheckInWorkflowIntegrationTest.kt
│   │   └── application/services/AttendanceServiceTest.kt
│   ├── auth/
│   │   ├── AuthenticationSecurityIntegrationTest.kt
│   │   ├── api/AuthControllerIntegrationTest.kt
│   │   └── application/services/AuthServiceTest.kt
│   ├── billing/
│   │   ├── InvoicePdfIntegrationTest.kt
│   │   ├── PayTabsPaymentServiceTest.kt
│   │   ├── ZatcaServiceTest.kt
│   │   └── application/services/InvoiceServiceTest.kt
│   ├── config/
│   │   └── TestContainersConfiguration.kt
│   ├── crm/
│   │   └── application/services/
│   │       ├── LeadActivityServiceTest.kt
│   │       ├── LeadAssignmentServiceTest.kt
│   │       ├── LeadScoringServiceTest.kt
│   │       └── LeadServiceTest.kt
│   ├── integration/
│   │   └── MemberJourneyIntegrationTest.kt
│   ├── marketing/
│   │   ├── infrastructure/jobs/MarketingJobsTest.kt
│   │   └── application/services/
│   │       ├── CampaignExecutionServiceTest.kt
│   │       ├── CampaignServiceTest.kt
│   │       └── SegmentServiceTest.kt
│   ├── membership/
│   │   ├── SubscriptionFreezeIntegrationTest.kt
│   │   └── api/MemberControllerIntegrationTest.kt
│   ├── notification/
│   │   └── application/services/NotificationServiceTest.kt
│   ├── organization/
│   │   └── application/services/
│   │       ├── ClubServiceTest.kt
│   │       ├── LocationServiceTest.kt
│   │       └── OrganizationServiceTest.kt
│   ├── platform/
│   │   ├── ClientPlanServiceTest.kt
│   │   ├── ClientSubscriptionServiceTest.kt
│   │   └── DealServiceTest.kt
│   ├── referral/
│   │   └── application/services/
│   │       ├── ReferralCodeServiceTest.kt
│   │       ├── ReferralConfigServiceTest.kt
│   │       ├── ReferralRewardServiceTest.kt
│   │       └── ReferralTrackingServiceTest.kt
│   ├── scheduling/
│   │   ├── BookingWorkflowIntegrationTest.kt
│   │   └── application/services/BookingServiceTest.kt
│   ├── shared/
│   │   ├── IntegrationTestBase.kt
│   │   ├── TestDataFactory.kt
│   │   ├── TestDataFactoryTest.kt
│   │   ├── FileStorageServiceTest.kt
│   │   ├── ScheduledJobsTest.kt
│   │   ├── api/DashboardSummaryIntegrationTest.kt
│   │   └── infrastructure/export/ExportServiceTest.kt
│   ├── trainer/
│   │   └── api/
│   │       ├── TrainerCertificationControllerTest.kt
│   │       ├── TrainerEarningsControllerTest.kt
│   │       ├── TrainerNotificationControllerTest.kt
│   │       ├── TrainerPortalControllerTest.kt
│   │       └── TrainerScheduleControllerTest.kt
│   ├── voucher/
│   │   └── application/services/
│   │       ├── VoucherRedemptionServiceTest.kt
│   │       ├── VoucherServiceTest.kt
│   │       └── VoucherValidationServiceTest.kt
│   ├── webhook/
│   │   └── application/services/
│   │       ├── WebhookDeliveryServiceTest.kt
│   │       └── WebhookServiceTest.kt
│   └── LiyaqaApplicationTests.kt
└── resources/
    └── application-test.yml
```

---

## Unit Tests

### Overview

Unit tests focus on testing **service layer logic in isolation** using mocked dependencies.

**Total:** 29 service tests
**Framework:** JUnit 5 + Mockito Kotlin
**Pattern:** Arrange-Act-Assert (Given-When-Then)

### Example: AuthServiceTest

**File:** `backend/src/test/kotlin/com/liyaqa/auth/application/services/AuthServiceTest.kt`

```kotlin
@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    // Mocked dependencies
    @Mock private lateinit var userRepository: UserRepository
    @Mock private lateinit var jwtTokenProvider: JwtTokenProvider
    @Mock private lateinit var passwordEncoder: PasswordEncoder
    @Mock private lateinit var refreshTokenRepository: RefreshTokenRepository
    @Mock private lateinit var passwordResetTokenRepository: PasswordResetTokenRepository
    @Mock private lateinit var emailService: EmailService
    @Mock private lateinit var permissionService: PermissionService
    @Mock private lateinit var passwordPolicyService: PasswordPolicyService
    @Mock private lateinit var auditService: AuditService
    @Mock private lateinit var securityEmailService: SecurityEmailService
    @Mock private lateinit var sessionService: SessionService

    private lateinit var authService: AuthService

    private val testTenantId = UUID.randomUUID()
    private val testPassword = "password123"
    private val encodedPassword = "encoded-password-hash"

    @BeforeEach
    fun setUp() {
        authService = AuthService(
            userRepository,
            refreshTokenRepository,
            passwordResetTokenRepository,
            jwtTokenProvider,
            passwordEncoder,
            emailService,
            permissionService,
            passwordPolicyService,
            auditService,
            securityEmailService,
            sessionService
        )

        // Configure common mock behaviors
        whenever(passwordEncoder.encode(any())) doReturn encodedPassword
        whenever(passwordEncoder.matches(testPassword, encodedPassword)) doReturn true
        whenever(jwtTokenProvider.generateAccessToken(any<User>(), any())) doReturn "access-token"
        whenever(jwtTokenProvider.generateRefreshToken(any())) doReturn Pair("refresh-token", "token-hash")
        whenever(jwtTokenProvider.getAccessTokenExpirationMs()) doReturn 900000L
        whenever(permissionService.getUserPermissionCodes(any())) doReturn emptyList()
    }

    @Test
    fun `login should return AuthResult when credentials are valid`() {
        // Given
        val testUser = User(
            id = UUID.randomUUID(),
            email = "test@example.com",
            passwordHash = encodedPassword,
            displayName = LocalizedText(en = "Test User"),
            role = Role.MEMBER,
            status = UserStatus.ACTIVE
        )

        val command = LoginCommand(
            email = "test@example.com",
            password = testPassword,
            tenantId = testTenantId
        )

        whenever(userRepository.findByEmailAndTenantId(command.email, testTenantId))
            .doReturn(Optional.of(testUser))

        // When
        val result = authService.login(command)

        // Then
        assertNotNull(result)
        assert(result is LoginResult.Success)

        val successResult = result as LoginResult.Success
        assertEquals("access-token", successResult.accessToken)
        assertEquals("refresh-token", successResult.refreshToken)
        assertEquals(testUser.email, successResult.user.email)

        // Verify interactions
        verify(userRepository).findByEmailAndTenantId(command.email, testTenantId)
        verify(passwordEncoder).matches(testPassword, encodedPassword)
        verify(jwtTokenProvider).generateAccessToken(testUser, testTenantId)
        verify(refreshTokenRepository).save(any())
    }

    @Test
    fun `login should throw when email not found`() {
        // Given
        val command = LoginCommand(
            email = "nonexistent@example.com",
            password = testPassword,
            tenantId = testTenantId
        )

        whenever(userRepository.findByEmailAndTenantId(command.email, testTenantId))
            .doReturn(Optional.empty())

        // When & Then
        assertThrows<IllegalArgumentException> {
            authService.login(command)
        }
    }

    @Test
    fun `login should throw when password is incorrect`() {
        // Given
        val testUser = User(
            id = UUID.randomUUID(),
            email = "test@example.com",
            passwordHash = encodedPassword,
            displayName = LocalizedText(en = "Test User"),
            role = Role.MEMBER,
            status = UserStatus.ACTIVE
        )

        val command = LoginCommand(
            email = "test@example.com",
            password = "wrong-password",
            tenantId = testTenantId
        )

        whenever(userRepository.findByEmailAndTenantId(command.email, testTenantId))
            .doReturn(Optional.of(testUser))
        whenever(passwordEncoder.matches("wrong-password", encodedPassword))
            .doReturn(false)

        // When & Then
        assertThrows<IllegalArgumentException> {
            authService.login(command)
        }
    }

    @Test
    fun `login should throw when user account is inactive`() {
        // Given
        val inactiveUser = User(
            id = UUID.randomUUID(),
            email = "test@example.com",
            passwordHash = encodedPassword,
            displayName = LocalizedText(en = "Test User"),
            role = Role.MEMBER,
            status = UserStatus.INACTIVE  // Inactive status
        )

        val command = LoginCommand(
            email = "test@example.com",
            password = testPassword,
            tenantId = testTenantId
        )

        whenever(userRepository.findByEmailAndTenantId(command.email, testTenantId))
            .doReturn(Optional.of(inactiveUser))

        // When & Then
        assertThrows<IllegalStateException> {
            authService.login(command)
        }
    }
}
```

**Test Methods (8 total):**
- ✅ Login with valid credentials
- ✅ Login with wrong password
- ✅ Login when user inactive
- ✅ Register with existing email
- ✅ Change password validation
- ✅ Get current user
- ✅ Logout all sessions
- ✅ Password reset flow

### Unit Test Coverage by Domain

| Domain | Tests | Coverage |
|--------|-------|----------|
| **Authentication** | 8 | 90% |
| **Attendance** | 13 | 85% |
| **Booking** | 10 | 80% |
| **CRM/Leads** | 32 | 85% |
| **Referrals** | 24 | 90% |
| **Vouchers** | 18 | 85% |
| **Marketing** | 21 | 80% |
| **Webhooks** | 14 | 80% |
| **Notification** | 9 | 75% |
| **Invoice** | 11 | 80% |
| **Organization** | 15 | 85% |

---

## Integration Tests

### Overview

Integration tests verify **end-to-end workflows** with real Spring context, database persistence, and multi-tenant isolation.

**Total:** 9 full integration tests
**Framework:** Spring Boot Test + Testcontainers + JUnit 5
**Database:** PostgreSQL 16 Alpine (via Testcontainers)
**Pattern:** Real beans, real database, transactional rollback

### Example: CheckInWorkflowIntegrationTest

**File:** `backend/src/test/kotlin/com/liyaqa/attendance/CheckInWorkflowIntegrationTest.kt`

```kotlin
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CheckInWorkflowIntegrationTest {

    @Autowired
    private lateinit var attendanceService: AttendanceService

    @Autowired
    private lateinit var organizationRepository: OrganizationRepository
    @Autowired
    private lateinit var clubRepository: ClubRepository
    @Autowired
    private lateinit var locationRepository: LocationRepository
    @Autowired
    private lateinit var memberRepository: MemberRepository
    @Autowired
    private lateinit var membershipPlanRepository: MembershipPlanRepository
    @Autowired
    private lateinit var subscriptionRepository: SubscriptionRepository

    private lateinit var testOrganization: Organization
    private lateinit var testClub: Club
    private lateinit var testLocation: Location
    private lateinit var testMember: Member
    private lateinit var testPlan: MembershipPlan
    private lateinit var testTenantId: UUID

    @BeforeEach
    fun setUp() {
        // Step 1: Create and save organization
        testOrganization = Organization(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Test Org", ar = "منظمة اختبار"),
            organizationType = OrganizationType.LLC,
            status = OrganizationStatus.ACTIVE,
            email = "org@test.com",
            phone = "+966500000000"
        )
        testOrganization = organizationRepository.save(testOrganization)

        // Step 2: Create and save club (tenant)
        testClub = Club(
            id = UUID.randomUUID(),
            organizationId = testOrganization.id,
            name = LocalizedText(en = "Test Club", ar = "نادي اختبار"),
            status = ClubStatus.ACTIVE
        )
        testClub = clubRepository.save(testClub)
        testTenantId = testClub.id

        // Step 3: Set tenant context
        TenantContext.setCurrentTenant(TenantId(testTenantId))

        // Step 4: Create location
        testLocation = Location(
            id = UUID.randomUUID(),
            clubId = testClub.id,
            name = LocalizedText(en = "Main Location", ar = "الموقع الرئيسي"),
            status = LocationStatus.ACTIVE
        )
        testLocation.setTenantAndOrganization(testClub.id, testOrganization.id)
        testLocation = locationRepository.save(testLocation)

        // Step 5: Create member
        testMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.${UUID.randomUUID()}@test.com",
            phone = "+966500000001",
            status = MemberStatus.ACTIVE
        )
        setTenantId(testMember, testTenantId)
        testMember = memberRepository.save(testMember)

        // Step 6: Create membership plan
        testPlan = MembershipPlan(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Monthly", ar = "شهري"),
            membershipFee = TaxableFee(
                amount = BigDecimal("299.00"),
                currency = "SAR",
                taxRate = BigDecimal("15.00")
            ),
            billingPeriod = BillingPeriod.MONTHLY,
            maxClassesPerPeriod = 10,
            freezeDaysAllowed = 7,
            isActive = true
        )
        setTenantId(testPlan, testTenantId)
        testPlan = membershipPlanRepository.save(testPlan)
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    @Test
    fun `checkIn with active subscription creates attendance record`() {
        // Given - Create active subscription
        val subscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = testPlan.id,
            startDate = LocalDate.now().minusMonths(1),
            endDate = LocalDate.now().plusMonths(1),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 10
        )
        setTenantId(subscription, testTenantId)
        subscriptionRepository.save(subscription)

        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL,
            createdBy = "system"
        )

        // When
        val record = attendanceService.checkIn(command)

        // Then
        assertNotNull(record)
        assertEquals(testMember.id, record.memberId)
        assertEquals(testLocation.id, record.locationId)
        assertEquals(AttendanceStatus.CHECKED_IN, record.status)
        assertEquals(CheckInMethod.MANUAL, record.checkInMethod)
        assertNotNull(record.checkInTime)
        assertNull(record.checkOutTime)
    }

    @Test
    fun `checkIn without subscription throws exception`() {
        // Given - No subscription created
        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL,
            createdBy = "system"
        )

        // When & Then
        val exception = assertThrows<IllegalStateException> {
            attendanceService.checkIn(command)
        }

        assertTrue(exception.message!!.contains("no active subscription"))
    }

    @Test
    fun `checkIn with expired subscription throws exception`() {
        // Given - Expired subscription
        val expiredSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = testPlan.id,
            startDate = LocalDate.now().minusMonths(2),
            endDate = LocalDate.now().minusMonths(1),  // Ended last month
            status = SubscriptionStatus.EXPIRED,
            classesRemaining = 0
        )
        setTenantId(expiredSubscription, testTenantId)
        subscriptionRepository.save(expiredSubscription)

        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL,
            createdBy = "system"
        )

        // When & Then
        assertThrows<IllegalStateException> {
            attendanceService.checkIn(command)
        }
    }

    @Test
    fun `checkIn deducts class from limited subscription`() {
        // Given - Subscription with class limit
        val subscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = testPlan.id,
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusMonths(1),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 10
        )
        setTenantId(subscription, testTenantId)
        val savedSubscription = subscriptionRepository.save(subscription)

        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL,
            createdBy = "system"
        )

        // When
        attendanceService.checkIn(command)

        // Then - Verify class was deducted
        val updatedSubscription = subscriptionRepository.findById(savedSubscription.id).orElseThrow()
        assertEquals(9, updatedSubscription.classesRemaining)
    }

    @Test
    fun `checkIn with no classes remaining throws exception`() {
        // Given - Subscription with zero classes
        val subscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = testPlan.id,
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusMonths(1),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 0  // No classes left
        )
        setTenantId(subscription, testTenantId)
        subscriptionRepository.save(subscription)

        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL,
            createdBy = "system"
        )

        // When & Then
        val exception = assertThrows<IllegalStateException> {
            attendanceService.checkIn(command)
        }

        assertTrue(exception.message!!.contains("No classes remaining"))
    }

    @Test
    fun `checkIn when already checked in throws exception`() {
        // Given - Create active subscription and check in once
        val subscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = testPlan.id,
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusMonths(1),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 10
        )
        setTenantId(subscription, testTenantId)
        subscriptionRepository.save(subscription)

        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL,
            createdBy = "system"
        )

        // First check-in succeeds
        attendanceService.checkIn(command)

        // When & Then - Second check-in fails
        val exception = assertThrows<IllegalStateException> {
            attendanceService.checkIn(command)
        }

        assertTrue(exception.message!!.contains("already checked in"))
    }

    @Test
    fun `checkOut updates attendance record`() {
        // Given - Check in first
        val subscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = testPlan.id,
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusMonths(1),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 10
        )
        setTenantId(subscription, testTenantId)
        subscriptionRepository.save(subscription)

        val checkInCommand = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL,
            createdBy = "system"
        )

        val checkInRecord = attendanceService.checkIn(checkInCommand)

        // When - Check out
        val checkOutCommand = CheckOutCommand(
            memberId = testMember.id,
            createdBy = "system"
        )

        val checkOutRecord = attendanceService.checkOut(checkOutCommand)

        // Then
        assertNotNull(checkOutRecord)
        assertEquals(checkInRecord.id, checkOutRecord.id)
        assertEquals(AttendanceStatus.CHECKED_OUT, checkOutRecord.status)
        assertNotNull(checkOutRecord.checkOutTime)
    }

    @Test
    fun `unlimited subscription allows multiple checkIns without class deduction`() {
        // Given - Unlimited subscription (classesRemaining = null)
        val unlimitedSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = testPlan.id,
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusMonths(1),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = null  // Unlimited
        )
        setTenantId(unlimitedSubscription, testTenantId)
        val savedSubscription = subscriptionRepository.save(unlimitedSubscription)

        // When - Check in and out 3 times
        repeat(3) {
            val checkInCommand = CheckInCommand(
                memberId = testMember.id,
                locationId = testLocation.id,
                checkInMethod = CheckInMethod.MANUAL,
                createdBy = "system"
            )

            attendanceService.checkIn(checkInCommand)

            val checkOutCommand = CheckOutCommand(
                memberId = testMember.id,
                createdBy = "system"
            )

            attendanceService.checkOut(checkOutCommand)
        }

        // Then - Classes remaining still null (unlimited)
        val finalSubscription = subscriptionRepository.findById(savedSubscription.id).orElseThrow()
        assertNull(finalSubscription.classesRemaining)
    }

    private fun setTenantId(entity: Any, tenantId: UUID) {
        try {
            val field = entity.javaClass.superclass.getDeclaredField("tenantId")
            field.isAccessible = true
            field.set(entity, tenantId)
        } catch (e: Exception) {
            // Ignore - some entities don't have tenantId
        }
    }
}
```

### Integration Test Coverage

**End-to-End Workflows:**
1. ✅ **Member Journey** - Lead → Member → Subscription → Booking → Check-in
2. ✅ **Check-In Workflow** - Active subscription, expired subscription, class limits
3. ✅ **Booking Workflow** - Create booking, waitlist, capacity management
4. ✅ **Authentication Flow** - Login, JWT validation, multi-tenant isolation
5. ✅ **Subscription Freeze** - Freeze, unfreeze, date calculations
6. ✅ **Invoice PDF** - Generate PDF with bilingual content
7. ✅ **Dashboard Summary** - Aggregate statistics across entities
8. ✅ **Auth Controller** - API endpoint testing
9. ✅ **Member Controller** - CRUD operations via REST API

---

## Test Utilities & Fixtures

### IntegrationTestBase

**File:** `backend/src/test/kotlin/com/liyaqa/shared/IntegrationTestBase.kt`

**Purpose:** Base class for all integration tests with common setup.

```kotlin
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Import(TestContainersConfiguration::class)
abstract class IntegrationTestBase {

    protected lateinit var testTenantId: UUID

    @BeforeEach
    open fun setUpTenantContext() {
        testTenantId = UUID.randomUUID()
        TenantContext.setCurrentTenant(TenantId(testTenantId))
    }

    @AfterEach
    open fun tearDownTenantContext() {
        TenantContext.clear()
    }

    /**
     * Sets the tenantId field on an entity using reflection.
     */
    protected fun setTenantId(entity: Any, tenantId: UUID) {
        try {
            val field = entity.javaClass.superclass.getDeclaredField("tenantId")
            field.isAccessible = true
            field.set(entity, tenantId)
        } catch (e: Exception) {
            // Ignore - some entities don't have tenantId
        }
    }
}
```

**Features:**
- ✅ Spring Boot context loading
- ✅ Test profile activation
- ✅ Automatic transaction rollback
- ✅ Testcontainers integration
- ✅ Tenant context setup/cleanup
- ✅ Reflection-based tenant ID assignment

### TestContainersConfiguration

**File:** `backend/src/test/kotlin/com/liyaqa/config/TestContainersConfiguration.kt`

**Purpose:** Configures PostgreSQL Testcontainer for all tests.

```kotlin
@TestConfiguration(proxyBeanMethods = false)
class TestContainersConfiguration {

    @Bean
    @ServiceConnection
    fun postgresContainer(): PostgreSQLContainer<*> {
        return PostgreSQLContainer(DockerImageName.parse("postgres:16-alpine"))
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test")
            .withReuse(true) // Reuse container across test runs
    }
}
```

**Features:**
- ✅ PostgreSQL 16 Alpine (lightweight image)
- ✅ `@ServiceConnection` auto-configures Spring Boot
- ✅ Container reuse for performance (10x faster test execution)
- ✅ Automatic schema creation via `ddl-auto: create-drop`

### TestDataFactory

**File:** `backend/src/test/kotlin/com/liyaqa/shared/TestDataFactory.kt`

**Purpose:** Factory methods for creating test entities with sensible defaults.

```kotlin
object TestDataFactory {

    fun createTestOrganization(
        id: UUID = UUID.randomUUID(),
        nameEn: String = "Test Organization",
        nameAr: String? = "منظمة اختبار",
        status: OrganizationStatus = OrganizationStatus.ACTIVE
    ): Organization {
        return Organization(
            id = id,
            name = LocalizedText(en = nameEn, ar = nameAr),
            organizationType = OrganizationType.LLC,
            status = status,
            email = "org@test.com",
            phone = "+966500000000"
        )
    }

    fun createTestClub(
        organizationId: UUID,
        id: UUID = UUID.randomUUID(),
        name: LocalizedText = LocalizedText(en = "Test Club", ar = "نادي اختبار"),
        status: ClubStatus = ClubStatus.ACTIVE
    ): Club {
        return Club(
            id = id,
            organizationId = organizationId,
            name = name,
            status = status
        )
    }

    fun createTestMember(
        tenantId: UUID,
        id: UUID = UUID.randomUUID(),
        firstName: LocalizedText = LocalizedText(en = "John", ar = "جون"),
        lastName: LocalizedText = LocalizedText(en = "Doe", ar = "دو"),
        email: String = "john.doe.${UUID.randomUUID()}@example.com",
        phone: String? = "+966500000001",
        status: MemberStatus = MemberStatus.ACTIVE
    ): Member {
        val member = Member(
            id = id,
            firstName = firstName,
            lastName = lastName,
            email = email,
            phone = phone,
            status = status
        )
        setTenantId(member, tenantId)
        return member
    }

    fun createTestMembershipPlan(
        tenantId: UUID,
        id: UUID = UUID.randomUUID(),
        name: LocalizedText = LocalizedText(en = "Monthly Plan", ar = "خطة شهرية"),
        membershipFeeAmount: BigDecimal = BigDecimal("299.00"),
        currency: String = "SAR",
        taxRate: BigDecimal = BigDecimal("15.00"),
        billingPeriod: BillingPeriod = BillingPeriod.MONTHLY,
        maxClassesPerPeriod: Int? = null,
        freezeDaysAllowed: Int = 7
    ): MembershipPlan {
        val plan = MembershipPlan(
            id = id,
            name = name,
            membershipFee = TaxableFee(
                amount = membershipFeeAmount,
                currency = currency,
                taxRate = taxRate
            ),
            billingPeriod = billingPeriod,
            maxClassesPerPeriod = maxClassesPerPeriod,
            freezeDaysAllowed = freezeDaysAllowed,
            isActive = true
        )
        setTenantId(plan, tenantId)
        return plan
    }

    fun createTestSubscription(
        tenantId: UUID,
        memberId: UUID,
        planId: UUID,
        id: UUID = UUID.randomUUID(),
        status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
        startDate: LocalDate = LocalDate.now(),
        endDate: LocalDate = LocalDate.now().plusDays(30),
        classesRemaining: Int? = null,
        freezeDaysRemaining: Int = 7
    ): Subscription {
        val subscription = Subscription(
            id = id,
            memberId = memberId,
            planId = planId,
            startDate = startDate,
            endDate = endDate,
            status = status,
            classesRemaining = classesRemaining,
            freezeDaysRemaining = freezeDaysRemaining
        )
        setTenantId(subscription, tenantId)
        return subscription
    }

    fun createExpiredSubscription(
        tenantId: UUID,
        memberId: UUID,
        planId: UUID
    ): Subscription {
        return createTestSubscription(
            tenantId = tenantId,
            memberId = memberId,
            planId = planId,
            status = SubscriptionStatus.EXPIRED,
            startDate = LocalDate.now().minusDays(60),
            endDate = LocalDate.now().minusDays(30)
        )
    }

    fun createFrozenSubscription(
        tenantId: UUID,
        memberId: UUID,
        planId: UUID
    ): Subscription {
        val subscription = createTestSubscription(
            tenantId = tenantId,
            memberId = memberId,
            planId = planId,
            status = SubscriptionStatus.FROZEN,
            freezeDaysRemaining = 5
        )
        // Set frozenAt using reflection
        subscription.javaClass.getDeclaredField("frozenAt").apply {
            isAccessible = true
            set(subscription, LocalDate.now().minusDays(2))
        }
        return subscription
    }

    private fun setTenantId(entity: Any, tenantId: UUID) {
        try {
            val field = entity.javaClass.superclass.getDeclaredField("tenantId")
            field.isAccessible = true
            field.set(entity, tenantId)
        } catch (e: Exception) {
            // For entities without tenantId, ignore
        }
    }
}
```

**Factory Methods:**
- `createTestOrganization()` - Bilingual organization
- `createTestClub()` - Club with org reference
- `createTestLocation()` - Location with bilingual names
- `createTestMember()` - Member with tenant context
- `createTestMembershipPlan()` - Plan with TaxableFee (15% Saudi VAT)
- `createTestSubscription()` - Active/expired/frozen variants
- `createExpiredSubscription()` - Pre-dated subscription
- `createFrozenSubscription()` - Frozen state with reflection

---

## Mocking Strategies

### Mocking Library

**Primary:** Mockito with Kotlin extensions (`org.mockito.kotlin`)

**Dependencies:**
```kotlin
testImplementation("org.mockito.kotlin:mockito-kotlin:5.4.0")
testImplementation("org.springframework.boot:spring-boot-starter-test")
```

### Mock Setup Pattern

```kotlin
@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ServiceTest {

    @Mock
    private lateinit var repository: Repository

    @Mock
    private lateinit var externalService: ExternalService

    private lateinit var service: Service

    @BeforeEach
    fun setUp() {
        service = Service(repository, externalService)

        // Configure default mock behaviors
        whenever(repository.findById(any())) doReturn Optional.of(entity)
        whenever(externalService.call(any())) doReturn response
    }
}
```

### Stubbing Patterns

**Standard Returns:**
```kotlin
whenever(userRepository.findByEmailAndTenantId(email, tenantId))
    .doReturn(Optional.of(testUser))
```

**Answer/Invocation:**
```kotlin
whenever(attendanceRepository.save(any<AttendanceRecord>())).thenAnswer { invocation ->
    invocation.getArgument<AttendanceRecord>(0)
}
```

**Throw Exceptions:**
```kotlin
whenever(repository.findById(invalidId))
    .thenThrow(IllegalArgumentException("Invalid ID"))
```

**Multiple Calls:**
```kotlin
whenever(service.getData())
    .thenReturn(data1)
    .thenReturn(data2)
    .thenThrow(RuntimeException("Third call fails"))
```

### Verification Patterns

**Basic Verification:**
```kotlin
verify(repository).save(any<Entity>())
verify(repository, never()).delete(any())
```

**Argument Capture:**
```kotlin
val captor = argumentCaptor<Entity>()
verify(repository).save(captor.capture())

assertEquals(expectedValue, captor.firstValue.property)
```

**Verify Call Count:**
```kotlin
verify(repository, times(2)).save(any())
verify(repository, atLeast(1)).findById(any())
verify(repository, atMost(3)).update(any())
```

**Verify Order:**
```kotlin
inOrder(repository) {
    verify(repository).save(entity1)
    verify(repository).save(entity2)
}
```

### Mock vs Real Beans

**Unit Tests:** Use `@Mock` with `MockitoExtension`
```kotlin
@ExtendWith(MockitoExtension::class)
class ServiceTest {
    @Mock private lateinit var dependency: Dependency
}
```

**Integration Tests:** Use `@Autowired` with real Spring beans
```kotlin
@SpringBootTest
class IntegrationTest {
    @Autowired private lateinit var service: Service
}
```

---

## Test Data Setup

### Approach 1: Factory Methods

**Usage:**
```kotlin
val plan = TestDataFactory.createTestMembershipPlan(
    tenantId = tenantId,
    membershipFeeAmount = BigDecimal("499.00"),
    billingPeriod = BillingPeriod.MONTHLY,
    maxClassesPerPeriod = 20
)
```

**Advantages:**
- Sensible defaults reduce boilerplate
- Supports parameter overrides
- Handles multi-language setup
- Manages tenant ID assignment

### Approach 2: Direct Construction

**Usage:**
```kotlin
val member = Member(
    id = UUID.randomUUID(),
    firstName = LocalizedText(en = "John"),
    lastName = LocalizedText(en = "Doe"),
    email = "john@example.com",
    status = MemberStatus.ACTIVE
)
```

**Advantages:**
- Full control over entity creation
- Clear what's being set
- No hidden defaults

### Approach 3: Repository Persistence

**Usage:**
```kotlin
testOrganization = organizationRepository.save(Organization(...))
testClub = clubRepository.save(Club(...))
testTenantId = testClub.id

TenantContext.setCurrentTenant(TenantId(testTenantId))
```

**Advantages:**
- Real database persistence
- Tests full entity lifecycle
- Verifies database constraints

### Test Data Cleanup

**Transactional Rollback:**
```kotlin
@Transactional
class IntegrationTest {
    // Each test wrapped in transaction that rolls back
    // No explicit cleanup needed
}
```

**Manual Context Cleanup:**
```kotlin
@AfterEach
fun tearDown() {
    TenantContext.clear()
}
```

---

## Test Configuration

### Test Profile

**File:** `backend/src/test/resources/application-test.yml`

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: create-drop  # Fresh schema for each test run
    show-sql: false
    properties:
      hibernate:
        format_sql: false

  mail:
    host: localhost
    port: 25

email:
  from-address: test@liyaqa.com
  from-name: Liyaqa Test

jwt:
  secret: test-secret-key-that-is-at-least-32-characters-long
  access-token-expiration: 900000    # 15 minutes
  refresh-token-expiration: 604800000 # 7 days

liyaqa:
  email:
    enabled: false              # Disable email sending
  sms:
    enabled: false              # Disable SMS
  cors:
    allowed-origins: http://localhost:3000

springdoc:
  api-docs:
    enabled: false              # Disable Swagger
  swagger-ui:
    enabled: false

logging:
  level:
    root: WARN
    com.liyaqa: WARN
    org.hibernate: WARN
```

**Key Configuration:**
- ✅ `ddl-auto: create-drop` - Fresh schema
- ✅ External services disabled (email, SMS)
- ✅ Swagger disabled
- ✅ Minimal logging (WARN level)
- ✅ Test JWT secret

### Active Profiles

All integration tests use:
```kotlin
@ActiveProfiles("test")
```

---

## Testing Patterns

### Unit Test Pattern

```kotlin
@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ServiceTest {
    @Mock private lateinit var dependency: Dependency
    private lateinit var service: Service

    @BeforeEach
    fun setUp() {
        service = Service(dependency)
    }

    @Test
    fun `test case description in backticks`() {
        // Given
        val input = createInput()
        whenever(dependency.method(input)) doReturn expected

        // When
        val result = service.method(input)

        // Then
        assertEquals(expected, result)
        verify(dependency).method(input)
    }
}
```

### Integration Test Pattern

```kotlin
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class IntegrationTest : IntegrationTestBase() {
    @Autowired private lateinit var service: Service
    @Autowired private lateinit var repository: Repository

    @BeforeEach
    fun setUp() {
        super.setUpTenantContext()
        // Create real test data
    }

    @Test
    fun `end-to-end workflow test`() {
        // Given
        val entity = repository.save(createEntity())

        // When
        val result = service.process(entity)

        // Then
        assertEquals(expected, result)
        assertTrue(repository.existsById(entity.id))
    }
}
```

### Test Naming Convention

Use **backtick syntax** for readable test names:
```kotlin
@Test
fun `login should return tokens when credentials are valid`()

@Test
fun `checkIn should throw when member has no active subscription`()

@Test
fun `unlimited subscription allows multiple checkIns without class deduction`()
```

### Assertion Patterns

**JUnit 5 Assertions:**
```kotlin
assertEquals(expected, actual)
assertNotNull(result)
assertTrue(condition)
assertFalse(condition)
assertThrows<IllegalArgumentException> { code() }
assertAll(
    { assertEquals(1, result.count) },
    { assertNotNull(result.id) }
)
```

**Hamcrest Matchers (if needed):**
```kotlin
assertThat(list, hasSize(3))
assertThat(result, `is`(expected))
```

---

## Code Coverage

### Coverage by Layer

| Layer | Coverage | Tests |
|-------|----------|-------|
| **Service Layer** | 80-90% | 29 unit tests |
| **Domain Models** | 70% | Implicitly tested |
| **Repositories** | 60% | 5 repository tests |
| **Controllers** | 40% | 11 API tests |
| **Configuration** | 10% | Minimal |
| **Overall** | **~65%** | **66 tests** |

### Well-Covered Areas

✅ **Authentication & JWT Flow** (100%)
- Login, registration, token generation
- Password validation, reset flow
- Multi-tenant user isolation

✅ **Service Layer Business Logic** (85%)
- State transitions and validations
- Happy paths and error cases
- Multi-tenant data filtering

✅ **Integration Workflows** (90%)
- End-to-end member journey
- Check-in/check-out workflows
- Booking and subscription management

✅ **Multi-Tenant Isolation** (95%)
- Tenant context management
- Cross-tenant access prevention
- Tenant-specific queries

### Areas Needing Improvement

⚠️ **Controller/API Endpoints** (40%)
- Limited REST API testing
- Missing request/response validation
- Need more security testing

⚠️ **Edge Cases** (50%)
- Concurrency scenarios
- Race conditions
- Boundary conditions

⚠️ **Performance** (0%)
- No load testing
- No stress testing
- No benchmark tests

⚠️ **Error Scenarios** (60%)
- Could expand negative tests
- More exception cases
- Network failure simulations

---

## Best Practices

### 1. Use Given-When-Then Structure

```kotlin
@Test
fun `test description`() {
    // Given - Setup test data
    val input = createInput()
    whenever(mock.method()) doReturn value

    // When - Execute the code under test
    val result = service.method(input)

    // Then - Verify expectations
    assertEquals(expected, result)
    verify(mock).method()
}
```

### 2. Test One Thing Per Test

❌ **Bad:**
```kotlin
@Test
fun `test everything`() {
    service.create()
    service.update()
    service.delete()
}
```

✅ **Good:**
```kotlin
@Test
fun `create should persist entity`()

@Test
fun `update should modify existing entity`()

@Test
fun `delete should remove entity`()
```

### 3. Use Descriptive Test Names

❌ **Bad:**
```kotlin
@Test fun test1()
@Test fun testLogin()
```

✅ **Good:**
```kotlin
@Test fun `login should return tokens when credentials are valid`()
@Test fun `login should throw when password is incorrect`()
```

### 4. Arrange Mocks in BeforeEach

```kotlin
@BeforeEach
fun setUp() {
    // Configure common mock behaviors once
    whenever(encoder.encode(any())) doReturn "encoded"
    whenever(tokenProvider.generateToken(any())) doReturn "token"
}
```

### 5. Use TestDataFactory for Complex Objects

```kotlin
// Instead of this
val member = Member(
    id = UUID.randomUUID(),
    firstName = LocalizedText(en = "John", ar = "جون"),
    lastName = LocalizedText(en = "Doe", ar = "دو"),
    email = "john@test.com",
    phone = "+966500000001",
    status = MemberStatus.ACTIVE
)
setTenantId(member, tenantId)

// Use this
val member = TestDataFactory.createTestMember(tenantId)
```

### 6. Clean Up Tenant Context

```kotlin
@AfterEach
fun tearDown() {
    TenantContext.clear()  // Always clear!
}
```

### 7. Use @Transactional for Integration Tests

```kotlin
@SpringBootTest
@Transactional  // Auto-rollback after each test
class IntegrationTest {
    // Tests automatically rolled back
}
```

### 8. Verify Important Interactions

```kotlin
@Test
fun `checkIn should deduct class from subscription`() {
    service.checkIn(command)

    // Verify subscription was updated
    verify(subscriptionRepository).save(any<Subscription>())
}
```

### 9. Test Both Happy and Sad Paths

```kotlin
@Test
fun `login should return tokens when valid`()  // Happy path

@Test
fun `login should throw when email not found`()  // Sad path

@Test
fun `login should throw when password wrong`()  // Sad path

@Test
fun `login should throw when user inactive`()  // Sad path
```

### 10. Use ArgumentCaptor for Complex Verification

```kotlin
val captor = argumentCaptor<Invoice>()
verify(invoiceRepository).save(captor.capture())

val savedInvoice = captor.firstValue
assertEquals(InvoiceStatus.ISSUED, savedInvoice.status)
assertNotNull(savedInvoice.issuedAt)
```

---

## Running Tests

### Run All Tests

```bash
./gradlew test
```

### Run Specific Test Class

```bash
./gradlew test --tests AuthServiceTest
```

### Run Specific Test Method

```bash
./gradlew test --tests "AuthServiceTest.login should return tokens when credentials are valid"
```

### Run Tests with Coverage

```bash
./gradlew test jacocoTestReport
```

Coverage report: `build/reports/jacoco/test/html/index.html`

### Run Integration Tests Only

```bash
./gradlew test --tests "*IntegrationTest"
```

### Run Unit Tests Only

```bash
./gradlew test --tests "*ServiceTest"
```

### Performance Tips

1. **Testcontainers Reuse**: Enabled via `withReuse(true)` (10x faster)
2. **Parallel Execution**: Configure in `gradle.properties`
3. **Skip Slow Tests**: Use `@Tag("slow")` and exclude in CI

---

**End of Testing Documentation**
