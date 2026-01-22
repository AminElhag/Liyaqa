package com.liyaqa.member.presentation.profile

import androidx.lifecycle.viewModelScope
import com.liyaqa.member.data.auth.repository.AuthRepository
import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.repository.ProfileRepository
import com.liyaqa.member.domain.repository.SubscriptionRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel
import kotlinx.coroutines.launch

/**
 * User intents for the Profile screen.
 */
sealed interface ProfileIntent {
    /** Load profile data. */
    data object LoadProfile : ProfileIntent

    /** Logout the user. */
    data object Logout : ProfileIntent

    /** Navigate to edit profile. */
    data object NavigateToEditProfile : ProfileIntent

    /** Navigate to change password. */
    data object NavigateToChangePassword : ProfileIntent

    /** Navigate to notification settings. */
    data object NavigateToNotificationSettings : ProfileIntent

    /** Navigate to subscriptions screen. */
    data object NavigateToSubscriptions : ProfileIntent

    /** Navigate to attendance history. */
    data object NavigateToAttendance : ProfileIntent

    /** Refresh profile data. */
    data object Refresh : ProfileIntent
}

/**
 * UI state for the Profile screen.
 */
data class ProfileState(
    /** Loading state. */
    val loading: LoadingState = LoadingState.Idle,

    /** Member profile. */
    val profile: Member? = null,

    /** Active subscription. */
    val subscription: Subscription? = null,

    /** Whether logout is in progress. */
    val isLoggingOut: Boolean = false,

    /** Whether currently refreshing. */
    val isRefreshing: Boolean = false
) {
    /** Whether profile is loaded. */
    val hasProfile: Boolean get() = profile != null

    /** Full name of the member. */
    val fullName: String get() = profile?.fullName ?: ""

    /** Email of the member. */
    val email: String get() = profile?.email ?: ""

    /** Whether member has active subscription. */
    val hasSubscription: Boolean get() = subscription != null

    /** Member initials for avatar. */
    val initials: String
        get() {
            val first = profile?.firstName?.firstOrNull()?.uppercaseChar() ?: ' '
            val last = profile?.lastName?.firstOrNull()?.uppercaseChar() ?: ' '
            return "$first$last".trim()
        }
}

/**
 * One-time effects from the Profile screen.
 */
sealed interface ProfileEffect {
    /** Navigate to edit profile. */
    data object NavigateToEdit : ProfileEffect

    /** Navigate to change password. */
    data object NavigateToPassword : ProfileEffect

    /** Navigate to notification settings. */
    data object NavigateToSettings : ProfileEffect

    /** Navigate to subscriptions. */
    data object NavigateToSubscriptions : ProfileEffect

    /** Navigate to attendance history. */
    data object NavigateToAttendance : ProfileEffect

    /** User logged out. */
    data object LoggedOut : ProfileEffect

    /** Show error message. */
    data class ShowError(val message: String) : ProfileEffect
}

/**
 * ViewModel for the Profile screen.
 *
 * Features:
 * - Display member profile information
 * - Show active subscription
 * - Navigate to profile editing
 * - Logout functionality
 */
class ProfileViewModel(
    private val profileRepository: ProfileRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val authRepository: AuthRepository
) : MviViewModel<ProfileIntent, ProfileState, ProfileEffect>(ProfileState()) {

    init {
        onIntent(ProfileIntent.LoadProfile)
    }

    override fun onIntent(intent: ProfileIntent) {
        when (intent) {
            is ProfileIntent.LoadProfile -> loadProfile()
            is ProfileIntent.Logout -> logout()
            is ProfileIntent.NavigateToEditProfile -> sendEffect(ProfileEffect.NavigateToEdit)
            is ProfileIntent.NavigateToChangePassword -> sendEffect(ProfileEffect.NavigateToPassword)
            is ProfileIntent.NavigateToNotificationSettings -> sendEffect(ProfileEffect.NavigateToSettings)
            is ProfileIntent.NavigateToSubscriptions -> sendEffect(ProfileEffect.NavigateToSubscriptions)
            is ProfileIntent.NavigateToAttendance -> sendEffect(ProfileEffect.NavigateToAttendance)
            is ProfileIntent.Refresh -> refresh()
        }
    }

    private fun loadProfile() {
        updateState { copy(loading = LoadingState.Loading()) }

        viewModelScope.launch {
            // Load profile
            profileRepository.getProfile()
                .onSuccess { profile ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            profile = profile
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(loading = LoadingState.Error(
                            message = error.message ?: "Failed to load profile",
                            throwable = error
                        ))
                    }
                }

            // Load subscription
            subscriptionRepository.getSubscription()
                .onSuccess { subscription ->
                    updateState { copy(subscription = subscription) }
                }
        }
    }

    private fun logout() {
        updateState { copy(isLoggingOut = true) }

        viewModelScope.launch {
            authRepository.logout()
            updateState { copy(isLoggingOut = false) }
            sendEffect(ProfileEffect.LoggedOut)
        }
    }

    private fun refresh() {
        updateState { copy(isRefreshing = true) }

        viewModelScope.launch {
            profileRepository.clearCache()
            subscriptionRepository.clearCache()

            profileRepository.getProfile()
                .onSuccess { profile ->
                    updateState {
                        copy(
                            profile = profile,
                            isRefreshing = false
                        )
                    }
                }
                .onFailure {
                    updateState { copy(isRefreshing = false) }
                }

            subscriptionRepository.getSubscription()
                .onSuccess { subscription ->
                    updateState { copy(subscription = subscription) }
                }
        }
    }
}
