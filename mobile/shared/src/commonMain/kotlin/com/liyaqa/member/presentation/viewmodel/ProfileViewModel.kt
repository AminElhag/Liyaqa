package com.liyaqa.member.presentation.viewmodel

import com.liyaqa.member.data.auth.repository.AuthRepository
import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.repository.ProfileRepository
import com.liyaqa.member.domain.repository.SubscriptionRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel

/**
 * User intents for the Profile screen.
 */
sealed interface ProfileIntent {
    /** Load profile and subscription data */
    data object LoadProfile : ProfileIntent

    /** Refresh profile data */
    data object Refresh : ProfileIntent

    /** Navigate to edit profile screen */
    data object NavigateToEditProfile : ProfileIntent

    /** Navigate to notification settings */
    data object NavigateToNotificationSettings : ProfileIntent

    /** Navigate to change password screen */
    data object NavigateToChangePassword : ProfileIntent

    /** Navigate to subscription history */
    data object NavigateToSubscriptionHistory : ProfileIntent

    /** Navigate to attendance history */
    data object NavigateToAttendanceHistory : ProfileIntent

    /** Logout user */
    data object Logout : ProfileIntent
}

/**
 * UI state for the Profile screen.
 */
data class ProfileState(
    val loading: LoadingState = LoadingState.Idle,
    val member: Member? = null,
    val subscription: Subscription? = null,
    val isRefreshing: Boolean = false
) {
    /**
     * Member's full name.
     */
    val fullName: String
        get() = member?.fullName ?: ""

    /**
     * Member's email.
     */
    val email: String
        get() = member?.email ?: ""

    /**
     * Member's initials for avatar.
     */
    val initials: String
        get() {
            val first = member?.firstName?.firstOrNull()?.uppercase() ?: ""
            val last = member?.lastName?.firstOrNull()?.uppercase() ?: ""
            return "$first$last"
        }
}

/**
 * One-time effects for the Profile screen.
 */
sealed interface ProfileEffect {
    /** Show error message */
    data class ShowError(val message: String) : ProfileEffect

    /** Navigate to edit profile */
    data object NavigateToEditProfile : ProfileEffect

    /** Navigate to notification settings */
    data object NavigateToNotificationSettings : ProfileEffect

    /** Navigate to change password */
    data object NavigateToChangePassword : ProfileEffect

    /** Navigate to subscription history */
    data object NavigateToSubscriptionHistory : ProfileEffect

    /** Navigate to attendance history */
    data object NavigateToAttendanceHistory : ProfileEffect

    /** User logged out */
    data object LoggedOut : ProfileEffect
}

/**
 * ViewModel for the Profile screen.
 *
 * Manages:
 * - Loading member profile
 * - Loading active subscription
 * - Navigation to sub-screens
 * - Logout
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
            is ProfileIntent.Refresh -> refresh()
            is ProfileIntent.NavigateToEditProfile -> sendEffect(ProfileEffect.NavigateToEditProfile)
            is ProfileIntent.NavigateToNotificationSettings -> sendEffect(ProfileEffect.NavigateToNotificationSettings)
            is ProfileIntent.NavigateToChangePassword -> sendEffect(ProfileEffect.NavigateToChangePassword)
            is ProfileIntent.NavigateToSubscriptionHistory -> sendEffect(ProfileEffect.NavigateToSubscriptionHistory)
            is ProfileIntent.NavigateToAttendanceHistory -> sendEffect(ProfileEffect.NavigateToAttendanceHistory)
            is ProfileIntent.Logout -> logout()
        }
    }

    private fun loadProfile() {
        if (currentState.loading is LoadingState.Loading) return

        launch {
            updateState { copy(loading = LoadingState.Loading()) }

            // Load profile
            profileRepository.getProfile()
                .onSuccess { member ->
                    updateState { copy(member = member) }
                }
                .onFailure { error ->
                    updateState { copy(loading = LoadingState.Error(error.message ?: "Failed to load profile")) }
                    return@launch
                }

            // Load subscription
            subscriptionRepository.getSubscription()
                .onSuccess { subscription ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            subscription = subscription
                        )
                    }
                }
                .onFailure {
                    // Subscription might not exist, still show profile
                    updateState { copy(loading = LoadingState.Success) }
                }
        }
    }

    private fun refresh() {
        launch {
            updateState { copy(isRefreshing = true) }

            // Refresh profile
            profileRepository.getProfile()
                .onSuccess { member ->
                    updateState { copy(member = member) }
                }
                .onFailure { error ->
                    sendEffect(ProfileEffect.ShowError(error.message ?: "Failed to refresh"))
                }

            // Refresh subscription
            subscriptionRepository.getSubscription()
                .onSuccess { subscription ->
                    updateState { copy(subscription = subscription) }
                }

            updateState { copy(isRefreshing = false) }
        }
    }

    private fun logout() {
        launch {
            authRepository.logout()
            sendEffect(ProfileEffect.LoggedOut)
        }
    }
}
