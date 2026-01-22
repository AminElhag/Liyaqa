package com.liyaqa.member

import com.liyaqa.member.core.localization.LocalizedText
import com.liyaqa.member.data.auth.repository.AuthRepository
import com.liyaqa.member.data.auth.repository.AuthResult
import com.liyaqa.member.data.auth.model.Role
import com.liyaqa.member.data.auth.model.User
import com.liyaqa.member.data.auth.model.UserStatus
import com.liyaqa.member.domain.model.Address
import com.liyaqa.member.domain.model.AvailableSession
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.DashboardData
import com.liyaqa.member.domain.model.EmergencyContact
import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.model.PagedResult
import com.liyaqa.member.domain.model.QuickStats
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.model.SubscriptionStatus
import com.liyaqa.member.domain.repository.BookingRepository
import com.liyaqa.member.domain.repository.DashboardRepository
import com.liyaqa.member.domain.repository.ProfileRepository
import com.liyaqa.member.domain.repository.SubscriptionRepository

/**
 * Fake implementation of DashboardRepository for testing.
 */
class FakeDashboardRepository : DashboardRepository {

    var dashboardResult: Result<DashboardData> = Result.success(TestFixtures.createDashboardData())
    var quickStatsResult: Result<QuickStats> = Result.success(
        QuickStats(
            memberSince = "2024-01-01",
            totalVisits = 45,
            averageVisitsPerMonth = 11.0,
            classesRemaining = 15,
            daysRemaining = 25,
            subscriptionStatus = SubscriptionStatus.ACTIVE
        )
    )

    var getDashboardCallCount = 0
    var getQuickStatsCallCount = 0

    override suspend fun getDashboard(): Result<DashboardData> {
        getDashboardCallCount++
        return dashboardResult
    }

    override suspend fun getQuickStats(): Result<QuickStats> {
        getQuickStatsCallCount++
        return quickStatsResult
    }

    fun reset() {
        dashboardResult = Result.success(TestFixtures.createDashboardData())
        getDashboardCallCount = 0
        getQuickStatsCallCount = 0
    }
}

/**
 * Fake implementation of BookingRepository for testing.
 */
class FakeBookingRepository : BookingRepository {

    var upcomingBookingsResult: Result<PagedResult<Booking>> =
        Result.success(TestFixtures.createPagedBookings())
    var pastBookingsResult: Result<PagedResult<Booking>> =
        Result.success(TestFixtures.createPagedBookings(hasMore = false))
    var availableSessionsResult: Result<List<AvailableSession>> =
        Result.success(emptyList())
    var bookSessionResult: Result<Booking> =
        Result.success(TestFixtures.createBooking())
    var cancelBookingResult: Result<Unit> =
        Result.success(Unit)

    var getUpcomingBookingsCallCount = 0
    var getPastBookingsCallCount = 0
    var getAvailableSessionsCallCount = 0
    var bookSessionCallCount = 0
    var cancelBookingCallCount = 0
    var lastCancelledBookingId: String? = null

    override suspend fun getUpcomingBookings(page: Int, size: Int): Result<PagedResult<Booking>> {
        getUpcomingBookingsCallCount++
        return upcomingBookingsResult
    }

    override suspend fun getPastBookings(page: Int, size: Int): Result<PagedResult<Booking>> {
        getPastBookingsCallCount++
        return pastBookingsResult
    }

    override suspend fun getAvailableSessions(
        days: Int,
        classId: String?,
        locationId: String?
    ): Result<List<AvailableSession>> {
        getAvailableSessionsCallCount++
        return availableSessionsResult
    }

    override suspend fun bookSession(sessionId: String): Result<Booking> {
        bookSessionCallCount++
        return bookSessionResult
    }

    override suspend fun cancelBooking(bookingId: String): Result<Unit> {
        cancelBookingCallCount++
        lastCancelledBookingId = bookingId
        return cancelBookingResult
    }

    fun reset() {
        upcomingBookingsResult = Result.success(TestFixtures.createPagedBookings())
        pastBookingsResult = Result.success(TestFixtures.createPagedBookings(hasMore = false))
        cancelBookingResult = Result.success(Unit)
        getUpcomingBookingsCallCount = 0
        getPastBookingsCallCount = 0
        cancelBookingCallCount = 0
        lastCancelledBookingId = null
    }
}

/**
 * Fake implementation of ProfileRepository for testing.
 */
class FakeProfileRepository : ProfileRepository {

    private var cachedProfile: Member? = null

    var profileResult: Result<Member> = Result.success(TestFixtures.createMember())
    var updateProfileResult: Result<Member> = Result.success(TestFixtures.createMember())
    var changePasswordResult: Result<Unit> = Result.success(Unit)

