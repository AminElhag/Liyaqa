package com.liyaqa.member.presentation.invoices

import androidx.lifecycle.viewModelScope
import com.liyaqa.member.domain.model.Invoice
import com.liyaqa.member.domain.model.InvoiceStatus
import com.liyaqa.member.domain.repository.InvoiceRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel
import com.liyaqa.member.presentation.base.PaginationState
import com.liyaqa.member.presentation.base.DEFAULT_PAGE_SIZE
import kotlinx.coroutines.launch

/**
 * Filter options for invoices.
 */
enum class InvoiceFilter(val apiValue: String?) {
    ALL(null),
    PENDING("PENDING"),
    PAID("PAID"),
    OVERDUE("OVERDUE")
}

/**
 * Summary of pending invoices.
 */
data class PendingInvoiceSummary(
    val count: Int,
    val totalAmount: Double,
    val overdueCount: Int,
    val currency: String = "SAR"
)

/**
 * User intents for the Invoices screen.
 */
sealed interface InvoicesIntent {
    /** Load invoices. */
    data object LoadInvoices : InvoicesIntent

    /** Load more invoices. */
    data object LoadMore : InvoicesIntent

    /** Filter by status. */
    data class FilterByStatus(val filter: InvoiceFilter) : InvoicesIntent

    /** Refresh invoices. */
    data object Refresh : InvoicesIntent

    /** Navigate to invoice detail. */
    data class ViewInvoiceDetail(val invoiceId: String) : InvoicesIntent
}

/**
 * UI state for the Invoices screen.
 */
data class InvoicesState(
    /** Loading state for initial load. */
    val loading: LoadingState = LoadingState.Idle,

    /** Pagination state for invoices. */
    val invoices: PaginationState<Invoice> = PaginationState(),

    /** Summary of pending invoices. */
    val pendingSummary: PendingInvoiceSummary? = null,

    /** Currently selected filter. */
    val selectedFilter: InvoiceFilter = InvoiceFilter.ALL
) {
    /** Total due amount formatted. */
    val formattedTotalDue: String
        get() {
            val summary = pendingSummary ?: return "0.00"
            return "${summary.currency} ${formatAmount(summary.totalAmount)}"
        }

    /** Has pending invoices. */
    val hasPendingInvoices: Boolean get() = (pendingSummary?.count ?: 0) > 0

    /** Has overdue invoices. */
    val hasOverdueInvoices: Boolean get() = (pendingSummary?.overdueCount ?: 0) > 0

    private fun formatAmount(amount: Double): String {
        val intPart = amount.toLong()
        val decPart = ((amount - intPart) * 100).toLong().let {
            if (it < 10) "0$it" else "$it"
        }
        return "$intPart.$decPart"
    }
}

/**
 * One-time effects from the Invoices screen.
 */
sealed interface InvoicesEffect {
    /** Navigate to invoice detail. */
    data class NavigateToDetail(val invoiceId: String) : InvoicesEffect

    /** Show error message. */
    data class ShowError(val message: String) : InvoicesEffect
}

/**
 * ViewModel for the Invoices screen.
 *
 * Features:
 * - List invoices with pagination
 * - Filter by status (All, Pending, Paid, Overdue)
 * - Show pending invoices summary
 * - Pull-to-refresh
 */
class InvoicesViewModel(
    private val invoiceRepository: InvoiceRepository
) : MviViewModel<InvoicesIntent, InvoicesState, InvoicesEffect>(InvoicesState()) {

    init {
        onIntent(InvoicesIntent.LoadInvoices)
        loadPendingSummary()
    }

    override fun onIntent(intent: InvoicesIntent) {
        when (intent) {
            is InvoicesIntent.LoadInvoices -> loadInvoices()
            is InvoicesIntent.LoadMore -> loadMore()
            is InvoicesIntent.FilterByStatus -> filterByStatus(intent.filter)
            is InvoicesIntent.Refresh -> refresh()
            is InvoicesIntent.ViewInvoiceDetail -> sendEffect(InvoicesEffect.NavigateToDetail(intent.invoiceId))
        }
    }

    private fun loadInvoices() {
        if (currentState.invoices.isInitialLoading) return

        updateState { copy(invoices = invoices.withInitialLoading()) }

        viewModelScope.launch {
            invoiceRepository.getInvoices(
                status = currentState.selectedFilter.apiValue,
                page = 0,
                size = DEFAULT_PAGE_SIZE
            )
                .onSuccess { result ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            invoices = invoices.withInitialItems(
                                newItems = result.items,
                                hasMore = result.hasMore,
                                totalCount = result.totalCount
                            )
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(invoices = invoices.withError(
                            error.message ?: "Failed to load invoices"
                        ))
                    }
                }
        }
    }

    private fun loadMore() {
        val pagination = currentState.invoices
        if (!pagination.canLoadMore) return

        updateState { copy(invoices = invoices.withLoadingMore()) }

        viewModelScope.launch {
            invoiceRepository.getInvoices(
                status = currentState.selectedFilter.apiValue,
                page = pagination.nextPage,
                size = DEFAULT_PAGE_SIZE
            )
                .onSuccess { result ->
                    updateState {
                        copy(invoices = invoices.withNewItems(
                            newItems = result.items,
                            hasMore = result.hasMore,
                            totalCount = result.totalCount
                        ))
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(invoices = invoices.withError(
                            error.message ?: "Failed to load more"
                        ))
                    }
                }
        }
    }

    private fun filterByStatus(filter: InvoiceFilter) {
        updateState { copy(selectedFilter = filter, invoices = PaginationState()) }
        loadInvoices()
    }

    private fun refresh() {
        updateState { copy(invoices = invoices.withRefreshing()) }

        viewModelScope.launch {
            // Refresh both invoices and summary
            invoiceRepository.getInvoices(
                status = currentState.selectedFilter.apiValue,
                page = 0,
                size = DEFAULT_PAGE_SIZE
            )
                .onSuccess { result ->
                    updateState {
                        copy(invoices = invoices.withRefreshedItems(
                            newItems = result.items,
                            hasMore = result.hasMore,
                            totalCount = result.totalCount
                        ))
                    }
                }
                .onFailure { error ->
                    updateState { copy(invoices = invoices.copy(isRefreshing = false)) }
                    sendEffect(InvoicesEffect.ShowError(
                        error.message ?: "Failed to refresh"
                    ))
                }

            loadPendingSummary()
        }
    }

    private fun loadPendingSummary() {
        viewModelScope.launch {
            invoiceRepository.getPendingInvoices()
                .onSuccess { pending ->
                    val summary = PendingInvoiceSummary(
                        count = pending.size,
                        totalAmount = pending.sumOf { it.totalAmount },
                        overdueCount = pending.count { it.status == InvoiceStatus.OVERDUE },
                        currency = pending.firstOrNull()?.currency ?: "SAR"
                    )
                    updateState { copy(pendingSummary = summary) }
                }
        }
    }
}
