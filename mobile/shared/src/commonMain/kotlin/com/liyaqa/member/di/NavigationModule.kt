package com.liyaqa.member.di

import com.liyaqa.member.stores.LocaleStore
import org.koin.dsl.module

/**
 * Koin module for navigation and UI infrastructure dependencies.
 *
 * Provides:
 * - [LocaleStore] for app-wide locale/language management
 *
 * The LocaleStore manages:
 * - Current locale (en/ar)
 * - Locale switching
 * - RTL detection
 */
val navigationModule = module {
    // Locale store - singleton for app-wide locale management
    // Supports English (en) and Arabic (ar) with RTL detection
    single { LocaleStore() }
}
