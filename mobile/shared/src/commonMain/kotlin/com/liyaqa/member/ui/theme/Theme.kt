package com.liyaqa.member.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection

// Light Color Scheme
private val LightColorScheme = lightColorScheme(
    // Primary
    primary = Primary40,
    onPrimary = Neutral100,
    primaryContainer = Primary90,
    onPrimaryContainer = Primary10,

    // Secondary
    secondary = Secondary40,
    onSecondary = Neutral100,
    secondaryContainer = Secondary90,
    onSecondaryContainer = Secondary10,

    // Tertiary
    tertiary = Tertiary40,
    onTertiary = Neutral100,
    tertiaryContainer = Tertiary90,
    onTertiaryContainer = Tertiary10,

    // Error
    error = Error40,
    onError = Neutral100,
    errorContainer = Error90,
    onErrorContainer = Error10,

    // Background & Surface
    background = Neutral99,
    onBackground = Neutral10,
    surface = Neutral100,
    onSurface = Neutral10,
    surfaceVariant = NeutralVariant90,
    onSurfaceVariant = NeutralVariant30,

    // Outline
    outline = NeutralVariant50,
    outlineVariant = NeutralVariant80,

    // Inverse
    inverseSurface = Neutral20,
    inverseOnSurface = Neutral95,
    inversePrimary = Primary80,

    // Scrim
    scrim = Neutral0
)

// Dark Color Scheme
private val DarkColorScheme = darkColorScheme(
    // Primary
    primary = Primary80,
    onPrimary = Primary20,
    primaryContainer = Primary30,
    onPrimaryContainer = Primary90,

    // Secondary
    secondary = Secondary80,
    onSecondary = Secondary20,
    secondaryContainer = Secondary30,
    onSecondaryContainer = Secondary90,

    // Tertiary
    tertiary = Tertiary80,
    onTertiary = Tertiary20,
    tertiaryContainer = Tertiary30,
    onTertiaryContainer = Tertiary90,

    // Error
    error = Error80,
    onError = Error20,
    errorContainer = Error30,
    onErrorContainer = Error90,

    // Background & Surface
    background = Neutral10,
    onBackground = Neutral90,
    surface = Neutral10,
    onSurface = Neutral90,
    surfaceVariant = NeutralVariant30,
    onSurfaceVariant = NeutralVariant80,

    // Outline
    outline = NeutralVariant60,
    outlineVariant = NeutralVariant30,

    // Inverse
    inverseSurface = Neutral90,
    inverseOnSurface = Neutral20,
    inversePrimary = Primary40,

    // Scrim
    scrim = Neutral0
)

// Composition Local for current locale
val LocalAppLocale = staticCompositionLocalOf { "en" }

// Composition Local for RTL state
val LocalIsRtl = staticCompositionLocalOf { false }

/**
 * Main theme composable for the Liyaqa Member App.
 *
 * @param darkTheme Whether to use dark theme. Defaults to system setting.
 * @param locale Current locale code ("en" or "ar"). Defaults to "en".
 * @param content The composable content to be themed.
 */
@Composable
fun LiyaqaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    locale: String = "en",
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val isRtl = locale == "ar"
    val layoutDirection = if (isRtl) LayoutDirection.Rtl else LayoutDirection.Ltr

    // Select font family based on locale
    val fontFamily = if (locale == "ar") ArabicFontFamily else DefaultFontFamily
    val typography = LiyaqaTypography(fontFamily)

    CompositionLocalProvider(
        LocalAppLocale provides locale,
        LocalIsRtl provides isRtl,
        LocalLayoutDirection provides layoutDirection
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = typography,
            shapes = LiyaqaShapes,
            content = content
        )
    }
}

/**
 * Extended colors for the Liyaqa theme that aren't part of Material 3.
 */
object LiyaqaColors {
    // Success colors (using secondary/emerald)
    val success: Color
        @Composable
        @ReadOnlyComposable
        get() = Secondary40

    val onSuccess: Color
        @Composable
        @ReadOnlyComposable
        get() = Neutral100

    val successContainer: Color
        @Composable
        @ReadOnlyComposable
        get() = Secondary90

    val onSuccessContainer: Color
        @Composable
        @ReadOnlyComposable
        get() = Secondary10

    // Warning colors (using tertiary/amber)
    val warning: Color
        @Composable
        @ReadOnlyComposable
        get() = Tertiary40

    val onWarning: Color
        @Composable
        @ReadOnlyComposable
        get() = Neutral100

    val warningContainer: Color
        @Composable
        @ReadOnlyComposable
        get() = Tertiary90

    val onWarningContainer: Color
        @Composable
        @ReadOnlyComposable
        get() = Tertiary10

    // Gradient colors for QR screen
    val gradientStart: Color
        @Composable
        @ReadOnlyComposable
        get() = GradientStart

    val gradientEnd: Color
        @Composable
        @ReadOnlyComposable
        get() = GradientEnd
}
