package com.liyaqa.member.ui.screens.bookings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
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
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.core.localization.LocalizedText
import com.liyaqa.member.domain.model.AvailableSession
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.viewmodel.NewBookingEffect
import com.liyaqa.member.presentation.viewmodel.NewBookingIntent
import com.liyaqa.member.presentation.viewmodel.NewBookingState
import com.liyaqa.member.presentation.viewmodel.NewBookingViewModel
import com.liyaqa.member.ui.components.ErrorState
import com.liyaqa.member.ui.components.SkeletonList
import com.liyaqa.member.ui.theme.LocalAppLocale
import kotlinx.coroutines.flow.collectLatest
import kotlinx.datetime.Clock
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.todayIn
import org.koin.compose.viewmodel.koinViewModel

/**
 * New Booking Screen - Voyager Screen for booking available class sessions.
 *
 * Features:
 * - Horizontal date selector for next 7-14 days
 * - Sessions list grouped by time
 * - Class and location filters
 * - Booking confirmation dialog
 * - Spots remaining with color-coded badges
 */
class NewBookingScreen : Screen {

    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        NewBookingScreenContent(
            onNavigateBack = { navigator.pop() },
            onShowSnackbar = { /* TODO: Implement snackbar */ }
        )
    }
}

/**
 * New Booking Screen Content.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NewBookingScreenContent(
    viewModel: NewBookingViewModel = koinViewModel(),
    onNavigateBack: () -> Unit = {},
    onShowSnackbar: (String) -> Unit = {}
) {
    val state by viewModel.state.collectAsState()
    val locale = LocalAppLocale.current

    // Handle one-time effects
    LaunchedEffect(Unit) {
        viewModel.effect.collectLatest { effect ->
            when (effect) {
                is NewBookingEffect.ShowError -> onShowSnackbar(effect.message)
                is NewBookingEffect.BookingSuccess -> {
                    val message = if (locale == "ar") {
                        "تم حجز الحصة بنجاح"
                    } else {
                        "Class booked successfully"
                    }
                    onShowSnackbar(message)
                }
                is NewBookingEffect.NavigateBack -> onNavigateBack()
            }
        }
    }

    Scaffold(
        topBar = {
            NewBookingTopBar(
                locale = locale,
                state = state,
                onNavigateBack = { viewModel.onIntent(NewBookingIntent.NavigateBack) },
                onClassFilterChanged = { viewModel.onIntent(NewBookingIntent.FilterByClass(it)) },
                onLocationFilterChanged = { viewModel.onIntent(NewBookingIntent.FilterByLocation(it)) }
            )
        }
    ) { paddingValues ->
        NewBookingContent(
            state = state,
            locale = locale,
            modifier = Modifier.padding(paddingValues),
            onDateSelected = { viewModel.onIntent(NewBookingIntent.SelectDate(it)) },
            onRefresh = { viewModel.onIntent(NewBookingIntent.Refresh) },
            onBookSession = { viewModel.onIntent(NewBookingIntent.RequestBookSession(it)) },
            onRetry = { viewModel.onIntent(NewBookingIntent.LoadSessions) }
        )

        // Booking Confirmation Dialog
        if (state.showBookingDialog) {
            BookingConfirmationDialog(
                session = state.sessionToBook!!,
                locale = locale,
                isBooking = state.isBooking,
                onConfirm = { viewModel.onIntent(NewBookingIntent.ConfirmBooking) },
                onDismiss = { viewModel.onIntent(NewBookingIntent.DismissBookingDialog) }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NewBookingTopBar(
    locale: String,
    state: NewBookingState,
    onNavigateBack: () -> Unit,
    onClassFilterChanged: (String?) -> Unit,
    onLocationFilterChanged: (String?) -> Unit
) {
    var showClassFilter by remember { mutableStateOf(false) }
    var showLocationFilter by remember { mutableStateOf(false) }

    TopAppBar(
        title = {
            Text(
                text = if (locale == "ar") "حجز حصة" else "Book a Class",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        },
        navigationIcon = {
            IconButton(onClick = onNavigateBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = if (locale == "ar") "رجوع" else "Back"
                )
            }
        },
        actions = {
            // Class filter
            Box {
                FilterChip(
                    selected = state.classFilter != null,
                    onClick = { showClassFilter = true },
                    label = {
                        Text(
                            text = state.classFilter ?: if (locale == "ar") "الحصة" else "Class",
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.FilterList,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                    },
                    modifier = Modifier.padding(end = 4.dp)
                )

                DropdownMenu(
                    expanded = showClassFilter,
                    onDismissRequest = { showClassFilter = false }
                ) {
                    DropdownMenuItem(
                        text = { Text(if (locale == "ar") "الكل" else "All Classes") },
                        onClick = {
                            onClassFilterChanged(null)
                            showClassFilter = false
                        }
                    )
                    state.availableClasses.forEach { className ->
                        DropdownMenuItem(
                            text = { Text(className) },
                            onClick = {
                                onClassFilterChanged(className)
                                showClassFilter = false
                            }
                        )
                    }
                }
            }

            // Location filter
            Box {
                FilterChip(
                    selected = state.locationFilter != null,
                    onClick = { showLocationFilter = true },
                    label = {
                        Text(
                            text = state.availableLocations
                                .find { it.first == state.locationFilter }?.second
                                ?: if (locale == "ar") "الموقع" else "Location",
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.LocationOn,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                    },
                    modifier = Modifier.padding(end = 8.dp)
                )

                DropdownMenu(
                    expanded = showLocationFilter,
                    onDismissRequest = { showLocationFilter = false }
                ) {
                    DropdownMenuItem(
                        text = { Text(if (locale == "ar") "الكل" else "All Locations") },
                        onClick = {
                            onLocationFilterChanged(null)
                            showLocationFilter = false
                        }
                    )
                    state.availableLocations.forEach { (id, name) ->
                        DropdownMenuItem(
                            text = { Text(name ?: id ?: "") },
                            onClick = {
                                onLocationFilterChanged(id)
                                showLocationFilter = false
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NewBookingContent(
    state: NewBookingState,
    locale: String,
    modifier: Modifier = Modifier,
    onDateSelected: (LocalDate) -> Unit,
    onRefresh: () -> Unit,
    onBookSession: (AvailableSession) -> Unit,
    onRetry: () -> Unit
) {
    val pullToRefreshState = rememberPullToRefreshState()

    Column(modifier = modifier.fillMaxSize()) {
        // Date selector
        DateSelector(
            dates = state.availableDates,
            selectedDate = state.selectedDate,
            locale = locale,
            onDateSelected = onDateSelected
        )

        // Sessions content
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
                    EmptySessions(locale = locale)
                } else {
                    PullToRefreshBox(
                        isRefreshing = state.isRefreshing,
                        onRefresh = onRefresh,
                        state = pullToRefreshState,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Group sessions by time
                            state.sessionsGroupedByTime.forEach { (time, sessions) ->
                                item(key = "header_$time") {
                                    TimeHeader(time = time)
                                }

                                items(
                                    items = sessions,
                                    key = { it.id }
                                ) { session ->
                                    SessionCard(
                                        session = session,
                                        locale = locale,
                                        onBook = { onBookSession(session) }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Horizontal date selector with day chips.
 */
