package com.liyaqa.member.ui.screens.home

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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.liyaqa.member.core.localization.LocalizedText
import com.liyaqa.member.core.localization.formatCurrency
import com.liyaqa.member.domain.model.AttendanceStats
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.BookingStatus
import com.liyaqa.member.domain.model.PendingInvoicesSummary
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.model.SubscriptionStatus
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.isLoading
import com.liyaqa.member.presentation.viewmodel.DashboardEffect
import com.liyaqa.member.presentation.viewmodel.DashboardIntent
import com.liyaqa.member.presentation.viewmodel.DashboardState
import com.liyaqa.member.presentation.viewmodel.DashboardViewModel
import com.liyaqa.member.ui.components.BookingStatusBadge
import com.liyaqa.member.ui.components.ClassesRemainingProgress
import com.liyaqa.member.ui.components.DaysRemainingProgress
import com.liyaqa.member.ui.components.EmptyBookings
import com.liyaqa.member.ui.components.ErrorState
import com.liyaqa.member.ui.components.FullScreenLoading
import com.liyaqa.member.ui.components.SkeletonCard
import com.liyaqa.member.ui.components.SkeletonStatsGrid
import com.liyaqa.member.ui.components.StatItem
import com.liyaqa.member.ui.components.StatsGrid
import com.liyaqa.member.ui.components.SubscriptionStatusBadge
import com.liyaqa.member.ui.components.Trend
import com.liyaqa.member.ui.theme.LocalAppLocale
import kotlinx.coroutines.flow.collectLatest
import org.koin.compose.viewmodel.koinViewModel
import kotlin.math.pow
import kotlin.math.roundToInt

/**
 * Format a decimal number with specified decimal places.
 * Multiplatform-compatible alternative to String.format.
 */
private fun formatDecimal(value: Double, decimalPlaces: Int): String {
    val factor = 10.0.pow(decimalPlaces)
    val rounded = (value * factor).roundToInt() / factor
    val intPart = rounded.toLong()
    val decPart = ((rounded - intPart) * factor).roundToInt()
    return if (decimalPlaces > 0) {
        "$intPart.${decPart.toString().padStart(decimalPlaces, '0')}"
    } else {
        intPart.toString()
    }
}

