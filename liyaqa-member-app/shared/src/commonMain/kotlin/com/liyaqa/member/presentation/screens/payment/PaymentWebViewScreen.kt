package com.liyaqa.member.presentation.screens.payment

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Error
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.presentation.components.PrimaryButton
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.StatusColors

/**
 * Payment WebView screen for PayTabs integration.
 * Note: WebView implementation is platform-specific (expect/actual).
 * This screen provides the common UI wrapper and handles payment verification.
 */
data class PaymentWebViewScreen(
    val paymentUrl: String,
    val paymentReference: String
) : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val screenModel = getScreenModel<PaymentWebViewScreenModel>()
        val state by screenModel.state.collectAsState()
        val isArabic = LocalIsArabic.current

        LaunchedEffect(paymentReference) {
            screenModel.setPaymentReference(paymentReference)
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = if (isArabic) "الدفع" else "Payment",
                            fontWeight = FontWeight.Bold
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = {
                            if (!state.isVerifying && !state.isSuccess) {
                                navigator.pop()
                            }
                        }) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = if (isArabic) "إغلاق" else "Close"
                            )
                        }
                    }
                )
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when {
                    state.isVerifying -> {
                        // Verifying payment
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = androidx.compose.foundation.layout.Arrangement.Center
                        ) {
                            CircularProgressIndicator()
                            Spacer(modifier = Modifier.height(24.dp))
                            Text(
                                text = if (isArabic) "جاري التحقق من الدفع..." else "Verifying payment...",
                                style = MaterialTheme.typography.bodyLarge
                            )
                        }
                    }
                    state.isSuccess -> {
                        // Payment successful
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = androidx.compose.foundation.layout.Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = StatusColors.active,
                                modifier = Modifier.padding(16.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = if (isArabic) "تم الدفع بنجاح!" else "Payment Successful!",
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold,
                                color = StatusColors.active
                            )
                            state.successMessage?.let { message ->
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = if (isArabic) state.successMessageAr ?: message else message,
                                    style = MaterialTheme.typography.bodyMedium,
                                    textAlign = TextAlign.Center,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Spacer(modifier = Modifier.height(32.dp))
                            PrimaryButton(
                                text = if (isArabic) "تم" else "Done",
                                onClick = {
                                    // Pop back to invoices list
                                    navigator.popUntil { it is com.liyaqa.member.presentation.screens.invoices.InvoicesScreen }
                                }
                            )
                        }
                    }
                    state.error != null -> {
                        // Payment failed
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = androidx.compose.foundation.layout.Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Error,
                                contentDescription = null,
                                tint = StatusColors.overdue,
                                modifier = Modifier.padding(16.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = if (isArabic) "فشل الدفع" else "Payment Failed",
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold,
                                color = StatusColors.overdue
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = if (isArabic) {
                                    state.error?.messageAr ?: state.error?.message ?: "حدث خطأ"
                                } else {
                                    state.error?.message ?: "An error occurred"
                                },
                                style = MaterialTheme.typography.bodyMedium,
                                textAlign = TextAlign.Center,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(32.dp))
                            PrimaryButton(
                                text = if (isArabic) "حاول مرة أخرى" else "Try Again",
                                onClick = screenModel::retry
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            androidx.compose.material3.TextButton(
                                onClick = { navigator.pop() }
                            ) {
                                Text(if (isArabic) "إلغاء" else "Cancel")
                            }
                        }
                    }
                    else -> {
                        // WebView content
                        // Note: Actual WebView implementation is platform-specific
                        // This is a placeholder that shows the payment URL
                        // In actual implementation, use expect/actual for WebView
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = if (isArabic) {
                                    "جاري تحميل صفحة الدفع..."
                                } else {
                                    "Loading payment page..."
                                },
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            CircularProgressIndicator()

                            // In real implementation, the WebView would be here
                            // PaymentWebView(
                            //     url = paymentUrl,
                            //     onPageFinished = { url ->
                            //         if (url.startsWith("liyaqa://payment/callback")) {
                            //             screenModel.verifyPayment()
                            //         }
                            //     }
                            // )

                            // For now, simulate a "Complete Payment" button for testing
                            Spacer(modifier = Modifier.height(32.dp))
                            Text(
                                text = if (isArabic) {
                                    "ملاحظة: سيتم فتح بوابة الدفع في المتصفح"
                                } else {
                                    "Note: Payment gateway will open in browser"
                                },
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            PrimaryButton(
                                text = if (isArabic) "فتح بوابة الدفع" else "Open Payment Gateway",
                                onClick = {
                                    // In real implementation, open URL in system browser
                                    // or use platform WebView
                                    screenModel.openPaymentUrl(paymentUrl)
                                }
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            PrimaryButton(
                                text = if (isArabic) "التحقق من الدفع" else "Verify Payment",
                                onClick = screenModel::verifyPayment
                            )
                        }
                    }
                }
            }
        }
    }
}
