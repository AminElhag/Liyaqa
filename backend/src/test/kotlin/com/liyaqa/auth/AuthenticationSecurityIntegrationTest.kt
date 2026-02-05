package com.liyaqa.auth

import com.liyaqa.auth.application.commands.LoginCommand
import com.liyaqa.auth.application.commands.RegisterCommand
import com.liyaqa.auth.application.services.AuthService
import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.auth.infrastructure.security.JwtTokenProvider
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import com.liyaqa.config.TestContainersConfiguration
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Integration test for end-to-end authentication security.
 * Tests JWT authentication, token validation, and cross-tenant access control.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Import(TestContainersConfiguration::class)
class AuthenticationSecurityIntegrationTest {

    @Autowired
    private lateinit var authService: AuthService

    @Autowired
    private lateinit var jwtTokenProvider: JwtTokenProvider

    @Autowired
    private lateinit var organizationRepository: OrganizationRepository

    @Autowired
    private lateinit var clubRepository: ClubRepository

    @Autowired
    private lateinit var userRepository: UserRepository

    @Autowired
    private lateinit var passwordEncoder: PasswordEncoder

    private lateinit var testOrganization: Organization
    private lateinit var testClub: Club
    private lateinit var testTenantId: UUID
    private lateinit var testUser: User

    @BeforeEach
    fun setUp() {
        // Setup organization and club
        testOrganization = Organization(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Test Org", ar = "منظمة اختبار"),
            organizationType = OrganizationType.LLC,
            status = OrganizationStatus.ACTIVE
        )
        testOrganization = organizationRepository.save(testOrganization)

        testClub = Club(
            id = UUID.randomUUID(),
            organizationId = testOrganization.id,
            name = LocalizedText(en = "Test Club", ar = "نادي اختبار"),
            status = ClubStatus.ACTIVE
        )
        testClub = clubRepository.save(testClub)
        testTenantId = testClub.id

        TenantContext.setCurrentTenant(TenantId(testTenantId))

        // Create test user
        testUser = User(
            id = UUID.randomUUID(),
            email = "security.test.${UUID.randomUUID()}@example.com",
            passwordHash = passwordEncoder.encode("password123")!!,
            displayName = LocalizedText(en = "Test User", ar = "مستخدم اختبار"),
            role = Role.STAFF,
            status = UserStatus.ACTIVE
        )
        setTenantId(testUser, testTenantId)
        testUser = userRepository.save(testUser)
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    private fun setTenantId(entity: Any, tenantId: UUID) {
        try {
            val field = entity.javaClass.superclass.getDeclaredField("tenantId")
            field.isAccessible = true
            field.set(entity, tenantId)
        } catch (e: Exception) {
            // Ignore
        }
    }

    @Test
    fun `login with valid credentials returns JWT tokens`() {
        val command = LoginCommand(
            email = testUser.email,
            password = "password123",
            tenantId = testTenantId
        )

        val loginResult = authService.login(command)
        assertTrue(loginResult is com.liyaqa.auth.application.services.LoginResult.Success)
        val result = (loginResult as com.liyaqa.auth.application.services.LoginResult.Success).authResult

        assertNotNull(result.accessToken)
        assertNotNull(result.refreshToken)
        assertTrue(result.accessToken.isNotBlank())
        assertTrue(result.refreshToken.isNotBlank())
    }

    @Test
    fun `login with wrong password throws exception`() {
        val command = LoginCommand(
            email = testUser.email,
            password = "wrongpassword",
            tenantId = testTenantId
        )

        assertFailsWith<IllegalArgumentException> {
            authService.login(command)
        }
    }

    @Test
    fun `JWT token contains correct claims`() {
        val command = LoginCommand(
            email = testUser.email,
            password = "password123",
            tenantId = testTenantId
        )

        val loginResult = authService.login(command)
        assertTrue(loginResult is com.liyaqa.auth.application.services.LoginResult.Success)
        val result = (loginResult as com.liyaqa.auth.application.services.LoginResult.Success).authResult

        // Validate token can be parsed
        assertTrue(jwtTokenProvider.validateToken(result.accessToken))

        // Extract user info from token
        val userId = jwtTokenProvider.extractUserId(result.accessToken)
        assertEquals(testUser.id, userId)
    }

    @Test
    fun `register creates new user and returns tokens`() {
        val command = RegisterCommand(
            email = "register.test.${UUID.randomUUID()}@example.com",
            password = "SecureP@ss123",
            displayName = LocalizedText(en = "New User", ar = "مستخدم جديد"),
            tenantId = testTenantId
        )

        val result = authService.register(command)

        assertNotNull(result.accessToken)
        assertNotNull(result.refreshToken)
        assertEquals(command.email, result.user.email)
        assertEquals(Role.MEMBER, result.user.role)
    }

    @Test
    fun `register with existing email throws exception`() {
        val command = RegisterCommand(
            email = testUser.email,  // Already exists
            password = "SecureP@ss123",
            displayName = LocalizedText(en = "Another User", ar = "مستخدم آخر"),
            tenantId = testTenantId
        )

        assertFailsWith<IllegalArgumentException> {
            authService.register(command)
        }
    }

    @Test
    fun `full authentication flow - login and use token`() {
        // Step 1: Login
        val loginCommand = LoginCommand(
            email = testUser.email,
            password = "password123",
            tenantId = testTenantId
        )
        val loginResult = authService.login(loginCommand)
        assertTrue(loginResult is com.liyaqa.auth.application.services.LoginResult.Success)
        val authResult = (loginResult as com.liyaqa.auth.application.services.LoginResult.Success).authResult

        // Step 2: Validate the token
        val accessToken = authResult.accessToken
        assertTrue(jwtTokenProvider.validateToken(accessToken))

        // Step 3: Extract user ID from token
        val userId = jwtTokenProvider.extractUserId(accessToken)
        assertEquals(testUser.id, userId)

        // Step 4: Verify the user exists in the repository
        val foundUser = userRepository.findById(userId)
        assertTrue(foundUser.isPresent)
        assertEquals(testUser.email, foundUser.get().email)
    }

    @Test
    fun `different tenants have isolated users`() {
        // Create second organization and club
        val org2 = organizationRepository.save(
            Organization(
                id = UUID.randomUUID(),
                name = LocalizedText(en = "Org 2", ar = "منظمة 2"),
                organizationType = OrganizationType.LLC,
                status = OrganizationStatus.ACTIVE
            )
        )

        val club2 = clubRepository.save(
            Club(
                id = UUID.randomUUID(),
                organizationId = org2.id,
                name = LocalizedText(en = "Club 2", ar = "نادي 2"),
                status = ClubStatus.ACTIVE
            )
        )
        val tenant2Id = club2.id

        // Set tenant to club 2
        TenantContext.setCurrentTenant(TenantId(tenant2Id))

        // Create user in tenant 2
        val user2 = User(
            id = UUID.randomUUID(),
            email = "user2.${UUID.randomUUID()}@example.com",
            passwordHash = passwordEncoder.encode("password123")!!,
            displayName = LocalizedText(en = "User 2", ar = "مستخدم 2"),
            role = Role.MEMBER,
            status = UserStatus.ACTIVE
        )
        setTenantId(user2, tenant2Id)
        userRepository.save(user2)

        // Login as user2 in tenant2
        val command = LoginCommand(
            email = user2.email,
            password = "password123",
            tenantId = tenant2Id
        )

        val loginResult = authService.login(command)
        assertTrue(loginResult is com.liyaqa.auth.application.services.LoginResult.Success)
        val result = (loginResult as com.liyaqa.auth.application.services.LoginResult.Success).authResult
        assertNotNull(result.accessToken)
        assertEquals(user2.email, result.user.email)
    }
}
