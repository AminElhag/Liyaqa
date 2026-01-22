package com.liyaqa.member.ui.screens.bookings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.BookingStatus
import com.liyaqa.member.ui.components.BookingStatusBadge
import com.liyaqa.member.ui.theme.LocalAppLocale
import kotlinx.datetime.Clock
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlinx.datetime.todayIn

/**
 * Booking Detail Screen - Shows full booking details with status timeline.
 *
 * Features:
 * - Full booking information
 * - Status timeline
 * - Cancel button (if applicable)
 * - Check-in status indicator
 *
 * @param bookingId The ID of the booking to display
 * @param booking Optional pre-loaded booking object (if null, will show placeholder)
 */
data class BookingDetailScreen(
    val bookingId: String,
    val booking: Booking? = null
) : Screen {

    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow

        // Use provided booking or show placeholder
        val displayBooking = booking ?: createPlaceholderBooking(bookingId)

        BookingDetailScreenContent(
            booking = displayBooking,
            onNavigateBack = { navigator.pop() },
            onCancelBooking = {
                // TODO: Implement cancel through BookingsViewModel
                navigator.pop()
            }
        )
    }
}

/**
 * Creates a placeholder booking for display while loading.
 */
private fun createPlaceholderBooking(id: String): Booking {
    return Booking(
        id = id,
        sessionId = "",
        className = com.liyaqa.member.core.localization.LocalizedText(
            en = "Loading...",
            ar = "جاري التحميل..."
        ),
        sessionDate = Clock.System.todayIn(TimeZone.currentSystemDefault()),
        startTime = LocalTime(9, 0),
        endTime = LocalTime(10, 0),
        location = null,
        trainer = null,
        status = BookingStatus.CONFIRMED,
        checkedIn = false,
        bookedAt = Clock.System.now()
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BookingDetailScreenContent(
    booking: Booking,
    onNavigateBack: () -> Unit,
    onCancelBooking: () -> Unit
) {
    val locale = LocalAppLocale.current
    var showCancelDialog by remember { mutableStateOf(false) }
    var isCancelling by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (locale == "ar") "تفاصيل الحجز" else "Booking Details",
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
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Class Info Card
            ClassInfoCard(booking = booking, locale = locale)

            // Session Details Card
            SessionDetailsCard(booking = booking, locale = locale)

            // Status Timeline Card
            StatusTimelineCard(booking = booking, locale = locale)

            // Cancel Button (if applicable)
            if (booking.status == BookingStatus.CONFIRMED || booking.status == BookingStatus.WAITLISTED) {
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = { showCancelDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Cancel,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = if (locale == "ar") "إلغاء الحجز" else "Cancel Booking")
                }
            }
        }

        // Cancel Confirmation Dialog
        if (showCancelDialog) {
            AlertDialog(
                onDismissRequest = { if (!isCancelling) showCancelDialog = false },
                title = {
                    Text(
                        text = if (locale == "ar") "إلغاء الحجز؟" else "Cancel Booking?",
                        style = MaterialTheme.typography.titleLarge
                    )
                },
                text = {
                    Text(
                        text = if (locale == "ar") {
                            "هل أنت متأكد من إلغاء هذا الحجز؟"
                        } else {
                            "Are you sure you want to cancel this booking?"
                        },
                        style = MaterialTheme.typography.bodyMedium
                    )
                },
                confirmButton = {
                    Button(
                        onClick = {
                            isCancelling = true
                            onCancelBooking()
                        },
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
                        Text(text = if (locale == "ar") "إلغاء" else "Cancel")
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = { showCancelDialog = false },
                        enabled = !isCancelling
                    ) {
                        Text(text = if (locale == "ar") "رجوع" else "Go Back")
                    }
                }
            )
        }
    }
}

@Composable
private fun ClassInfoCard(
    booking: Booking,
    locale: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            // Class name and status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = booking.className.localized(locale),
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                BookingStatusBadge(status = booking.status)
            }

            Spacer(modifier = Modifier.height(16.dp))

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            Spacer(modifier = Modifier.height(16.dp))

            // Booking ID
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.FitnessCenter,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = if (locale == "ar") "رقم الحجز" else "Booking ID",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = booking.id.take(8).uppercase(),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}

