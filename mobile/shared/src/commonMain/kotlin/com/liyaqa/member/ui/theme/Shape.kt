package com.liyaqa.member.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

/**
 * Shape definitions for the Liyaqa app.
 * Based on design prototype with 12dp for cards and 8dp for buttons.
 */
val LiyaqaShapes = Shapes(
    // Extra small - for chips, small badges
    extraSmall = RoundedCornerShape(4.dp),

    // Small - for buttons, input fields
    small = RoundedCornerShape(8.dp),

    // Medium - for cards, dialogs
    medium = RoundedCornerShape(12.dp),

    // Large - for bottom sheets, large cards
    large = RoundedCornerShape(16.dp),

    // Extra large - for modal sheets
    extraLarge = RoundedCornerShape(24.dp)
)

// Common shape values for easy access
object LiyaqaCorners {
    val None = RoundedCornerShape(0.dp)
    val ExtraSmall = RoundedCornerShape(4.dp)
    val Small = RoundedCornerShape(8.dp)
    val Medium = RoundedCornerShape(12.dp)
    val Large = RoundedCornerShape(16.dp)
    val ExtraLarge = RoundedCornerShape(24.dp)
    val Full = RoundedCornerShape(9999.dp) // For pills and avatars
}
