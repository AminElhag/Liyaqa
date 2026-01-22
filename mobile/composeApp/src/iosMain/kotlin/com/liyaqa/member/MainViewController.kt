package com.liyaqa.member

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.window.ComposeUIViewController
import com.liyaqa.member.stores.LocaleStore
import com.liyaqa.member.ui.theme.LiyaqaTheme
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import platform.UIKit.UIViewController

/**
 * iOS Main View Controller for the Liyaqa Member App.
 *
 * Creates a ComposeUIViewController that hosts the Compose Multiplatform UI.
 * Integrates with Koin for dependency injection and applies the Liyaqa theme.
 *
 * Features:
 * - Automatic dark/light theme based on system settings
 * - Bilingual support (EN/AR) with RTL layout for Arabic
 * - Integration with Koin DI for LocaleStore
 */
object MainViewControllerFactory : KoinComponent {
    private val localeStore: LocaleStore by inject()

    /**
     * Creates the main UIViewController for the iOS app.
     *
     * @return UIViewController hosting the Compose UI
     */
    fun create(): UIViewController = ComposeUIViewController {
        val locale by localeStore.locale.collectAsState()
        val darkTheme = isSystemInDarkTheme()

        LiyaqaTheme(
            darkTheme = darkTheme,
            locale = locale
        ) {
            App()
        }
    }
}

/**
 * Entry point function called from Swift to create the main view controller.
 *
 * Usage in Swift:
 * ```swift
 * import ComposeApp
 *
 * struct ComposeView: UIViewControllerRepresentable {
 *     func makeUIViewController(context: Context) -> UIViewController {
 *         MainViewControllerKt.MainViewController()
 *     }
 * }
 * ```
 */
fun MainViewController(): UIViewController = MainViewControllerFactory.create()

/**
 * Deep link handler for iOS.
 *
 * Call this from Swift when a deep link is received.
 *
 * Supported deep links:
 * - liyaqa://payment/complete?status=success&invoiceId=xxx
 * - liyaqa://payment/complete?status=failed&invoiceId=xxx
 * - liyaqa://payment/complete?status=cancelled&invoiceId=xxx
 *
 * Usage in Swift:
 * ```swift
 * .onOpenURL { url in
 *     MainViewControllerKt.handleDeepLink(urlString: url.absoluteString)
 * }
 * ```
 *
 * @param urlString The deep link URL as a string
 * @return true if the deep link was handled, false otherwise
 */
fun handleDeepLink(urlString: String): Boolean {
    // Parse the URL
    val components = urlString.split("://", "?", "&")
    if (components.isEmpty()) return false

    val scheme = components.getOrNull(0) ?: return false
    val pathAndHost = components.getOrNull(1) ?: return false

    // Handle liyaqa:// scheme
    if (scheme == "liyaqa") {
        val parts = pathAndHost.split("/")
        val host = parts.getOrNull(0)
        val path = parts.getOrNull(1)

        if (host == "payment" && path == "complete") {
            // Parse query parameters
            val queryParams = mutableMapOf<String, String>()
            for (i in 2 until components.size) {
                val param = components[i].split("=")
                if (param.size == 2) {
                    queryParams[param[0]] = param[1]
                }
            }

            val status = queryParams["status"]
            val invoiceId = queryParams["invoiceId"]
            val transactionRef = queryParams["transactionRef"]

            // Log for debugging
            println("Payment callback received: status=$status, invoiceId=$invoiceId, ref=$transactionRef")

            // TODO: Navigate to PaymentCompleteScreen with these parameters
            // This will be handled by the navigation system once it supports deep links
            return true
        }
    }

    println("Unknown deep link: $urlString")
    return false
}
