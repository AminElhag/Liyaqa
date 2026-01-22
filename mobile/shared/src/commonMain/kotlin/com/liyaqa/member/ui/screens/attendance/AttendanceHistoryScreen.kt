package com.liyaqa.member.ui.screens.attendance

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.outlined.AccessTime
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.Fingerprint
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.QrCode2
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.automirrored.outlined.TrendingUp
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.rememberDatePickerState
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.domain.model.AttendanceRecord
import com.liyaqa.member.domain.model.AttendanceStatus
import com.liyaqa.member.domain.model.CheckInMethod
import com.liyaqa.member.presentation.attendance.AttendanceEffect
import com.liyaqa.member.presentation.attendance.AttendanceIntent
import com.liyaqa.member.presentation.attendance.AttendanceState
import com.liyaqa.member.presentation.attendance.AttendanceViewModel
import com.liyaqa.member.presentation.attendance.DateRange
import com.liyaqa.member.ui.components.AttendanceStatusBadge
import com.liyaqa.member.ui.components.EmptyAttendance
import com.liyaqa.member.ui.components.FullScreenLoading
import com.liyaqa.member.ui.components.LoadMoreIndicator
import com.liyaqa.member.ui.components.SkeletonStatsGrid
import com.liyaqa.member.ui.components.StatCard
import com.liyaqa.member.ui.components.StatItem
import com.liyaqa.member.ui.components.StatsGrid
import com.liyaqa.member.ui.components.Trend
import com.liyaqa.member.ui.theme.LocalAppLocale
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.atStartOfDayIn
import kotlinx.datetime.toLocalDateTime
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.attendance_title
import org.jetbrains.compose.resources.stringResource
import org.koin.compose.viewmodel.koinViewModel

/**
 * Attendance History Screen - Shows member's check-in/out history.
 *
 * Features:
 * - Stats summary cards (total, this month, last month, average)
 * - Date range filter (start date, end date pickers)
 * - LazyColumn with AttendanceCard grouped by date
 * - Check-in method icon
 * - Duration display (formatted)
 * - Load more pagination
 * - Empty state
 */
