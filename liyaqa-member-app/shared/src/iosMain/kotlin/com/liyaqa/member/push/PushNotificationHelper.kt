package com.liyaqa.member.push

import com.liyaqa.member.domain.model.DevicePlatform
import com.liyaqa.member.domain.repository.NotificationRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject

/**
 * Helper class for iOS push notification operations.
 * Callable from Swift via Kotlin/Native interop.
 */
object PushNotificationHelper : KoinComponent {

    private val notificationRepository: NotificationRepository by inject()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    /**
     * Register device token with backend.
     * Call this from AppDelegate when receiving APNs token.
     */
    fun registerDeviceToken(token: String) {
        scope.launch {
            notificationRepository.registerDeviceToken(token, DevicePlatform.IOS)
                .onSuccess {
                    println("Successfully registered APNs token with backend")
                }
                .onError { error ->
                    println("Failed to register APNs token: ${error.message}")
                }
        }
    }

    /**
     * Unregister device token from backend.
     * Call this on logout.
     */
    fun unregisterDeviceToken(token: String) {
        scope.launch {
            notificationRepository.unregisterDeviceToken(token)
                .onSuccess {
                    println("Successfully unregistered APNs token from backend")
                }
                .onError { error ->
                    println("Failed to unregister APNs token: ${error.message}")
                }
        }
    }
}

/**
 * Top-level function for easier Swift interop.
 * Registers the APNs device token with the backend.
 */
fun registerApnsToken(token: String) {
    PushNotificationHelper.registerDeviceToken(token)
}

/**
 * Top-level function for easier Swift interop.
 * Unregisters the APNs device token from the backend.
 */
fun unregisterApnsToken(token: String) {
    PushNotificationHelper.unregisterDeviceToken(token)
}
