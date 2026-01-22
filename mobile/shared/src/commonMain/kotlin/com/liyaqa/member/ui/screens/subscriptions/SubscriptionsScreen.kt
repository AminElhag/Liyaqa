package com.liyaqa.member.ui.screens.subscriptions

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.outlined.AcUnit
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.model.SubscriptionStatus
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.subscriptions.SubscriptionsEffect
import com.liyaqa.member.presentation.subscriptions.SubscriptionsIntent
import com.liyaqa.member.presentation.subscriptions.SubscriptionsState
import com.liyaqa.member.presentation.subscriptions.SubscriptionsViewModel
import com.liyaqa.member.ui.components.ClassesRemainingProgress
import com.liyaqa.member.ui.components.DaysRemainingProgress
import com.liyaqa.member.ui.components.FullScreenLoading
import com.liyaqa.member.ui.components.SkeletonCard
import com.liyaqa.member.ui.components.SubscriptionStatusBadge
import com.liyaqa.member.ui.theme.LocalAppLocale
import kotlinx.datetime.LocalDate
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.subscriptions_title
import org.jetbrains.compose.resources.stringResource
import org.koin.compose.viewmodel.koinViewModel

/**
 * Subscriptions Screen - Shows active subscription and history.
 *
 * Features:
 * - Active subscription card (prominent):
 *   - Plan name
 *   - Status badge
 *   - Progress bars (days, classes)
 *   - Start/end dates
 *   - Auto-renew indicator
 *   - Frozen until (if applicable)
 * - Subscription history list
 * - Empty state if no history
 */
