package com.liyaqa.member

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.liyaqa.member.stores.LocaleStore
import com.liyaqa.member.ui.theme.LiyaqaTheme
import org.koin.android.ext.android.inject

/**
 * Main Activity for the Liyaqa Member Android app.
 *
 * Features:
 * - Edge-to-edge display with proper system bar handling
 * - Dynamic system bar colors based on theme
 * - Deep link handling for payment callbacks
 * - RTL support for Arabic locale
 */
class MainActivity : ComponentActivity() {

    private val localeStore: LocaleStore by inject()

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install splash screen (must be before super.onCreate)
        installSplashScreen()

        super.onCreate(savedInstanceState)

        // Enable edge-to-edge display
        enableEdgeToEdge()

        setContent {
            val locale by localeStore.locale.collectAsState()
            val darkTheme = isSystemInDarkTheme()

            // Update system bars based on theme
            SystemBarsEffect(darkTheme = darkTheme)

            // Apply Liyaqa theme with current locale
            LiyaqaTheme(
                darkTheme = darkTheme,
                locale = locale
            ) {
                App()
            }
        }

        // Handle deep link if activity was started with one
        handleDeepLink(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Handle deep links when activity is already running
        handleDeepLink(intent)
    }

    /**
     * Handles deep links for payment callbacks and other navigation.
     *
     * Supported deep links:
     * - liyaqa://payment/complete?status=success&invoiceId=xxx
     * - liyaqa://payment/complete?status=failed&invoiceId=xxx
     * - liyaqa://payment/complete?status=cancelled&invoiceId=xxx
     */
    private fun handleDeepLink(intent: Intent?) {
        val uri = intent?.data ?: return

        when {
            // Payment callback deep link
            uri.host == "payment" && uri.path == "/complete" -> {
                val status = uri.getQueryParameter("status")
                val invoiceId = uri.getQueryParameter("invoiceId")
                val transactionRef = uri.getQueryParameter("transactionRef")

                // Log for debugging
                println("Payment callback received: status=$status, invoiceId=$invoiceId, ref=$transactionRef")

                // TODO: Navigate to PaymentCompleteScreen with these parameters
                // This will be handled by the navigation system once it supports deep links
            }

            // Add other deep link handlers here as needed
            else -> {
                println("Unknown deep link: $uri")
            }
        }
    }

    /**
     * Composable effect that updates system bar styles based on theme.
     */
    @Composable
    private fun SystemBarsEffect(darkTheme: Boolean) {
        DisposableEffect(darkTheme) {
            enableEdgeToEdge(
                statusBarStyle = SystemBarStyle.auto(
                    lightScrim = Color.TRANSPARENT,
                    darkScrim = Color.TRANSPARENT
                ) { darkTheme },
                navigationBarStyle = SystemBarStyle.auto(
                    lightScrim = LightNavigationBarScrim,
                    darkScrim = DarkNavigationBarScrim
                ) { darkTheme }
            )
            onDispose {}
        }
    }

    companion object {
        /**
         * Navigation bar scrim for light theme.
         * Semi-transparent white to ensure visibility of gesture indicator.
         */
        private val LightNavigationBarScrim = Color.argb(0xe6, 0xFF, 0xFF, 0xFF)

        /**
         * Navigation bar scrim for dark theme.
         * Semi-transparent black to ensure visibility of gesture indicator.
         */
        private val DarkNavigationBarScrim = Color.argb(0x80, 0x1b, 0x1b, 0x1b)
    }
}
