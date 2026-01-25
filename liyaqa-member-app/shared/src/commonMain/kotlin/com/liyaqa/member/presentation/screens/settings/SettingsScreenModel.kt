package com.liyaqa.member.presentation.screens.settings

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SettingsState(
    val isArabic: Boolean = false,
    val darkModeEnabled: Boolean = false,
    val biometricEnabled: Boolean = false,
    val bookingNotificationsEnabled: Boolean = true,
    val subscriptionNotificationsEnabled: Boolean = true,
    val promotionalNotificationsEnabled: Boolean = false,
    val appVersion: String = "1.0.0"
)

class SettingsScreenModel : ScreenModel {

    private val _state = MutableStateFlow(SettingsState())
    val state: StateFlow<SettingsState> = _state.asStateFlow()

    init {
        loadSettings()
    }

    private fun loadSettings() {
        screenModelScope.launch {
            // TODO: Load settings from local storage
            // For now, use default values
        }
    }

    fun toggleLanguage() {
        _state.update { it.copy(isArabic = !it.isArabic) }
        saveSettings()
    }

    fun toggleDarkMode(enabled: Boolean) {
        _state.update { it.copy(darkModeEnabled = enabled) }
        saveSettings()
    }

    fun toggleBiometric(enabled: Boolean) {
        _state.update { it.copy(biometricEnabled = enabled) }
        saveSettings()
    }

    fun toggleBookingNotifications(enabled: Boolean) {
        _state.update { it.copy(bookingNotificationsEnabled = enabled) }
        saveSettings()
    }

    fun toggleSubscriptionNotifications(enabled: Boolean) {
        _state.update { it.copy(subscriptionNotificationsEnabled = enabled) }
        saveSettings()
    }

    fun togglePromotionalNotifications(enabled: Boolean) {
        _state.update { it.copy(promotionalNotificationsEnabled = enabled) }
        saveSettings()
    }

    private fun saveSettings() {
        screenModelScope.launch {
            // TODO: Save settings to local storage
        }
    }
}
