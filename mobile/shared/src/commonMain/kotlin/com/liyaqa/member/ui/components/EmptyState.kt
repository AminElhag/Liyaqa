package com.liyaqa.member.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.liyaqa.member.ui.theme.LocalAppLocale

/**
 * Generic empty state component with icon, title, description and optional action.
 */
@Composable
fun EmptyState(
    icon: ImageVector,
    title: String,
    description: String,
    modifier: Modifier = Modifier,
    action: (() -> Unit)? = null,
    actionText: String? = null
) {
    // Subtle breathing animation for icon
    val transition = rememberInfiniteTransition(label = "breathing")
    val alpha by transition.animateFloat(
        initialValue = 0.4f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier
                    .size(80.dp)
                    .alpha(alpha),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            action?.let { onClick ->
                Spacer(modifier = Modifier.height(24.dp))
                Button(onClick = onClick) {
                    Text(text = actionText ?: "")
                }
            }
        }
    }
}

// ============================================
// Pre-built Empty State Variants
// ============================================

/**
 * Empty state for bookings screen.
 */
@Composable
fun EmptyBookings(
    modifier: Modifier = Modifier,
    onBookClass: (() -> Unit)? = null
) {
    val locale = LocalAppLocale.current
    val title = if (locale == "ar") "لا توجد حجوزات" else "No bookings yet"
    val description = if (locale == "ar")
        "احجز حصة لتبدأ رحلتك الرياضية"
    else
        "Book a class to get started with your fitness journey"
    val actionText = if (locale == "ar") "احجز حصة" else "Book a Class"

    EmptyState(
        icon = Icons.Outlined.CalendarMonth,
        title = title,
        description = description,
        action = onBookClass,
        actionText = actionText,
        modifier = modifier
    )
}

/**
 * Empty state for invoices screen.
 */
@Composable
fun EmptyInvoices(
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val title = if (locale == "ar") "لا توجد فواتير" else "No invoices"
    val description = if (locale == "ar")
        "ستظهر فواتيرك هنا"
    else
        "Your invoices will appear here"

    EmptyState(
        icon = Icons.Outlined.Receipt,
        title = title,
        description = description,
        modifier = modifier
    )
}

/**
 * Empty state for notifications screen.
 */
@Composable
fun EmptyNotifications(
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val title = if (locale == "ar") "لا توجد إشعارات" else "No notifications"
    val description = if (locale == "ar")
        "لقد قرأت كل شيء!"
    else
        "You're all caught up!"

    EmptyState(
        icon = Icons.Outlined.Notifications,
        title = title,
        description = description,
        modifier = modifier
    )
}

/**
 * Empty state for attendance screen.
 */
@Composable
fun EmptyAttendance(
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val title = if (locale == "ar") "لا توجد سجلات حضور" else "No attendance records"
    val description = if (locale == "ar")
        "سيظهر سجل تسجيل الدخول هنا"
    else
        "Your check-in history will appear here"

    EmptyState(
        icon = Icons.Outlined.History,
        title = title,
        description = description,
        modifier = modifier
    )
}

/**
 * Empty state for available sessions.
 */
@Composable
fun EmptySessions(
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val title = if (locale == "ar") "لا توجد حصص متاحة" else "No sessions available"
    val description = if (locale == "ar")
        "عد لاحقاً للاطلاع على الحصص المتاحة"
    else
        "Check back later for available classes"

    EmptyState(
        icon = Icons.Outlined.CalendarMonth,
        title = title,
        description = description,
        modifier = modifier
    )
}
