package com.liyaqa.member.ui.screens.qr

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.liyaqa.member.core.localization.formatCountdown
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.viewmodel.QrCodeEffect
import com.liyaqa.member.presentation.viewmodel.QrCodeIntent
import com.liyaqa.member.presentation.viewmodel.QrCodeState
import com.liyaqa.member.presentation.viewmodel.QrCodeViewModel
import com.liyaqa.member.ui.components.QrCodeImage
import com.liyaqa.member.ui.theme.GradientEnd
import com.liyaqa.member.ui.theme.GradientStart
import com.liyaqa.member.ui.theme.LocalAppLocale
import kotlinx.coroutines.delay
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import org.koin.compose.viewmodel.koinViewModel

/**
 * QR Code screen for member check-in.
 *
 * Displays a large QR code with:
 * - Gradient background (primary-600 to primary-800)
 * - QR code in white rounded container
 * - Member name
 * - Countdown timer
 * - Refresh button
 * - Check-in instructions
 *
 * Auto-refreshes 5 minutes before QR code expiry.
 */
@Composable
fun QrCodeScreen(
    viewModel: QrCodeViewModel = koinViewModel(),
    onShowError: (String) -> Unit = {}
) {
    val state by viewModel.state.collectAsState()
    val locale = LocalAppLocale.current

    // Handle one-time effects
    LaunchedEffect(Unit) {
        viewModel.effect.collect { effect ->
            when (effect) {
                is QrCodeEffect.ShowError -> onShowError(effect.message)
                is QrCodeEffect.QrCodeRefreshed -> {
                    // Optional: show toast or haptic feedback
                }
            }
        }
    }

    QrCodeContent(
        state = state,
        locale = locale,
        onRefresh = { viewModel.onIntent(QrCodeIntent.RefreshQrCode) },
        onRetry = { viewModel.onIntent(QrCodeIntent.LoadQrCode) }
    )
}

/**
 * QR Code screen content - stateless composable.
 */
@Composable
private fun QrCodeContent(
    state: QrCodeState,
    locale: String,
    onRefresh: () -> Unit,
    onRetry: () -> Unit
) {
    // Gradient background
    val gradientBrush = Brush.verticalGradient(
        colors = listOf(GradientStart, GradientEnd)
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(gradientBrush),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Screen title
            Text(
                text = if (locale == "ar") "تسجيل QR" else "QR Check-In",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Main QR Card
            when (val loading = state.loading) {
                is LoadingState.Loading -> {
                    QrCodeLoadingSkeleton()
                }

                is LoadingState.Error -> {
                    QrCodeErrorState(
                        message = loading.message,
                        locale = locale,
                        onRetry = onRetry
                    )
                }

                is LoadingState.Success, LoadingState.Idle -> {
                    if (state.hasQrCode && !state.isExpired) {
                        QrCodeDisplay(
                            qrCodeData = state.qrCodeData!!,
                            memberName = state.memberName,
                            expiresAt = state.expiresAt!!,
                            isRefreshing = state.isRefreshing,
                            isExpiringSoon = state.isExpiringSoon,
                            locale = locale,
                            onRefresh = onRefresh
                        )
                    } else if (state.isExpired) {
                        QrCodeExpiredState(
                            locale = locale,
                            isRefreshing = state.isRefreshing,
                            onRefresh = onRefresh
                        )
                    } else {
                        QrCodeLoadingSkeleton()
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Check-in instructions
            CheckInInstructions(locale = locale)
        }
    }
}

/**
 * QR Code display with member name and countdown.
 */
@Composable
private fun QrCodeDisplay(
    qrCodeData: String,
    memberName: String,
    expiresAt: Instant,
    isRefreshing: Boolean,
    isExpiringSoon: Boolean,
    locale: String,
    onRefresh: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
        shape = RoundedCornerShape(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // QR Code Image
            Box(
                modifier = Modifier
                    .size(260.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White),
                contentAlignment = Alignment.Center
            ) {
                if (isRefreshing) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(48.dp),
                        color = MaterialTheme.colorScheme.primary
                    )
                } else {
                    QrCodeImage(
                        data = qrCodeData,
                        size = 250.dp,
                        contentDescription = if (locale == "ar") "رمز QR للتسجيل" else "QR Code for check-in"
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Member name
            if (memberName.isNotEmpty()) {
                Text(
                    text = memberName,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(8.dp))
            }

            // Countdown timer with warning if expiring soon
            ExpiryCountdown(
                expiresAt = expiresAt,
                isExpiringSoon = isExpiringSoon,
                locale = locale
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Refresh button
            IconButton(
                onClick = onRefresh,
                enabled = !isRefreshing,
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer)
            ) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = if (locale == "ar") "تحديث" else "Refresh",
                    tint = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
    }
}

/**
 * Live countdown timer showing time until QR code expires.
 */
@Composable
fun ExpiryCountdown(
    expiresAt: Instant,
    isExpiringSoon: Boolean = false,
    locale: String
) {
    var remainingSeconds by remember(expiresAt) {
        mutableLongStateOf(
            (expiresAt - Clock.System.now()).inWholeSeconds.coerceAtLeast(0)
        )
    }

    // Update countdown every second
    LaunchedEffect(expiresAt) {
        while (remainingSeconds > 0) {
            delay(1000)
            remainingSeconds = (expiresAt - Clock.System.now()).inWholeSeconds.coerceAtLeast(0)
        }
    }

    // Pulsing animation when expiring soon
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (isExpiringSoon) 0.5f else 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(500),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = if (locale == "ar") "صالح حتى" else "Valid until",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = formatCountdown(remainingSeconds),
            style = MaterialTheme.typography.headlineLarge.copy(
                fontWeight = FontWeight.Bold,
                fontSize = 36.sp
            ),
            color = if (isExpiringSoon) {
                MaterialTheme.colorScheme.error.copy(alpha = alpha)
            } else {
                MaterialTheme.colorScheme.primary
            }
        )

        AnimatedVisibility(
            visible = isExpiringSoon,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Text(
                text = if (locale == "ar") "ينتهي قريباً" else "Expiring soon",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error
            )
        }
    }
}

/**
 * Check-in instructions displayed below the QR code.
 */
@Composable
fun CheckInInstructions(locale: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color.White.copy(alpha = 0.15f)
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Default.QrCode2,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(32.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = if (locale == "ar") {
                    "أظهر رمز QR هذا في الاستقبال لتسجيل الدخول"
                } else {
                    "Show this QR code at the reception to check in"
                },
                style = MaterialTheme.typography.bodyLarge,
                color = Color.White,
                textAlign = TextAlign.Center
            )
        }
    }
}

