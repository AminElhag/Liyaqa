package com.liyaqa.member.presentation.notifications

import androidx.lifecycle.viewModelScope
import com.liyaqa.member.domain.model.NotificationPreferences
import com.liyaqa.member.domain.repository.NotificationRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel
import kotlinx.coroutines.launch

/**
 * Preference keys for notification settings.
 */
enum class PreferenceKey {
    // Channels
    EMAIL_ENABLED,
    SMS_ENABLED,
    PUSH_ENABLED,
    // Types
    SUBSCRIPTION_REMINDERS,
    INVOICE_ALERTS,
    BOOKING_UPDATES,
    CLASS_REMINDERS,
    MARKETING,
    // Language
    PREFERRED_LANGUAGE
}

/**
 * User intents for the Notification Settings screen.
 */
sealed interface NotificationSettingsIntent {
    /** Load notification preferences. */
    data class LoadPreferences(val memberId: String) : NotificationSettingsIntent

    /** Update a boolean preference. */
    data class UpdateBooleanPreference(val key: PreferenceKey, val value: Boolean) : NotificationSettingsIntent

    /** Update preferred language. */
    data class UpdateLanguage(val language: String) : NotificationSettingsIntent

    /** Navigate back. */
    data object NavigateBack : NotificationSettingsIntent
}

/**
 * UI state for the Notification Settings screen.
 */
data class NotificationSettingsState(
    /** Loading state. */
    val loading: LoadingState = LoadingState.Idle,

    /** Member ID for preferences. */
    val memberId: String = "",

    /** Current preferences. */
    val preferences: NotificationPreferences? = null,

    /** Whether saving is in progress. */
    val saving: Boolean = false,

    /** Key currently being saved. */
    val savingKey: PreferenceKey? = null
) {
    /** Whether preferences are loaded. */
    val hasPreferences: Boolean get() = preferences != null

    // Channel settings
    val emailEnabled: Boolean get() = preferences?.emailEnabled ?: false
    val smsEnabled: Boolean get() = preferences?.smsEnabled ?: false
    val pushEnabled: Boolean get() = preferences?.pushEnabled ?: false

    // Type settings
    val subscriptionReminders: Boolean get() = preferences?.subscriptionReminders ?: true
    val invoiceAlerts: Boolean get() = preferences?.invoiceAlerts ?: true
    val bookingUpdates: Boolean get() = preferences?.bookingUpdates ?: true
    val classReminders: Boolean get() = preferences?.classReminders ?: true
    val marketing: Boolean get() = preferences?.marketing ?: false

    // Language
    val preferredLanguage: String get() = preferences?.preferredLanguage ?: "en"
}

/**
 * One-time effects from the Notification Settings screen.
 */
sealed interface NotificationSettingsEffect {
    /** Preferences saved successfully. */
    data object PreferencesSaved : NotificationSettingsEffect

    /** Show error message. */
    data class ShowError(val message: String) : NotificationSettingsEffect

    /** Navigate back. */
    data object NavigateBack : NotificationSettingsEffect
}

/**
 * ViewModel for the Notification Settings screen.
 *
 * Features:
 * - Load notification preferences
 * - Toggle channel settings (email, SMS, push)
 * - Toggle notification types
 * - Change preferred language
 * - Auto-save on toggle change
 */
class NotificationSettingsViewModel(
    private val notificationRepository: NotificationRepository
) : MviViewModel<NotificationSettingsIntent, NotificationSettingsState, NotificationSettingsEffect>(NotificationSettingsState()) {

    override fun onIntent(intent: NotificationSettingsIntent) {
        when (intent) {
            is NotificationSettingsIntent.LoadPreferences -> loadPreferences(intent.memberId)
            is NotificationSettingsIntent.UpdateBooleanPreference -> updateBooleanPreference(intent.key, intent.value)
            is NotificationSettingsIntent.UpdateLanguage -> updateLanguage(intent.language)
            is NotificationSettingsIntent.NavigateBack -> sendEffect(NotificationSettingsEffect.NavigateBack)
        }
    }

    private fun loadPreferences(memberId: String) {
        updateState { copy(loading = LoadingState.Loading(), memberId = memberId) }

        viewModelScope.launch {
            notificationRepository.getPreferences(memberId)
                .onSuccess { preferences ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            preferences = preferences
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(loading = LoadingState.Error(
                            message = error.message ?: "Failed to load preferences",
                            throwable = error
                        ))
                    }
                }
        }
    }

    private fun updateBooleanPreference(key: PreferenceKey, value: Boolean) {
        val currentPreferences = currentState.preferences ?: return
        val memberId = currentState.memberId

        // Update local state immediately for responsive UI
        val updatedPreferences = when (key) {
            PreferenceKey.EMAIL_ENABLED -> currentPreferences.copy(emailEnabled = value)
            PreferenceKey.SMS_ENABLED -> currentPreferences.copy(smsEnabled = value)
            PreferenceKey.PUSH_ENABLED -> currentPreferences.copy(pushEnabled = value)
            PreferenceKey.SUBSCRIPTION_REMINDERS -> currentPreferences.copy(subscriptionReminders = value)
            PreferenceKey.INVOICE_ALERTS -> currentPreferences.copy(invoiceAlerts = value)
            PreferenceKey.BOOKING_UPDATES -> currentPreferences.copy(bookingUpdates = value)
            PreferenceKey.CLASS_REMINDERS -> currentPreferences.copy(classReminders = value)
            PreferenceKey.MARKETING -> currentPreferences.copy(marketing = value)
            PreferenceKey.PREFERRED_LANGUAGE -> return // Use updateLanguage instead
        }

        updateState {
            copy(
                preferences = updatedPreferences,
                saving = true,
                savingKey = key
            )
        }

        viewModelScope.launch {
            notificationRepository.updatePreferences(memberId, updatedPreferences)
                .onSuccess { savedPreferences ->
                    updateState {
                        copy(
                            preferences = savedPreferences,
                            saving = false,
                            savingKey = null
                        )
                    }
                    sendEffect(NotificationSettingsEffect.PreferencesSaved)
                }
                .onFailure { error ->
                    // Revert to original preferences on failure
                    updateState {
                        copy(
                            preferences = currentPreferences,
                            saving = false,
                            savingKey = null
                        )
                    }
                    sendEffect(NotificationSettingsEffect.ShowError(
                        error.message ?: "Failed to save preference"
                    ))
                }
        }
    }

    private fun updateLanguage(language: String) {
        val currentPreferences = currentState.preferences ?: return
        val memberId = currentState.memberId

        val updatedPreferences = currentPreferences.copy(preferredLanguage = language)

        updateState {
            copy(
                preferences = updatedPreferences,
                saving = true,
                savingKey = PreferenceKey.PREFERRED_LANGUAGE
            )
        }

        viewModelScope.launch {
            notificationRepository.updatePreferences(memberId, updatedPreferences)
                .onSuccess { savedPreferences ->
                    updateState {
                        copy(
                            preferences = savedPreferences,
                            saving = false,
                            savingKey = null
                        )
                    }
                    sendEffect(NotificationSettingsEffect.PreferencesSaved)
                }
                .onFailure { error ->
                    // Revert on failure
                    updateState {
                        copy(
                            preferences = currentPreferences,
                            saving = false,
                            savingKey = null
                        )
                    }
                    sendEffect(NotificationSettingsEffect.ShowError(
                        error.message ?: "Failed to save language preference"
                    ))
                }
        }
    }
}
