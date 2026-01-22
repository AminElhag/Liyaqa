package com.liyaqa.member.presentation.viewmodel

import com.liyaqa.member.domain.model.Invoice
import com.liyaqa.member.domain.model.InvoiceStatus
import com.liyaqa.member.domain.repository.InvoiceRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel

/**
 * User intents for the Invoices screen.
 */
sealed interface InvoicesIntent {
    /** Initial load of invoices */
    data object LoadInvoices : InvoicesIntent

    /** Pull-to-refresh action */
    data object Refresh : InvoicesIntent

    /** Load more invoices (pagination) */
    data object LoadMore : InvoicesIntent

    /** Filter invoices by status */
    data class FilterByStatus(val filter: InvoiceFilter) : InvoicesIntent

    /** Navigate to invoice detail */
    data class ViewInvoiceDetail(val invoiceId: String) : InvoicesIntent

    /** Navigate to pay invoice */
    data class PayInvoice(val invoiceId: String) : InvoicesIntent
}

/**
 * Filter options for invoices.
 */
enum class InvoiceFilter {
    ALL,
    PENDING,
    PAID,
    OVERDUE
}

/**
 * Summary statistics for invoices.
 */
data class InvoiceSummary(
    val totalDue: Double = 0.0,
    val pendingCount: Int = 0,
    val overdueCount: Int = 0,
    val currency: String = "SAR"
) {
    val formattedTotalDue: String
        get() {
            val intPart = totalDue.toLong()
            val decPart = ((totalDue - intPart) * 100).toLong().let {
                if (it < 10) "0$it" else "$it"
            }
            return "$currency $intPart.$decPart"
        }
}

/**
 * UI state for the Invoices screen.
 */
data class InvoicesState(
    val loading: LoadingState = LoadingState.Idle,
    val invoices: List<Invoice> = emptyList(),
    val hasMore: Boolean = false,
    val page: Int = 0,
    val isRefreshing: Boolean = false,
    val isLoadingMore: Boolean = false,
    val activeFilter: InvoiceFilter = InvoiceFilter.ALL,
    val summary: InvoiceSummary = InvoiceSummary()
) {
    /**
     * Filtered invoices based on active filter.
     */
    val filteredInvoices: List<Invoice>
        get() = when (activeFilter) {
            InvoiceFilter.ALL -> invoices
            InvoiceFilter.PENDING -> invoices.filter {
                it.status == InvoiceStatus.ISSUED || it.status == InvoiceStatus.PARTIALLY_PAID
            }
            InvoiceFilter.PAID -> invoices.filter { it.status == InvoiceStatus.PAID }
            InvoiceFilter.OVERDUE -> invoices.filter { it.status == InvoiceStatus.OVERDUE }
        }

    val isEmpty: Boolean
        get() = filteredInvoices.isEmpty() && loading !is LoadingState.Loading
}

/**
 * One-time effects for the Invoices screen.
 */
sealed interface InvoicesEffect {
    /** Show error message */
    data class ShowError(val message: String) : InvoicesEffect

    /** Navigate to invoice detail */
    data class NavigateToDetail(val invoiceId: String) : InvoicesEffect

    /** Navigate to payment screen */
    data class NavigateToPayment(val invoiceId: String) : InvoicesEffect
}

/**
 * ViewModel for the Invoices screen.
 *
 * Manages:
 * - Invoice listing with pagination
 * - Status filtering (All, Pending, Paid, Overdue)
 * - Pull-to-refresh
 * - Summary statistics
 * - Navigation to detail and payment
 */
