package com.liyaqa.member.presentation.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.liyaqa.member.domain.model.Invoice
import com.liyaqa.member.domain.model.InvoiceStatus
import com.liyaqa.member.presentation.theme.CustomShapes
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.StatusColors
import com.liyaqa.member.presentation.theme.Strings
import com.liyaqa.member.presentation.theme.localized

/**
 * Invoice card for invoice list
 */
@Composable
fun InvoiceCard(
    invoice: Invoice,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    onPayClick: (() -> Unit)? = null
) {
    val isArabic = LocalIsArabic.current
    val statusColor = StatusColors.forInvoiceStatus(invoice.status.name)

    Card(
        modifier = modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        shape = CustomShapes.card,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header: Invoice number and status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Receipt,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = invoice.invoiceNumber,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                StatusChip(
                    text = getInvoiceStatusText(invoice.status, isArabic),
                    color = statusColor
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Amount
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (isArabic) "المبلغ الإجمالي" else "Total Amount",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = invoice.totalAmount.format(),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            // Remaining balance if partially paid
            if (invoice.remainingBalance.amount > 0 && invoice.remainingBalance.amount < invoice.totalAmount.amount) {
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = if (isArabic) "المبلغ المتبقي" else "Remaining",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = invoice.remainingBalance.format(),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = StatusColors.pending
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Due date
            invoice.dueDate?.let { dueDate ->
                InvoiceInfoRow(
                    icon = Icons.Default.CalendarToday,
                    label = Strings.dueDate.localized(),
                    value = dueDate,
                    isWarning = invoice.isOverdue
                )
            }

            // Pay button for pending invoices
            if (invoice.canPay && onPayClick != null) {
                Spacer(modifier = Modifier.height(12.dp))
                PrimaryButton(
                    text = Strings.payNow.localized(),
                    onClick = onPayClick
                )
            }
        }
    }
}

@Composable
private fun InvoiceInfoRow(
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
            modifier = Modifier.size(16.dp),
            tint = if (isWarning) {
                StatusColors.overdue
            } else {
                MaterialTheme.colorScheme.onSurfaceVariant
            }
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Medium,
            color = if (isWarning) {
                StatusColors.overdue
            } else {
                MaterialTheme.colorScheme.onSurface
            }
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
