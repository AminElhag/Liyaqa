package com.liyaqa.member.presentation.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.LayoutDirection

// Liyaqa Brand Colors
val LiyaqaPrimary = Color(0xFF1E3A5F)      // Deep Blue
val LiyaqaSecondary = Color(0xFF2E7D32)    // Green
val LiyaqaAccent = Color(0xFFFFB300)       // Gold

val LiyaqaPrimaryDark = Color(0xFF3D5A80)
val LiyaqaSecondaryDark = Color(0xFF4CAF50)

// Light Theme Colors
private val LightColorScheme = lightColorScheme(
    primary = LiyaqaPrimary,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD6E3F5),
    onPrimaryContainer = LiyaqaPrimary,

    secondary = LiyaqaSecondary,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFD7EFD9),
    onSecondaryContainer = LiyaqaSecondary,

    tertiary = LiyaqaAccent,
    onTertiary = Color.Black,
    tertiaryContainer = Color(0xFFFFF3CD),
    onTertiaryContainer = Color(0xFF8B6914),

    background = Color(0xFFFAFAFA),
    onBackground = Color(0xFF1C1B1F),

    surface = Color.White,
    onSurface = Color(0xFF1C1B1F),
    surfaceVariant = Color(0xFFF3F3F3),
    onSurfaceVariant = Color(0xFF49454F),

    outline = Color(0xFF79747E),
    outlineVariant = Color(0xFFCAC4D0),

    error = Color(0xFFBA1A1A),
    onError = Color.White,
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002)
)

// Dark Theme Colors
private val DarkColorScheme = darkColorScheme(
    primary = LiyaqaPrimaryDark,
    onPrimary = Color.White,
    primaryContainer = LiyaqaPrimary,
    onPrimaryContainer = Color(0xFFD6E3F5),

    secondary = LiyaqaSecondaryDark,
    onSecondary = Color.White,
    secondaryContainer = LiyaqaSecondary,
    onSecondaryContainer = Color(0xFFD7EFD9),

    tertiary = LiyaqaAccent,
    onTertiary = Color.Black,
    tertiaryContainer = Color(0xFF5C4B00),
    onTertiaryContainer = Color(0xFFFFF3CD),

    background = Color(0xFF1C1B1F),
    onBackground = Color(0xFFE6E1E5),

    surface = Color(0xFF1C1B1F),
    onSurface = Color(0xFFE6E1E5),
    surfaceVariant = Color(0xFF2B2B2B),
    onSurfaceVariant = Color(0xFFCAC4D0),

    outline = Color(0xFF938F99),
    outlineVariant = Color(0xFF49454F),

    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6)
)

// Layout Direction for RTL support
val LocalLayoutDirection = staticCompositionLocalOf { LayoutDirection.Ltr }

// Language state
val LocalIsArabic = staticCompositionLocalOf { false }

// Branding theme for white-label support
val LocalBrandingTheme = staticCompositionLocalOf { BrandingTheme.DEFAULT }

@Composable
fun LiyaqaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    isArabic: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val layoutDirection = if (isArabic) LayoutDirection.Rtl else LayoutDirection.Ltr

    CompositionLocalProvider(
        LocalLayoutDirection provides layoutDirection,
        LocalIsArabic provides isArabic,
        LocalBrandingTheme provides BrandingTheme.DEFAULT
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = LiyaqaTypography,
            shapes = LiyaqaShapes,
            content = content
        )
    }
}

/**
 * Dynamic theme that applies custom branding colors.
 * Use this for white-label apps with custom tenant branding.
 */
