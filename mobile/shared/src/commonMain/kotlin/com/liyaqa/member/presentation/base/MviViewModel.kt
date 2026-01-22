package com.liyaqa.member.presentation.base

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * Base ViewModel implementing Model-View-Intent (MVI) architecture pattern.
 *
 * The MVI pattern provides unidirectional data flow:
 * 1. User actions trigger [Intent]s
 * 2. Intents are processed and update [State]
 * 3. State changes trigger UI recomposition
 * 4. One-time [Effect]s trigger navigation, toasts, etc.
 *
 * @param Intent The sealed interface/class representing user actions
 * @param State The data class representing UI state
 * @param Effect The sealed interface/class representing one-time side effects
 * @param initialState The initial state of the ViewModel
 *
 * Usage example:
 * ```kotlin
 * class DashboardViewModel(
 *     private val dashboardRepository: DashboardRepository
 * ) : MviViewModel<DashboardIntent, DashboardState, DashboardEffect>(DashboardState()) {
 *
 *     override fun onIntent(intent: DashboardIntent) {
 *         when (intent) {
 *             is DashboardIntent.LoadDashboard -> loadDashboard()
 *             is DashboardIntent.Refresh -> refresh()
 *         }
 *     }
 *
 *     private fun loadDashboard() {
 *         updateState { copy(loading = LoadingState.Loading) }
 *         // ... fetch data
 *         updateState { copy(loading = LoadingState.Success, data = result) }
 *     }
 * }
 * ```
 */
abstract class MviViewModel<Intent : Any, State : Any, Effect : Any>(
    initialState: State
) : ViewModel() {

    /**
     * Internal mutable state flow.
     */
    private val _state = MutableStateFlow(initialState)

    /**
     * Public immutable state flow for UI observation.
     * Collectors receive the current state and all subsequent updates.
     */
    val state: StateFlow<State> = _state.asStateFlow()

    /**
     * Channel for one-time effects (navigation, toasts, snackbars).
     * Using Channel ensures effects are not replayed on configuration changes.
     */
    private val _effect = Channel<Effect>(Channel.BUFFERED)

    /**
     * Public flow for one-time effects.
     * Collectors should handle effects exactly once.
     */
    val effect = _effect.receiveAsFlow()

    /**
     * Alternative SharedFlow for effects when multiple collectors are needed.
     * Use this when the effect needs to be observed by multiple components.
     */
    private val _sharedEffect = MutableSharedFlow<Effect>()
    val sharedEffect: SharedFlow<Effect> = _sharedEffect.asSharedFlow()

    /**
     * Returns the current state value.
     * Useful for reading state in intent handlers.
     */
    protected val currentState: State
        get() = _state.value

    /**
     * Updates the state using a reducer function.
     * The reducer receives the current state and returns the new state.
     *
     * @param reducer A function that takes the current state and returns the new state
     *
     * Example:
     * ```kotlin
     * updateState { copy(isLoading = true) }
     * updateState { this.copy(items = newItems, hasMore = moreAvailable) }
     * ```
     */
    protected fun updateState(reducer: State.() -> State) {
        _state.update { it.reducer() }
    }

    /**
     * Sets the state directly to a new value.
     * Prefer [updateState] for more readable state transitions.
     *
     * @param newState The new state value
     */
    protected fun setState(newState: State) {
        _state.value = newState
    }

    /**
     * Sends a one-time effect to the UI.
     * Effects are processed exactly once and not replayed.
     *
     * @param effect The effect to send
     *
     * Example:
     * ```kotlin
     * sendEffect(DashboardEffect.NavigateToDetail(itemId))
     * sendEffect(DashboardEffect.ShowError("Something went wrong"))
     * ```
     */
    protected fun sendEffect(effect: Effect) {
        viewModelScope.launch {
            _effect.send(effect)
        }
    }

    /**
     * Sends a one-time effect to multiple collectors via SharedFlow.
     * Use when the effect needs to be observed by multiple components.
     *
     * @param effect The effect to emit
     */
    protected fun emitSharedEffect(effect: Effect) {
        viewModelScope.launch {
            _sharedEffect.emit(effect)
        }
    }

    /**
     * Handles user intents/actions.
     * Override this method to process intents and update state accordingly.
     *
     * @param intent The user action to process
     *
     * Example:
     * ```kotlin
     * override fun onIntent(intent: MyIntent) {
     *     when (intent) {
     *         is MyIntent.Load -> load()
     *         is MyIntent.Refresh -> refresh()
     *         is MyIntent.ItemClicked -> handleItemClick(intent.id)
     *     }
     * }
     * ```
     */
    abstract fun onIntent(intent: Intent)

    /**
     * Convenience method to process an intent.
     * Same as [onIntent] but can be called with invoke syntax.
     */
    operator fun invoke(intent: Intent) = onIntent(intent)

    /**
     * Launches a coroutine in the ViewModel scope.
     * Useful for async operations in intent handlers.
     *
     * @param block The suspending block to execute
     */
    protected fun launch(block: suspend () -> Unit) {
        viewModelScope.launch { block() }
    }

    /**
     * Launches a coroutine with error handling.
     * Catches exceptions and allows custom error handling.
     *
     * @param onError Called when an exception occurs
     * @param block The suspending block to execute
     */
    protected fun launchWithErrorHandling(
        onError: (Throwable) -> Unit = {},
        block: suspend () -> Unit
    ) {
        viewModelScope.launch {
            try {
                block()
            } catch (e: Exception) {
                onError(e)
            }
        }
    }
}