class AttendanceHistoryScreen : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel: AttendanceViewModel = koinViewModel()
        val state by viewModel.state.collectAsState()

        // Handle effects
        LaunchedEffect(Unit) {
            viewModel.effect.collect { effect ->
                when (effect) {
                    is AttendanceEffect.ShowError -> {
                        // TODO: Show snackbar with error.message
                    }
                }
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(stringResource(Res.string.attendance_title)) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back"
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
            }
        ) { paddingValues ->
            AttendanceHistoryContent(
                state = state,
                onIntent = viewModel::onIntent,
                modifier = Modifier.padding(paddingValues)
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AttendanceHistoryContent(
    state: AttendanceState,
    onIntent: (AttendanceIntent) -> Unit,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val listState = rememberLazyListState()

    // Check if we need to load more
    val shouldLoadMore by remember {
        derivedStateOf {
            val lastVisibleIndex = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            val totalItems = state.attendance.items.size
            lastVisibleIndex >= totalItems - 3 && state.attendance.hasMore && !state.attendance.isLoadingMore
        }
    }

    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) {
            onIntent(AttendanceIntent.LoadMore)
        }
    }

    PullToRefreshBox(
        isRefreshing = state.attendance.isRefreshing,
        onRefresh = { onIntent(AttendanceIntent.Refresh) },
        modifier = modifier.fillMaxSize()
    ) {
        LazyColumn(
            state = listState,
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Stats Grid
            item {
                AttendanceStatsSection(
                    state = state,
                    locale = locale
                )
            }

            // Date Range Filter
            item {
                DateRangeFilter(
                    dateRange = state.dateRange,
                    onFilterApply = { start, end ->
                        onIntent(AttendanceIntent.FilterByDateRange(start, end))
                    },
                    onFilterClear = { onIntent(AttendanceIntent.ClearDateFilter) },
                    locale = locale
                )
            }

            // Content
            when {
                state.attendance.isInitialLoading -> {
                    item {
                        FullScreenLoading(modifier = Modifier.height(200.dp))
                    }
                }
                state.attendance.items.isEmpty() -> {
                    item {
                        EmptyAttendance(modifier = Modifier.height(300.dp))
                    }
                }
                else -> {
                    // Grouped by date
                    state.groupedByDate.forEach { (date, records) ->
                        // Date header
                        item(key = "header-$date") {
                            DateHeader(date = date, locale = locale)
                        }

                        // Records for this date
                        items(
                            items = records,
                            key = { it.id }
                        ) { record ->
                            AttendanceCard(
                                record = record,
                                locale = locale
                            )
                        }
                    }

                    // Load more indicator
                    if (state.attendance.isLoadingMore) {
                        item {
                            LoadMoreIndicator()
                        }
                    }
                }
            }

            // Bottom spacing
            item {
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun AttendanceStatsSection(
    state: AttendanceState,
    locale: String
) {
    val isLoading = !state.hasStats

    if (isLoading) {
        SkeletonStatsGrid()
    } else {
        val trend = when {
            state.thisMonthVisits > state.lastMonthVisits -> Trend.UP
            state.thisMonthVisits < state.lastMonthVisits -> Trend.DOWN
            else -> Trend.FLAT
        }

        val stats = listOf(
            StatItem(
                icon = Icons.Outlined.History,
                value = state.totalVisits.toString(),
                label = if (locale == "ar") "إجمالي الزيارات" else "Total Visits"
            ),
            StatItem(
                icon = Icons.Outlined.Schedule,
                value = state.thisMonthVisits.toString(),
                label = if (locale == "ar") "هذا الشهر" else "This Month",
                trend = trend,
                trendValue = if (state.lastMonthVisits > 0) {
                    val diff = state.thisMonthVisits - state.lastMonthVisits
                    if (diff >= 0) "+$diff" else "$diff"
                } else null
            ),
            StatItem(
                icon = Icons.Outlined.AccessTime,
                value = state.lastMonthVisits.toString(),
                label = if (locale == "ar") "الشهر الماضي" else "Last Month"
            ),
            StatItem(
                icon = Icons.AutoMirrored.Outlined.TrendingUp,
                value = state.formattedAverageVisits,
                label = if (locale == "ar") "متوسط/شهر" else "Avg/Month"
            )
        )

        StatsGrid(stats = stats)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DateRangeFilter(
    dateRange: DateRange,
    onFilterApply: (LocalDate, LocalDate) -> Unit,
    onFilterClear: () -> Unit,
    locale: String
) {
    var showStartPicker by remember { mutableStateOf(false) }
    var showEndPicker by remember { mutableStateOf(false) }
    var selectedStart by remember { mutableStateOf(dateRange.startDate) }
    var selectedEnd by remember { mutableStateOf(dateRange.endDate) }

    val filterLabel = if (locale == "ar") "تصفية حسب التاريخ" else "Filter by Date"
    val fromLabel = if (locale == "ar") "من" else "From"
    val toLabel = if (locale == "ar") "إلى" else "To"
    val applyLabel = if (locale == "ar") "تطبيق" else "Apply"
    val cancelLabel = if (locale == "ar") "إلغاء" else "Cancel"

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.DateRange,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = filterLabel,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                if (dateRange.isSet) {
                    IconButton(
                        onClick = {
                            selectedStart = null
                            selectedEnd = null
                            onFilterClear()
                        },
                        modifier = Modifier.size(24.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Clear,
                            contentDescription = "Clear filter",
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Start date chip
                AssistChip(
                    onClick = { showStartPicker = true },
                    label = {
                        Text(
                            text = selectedStart?.let { formatDateShort(it, locale) }
                                ?: fromLabel
                        )
                    },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.DateRange,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                    },
                    modifier = Modifier.weight(1f)
                )

                // End date chip
                AssistChip(
                    onClick = { showEndPicker = true },
                    label = {
                        Text(
                            text = selectedEnd?.let { formatDateShort(it, locale) }
                                ?: toLabel
                        )
                    },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.DateRange,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                    },
                    modifier = Modifier.weight(1f)
                )
            }

            // Apply button (only show if both dates selected)
            if (selectedStart != null && selectedEnd != null && !dateRange.isSet) {
                Spacer(modifier = Modifier.height(12.dp))
                TextButton(
                    onClick = {
                        selectedStart?.let { start ->
                            selectedEnd?.let { end ->
                                onFilterApply(start, end)
                            }
                        }
                    },
                    modifier = Modifier.align(Alignment.End)
                ) {
                    Text(applyLabel)
                }
            }
        }
    }

    // Start date picker dialog
    if (showStartPicker) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = selectedStart?.atStartOfDayIn(TimeZone.currentSystemDefault())
                ?.toEpochMilliseconds()
        )

        DatePickerDialog(
            onDismissRequest = { showStartPicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            selectedStart = Instant.fromEpochMilliseconds(millis)
                                .toLocalDateTime(TimeZone.currentSystemDefault()).date
                        }
                        showStartPicker = false
                    }
                ) {
                    Text(if (locale == "ar") "تأكيد" else "Confirm")
                }
            },
            dismissButton = {
                TextButton(onClick = { showStartPicker = false }) {
                    Text(cancelLabel)
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    // End date picker dialog
    if (showEndPicker) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = selectedEnd?.atStartOfDayIn(TimeZone.currentSystemDefault())
                ?.toEpochMilliseconds()
        )

        DatePickerDialog(
            onDismissRequest = { showEndPicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            selectedEnd = Instant.fromEpochMilliseconds(millis)
                                .toLocalDateTime(TimeZone.currentSystemDefault()).date
                        }
                        showEndPicker = false
                    }
                ) {
                    Text(if (locale == "ar") "تأكيد" else "Confirm")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEndPicker = false }) {
                    Text(cancelLabel)
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }
}

