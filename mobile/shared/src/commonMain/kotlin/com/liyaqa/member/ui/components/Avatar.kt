package com.liyaqa.member.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import kotlin.math.abs

/**
 * Predefined avatar sizes for consistency.
 */
enum class AvatarSize(val size: Dp) {
    SMALL(32.dp),
    MEDIUM(40.dp),
    LARGE(56.dp),
    XLARGE(80.dp)
}

/**
 * Avatar color palette for generating colors based on name.
 */
private val avatarColors = listOf(
    Color(0xFF1E40AF), // Blue
    Color(0xFF059669), // Emerald
    Color(0xFFDC2626), // Red
    Color(0xFFD97706), // Amber
    Color(0xFF7C3AED), // Purple
    Color(0xFF0891B2), // Cyan
    Color(0xFFDB2777), // Pink
    Color(0xFF4F46E5), // Indigo
    Color(0xFF16A34A), // Green
    Color(0xFFEA580C)  // Orange
)

/**
 * Generate a consistent color based on name hash.
 */
private fun getAvatarColor(name: String): Color {
    val hash = abs(name.hashCode())
    return avatarColors[hash % avatarColors.size]
}

/**
 * Member avatar component that displays either an image or initials.
 *
 * @param name The full name of the member (used to generate initials)
 * @param imageUrl Optional URL for the avatar image
 * @param size The size of the avatar (default 40.dp)
 * @param onClick Optional click handler
 */
@Composable
fun MemberAvatar(
    name: String,
    modifier: Modifier = Modifier,
    imageUrl: String? = null,
    size: Dp = 40.dp,
    onClick: (() -> Unit)? = null
) {
    val initials = getInitials(name)
    val backgroundColor = getAvatarColor(name)
    val clickModifier = if (onClick != null) {
        Modifier.clickable { onClick() }
    } else {
        Modifier
    }

    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(backgroundColor)
            .then(clickModifier),
        contentAlignment = Alignment.Center
    ) {
        if (!imageUrl.isNullOrEmpty()) {
            AsyncImage(
                model = imageUrl,
                contentDescription = name,
                modifier = Modifier
                    .size(size)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        } else {
            Text(
                text = initials,
                color = Color.White,
                fontSize = (size.value / 2.5).sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

/**
 * Member avatar with predefined size enum.
 */
@Composable
fun MemberAvatar(
    name: String,
    avatarSize: AvatarSize,
    modifier: Modifier = Modifier,
    imageUrl: String? = null,
    onClick: (() -> Unit)? = null
) {
    MemberAvatar(
        name = name,
        modifier = modifier,
        imageUrl = imageUrl,
        size = avatarSize.size,
        onClick = onClick
    )
}

/**
 * Member avatar with a border, typically used for profile headers.
 */
@Composable
fun MemberAvatarBordered(
    name: String,
    modifier: Modifier = Modifier,
    imageUrl: String? = null,
    size: Dp = 80.dp,
    borderWidth: Dp = 3.dp,
    borderColor: Color = MaterialTheme.colorScheme.surface,
    onClick: (() -> Unit)? = null
) {
    val initials = getInitials(name)
    val backgroundColor = getAvatarColor(name)
    val clickModifier = if (onClick != null) {
        Modifier.clickable { onClick() }
    } else {
        Modifier
    }

    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .border(borderWidth, borderColor, CircleShape)
            .background(backgroundColor)
            .then(clickModifier),
        contentAlignment = Alignment.Center
    ) {
        if (!imageUrl.isNullOrEmpty()) {
            AsyncImage(
                model = imageUrl,
                contentDescription = name,
                modifier = Modifier
                    .size(size - borderWidth * 2)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        } else {
            Text(
                text = initials,
                color = Color.White,
                fontSize = (size.value / 2.5).sp,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

/**
 * A stack of avatars, typically used to show multiple members (e.g., waitlist, attendees).
 *
 * @param names List of member names
 * @param imageUrls List of optional image URLs (matched by index with names)
 * @param maxDisplay Maximum number of avatars to display before showing "+N"
 * @param size Size of each avatar
 * @param overlap How much avatars overlap
 */
@Composable
fun AvatarStack(
    names: List<String>,
    modifier: Modifier = Modifier,
    imageUrls: List<String?> = emptyList(),
    maxDisplay: Int = 3,
    size: Dp = 32.dp,
    overlap: Dp = 10.dp
) {
    val displayCount = minOf(names.size, maxDisplay)
    val remaining = names.size - displayCount

    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.Start,
        verticalAlignment = Alignment.CenterVertically
    ) {
        names.take(displayCount).forEachIndexed { index, name ->
            Box(
                modifier = Modifier.offset(x = -(overlap * index))
            ) {
                MemberAvatar(
                    name = name,
                    imageUrl = imageUrls.getOrNull(index),
                    size = size,
                    modifier = Modifier.border(2.dp, Color.White, CircleShape)
                )
            }
        }

        if (remaining > 0) {
            Box(
                modifier = Modifier
                    .offset(x = -(overlap * displayCount))
                    .size(size)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .border(2.dp, Color.White, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "+$remaining",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

/**
 * Extract initials from a name.
 * Takes the first letter of the first name and first letter of the last name.
 *
 * @param name The full name
 * @return Initials (1-2 characters)
 */
private fun getInitials(name: String): String {
    val parts = name.trim().split(" ").filter { it.isNotEmpty() }
    return when {
        parts.isEmpty() -> "?"
        parts.size == 1 -> parts[0].take(1).uppercase()
        else -> "${parts.first().take(1)}${parts.last().take(1)}".uppercase()
    }
}
