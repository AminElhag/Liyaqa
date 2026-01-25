package com.liyaqa.member.presentation.screens.subscription

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.domain.model.Language
import com.liyaqa.member.domain.model.SubscriptionStatus
import com.liyaqa.member.presentation.components.ErrorView
import com.liyaqa.member.presentation.components.LoadingView
import com.liyaqa.member.presentation.components.PrimaryButton
import com.liyaqa.member.presentation.components.SecondaryButton
import com.liyaqa.member.presentation.components.StatusChip
import com.liyaqa.member.presentation.theme.CustomShapes
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.StatusColors
import com.liyaqa.member.presentation.theme.Strings
import com.liyaqa.member.presentation.theme.localized
import com.liyaqa.member.util.formatDaysRemaining
import com.liyaqa.member.util.formatDaysRemainingAr

object SubscriptionDetailScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val screenModel = getScreenModel<SubscriptionDetailScreenModel>()
        val state by screenModel.state.collectAsState()
        val isArabic = LocalIsArabic.current
        val language = if (isArabic) Language.ARABIC else Language.ENGLISH

        LaunchedEffect(Unit) {
            screenModel.loadSubscription()
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = Strings.subscription.localized(),
                            fontWeight = FontWeight.Bold
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = if (isArabic) "رجوع" else "Back"
                            )
                        }
                    }
                )
            }
        ) { paddingValues ->
            when {
                state.isLoading && state.subscription == null -> {
                    LoadingView(modifier = Modifier.padding(paddingValues))
                }
                state.error != null && state.subscription == null -> {
                    val errorMessage = if (isArabic) {
                        state.error?.messageAr ?: state.error?.message
                    } else {
                        state.error?.message
                    }
                    ErrorView(
                        message = errorMessage ?: "Error loading subscription",
                        onRetry = screenModel::loadSubscription,
                        modifier = Modifier.padding(paddingValues)
                    )
                }
                state.subscription == null -> {
                    // No active subscription
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .padding(16.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = if (isArabic) "لا يوجد اشتراك نشط" else "No Active Subscription",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = if (isArabic) {
                                "تواصل مع الاستقبال لتفعيل اشتراكك"
                            } else {
                                "Contact reception to activate your subscription"
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                else -> {
                    val subscription = state.subscription!!
                    val statusColor = StatusColors.forSubscriptionStatus(subscription.status.name)

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp)
                    ) {
                        // Status Card
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = CustomShapes.card,
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = subscription.planName?.get(language)
                                                ?: Strings.subscription.localized(),
                                            style = MaterialTheme.typography.headlineSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                    }
                                    StatusChip(
                                        text = getStatusText(subscription.status, isArabic),
                                        color = statusColor
                                    )
                                }

                                if (subscription.isActive) {
                                    Spacer(modifier = Modifier.height(20.dp))

                                    // Days remaining progress
                                    val totalDays = 30 // Approximate month
                                    val progress = (subscription.daysRemaining.toFloat() / totalDays).coerceIn(0f, 1f)

                                    Text(
                                        text = if (isArabic) {
                                            subscription.daysRemaining.formatDaysRemainingAr()
                                        } else {
                                            subscription.daysRemaining.formatDaysRemaining()
                                        },
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )

                                    Spacer(modifier = Modifier.height(8.dp))

                                    LinearProgressIndicator(
                                        progress = { progress },
                                        modifier = Modifier.fillMaxWidth().height(8.dp),
                                        color = if (subscription.isExpiringSoon) {
                                            StatusColors.pending
                                        } else {
                                            MaterialTheme.colorScheme.primary
                                        },
                                        trackColor = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.2f)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Details Card
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = CustomShapes.card
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp)
                            ) {
                                Text(
                                    text = if (isArabic) "تفاصيل الاشتراك" else "Subscription Details",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold
                                )

                                Spacer(modifier = Modifier.height(16.dp))

                                // Start Date
                                DetailRow(
                                    icon = Icons.Default.CalendarToday,
                                    label = if (isArabic) "تاريخ البدء" else "Start Date",
                                    value = subscription.startDate
                                )

                                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                                // End Date
                                DetailRow(
                                    icon = Icons.Default.CalendarToday,
                                    label = if (isArabic) "تاريخ الانتهاء" else "End Date",
                                    value = subscription.endDate
                                )

                                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                                // Classes Remaining
                                DetailRow(
                                    icon = Icons.Default.Timer,
                                    label = Strings.classesRemaining.localized(),
                                    value = subscription.classesRemaining?.toString()
                                        ?: Strings.unlimited.localized()
                                )

                                if (subscription.guestPassesRemaining > 0) {
                                    HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                                    DetailRow(
                                        icon = Icons.Default.CreditCard,
                                        label = if (isArabic) "بطاقات الضيوف" else "Guest Passes",
                                        value = subscription.guestPassesRemaining.toString()
                                    )
                                }

                                if (subscription.canFreeze) {
                                    HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                                    DetailRow(
                                        icon = Icons.Default.Timer,
                                        label = if (isArabic) "أيام التجميد المتبقية" else "Freeze Days Left",
                                        value = subscription.freezeDaysRemaining.toString()
                                    )
                                }

                                // Auto Renew
                                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                                DetailRow(
                                    icon = Icons.Default.Refresh,
                                    label = if (isArabic) "التجديد التلقائي" else "Auto Renew",
                                    value = if (subscription.autoRenew) {
                                        if (isArabic) "مفعل" else "Enabled"
                                    } else {
                                        if (isArabic) "معطل" else "Disabled"
                                    }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Actions
                        if (subscription.isExpiringSoon) {
                            PrimaryButton(
                                text = Strings.renewNow.localized(),
                                onClick = { /* TODO: Navigate to renewal */ }
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                        }

                        if (subscription.canFreeze) {
                            SecondaryButton(
                                text = if (isArabic) "تجميد الاشتراك" else "Freeze Subscription",
                                onClick = { /* TODO: Freeze flow */ }
                            )
                        }

                        Spacer(modifier = Modifier.height(32.dp))
                    }
                }
            }
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
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}

private fun getStatusText(status: SubscriptionStatus, isArabic: Boolean): String {
    return when (status) {
        SubscriptionStatus.ACTIVE -> if (isArabic) "نشط" else "Active"
        SubscriptionStatus.FROZEN -> if (isArabic) "مجمد" else "Frozen"
        SubscriptionStatus.CANCELLED -> if (isArabic) "ملغي" else "Cancelled"
        SubscriptionStatus.EXPIRED -> if (isArabic) "منتهي" else "Expired"
        SubscriptionStatus.PENDING -> if (isArabic) "قيد الانتظار" else "Pending"
        SubscriptionStatus.PENDING_PAYMENT -> if (isArabic) "في انتظار الدفع" else "Pending Payment"
    }
}