class SubscriptionsScreen : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel: SubscriptionsViewModel = koinViewModel()
        val state by viewModel.state.collectAsState()

        // Handle effects
        LaunchedEffect(Unit) {
            viewModel.effect.collect { effect ->
                when (effect) {
                    is SubscriptionsEffect.ShowError -> {
                        // TODO: Show snackbar with error.message
                    }
                    is SubscriptionsEffect.NavigateToDetail -> {
                        // Navigate to subscription detail (not implemented)
                    }
                }
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(stringResource(Res.string.subscriptions_title)) },
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
            SubscriptionsContent(
                state = state,
                onIntent = viewModel::onIntent,
                modifier = Modifier.padding(paddingValues)
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SubscriptionsContent(
    state: SubscriptionsState,
    onIntent: (SubscriptionsIntent) -> Unit,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current

    PullToRefreshBox(
        isRefreshing = state.isRefreshing,
        onRefresh = { onIntent(SubscriptionsIntent.Refresh) },
        modifier = modifier.fillMaxSize()
    ) {
        when {
            state.loading is LoadingState.Loading && state.activeSubscription == null -> {
                FullScreenLoading()
            }
            else -> {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Active Subscription Section
                    item {
                        SectionHeader(
                            title = if (locale == "ar") "الاشتراك الحالي" else "Active Subscription",
                            icon = Icons.Outlined.CreditCard
                        )
                    }

                    item {
                        if (state.loading is LoadingState.Loading) {
                            SkeletonCard()
                        } else if (state.activeSubscription != null) {
                            ActiveSubscriptionCard(
                                subscription = state.activeSubscription,
                                locale = locale
                            )
                        } else {
                            NoActiveSubscriptionCard(locale = locale)
                        }
                    }

                    // History Section
                    item {
                        Spacer(modifier = Modifier.height(8.dp))
                        SectionHeader(
                            title = if (locale == "ar") "سجل الاشتراكات" else "Subscription History",
                            icon = Icons.Outlined.History
                        )
                    }

                    when {
                        state.historyLoading is LoadingState.Loading -> {
                            items(3) {
                                SkeletonCard()
                            }
                        }
                        state.history.isEmpty() -> {
                            item {
                                EmptyHistoryCard(locale = locale)
                            }
                        }
                        else -> {
                            items(
                                items = state.history,
                                key = { it.id }
                            ) { subscription ->
                                HistorySubscriptionCard(
                                    subscription = subscription,
                                    locale = locale
                                )
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
    }
}

@Composable
private fun SectionHeader(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(vertical = 8.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(20.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
private fun ActiveSubscriptionCard(
    subscription: Subscription,
    locale: String
) {
    val totalDays = (subscription.endDate.toEpochDays() - subscription.startDate.toEpochDays()).toInt()

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            // Header: Plan name + Status badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = subscription.planName.localized(locale),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                SubscriptionStatusBadge(status = subscription.status)
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Progress bars
            DaysRemainingProgress(
                daysRemaining = subscription.daysRemaining,
                totalDays = totalDays
            )

            if (subscription.hasClassLimit) {
                Spacer(modifier = Modifier.height(16.dp))
                ClassesRemainingProgress(
                    remaining = subscription.classesRemaining ?: 0,
                    total = subscription.totalClasses ?: 0
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            Spacer(modifier = Modifier.height(16.dp))

            // Dates
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                DateColumn(
                    label = if (locale == "ar") "تاريخ البدء" else "Start Date",
                    date = subscription.startDate,
                    locale = locale
                )
                DateColumn(
                    label = if (locale == "ar") "تاريخ الانتهاء" else "End Date",
                    date = subscription.endDate,
                    locale = locale,
                    alignment = Alignment.End
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Auto-renew + Frozen status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Auto-renew indicator
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = if (subscription.autoRenew)
                            Color(0xFF059669)
                        else
                            MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (locale == "ar") "التجديد التلقائي" else "Auto-Renew",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = if (subscription.autoRenew)
                            Icons.Default.Check
                        else
                            Icons.Default.Close,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = if (subscription.autoRenew)
                            Color(0xFF059669)
                        else
                            MaterialTheme.colorScheme.error
                    )
                }
            }

            // Frozen until (if applicable)
            subscription.frozenUntil?.let { frozenDate ->
                Spacer(modifier = Modifier.height(12.dp))
                FrozenUntilBanner(
                    frozenUntil = frozenDate,
                    locale = locale
                )
            }

            // Expiring soon warning
            if (subscription.isExpiringSoon && subscription.status == SubscriptionStatus.ACTIVE) {
                Spacer(modifier = Modifier.height(12.dp))
                ExpiringSoonBanner(locale = locale)
            }
        }
    }
}

@Composable
private fun DateColumn(
    label: String,
    date: LocalDate,
    locale: String,
    alignment: Alignment.Horizontal = Alignment.Start
) {
    Column(
        horizontalAlignment = alignment
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(4.dp))
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Outlined.CalendarMonth,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = formatDate(date, locale),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
private fun FrozenUntilBanner(
    frozenUntil: LocalDate,
    locale: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFFDBEAFE) // Light blue
        ),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Outlined.AcUnit,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = Color(0xFF1E40AF)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(
                    text = if (locale == "ar") "مجمد حتى" else "Frozen Until",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF1E40AF)
                )
                Text(
                    text = formatDate(frozenUntil, locale),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF1E40AF)
                )
            }
        }
    }
}

@Composable
private fun ExpiringSoonBanner(locale: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFFFEF3C7) // Light amber
        ),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "⚠️",
                style = MaterialTheme.typography.bodyLarge
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (locale == "ar")
                    "اشتراكك على وشك الانتهاء"
                else
                    "Your subscription is expiring soon",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = Color(0xFFD97706)
            )
        }
    }
}

@Composable
private fun NoActiveSubscriptionCard(locale: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Outlined.CreditCard,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = if (locale == "ar") "لا يوجد اشتراك نشط" else "No active subscription",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = if (locale == "ar")
                    "تواصل مع الإدارة للاشتراك"
                else
                    "Contact the club to subscribe",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun HistorySubscriptionCard(
    subscription: Subscription,
    locale: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = subscription.planName.localized(locale),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f)
                )
                SubscriptionStatusBadge(status = subscription.status)
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = if (locale == "ar") "من" else "From",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatDate(subscription.startDate, locale),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = if (locale == "ar") "إلى" else "To",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatDate(subscription.endDate, locale),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            // Show class usage if applicable
            if (subscription.hasClassLimit) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (locale == "ar") "الحصص المستخدمة:" else "Classes used:",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    val used = (subscription.totalClasses ?: 0) - (subscription.classesRemaining ?: 0)
                    Text(
                        text = "$used / ${subscription.totalClasses}",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

@Composable
private fun EmptyHistoryCard(locale: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Outlined.History,
                contentDescription = null,
                modifier = Modifier.size(40.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = if (locale == "ar") "لا يوجد سجل اشتراكات" else "No subscription history",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

// Format date as DD/MM/YYYY
private fun formatDate(date: LocalDate, locale: String): String {
    val day = date.dayOfMonth.toString().padStart(2, '0')
    val month = date.monthNumber.toString().padStart(2, '0')
    val year = date.year
    return "$day/$month/$year"
}