@Composable
private fun DateSelector(
    dates: List<LocalDate>,
    selectedDate: LocalDate?,
    locale: String,
    onDateSelected: (LocalDate) -> Unit
) {
    val today = Clock.System.todayIn(TimeZone.currentSystemDefault())

    LazyRow(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface)
            .padding(vertical = 12.dp),
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(dates) { date ->
            DateChip(
                date = date,
                isSelected = date == selectedDate,
                isToday = date == today,
                locale = locale,
                onClick = { onDateSelected(date) }
            )
        }
    }
}

@Composable
private fun DateChip(
    date: LocalDate,
    isSelected: Boolean,
    isToday: Boolean,
    locale: String,
    onClick: () -> Unit
) {
    val backgroundColor = when {
        isSelected -> MaterialTheme.colorScheme.primary
        else -> MaterialTheme.colorScheme.surface
    }
    val contentColor = when {
        isSelected -> MaterialTheme.colorScheme.onPrimary
        else -> MaterialTheme.colorScheme.onSurface
    }
    val borderColor = when {
        isSelected -> MaterialTheme.colorScheme.primary
        isToday -> MaterialTheme.colorScheme.primary
        else -> MaterialTheme.colorScheme.outline
    }

    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .border(1.dp, borderColor, RoundedCornerShape(12.dp))
            .background(backgroundColor)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Day of week abbreviation
        Text(
            text = date.dayOfWeek.abbreviation(locale),
            style = MaterialTheme.typography.labelSmall,
            color = contentColor.copy(alpha = 0.7f)
        )

        Spacer(modifier = Modifier.height(4.dp))

        // Day number
        Text(
            text = date.dayOfMonth.toString(),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = contentColor
        )

        // "Today" indicator
        if (isToday) {
            Spacer(modifier = Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(
                        if (isSelected) MaterialTheme.colorScheme.onPrimary
                        else MaterialTheme.colorScheme.primary
                    )
            )
        }
    }
}

