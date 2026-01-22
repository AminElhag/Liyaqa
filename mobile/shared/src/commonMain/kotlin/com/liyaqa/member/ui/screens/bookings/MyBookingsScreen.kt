package com.liyaqa.member.ui.screens.bookings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.liyaqa.member.core.localization.LocalizedText
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.BookingStatus
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.viewmodel.BookingsEffect
import com.liyaqa.member.presentation.viewmodel.BookingsIntent
import com.liyaqa.member.presentation.viewmodel.BookingsState
import com.liyaqa.member.presentation.viewmodel.BookingsTab
import com.liyaqa.member.presentation.viewmodel.BookingsViewModel
import com.liyaqa.member.ui.components.BookingStatusBadge
import com.liyaqa.member.ui.components.EmptyBookings
import com.liyaqa.member.ui.components.ErrorState
import com.liyaqa.member.ui.components.FullScreenLoading
import com.liyaqa.member.ui.components.LoadMoreIndicator
import com.liyaqa.member.ui.components.SkeletonList
import com.liyaqa.member.ui.theme.LocalAppLocale
import kotlinx.coroutines.flow.collectLatest
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalTime
import org.koin.compose.viewmodel.koinViewModel

/**
 * My Bookings Screen - Shows member's upcoming and past bookings.
 *
 * Features:
 * - Tab layout: "Upcoming" and "Past"
 * - Pull-to-refresh
 * - Load more on scroll
 * - Cancel booking with confirmation
 * - Status filter dropdown
 * - Empty state
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyBookingsScreen(
    viewModel: BookingsViewModel = koinViewModel(),
    onNavigateToNewBooking: () -> Unit = {},
    onNavigateToDetail: (String) -> Unit = {},
    onShowSnackbar: (String) -> Unit = {}
) {
    val state by viewModel.state.collectAsState()
    val locale = LocalAppLocale.current

    // Handle one-time effects
    LaunchedEffect(Unit) {
        viewModel.effect.collectLatest { effect ->
            when (effect) {
                is BookingsEffect.ShowError -> onShowSnackbar(effect.message)
                is BookingsEffect.BookingCancelled -> onShowSnackbar(effect.message)
                is BookingsEffect.NavigateToDetail -> onNavigateToDetail(effect.bookingId)
                is BookingsEffect.NavigateToNewBooking -> onNavigateToNewBooking()
            }
        }
    }

    Scaffold(
        topBar = {
            BookingsTopBar(
                locale = locale,
                statusFilter = state.statusFilter,
                onFilterChanged = { status ->
                    viewModel.onIntent(BookingsIntent.FilterByStatus(status))
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.onIntent(BookingsIntent.NavigateToNewBooking) },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = if (locale == "ar") "حجز جديد" else "New Booking"
                )
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Tab Row
            BookingsTabRow(
                activeTab = state.activeTab,
                locale = locale,
                onTabSelected = { tab ->
                    viewModel.onIntent(BookingsIntent.SwitchTab(tab))
                }
            )

            // Content
            BookingsContent(
                state = state,
                locale = locale,
                onRefresh = { viewModel.onIntent(BookingsIntent.Refresh) },
                onLoadMore = { viewModel.onIntent(BookingsIntent.LoadMore) },
                onBookingClick = { booking ->
                    viewModel.onIntent(BookingsIntent.ViewBookingDetail(booking.id))
                },
                onCancelBooking = { booking ->
                    viewModel.onIntent(BookingsIntent.RequestCancelBooking(booking))
                },
                onRetry = { viewModel.onIntent(BookingsIntent.LoadBookings) }
            )
        }

        // Cancel Booking Dialog
        if (state.showCancelDialog) {
            CancelBookingDialog(
                booking = state.bookingToCancel!!,
                locale = locale,
                isCancelling = state.isCancelling,
                onConfirm = { viewModel.onIntent(BookingsIntent.ConfirmCancelBooking) },
                onDismiss = { viewModel.onIntent(BookingsIntent.DismissCancelDialog) }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BookingsTopBar(
    locale: String,
    statusFilter: BookingStatus?,
    onFilterChanged: (BookingStatus?) -> Unit
) {
    var showFilterMenu by remember { mutableStateOf(false) }

    TopAppBar(
        title = {
            Text(
                text = if (locale == "ar") "حجوزاتي" else "My Bookings",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        },
        actions = {
            Box {
                IconButton(onClick = { showFilterMenu = true }) {
                    Icon(
                        imageVector = Icons.Default.FilterList,
                        contentDescription = if (locale == "ar") "تصفية" else "Filter",
                        tint = if (statusFilter != null) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.onSurface
                        }
                    )
                }

                DropdownMenu(
                    expanded = showFilterMenu,
                    onDismissRequest = { showFilterMenu = false }
                ) {
                    DropdownMenuItem(
                        text = {
                            Text(
                                text = if (locale == "ar") "الكل" else "All",
                                fontWeight = if (statusFilter == null) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        onClick = {
                            onFilterChanged(null)
                            showFilterMenu = false
                        }
                    )
                    BookingStatus.entries.forEach { status ->
                        DropdownMenuItem(
                            text = {
                                Text(
                                    text = status.displayName(locale),
                                    fontWeight = if (statusFilter == status) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            onClick = {
                                onFilterChanged(status)
                                showFilterMenu = false
                            }
                        )
                    }
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    )
}

@Composable
private fun BookingsTabRow(
    activeTab: BookingsTab,
    locale: String,
    onTabSelected: (BookingsTab) -> Unit
) {
    TabRow(
        selectedTabIndex = activeTab.ordinal,
        containerColor = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.primary
    ) {
        Tab(
            selected = activeTab == BookingsTab.UPCOMING,
            onClick = { onTabSelected(BookingsTab.UPCOMING) },
            text = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = if (locale == "ar") "القادمة" else "Upcoming")
                }
            }
        )
        Tab(
            selected = activeTab == BookingsTab.PAST,
            onClick = { onTabSelected(BookingsTab.PAST) },
            text = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.History,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = if (locale == "ar") "السابقة" else "Past")
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BookingsContent(
    state: BookingsState,
    locale: String,
    onRefresh: () -> Unit,
    onLoadMore: () -> Unit,
    onBookingClick: (Booking) -> Unit,
    onCancelBooking: (Booking) -> Unit,
    onRetry: () -> Unit
) {
    val pullToRefreshState = rememberPullToRefreshState()
    val listState = rememberLazyListState()

    // Detect scroll to bottom for load more
    val shouldLoadMore by remember {
        derivedStateOf {
            val lastVisibleItem = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            val totalItems = listState.layoutInfo.totalItemsCount
            lastVisibleItem >= totalItems - 3 && state.hasMore && !state.isLoadingMore
        }
    }

    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) {
            onLoadMore()
        }
    }

    when (val loading = state.loading) {
        is LoadingState.Loading -> {
            SkeletonList(count = 5)
        }

        is LoadingState.Error -> {
            ErrorState(
                message = loading.message,
                onRetry = onRetry
            )
        }

        else -> {
            if (state.isEmpty) {
                EmptyBookings(
                    locale = locale,
                    isUpcoming = state.activeTab == BookingsTab.UPCOMING
                )
            } else {
                PullToRefreshBox(
                    isRefreshing = state.isRefreshing,
                    onRefresh = onRefresh,
                    state = pullToRefreshState,
                    modifier = Modifier.fillMaxSize()
                ) {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(
                            items = state.currentBookings,
                            key = { it.id }
                        ) { booking ->
                            BookingListCard(
                                booking = booking,
                                locale = locale,
                                onClick = { onBookingClick(booking) },
                                onCancel = if (booking.isCancellable) {
                                    { onCancelBooking(booking) }
                                } else null
                            )
                        }

                        // Load more indicator
                        if (state.isLoadingMore) {
                            item {
                                LoadMoreIndicator()
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Booking card for the list view.
 */