    var getProfileCallCount = 0
    var updateProfileCallCount = 0
    var changePasswordCallCount = 0
    var clearCacheCallCount = 0
    var lastPasswordChange: Pair<String, String>? = null

    override suspend fun getProfile(): Result<Member> {
        getProfileCallCount++
        return profileResult.onSuccess { cachedProfile = it }
    }

    override suspend fun updateProfile(
        firstName: String?,
        lastName: String?,
        phone: String?,
        dateOfBirth: String?,
        address: Address?,
        emergencyContact: EmergencyContact?
    ): Result<Member> {
        updateProfileCallCount++
        return updateProfileResult.onSuccess { cachedProfile = it }
    }

    override suspend fun changePassword(currentPassword: String, newPassword: String): Result<Unit> {
        changePasswordCallCount++
        lastPasswordChange = currentPassword to newPassword
        return changePasswordResult
    }

    override fun getCachedProfile(): Member? = cachedProfile

    override suspend fun clearCache() {
        clearCacheCallCount++
        cachedProfile = null
    }

    fun reset() {
        cachedProfile = null
        profileResult = Result.success(TestFixtures.createMember())
        updateProfileResult = Result.success(TestFixtures.createMember())
        changePasswordResult = Result.success(Unit)
        getProfileCallCount = 0
        updateProfileCallCount = 0
        changePasswordCallCount = 0
        clearCacheCallCount = 0
        lastPasswordChange = null
    }
}

/**
 * Fake implementation of SubscriptionRepository for testing.
 */
class FakeSubscriptionRepository : SubscriptionRepository {

    private var cachedSubscription: Subscription? = null

    var subscriptionResult: Result<Subscription> = Result.success(TestFixtures.createSubscription())
    var subscriptionHistoryResult: Result<List<Subscription>> = Result.success(
        listOf(TestFixtures.createSubscription())
    )

    var getSubscriptionCallCount = 0
    var getSubscriptionHistoryCallCount = 0
    var clearCacheCallCount = 0

    override suspend fun getSubscription(): Result<Subscription> {
        getSubscriptionCallCount++
        return subscriptionResult.onSuccess { cachedSubscription = it }
    }

    override suspend fun getSubscriptionHistory(): Result<List<Subscription>> {
        getSubscriptionHistoryCallCount++
        return subscriptionHistoryResult
    }

    override fun getCachedSubscription(): Subscription? = cachedSubscription

    override suspend fun clearCache() {
        clearCacheCallCount++
        cachedSubscription = null
    }

    fun reset() {
        cachedSubscription = null
        subscriptionResult = Result.success(TestFixtures.createSubscription())
        getSubscriptionCallCount = 0
        getSubscriptionHistoryCallCount = 0
        clearCacheCallCount = 0
    }
}

/**
 * Fake implementation of AuthRepository for testing.
 */
class FakeAuthRepository : AuthRepository {

    private var currentUserValue: User? = User(
        id = "user-1",
        email = "john.doe@example.com",
        displayName = LocalizedText(en = "John Doe", ar = "جون دو"),
        role = Role.MEMBER,
        status = UserStatus.ACTIVE,
        tenantId = "tenant-1"
    )

    private var accessToken: String? = "test-access-token"
    private var tenantId: String? = "tenant-1"

    var logoutCallCount = 0
    var loginResult: AuthResult = AuthResult.Success(currentUserValue!!)
    var refreshResult: AuthResult = AuthResult.Success(currentUserValue!!)

    override suspend fun login(
        email: String,
        password: String,
        tenantId: String,
        deviceInfo: String?
    ): AuthResult {
        return loginResult.also {
            if (it is AuthResult.Success) {
                currentUserValue = it.user
            }
        }
    }

    override suspend fun logout() {
        logoutCallCount++
        currentUserValue = null
        accessToken = null
    }

    override suspend fun refreshToken(): AuthResult {
        return refreshResult
    }

    override suspend fun isAuthenticated(): Boolean = currentUserValue != null

    override suspend fun getCurrentUser(): User? = currentUserValue

    override suspend fun getAccessToken(): String? = accessToken

    override suspend fun getTenantId(): String? = tenantId

    fun reset() {
        logoutCallCount = 0
        currentUserValue = User(
            id = "user-1",
            email = "john.doe@example.com",
            displayName = LocalizedText(en = "John Doe", ar = "جون دو"),
            role = Role.MEMBER,
            status = UserStatus.ACTIVE,
            tenantId = "tenant-1"
        )
        accessToken = "test-access-token"
        loginResult = AuthResult.Success(currentUserValue!!)
        refreshResult = AuthResult.Success(currentUserValue!!)
    }
}
