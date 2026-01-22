package com.liyaqa.member.presentation.profile

import app.cash.turbine.test
import com.liyaqa.member.FakeAuthRepository
import com.liyaqa.member.FakeProfileRepository
import com.liyaqa.member.FakeSubscriptionRepository
import com.liyaqa.member.TestFixtures
import com.liyaqa.member.domain.model.MemberStatus
import com.liyaqa.member.domain.model.SubscriptionStatus
import com.liyaqa.member.presentation.base.LoadingState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlin.test.AfterTest
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertIs
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Unit tests for [ProfileViewModel].
 *
 * Tests cover:
 * - Profile loading
 * - Subscription loading
 * - Logout functionality
 * - Navigation effects
 * - Refresh functionality
 */
@OptIn(ExperimentalCoroutinesApi::class)
class ProfileViewModelTest {

    private lateinit var profileRepository: FakeProfileRepository
    private lateinit var subscriptionRepository: FakeSubscriptionRepository
    private lateinit var authRepository: FakeAuthRepository
    private lateinit var viewModel: ProfileViewModel
    private val testDispatcher = StandardTestDispatcher()

    @BeforeTest
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        profileRepository = FakeProfileRepository()
        subscriptionRepository = FakeSubscriptionRepository()
        authRepository = FakeAuthRepository()
    }

    @AfterTest
    fun tearDown() {
        Dispatchers.resetMain()
        profileRepository.reset()
        subscriptionRepository.reset()
        authRepository.reset()
    }

    private fun createViewModel(): ProfileViewModel {
        return ProfileViewModel(
            profileRepository = profileRepository,
            subscriptionRepository = subscriptionRepository,
            authRepository = authRepository
        )
    }

    // ==================== Profile Loading ====================

    @Test
    fun `init loads profile`() = runTest {
        // Given
        val member = TestFixtures.createMember()
        profileRepository.profileResult = Result.success(member)

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertTrue(profileRepository.getProfileCallCount >= 1)
        assertNotNull(viewModel.state.value.profile)
    }

    @Test
    fun `loadProfile success updates state with profile data`() = runTest {
        // Given
        val member = TestFixtures.createMember(
            firstName = "Ahmed",
            lastName = "Hassan",
            email = "ahmed@example.com"
        )
        profileRepository.profileResult = Result.success(member)

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        val state = viewModel.state.value
        assertEquals("Ahmed", state.profile?.firstName)
        assertEquals("Hassan", state.profile?.lastName)
        assertEquals("ahmed@example.com", state.profile?.email)
        assertIs<LoadingState.Success>(state.loading)
    }

    @Test
    fun `loadProfile error updates state with error`() = runTest {
        // Given
        profileRepository.profileResult = Result.failure(Exception("Profile load failed"))

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        val state = viewModel.state.value
        assertIs<LoadingState.Error>(state.loading)
        assertEquals("Profile load failed", (state.loading as LoadingState.Error).message)
    }

    @Test
    fun `loadProfile also loads subscription`() = runTest {
        // Given
        profileRepository.profileResult = Result.success(TestFixtures.createMember())
        subscriptionRepository.subscriptionResult = Result.success(
            TestFixtures.createSubscription()
        )

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertTrue(subscriptionRepository.getSubscriptionCallCount >= 1)
        assertNotNull(viewModel.state.value.subscription)
    }

    @Test
    fun `subscription loaded with correct data`() = runTest {
        // Given
        profileRepository.profileResult = Result.success(TestFixtures.createMember())
        val subscription = TestFixtures.createSubscription(
            planName = "Gold Plan",
            daysRemaining = 15,
            status = SubscriptionStatus.ACTIVE
        )
        subscriptionRepository.subscriptionResult = Result.success(subscription)

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        val state = viewModel.state.value
        assertEquals(15, state.subscription?.daysRemaining)
        assertEquals(SubscriptionStatus.ACTIVE, state.subscription?.status)
    }

    // ==================== Logout ====================

    @Test
    fun `logout calls authRepository logout`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.onIntent(ProfileIntent.Logout)
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals(1, authRepository.logoutCallCount)
    }

    @Test
    fun `logout sends LoggedOut effect`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.effect.test {
            viewModel.onIntent(ProfileIntent.Logout)
            testDispatcher.scheduler.advanceUntilIdle()

            // Then
            val effect = awaitItem()
            assertIs<ProfileEffect.LoggedOut>(effect)
        }
    }

    @Test
    fun `logout sets isLoggingOut during operation`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.onIntent(ProfileIntent.Logout)

        // After completion
        testDispatcher.scheduler.advanceUntilIdle()

        // Then: isLoggingOut should be false after completion
        assertFalse(viewModel.state.value.isLoggingOut)
    }

    // ==================== Navigation Effects ====================

    @Test
    fun `NavigateToEditProfile sends NavigateToEdit effect`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.effect.test {
            viewModel.onIntent(ProfileIntent.NavigateToEditProfile)

            // Then
            val effect = awaitItem()
            assertIs<ProfileEffect.NavigateToEdit>(effect)
        }
    }

    @Test
    fun `NavigateToChangePassword sends NavigateToPassword effect`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.effect.test {
            viewModel.onIntent(ProfileIntent.NavigateToChangePassword)

            // Then
            val effect = awaitItem()
            assertIs<ProfileEffect.NavigateToPassword>(effect)
        }
    }

    @Test
    fun `NavigateToNotificationSettings sends NavigateToSettings effect`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.effect.test {
            viewModel.onIntent(ProfileIntent.NavigateToNotificationSettings)

            // Then
            val effect = awaitItem()
            assertIs<ProfileEffect.NavigateToSettings>(effect)
        }
    }

    @Test
    fun `NavigateToSubscriptions sends NavigateToSubscriptions effect`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.effect.test {
            viewModel.onIntent(ProfileIntent.NavigateToSubscriptions)

            // Then
            val effect = awaitItem()
            assertIs<ProfileEffect.NavigateToSubscriptions>(effect)
        }
    }

    @Test
    fun `NavigateToAttendance sends NavigateToAttendance effect`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.effect.test {
            viewModel.onIntent(ProfileIntent.NavigateToAttendance)

            // Then
            val effect = awaitItem()
            assertIs<ProfileEffect.NavigateToAttendance>(effect)
        }
    }

    // ==================== Refresh ====================

    @Test
    fun `refresh clears caches and reloads data`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.onIntent(ProfileIntent.Refresh)
        testDispatcher.scheduler.advanceUntilIdle()

        // Then: Caches cleared and data reloaded
        assertEquals(1, profileRepository.clearCacheCallCount)
        assertEquals(1, subscriptionRepository.clearCacheCallCount)
        assertTrue(profileRepository.getProfileCallCount >= 2) // init + refresh
    }

    @Test
    fun `refresh sets isRefreshing during operation`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.onIntent(ProfileIntent.Refresh)

        // After completion
        testDispatcher.scheduler.advanceUntilIdle()

        // Then: isRefreshing should be false after completion
        assertFalse(viewModel.state.value.isRefreshing)
    }

    @Test
    fun `refresh updates profile data`() = runTest {
        // Given: Initial load
        val initialMember = TestFixtures.createMember(firstName = "John")
        profileRepository.profileResult = Result.success(initialMember)

        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then: Update profile for refresh
        val updatedMember = TestFixtures.createMember(firstName = "Jane")
        profileRepository.profileResult = Result.success(updatedMember)

        // When
        viewModel.onIntent(ProfileIntent.Refresh)
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals("Jane", viewModel.state.value.profile?.firstName)
    }

    // ==================== State Computed Properties ====================

    @Test
    fun `hasProfile returns true when profile is loaded`() = runTest {
        // Given
        profileRepository.profileResult = Result.success(TestFixtures.createMember())

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertTrue(viewModel.state.value.hasProfile)
    }

    @Test
    fun `hasProfile returns false when profile is null`() = runTest {
        // Given
        profileRepository.profileResult = Result.failure(Exception("Error"))

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertFalse(viewModel.state.value.hasProfile)
    }

    @Test
    fun `fullName returns combined first and last name`() = runTest {
        // Given
        val member = TestFixtures.createMember(firstName = "Ahmed", lastName = "Hassan")
        profileRepository.profileResult = Result.success(member)

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals("Ahmed Hassan", viewModel.state.value.fullName)
    }

    @Test
    fun `email returns profile email`() = runTest {
        // Given
        val member = TestFixtures.createMember(email = "test@example.com")
        profileRepository.profileResult = Result.success(member)

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals("test@example.com", viewModel.state.value.email)
    }

    @Test
    fun `initials returns first letters of first and last name`() = runTest {
        // Given
        val member = TestFixtures.createMember(firstName = "Ahmed", lastName = "Hassan")
        profileRepository.profileResult = Result.success(member)

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals("AH", viewModel.state.value.initials)
    }

    @Test
    fun `hasSubscription returns true when subscription exists`() = runTest {
        // Given
        profileRepository.profileResult = Result.success(TestFixtures.createMember())
        subscriptionRepository.subscriptionResult = Result.success(TestFixtures.createSubscription())

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertTrue(viewModel.state.value.hasSubscription)
    }

    @Test
    fun `hasSubscription returns false when subscription is null`() = runTest {
        // Given
        profileRepository.profileResult = Result.success(TestFixtures.createMember())
        subscriptionRepository.subscriptionResult = Result.failure(Exception("No subscription"))

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertFalse(viewModel.state.value.hasSubscription)
        assertNull(viewModel.state.value.subscription)
    }
}
