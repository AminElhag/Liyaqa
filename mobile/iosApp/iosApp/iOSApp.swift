import SwiftUI
import ComposeApp

/**
 * Main entry point for the Liyaqa Member iOS app.
 *
 * Responsibilities:
 * - Initialize Koin dependency injection before the first view appears
 * - Handle deep links for payment callbacks
 * - Set up the root window with ComposeView
 *
 * Deep Link Schemes:
 * - liyaqa://payment/complete?status=success&invoiceId=xxx
 * - liyaqa://payment/complete?status=failed&invoiceId=xxx
 * - liyaqa://payment/complete?status=cancelled&invoiceId=xxx
 */
@main
struct iOSApp: App {

    /**
     * Initialize Koin during app startup.
     *
     * This must be called before any Compose content is rendered
     * to ensure all dependencies are available.
     */
    init() {
        // Initialize Koin dependency injection
        // This loads all shared modules + iOS platform module
        PlatformModule_iosKt.doInitKoin()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    // Handle deep links for payment callbacks
                    handleDeepLink(url)
                }
        }
    }

    /**
     * Handles incoming deep links.
     *
     * Delegates to Kotlin code for actual handling logic.
     *
     * - Parameter url: The incoming URL
     */
    private func handleDeepLink(_ url: URL) {
        let urlString = url.absoluteString
        let _ = MainViewControllerKt.handleDeepLink(urlString: urlString)
    }
}
