package com.liyaqa.member.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.liyaqa.member.data.auth.model.User
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.greeting_hello
import org.jetbrains.compose.resources.stringResource

/**
 * Top app bar for the main screens.
 * Displays greeting with user name, language toggle, and notification bell.
 *
 * @param user The current logged-in user (null during loading)
 * @param locale Current locale code ("en" or "ar")
 * @param unreadNotifications Count of unread notifications
 * @param onLanguageToggle Callback when language toggle is clicked
 * @param onNotificationsClick Callback when notification bell is clicked
 * @param onAvatarClick Callback when avatar is clicked
 */
@Composable
fun LiyaqaTopBar(
    user: User?,
    locale: String,
    unreadNotifications: Int,
    onLanguageToggle: () -> Unit,
    onNotificationsClick: () -> Unit,
    onAvatarClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Left: Avatar + Greeting
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                MemberAvatar(
                    name = user?.getLocalizedName(locale) ?: "",
                    size = 40.dp,
                    onClick = onAvatarClick
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = stringResource(Res.string.greeting_hello),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = user?.getLocalizedName(locale) ?: "",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            // Right: Language toggle + Notification bell
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Language Toggle
                LanguageToggle(
                    currentLocale = locale,
                    onToggle = onLanguageToggle
                )

                Spacer(modifier = Modifier.width(8.dp))

                // Notification Bell with Badge
                Box {
                    IconButton(onClick = onNotificationsClick) {
                        Icon(
                            imageVector = Icons.Outlined.Notifications,
                            contentDescription = "Notifications",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    if (unreadNotifications > 0) {
                        NotificationBadge(
                            count = unreadNotifications,
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(top = 6.dp, end = 6.dp)
                        )
                    }
                }
            }
        }
    }
}

/**
 * Language toggle button with EN/ع options.
 *
 * @param currentLocale The currently active locale
 * @param onToggle Callback when toggle is clicked
 */
@Composable
fun LanguageToggle(
    currentLocale: String,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .clickable { onToggle() }
            .padding(2.dp),
        horizontalArrangement = Arrangement.Center
    ) {
        // English option
        LanguageOption(
            text = "EN",
            isSelected = currentLocale == "en"
        )
        // Arabic option
        LanguageOption(
            text = "ع",
            isSelected = currentLocale == "ar"
        )
    }
}

@Composable
private fun LanguageOption(
    text: String,
    isSelected: Boolean,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .size(32.dp)
            .clip(RoundedCornerShape(6.dp))
            .background(
                if (isSelected) MaterialTheme.colorScheme.primary
                else MaterialTheme.colorScheme.surfaceVariant
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
            color = if (isSelected) MaterialTheme.colorScheme.onPrimary
                    else MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