class InvoicesViewModel(
    private val invoiceRepository: InvoiceRepository
) : MviViewModel<InvoicesIntent, InvoicesState, InvoicesEffect>(InvoicesState()) {

    companion object {
        private const val PAGE_SIZE = 20
    }

    init {
        onIntent(InvoicesIntent.LoadInvoices)
    }

    override fun onIntent(intent: InvoicesIntent) {
        when (intent) {
            is InvoicesIntent.LoadInvoices -> loadInvoices()
            is InvoicesIntent.Refresh -> refresh()
            is InvoicesIntent.LoadMore -> loadMore()
            is InvoicesIntent.FilterByStatus -> filterByStatus(intent.filter)
            is InvoicesIntent.ViewInvoiceDetail -> sendEffect(InvoicesEffect.NavigateToDetail(intent.invoiceId))
            is InvoicesIntent.PayInvoice -> sendEffect(InvoicesEffect.NavigateToPayment(intent.invoiceId))
        }
    }

    private fun loadInvoices() {
        if (currentState.loading is LoadingState.Loading) return

        launch {
            updateState { copy(loading = LoadingState.Loading()) }

            // Load all invoices (no filter) and also pending invoices for summary
            val invoicesResult = invoiceRepository.getInvoices(status = null, page = 0, size = PAGE_SIZE)
            val pendingResult = invoiceRepository.getPendingInvoices()

            invoicesResult
                .onSuccess { paged ->
                    // Calculate summary from pending invoices
                    val pendingInvoices = pendingResult.getOrNull() ?: emptyList()
                    val summary = calculateSummary(pendingInvoices)

                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            invoices = paged.items,
                            hasMore = paged.hasMore,
                            page = 0,
                            summary = summary
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(loading = LoadingState.Error(error.message ?: "Failed to load invoices"))
                    }
                }
        }
    }

    private fun refresh() {
        launch {
            updateState { copy(isRefreshing = true) }

            val invoicesResult = invoiceRepository.getInvoices(status = null, page = 0, size = PAGE_SIZE)
            val pendingResult = invoiceRepository.getPendingInvoices()

            invoicesResult
                .onSuccess { paged ->
                    val pendingInvoices = pendingResult.getOrNull() ?: emptyList()
                    val summary = calculateSummary(pendingInvoices)

                    updateState {
                        copy(
                            isRefreshing = false,
                            loading = LoadingState.Success,
                            invoices = paged.items,
                            hasMore = paged.hasMore,
                            page = 0,
                            summary = summary
                        )
                    }
                }
                .onFailure { error ->
                    updateState { copy(isRefreshing = false) }
                    sendEffect(InvoicesEffect.ShowError(error.message ?: "Failed to refresh"))
                }
        }
    }

    private fun loadMore() {
        if (currentState.isLoadingMore || !currentState.hasMore) return

        launch {
            updateState { copy(isLoadingMore = true) }

            val nextPage = currentState.page + 1
            val result = invoiceRepository.getInvoices(status = null, page = nextPage, size = PAGE_SIZE)

            result
                .onSuccess { paged ->
                    updateState {
                        copy(
                            isLoadingMore = false,
                            invoices = invoices + paged.items,
                            hasMore = paged.hasMore,
                            page = nextPage
                        )
                    }
                }
                .onFailure { error ->
                    updateState { copy(isLoadingMore = false) }
                    sendEffect(InvoicesEffect.ShowError(error.message ?: "Failed to load more"))
                }
        }
    }

    private fun filterByStatus(filter: InvoiceFilter) {
        updateState { copy(activeFilter = filter) }
    }

    private fun calculateSummary(pendingInvoices: List<Invoice>): InvoiceSummary {
        val totalDue = pendingInvoices.sumOf { it.totalAmount }
        val pendingCount = pendingInvoices.count {
            it.status == InvoiceStatus.ISSUED || it.status == InvoiceStatus.PARTIALLY_PAID
        }
        val overdueCount = pendingInvoices.count { it.status == InvoiceStatus.OVERDUE }
        val currency = pendingInvoices.firstOrNull()?.currency ?: "SAR"

        return InvoiceSummary(
            totalDue = totalDue,
            pendingCount = pendingCount,
            overdueCount = overdueCount,
            currency = currency
        )
    }
}
