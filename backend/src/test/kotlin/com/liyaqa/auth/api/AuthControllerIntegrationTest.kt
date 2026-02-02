package com.liyaqa.auth.api

import com.liyaqa.auth.application.commands.LoginCommand
import com.liyaqa.auth.application.commands.RegisterCommand
import com.liyaqa.auth.application.services.AuthService
import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.config.TestContainersConfiguration
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
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Integration tests for Auth functionality.
 * Tests authentication service operations.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Import(TestContainersConfiguration::class)
class AuthControllerIntegrationTest {

    @Autowired
    private lateinit var authService: AuthService

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
            email = "test.auth.${UUID.randomUUID()}@example.com",
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
    fun `login with valid credentials returns tokens`() {
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
        assertEquals(testUser.email, result.user.email)
    }

    @Test
    fun `login with invalid credentials throws exception`() {
        val command = LoginCommand(
            email = testUser.email,
            password = "wrongpassword",
            tenantId = testTenantId
        )

        assertFailsWith<Exception> {
            authService.login(command)
        }
    }

    @Test
    fun `register with valid data creates user and returns tokens`() {
        val command = RegisterCommand(
            email = "newuser.${UUID.randomUUID()}@example.com",
            password = "password123",
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
            password = "password123",
            displayName = LocalizedText(en = "Another User", ar = "مستخدم آخر"),
            tenantId = testTenantId
        )

        assertFailsWith<IllegalArgumentException> {
            authService.register(command)
        }
    }

    @Test
    fun `login with non-existent user throws exception`() {
        val command = LoginCommand(
            email = "nonexistent@example.com",
            password = "password123",
            tenantId = testTenantId
        )

        assertFailsWith<Exception> {
            authService.login(command)
        }
    }
}
