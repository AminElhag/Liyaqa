package com.liyaqa.member.ui.screens.invoices

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.viewmodel.InvoiceFilter
import com.liyaqa.member.presentation.viewmodel.InvoicesEffect
import com.liyaqa.member.presentation.viewmodel.InvoicesIntent
import com.liyaqa.member.presentation.viewmodel.InvoicesState
import com.liyaqa.member.presentation.viewmodel.InvoicesViewModel
import com.liyaqa.member.presentation.viewmodel.InvoiceSummary
import com.liyaqa.member.ui.components.InvoiceCard
import com.liyaqa.member.ui.theme.LocalAppLocale
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.invoices_all
import liyaqamember.shared.generated.resources.invoices_overdue
import liyaqamember.shared.generated.resources.invoices_paid
import liyaqamember.shared.generated.resources.invoices_pending
import liyaqamember.shared.generated.resources.invoices_total_due
import liyaqamember.shared.generated.resources.empty_invoices
import liyaqamember.shared.generated.resources.empty_invoices_desc
import liyaqamember.shared.generated.resources.common_loading
import liyaqamember.shared.generated.resources.btn_retry
import org.jetbrains.compose.resources.stringResource
import org.koin.compose.viewmodel.koinViewModel

/**
 * Invoices Screen - Shows member invoices with summary and filtering.
 *
 * Features:
 * - Summary cards: Total Due, Pending Count, Overdue Count
 * - Filter chips: All, Pending, Paid, Overdue
 * - LazyColumn with InvoiceCard
 * - Load more pagination
 * - Pull-to-refresh
 * - Empty state
 */
class InvoicesScreen : Screen {

    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel: InvoicesViewModel = koinViewModel()
        val state by viewModel.state.collectAsState()

        // Handle effects
        LaunchedEffect(Unit) {
            viewModel.effect.collect { effect ->
                when (effect) {
                    is InvoicesEffect.NavigateToDetail -> {
                        navigator.push(InvoiceDetailScreen(effect.invoiceId))
                    }
                    is InvoicesEffect.NavigateToPayment -> {
                        navigator.push(PaymentScreen(effect.invoiceId))
                    }
                    is InvoicesEffect.ShowError -> {
                        // TODO: Show snackbar
                    }
                }
            }
        }

        InvoicesScreenContent(
            state = state,
            onIntent = viewModel::onIntent
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun InvoicesScreenContent(
    state: InvoicesState,
    onIntent: (InvoicesIntent) -> Unit
) {
    val locale = LocalAppLocale.current
    val listState = rememberLazyListState()

    // Detect when scrolled to bottom for load more
    val shouldLoadMore by remember {
        derivedStateOf {
            val lastVisibleIndex = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            val totalItems = listState.layoutInfo.totalItemsCount
            lastVisibleIndex >= totalItems - 3 && state.hasMore && !state.isLoadingMore
        }
    }

    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) {
            onIntent(InvoicesIntent.LoadMore)
        }
    }

