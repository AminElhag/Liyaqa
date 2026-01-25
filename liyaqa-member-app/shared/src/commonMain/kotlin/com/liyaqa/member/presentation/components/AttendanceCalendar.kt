package com.liyaqa.member.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.liyaqa.member.presentation.theme.CustomShapes
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.StatusColors

/**
 * Calendar component showing attendance days
 */
@Composable
fun AttendanceCalendar(
    month: String, // Format: "January 2026"
    attendedDays: Set<Int>, // Days of the month with attendance
    totalDays: Int = 31,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isArabic = LocalIsArabic.current

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = CustomShapes.card,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Month navigation
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onPreviousMonth) {
                    Icon(
                        imageVector = if (isArabic) {
                            Icons.AutoMirrored.Filled.KeyboardArrowRight
                        } else {
                            Icons.AutoMirrored.Filled.KeyboardArrowLeft
                        },
                        contentDescription = if (isArabic) "الشهر السابق" else "Previous Month"
                    )
                }

                Text(
                    text = month,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                IconButton(onClick = onNextMonth) {
                    Icon(
                        imageVector = if (isArabic) {
                            Icons.AutoMirrored.Filled.KeyboardArrowLeft
                        } else {
                            Icons.AutoMirrored.Filled.KeyboardArrowRight
                        },
                        contentDescription = if (isArabic) "الشهر التالي" else "Next Month"
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Day headers
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                val dayHeaders = if (isArabic) {
                    listOf("أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت")
                } else {
                    listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
                }

                dayHeaders.forEach { day ->
                    Text(
                        text = day,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.weight(1f),
                        textAlign = TextAlign.Center
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Calendar grid
            // Simple grid for demonstration - in production use proper calendar library
            val rows = (totalDays + 6) / 7
            Column(
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                for (row in 0 until rows) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        for (col in 0..6) {
                            val day = row * 7 + col + 1
                            if (day <= totalDays) {
                                CalendarDay(
                                    day = day,
                                    hasAttendance = day in attendedDays,
                                    modifier = Modifier.weight(1f)
                                )
                            } else {
                                Box(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Legend
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .clip(CircleShape)
                        .background(StatusColors.active)
                )
                Spacer(modifier = Modifier.padding(horizontal = 4.dp))
                Text(
                    text = if (isArabic) "أيام الحضور" else "Attendance Days",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun CalendarDay(
    day: Int,
    hasAttendance: Boolean,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .aspectRatio(1f)
            .padding(2.dp)
            .clip(CircleShape)
            .background(
                if (hasAttendance) {
                    StatusColors.active.copy(alpha = 0.2f)
                } else {
                    MaterialTheme.colorScheme.surface
                }
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = day.toString(),
                style = MaterialTheme.typography.bodySmall,
                fontWeight = if (hasAttendance) FontWeight.Bold else FontWeight.Normal,
                color = if (hasAttendance) {
                    StatusColors.active
                } else {
                    MaterialTheme.colorScheme.onSurface
                }
            )
            if (hasAttendance) {
                Box(
                    modifier = Modifier
                        .size(4.dp)
                        .clip(CircleShape)
                        .background(StatusColors.active)
                )
            }
        }
    }
}
