package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Represents bilingual text with English and optional Arabic versions.
 * Used throughout the app for internationalization support.
 */
@Serializable
data class LocalizedText(
    val en: String,
    val ar: String? = null
) {
    /**
     * Gets the text for the specified language.
     * Falls back to English if Arabic is not available.
     */
    fun get(language: Language): String = when (language) {
        Language.ENGLISH -> en
        Language.ARABIC -> ar ?: en
    }

    /**
     * Gets the text for the current locale.
     */
    fun localized(isArabic: Boolean = false): String = if (isArabic) ar ?: en else en

    companion object {
        fun of(en: String, ar: String? = null) = LocalizedText(en, ar)

        fun empty() = LocalizedText("", null)
    }
}

enum class Language(val code: String, val displayName: String, val nativeName: String) {
    ENGLISH("en", "English", "English"),
    ARABIC("ar", "Arabic", "العربية");

    val isRtl: Boolean get() = this == ARABIC

    companion object {
        fun fromCode(code: String): Language = entries.find { it.code == code } ?: ENGLISH
    }
}
