package com.liyaqa.member.ui.screens.invoices

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.domain.model.Invoice
import com.liyaqa.member.domain.model.InvoiceLineItem
import com.liyaqa.member.domain.model.InvoiceStatus
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.viewmodel.InvoiceDetailEffect
import com.liyaqa.member.presentation.viewmodel.InvoiceDetailIntent
import com.liyaqa.member.presentation.viewmodel.InvoiceDetailState
import com.liyaqa.member.presentation.viewmodel.InvoiceDetailViewModel
import com.liyaqa.member.ui.components.InvoiceStatusBadge
import com.liyaqa.member.ui.navigation.PaymentStatus
import com.liyaqa.member.ui.theme.LocalAppLocale
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.btn_download_pdf
import liyaqamember.shared.generated.resources.btn_pay_now
import liyaqamember.shared.generated.resources.btn_retry
import liyaqamember.shared.generated.resources.common_loading
import liyaqamember.shared.generated.resources.invoices_discount
import liyaqamember.shared.generated.resources.invoices_due_date
import liyaqamember.shared.generated.resources.invoices_issue_date
import liyaqamember.shared.generated.resources.invoices_line_items
import liyaqamember.shared.generated.resources.invoices_subtotal
import liyaqamember.shared.generated.resources.invoices_title
import liyaqamember.shared.generated.resources.invoices_total
import liyaqamember.shared.generated.resources.invoices_vat
import org.jetbrains.compose.resources.stringResource
import org.koin.compose.viewmodel.koinViewModel

/**
 * Invoice Detail Screen - Shows full invoice details with line items.
 *
 * Features:
 * - Invoice header: Number, dates, status badge
 * - Alert banner if overdue/pending
 * - Line items table
 * - Summary: Subtotal, VAT (15%), Discount, Total
 * - Pay Now button (if payable)
 * - Download PDF button
 *
 * @param invoiceId The ID of the invoice to display
 */
