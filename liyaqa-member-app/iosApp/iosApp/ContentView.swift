import SwiftUI
import Shared

struct ContentView: View {
    @EnvironmentObject var deepLinkCoordinator: DeepLinkCoordinator

    var body: some View {
        ComposeView(initialRoute: buildRouteString())
            .id(deepLinkCoordinator.pendingDeepLink)
            .ignoresSafeArea(.keyboard)
            .onChange(of: deepLinkCoordinator.pendingDeepLink) { _, _ in
                // Clear the deep link after it's been consumed
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    deepLinkCoordinator.clearDeepLink()
                }
            }
    }

    private func buildRouteString() -> String? {
        guard let deepLink = deepLinkCoordinator.pendingDeepLink else {
            return nil
        }

        // Build route string from deep link (e.g., "invoices/123")
        if let id = deepLink.params["id"], !id.isEmpty {
            return "\(deepLink.route)/\(id)"
        }
        return deepLink.route
    }
}

struct ComposeView: UIViewControllerRepresentable {
    let initialRoute: String?

    func makeUIViewController(context: Context) -> UIViewController {
        MainViewControllerKt.MainViewController(initialRoute: initialRoute)
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {
    }
}

#Preview {
    ContentView()
        .environmentObject(DeepLinkCoordinator())
}
