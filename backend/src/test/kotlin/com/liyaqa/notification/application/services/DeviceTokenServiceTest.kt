package com.liyaqa.notification.application.services

import com.liyaqa.notification.domain.model.DeviceToken
import com.liyaqa.notification.domain.model.DevicePlatform
import com.liyaqa.notification.domain.ports.DeviceTokenRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.*
import org.mockito.quality.Strictness
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DeviceTokenServiceTest {

    @Mock
    private lateinit var deviceTokenRepository: DeviceTokenRepository

    private lateinit var deviceTokenService: DeviceTokenService

    private val testMemberId = UUID.randomUUID()
    private val testTenantId = UUID.randomUUID()
    private val testToken = "fcm-token-12345"
    private val testDeviceName = "iPhone 13 Pro"
    private val testAppVersion = "1.0.0"

    @BeforeEach
    fun setUp() {
        deviceTokenService = DeviceTokenService(deviceTokenRepository)
    }

    // ===== registerToken Tests =====

    @Test
    fun `registerToken should create new token when token does not exist`() {
        // Given
        whenever(deviceTokenRepository.findByToken(testToken)) doReturn null
        whenever(deviceTokenRepository.save(any<DeviceToken>())).thenAnswer { it.getArgument(0) }

        // When
        val result = deviceTokenService.registerToken(
            memberId = testMemberId,
            token = testToken,
            platform = DevicePlatform.IOS,
            tenantId = testTenantId,
            deviceName = testDeviceName,
            appVersion = testAppVersion
        )

        // Then
        assertNotNull(result)
        assertEquals(testMemberId, result.memberId)
        assertEquals(testToken, result.token)
        assertEquals(DevicePlatform.IOS, result.platform)
        assertEquals(testTenantId, result.tenantId)
        assertEquals(testDeviceName, result.deviceName)
        assertEquals(testAppVersion, result.appVersion)

        verify(deviceTokenRepository).findByToken(testToken)
        verify(deviceTokenRepository).save(any<DeviceToken>())
    }

    @Test
    fun `registerToken should update existing token when token already exists`() {
        // Given
        val existingToken = DeviceToken(
            memberId = testMemberId,
            token = testToken,
            platform = DevicePlatform.IOS,
            tenantId = testTenantId,
            deviceName = testDeviceName,
            appVersion = testAppVersion
        )

        whenever(deviceTokenRepository.findByToken(testToken)) doReturn existingToken
        whenever(deviceTokenRepository.save(any<DeviceToken>())).thenAnswer { it.getArgument(0) }

        // When
        val result = deviceTokenService.registerToken(
            memberId = testMemberId,
            token = testToken,
            platform = DevicePlatform.IOS,
            tenantId = testTenantId
        )

        // Then
        assertNotNull(result)
        assertEquals(testToken, result.token)

        // Verify updateLastUsed was called (lastUsedAt changed)
        verify(deviceTokenRepository).findByToken(testToken)
        verify(deviceTokenRepository).save(existingToken)
    }

    @Test
    fun `registerToken should handle ANDROID platform`() {
        // Given
        whenever(deviceTokenRepository.findByToken(testToken)) doReturn null
        whenever(deviceTokenRepository.save(any<DeviceToken>())).thenAnswer { it.getArgument(0) }

        // When
        val result = deviceTokenService.registerToken(
            memberId = testMemberId,
            token = testToken,
            platform = DevicePlatform.ANDROID,
            tenantId = testTenantId,
            deviceName = "Samsung Galaxy S21"
        )

        // Then
        assertEquals(DevicePlatform.ANDROID, result.platform)
        assertEquals("Samsung Galaxy S21", result.deviceName)
    }

    @Test
    fun `registerToken should handle optional fields`() {
        // Given
        whenever(deviceTokenRepository.findByToken(testToken)) doReturn null
        whenever(deviceTokenRepository.save(any<DeviceToken>())).thenAnswer { it.getArgument(0) }

        // When
        val result = deviceTokenService.registerToken(
            memberId = testMemberId,
            token = testToken,
            platform = DevicePlatform.IOS,
            tenantId = testTenantId
            // deviceName and appVersion omitted
        )

        // Then
        assertNull(result.deviceName)
        assertNull(result.appVersion)
    }

    // ===== unregisterToken Tests =====

    @Test
    fun `unregisterToken should delete token when it exists`() {
        // Given
        whenever(deviceTokenRepository.existsByToken(testToken)) doReturn true

        // When
        deviceTokenService.unregisterToken(testToken)

        // Then
        verify(deviceTokenRepository).existsByToken(testToken)
        verify(deviceTokenRepository).deleteByToken(testToken)
    }

    @Test
    fun `unregisterToken should not delete when token does not exist`() {
        // Given
        whenever(deviceTokenRepository.existsByToken(testToken)) doReturn false

        // When
        deviceTokenService.unregisterToken(testToken)

        // Then
        verify(deviceTokenRepository).existsByToken(testToken)
        verify(deviceTokenRepository, never()).deleteByToken(any())
    }

    // ===== unregisterAllTokensForMember Tests =====

    @Test
    fun `unregisterAllTokensForMember should delete all tokens for member`() {
        // Given
        // No setup needed

        // When
        deviceTokenService.unregisterAllTokensForMember(testMemberId)

        // Then
        verify(deviceTokenRepository).deleteByMemberId(testMemberId)
    }

    @Test
    fun `unregisterAllTokensForMember should handle member with no tokens`() {
        // Given
        // Repository will just delete nothing

        // When
        deviceTokenService.unregisterAllTokensForMember(testMemberId)

        // Then
        verify(deviceTokenRepository).deleteByMemberId(testMemberId)
    }

    // ===== getTokensForMember Tests =====

    @Test
    fun `getTokensForMember should return all tokens for member`() {
        // Given
        val token1 = createTestToken(platform = DevicePlatform.IOS)
        val token2 = createTestToken(platform = DevicePlatform.ANDROID)
        val tokens = listOf(token1, token2)

        whenever(deviceTokenRepository.findByMemberId(testMemberId)) doReturn tokens

        // When
        val result = deviceTokenService.getTokensForMember(testMemberId)

        // Then
        assertEquals(2, result.size)
        assertEquals(tokens, result)
        verify(deviceTokenRepository).findByMemberId(testMemberId)
    }

    @Test
    fun `getTokensForMember should return empty list when member has no tokens`() {
        // Given
        whenever(deviceTokenRepository.findByMemberId(testMemberId)) doReturn emptyList()

        // When
        val result = deviceTokenService.getTokensForMember(testMemberId)

        // Then
        assertTrue(result.isEmpty())
        verify(deviceTokenRepository).findByMemberId(testMemberId)
    }

    // ===== getTokensForTenant Tests =====

    @Test
    fun `getTokensForTenant should return all tokens for tenant`() {
        // Given
        val token1 = createTestToken()
        val token2 = createTestToken()
        val token3 = createTestToken()
        val tokens = listOf(token1, token2, token3)

        whenever(deviceTokenRepository.findByTenantId(testTenantId)) doReturn tokens

        // When
        val result = deviceTokenService.getTokensForTenant(testTenantId)

        // Then
        assertEquals(3, result.size)
        assertEquals(tokens, result)
        verify(deviceTokenRepository).findByTenantId(testTenantId)
    }

    @Test
    fun `getTokensForTenant should return empty list when tenant has no tokens`() {
        // Given
        whenever(deviceTokenRepository.findByTenantId(testTenantId)) doReturn emptyList()

        // When
        val result = deviceTokenService.getTokensForTenant(testTenantId)

        // Then
        assertTrue(result.isEmpty())
        verify(deviceTokenRepository).findByTenantId(testTenantId)
    }

    // ===== cleanupStaleTokens Tests =====

    @Test
    fun `cleanupStaleTokens should call repository with 90 day threshold`() {
        // Given
        // No setup needed

        // When
        deviceTokenService.cleanupStaleTokens()

        // Then
        verify(deviceTokenRepository).deleteStaleTokens(90)
    }

    // ===== Edge Cases and Integration Tests =====

    @Test
    fun `registerToken should handle different members with same token properly`() {
        // Given - Token exists for different member
        val differentMemberId = UUID.randomUUID()
        val existingToken = createTestToken(memberId = differentMemberId)

        whenever(deviceTokenRepository.findByToken(testToken)) doReturn existingToken
        whenever(deviceTokenRepository.save(any<DeviceToken>())).thenAnswer { it.getArgument(0) }

        // When - Registering same token for original member
        val result = deviceTokenService.registerToken(
            memberId = testMemberId, // Different member!
            token = testToken,
            platform = DevicePlatform.IOS,
            tenantId = testTenantId
        )

        // Then - Should update existing token (updateLastUsed)
        assertEquals(testToken, result.token)
        assertEquals(differentMemberId, result.memberId) // Keeps original member
        verify(deviceTokenRepository).save(existingToken)
    }

    @Test
    fun `registerToken should handle multiple devices for same member`() {
        // Given
        val token1 = "token-device-1"
        val token2 = "token-device-2"

        whenever(deviceTokenRepository.findByToken(token1)) doReturn null
        whenever(deviceTokenRepository.findByToken(token2)) doReturn null
        whenever(deviceTokenRepository.save(any<DeviceToken>())).thenAnswer { it.getArgument(0) }

        // When
        val result1 = deviceTokenService.registerToken(
            memberId = testMemberId,
            token = token1,
            platform = DevicePlatform.IOS,
            tenantId = testTenantId
        )

        val result2 = deviceTokenService.registerToken(
            memberId = testMemberId,
            token = token2,
            platform = DevicePlatform.ANDROID,
            tenantId = testTenantId
        )

        // Then
        assertEquals(token1, result1.token)
        assertEquals(token2, result2.token)
        assertEquals(testMemberId, result1.memberId)
        assertEquals(testMemberId, result2.memberId)
        verify(deviceTokenRepository, times(2)).save(any<DeviceToken>())
    }

    @Test
    fun `unregisterToken should handle empty token string`() {
        // Given
        val emptyToken = ""
        whenever(deviceTokenRepository.existsByToken(emptyToken)) doReturn false

        // When
        deviceTokenService.unregisterToken(emptyToken)

        // Then
        verify(deviceTokenRepository).existsByToken(emptyToken)
        verify(deviceTokenRepository, never()).deleteByToken(any())
    }

    @Test
    fun `getTokensForMember should return tokens in order from repository`() {
        // Given
        val token1 = createTestToken(platform = DevicePlatform.IOS, deviceName = "Device 1")
        val token2 = createTestToken(platform = DevicePlatform.ANDROID, deviceName = "Device 2")
        val token3 = createTestToken(platform = DevicePlatform.IOS, deviceName = "Device 3")
        val tokens = listOf(token1, token2, token3)

        whenever(deviceTokenRepository.findByMemberId(testMemberId)) doReturn tokens

        // When
        val result = deviceTokenService.getTokensForMember(testMemberId)

        // Then
        assertEquals(3, result.size)
        assertEquals("Device 1", result[0].deviceName)
        assertEquals("Device 2", result[1].deviceName)
        assertEquals("Device 3", result[2].deviceName)
    }

    // ===== Helper Methods =====

    private fun createTestToken(
        memberId: UUID = testMemberId,
        token: String = testToken,
        platform: DevicePlatform = DevicePlatform.IOS,
        tenantId: UUID = testTenantId,
        deviceName: String? = testDeviceName,
        appVersion: String? = testAppVersion
    ) = DeviceToken(
        memberId = memberId,
        token = token,
        platform = platform,
        tenantId = tenantId,
        deviceName = deviceName,
        appVersion = appVersion
    )
}