@Composable
fun DynamicLiyaqaTheme(
    brandingTheme: BrandingTheme = BrandingTheme.DEFAULT,
    darkTheme: Boolean = isSystemInDarkTheme(),
    isArabic: Boolean = false,
    content: @Composable () -> Unit
) {
    // Create color scheme with branding colors
    val colorScheme = if (darkTheme) {
        darkColorScheme(
            primary = brandingTheme.primaryDarkColor,
            onPrimary = Color.White,
            primaryContainer = brandingTheme.primaryColor,
            onPrimaryContainer = Color(0xFFD6E3F5),

            secondary = brandingTheme.secondaryDarkColor,
            onSecondary = Color.White,
            secondaryContainer = brandingTheme.secondaryColor,
            onSecondaryContainer = Color(0xFFD7EFD9),

            tertiary = brandingTheme.accentColor,
            onTertiary = Color.Black,
            tertiaryContainer = Color(0xFF5C4B00),
            onTertiaryContainer = Color(0xFFFFF3CD),

            background = Color(0xFF1C1B1F),
            onBackground = Color(0xFFE6E1E5),

            surface = Color(0xFF1C1B1F),
            onSurface = Color(0xFFE6E1E5),
            surfaceVariant = Color(0xFF2B2B2B),
            onSurfaceVariant = Color(0xFFCAC4D0),

            outline = Color(0xFF938F99),
            outlineVariant = Color(0xFF49454F),

            error = Color(0xFFFFB4AB),
            onError = Color(0xFF690005),
            errorContainer = Color(0xFF93000A),
            onErrorContainer = Color(0xFFFFDAD6)
        )
    } else {
        lightColorScheme(
            primary = brandingTheme.primaryColor,
            onPrimary = Color.White,
            primaryContainer = brandingTheme.primaryColor.copy(alpha = 0.1f),
            onPrimaryContainer = brandingTheme.primaryColor,

            secondary = brandingTheme.secondaryColor,
            onSecondary = Color.White,
            secondaryContainer = brandingTheme.secondaryColor.copy(alpha = 0.1f),
            onSecondaryContainer = brandingTheme.secondaryColor,

            tertiary = brandingTheme.accentColor,
            onTertiary = Color.Black,
            tertiaryContainer = Color(0xFFFFF3CD),
            onTertiaryContainer = Color(0xFF8B6914),

            background = Color(0xFFFAFAFA),
            onBackground = Color(0xFF1C1B1F),

            surface = Color.White,
            onSurface = Color(0xFF1C1B1F),
            surfaceVariant = Color(0xFFF3F3F3),
            onSurfaceVariant = Color(0xFF49454F),

            outline = Color(0xFF79747E),
            outlineVariant = Color(0xFFCAC4D0),

            error = Color(0xFFBA1A1A),
            onError = Color.White,
            errorContainer = Color(0xFFFFDAD6),
            onErrorContainer = Color(0xFF410002)
        )
    }

    val layoutDirection = if (isArabic) LayoutDirection.Rtl else LayoutDirection.Ltr

    CompositionLocalProvider(
        LocalLayoutDirection provides layoutDirection,
        LocalIsArabic provides isArabic,
        LocalBrandingTheme provides brandingTheme
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = LiyaqaTypography,
            shapes = LiyaqaShapes,
            content = content
        )
    }
}

// Status colors
object StatusColors {
    val active = Color(0xFF4CAF50)
    val pending = Color(0xFFFFB300)
    val expired = Color(0xFFE53935)
    val overdue = expired  // Alias for expired
    val frozen = Color(0xFF2196F3)
    val cancelled = Color(0xFF9E9E9E)

    @Composable
    fun forSubscriptionStatus(status: String): Color = when (status) {
        "ACTIVE" -> active
        "PENDING", "PENDING_PAYMENT" -> pending
        "EXPIRED" -> expired
        "FROZEN" -> frozen
        "CANCELLED" -> cancelled
        else -> Color.Gray
    }

    @Composable
    fun forBookingStatus(status: String): Color = when (status) {
        "CONFIRMED" -> active
        "WAITLISTED" -> pending
        "CHECKED_IN" -> Color(0xFF1E88E5)
        "CANCELLED" -> cancelled
        "NO_SHOW" -> expired
        else -> Color.Gray
    }

    @Composable
    fun forInvoiceStatus(status: String): Color = when (status) {
        "PAID" -> active
        "ISSUED", "PARTIALLY_PAID" -> pending
        "OVERDUE" -> expired
        "CANCELLED", "REFUNDED" -> cancelled
        else -> Color.Gray
    }
}
