package com.liyaqa.member.presentation.screens.invoices

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Payment
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.domain.model.InvoiceStatus
import com.liyaqa.member.presentation.components.ErrorView
import com.liyaqa.member.presentation.components.LoadingView
import com.liyaqa.member.presentation.components.PrimaryButton
import com.liyaqa.member.presentation.components.StatusChip
import com.liyaqa.member.presentation.theme.CustomShapes
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.StatusColors
import com.liyaqa.member.presentation.screens.payment.PaymentWebViewScreen
import com.liyaqa.member.presentation.theme.Strings
import com.liyaqa.member.presentation.theme.localized

data class InvoiceDetailScreen(val invoiceId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val screenModel = getScreenModel<InvoiceDetailScreenModel>()
        val state by screenModel.state.collectAsState()
        val isArabic = LocalIsArabic.current

        LaunchedEffect(invoiceId) {
            screenModel.loadInvoice(invoiceId)
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = state.invoice?.invoiceNumber ?: Strings.invoices.localized(),
                            fontWeight = FontWeight.Bold
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = if (isArabic) "رجوع" else "Back"
                            )
                        }
                    }
                )
            }
        ) { paddingValues ->
            when {
                state.isLoading && state.invoice == null -> {
                    LoadingView(modifier = Modifier.padding(paddingValues))
                }
                state.error != null && state.invoice == null -> {
                    val errorMessage = if (isArabic) {
                        state.error?.messageAr ?: state.error?.message
                    } else {
                        state.error?.message
                    }
                    ErrorView(
                        message = errorMessage ?: "Error loading invoice",
                        onRetry = { screenModel.loadInvoice(invoiceId) },
                        modifier = Modifier.padding(paddingValues)
                    )
                }
                state.invoice != null -> {
                    val invoice = state.invoice!!
                    val statusColor = StatusColors.forInvoiceStatus(invoice.status.name)

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp)
                    ) {
                        // Status Card
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = CustomShapes.card,
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                StatusChip(
                                    text = getInvoiceStatusText(invoice.status, isArabic),
                                    color = statusColor
                                )

                                Spacer(modifier = Modifier.height(16.dp))

                                Text(
                                    text = invoice.totalAmount.format(),
                                    style = MaterialTheme.typography.headlineLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )

                                if (invoice.remainingBalance.amount > 0 &&
                                    invoice.remainingBalance.amount < invoice.totalAmount.amount) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = if (isArabic) {
                                            "المتبقي: ${invoice.remainingBalance.format()}"
                                        } else {
                                            "Remaining: ${invoice.remainingBalance.format()}"
                                        },
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = StatusColors.pending
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Invoice Details Card
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = CustomShapes.card
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp)
                            ) {
                                Text(
                                    text = if (isArabic) "تفاصيل الفاتورة" else "Invoice Details",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold
                                )

                                Spacer(modifier = Modifier.height(16.dp))

                                // Invoice Number
                                DetailRow(
                                    icon = Icons.Default.Receipt,
                                    label = if (isArabic) "رقم الفاتورة" else "Invoice Number",
                                    value = invoice.invoiceNumber
                                )

                                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                                // Issue Date
                                invoice.issueDate?.let { date ->
                                    DetailRow(
                                        icon = Icons.Default.CalendarToday,
                                        label = if (isArabic) "تاريخ الإصدار" else "Issue Date",
                                        value = date
                                    )
                                    HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))
                                }

                                // Due Date
                                invoice.dueDate?.let { date ->
                                    DetailRow(
                                        icon = Icons.Default.CalendarToday,
                                        label = Strings.dueDate.localized(),
                                        value = date,
                                        isWarning = invoice.isOverdue
                                    )
                                    HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))
                                }

                                // Paid Date (if paid)
                                invoice.paidDate?.let { date ->
                                    DetailRow(
                                        icon = Icons.Default.Payment,
                                        label = if (isArabic) "تاريخ الدفع" else "Paid Date",
                                        value = date
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Amount Breakdown Card
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = CustomShapes.card
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp)
                            ) {
                                Text(
                                    text = if (isArabic) "تفاصيل المبلغ" else "Amount Details",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold
                                )

                                Spacer(modifier = Modifier.height(16.dp))

                                // Total
                                AmountRow(
                                    label = if (isArabic) "المبلغ الإجمالي" else "Total Amount",
                                    value = invoice.totalAmount.format(),
                                    isBold = true
                                )

                                // Paid Amount
                                invoice.paidAmount?.let { paid ->
                                    Spacer(modifier = Modifier.height(8.dp))
                                    AmountRow(
                                        label = if (isArabic) "المدفوع" else "Paid",
                                        value = paid.format()
                                    )
                                }

                                // Remaining
                                if (invoice.remainingBalance.amount > 0) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    HorizontalDivider()
                                    Spacer(modifier = Modifier.height(8.dp))
                                    AmountRow(
                                        label = if (isArabic) "المتبقي" else "Remaining",
                                        value = invoice.remainingBalance.format(),
                                        isBold = true,
                                        valueColor = StatusColors.pending
                                    )
                                }
                            }
                        }

                        // Pay Button
                        if (invoice.canPay) {
                            Spacer(modifier = Modifier.height(24.dp))

                            PrimaryButton(
                                text = Strings.payNow.localized(),
                                onClick = { screenModel.initiatePayment(invoiceId) },
                                isLoading = state.isInitiatingPayment
                            )
                        }

                        Spacer(modifier = Modifier.height(32.dp))
                    }
                }
            }
        }

        // Handle payment URL
        LaunchedEffect(state.paymentUrl) {
            state.paymentUrl?.let { url ->
                navigator.push(PaymentWebViewScreen(
                    paymentUrl = url,
                    paymentReference = state.paymentReference ?: ""
                ))
                screenModel.clearPaymentUrl()
            }
        }
    }
}

@Composable
private fun DetailRow(
    icon: ImageVector,
    label: String,
    value: String,
    isWarning: Boolean = false
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = if (isWarning) {
                StatusColors.overdue
            } else {
                MaterialTheme.colorScheme.onSurfaceVariant
            }
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            color = if (isWarning) {
                StatusColors.overdue
            } else {
                MaterialTheme.colorScheme.onSurface
            }
        )
    }
}

@Composable
private fun AmountRow(
    label: String,
    value: String,
    isBold: Boolean = false,
    valueColor: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (isBold) FontWeight.SemiBold else FontWeight.Normal
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (isBold) FontWeight.Bold else FontWeight.Medium,
            color = valueColor
        )
    }
}

private fun getInvoiceStatusText(status: InvoiceStatus, isArabic: Boolean): String {
    return when (status) {
        InvoiceStatus.DRAFT -> if (isArabic) "مسودة" else "Draft"
        InvoiceStatus.ISSUED -> if (isArabic) "صادرة" else "Issued"
        InvoiceStatus.PAID -> if (isArabic) "مدفوعة" else "Paid"
        InvoiceStatus.PARTIALLY_PAID -> if (isArabic) "مدفوعة جزئياً" else "Partial"
        InvoiceStatus.OVERDUE -> if (isArabic) "متأخرة" else "Overdue"
        InvoiceStatus.CANCELLED -> if (isArabic) "ملغاة" else "Cancelled"
        InvoiceStatus.REFUNDED -> if (isArabic) "مستردة" else "Refunded"
    }
}