/**
 * Time header for session groups.
 */
@Composable
private fun TimeHeader(time: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.Schedule,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = time,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.primary
        )
    }
}

/**
 * Session card showing class details and book button.
 */
@Composable
private fun SessionCard(
    session: AvailableSession,
    locale: String,
    onBook: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
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
            // Header row: Class name + Spots badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = session.className.localized(locale),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )

                Spacer(modifier = Modifier.width(8.dp))

                SpotsBadge(
                    spotsRemaining = session.spotsRemaining,
                    capacity = session.capacity,
                    locale = locale
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Time and duration
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Schedule,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "${formatTime(session.startTime)} - ${formatTime(session.endTime)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "(${session.duration} ${if (locale == "ar") "دقيقة" else "min"})",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                )
            }

            // Location and trainer
            if (session.locationName != null || session.trainerName != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    session.locationName?.let { location ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(2.dp))
                            Text(
                                text = location,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    session.trainerName?.let { trainer ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(2.dp))
                            Text(
                                text = trainer,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Action button row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Already booked indicator
                if (session.isBooked) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.secondaryContainer)
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.secondary,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (locale == "ar") "محجوز" else "Booked",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                } else {
                    // Book button
                    val buttonEnabled = session.isBookable || session.isFull
                    val buttonText = when {
                        session.isFull -> if (locale == "ar") "انضم للقائمة" else "Join Waitlist"
                        else -> if (locale == "ar") "احجز الآن" else "Book Now"
                    }

                    Button(
                        onClick = onBook,
                        enabled = buttonEnabled,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (session.isFull) {
                                MaterialTheme.colorScheme.tertiary
                            } else {
                                MaterialTheme.colorScheme.primary
                            }
                        )
                    ) {
                        Text(text = buttonText)
                    }
                }
            }

            // Booking error message
            session.bookingError?.let { error ->
                if (!session.isBookable && !session.isFull && !session.isBooked) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = error,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
        }
    }
}

/**
 * Spots remaining badge with color coding.
 */
@Composable
private fun SpotsBadge(
    spotsRemaining: Int,
    capacity: Int,
    locale: String
) {
    val (backgroundColor, contentColor) = when {
        spotsRemaining <= 0 -> MaterialTheme.colorScheme.errorContainer to MaterialTheme.colorScheme.error
        spotsRemaining <= 3 -> MaterialTheme.colorScheme.tertiaryContainer to MaterialTheme.colorScheme.tertiary
        else -> MaterialTheme.colorScheme.secondaryContainer to MaterialTheme.colorScheme.secondary
    }

    val text = when {
        spotsRemaining <= 0 -> if (locale == "ar") "ممتلئ" else "Full"
        else -> if (locale == "ar") "$spotsRemaining متبقي" else "$spotsRemaining left"
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundColor)
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.SemiBold,
            color = contentColor
        )
    }
}

