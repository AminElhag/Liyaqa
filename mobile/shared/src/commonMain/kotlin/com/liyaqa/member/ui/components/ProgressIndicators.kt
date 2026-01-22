package com.liyaqa.member.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.liyaqa.member.ui.theme.LocalAppLocale
import kotlinx.coroutines.delay
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant

/**
 * Progress bar for days remaining in subscription.
 */
@Composable
fun DaysRemainingProgress(
    daysRemaining: Int,
    totalDays: Int,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val label = if (locale == "ar") "الأيام المتبقية" else "Days Remaining"

    // Calculate progress (inverted - showing used portion)
    val usedDays = totalDays - daysRemaining
    val progress = if (totalDays > 0) (usedDays.toFloat() / totalDays.toFloat()).coerceIn(0f, 1f) else 0f

    // Determine color based on remaining days
    val progressColor = when {
        daysRemaining <= 7 -> Color(0xFFDC2626) // Red - expiring soon
        daysRemaining <= 14 -> Color(0xFFD97706) // Amber - warning
        else -> Color(0xFF059669) // Green - healthy
    }

    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(durationMillis = 1000),
        label = "daysProgress"
    )

    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = "$daysRemaining",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = progressColor
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Progress bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(1f - animatedProgress) // Remaining portion
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(4.dp))
                    .background(progressColor)
            )
        }
    }
}

/**
 * Progress bar for classes remaining in subscription.
 */
@Composable
fun ClassesRemainingProgress(
    remaining: Int,
    total: Int,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val label = if (locale == "ar") "الحصص المتبقية" else "Classes Remaining"

    // Calculate progress (showing remaining as filled)
    val progress = if (total > 0) (remaining.toFloat() / total.toFloat()).coerceIn(0f, 1f) else 0f

    // Determine color based on remaining classes
    val progressColor = when {
        remaining <= 2 -> Color(0xFFDC2626) // Red - almost out
        remaining <= 5 -> Color(0xFFD97706) // Amber - warning
        else -> Color(0xFF1E40AF) // Blue - primary
    }

    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(durationMillis = 1000),
        label = "classesProgress"
    )

    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = "$remaining / $total",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = progressColor
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Progress bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(animatedProgress)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(4.dp))
                    .background(progressColor)
            )
        }
    }
}

/**
 * Live countdown timer until expiry.
 */
@Composable
fun CountdownTimer(
    expiresAt: Instant,
    modifier: Modifier = Modifier,
    onExpired: (() -> Unit)? = null
) {
    val locale = LocalAppLocale.current
    var remainingSeconds by remember { mutableStateOf(0L) }
    var isExpired by remember { mutableStateOf(false) }

    LaunchedEffect(expiresAt) {
        while (true) {
            val now = Clock.System.now()
            val remaining = (expiresAt - now).inWholeSeconds

            if (remaining <= 0) {
                isExpired = true
                remainingSeconds = 0
                onExpired?.invoke()
                break
            }

            remainingSeconds = remaining
            delay(1000)
        }
    }

    val minutes = (remainingSeconds / 60).toInt()
    val seconds = (remainingSeconds % 60).toInt()

    val timerText = if (isExpired) {
        if (locale == "ar") "منتهي" else "Expired"
    } else {
        "${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}"
    }

    val timerColor = when {
        isExpired -> MaterialTheme.colorScheme.error
        remainingSeconds < 60 -> Color(0xFFDC2626) // Red - less than 1 min
        remainingSeconds < 300 -> Color(0xFFD97706) // Amber - less than 5 min
        else -> MaterialTheme.colorScheme.onSurface
    }

    Text(
        text = timerText,
        style = MaterialTheme.typography.headlineLarge,
        fontWeight = FontWeight.Bold,
        color = timerColor,
        modifier = modifier
    )
}

/**
 * Compact countdown timer with label.
 */
@Composable
fun CompactCountdownTimer(
    expiresAt: Instant,
    modifier: Modifier = Modifier,
    onExpired: (() -> Unit)? = null
) {
    val locale = LocalAppLocale.current
    var remainingSeconds by remember { mutableStateOf(0L) }
    var isExpired by remember { mutableStateOf(false) }

    LaunchedEffect(expiresAt) {
        while (true) {
            val now = Clock.System.now()
            val remaining = (expiresAt - now).inWholeSeconds

            if (remaining <= 0) {
                isExpired = true
                remainingSeconds = 0
                onExpired?.invoke()
                break
            }

            remainingSeconds = remaining
            delay(1000)
        }
    }

    val minutes = (remainingSeconds / 60).toInt()
    val seconds = (remainingSeconds % 60).toInt()

    val label = if (locale == "ar") "صالح حتى" else "Valid for"
    val timerText = if (isExpired) {
        if (locale == "ar") "منتهي" else "Expired"
    } else {
        "${minutes}m ${seconds}s"
    }

    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "$label: ",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = timerText,
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Bold,
            color = if (isExpired || remainingSeconds < 60)
                MaterialTheme.colorScheme.error
            else
                MaterialTheme.colorScheme.primary
        )
    }
}

/**
 * Percentage progress indicator with circular badge.
 */
@Composable
fun PercentageProgress(
    percentage: Float,
    label: String,
    modifier: Modifier = Modifier
) {
    val clampedPercentage = percentage.coerceIn(0f, 100f)
    val progressColor = when {
        clampedPercentage >= 80 -> Color(0xFF059669) // Green
        clampedPercentage >= 50 -> Color(0xFF1E40AF) // Blue
        clampedPercentage >= 25 -> Color(0xFFD97706) // Amber
        else -> Color(0xFFDC2626) // Red
    }

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .height(40.dp)
                .width(60.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(progressColor.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "${clampedPercentage.toInt()}%",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = progressColor
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

/**
 * Horizontal stepper progress indicator.
 */
@Composable
fun StepProgress(
    currentStep: Int,
    totalSteps: Int,
    modifier: Modifier = Modifier,
    activeColor: Color = MaterialTheme.colorScheme.primary,
    inactiveColor: Color = MaterialTheme.colorScheme.surfaceVariant
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(totalSteps) { index ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(if (index < currentStep) activeColor else inactiveColor)
            )
        }
    }
}
