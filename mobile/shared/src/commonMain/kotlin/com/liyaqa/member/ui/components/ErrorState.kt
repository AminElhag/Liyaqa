package com.liyaqa.member.ui.components

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
import androidx.compose.material.icons.outlined.CloudOff
import androidx.compose.material.icons.outlined.Error
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.SearchOff
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.liyaqa.member.ui.theme.LocalAppLocale

/**
 * Generic error state component with icon, message and retry button.
 */
@Composable
fun ErrorState(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector = Icons.Outlined.Error,
    title: String? = null,
    retryButtonText: String? = null
) {
    val locale = LocalAppLocale.current
    val defaultTitle = if (locale == "ar") "حدث خطأ ما" else "Something went wrong"
    val defaultRetryText = if (locale == "ar") "إعادة المحاولة" else "Retry"

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.error
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = title ?: defaultTitle,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(24.dp))

            Button(onClick = onRetry) {
                Text(text = retryButtonText ?: defaultRetryText)
            }
        }
    }
}

/**
 * Inline error message for use within cards or sections.
 */
@Composable
fun InlineError(
    message: String,
    modifier: Modifier = Modifier,
    onRetry: (() -> Unit)? = null
) {
    val locale = LocalAppLocale.current
    val retryText = if (locale == "ar") "إعادة المحاولة" else "Retry"

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Outlined.Error,
            contentDescription = null,
            modifier = Modifier.size(32.dp),
            tint = MaterialTheme.colorScheme.error
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = message,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.error,
            textAlign = TextAlign.Center
        )

        onRetry?.let { onClick ->
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedButton(onClick = onClick) {
                Text(text = retryText, style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}

// ============================================
// Pre-built Error State Variants
// ============================================

/**
 * Network error state with offline icon.
 */
@Composable
fun NetworkError(
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val title = if (locale == "ar") "خطأ في الشبكة" else "Network Error"
    val message = if (locale == "ar")
        "يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى"
    else
        "Please check your internet connection and try again"

    ErrorState(
        icon = Icons.Outlined.CloudOff,
        title = title,
        message = message,
        onRetry = onRetry,
        modifier = modifier
    )
}

/**
 * Unauthorized error state.
 */
@Composable
fun UnauthorizedError(
    onLogin: () -> Unit,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val title = if (locale == "ar") "انتهت الجلسة" else "Session Expired"
    val message = if (locale == "ar")
        "يرجى تسجيل الدخول مرة أخرى للمتابعة"
    else
        "Please login again to continue"
    val buttonText = if (locale == "ar") "تسجيل الدخول" else "Login"

    ErrorState(
        icon = Icons.Outlined.Lock,
        title = title,
        message = message,
        onRetry = onLogin,
        retryButtonText = buttonText,
        modifier = modifier
    )
}

/**
 * Not found error state.
 */
@Composable
fun NotFoundError(
    onGoBack: () -> Unit,
    modifier: Modifier = Modifier,
    itemName: String? = null
) {
    val locale = LocalAppLocale.current
    val title = if (locale == "ar") "غير موجود" else "Not Found"
    val message = if (itemName != null) {
        if (locale == "ar") "لم نتمكن من العثور على $itemName" else "We couldn't find $itemName"
    } else {
        if (locale == "ar") "الصفحة المطلوبة غير موجودة" else "The requested page was not found"
    }
    val buttonText = if (locale == "ar") "رجوع" else "Go Back"

    ErrorState(
        icon = Icons.Outlined.SearchOff,
        title = title,
        message = message,
        onRetry = onGoBack,
        retryButtonText = buttonText,
        modifier = modifier
    )
}

/**
 * Server error state.
 */
@Composable
fun ServerError(
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val title = if (locale == "ar") "خطأ في الخادم" else "Server Error"
    val message = if (locale == "ar")
        "حدث خطأ في الخادم. يرجى المحاولة لاحقاً"
    else
        "Something went wrong on our end. Please try again later"

    ErrorState(
        icon = Icons.Outlined.Error,
        title = title,
        message = message,
        onRetry = onRetry,
        modifier = modifier
    )
}