    PullToRefreshBox(
        isRefreshing = state.isRefreshing,
        onRefresh = { onIntent(InvoicesIntent.Refresh) },
        modifier = Modifier.fillMaxSize()
    ) {
        when {
            state.loading is LoadingState.Loading && state.invoices.isEmpty() -> {
                LoadingContent()
            }
            state.loading is LoadingState.Error && state.invoices.isEmpty() -> {
                ErrorContent(
                    message = (state.loading as LoadingState.Error).message,
                    onRetry = { onIntent(InvoicesIntent.LoadInvoices) }
                )
            }
            else -> {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    // Summary Cards
                    item {
                        SummaryCards(
                            summary = state.summary,
                            locale = locale
                        )
                    }

                    // Filter Chips
                    item {
                        FilterChips(
                            activeFilter = state.activeFilter,
                            onFilterSelected = { onIntent(InvoicesIntent.FilterByStatus(it)) },
                            locale = locale
                        )
                    }

                    // Invoice List
                    if (state.isEmpty) {
                        item {
                            EmptyInvoicesContent()
                        }
                    } else {
                        itemsIndexed(
                            items = state.filteredInvoices,
                            key = { _, invoice -> invoice.id }
                        ) { _, invoice ->
                            InvoiceCard(
                                invoice = invoice,
                                onClick = { onIntent(InvoicesIntent.ViewInvoiceDetail(invoice.id)) },
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                            )
                        }
                    }

                    // Load More Indicator
                    if (state.isLoadingMore) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator(modifier = Modifier.size(24.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SummaryCards(
    summary: InvoiceSummary,
    locale: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Total Due Card (primary, larger)
        SummaryCard(
            icon = Icons.Default.AttachMoney,
            title = if (locale == "ar") "إجمالي المستحق" else "Total Due",
            value = summary.formattedTotalDue,
            containerColor = MaterialTheme.colorScheme.errorContainer,
            contentColor = MaterialTheme.colorScheme.onErrorContainer,
            modifier = Modifier.weight(1.5f)
        )

        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Pending Count
            SummaryCard(
                icon = Icons.Default.Receipt,
                title = if (locale == "ar") "معلقة" else "Pending",
                value = summary.pendingCount.toString(),
                containerColor = MaterialTheme.colorScheme.tertiaryContainer,
                contentColor = MaterialTheme.colorScheme.onTertiaryContainer,
                compact = true,
                modifier = Modifier.fillMaxWidth()
            )

            // Overdue Count
            SummaryCard(
                icon = Icons.Default.Warning,
                title = if (locale == "ar") "متأخرة" else "Overdue",
                value = summary.overdueCount.toString(),
                containerColor = if (summary.overdueCount > 0)
                    MaterialTheme.colorScheme.errorContainer
                else
                    MaterialTheme.colorScheme.surfaceVariant,
                contentColor = if (summary.overdueCount > 0)
                    MaterialTheme.colorScheme.error
                else
                    MaterialTheme.colorScheme.onSurfaceVariant,
                compact = true,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
private fun SummaryCard(
    icon: ImageVector,
    title: String,
    value: String,
    containerColor: androidx.compose.ui.graphics.Color,
    contentColor: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier,
    compact: Boolean = false
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = containerColor),
        shape = RoundedCornerShape(12.dp)
    ) {
        if (compact) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp),
                    tint = contentColor
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.labelSmall,
                        color = contentColor.copy(alpha = 0.8f)
                    )
                    Text(
                        text = value,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = contentColor
                    )
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        modifier = Modifier.size(24.dp),
                        tint = contentColor
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = title,
                        style = MaterialTheme.typography.bodyMedium,
                        color = contentColor.copy(alpha = 0.8f)
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = value,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = contentColor
                )
            }
        }
    }
}

@Composable
private fun FilterChips(
    activeFilter: InvoiceFilter,
    onFilterSelected: (InvoiceFilter) -> Unit,
    locale: String
) {
    val filters = listOf(
        InvoiceFilter.ALL to stringResource(Res.string.invoices_all),
        InvoiceFilter.PENDING to stringResource(Res.string.invoices_pending),
        InvoiceFilter.PAID to stringResource(Res.string.invoices_paid),
        InvoiceFilter.OVERDUE to stringResource(Res.string.invoices_overdue)
    )

    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(filters) { (filter, label) ->
            FilterChip(
                selected = activeFilter == filter,
                onClick = { onFilterSelected(filter) },
                label = { Text(label) }
            )
        }
    }

    Spacer(modifier = Modifier.height(8.dp))
}

@Composable
private fun LoadingContent() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            CircularProgressIndicator()
            Text(
                text = stringResource(Res.string.common_loading),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun ErrorContent(
    message: String,
    onRetry: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.error
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            androidx.compose.material3.TextButton(onClick = onRetry) {
                Text(stringResource(Res.string.btn_retry))
            }
        }
    }
}

@Composable
private fun EmptyInvoicesContent() {
    val locale = LocalAppLocale.current

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Receipt,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
            )
            Text(
                text = stringResource(Res.string.empty_invoices),
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = stringResource(Res.string.empty_invoices_desc),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
            )
        }
    }
}
