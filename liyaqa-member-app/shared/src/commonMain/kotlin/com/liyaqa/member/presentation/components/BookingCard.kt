package com.liyaqa.member.presentation.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.Language
import com.liyaqa.member.presentation.theme.CustomShapes
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.StatusColors
import com.liyaqa.member.presentation.theme.Strings
import com.liyaqa.member.presentation.theme.localized

/**
 * Booking card for upcoming/past bookings
 */
@Composable
fun BookingCard(
    booking: Booking,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    onCancelClick: (() -> Unit)? = null
) {
    val isArabic = LocalIsArabic.current
    val language = if (isArabic) Language.ARABIC else Language.ENGLISH
    val statusColor = StatusColors.forBookingStatus(booking.status.name)

    Card(
        modifier = modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        shape = CustomShapes.card,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header: Class name and status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = booking.className.get(language),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f)
                )
                StatusChip(
                    text = getBookingStatusText(booking, isArabic),
                    color = statusColor
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Details
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                // Date
                InfoRow(
                    icon = Icons.Default.CalendarToday,
                    text = booking.sessionDate
                )

                // Time
                InfoRow(
                    icon = Icons.Default.AccessTime,
                    text = booking.timeDisplay
                )

                // Trainer (if available)
                booking.trainerName?.get(language)?.let { trainer ->
                    InfoRow(
                        icon = Icons.Default.Person,
                        text = trainer
                    )
                }

                // Location (if available)
                booking.locationName?.get(language)?.let { location ->
                    InfoRow(
                        icon = Icons.Default.LocationOn,
                        text = location
                    )
                }
            }

            // Cancel button (if applicable)
            if (booking.canCancel && onCancelClick != null) {
                Spacer(modifier = Modifier.height(12.dp))
                SecondaryButton(
                    text = Strings.cancelBooking.localized(),
                    onClick = onCancelClick
                )
            }

            // Waitlist position
            if (booking.isWaitlisted && booking.waitlistPosition != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = if (isArabic) {
                        "الموضع في قائمة الانتظار: ${booking.waitlistPosition}"
                    } else {
                        "Waitlist position: ${booking.waitlistPosition}"
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun InfoRow(
    icon: ImageVector,
    text: String
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(18.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

private fun getBookingStatusText(booking: Booking, isArabic: Boolean): String {
    return when {
        booking.isConfirmed -> if (isArabic) "مؤكد" else "Confirmed"
        booking.isWaitlisted -> if (isArabic) "قائمة الانتظار" else "Waitlisted"
        booking.isCheckedIn -> if (isArabic) "تم الحضور" else "Checked In"
        booking.isCancelled -> if (isArabic) "ملغي" else "Cancelled"
        else -> if (isArabic) "غير معروف" else "Unknown"
    }
}
