package com.liyaqa.member.presentation.base

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.collectLatest

/**
 * Common UI events that can be shared across features.
 * Use as base for feature-specific effects or directly for common cases.
 *
 * Usage example:
 * ```kotlin
 * sealed interface DashboardEffect {
 *     data class ShowSnackbar(val message: String) : DashboardEffect
 *     data class Navigate(val route: String) : DashboardEffect
 *     data object NavigateBack : DashboardEffect
 * }
 * ```
 */
sealed interface UiEvent {
    /**
     * Show a toast message to the user.
     */
    data class ShowToast(
        val message: String,
        val duration: ToastDuration = ToastDuration.Short
    ) : UiEvent

    /**
     * Show a snackbar with optional action.
     */
    data class ShowSnackbar(
        val message: String,
        val actionLabel: String? = null,
        val duration: SnackbarDuration = SnackbarDuration.Short
    ) : UiEvent

    /**
     * Navigate to a route/screen.
     */
    data class Navigate(val route: String) : UiEvent

    /**
     * Navigate back to previous screen.
     */
    data object NavigateBack : UiEvent

    /**
     * Navigate back to a specific route, popping screens.
     */
    data class NavigateBackTo(val route: String, val inclusive: Boolean = false) : UiEvent

    /**
     * Navigate and clear back stack.
     */
    data class NavigateAndClearStack(val route: String) : UiEvent

    /**
     * Show an error dialog.
     */
    data class ShowErrorDialog(
        val title: String,
        val message: String,
        val dismissLabel: String = "OK"
    ) : UiEvent

    /**
     * Show a confirmation dialog.
     */
    data class ShowConfirmDialog(
        val title: String,
        val message: String,
        val confirmLabel: String = "Confirm",
        val cancelLabel: String = "Cancel",
        val onConfirm: () -> Unit = {},
        val onCancel: () -> Unit = {}
    ) : UiEvent

    /**
     * Copy text to clipboard.
     */
    data class CopyToClipboard(val text: String, val label: String = "Copied") : UiEvent

    /**
     * Share content externally.
     */
    data class Share(val text: String, val title: String? = null) : UiEvent

    /**
     * Open external URL in browser.
     */
    data class OpenUrl(val url: String) : UiEvent

    /**
     * Scroll to a position in a list.
     */
    data class ScrollToPosition(val position: Int) : UiEvent

    /**
     * Scroll to top of list.
     */
    data object ScrollToTop : UiEvent

    /**
     * Focus a specific input field.
     */
    data class FocusField(val fieldId: String) : UiEvent

    /**
     * Hide the keyboard.
     */
    data object HideKeyboard : UiEvent

    /**
     * Refresh completed event.
     */
    data object RefreshCompleted : UiEvent
}

/**
 * Toast duration options.
 */
enum class ToastDuration {
    Short,
    Long
}

/**
 * Snackbar duration options.
 */
enum class SnackbarDuration {
    Short,
    Long,
    Indefinite
}

/**
 * Composable helper to collect effects from a ViewModel.
 * Handles effects as they arrive and invokes the handler.
 *
 * Usage example:
 * ```kotlin
 * @Composable
 * fun DashboardScreen(viewModel: DashboardViewModel) {
 *     val state by viewModel.state.collectAsStateWithLifecycle()
 *
 *     CollectEffects(viewModel.effect) { effect ->
 *         when (effect) {
 *             is DashboardEffect.ShowError -> showSnackbar(effect.message)
 *             is DashboardEffect.NavigateToDetail -> navigateTo(effect.id)
 *         }
 *     }
 *
 *     // UI content...
 * }
 * ```
 *
 * @param effectFlow The flow of effects from the ViewModel
 * @param handler The handler function for each effect
 */
@Composable
fun <T> CollectEffects(
    effectFlow: Flow<T>,
    handler: suspend (T) -> Unit
) {
    LaunchedEffect(effectFlow) {
        effectFlow.collectLatest { effect ->
            handler(effect)
        }
    }
}

/**
 * Composable helper to collect effects with a key.
 * Re-collects when the key changes.
 *
 * @param key The key to trigger re-collection
 * @param effectFlow The flow of effects from the ViewModel
 * @param handler The handler function for each effect
 */
@Composable
fun <T> CollectEffects(
    key: Any?,
    effectFlow: Flow<T>,
    handler: suspend (T) -> Unit
) {
    LaunchedEffect(key, effectFlow) {
        effectFlow.collectLatest { effect ->
            handler(effect)
        }
    }
}

/**
 * Interface for ViewModels that can handle navigation.
 * Implement this to standardize navigation patterns.
 */
interface NavigationHandler {
    /**
     * Navigate to a route.
     */
    fun navigateTo(route: String)

    /**
     * Navigate back.
     */
    fun navigateBack()
}

/**
 * Interface for ViewModels that handle errors.
 * Implement this to standardize error handling patterns.
 */
interface ErrorHandler {
    /**
     * Handle an error and update state/emit effect accordingly.
     */
    fun handleError(error: Throwable, retryAction: (() -> Unit)? = null)

    /**
     * Clear current error state.
     */
    fun clearError()
}

/**
 * Interface for ViewModels that handle loading state.
 * Implement this to standardize loading patterns.
 */
interface LoadingHandler {
    /**
     * Set loading state.
     */
    fun setLoading(isLoading: Boolean)

    /**
     * Whether currently loading.
     */
    val isLoading: Boolean
}