/**
 * Loading skeleton for QR code.
 */
@Composable
private fun QrCodeLoadingSkeleton() {
    val infiniteTransition = rememberInfiniteTransition(label = "shimmer")
    val shimmerAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000),
            repeatMode = RepeatMode.Reverse
        ),
        label = "shimmer"
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
        shape = RoundedCornerShape(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // QR code placeholder
            Box(
                modifier = Modifier
                    .size(250.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.Gray.copy(alpha = shimmerAlpha)),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(
                    color = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Name placeholder
            Box(
                modifier = Modifier
                    .width(150.dp)
                    .height(24.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color.Gray.copy(alpha = shimmerAlpha))
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Timer placeholder
            Box(
                modifier = Modifier
                    .width(100.dp)
                    .height(40.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color.Gray.copy(alpha = shimmerAlpha))
            )
        }
    }
}

/**
 * Error state display for QR code loading failure.
 */
@Composable
private fun QrCodeErrorState(
    message: String,
    locale: String,
    onRetry: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
        shape = RoundedCornerShape(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error,
                modifier = Modifier.size(64.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = if (locale == "ar") "فشل تحميل رمز QR" else "Failed to load QR code",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = onRetry,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(text = if (locale == "ar") "إعادة المحاولة" else "Retry")
            }
        }
    }
}

/**
 * Expired QR code state with refresh option.
 */
@Composable
private fun QrCodeExpiredState(
    locale: String,
    isRefreshing: Boolean,
    onRefresh: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
        shape = RoundedCornerShape(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Default.QrCode2,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error,
                modifier = Modifier.size(64.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = if (locale == "ar") "انتهت صلاحية رمز QR" else "QR Code Expired",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.error
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = if (locale == "ar") {
                    "انقر على تحديث للحصول على رمز جديد"
                } else {
                    "Tap refresh to get a new code"
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = onRefresh,
                enabled = !isRefreshing,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                if (isRefreshing) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(text = if (locale == "ar") "تحديث رمز QR" else "Refresh QR Code")
            }
        }
    }
}
