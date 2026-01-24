package com.liyaqa.auth.application.services

import com.liyaqa.auth.application.commands.ChangePasswordCommand
import com.liyaqa.auth.application.commands.LoginCommand
import com.liyaqa.auth.application.commands.RegisterCommand
import com.liyaqa.auth.domain.model.RefreshToken
import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.auth.domain.ports.PasswordResetTokenRepository
import com.liyaqa.auth.domain.ports.RefreshTokenRepository
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.auth.infrastructure.security.JwtTokenProvider
import com.liyaqa.shared.application.services.PermissionService
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.infrastructure.email.EmailService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.security.crypto.password.PasswordEncoder
import java.time.Instant
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    @Mock
    private lateinit var userRepository: UserRepository

    @Mock
    private lateinit var refreshTokenRepository: RefreshTokenRepository

    @Mock
    private lateinit var passwordResetTokenRepository: PasswordResetTokenRepository

    @Mock
    private lateinit var jwtTokenProvider: JwtTokenProvider

    @Mock
    private lateinit var passwordEncoder: PasswordEncoder

    @Mock
    private lateinit var emailService: EmailService

    @Mock
    private lateinit var permissionService: PermissionService

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
            permissionService
        )

        // Common mocks
        whenever(passwordEncoder.encode(any())) doReturn encodedPassword
        whenever(passwordEncoder.matches(testPassword, encodedPassword)) doReturn true
        whenever(jwtTokenProvider.generateAccessToken(any<User>(), any())) doReturn "access-token"
        whenever(jwtTokenProvider.generateRefreshToken(any())) doReturn Pair("refresh-token", "token-hash")
        whenever(jwtTokenProvider.getAccessTokenExpirationMs()) doReturn 900000L
        whenever(jwtTokenProvider.getRefreshTokenExpirationMs()) doReturn 604800000L
        whenever(permissionService.getUserPermissionCodes(any())) doReturn emptyList()
    }

    @Test
    fun `login should return AuthResult when credentials are valid`() {
        // Given
        val testUser = createTestUser()
        val command = LoginCommand(
            email = "test@example.com",
            password = testPassword,
            tenantId = testTenantId
        )

        whenever(userRepository.findByEmailAndTenantId(command.email, testTenantId)) doReturn Optional.of(testUser)
        whenever(userRepository.save(any<User>())) doReturn testUser
        whenever(refreshTokenRepository.save(any<RefreshToken>())).thenAnswer { it.getArgument(0) }

        // When
        val result = authService.login(command)

        // Then
        assertNotNull(result)
        assertNotNull(result.accessToken)
        assertNotNull(result.refreshToken)
        assertEquals(testUser.email, result.user.email)
    }

    @Test
    fun `login should throw when email not found`() {
        // Given
        val command = LoginCommand(
            email = "nonexistent@example.com",
            password = testPassword,
            tenantId = testTenantId
        )

        whenever(userRepository.findByEmailAndTenantId(command.email, testTenantId)) doReturn Optional.empty()

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            authService.login(command)
        }
    }

    @Test
    fun `login should throw when password is incorrect`() {
        // Given
        val testUser = createTestUser()
        val command = LoginCommand(
            email = "test@example.com",
            password = "wrong-password",
            tenantId = testTenantId
        )

        whenever(userRepository.findByEmailAndTenantId(command.email, testTenantId)) doReturn Optional.of(testUser)
        whenever(passwordEncoder.matches("wrong-password", encodedPassword)) doReturn false
        whenever(userRepository.save(any<User>())) doReturn testUser

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            authService.login(command)
        }
    }

    @Test
    fun `login should throw when user account is inactive`() {
        // Given
        val inactiveUser = User(
            id = UUID.randomUUID(),
            email = "inactive@example.com",
            passwordHash = encodedPassword,
            displayName = LocalizedText(en = "Inactive User"),
            role = Role.MEMBER,
            status = UserStatus.INACTIVE
        )

        val command = LoginCommand(
            email = "inactive@example.com",
            password = testPassword,
            tenantId = testTenantId
        )

        whenever(userRepository.findByEmailAndTenantId(command.email, testTenantId)) doReturn Optional.of(inactiveUser)

        // When/Then
        assertThrows(IllegalStateException::class.java) {
            authService.login(command)
        }
    }

    @Test
    fun `register should throw when email already exists`() {
        // Given
        val command = RegisterCommand(
            email = "existing@example.com",
            password = testPassword,
            displayName = LocalizedText(en = "Existing User"),
            role = Role.MEMBER,
            tenantId = testTenantId
        )

        whenever(userRepository.existsByEmailAndTenantId(command.email, testTenantId)) doReturn true

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            authService.register(command)
        }

        verify(userRepository, never()).save(any<User>())
    }

    @Test
    fun `changePassword should throw when current password is incorrect`() {
        // Given
        val testUser = createTestUser()
        val command = ChangePasswordCommand(
            userId = testUser.id,
            currentPassword = "wrong-password",
            newPassword = "newPassword123"
        )

        whenever(userRepository.findById(testUser.id)) doReturn Optional.of(testUser)
        whenever(passwordEncoder.matches("wrong-password", encodedPassword)) doReturn false

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            authService.changePassword(command)
        }
    }

    @Test
    fun `getCurrentUser should return user when found`() {
        // Given
        val testUser = createTestUser()
        whenever(userRepository.findById(testUser.id)) doReturn Optional.of(testUser)

        // When
        val result = authService.getCurrentUser(testUser.id)

        // Then
        assertEquals(testUser.id, result.id)
        assertEquals(testUser.email, result.email)
    }

    @Test
    fun `getCurrentUser should throw when user not found`() {
        // Given
        val userId = UUID.randomUUID()
        whenever(userRepository.findById(userId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            authService.getCurrentUser(userId)
        }
    }

    @Test
    fun `logoutAll should revoke all user refresh tokens`() {
        // Given
        val userId = UUID.randomUUID()

        // When
        authService.logoutAll(userId)

        // Then
        verify(refreshTokenRepository).revokeAllByUserId(userId)
    }

    private fun createTestUser() = User(
        id = UUID.randomUUID(),
        email = "test@example.com",
        passwordHash = encodedPassword,
        displayName = LocalizedText(en = "Test User"),
        role = Role.MEMBER,
        status = UserStatus.ACTIVE
    )
}
