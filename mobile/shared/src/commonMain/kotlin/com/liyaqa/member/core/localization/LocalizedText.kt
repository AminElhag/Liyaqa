package com.liyaqa.member.core.localization

import kotlinx.serialization.Serializable

/**
 * Data class for bilingual text matching backend LocalizedTextResponse.
 * Used for dynamic content from API responses.
 */
@Serializable
data class LocalizedText(
    val en: String,
    val ar: String? = null
) {
    /**
     * Returns the localized string based on the given locale.
     * Falls back to English if Arabic is not available.
     */
    fun localized(locale: String): String {
        return when (locale) {
            "ar" -> ar ?: en
            else -> en
        }
    }

    companion object {
        /**
         * Creates a LocalizedText with the same value for both languages.
         */
        fun of(text: String): LocalizedText = LocalizedText(en = text, ar = text)

        /**
         * Creates a LocalizedText with English only.
         */
        fun english(text: String): LocalizedText = LocalizedText(en = text)
    }
}

/**
 * Extension function to get localized value from nullable LocalizedText.
 */
fun LocalizedText?.localized(locale: String, default: String = ""): String {
    return this?.localized(locale) ?: default
}
