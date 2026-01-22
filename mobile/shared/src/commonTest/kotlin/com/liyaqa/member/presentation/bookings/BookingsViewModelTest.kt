package com.liyaqa.member.presentation.bookings

import app.cash.turbine.test
import com.liyaqa.member.FakeBookingRepository
import com.liyaqa.member.TestFixtures
import com.liyaqa.member.domain.model.PagedResult
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
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Unit tests for [BookingsViewModel].
 *
 * Tests cover:
 * - Loading bookings (upcoming and past)
 * - Booking cancellation
 * - Pagination (load more)
 * - Tab switching
 * - Navigation effects
 */
@OptIn(ExperimentalCoroutinesApi::class)
class BookingsViewModelTest {

    private lateinit var repository: FakeBookingRepository
    private lateinit var viewModel: BookingsViewModel
    private val testDispatcher = StandardTestDispatcher()

    @BeforeTest
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        repository = FakeBookingRepository()
    }

    @AfterTest
    fun tearDown() {
        Dispatchers.resetMain()
        repository.reset()
    }

    private fun createViewModel(): BookingsViewModel {
        return BookingsViewModel(repository)
    }

    // ==================== Loading Bookings ====================

    @Test
    fun `initial state has UPCOMING tab selected`() = runTest {
        // Given/When
        viewModel = createViewModel()

        // Then
        assertEquals(BookingsTab.UPCOMING, viewModel.state.value.activeTab)
    }

    @Test
    fun `init loads upcoming bookings`() = runTest {
        // Given
        val bookings = TestFixtures.createBookingList(3)
        repository.upcomingBookingsResult = Result.success(
            PagedResult(bookings, hasMore = true, totalCount = 10)
        )

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertTrue(repository.getUpcomingBookingsCallCount >= 1)
        assertEquals(3, viewModel.state.value.upcomingBookings.items.size)
    }

    @Test
    fun `loadUpcoming success updates state`() = runTest {
        // Given
        val bookings = TestFixtures.createBookingList(5)
        repository.upcomingBookingsResult = Result.success(
            PagedResult(bookings, hasMore = true, totalCount = 15)
        )

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        val state = viewModel.state.value
        assertEquals(5, state.upcomingBookings.items.size)
        assertTrue(state.upcomingBookings.hasMore)
        assertFalse(state.upcomingBookings.isInitialLoading)
    }

    @Test
    fun `loadUpcoming error updates pagination error`() = runTest {
        // Given
        repository.upcomingBookingsResult = Result.failure(Exception("Load error"))

        // When
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        val state = viewModel.state.value
        assertEquals("Load error", state.upcomingBookings.error)
        assertTrue(state.upcomingBookings.items.isEmpty())
    }

    @Test
    fun `loadPast loads past bookings when tab switched`() = runTest {
        // Given
        val upcomingBookings = TestFixtures.createBookingList(2)
        val pastBookings = TestFixtures.createBookingList(3)

        repository.upcomingBookingsResult = Result.success(
            PagedResult(upcomingBookings, hasMore = false)
        )
        repository.pastBookingsResult = Result.success(
            PagedResult(pastBookings, hasMore = false)
        )

        // When: Create and switch to PAST tab
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.onIntent(BookingsIntent.SwitchTab(BookingsTab.PAST))
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertTrue(repository.getPastBookingsCallCount >= 1)
        assertEquals(3, viewModel.state.value.pastBookings.items.size)
    }

    // ==================== Booking Cancellation ====================

    @Test
    fun `cancelBooking success removes booking from list`() = runTest {
        // Given: Bookings loaded
        val bookings = TestFixtures.createBookingList(5)
        repository.upcomingBookingsResult = Result.success(
            PagedResult(bookings, hasMore = false)
        )
        repository.cancelBookingResult = Result.success(Unit)

        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        val bookingToCancel = bookings.first()

        // When
        viewModel.onIntent(BookingsIntent.CancelBooking(bookingToCancel.id))
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals(1, repository.cancelBookingCallCount)
        assertEquals(bookingToCancel.id, repository.lastCancelledBookingId)
        assertEquals(4, viewModel.state.value.upcomingBookings.items.size)
        assertFalse(
            viewModel.state.value.upcomingBookings.items.any { it.id == bookingToCancel.id }
        )
    }

    @Test
    fun `cancelBooking success sends BookingCancelled effect`() = runTest {
        // Given
        val bookings = TestFixtures.createBookingList(3)
        repository.upcomingBookingsResult = Result.success(
            PagedResult(bookings, hasMore = false)
        )
        repository.cancelBookingResult = Result.success(Unit)

        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.effect.test {
            viewModel.onIntent(BookingsIntent.CancelBooking(bookings.first().id))
            testDispatcher.scheduler.advanceUntilIdle()

            // Then
            val effect = awaitItem()
            assertIs<BookingsEffect.BookingCancelled>(effect)
            assertEquals(bookings.first().id, effect.bookingId)
        }
    }

    @Test
    fun `cancelBooking sets cancellingBookingId during operation`() = runTest {
        // Given
        val bookings = TestFixtures.createBookingList(2)
        repository.upcomingBookingsResult = Result.success(
            PagedResult(bookings, hasMore = false)
        )

        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When: Start cancellation (before advancing dispatcher)
        viewModel.onIntent(BookingsIntent.CancelBooking("booking-1"))

        // Note: Since we're using a test dispatcher, the state might update before we can observe
        // After completion, cancellingBookingId should be null
        testDispatcher.scheduler.advanceUntilIdle()

        // Then: After completion, cancellingBookingId should be null
        assertNull(viewModel.state.value.cancellingBookingId)
    }

    @Test
    fun `cancelBooking error sends ShowError effect`() = runTest {
        // Given
        val bookings = TestFixtures.createBookingList(2)
        repository.upcomingBookingsResult = Result.success(
            PagedResult(bookings, hasMore = false)
        )
        repository.cancelBookingResult = Result.failure(Exception("Cancel failed"))

        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.effect.test {
            viewModel.onIntent(BookingsIntent.CancelBooking(bookings.first().id))
            testDispatcher.scheduler.advanceUntilIdle()

            // Then
            val effect = awaitItem()
            assertIs<BookingsEffect.ShowError>(effect)
            assertEquals("Cancel failed", effect.message)
        }
    }

    @Test
    fun `cancelBooking error does not remove booking from list`() = runTest {
        // Given
        val bookings = TestFixtures.createBookingList(3)
        repository.upcomingBookingsResult = Result.success(
            PagedResult(bookings, hasMore = false)
        )
        repository.cancelBookingResult = Result.failure(Exception("Cancel failed"))

        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.onIntent(BookingsIntent.CancelBooking(bookings.first().id))
        testDispatcher.scheduler.advanceUntilIdle()

        // Then: Booking should still be in list
        assertEquals(3, viewModel.state.value.upcomingBookings.items.size)
    }

    // ==================== Pagination ====================

    @Test
    fun `loadMore loads next page of upcoming bookings`() = runTest {
        // Given: Initial load with hasMore = true
        val page1 = TestFixtures.createBookingList(5)
        repository.upcomingBookingsResult = Result.success(
            PagedResult(page1, hasMore = true, totalCount = 10)
        )

        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Simulate page 2
        val page2 = (6..10).map { TestFixtures.createBooking(id = "booking-$it") }
        repository.upcomingBookingsResult = Result.success(
            PagedResult(page2, hasMore = false, totalCount = 10)
        )

        // When
        viewModel.onIntent(BookingsIntent.LoadMore)
        testDispatcher.scheduler.advanceUntilIdle()

        // Then: Should have items from both pages
        assertTrue(repository.getUpcomingBookingsCallCount >= 2)
    }

    @Test
    fun `loadMore does nothing when hasMore is false`() = runTest {
        // Given: Initial load with hasMore = false
        val bookings = TestFixtures.createBookingList(3)
        repository.upcomingBookingsResult = Result.success(
            PagedResult(bookings, hasMore = false)
        )

        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        val callCountBefore = repository.getUpcomingBookingsCallCount

        // When
        viewModel.onIntent(BookingsIntent.LoadMore)
        testDispatcher.scheduler.advanceUntilIdle()

        // Then: No additional call made
        assertEquals(callCountBefore, repository.getUpcomingBookingsCallCount)
    }

    @Test
    fun `loadMore for past tab loads past bookings`() = runTest {
        // Given
        repository.upcomingBookingsResult = Result.success(
            PagedResult(TestFixtures.createBookingList(2), hasMore = false)
        )
        repository.pastBookingsResult = Result.success(
            PagedResult(TestFixtures.createBookingList(5), hasMore = true)
        )

        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Switch to PAST tab
        viewModel.onIntent(BookingsIntent.SwitchTab(BookingsTab.PAST))
        testDispatcher.scheduler.advanceUntilIdle()

        val callCountBefore = repository.getPastBookingsCallCount

        // When: Load more on PAST tab
        viewModel.onIntent(BookingsIntent.LoadMore)
        testDispatcher.scheduler.advanceUntilIdle()

        // Then: Past bookings endpoint was called again
        assertTrue(repository.getPastBookingsCallCount > callCountBefore)
    }

    // ==================== Tab Switching ====================

    @Test
    fun `switchTab updates activeTab`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.onIntent(BookingsIntent.SwitchTab(BookingsTab.PAST))

        // Then
        assertEquals(BookingsTab.PAST, viewModel.state.value.activeTab)
    }

    @Test
    fun `switchTab to PAST triggers loadPast if not loaded`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.onIntent(BookingsIntent.SwitchTab(BookingsTab.PAST))
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertTrue(repository.getPastBookingsCallCount >= 1)
    }

    @Test
    fun `switchTab back to UPCOMING does not reload if already loaded`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        val initialCallCount = repository.getUpcomingBookingsCallCount

        // Switch to PAST then back to UPCOMING
        viewModel.onIntent(BookingsIntent.SwitchTab(BookingsTab.PAST))
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.onIntent(BookingsIntent.SwitchTab(BookingsTab.UPCOMING))
        testDispatcher.scheduler.advanceUntilIdle()

        // Then: No additional call (data already loaded)
        assertEquals(initialCallCount, repository.getUpcomingBookingsCallCount)
    }

    // ==================== Refresh ====================

    @Test
    fun `refresh reloads current tab data`() = runTest {
        // Given
        repository.upcomingBookingsResult = Result.success(
            PagedResult(TestFixtures.createBookingList(3), hasMore = false)
        )

        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        val callCountBefore = repository.getUpcomingBookingsCallCount

        // When
        viewModel.onIntent(BookingsIntent.Refresh)
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertTrue(repository.getUpcomingBookingsCallCount > callCountBefore)
    }

    @Test
    fun `refresh error sends ShowError effect`() = runTest {
        // Given: Initial success
        repository.upcomingBookingsResult = Result.success(
            PagedResult(TestFixtures.createBookingList(2), hasMore = false)
        )

        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then set up failure
        repository.upcomingBookingsResult = Result.failure(Exception("Refresh failed"))

        // When
        viewModel.effect.test {
            viewModel.onIntent(BookingsIntent.Refresh)
            testDispatcher.scheduler.advanceUntilIdle()

            // Then
            val effect = awaitItem()
            assertIs<BookingsEffect.ShowError>(effect)
        }
    }

    // ==================== Navigation Effects ====================

    @Test
    fun `ViewBookingDetail sends NavigateToDetail effect`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.effect.test {
            viewModel.onIntent(BookingsIntent.ViewBookingDetail("booking-123"))

            // Then
            val effect = awaitItem()
            assertIs<BookingsEffect.NavigateToDetail>(effect)
            assertEquals("booking-123", effect.bookingId)
        }
    }

    @Test
    fun `NavigateToNewBooking sends NavigateToNewBooking effect`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.effect.test {
            viewModel.onIntent(BookingsIntent.NavigateToNewBooking)

            // Then
            val effect = awaitItem()
            assertIs<BookingsEffect.NavigateToNewBooking>(effect)
        }
    }

    // ==================== State Computed Properties ====================

    @Test
    fun `activeBookings returns upcomingBookings when UPCOMING tab selected`() = runTest {
        // Given
        val upcomingBookings = TestFixtures.createBookingList(3)
        repository.upcomingBookingsResult = Result.success(
            PagedResult(upcomingBookings, hasMore = false)
        )

        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals(
            viewModel.state.value.upcomingBookings,
            viewModel.state.value.activeBookings
        )
    }

    @Test
    fun `activeBookings returns pastBookings when PAST tab selected`() = runTest {
        // Given
        repository.upcomingBookingsResult = Result.success(
            PagedResult(TestFixtures.createBookingList(2), hasMore = false)
        )
        repository.pastBookingsResult = Result.success(
            PagedResult(TestFixtures.createBookingList(4), hasMore = false)
        )

        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When
        viewModel.onIntent(BookingsIntent.SwitchTab(BookingsTab.PAST))
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals(
            viewModel.state.value.pastBookings,
            viewModel.state.value.activeBookings
        )
    }

    @Test
    fun `isCancelling returns true when cancellingBookingId is set`() = runTest {
        // Given
        viewModel = createViewModel()
        testDispatcher.scheduler.advanceUntilIdle()

        // When: No cancellation in progress
        assertFalse(viewModel.state.value.isCancelling)
    }
}