@Composable
private fun DateHeader(
    date: LocalDate,
    locale: String
) {
    Text(
        text = formatDateFull(date, locale),
        style = MaterialTheme.typography.titleSmall,
        fontWeight = FontWeight.SemiBold,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(vertical = 8.dp)
    )
}

@Composable
private fun AttendanceCard(
    record: AttendanceRecord,
    locale: String
) {
    val tz = TimeZone.currentSystemDefault()
    val checkInDateTime = record.checkInTime.toLocalDateTime(tz)
    val checkOutDateTime = record.checkOutTime?.toLocalDateTime(tz)

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Check-in method icon
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = record.checkInMethod.icon,
                    contentDescription = null,
                    modifier = Modifier.size(22.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
            }

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column {
                        Text(
                            text = formatTime(checkInDateTime.time, locale),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = record.checkInMethod.getLabel(locale),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    AttendanceStatusBadge(status = record.status)
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // Check-out time
                    Column {
                        Text(
                            text = if (locale == "ar") "وقت الخروج" else "Check-out",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = checkOutDateTime?.let { formatTime(it.time, locale) }
                                ?: (if (locale == "ar") "لم يسجل" else "Not recorded"),
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    // Duration
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = if (locale == "ar") "المدة" else "Duration",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = record.formatDuration()
                                ?: (if (locale == "ar") "-" else "-"),
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }

                // Location (if available)
                record.locationName?.let { location ->
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = location,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

// Extension property for CheckInMethod icon
private val CheckInMethod.icon: ImageVector
    get() = when (this) {
        CheckInMethod.MANUAL -> Icons.Outlined.Person
        CheckInMethod.QR_CODE -> Icons.Outlined.QrCode2
        CheckInMethod.CARD -> Icons.Outlined.CreditCard
        CheckInMethod.BIOMETRIC -> Icons.Outlined.Fingerprint
    }

// Get localized label for CheckInMethod
private fun CheckInMethod.getLabel(locale: String): String {
    return when (this) {
        CheckInMethod.MANUAL -> if (locale == "ar") "يدوي" else "Manual"
        CheckInMethod.QR_CODE -> if (locale == "ar") "رمز QR" else "QR Code"
        CheckInMethod.CARD -> if (locale == "ar") "بطاقة" else "Card"
        CheckInMethod.BIOMETRIC -> if (locale == "ar") "بيومتري" else "Biometric"
    }
}

// Format date as short (DD/MM)
private fun formatDateShort(date: LocalDate, locale: String): String {
    val day = date.dayOfMonth.toString().padStart(2, '0')
    val month = date.monthNumber.toString().padStart(2, '0')
    return "$day/$month"
}

// Format date as full (Day, DD Month YYYY)
private fun formatDateFull(date: LocalDate, locale: String): String {
    val dayName = getDayName(date.dayOfWeek.ordinal, locale)
    val day = date.dayOfMonth
    val month = getMonthName(date.monthNumber, locale)
    val year = date.year
    return if (locale == "ar") {
        "$dayName، $day $month $year"
    } else {
        "$dayName, $day $month $year"
    }
}

// Format time as HH:MM AM/PM
private fun formatTime(time: kotlinx.datetime.LocalTime, locale: String): String {
    val hour = time.hour
    val minute = time.minute.toString().padStart(2, '0')
    return if (locale == "ar") {
        val period = if (hour < 12) "ص" else "م"
        val displayHour = if (hour == 0) 12 else if (hour > 12) hour - 12 else hour
        "$displayHour:$minute $period"
    } else {
        val period = if (hour < 12) "AM" else "PM"
        val displayHour = if (hour == 0) 12 else if (hour > 12) hour - 12 else hour
        "$displayHour:$minute $period"
    }
}

// Get day name
private fun getDayName(dayOrdinal: Int, locale: String): String {
    val days = if (locale == "ar") {
        listOf("الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد")
    } else {
        listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    }
    return days.getOrElse(dayOrdinal) { "" }
}

// Get month name
private fun getMonthName(month: Int, locale: String): String {
    val months = if (locale == "ar") {
        listOf("", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر")
    } else {
        listOf("", "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December")
    }
    return months.getOrElse(month) { "" }
}
