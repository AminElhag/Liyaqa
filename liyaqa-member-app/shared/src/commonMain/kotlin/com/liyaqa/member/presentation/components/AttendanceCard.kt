package com.liyaqa.member.presentation.components

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
import androidx.compose.material.icons.filled.Login
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Timer
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
import com.liyaqa.member.domain.model.Attendance
import com.liyaqa.member.domain.model.Language
import com.liyaqa.member.presentation.theme.CustomShapes
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.StatusColors

/**
 * Attendance record card
 */
@Composable
fun AttendanceCard(
    attendance: Attendance,
    modifier: Modifier = Modifier
) {
    val isArabic = LocalIsArabic.current
    val language = if (isArabic) Language.ARABIC else Language.ENGLISH

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = CustomShapes.card,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Date and location header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = formatDate(attendance.checkInTime),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                attendance.locationName?.let { location ->
                    Text(
                        text = location.get(language),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Check-in and check-out times
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Check-in
                TimeItem(
                    icon = Icons.Default.Login,
                    label = if (isArabic) "الدخول" else "In",
                    time = formatTime(attendance.checkInTime),
                    color = StatusColors.active
                )

                // Check-out (if available)
                if (attendance.isCheckedOut) {
                    TimeItem(
                        icon = Icons.Default.Logout,
                        label = if (isArabic) "الخروج" else "Out",
                        time = formatTime(attendance.checkOutTime!!),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    TimeItem(
                        icon = Icons.Default.Logout,
                        label = if (isArabic) "الخروج" else "Out",
                        time = if (isArabic) "لم يتم" else "Active",
                        color = StatusColors.pending
                    )
                }

                // Duration
                TimeItem(
                    icon = Icons.Default.Timer,
                    label = if (isArabic) "المدة" else "Duration",
                    time = attendance.durationDisplay ?: (if (isArabic) "-" else "-"),
                    color = MaterialTheme.colorScheme.primary
                )
            }

            // Check-in method badge
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = getCheckInMethodText(attendance.method.name, isArabic),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun TimeItem(
    icon: ImageVector,
    label: String,
    time: String,
    color: androidx.compose.ui.graphics.Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(20.dp),
            tint = color
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = time,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            color = color
        )
    }
}

private fun formatDate(dateTime: String): String {
    // Extract date from datetime string (e.g., "2026-01-25T10:30:00" -> "Jan 25, 2026")
    // Simplified - in production use kotlinx-datetime
    return dateTime.take(10)
}

private fun formatTime(dateTime: String): String {
    // Extract time from datetime string (e.g., "2026-01-25T10:30:00" -> "10:30")
    // Simplified - in production use kotlinx-datetime
    return if (dateTime.contains("T")) {
        dateTime.substringAfter("T").take(5)
    } else {
        dateTime
    }
}

private fun getCheckInMethodText(method: String, isArabic: Boolean): String {
    return when (method) {
        "MANUAL" -> if (isArabic) "تسجيل يدوي" else "Manual"
        "QR_CODE" -> if (isArabic) "رمز QR" else "QR Code"
        "CARD" -> if (isArabic) "بطاقة" else "Card"
        "BIOMETRIC" -> if (isArabic) "بصمة" else "Biometric"
        "MOBILE_APP" -> if (isArabic) "تطبيق الجوال" else "Mobile App"
        else -> method
    }
}
