package com.liyaqa.member.presentation.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.model.SubscriptionStatus
import com.liyaqa.member.presentation.theme.CustomShapes
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.StatusColors
import com.liyaqa.member.presentation.theme.Strings
import com.liyaqa.member.presentation.theme.localized
import com.liyaqa.member.util.formatDaysRemaining
import com.liyaqa.member.util.formatDaysRemainingAr

/**
 * Subscription status card for dashboard
 */
@Composable
fun SubscriptionCard(
    subscription: Subscription,
    modifier: Modifier = Modifier,
    onRenewClick: (() -> Unit)? = null
) {
    val isArabic = LocalIsArabic.current
    val statusColor = StatusColors.forSubscriptionStatus(subscription.status.name)

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = CustomShapes.card,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = Strings.subscription.localized(),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = subscription.planName?.get(if (isArabic) com.liyaqa.member.domain.model.Language.ARABIC else com.liyaqa.member.domain.model.Language.ENGLISH)
                            ?: Strings.subscription.localized(),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
                StatusChip(
                    text = getStatusText(subscription.status, isArabic),
                    color = statusColor
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Stats row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                // Days remaining
                StatItem(
                    label = Strings.daysRemaining.localized(),
                    value = if (isArabic) {
                        subscription.daysRemaining.formatDaysRemainingAr()
                    } else {
                        subscription.daysRemaining.formatDaysRemaining()
                    },
                    modifier = Modifier.weight(1f)
                )

                Spacer(modifier = Modifier.width(16.dp))

                // Classes remaining
                StatItem(
                    label = Strings.classesRemaining.localized(),
                    value = subscription.classesRemaining?.toString()
                        ?: Strings.unlimited.localized(),
                    modifier = Modifier.weight(1f)
                )
            }

            // Expiry warning progress
            if (subscription.isActive && subscription.daysRemaining <= 30) {
                Spacer(modifier = Modifier.height(16.dp))
                val progress = subscription.daysRemaining.toFloat() / 30f
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.fillMaxWidth().height(6.dp),
                    color = if (subscription.isExpiringSoon) {
                        StatusColors.pending
                    } else {
                        MaterialTheme.colorScheme.primary
                    },
                    trackColor = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.2f)
                )
            }

            // Renew button for expiring soon
            if (subscription.isExpiringSoon && onRenewClick != null) {
                Spacer(modifier = Modifier.height(16.dp))
                PrimaryButton(
                    text = Strings.renewNow.localized(),
                    onClick = onRenewClick
                )
            }
        }
    }
}

@Composable
private fun StatItem(
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onPrimaryContainer
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
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
