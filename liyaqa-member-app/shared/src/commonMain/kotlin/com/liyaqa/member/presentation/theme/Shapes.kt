package com.liyaqa.member.presentation.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val LiyaqaShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(24.dp)
)

// Additional custom shapes
object CustomShapes {
    val card = RoundedCornerShape(16.dp)
    val button = RoundedCornerShape(12.dp)
    val bottomSheet = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
    val chip = RoundedCornerShape(20.dp)
    val qrCode = RoundedCornerShape(24.dp)
    val avatar = RoundedCornerShape(50)
}