/**
 * Home Screen - Main dashboard for the member app.
 *
 * Displays:
 * - Quick QR code card for check-in
 * - Subscription status with progress
 * - Attendance statistics grid
 * - Upcoming classes list
 * - Pending invoices alert
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: DashboardViewModel = koinViewModel(),
    onNavigateToQr: () -> Unit = {},
    onNavigateToNotifications: () -> Unit = {},
    onNavigateToBooking: (String) -> Unit = {},
    onNavigateToInvoices: (String?) -> Unit = {},
    onNavigateToClasses: () -> Unit = {}
) {
    val state by viewModel.state.collectAsState()
    val locale = LocalAppLocale.current
    val pullToRefreshState = rememberPullToRefreshState()

    // Handle one-time effects
    LaunchedEffect(Unit) {
        viewModel.effect.collectLatest { effect ->
            when (effect) {
                is DashboardEffect.NavigateToQr -> onNavigateToQr()
                is DashboardEffect.NavigateToNotifications -> onNavigateToNotifications()
                is DashboardEffect.NavigateToBooking -> onNavigateToBooking(effect.bookingId)
                is DashboardEffect.NavigateToInvoices -> onNavigateToInvoices(effect.invoiceId)
                is DashboardEffect.ShowError -> {
                    // TODO: Show snackbar with error message
                }
            }
        }
    }

    PullToRefreshBox(
        isRefreshing = state.isRefreshing,
        onRefresh = { viewModel.onIntent(DashboardIntent.Refresh) },
        state = pullToRefreshState,
        modifier = Modifier.fillMaxSize()
    ) {
        when {
            // Initial loading state
            state.loading.isLoading && !state.hasData -> {
                FullScreenLoading()
            }

            // Error state without data
            state.loading is LoadingState.Error && !state.hasData -> {
                val errorMessage = (state.loading as LoadingState.Error).message
                ErrorState(
                    message = errorMessage,
                    onRetry = { viewModel.onIntent(DashboardIntent.LoadDashboard) }
                )
            }

            // Content
            else -> {
                HomeScreenContent(
                    state = state,
                    locale = locale,
                    onQrClick = { viewModel.onIntent(DashboardIntent.NavigateToQr) },
                    onClassClick = { viewModel.onIntent(DashboardIntent.NavigateToBooking(it)) },
                    onInvoicesClick = { viewModel.onIntent(DashboardIntent.NavigateToInvoices()) },
                    onViewAllClassesClick = onNavigateToClasses
                )
            }
        }
    }
}

@Composable
private fun HomeScreenContent(
    state: DashboardState,
    locale: String,
    onQrClick: () -> Unit,
    onClassClick: (String) -> Unit,
    onInvoicesClick: () -> Unit,
    onViewAllClassesClick: () -> Unit
) {
    val isLoading = state.loading.isLoading

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Quick QR Card
        item {
            QuickQrCard(
                onClick = onQrClick,
                isLoading = isLoading
            )
        }

        // Subscription Status Card
        item {
            if (isLoading && state.subscription == null) {
                SkeletonCard()
            } else if (state.subscription != null) {
                SubscriptionStatusCard(
                    subscription = state.subscription,
                    locale = locale
                )
            } else {
                NoSubscriptionCard(locale = locale)
            }
        }

        // Stats Grid Section
        item {
            StatsGridSection(
                stats = state.attendanceStats,
                subscription = state.subscription,
                locale = locale,
                isLoading = isLoading
            )
        }

        // Pending Invoices Alert
        if (state.hasPendingInvoices) {
            item {
                PendingInvoicesAlert(
                    summary = state.pendingInvoices!!,
                    locale = locale,
                    onClick = onInvoicesClick
                )
            }
        }

        // Upcoming Classes Section Header
        item {
            SectionHeader(
                title = if (locale == "ar") "الحصص القادمة" else "Upcoming Classes",
                actionText = if (locale == "ar") "عرض الكل" else "View All",
                onActionClick = onViewAllClassesClick
            )
        }

        // Upcoming Classes List
        if (isLoading && state.upcomingClasses.isEmpty()) {
            items(2) {
                SkeletonCard()
            }
        } else if (state.upcomingClasses.isEmpty()) {
            item {
                EmptyUpcomingClasses(locale = locale)
            }
        } else {
            items(
                items = state.upcomingClasses.take(5),
                key = { it.id }
            ) { booking ->
                UpcomingClassCard(
                    booking = booking,
                    locale = locale,
                    onClick = { onClassClick(booking.id) }
                )
            }
        }

        // Bottom spacing
        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

// ============================================
// Quick QR Card
// ============================================

@Composable
fun QuickQrCard(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isLoading: Boolean = false
) {
    val locale = LocalAppLocale.current
    val title = if (locale == "ar") "تسجيل الدخول" else "Check In"
    val subtitle = if (locale == "ar") "انقر لعرض رمز QR" else "Tap to show QR code"

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(enabled = !isLoading) { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.Transparent
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.horizontalGradient(
                        colors = listOf(
                            Color(0xFF1E40AF), // Primary blue
                            Color(0xFF3B5FC8)  // Lighter blue
                        )
                    ),
                    shape = RoundedCornerShape(16.dp)
                )
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }

                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.White.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.QrCode2,
                        contentDescription = null,
                        modifier = Modifier.size(40.dp),
                        tint = Color.White
                    )
                }
            }
        }
    }
}

// ============================================
// Subscription Status Card
// ============================================

@Composable
fun SubscriptionStatusCard(
    subscription: Subscription,
    locale: String,
    modifier: Modifier = Modifier
) {
    val planLabel = if (locale == "ar") "الخطة" else "Plan"
    val statusLabel = if (locale == "ar") "الحالة" else "Status"

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header: Plan name and status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = planLabel,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = subscription.planName.localized(locale),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                SubscriptionStatusBadge(status = subscription.status)
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Progress bars
            if (subscription.status == SubscriptionStatus.ACTIVE ||
                subscription.status == SubscriptionStatus.FROZEN
            ) {
                // Days remaining progress
                DaysRemainingProgress(
                    daysRemaining = subscription.daysRemaining,
                    totalDays = 30 // Approximate - could calculate from start/end dates
                )

                // Classes remaining progress (if applicable)
                if (subscription.hasClassLimit) {
                    Spacer(modifier = Modifier.height(12.dp))
                    ClassesRemainingProgress(
                        remaining = subscription.classesRemaining ?: 0,
                        total = subscription.totalClasses ?: 0
                    )
                }
            }

            // Expiring soon warning
            if (subscription.isExpiringSoon && subscription.status == SubscriptionStatus.ACTIVE) {
                Spacer(modifier = Modifier.height(12.dp))
                ExpiringWarning(
                    daysRemaining = subscription.daysRemaining,
                    locale = locale
                )
            }

            // Frozen until info
            subscription.frozenUntil?.let { frozenDate ->
                if (subscription.status == SubscriptionStatus.FROZEN) {
                    Spacer(modifier = Modifier.height(12.dp))
                    val frozenText = if (locale == "ar") {
                        "مجمد حتى: $frozenDate"
                    } else {
                        "Frozen until: $frozenDate"
                    }
                    Text(
                        text = frozenText,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun ExpiringWarning(
    daysRemaining: Int,
    locale: String
) {
    val warningText = if (locale == "ar") {
        "ينتهي خلال $daysRemaining يوم"
    } else {
        "Expires in $daysRemaining days"
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(Color(0xFFFEF3C7)) // Amber-100
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Filled.Warning,
            contentDescription = null,
            modifier = Modifier.size(20.dp),
            tint = Color(0xFFD97706) // Amber-600
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = warningText,
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Medium,
            color = Color(0xFF92400E) // Amber-800
        )
    }
}

@Composable
private fun NoSubscriptionCard(
    locale: String,
    modifier: Modifier = Modifier
) {
    val title = if (locale == "ar") "لا يوجد اشتراك نشط" else "No Active Subscription"
    val subtitle = if (locale == "ar") {
        "تواصل مع الإدارة للاشتراك"
    } else {
        "Contact the front desk to subscribe"
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
            )
        }
    }
}

// ============================================
// Stats Grid Section
// ============================================

@Composable
fun StatsGridSection(
    stats: AttendanceStats?,
    subscription: Subscription?,
    locale: String,
    isLoading: Boolean = false,
    modifier: Modifier = Modifier
) {
    if (isLoading && stats == null) {
        SkeletonStatsGrid(modifier = modifier)
        return
    }

    val totalVisitsLabel = if (locale == "ar") "إجمالي الزيارات" else "Total Visits"
    val thisMonthLabel = if (locale == "ar") "هذا الشهر" else "This Month"
    val daysLeftLabel = if (locale == "ar") "الأيام المتبقية" else "Days Left"
    val classesLeftLabel = if (locale == "ar") "الحصص المتبقية" else "Classes Left"

    // Calculate trend for this month
    val thisMonthTrend = stats?.let {
        when {
            it.thisMonthVisits > it.lastMonthVisits -> Trend.UP
            it.thisMonthVisits < it.lastMonthVisits -> Trend.DOWN
            else -> Trend.FLAT
        }
    }

    val statItems = mutableListOf<StatItem>()

    // Add stats if available
    stats?.let {
        statItems.add(
            StatItem(
                icon = Icons.Outlined.CalendarMonth,
                value = it.totalVisits.toString(),
                label = totalVisitsLabel
            )
        )
        statItems.add(
            StatItem(
                icon = Icons.Filled.CalendarMonth,
                value = it.thisMonthVisits.toString(),
                label = thisMonthLabel,
                trend = thisMonthTrend
            )
        )
    }

    // Add subscription stats if available
    subscription?.let {
        statItems.add(
            StatItem(
                icon = Icons.Filled.AccessTime,
                value = it.daysRemaining.toString(),
                label = daysLeftLabel
            )
        )
        if (it.hasClassLimit) {
            statItems.add(
                StatItem(
                    icon = Icons.Outlined.Receipt,
                    value = (it.classesRemaining ?: 0).toString(),
                    label = classesLeftLabel
                )
            )
        }
    }

    // Fill remaining slots if needed (for 2x2 grid)
    while (statItems.size < 4 && stats != null) {
        val avgLabel = if (locale == "ar") "معدل/شهر" else "Avg/Month"
        statItems.add(
            StatItem(
                icon = Icons.Outlined.CalendarMonth,
                value = formatDecimal(stats.averageVisitsPerMonth.toDouble(), 1),
                label = avgLabel
            )
        )
    }

    if (statItems.isNotEmpty()) {
        StatsGrid(
            stats = statItems.take(4),
            modifier = modifier
        )
    }
}

// ============================================
// Upcoming Classes Section
// ============================================

@Composable
fun UpcomingClassCard(
    booking: Booking,
    locale: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Date badge
            DateBadge(
                date = booking.sessionDate,
                locale = locale
            )

            Spacer(modifier = Modifier.width(12.dp))

            // Class info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = booking.className.localized(locale),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "${booking.startTime} - ${booking.endTime}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                booking.location?.let { location ->
                    Text(
                        text = location,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Status badge
            BookingStatusBadge(status = booking.status)
        }
    }
}

@Composable
private fun DateBadge(
    date: kotlinx.datetime.LocalDate,
    locale: String
) {
    val dayOfWeek = date.dayOfWeek.name.take(3)
    val dayOfMonth = date.dayOfMonth.toString()

    Column(
        modifier = Modifier
            .size(48.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(MaterialTheme.colorScheme.primaryContainer),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = dayOfWeek,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onPrimaryContainer
        )
        Text(
            text = dayOfMonth,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onPrimaryContainer
        )
    }
}

@Composable
private fun EmptyUpcomingClasses(locale: String) {
    val title = if (locale == "ar") "لا توجد حصص قادمة" else "No Upcoming Classes"
    val subtitle = if (locale == "ar") {
        "احجز حصة للبدء"
    } else {
        "Book a class to get started"
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Outlined.CalendarMonth,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
            )
        }
    }
}

// ============================================
// Pending Invoices Alert
// ============================================

@Composable
fun PendingInvoicesAlert(
    summary: PendingInvoicesSummary,
    locale: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val hasOverdue = summary.overdueCount > 0
    val backgroundColor = if (hasOverdue) {
        Color(0xFFFEE2E2) // Red-100
    } else {
        Color(0xFFFEF3C7) // Amber-100
    }
    val iconColor = if (hasOverdue) {
        Color(0xFFDC2626) // Red-600
    } else {
        Color(0xFFD97706) // Amber-600
    }
    val textColor = if (hasOverdue) {
        Color(0xFF991B1B) // Red-800
    } else {
        Color(0xFF92400E) // Amber-800
    }

    val title = if (hasOverdue) {
        if (locale == "ar") "فواتير متأخرة" else "Overdue Invoices"
    } else {
        if (locale == "ar") "فواتير معلقة" else "Pending Invoices"
    }

    val countText = if (locale == "ar") {
        "${summary.count} فاتورة"
    } else {
        "${summary.count} invoice${if (summary.count > 1) "s" else ""}"
    }

    val amountText = formatCurrency(summary.totalDue, "SAR", locale)

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = backgroundColor)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Filled.Warning,
                contentDescription = null,
                modifier = Modifier.size(24.dp),
                tint = iconColor
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = textColor
                )
                Text(
                    text = "$countText • $amountText",
                    style = MaterialTheme.typography.bodySmall,
                    color = textColor.copy(alpha = 0.8f)
                )
            }

            Icon(
                imageVector = Icons.Filled.ChevronRight,
                contentDescription = null,
                modifier = Modifier.size(24.dp),
                tint = textColor
            )
        }
    }
}

// ============================================
// Section Header
// ============================================

@Composable
private fun SectionHeader(
    title: String,
    actionText: String? = null,
    onActionClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )

        if (actionText != null && onActionClick != null) {
            Text(
                text = actionText,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.clickable { onActionClick() }
            )
        }
    }
}
