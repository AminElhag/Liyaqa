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
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import com.liyaqa.member.domain.model.Language
import com.liyaqa.member.domain.model.Session
import com.liyaqa.member.presentation.theme.CustomShapes
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.StatusColors
import com.liyaqa.member.presentation.theme.Strings
import com.liyaqa.member.presentation.theme.localized

/**
 * Session card for class schedule
 */
@Composable
fun SessionCard(
    session: Session,
    language: Language,
    modifier: Modifier = Modifier,
    onBookClick: (() -> Unit)? = null
) {
    val isArabic = LocalIsArabic.current

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = CustomShapes.card,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header: Class name and availability
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = session.className.get(language),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f)
                )

                // Availability badge
                val availabilityText = when {
                    session.isFull -> if (isArabic) "ممتلئ" else "Full"
                    else -> "${session.availableSpots} ${Strings.spotsAvailable.localized()}"
                }
                val availabilityColor = when {
                    session.isFull -> StatusColors.expired
                    session.availableSpots <= 3 -> StatusColors.pending
                    else -> StatusColors.active
                }
                StatusChip(text = availabilityText, color = availabilityColor)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Details
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                // Time
                SessionInfoRow(
                    icon = Icons.Default.AccessTime,
                    text = session.timeDisplay
                )

                // Trainer (if available)
                session.trainerName?.get(language)?.let { trainer ->
                    SessionInfoRow(
                        icon = Icons.Default.Person,
                        text = trainer
                    )
                }

                // Location (if available)
                session.locationName?.get(language)?.let { location ->
                    SessionInfoRow(
                        icon = Icons.Default.LocationOn,
                        text = location
                    )
                }

                // Capacity
                SessionInfoRow(
                    icon = Icons.Default.Groups,
                    text = "${session.bookedCount}/${session.capacity}"
                )
            }

            // Book button
            if (session.isBookable && !session.isFull && onBookClick != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onBookClick,
                    modifier = Modifier.fillMaxWidth(),
                    shape = CustomShapes.button,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text(Strings.bookClass.localized())
                }
            } else if (session.isFull && session.hasWaitlist) {
                Spacer(modifier = Modifier.height(16.dp))
                SecondaryButton(
                    text = if (isArabic) "الانضمام لقائمة الانتظار" else "Join Waitlist",
                    onClick = onBookClick ?: {}
                )
            }
        }
    }
}

@Composable
private fun SessionInfoRow(
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