@Composable
private fun SessionDetailsCard(
    booking: Booking,
    locale: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Text(
                text = if (locale == "ar") "تفاصيل الجلسة" else "Session Details",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Date
            DetailRow(
                icon = Icons.Default.CalendarMonth,
                label = if (locale == "ar") "التاريخ" else "Date",
                value = formatDateFull(booking.sessionDate, locale)
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Time
            DetailRow(
                icon = Icons.Default.Schedule,
                label = if (locale == "ar") "الوقت" else "Time",
                value = "${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}"
            )

            // Location
            booking.location?.let { location ->
                Spacer(modifier = Modifier.height(12.dp))
                DetailRow(
                    icon = Icons.Default.LocationOn,
                    label = if (locale == "ar") "الموقع" else "Location",
                    value = location
                )
            }

            // Trainer
            booking.trainer?.let { trainer ->
                Spacer(modifier = Modifier.height(12.dp))
                DetailRow(
                    icon = Icons.Default.Person,
                    label = if (locale == "ar") "المدرب" else "Trainer",
                    value = trainer
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Booked at
            DetailRow(
                icon = Icons.Default.AccessTime,
                label = if (locale == "ar") "تم الحجز في" else "Booked At",
                value = formatInstant(booking.bookedAt, locale)
            )
        }
    }
}

@Composable
private fun DetailRow(
    icon: ImageVector,
    label: String,
    value: String
) {
    Row(
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@Composable
private fun StatusTimelineCard(
    booking: Booking,
    locale: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Text(
                text = if (locale == "ar") "مراحل الحجز" else "Booking Timeline",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Timeline items based on status
            val timelineSteps = getTimelineSteps(booking, locale)
            timelineSteps.forEachIndexed { index, step ->
                TimelineItem(
                    title = step.title,
                    subtitle = step.subtitle,
                    isCompleted = step.isCompleted,
                    isActive = step.isActive,
                    isLast = index == timelineSteps.lastIndex
                )
            }
        }
    }
}

@Composable
private fun TimelineItem(
    title: String,
    subtitle: String?,
    isCompleted: Boolean,
    isActive: Boolean,
    isLast: Boolean
) {
    Row(
        modifier = Modifier.fillMaxWidth()
    ) {
        // Timeline indicator
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .clip(CircleShape)
                    .background(
                        when {
                            isCompleted -> MaterialTheme.colorScheme.primary
                            isActive -> MaterialTheme.colorScheme.tertiary
                            else -> MaterialTheme.colorScheme.outlineVariant
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (isCompleted) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            if (!isLast) {
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(40.dp)
                        .background(
                            if (isCompleted) MaterialTheme.colorScheme.primary
                            else MaterialTheme.colorScheme.outlineVariant
                        )
                )
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        // Content
        Column(
            modifier = Modifier.padding(bottom = if (isLast) 0.dp else 24.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Normal,
                color = when {
                    isActive -> MaterialTheme.colorScheme.onSurface
                    isCompleted -> MaterialTheme.colorScheme.onSurface
                    else -> MaterialTheme.colorScheme.onSurfaceVariant
                }
            )
            subtitle?.let {
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

private data class TimelineStep(
    val title: String,
    val subtitle: String?,
    val isCompleted: Boolean,
    val isActive: Boolean
)

private fun getTimelineSteps(booking: Booking, locale: String): List<TimelineStep> {
    val isAr = locale == "ar"
    val steps = mutableListOf<TimelineStep>()

    // Handle cancelled status
    if (booking.status == BookingStatus.CANCELLED) {
        return listOf(
            TimelineStep(
                title = if (isAr) "تم الحجز" else "Booked",
                subtitle = formatInstant(booking.bookedAt, locale),
                isCompleted = true,
                isActive = false
            ),
            TimelineStep(
                title = if (isAr) "ملغي" else "Cancelled",
                subtitle = if (isAr) "تم إلغاء الحجز" else "Booking was cancelled",
                isCompleted = true,
                isActive = true
            )
        )
    }

    // Handle no-show status
    if (booking.status == BookingStatus.NO_SHOW) {
        return listOf(
            TimelineStep(
                title = if (isAr) "تم الحجز" else "Booked",
                subtitle = formatInstant(booking.bookedAt, locale),
                isCompleted = true,
                isActive = false
            ),
            TimelineStep(
                title = if (isAr) "تم التأكيد" else "Confirmed",
                subtitle = null,
                isCompleted = true,
                isActive = false
            ),
            TimelineStep(
                title = if (isAr) "لم يحضر" else "No Show",
                subtitle = if (isAr) "لم يتم الحضور" else "Did not attend",
                isCompleted = true,
                isActive = true
            )
        )
    }

    // Step 1: Booked
    steps.add(
        TimelineStep(
            title = if (isAr) "تم الحجز" else "Booked",
            subtitle = formatInstant(booking.bookedAt, locale),
            isCompleted = true,
            isActive = booking.status == BookingStatus.CONFIRMED || booking.status == BookingStatus.WAITLISTED
        )
    )

    // Step 2: Waitlist (if applicable)
    if (booking.status == BookingStatus.WAITLISTED) {
        steps.add(
            TimelineStep(
                title = if (isAr) "في قائمة الانتظار" else "On Waitlist",
                subtitle = if (isAr) "في انتظار مكان شاغر" else "Waiting for available spot",
                isCompleted = false,
                isActive = true
            )
        )
    }

    // Step 3: Confirmed
    val isConfirmed = booking.status in listOf(
        BookingStatus.CONFIRMED,
        BookingStatus.CHECKED_IN
    )
    if (booking.status != BookingStatus.WAITLISTED) {
        steps.add(
            TimelineStep(
                title = if (isAr) "تم التأكيد" else "Confirmed",
                subtitle = null,
                isCompleted = isConfirmed,
                isActive = booking.status == BookingStatus.CONFIRMED && !booking.checkedIn
            )
        )
    }

    // Step 4: Check-in (terminal successful state)
    val isCheckedIn = booking.status == BookingStatus.CHECKED_IN || booking.checkedIn
    steps.add(
        TimelineStep(
            title = if (isAr) "تم الدخول" else "Checked In",
            subtitle = if (isCheckedIn) {
                if (isAr) "تم تسجيل الدخول بنجاح" else "Attendance recorded successfully"
            } else null,
            isCompleted = isCheckedIn,
            isActive = isCheckedIn
        )
    )

    return steps
}

// Helper functions

private fun formatTime(time: LocalTime): String {
    val hour = time.hour.toString().padStart(2, '0')
    val minute = time.minute.toString().padStart(2, '0')
    return "$hour:$minute"
}

private fun formatDateFull(date: LocalDate, locale: String): String {
    val dayName = when (date.dayOfWeek) {
        DayOfWeek.MONDAY -> if (locale == "ar") "الإثنين" else "Monday"
        DayOfWeek.TUESDAY -> if (locale == "ar") "الثلاثاء" else "Tuesday"
        DayOfWeek.WEDNESDAY -> if (locale == "ar") "الأربعاء" else "Wednesday"
        DayOfWeek.THURSDAY -> if (locale == "ar") "الخميس" else "Thursday"
        DayOfWeek.FRIDAY -> if (locale == "ar") "الجمعة" else "Friday"
        DayOfWeek.SATURDAY -> if (locale == "ar") "السبت" else "Saturday"
        DayOfWeek.SUNDAY -> if (locale == "ar") "الأحد" else "Sunday"
    }
    val day = date.dayOfMonth.toString()
    val month = date.monthNumber.toString()
    val year = date.year.toString()

    return if (locale == "ar") {
        "$dayName، $day/$month/$year"
    } else {
        "$dayName, $day/$month/$year"
    }
}

private fun formatInstant(instant: Instant, locale: String): String {
    val dateTime = instant.toLocalDateTime(TimeZone.currentSystemDefault())
    val date = formatDateFull(dateTime.date, locale)
    val time = formatTime(dateTime.time)
    return "$date - $time"
}

private fun com.liyaqa.member.core.localization.LocalizedText.localized(locale: String): String {
    return if (locale == "ar") ar ?: en else en
}
