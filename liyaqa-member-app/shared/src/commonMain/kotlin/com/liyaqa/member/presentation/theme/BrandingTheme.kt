package com.liyaqa.member.presentation.theme

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import com.liyaqa.member.domain.model.TenantInfo

/**
 * Dynamic branding theme for white-label apps.
 * Contains custom colors and logo URL from tenant configuration.
 */
@Immutable
data class BrandingTheme(
    val primaryColor: Color,
    val primaryDarkColor: Color,
    val secondaryColor: Color,
    val secondaryDarkColor: Color,
    val accentColor: Color,
    val logoUrl: String?
) {
    companion object {
        /**
         * Default Liyaqa branding.
         */
        val DEFAULT = BrandingTheme(
            primaryColor = LiyaqaPrimary,
            primaryDarkColor = LiyaqaPrimaryDark,
            secondaryColor = LiyaqaSecondary,
            secondaryDarkColor = LiyaqaSecondaryDark,
            accentColor = LiyaqaAccent,
            logoUrl = null
        )

        /**
         * Creates a BrandingTheme from TenantInfo.
         * Falls back to default colors if parsing fails.
         */
        fun fromTenantInfo(info: TenantInfo): BrandingTheme {
            return BrandingTheme(
                primaryColor = info.primaryColor?.parseHexColor() ?: LiyaqaPrimary,
                primaryDarkColor = info.primaryColor?.parseHexColor()?.darken() ?: LiyaqaPrimaryDark,
                secondaryColor = info.secondaryColor?.parseHexColor() ?: LiyaqaSecondary,
                secondaryDarkColor = info.secondaryColor?.parseHexColor()?.darken() ?: LiyaqaSecondaryDark,
                accentColor = info.accentColor?.parseHexColor() ?: LiyaqaAccent,
                logoUrl = info.logoUrl
            )
        }
    }
}

/**
 * Parses a hex color string (e.g., "#1E3A5F") to a Compose Color.
 * Returns null if parsing fails.
 */
private fun String.parseHexColor(): Color? {
    return try {
        val hex = this.removePrefix("#")
        if (hex.length != 6) return null

        val red = hex.substring(0, 2).toInt(16)
        val green = hex.substring(2, 4).toInt(16)
        val blue = hex.substring(4, 6).toInt(16)

        Color(red, green, blue)
    } catch (e: Exception) {
        null
    }
}

/**
 * Creates a slightly lighter/darker version of the color for dark mode.
 */
private fun Color.darken(factor: Float = 0.2f): Color {
    return Color(
        red = (red + (1 - red) * factor).coerceIn(0f, 1f),
        green = (green + (1 - green) * factor).coerceIn(0f, 1f),
        blue = (blue + (1 - blue) * factor).coerceIn(0f, 1f),
        alpha = alpha
    )
}
