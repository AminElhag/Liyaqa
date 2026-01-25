package com.liyaqa.staff.presentation.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color

// Brand Colors - Liyaqa Green theme for staff
private val LiyaqaGreen = Color(0xFF2E7D32)
private val LiyaqaGreenDark = Color(0xFF1B5E20)
private val LiyaqaGreenLight = Color(0xFF4CAF50)
private val LiyaqaTeal = Color(0xFF00796B)

private val LightColorScheme = lightColorScheme(
    primary = LiyaqaGreen,
    primaryContainer = Color(0xFFB9F6CA),
    onPrimaryContainer = Color(0xFF002107),
    secondary = LiyaqaTeal,
    secondaryContainer = Color(0xFFB2DFDB),
    onSecondaryContainer = Color(0xFF002020),
    tertiary = Color(0xFF1976D2),
    tertiaryContainer = Color(0xFFBBDEFB),
    error = Color(0xFFBA1A1A),
    errorContainer = Color(0xFFFFDAD6),
    background = Color(0xFFFDFDF5),
    surface = Color(0xFFFDFDF5),
    surfaceVariant = Color(0xFFDDE5DB),
    onSurface = Color(0xFF1A1C19),
    onSurfaceVariant = Color(0xFF424940),
    outline = Color(0xFF727970),
    outlineVariant = Color(0xFFC1C9BF)
)

private val DarkColorScheme = darkColorScheme(
    primary = LiyaqaGreenLight,
    primaryContainer = Color(0xFF005313),
    onPrimaryContainer = Color(0xFF8CF996),
    secondary = Color(0xFF4DB6AC),
    secondaryContainer = Color(0xFF00504C),
    onSecondaryContainer = Color(0xFF70F7E9),
    tertiary = Color(0xFF90CAF9),
    tertiaryContainer = Color(0xFF0D47A1),
    error = Color(0xFFFFB4AB),
    errorContainer = Color(0xFF93000A),
    background = Color(0xFF1A1C19),
    surface = Color(0xFF1A1C19),
    surfaceVariant = Color(0xFF424940),
    onSurface = Color(0xFFE2E3DD),
    onSurfaceVariant = Color(0xFFC1C9BF),
    outline = Color(0xFF8B938A),
    outlineVariant = Color(0xFF424940)
)

@Composable
fun LiyaqaStaffTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    isArabic: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    CompositionLocalProvider(LocalIsArabic provides isArabic) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography(),
            content = content
        )
    }
}
