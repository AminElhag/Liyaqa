package com.liyaqa.shared.application.services

import com.liyaqa.shared.domain.model.RateLimitEntry
import com.liyaqa.shared.domain.ports.RateLimitRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.*
import org.mockito.quality.Strictness
import java.time.Instant
import java.util.Optional

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RateLimitServiceTest {

    @Mock
    private lateinit var rateLimitRepository: RateLimitRepository

    private lateinit var rateLimitService: RateLimitService

    private val testClientKey = "user:test-user-123"
    private val testTier = "API_WRITE"
    private val testLimit = 10

    @BeforeEach
    fun setUp() {
        rateLimitService = RateLimitService(rateLimitRepository)
    }

    // ===== checkAndIncrement Tests - First Request =====

    @Test
    fun `checkAndIncrement should create new entry when no cache and no database entry exists`() {
        // Given
        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.empty()
        whenever(rateLimitRepository.save(any<RateLimitEntry>())).thenAnswer { it.getArgument(0) }

        // When
        val result = rateLimitService.checkAndIncrement(testClientKey, testTier, testLimit)

        // Then
        assertTrue(result.allowed)
        assertEquals(1, result.currentCount)
        assertEquals(testLimit, result.limit)
        assertEquals(testLimit - 1, result.remaining)

        verify(rateLimitRepository).findByClientKeyAndTier(testClientKey, testTier)
        verify(rateLimitRepository).save(any<RateLimitEntry>())
    }

    @Test
    fun `checkAndIncrement should save new entry with correct values on first request`() {
        // Given
        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.empty()
        whenever(rateLimitRepository.save(any<RateLimitEntry>())).thenAnswer { it.getArgument(0) }

        // When
        rateLimitService.checkAndIncrement(testClientKey, testTier, testLimit)

        // Then
        val captor = argumentCaptor<RateLimitEntry>()
        verify(rateLimitRepository).save(captor.capture())
        val savedEntry = captor.firstValue

        assertEquals(testClientKey, savedEntry.clientKey)
        assertEquals(testTier, savedEntry.tier)
        assertEquals(1, savedEntry.requestCount)
        assertNotNull(savedEntry.windowStart)
    }

    // ===== checkAndIncrement Tests - Within Window =====

    @Test
    fun `checkAndIncrement should increment counter when within limit and window`() {
        // Given
        val existingEntry = RateLimitEntry(
            clientKey = testClientKey,
            tier = testTier,
            requestCount = 5,
            windowStart = Instant.now()
        )

        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.of(existingEntry)
        whenever(rateLimitRepository.save(any<RateLimitEntry>())).thenAnswer { it.getArgument(0) }

        // When
        val result = rateLimitService.checkAndIncrement(testClientKey, testTier, testLimit)

        // Then
        assertTrue(result.allowed)
        assertEquals(6, result.currentCount) // Was 5, now 6
        assertEquals(testLimit, result.limit)
        assertEquals(4, result.remaining) // 10 - 6 = 4

        verify(rateLimitRepository).save(any<RateLimitEntry>())
    }

    @Test
    fun `checkAndIncrement should allow request when exactly at limit minus one`() {
        // Given
        val existingEntry = RateLimitEntry(
            clientKey = testClientKey,
            tier = testTier,
            requestCount = testLimit - 1, // 9
            windowStart = Instant.now()
        )

        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.of(existingEntry)
        whenever(rateLimitRepository.save(any<RateLimitEntry>())).thenAnswer { it.getArgument(0) }

        // When
        val result = rateLimitService.checkAndIncrement(testClientKey, testTier, testLimit)

        // Then
        assertTrue(result.allowed)
        assertEquals(testLimit, result.currentCount) // Now at limit
        assertEquals(0, result.remaining)
    }

    // ===== checkAndIncrement Tests - Rate Limited =====

    @Test
    fun `checkAndIncrement should deny request when at limit`() {
        // Given
        val existingEntry = RateLimitEntry(
            clientKey = testClientKey,
            tier = testTier,
            requestCount = testLimit, // Already at limit
            windowStart = Instant.now()
        )

        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.of(existingEntry)

        // When
        val result = rateLimitService.checkAndIncrement(testClientKey, testTier, testLimit)

        // Then
        assertFalse(result.allowed)
        assertEquals(testLimit, result.currentCount)
        assertEquals(0, result.remaining)

        // Should NOT save when rate limited
        verify(rateLimitRepository, never()).save(any())
    }

    @Test
    fun `checkAndIncrement should deny request when over limit`() {
        // Given
        val existingEntry = RateLimitEntry(
            clientKey = testClientKey,
            tier = testTier,
            requestCount = testLimit + 5, // Over limit
            windowStart = Instant.now()
        )

        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.of(existingEntry)

        // When
        val result = rateLimitService.checkAndIncrement(testClientKey, testTier, testLimit)

        // Then
        assertFalse(result.allowed)
        assertEquals(testLimit + 5, result.currentCount)
        assertEquals(0, result.remaining)
        verify(rateLimitRepository, never()).save(any())
    }

    // ===== checkAndIncrement Tests - Expired Window =====

    @Test
    fun `checkAndIncrement should reset window when expired`() {
        // Given - Entry with expired window (2 minutes old)
        val expiredWindowStart = Instant.now().minusMillis(RateLimitService.WINDOW_SIZE_MS + 1000)
        val existingEntry = RateLimitEntry(
            clientKey = testClientKey,
            tier = testTier,
            requestCount = testLimit, // Was at limit
            windowStart = expiredWindowStart
        )

        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.of(existingEntry)
        whenever(rateLimitRepository.save(any<RateLimitEntry>())).thenAnswer { it.getArgument(0) }

        // When
        val result = rateLimitService.checkAndIncrement(testClientKey, testTier, testLimit)

        // Then
        assertTrue(result.allowed) // Window reset, so allowed again
        assertEquals(1, result.currentCount) // Reset to 1
        assertEquals(testLimit - 1, result.remaining)

        // Verify window was reset (saved)
        verify(rateLimitRepository).save(any<RateLimitEntry>())
    }

    @Test
    fun `checkAndIncrement should reset window on exact boundary`() {
        // Given - Entry exactly at window expiration
        val expiredWindowStart = Instant.now().minusMillis(RateLimitService.WINDOW_SIZE_MS)
        val existingEntry = RateLimitEntry(
            clientKey = testClientKey,
            tier = testTier,
            requestCount = 5,
            windowStart = expiredWindowStart
        )

        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.of(existingEntry)
        whenever(rateLimitRepository.save(any<RateLimitEntry>())).thenAnswer { it.getArgument(0) }

        // When
        val result = rateLimitService.checkAndIncrement(testClientKey, testTier, testLimit)

        // Then
        assertTrue(result.allowed)
        assertEquals(1, result.currentCount) // Reset to 1
        verify(rateLimitRepository).save(any<RateLimitEntry>())
    }

    // ===== checkAndIncrement Tests - Cache Behavior =====

    @Test
    fun `checkAndIncrement should use cache on subsequent calls`() {
        // Given - First call populates cache
        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.empty()
        whenever(rateLimitRepository.save(any<RateLimitEntry>())).thenAnswer { it.getArgument(0) }

        // When - Make two calls
        rateLimitService.checkAndIncrement(testClientKey, testTier, testLimit)
        rateLimitService.checkAndIncrement(testClientKey, testTier, testLimit)

        // Then - Repository findByClientKeyAndTier should only be called once (cache hit on second call)
        verify(rateLimitRepository, times(1)).findByClientKeyAndTier(testClientKey, testTier)
        verify(rateLimitRepository, times(2)).save(any<RateLimitEntry>()) // Both calls save
    }

    @Test
    fun `checkAndIncrement should handle different tiers independently`() {
        // Given
        val tier1 = "READ"
        val tier2 = "WRITE"

        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, tier1)) doReturn Optional.empty()
        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, tier2)) doReturn Optional.empty()
        whenever(rateLimitRepository.save(any<RateLimitEntry>())).thenAnswer { it.getArgument(0) }

        // When
        val result1 = rateLimitService.checkAndIncrement(testClientKey, tier1, testLimit)
        val result2 = rateLimitService.checkAndIncrement(testClientKey, tier2, testLimit)

        // Then - Both should be allowed (separate counters)
        assertTrue(result1.allowed)
        assertTrue(result2.allowed)
        assertEquals(1, result1.currentCount)
        assertEquals(1, result2.currentCount)
    }

    @Test
    fun `checkAndIncrement should handle different clients independently`() {
        // Given
        val client1 = "user:client1"
        val client2 = "user:client2"

        whenever(rateLimitRepository.findByClientKeyAndTier(client1, testTier)) doReturn Optional.empty()
        whenever(rateLimitRepository.findByClientKeyAndTier(client2, testTier)) doReturn Optional.empty()
        whenever(rateLimitRepository.save(any<RateLimitEntry>())).thenAnswer { it.getArgument(0) }

        // When
        val result1 = rateLimitService.checkAndIncrement(client1, testTier, testLimit)
        val result2 = rateLimitService.checkAndIncrement(client2, testTier, testLimit)

        // Then - Both should be allowed (separate counters)
        assertTrue(result1.allowed)
        assertTrue(result2.allowed)
        assertEquals(1, result1.currentCount)
        assertEquals(1, result2.currentCount)
    }

    // ===== cleanupExpiredEntries Tests =====

    @Test
    fun `cleanupExpiredEntries should remove old entries from database`() {
        // Given
        val expectedDeleteCount = 5
        whenever(rateLimitRepository.deleteByWindowStartBefore(any())) doReturn expectedDeleteCount

        // When
        rateLimitService.cleanupExpiredEntries()

        // Then
        verify(rateLimitRepository).deleteByWindowStartBefore(any())
    }

    @Test
    fun `cleanupExpiredEntries should calculate correct cutoff time`() {
        // Given
        whenever(rateLimitRepository.deleteByWindowStartBefore(any())) doReturn 0

        // When
        rateLimitService.cleanupExpiredEntries()

        // Then
        val captor = argumentCaptor<Instant>()
        verify(rateLimitRepository).deleteByWindowStartBefore(captor.capture())

        val cutoff = captor.firstValue
        val expectedCutoff = Instant.now().minusMillis(RateLimitService.WINDOW_SIZE_MS * 2)
        val timeDiff = Math.abs(cutoff.toEpochMilli() - expectedCutoff.toEpochMilli())

        // Allow 1 second tolerance for test execution time
        assertTrue(timeDiff < 1000, "Cutoff time should be approximately 2 minutes ago")
    }

    @Test
    fun `cleanupExpiredEntries should not fail when no entries to delete`() {
        // Given
        whenever(rateLimitRepository.deleteByWindowStartBefore(any())) doReturn 0

        // When/Then - Should not throw
        assertDoesNotThrow {
            rateLimitService.cleanupExpiredEntries()
        }

        verify(rateLimitRepository).deleteByWindowStartBefore(any())
    }

    // ===== getStatus Tests =====

    @Test
    fun `getStatus should return entry from cache when cached`() {
        // Given - Populate cache via checkAndIncrement
        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.empty()
        whenever(rateLimitRepository.save(any<RateLimitEntry>())).thenAnswer { it.getArgument(0) }

        rateLimitService.checkAndIncrement(testClientKey, testTier, testLimit)

        // When
        val status = rateLimitService.getStatus(testClientKey, testTier)

        // Then
        assertNotNull(status)
        assertEquals(testClientKey, status?.clientKey)
        assertEquals(testTier, status?.tier)
        assertEquals(1, status?.requestCount)
    }

    @Test
    fun `getStatus should return entry from database when not cached`() {
        // Given - Not in cache, but in database
        val existingEntry = RateLimitEntry(
            clientKey = testClientKey,
            tier = testTier,
            requestCount = 7,
            windowStart = Instant.now()
        )

        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.of(existingEntry)

        // When
        val status = rateLimitService.getStatus(testClientKey, testTier)

        // Then
        assertNotNull(status)
        assertEquals(testClientKey, status?.clientKey)
        assertEquals(7, status?.requestCount)

        verify(rateLimitRepository).findByClientKeyAndTier(testClientKey, testTier)
    }

    @Test
    fun `getStatus should return null when no entry exists`() {
        // Given
        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.empty()

        // When
        val status = rateLimitService.getStatus(testClientKey, testTier)

        // Then
        assertNull(status)
        verify(rateLimitRepository).findByClientKeyAndTier(testClientKey, testTier)
    }

    @Test
    fun `getStatus should not modify entry count`() {
        // Given
        val existingEntry = RateLimitEntry(
            clientKey = testClientKey,
            tier = testTier,
            requestCount = 5,
            windowStart = Instant.now()
        )

        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.of(existingEntry)

        // When
        val status1 = rateLimitService.getStatus(testClientKey, testTier)
        val status2 = rateLimitService.getStatus(testClientKey, testTier)

        // Then - Count should not change
        assertEquals(5, status1?.requestCount)
        assertEquals(5, status2?.requestCount)

        // Should NOT save
        verify(rateLimitRepository, never()).save(any())
    }

    // ===== RateLimitResult Tests =====

    @Test
    fun `RateLimitResult should calculate resetTime correctly`() {
        // Given
        val windowStart = Instant.ofEpochMilli(1000000000L)
        val result = RateLimitResult(
            allowed = true,
            currentCount = 5,
            limit = 10,
            windowStart = windowStart,
            remaining = 5
        )

        // When
        val resetTime = result.resetTime

        // Then
        val expectedResetTime = (windowStart.toEpochMilli() + RateLimitService.WINDOW_SIZE_MS) / 1000
        assertEquals(expectedResetTime, resetTime)
    }

    @Test
    fun `RateLimitResult should have correct remaining calculation for allowed request`() {
        // Given/When
        val result = RateLimitResult(
            allowed = true,
            currentCount = 3,
            limit = 10,
            windowStart = Instant.now(),
            remaining = 7 // 10 - 3
        )

        // Then
        assertTrue(result.allowed)
        assertEquals(7, result.remaining)
    }

    @Test
    fun `RateLimitResult should have zero remaining when rate limited`() {
        // Given/When
        val result = RateLimitResult(
            allowed = false,
            currentCount = 10,
            limit = 10,
            windowStart = Instant.now(),
            remaining = 0
        )

        // Then
        assertFalse(result.allowed)
        assertEquals(0, result.remaining)
    }

    // ===== Edge Cases =====

    @Test
    fun `checkAndIncrement should handle limit of 1`() {
        // Given
        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.empty()
        whenever(rateLimitRepository.save(any<RateLimitEntry>())).thenAnswer { it.getArgument(0) }

        // When - First request
        val result1 = rateLimitService.checkAndIncrement(testClientKey, testTier, 1)

        // Then - First request allowed
        assertTrue(result1.allowed)
        assertEquals(0, result1.remaining)

        // When - Second request (should use cache)
        val result2 = rateLimitService.checkAndIncrement(testClientKey, testTier, 1)

        // Then - Second request denied
        assertFalse(result2.allowed)
        assertEquals(0, result2.remaining)
    }

    @Test
    fun `checkAndIncrement should handle IP-based client keys`() {
        // Given
        val ipClientKey = "ip:192.168.1.100"
        whenever(rateLimitRepository.findByClientKeyAndTier(ipClientKey, testTier)) doReturn Optional.empty()
        whenever(rateLimitRepository.save(any<RateLimitEntry>())).thenAnswer { it.getArgument(0) }

        // When
        val result = rateLimitService.checkAndIncrement(ipClientKey, testTier, testLimit)

        // Then
        assertTrue(result.allowed)
        assertEquals(1, result.currentCount)

        val captor = argumentCaptor<RateLimitEntry>()
        verify(rateLimitRepository).save(captor.capture())
        assertEquals(ipClientKey, captor.firstValue.clientKey)
    }

    @Test
    fun `checkAndIncrement should handle very high limits`() {
        // Given
        val highLimit = 1000000
        whenever(rateLimitRepository.findByClientKeyAndTier(testClientKey, testTier)) doReturn Optional.empty()
        whenever(rateLimitRepository.save(any<RateLimitEntry>())).thenAnswer { it.getArgument(0) }

        // When
        val result = rateLimitService.checkAndIncrement(testClientKey, testTier, highLimit)

        // Then
        assertTrue(result.allowed)
        assertEquals(highLimit - 1, result.remaining)
    }
}