data class InvoiceDetailScreen(
    val invoiceId: String
) : Screen {

    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel: InvoiceDetailViewModel = koinViewModel()
        val state by viewModel.state.collectAsState()

        // Load invoice on first composition
        LaunchedEffect(invoiceId) {
            viewModel.onIntent(InvoiceDetailIntent.LoadInvoice(invoiceId))
        }

        // Handle effects
        LaunchedEffect(Unit) {
            viewModel.effect.collect { effect ->
                when (effect) {
                    is InvoiceDetailEffect.NavigateBack -> {
                        navigator.pop()
                    }
                    is InvoiceDetailEffect.NavigateToPayment -> {
                        // Navigate to payment screen with payment info
                        navigator.push(PaymentScreen(invoiceId, effect.payment.redirectUrl))
                    }
                    is InvoiceDetailEffect.PdfDownloaded -> {
                        // TODO: Save PDF to device storage
                    }
                    is InvoiceDetailEffect.ShowError -> {
                        // TODO: Show snackbar
                    }
                    is InvoiceDetailEffect.ShowSuccess -> {
                        // TODO: Show snackbar
                    }
                }
            }
        }

        InvoiceDetailScreenContent(
            state = state,
            onIntent = viewModel::onIntent
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun InvoiceDetailScreenContent(
    state: InvoiceDetailState,
    onIntent: (InvoiceDetailIntent) -> Unit
) {
    val locale = LocalAppLocale.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(Res.string.invoices_title)) },
                navigationIcon = {
                    IconButton(onClick = { onIntent(InvoiceDetailIntent.NavigateBack) }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                actions = {
                    // Download PDF button
                    IconButton(
                        onClick = { onIntent(InvoiceDetailIntent.DownloadPdf) },
                        enabled = !state.isDownloadingPdf && state.invoice != null
                    ) {
                        if (state.isDownloadingPdf) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.Download,
                                contentDescription = stringResource(Res.string.btn_download_pdf)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        PullToRefreshBox(
            isRefreshing = state.isRefreshing,
            onRefresh = { onIntent(InvoiceDetailIntent.Refresh) },
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                state.loading is LoadingState.Loading && state.invoice == null -> {
                    LoadingContent()
                }
                state.loading is LoadingState.Error && state.invoice == null -> {
                    ErrorContent(
                        message = (state.loading as LoadingState.Error).message,
                        onRetry = { onIntent(InvoiceDetailIntent.LoadInvoice(state.invoiceId)) }
                    )
                }
                state.invoice != null -> {
                    InvoiceContent(
                        invoice = state.invoice!!,
                        state = state,
                        locale = locale,
                        onPayClick = { onIntent(InvoiceDetailIntent.InitiatePayment) }
                    )
                }
            }
        }
    }
}

@Composable
private fun InvoiceContent(
    invoice: Invoice,
    state: InvoiceDetailState,
    locale: String,
    onPayClick: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Alert Banner (if overdue or pending)
        if (invoice.isOverdue) {
            item {
                AlertBanner(
                    message = if (locale == "ar")
                        "هذه الفاتورة متأخرة. يرجى الدفع في أقرب وقت ممكن."
                    else
                        "This invoice is overdue. Please pay as soon as possible.",
                    isError = true
                )
            }
        } else if (invoice.isPayable && !invoice.isPaid) {
            item {
                AlertBanner(
                    message = if (locale == "ar")
                        "هذه الفاتورة في انتظار الدفع."
                    else
                        "This invoice is awaiting payment.",
                    isError = false
                )
            }
        }

        // Invoice Header Card
        item {
            InvoiceHeaderCard(invoice = invoice, locale = locale)
        }

        // Line Items Card
        item {
            LineItemsCard(
                lineItems = invoice.lineItems ?: emptyList(),
                subtotal = state.formattedSubtotal,
                vatAmount = state.formattedVatAmount,
                discount = state.formattedDiscount,
                total = state.formattedTotal,
                locale = locale
            )
        }

        // Pay Now Button (if payable)
        if (invoice.isPayable) {
            item {
                Button(
                    onClick = onPayClick,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !state.isInitiatingPayment
                ) {
                    if (state.isInitiatingPayment) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text(stringResource(Res.string.btn_pay_now))
                }
            }
        }

        // Bottom spacing
        item {
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
private fun AlertBanner(
    message: String,
    isError: Boolean
) {
    val backgroundColor = if (isError)
        MaterialTheme.colorScheme.errorContainer
    else
        MaterialTheme.colorScheme.tertiaryContainer

    val contentColor = if (isError)
        MaterialTheme.colorScheme.onErrorContainer
    else
        MaterialTheme.colorScheme.onTertiaryContainer

    val icon = if (isError) Icons.Default.Error else Icons.Default.Warning

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(backgroundColor)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = contentColor,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = contentColor
        )
    }
}

@Composable
private fun InvoiceHeaderCard(
    invoice: Invoice,
    locale: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Invoice number and status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "#${invoice.invoiceNumber}",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                InvoiceStatusBadge(status = invoice.status)
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))

            // Dates
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Issue Date
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.CalendarToday,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Column {
                        Text(
                            text = stringResource(Res.string.invoices_issue_date),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = invoice.issueDate?.toString() ?: "-",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }

                // Due Date
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = if (invoice.isOverdue)
                            MaterialTheme.colorScheme.error
                        else
                            MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Column {
                        Text(
                            text = stringResource(Res.string.invoices_due_date),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = invoice.dueDate?.toString() ?: "-",
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (invoice.isOverdue)
                                MaterialTheme.colorScheme.error
                            else
                                MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun LineItemsCard(
    lineItems: List<InvoiceLineItem>,
    subtotal: String?,
    vatAmount: String?,
    discount: String?,
    total: String,
    locale: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Header
            Text(
                text = stringResource(Res.string.invoices_line_items),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))

            // Line Items
            if (lineItems.isEmpty()) {
                Text(
                    text = if (locale == "ar") "لا توجد بنود" else "No line items",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            } else {
                lineItems.forEach { item ->
                    LineItemRow(item = item, locale = locale)
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))

            // Summary
            subtotal?.let {
                SummaryRow(
                    label = stringResource(Res.string.invoices_subtotal),
                    value = it
                )
            }

            vatAmount?.let {
                SummaryRow(
                    label = stringResource(Res.string.invoices_vat),
                    value = it
                )
            }

            discount?.let {
                SummaryRow(
                    label = stringResource(Res.string.invoices_discount),
                    value = "-$it",
                    valueColor = MaterialTheme.colorScheme.secondary
                )
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))

            // Total
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = stringResource(Res.string.invoices_total),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = total,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
private fun LineItemRow(
    item: InvoiceLineItem,
    locale: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = item.description.localized(locale),
                style = MaterialTheme.typography.bodyMedium
            )
            if (item.quantity > 1) {
                Text(
                    text = "${item.quantity} × ${formatCurrency(item.unitPrice)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        Text(
            text = formatCurrency(item.total),
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun SummaryRow(
    label: String,
    value: String,
    valueColor: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = valueColor
        )
    }
}

private fun formatCurrency(amount: Double, currency: String = "SAR"): String {
    val intPart = amount.toLong()
    val decPart = ((amount - intPart) * 100).toLong().let {
        if (it < 10) "0$it" else "$it"
    }
    return "$currency $intPart.$decPart"
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
                imageVector = Icons.Default.Error,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.error
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            OutlinedButton(onClick = onRetry) {
                Text(stringResource(Res.string.btn_retry))
            }
        }
    }
}
