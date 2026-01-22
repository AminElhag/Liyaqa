package com.liyaqa.member.presentation.subscriptions

import androidx.lifecycle.viewModelScope
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.model.SubscriptionStatus
import com.liyaqa.member.domain.repository.SubscriptionRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel
import kotlinx.coroutines.launch

/**
 * User intents for the Subscriptions screen.
 */
sealed interface SubscriptionsIntent {
    /** Load active subscription. */
    data object LoadSubscription : SubscriptionsIntent

    /** Load subscription history. */
    data object LoadHistory : SubscriptionsIntent

    /** Refresh all subscription data. */
    data object Refresh : SubscriptionsIntent

    /** Navigate to subscription detail. */
    data class ViewSubscription(val subscriptionId: String) : SubscriptionsIntent
}

/**
 * UI state for the Subscriptions screen.
 */
data class SubscriptionsState(
    /** Loading state for active subscription. */
    val loading: LoadingState = LoadingState.Idle,

    /** Loading state for history. */
    val historyLoading: LoadingState = LoadingState.Idle,

    /** Active subscription. */
    val activeSubscription: Subscription? = null,

    /** Subscription history. */
    val history: List<Subscription> = emptyList(),

    /** Whether currently refreshing. */
    val isRefreshing: Boolean = false
) {
    /** Whether there is an active subscription. */
    val hasActiveSubscription: Boolean get() = activeSubscription != null

    /** Whether there is subscription history. */
    val hasHistory: Boolean get() = history.isNotEmpty()

    /** Active subscription status. */
    val activeStatus: SubscriptionStatus? get() = activeSubscription?.status

    /** Whether the active subscription is expiring soon. */
    val isExpiringSoon: Boolean get() = activeSubscription?.isExpiringSoon == true

    /** Whether the active subscription is frozen. */
    val isFrozen: Boolean get() = activeSubscription?.status == SubscriptionStatus.FROZEN

    /** Days remaining in active subscription. */
    val daysRemaining: Int get() = activeSubscription?.daysRemaining ?: 0

    /** Classes remaining (null if unlimited). */
    val classesRemaining: Int? get() = activeSubscription?.classesRemaining

    /** Total classes in plan (null if unlimited). */
    val totalClasses: Int? get() = activeSubscription?.totalClasses

    /** Whether subscription has class limits. */
    val hasClassLimit: Boolean get() = activeSubscription?.hasClassLimit == true

    /** Percentage of classes used (null if unlimited). */
    val classesUsedPercentage: Float? get() = activeSubscription?.classesUsedPercentage

    /** Formatted days remaining progress (0-100). */
    val daysRemainingPercentage: Float
        get() {
            val subscription = activeSubscription ?: return 0f
            val totalDays = (subscription.endDate.toEpochDays() - subscription.startDate.toEpochDays()).toFloat()
            if (totalDays <= 0) return 100f
            return ((totalDays - daysRemaining) / totalDays) * 100f
        }
}

/**
 * One-time effects from the Subscriptions screen.
 */
sealed interface SubscriptionsEffect {
    /** Show error message. */
    data class ShowError(val message: String) : SubscriptionsEffect

    /** Navigate to subscription detail. */
    data class NavigateToDetail(val subscriptionId: String) : SubscriptionsEffect
}

/**
 * ViewModel for the Subscriptions screen.
 *
 * Features:
 * - Display active subscription with progress
 * - Show subscription history
 * - Visual indicators for expiring/frozen status
 */
class SubscriptionsViewModel(
    private val subscriptionRepository: SubscriptionRepository
) : MviViewModel<SubscriptionsIntent, SubscriptionsState, SubscriptionsEffect>(SubscriptionsState()) {

    init {
        onIntent(SubscriptionsIntent.LoadSubscription)
        onIntent(SubscriptionsIntent.LoadHistory)
    }

    override fun onIntent(intent: SubscriptionsIntent) {
        when (intent) {
            is SubscriptionsIntent.LoadSubscription -> loadSubscription()
            is SubscriptionsIntent.LoadHistory -> loadHistory()
            is SubscriptionsIntent.Refresh -> refresh()
            is SubscriptionsIntent.ViewSubscription -> viewSubscription(intent.subscriptionId)
        }
    }

    private fun loadSubscription() {
        updateState { copy(loading = LoadingState.Loading()) }

        viewModelScope.launch {
            subscriptionRepository.getSubscription()
                .onSuccess { subscription ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            activeSubscription = subscription
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(loading = LoadingState.Error(
                            message = error.message ?: "Failed to load subscription",
                            throwable = error
                        ))
                    }
                }
        }
    }

    private fun loadHistory() {
        updateState { copy(historyLoading = LoadingState.Loading()) }

        viewModelScope.launch {
            subscriptionRepository.getSubscriptionHistory()
                .onSuccess { history ->
                    updateState {
                        copy(
                            historyLoading = LoadingState.Success,
                            history = history
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(historyLoading = LoadingState.Error(
                            message = error.message ?: "Failed to load history",
                            throwable = error
                        ))
                    }
                }
        }
    }

    private fun refresh() {
        updateState { copy(isRefreshing = true) }

        viewModelScope.launch {
            // Clear cache first
            subscriptionRepository.clearCache()

            // Load subscription
            subscriptionRepository.getSubscription()
                .onSuccess { subscription ->
                    updateState {
                        copy(
                            activeSubscription = subscription,
                            isRefreshing = false
                        )
                    }
                }
                .onFailure {
                    updateState { copy(isRefreshing = false) }
                }

            // Load history
            subscriptionRepository.getSubscriptionHistory()
                .onSuccess { history ->
                    updateState { copy(history = history) }
                }
        }
    }

    private fun viewSubscription(subscriptionId: String) {
        sendEffect(SubscriptionsEffect.NavigateToDetail(subscriptionId))
    }
}