/**
 * Booking confirmation dialog.
 */
@Composable
private fun BookingConfirmationDialog(
    session: AvailableSession,
    locale: String,
    isBooking: Boolean,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = { if (!isBooking) onDismiss() },
        title = {
            Text(
                text = if (session.isFull) {
                    if (locale == "ar") "الانضمام لقائمة الانتظار" else "Join Waitlist"
                } else {
                    if (locale == "ar") "تأكيد الحجز" else "Confirm Booking"
                },
                style = MaterialTheme.typography.titleLarge
            )
        },
        text = {
            Column {
                Text(
                    text = session.className.localized(locale),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(8.dp))

                // Date
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.CalendarMonth,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = formatDateFull(session.sessionDate, locale),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))

                // Time
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "${formatTime(session.startTime)} - ${formatTime(session.endTime)}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }

                // Location
                session.locationName?.let { location ->
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.LocationOn,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = location,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }

                if (session.isFull) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = if (locale == "ar") {
                            "الحصة ممتلئة. سيتم إضافتك إلى قائمة الانتظار."
                        } else {
                            "This class is full. You'll be added to the waitlist."
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !isBooking,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (session.isFull) {
                        MaterialTheme.colorScheme.tertiary
                    } else {
                        MaterialTheme.colorScheme.primary
                    }
                )
            ) {
                if (isBooking) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text(
                    text = if (session.isFull) {
                        if (locale == "ar") "انضم" else "Join"
                    } else {
                        if (locale == "ar") "تأكيد" else "Confirm"
                    }
                )
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !isBooking
            ) {
                Text(text = if (locale == "ar") "إلغاء" else "Cancel")
            }
        }
    )
}

/**
 * Empty state for no sessions.
 */
@Composable
private fun EmptySessions(locale: String) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = Icons.Default.CalendarMonth,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f),
                modifier = Modifier.size(80.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = if (locale == "ar") "لا توجد حصص متاحة" else "No sessions available",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = if (locale == "ar") {
                    "جرب تغيير التاريخ أو الفلاتر"
                } else {
                    "Try changing the date or filters"
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

// Helper functions

private fun DayOfWeek.abbreviation(locale: String): String {
    return when (this) {
        DayOfWeek.MONDAY -> if (locale == "ar") "إثن" else "Mon"
        DayOfWeek.TUESDAY -> if (locale == "ar") "ثلا" else "Tue"
        DayOfWeek.WEDNESDAY -> if (locale == "ar") "أرب" else "Wed"
        DayOfWeek.THURSDAY -> if (locale == "ar") "خمي" else "Thu"
        DayOfWeek.FRIDAY -> if (locale == "ar") "جمع" else "Fri"
        DayOfWeek.SATURDAY -> if (locale == "ar") "سبت" else "Sat"
        DayOfWeek.SUNDAY -> if (locale == "ar") "أحد" else "Sun"
    }
}

private fun formatTime(time: LocalTime): String {
    val hour = time.hour.toString().padStart(2, '0')
    val minute = time.minute.toString().padStart(2, '0')
    return "$hour:$minute"
}

private fun formatDateFull(date: LocalDate, locale: String): String {
    val dayName = date.dayOfWeek.abbreviation(locale)
    val day = date.dayOfMonth.toString()
    val month = date.monthNumber.toString()
    val year = date.year.toString()

    return if (locale == "ar") {
        "$dayName، $day/$month/$year"
    } else {
        "$dayName, $day/$month/$year"
    }
}

private fun LocalizedText.localized(locale: String): String {
    return if (locale == "ar") ar ?: en else en
}
