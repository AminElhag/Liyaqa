package com.liyaqa.member.ui.screens.invoices

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.scaleIn
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.ui.navigation.PaymentStatus
import com.liyaqa.member.ui.theme.LocalAppLocale
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.payment_return_to_invoices
import liyaqamember.shared.generated.resources.payment_try_again
import org.jetbrains.compose.resources.stringResource

/**
 * Data class for payment status display configuration.
 */
private data class StatusConfig(
    val icon: ImageVector,
    val iconBackground: @Composable () -> Color,
    val iconTint: @Composable () -> Color,
    val titleEn: String,
    val titleAr: String,
    val messageEn: String,
    val messageAr: String
)

/**
 * Screen showing payment completion status.
 *
 * @param status The payment result status
 * @param invoiceId The invoice that was being paid
 */
data class PaymentCompleteScreen(
    val status: PaymentStatus,
    val invoiceId: String
) : Screen {

    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow

        PaymentCompleteContent(
            status = status,
            invoiceId = invoiceId,
            onReturnToInvoices = {
                // Pop back to invoices tab
                navigator.popUntilRoot()
            },
            onTryAgain = {
                navigator.replace(PaymentScreen(invoiceId))
            }
        )
    }
}

@Composable
private fun PaymentCompleteContent(
    status: PaymentStatus,
    invoiceId: String,
    onReturnToInvoices: () -> Unit,
    onTryAgain: () -> Unit,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    var showContent by remember { mutableStateOf(false) }

    // Trigger animation on composition
    LaunchedEffect(Unit) {
        showContent = true
    }

    // Animation scale
    val scale by animateFloatAsState(
        targetValue = if (showContent) 1f else 0.8f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "scale"
    )

    val config = getStatusConfig(status, invoiceId)

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Animated status icon
        AnimatedVisibility(
            visible = showContent,
            enter = scaleIn(
                animationSpec = spring(
                    dampingRatio = Spring.DampingRatioMediumBouncy,
                    stiffness = Spring.StiffnessLow
                )
            ) + fadeIn()
        ) {
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .scale(scale)
                    .clip(CircleShape)
                    .background(config.iconBackground()),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = config.icon,
                    contentDescription = null,
                    modifier = Modifier.size(48.dp),
                    tint = config.iconTint()
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Title
        AnimatedVisibility(
            visible = showContent,
            enter = fadeIn()
        ) {
            Text(
                text = if (locale == "ar") config.titleAr else config.titleEn,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurface
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Message
        AnimatedVisibility(
            visible = showContent,
            enter = fadeIn()
        ) {
            Text(
                text = if (locale == "ar") config.messageAr else config.messageEn,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Invoice info card for success
        if (status == PaymentStatus.SUCCESS) {
            AnimatedVisibility(
                visible = showContent,
                enter = fadeIn()
            ) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = if (locale == "ar") "رقم الفاتورة" else "Invoice Number",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = "#$invoiceId",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(48.dp))

        // Action buttons
        AnimatedVisibility(
            visible = showContent,
            enter = fadeIn()
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                when (status) {
                    PaymentStatus.SUCCESS -> {
                        Button(
                            onClick = onReturnToInvoices,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary
                            )
                        ) {
                            Text(stringResource(Res.string.payment_return_to_invoices))
                        }
                    }
                    PaymentStatus.FAILED -> {
                        Button(
                            onClick = onTryAgain,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary
                            )
                        ) {
                            Text(stringResource(Res.string.payment_try_again))
                        }
                        OutlinedButton(
                            onClick = onReturnToInvoices,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(stringResource(Res.string.payment_return_to_invoices))
                        }
                    }
                    PaymentStatus.CANCELLED, PaymentStatus.PENDING -> {
                        Button(
                            onClick = onReturnToInvoices,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(stringResource(Res.string.payment_return_to_invoices))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun getStatusConfig(status: PaymentStatus, invoiceId: String): StatusConfig {
    return when (status) {
        PaymentStatus.SUCCESS -> StatusConfig(
            icon = Icons.Filled.Check,
            iconBackground = { MaterialTheme.colorScheme.primaryContainer },
            iconTint = { MaterialTheme.colorScheme.primary },
            titleEn = "Payment Successful",
            titleAr = "تم الدفع بنجاح",
            messageEn = "Your payment for invoice #$invoiceId has been processed successfully.",
            messageAr = "تم معالجة دفعتك للفاتورة #$invoiceId بنجاح."
        )
        PaymentStatus.FAILED -> StatusConfig(
            icon = Icons.Filled.Close,
            iconBackground = { MaterialTheme.colorScheme.errorContainer },
            iconTint = { MaterialTheme.colorScheme.error },
            titleEn = "Payment Failed",
            titleAr = "فشل الدفع",
            messageEn = "We couldn't process your payment. Please try again or use a different payment method.",
            messageAr = "لم نتمكن من معالجة دفعتك. يرجى المحاولة مرة أخرى أو استخدام طريقة دفع مختلفة."
        )
        PaymentStatus.CANCELLED -> StatusConfig(
            icon = Icons.Filled.Info,
            iconBackground = { MaterialTheme.colorScheme.surfaceVariant },
            iconTint = { MaterialTheme.colorScheme.onSurfaceVariant },
            titleEn = "Payment Cancelled",
            titleAr = "تم إلغاء الدفع",
            messageEn = "You cancelled the payment. Your invoice is still pending.",
            messageAr = "لقد قمت بإلغاء الدفع. فاتورتك لا تزال معلقة."
        )
        PaymentStatus.PENDING -> StatusConfig(
            icon = Icons.Filled.Schedule,
            iconBackground = { MaterialTheme.colorScheme.tertiaryContainer },
            iconTint = { MaterialTheme.colorScheme.tertiary },
            titleEn = "Payment Pending",
            titleAr = "الدفع قيد الانتظار",
            messageEn = "Your payment is being processed. You will receive a confirmation shortly.",
            messageAr = "يتم معالجة دفعتك. ستتلقى تأكيدًا قريبًا."
        )
    }
}
