package com.liyaqa.member.stores

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Store for managing the current locale/language in the app.
 * Supports English (en) and Arabic (ar) locales.
 */
class LocaleStore {
    private val _locale = MutableStateFlow("en")
    val locale: StateFlow<String> = _locale.asStateFlow()

    /**
     * Set the current locale.
     * @param locale The locale code ("en" or "ar")
     */
    fun setLocale(locale: String) {
        _locale.value = locale
    }

    /**
     * Toggle between English and Arabic locales.
     */
    fun toggleLocale() {
        _locale.value = if (_locale.value == "en") "ar" else "en"
    }

    /**
     * Check if the current locale is RTL (Right-to-Left).
     */
    fun isRtl(): Boolean = _locale.value == "ar"
}
