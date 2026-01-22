import UIKit
import SwiftUI
import ComposeApp

/**
 * UIViewControllerRepresentable wrapper for Compose Multiplatform.
 *
 * This view bridges the SwiftUI view hierarchy with the Compose UI
 * hosted in a UIViewController. It handles the lifecycle of the
 * Compose view controller.
 *
 * Features:
 * - Wraps the Kotlin MainViewController
 * - Handles view controller lifecycle
 * - Supports appearance changes (dark/light mode)
 */
struct ComposeView: UIViewControllerRepresentable {

    /**
     * Creates the initial UIViewController for Compose content.
     *
     * Called once when the view is first displayed.
     *
     * - Parameter context: The context for the representable view
     * - Returns: The UIViewController hosting Compose UI
     */
    func makeUIViewController(context: Context) -> UIViewController {
        MainViewControllerKt.MainViewController()
    }

    /**
     * Updates the UIViewController when SwiftUI state changes.
     *
     * Currently no-op as Compose handles its own state updates.
     *
     * - Parameter uiViewController: The existing view controller
     * - Parameter context: The context for the representable view
     */
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {
        // Compose handles its own state updates via recomposition
    }
}

/**
 * Root content view for the iOS app.
 *
 * Embeds the Compose view and configures edge-to-edge display
 * with proper safe area handling.
 *
 * Safe Area Configuration:
 * - Ignores keyboard safe area to let Compose handle keyboard
 * - Ignores all edges to allow Compose to draw edge-to-edge
 * - Compose UI internally handles safe area insets via WindowInsets
 *
 * The background color is set to match the Compose theme's background
 * to prevent any flickering during app launch.
 */
struct ContentView: View {
    var body: some View {
        ZStack {
            // Background color matching Compose theme
            // Prevents white flash during app launch
            Color(UIColor.systemBackground)
                .ignoresSafeArea(.all)

            // Compose Multiplatform view
            ComposeView()
                // Ignore keyboard safe area - Compose handles this
                .ignoresSafeArea(.keyboard)
                // Ignore container safe area - Compose draws edge-to-edge
                // and handles insets via WindowInsets
                .ignoresSafeArea(.container, edges: .all)
        }
        // Prefer home indicator auto-hidden for immersive experience
        .persistentSystemOverlays(.hidden)
    }
}

// MARK: - Preview

#Preview {
    ContentView()
}
