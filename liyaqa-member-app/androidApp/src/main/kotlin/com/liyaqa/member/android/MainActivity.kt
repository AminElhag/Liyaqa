package com.liyaqa.member.android

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.liyaqa.member.domain.model.AuthState
import com.liyaqa.member.domain.repository.AuthRepository
import com.liyaqa.member.presentation.navigation.AppNavigation
import com.liyaqa.member.presentation.theme.LiyaqaTheme
import org.koin.android.ext.android.inject

class MainActivity : ComponentActivity() {

    private val authRepository: AuthRepository by inject()

    // Deep link data from notification
    private var pendingNotificationType: String? = null
    private var pendingActionUrl: String? = null

    // Permission launcher for Android 13+ notifications
    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            // Permission granted, notifications will work
        } else {
            // Permission denied - user won't receive push notifications
            // We could show a rationale dialog here if needed
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Request notification permission for Android 13+
        requestNotificationPermission()

        // Handle notification intent if app was launched from notification
        handleNotificationIntent(intent)

        setContent {
            LiyaqaMemberAppContent(
                authRepository = authRepository,
                initialNotificationType = pendingNotificationType,
                initialActionUrl = pendingActionUrl,
                onDeepLinkHandled = {
                    pendingNotificationType = null
                    pendingActionUrl = null
                }
            )
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleNotificationIntent(intent)
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            when {
                ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED -> {
                    // Permission already granted
                }
                shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS) -> {
                    // Show rationale if needed, then request
                    notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
                else -> {
                    // Request permission
                    notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
        }
    }

    private fun handleNotificationIntent(intent: Intent?) {
        intent?.let {
            pendingNotificationType = it.getStringExtra("notification_type")
            pendingActionUrl = it.getStringExtra("action_url")

            // Clear the extras to prevent re-handling
            it.removeExtra("notification_type")
            it.removeExtra("action_url")
        }
    }
}

@Composable
private fun LiyaqaMemberAppContent(
    authRepository: AuthRepository,
    initialNotificationType: String?,
    initialActionUrl: String?,
    onDeepLinkHandled: () -> Unit
) {
    val authState by authRepository.authState.collectAsState(initial = AuthState.Loading)
    var isArabic by remember { mutableStateOf(false) } // TODO: Load from preferences
    var deepLinkRoute by remember { mutableStateOf<String?>(null) }

    // Initialize auth state
    LaunchedEffect(Unit) {
        (authRepository as? com.liyaqa.member.data.repository.AuthRepositoryImpl)?.initializeAuthState()
    }

    // Handle deep link from notification
    LaunchedEffect(initialActionUrl, initialNotificationType) {
        if (initialActionUrl != null || initialNotificationType != null) {
            deepLinkRoute = parseDeepLink(initialActionUrl, initialNotificationType)
            onDeepLinkHandled()
        }
    }

    LiyaqaTheme(
        darkTheme = isSystemInDarkTheme(),
        isArabic = isArabic
    ) {
        Surface(modifier = Modifier.fillMaxSize()) {
            when (authState) {
                is AuthState.Loading -> {
                    // Show splash or loading
                    com.liyaqa.member.presentation.components.LoadingView()
                }
                is AuthState.Authenticated -> {
                    AppNavigation(
                        isAuthenticated = true,
                        initialRoute = deepLinkRoute
                    )
                }
                is AuthState.Unauthenticated, is AuthState.Error -> {
                    AppNavigation(
                        isAuthenticated = false,
                        initialRoute = null // Can't deep link without auth
                    )
                }
            }
        }
    }

    // Clear deep link after navigation
    LaunchedEffect(deepLinkRoute) {
        if (deepLinkRoute != null) {
            // Give time for navigation, then clear
            kotlinx.coroutines.delay(500)
            deepLinkRoute = null
        }
    }
}

/**
 * Parses the deep link from notification data and returns the navigation route.
 */
private fun parseDeepLink(actionUrl: String?, notificationType: String?): String? {
    // First try actionUrl (more specific)
    actionUrl?.let { url ->
        return when {
            url.contains("/bookings/") -> "bookings/${url.substringAfterLast("/")}"
            url.contains("/subscriptions") -> "subscriptions"
            url.contains("/invoices/") -> "invoices/${url.substringAfterLast("/")}"
            url.contains("/profile") -> "profile"
            url.contains("/schedule") -> "schedule"
            url.contains("/classes/") -> "classes/${url.substringAfterLast("/")}"
            url.contains("/wallet") -> "wallet"
            else -> null
        }
    }

    // Fall back to notification type
    return when (notificationType) {
        "BOOKING_CONFIRMED", "BOOKING_CANCELLED", "CLASS_REMINDER" -> "bookings"
        "SUBSCRIPTION_EXPIRING", "SUBSCRIPTION_EXPIRED", "SUBSCRIPTION_RENEWED" -> "subscriptions"
        "INVOICE_CREATED", "PAYMENT_RECEIVED", "PAYMENT_FAILED" -> "invoices"
        "ATTENDANCE_CHECKED_IN" -> "attendance"
        "WALLET_CREDITED", "WALLET_DEBITED" -> "wallet"
        else -> null
    }
}