@Composable
private fun BookingListCard(
    booking: Booking,
    locale: String,
    onClick: () -> Unit,
    onCancel: (() -> Unit)?
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header row: Class name + Status badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = booking.className.localized(locale),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )

                Spacer(modifier = Modifier.width(8.dp))

                BookingStatusBadge(
                    status = booking.status
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Date and time row
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.CalendarMonth,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = formatDate(booking.sessionDate, locale),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(16.dp))
                Icon(
                    imageVector = Icons.Default.Schedule,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Location and trainer (if available)
            if (booking.location != null || booking.trainer != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    booking.location?.let { location ->
                        Text(
                            text = location,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    booking.trainer?.let { trainer ->
                        Text(
                            text = trainer,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Cancel button (if cancellable)
            onCancel?.let { onCancelAction ->
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    OutlinedButton(
                        onClick = onCancelAction,
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Cancel,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (locale == "ar") "إلغاء" else "Cancel",
                            style = MaterialTheme.typography.labelMedium
                        )
                    }
                }
            }
        }
    }
}

/**
 * Cancel booking confirmation dialog.
 */
@Composable
private fun CancelBookingDialog(
    booking: Booking,
    locale: String,
    isCancelling: Boolean,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = { if (!isCancelling) onDismiss() },
        title = {
            Text(
                text = if (locale == "ar") "إلغاء الحجز؟" else "Cancel Booking?",
                style = MaterialTheme.typography.titleLarge
            )
        },
        text = {
            Column {
                Text(
                    text = if (locale == "ar") {
                        "هل أنت متأكد من إلغاء هذا الحجز؟"
                    } else {
                        "Are you sure you want to cancel this booking?"
                    },
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = booking.className.localized(locale),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "${formatDate(booking.sessionDate, locale)} • ${formatTime(booking.startTime)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !isCancelling,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                )
            ) {
                if (isCancelling) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text(text = if (locale == "ar") "إلغاء الحجز" else "Cancel Booking")
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !isCancelling
            ) {
                Text(text = if (locale == "ar") "إلغاء" else "Cancel")
            }
        }
    )
}

/**
 * Empty state for bookings list.
 */
@Composable
private fun EmptyBookings(locale: String, isUpcoming: Boolean) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = if (isUpcoming) Icons.Default.CalendarMonth else Icons.Default.History,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f),
                modifier = Modifier.size(80.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = if (locale == "ar") {
                    if (isUpcoming) "لا توجد حجوزات قادمة" else "لا توجد حجوزات سابقة"
                } else {
                    if (isUpcoming) "No upcoming bookings" else "No past bookings"
                },
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = if (locale == "ar") {
                    if (isUpcoming) "احجز حصة لتبدأ رحلتك الرياضية" else "سيظهر سجل حجوزاتك هنا"
                } else {
                    if (isUpcoming) "Book a class to start your fitness journey" else "Your booking history will appear here"
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

// Helper functions

private fun BookingStatus.displayName(locale: String): String {
    return when (this) {
        BookingStatus.CONFIRMED -> if (locale == "ar") "مؤكد" else "Confirmed"
        BookingStatus.WAITLISTED -> if (locale == "ar") "قائمة انتظار" else "Waitlisted"
        BookingStatus.CHECKED_IN -> if (locale == "ar") "تم الحضور" else "Checked In"
        BookingStatus.NO_SHOW -> if (locale == "ar") "لم يحضر" else "No Show"
        BookingStatus.CANCELLED -> if (locale == "ar") "ملغى" else "Cancelled"
    }
}

private fun formatDate(date: LocalDate, locale: String): String {
    val day = date.dayOfMonth.toString().padStart(2, '0')
    val month = date.monthNumber.toString().padStart(2, '0')
    val year = date.year.toString()

    return if (locale == "ar") {
        "$year/$month/$day"
    } else {
        "$day/$month/$year"
    }
}

private fun formatTime(time: LocalTime): String {
    val hour = time.hour.toString().padStart(2, '0')
    val minute = time.minute.toString().padStart(2, '0')
    return "$hour:$minute"
}

private fun LocalizedText.localized(locale: String): String {
    return if (locale == "ar") ar ?: en else en
}
