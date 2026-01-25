import SwiftUI
import Shared
import UserNotifications

@main
struct iOSApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate

    init() {
        // Initialize Koin
        KoinHelperKt.doInitKoin()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(delegate.deepLinkCoordinator)
        }
    }
}

// Deep link coordinator for handling notification navigation
class DeepLinkCoordinator: ObservableObject {
    @Published var pendingDeepLink: DeepLink?

    struct DeepLink: Equatable {
        let route: String
        let params: [String: String]
    }

    func handleDeepLink(actionUrl: String?, notificationType: String?) {
        guard let route = parseDeepLink(actionUrl: actionUrl, notificationType: notificationType) else {
            return
        }
        pendingDeepLink = route
    }

    func clearDeepLink() {
        pendingDeepLink = nil
    }

    private func parseDeepLink(actionUrl: String?, notificationType: String?) -> DeepLink? {
        // First try actionUrl (more specific)
        if let url = actionUrl {
            if url.contains("/bookings/") {
                let id = url.components(separatedBy: "/").last ?? ""
                return DeepLink(route: "bookings", params: ["id": id])
            } else if url.contains("/subscriptions") {
                return DeepLink(route: "subscriptions", params: [:])
            } else if url.contains("/invoices/") {
                let id = url.components(separatedBy: "/").last ?? ""
                return DeepLink(route: "invoices", params: ["id": id])
            } else if url.contains("/profile") {
                return DeepLink(route: "profile", params: [:])
            } else if url.contains("/schedule") {
                return DeepLink(route: "schedule", params: [:])
            } else if url.contains("/classes/") {
                let id = url.components(separatedBy: "/").last ?? ""
                return DeepLink(route: "classes", params: ["id": id])
            } else if url.contains("/wallet") {
                return DeepLink(route: "wallet", params: [:])
            }
        }

        // Fall back to notification type
        if let type = notificationType {
            switch type {
            case "BOOKING_CONFIRMED", "BOOKING_CANCELLED", "CLASS_REMINDER":
                return DeepLink(route: "bookings", params: [:])
            case "SUBSCRIPTION_EXPIRING", "SUBSCRIPTION_EXPIRED", "SUBSCRIPTION_RENEWED":
                return DeepLink(route: "subscriptions", params: [:])
            case "INVOICE_CREATED", "PAYMENT_RECEIVED", "PAYMENT_FAILED":
                return DeepLink(route: "invoices", params: [:])
            case "ATTENDANCE_CHECKED_IN":
                return DeepLink(route: "attendance", params: [:])
            case "WALLET_CREDITED", "WALLET_DEBITED":
                return DeepLink(route: "wallet", params: [:])
            default:
                return nil
            }
        }

        return nil
    }
}

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    let deepLinkCoordinator = DeepLinkCoordinator()

    // Store device token for potential re-registration
    private var cachedDeviceToken: String?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Request notification permissions
        UNUserNotificationCenter.current().delegate = self
        requestNotificationPermission()

        // Check if launched from notification
        if let notificationPayload = launchOptions?[.remoteNotification] as? [String: Any] {
            handleNotificationPayload(notificationPayload)
        }

        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("APNs Device Token: \(token)")

        // Cache the token locally
        cachedDeviceToken = token
        UserDefaults.standard.set(token, forKey: "apns_device_token")
        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: "apns_token_timestamp")

        // Register token with backend
        registerTokenWithRetry(token: token)
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("Failed to register for remote notifications: \(error)")
    }

    // Handle notification when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }

    // Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        handleNotificationPayload(userInfo)
        completionHandler()
    }

    private func handleNotificationPayload(_ userInfo: [AnyHashable: Any]) {
        let actionUrl = userInfo["actionUrl"] as? String
        let notificationType = userInfo["type"] as? String

        DispatchQueue.main.async {
            self.deepLinkCoordinator.handleDeepLink(
                actionUrl: actionUrl,
                notificationType: notificationType
            )
        }
    }

    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .badge, .sound]
        ) { granted, error in
            if let error = error {
                print("Notification permission error: \(error)")
                return
            }

            if granted {
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            } else {
                print("Notification permission denied")
            }
        }
    }

    private func registerTokenWithRetry(token: String, attempt: Int = 0, maxRetries: Int = 3) {
        // Register token with backend (fire-and-forget, logging happens in Kotlin)
        PushNotificationHelperKt.registerApnsToken(token: token)

        // Mark as registered - the actual registration happens asynchronously in Kotlin
        // If it fails, it will be logged and can be retried on next app launch
        UserDefaults.standard.set(true, forKey: "apns_token_registered")
        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: "apns_registration_timestamp")
        print("APNs token registration requested")
    }

    // Call this on app launch to ensure token is registered
    func ensureTokenRegistered() {
        guard let token = UserDefaults.standard.string(forKey: "apns_device_token") else {
            return
        }

        let isRegistered = UserDefaults.standard.bool(forKey: "apns_token_registered")
        if !isRegistered {
            registerTokenWithRetry(token: token)
        }
    }
}
