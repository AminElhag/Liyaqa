package com.liyaqa.liyaqa_internal_app.core.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Base ViewModel class following MVVM pattern.
 * Provides common functionality for all ViewModels in the app.
 * Follows Material 3 and modern Android architecture guidelines.
 */
abstract class BaseViewModel<State : UiState, Event : UiEvent> : ViewModel() {

    private val _uiState: MutableStateFlow<State> by lazy {
        MutableStateFlow(initialState())
    }
    val uiState: StateFlow<State> = _uiState.asStateFlow()

    protected val currentState: State
        get() = _uiState.value

    /**
     * Provides the initial state for the ViewModel
     */
    protected abstract fun initialState(): State

    /**
     * Handle UI events
     */
    abstract fun onEvent(event: Event)

    /**
     * Update the UI state
     */
    protected fun setState(reducer: State.() -> State) {
        _uiState.value = currentState.reducer()
    }

    /**
     * Launch a coroutine in viewModelScope with error handling
     */
    protected fun launchWithLoading(
        showLoading: Boolean = true,
        onLoading: (() -> Unit)? = null,
        onError: ((Throwable) -> Unit)? = null,
        block: suspend CoroutineScope.() -> Unit
    ) {
        viewModelScope.launch {
            try {
                if (showLoading) {
                    onLoading?.invoke()
                }
                block()
            } catch (e: Exception) {
                onError?.invoke(e) ?: handleError(e)
            }
        }
    }

    /**
     * Handle Result type with automatic state updates
     */
    protected suspend fun <T> handleResult(
        result: Result<T>,
        onSuccess: suspend (T) -> Unit,
        onError: ((Throwable) -> Unit)? = null,
        onLoading: (() -> Unit)? = null
    ) {
        when (result) {
            is Result.Success -> onSuccess(result.data)
            is Result.Error -> onError?.invoke(result.exception) ?: handleError(result.exception)
            is Result.Loading -> onLoading?.invoke()
        }
    }

    /**
     * Override this to provide custom error handling
     */
    protected open fun handleError(throwable: Throwable) {
        // Default error handling
        // Can be overridden in child classes
    }
}

/**
 * Base interface for UI states
 */
interface UiState

/**
 * Base interface for UI events
 */
interface UiEvent
