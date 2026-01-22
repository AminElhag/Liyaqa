package com.liyaqa.member.ui.screens.invoices

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.ui.navigation.PaymentStatus
import com.liyaqa.member.ui.theme.LocalAppLocale
import kotlinx.coroutines.delay
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.btn_retry
import liyaqamember.shared.generated.resources.payment_amount
import liyaqamember.shared.generated.resources.payment_processing
import liyaqamember.shared.generated.resources.payment_title
import org.jetbrains.compose.resources.stringResource

/**
 * Payment processing states.
 */
sealed interface PaymentProcessingState {
    data object Idle : PaymentProcessingState
    data object Initiating : PaymentProcessingState
    data object Processing : PaymentProcessingState
    data class Error(val message: String) : PaymentProcessingState
    data class RedirectRequired(val url: String) : PaymentProcessingState
}

/**
 * Screen for processing payment for an invoice.
 * Handles PayTabs integration with redirect URL.
 *
 * @param invoiceId The ID of the invoice being paid
 * @param redirectUrl Optional redirect URL from payment initiation
 */
data class PaymentScreen(
    val invoiceId: String,
    val redirectUrl: String? = null
) : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val locale = LocalAppLocale.current
        var processingState by remember {
            mutableStateOf<PaymentProcessingState>(
                if (redirectUrl != null) PaymentProcessingState.RedirectRequired(redirectUrl)
                else PaymentProcessingState.Idle
            )
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(stringResource(Res.string.payment_title)) },
                    navigationIcon = {
                        IconButton(
                            onClick = {
                                // Cancel payment and go back
                                navigator.replace(PaymentCompleteScreen(PaymentStatus.CANCELLED, invoiceId))
                            },
                            enabled = processingState !is PaymentProcessingState.Processing
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back"
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
            }
        ) { paddingValues ->
            PaymentContent(
                invoiceId = invoiceId,
                processingState = processingState,
                locale = locale,
                onProceedToPayment = {
                    processingState = PaymentProcessingState.Processing
                },
                onPaymentComplete = { status ->
                    navigator.replace(PaymentCompleteScreen(status, invoiceId))
                },
                onRetry = {
                    processingState = PaymentProcessingState.Idle
                },
                onOpenBrowser = { url ->
                    // In production, this would open the system browser or WebView
                    processingState = PaymentProcessingState.Processing
                },
                modifier = Modifier.padding(paddingValues)
            )
        }

        // Simulate payment processing when in Processing state
        if (processingState is PaymentProcessingState.Processing) {
            LaunchedEffect(Unit) {
                delay(3000) // Simulate payment processing
                // Simulate payment result (80% success rate for demo)
                val status = if ((0..10).random() > 2) PaymentStatus.SUCCESS else PaymentStatus.FAILED
                navigator.replace(PaymentCompleteScreen(status, invoiceId))
            }
        }
    }
}

@Composable
private fun PaymentContent(
    invoiceId: String,
    processingState: PaymentProcessingState,
    locale: String,
    onProceedToPayment: () -> Unit,
    onPaymentComplete: (PaymentStatus) -> Unit,
    onRetry: () -> Unit,
    onOpenBrowser: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        when (processingState) {
            is PaymentProcessingState.Idle -> {
                PaymentSummaryContent(
                    invoiceId = invoiceId,
                    locale = locale,
                    onProceedToPayment = onProceedToPayment
                )
            }
            is PaymentProcessingState.Initiating -> {
                ProcessingIndicator(
                    message = if (locale == "ar") "جاري تحضير الدفع..." else "Preparing payment..."
                )
            }
            is PaymentProcessingState.Processing -> {
                ProcessingIndicator(
                    message = stringResource(Res.string.payment_processing)
                )
            }
            is PaymentProcessingState.Error -> {
                ErrorContent(
                    message = processingState.message,
                    locale = locale,
                    onRetry = onRetry
                )
            }
            is PaymentProcessingState.RedirectRequired -> {
                RedirectContent(
                    url = processingState.url,
                    locale = locale,
                    onOpenBrowser = { onOpenBrowser(processingState.url) }
                )
            }
        }
    }
}

@Composable
private fun PaymentSummaryContent(
    invoiceId: String,
    locale: String,
    onProceedToPayment: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Security Icon
        Icon(
            imageVector = Icons.Default.Security,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Invoice Summary Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            )
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = if (locale == "ar") "فاتورة #$invoiceId" else "Invoice #$invoiceId",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Text(
                    text = stringResource(Res.string.payment_amount),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                // Amount (would come from ViewModel in production)
                Text(
                    text = "SAR 1,150.00",
                    style = MaterialTheme.typography.displaySmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Pay button
        Button(
            onClick = onProceedToPayment,
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(
                imageVector = Icons.Default.OpenInBrowser,
                contentDescription = null,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.padding(horizontal = 8.dp))
            Text(
                text = if (locale == "ar") "المتابعة إلى الدفع" else "Proceed to Payment"
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Security note
        Text(
            text = if (locale == "ar")
                "ستتم إعادة توجيهك إلى صفحة الدفع الآمنة PayTabs"
            else
                "You will be redirected to PayTabs secure payment page",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun ProcessingIndicator(
    message: String
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        CircularProgressIndicator(
            modifier = Modifier.size(64.dp),
            strokeWidth = 4.dp
        )
        Text(
            text = message,
            style = MaterialTheme.typography.titleMedium,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun RedirectContent(
    url: String,
    locale: String,
    onOpenBrowser: () -> Unit
) {
    Column(
        modifier = Modifier.padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Icon(
            imageVector = Icons.Default.OpenInBrowser,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.primary
        )

        Text(
            text = if (locale == "ar")
                "سيتم فتح صفحة الدفع الآمنة"
            else
                "Secure payment page will open",
            style = MaterialTheme.typography.titleMedium,
            textAlign = TextAlign.Center
        )

        Text(
            text = if (locale == "ar")
                "أكمل عملية الدفع في المتصفح، ثم عد إلى التطبيق."
            else
                "Complete payment in browser, then return to the app.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = onOpenBrowser,
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(
                imageVector = Icons.Default.OpenInBrowser,
                contentDescription = null,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.padding(horizontal = 8.dp))
            Text(
                text = if (locale == "ar") "فتح صفحة الدفع" else "Open Payment Page"
            )
        }
    }
}

@Composable
private fun ErrorContent(
    message: String,
    locale: String,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier.padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Icon(
            imageVector = Icons.Default.Error,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.error
        )

        Text(
            text = if (locale == "ar") "فشل تحضير الدفع" else "Payment Preparation Failed",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )

        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedButton(onClick = onRetry) {
            Text(stringResource(Res.string.btn_retry))
        }
    }
}
