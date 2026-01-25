package com.liyaqa.member.android.push

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.liyaqa.member.android.MainActivity
import com.liyaqa.member.android.R
import com.liyaqa.member.domain.model.DevicePlatform
import com.liyaqa.member.domain.repository.NotificationRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.koin.android.ext.android.inject

class LiyaqaFirebaseMessagingService : FirebaseMessagingService() {

    private val notificationRepository: NotificationRepository by inject()
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        super.onNewToken(token)

        // Store token locally
        saveTokenLocally(token)

        // Register token with backend with retry logic
        serviceScope.launch {
            registerTokenWithRetry(token)
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        // Create notification channel for Android O+
        createNotificationChannel()

        // Handle data payload
        val data = remoteMessage.data

        // Support bilingual content - prefer localized content based on device locale
        val deviceLocale = resources.configuration.locales[0].language
        val title = if (deviceLocale == "ar") {
            data["title_ar"] ?: data["title"] ?: remoteMessage.notification?.title ?: "Liyaqa"
        } else {
            data["title_en"] ?: data["title"] ?: remoteMessage.notification?.title ?: "Liyaqa"
        }

        val body = if (deviceLocale == "ar") {
            data["body_ar"] ?: data["body"] ?: remoteMessage.notification?.body ?: ""
        } else {
            data["body_en"] ?: data["body"] ?: remoteMessage.notification?.body ?: ""
        }

        val type = data["type"]
        val actionUrl = data["actionUrl"]

        // Build notification
        showNotification(title, body, type, actionUrl)
    }

    private fun saveTokenLocally(token: String) {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(KEY_FCM_TOKEN, token)
            .putLong(KEY_TOKEN_TIMESTAMP, System.currentTimeMillis())
            .apply()
    }

    private fun getLocalToken(): String? {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_FCM_TOKEN, null)
    }

    private fun markTokenAsRegistered() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean(KEY_TOKEN_REGISTERED, true)
            .putLong(KEY_REGISTRATION_TIMESTAMP, System.currentTimeMillis())
            .apply()
    }

    private fun isTokenRegistered(): Boolean {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(KEY_TOKEN_REGISTERED, false)
    }

    private suspend fun registerTokenWithRetry(token: String, maxRetries: Int = 3) {
        var attempt = 0
        var lastException: Exception? = null

        while (attempt < maxRetries) {
            try {
                notificationRepository.registerDeviceToken(token, DevicePlatform.ANDROID)
                markTokenAsRegistered()
                return
            } catch (e: Exception) {
                lastException = e
                attempt++
                if (attempt < maxRetries) {
                    // Exponential backoff: 2s, 4s, 8s
                    delay(2000L * (1 shl attempt))
                }
            }
        }

        // Log final failure but don't crash - token will be retried on next app launch
        android.util.Log.e(TAG, "Failed to register FCM token after $maxRetries attempts", lastException)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Liyaqa Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifications from Liyaqa Member App"
                enableVibration(true)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun showNotification(
        title: String,
        body: String,
        type: String?,
        actionUrl: String?
    ) {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            type?.let { putExtra("notification_type", it) }
            actionUrl?.let { putExtra("action_url", it) }
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .build()

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    companion object {
        private const val TAG = "LiyaqaFCM"
        private const val CHANNEL_ID = "liyaqa_notifications"
        private const val PREFS_NAME = "liyaqa_fcm_prefs"
        private const val KEY_FCM_TOKEN = "fcm_token"
        private const val KEY_TOKEN_TIMESTAMP = "token_timestamp"
        private const val KEY_TOKEN_REGISTERED = "token_registered"
        private const val KEY_REGISTRATION_TIMESTAMP = "registration_timestamp"

        /**
         * Check if FCM token needs to be re-registered.
         * Call this on app launch to ensure token is always registered.
         */
        fun ensureTokenRegistered(context: Context, notificationRepository: NotificationRepository) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val token = prefs.getString(KEY_FCM_TOKEN, null)
            val isRegistered = prefs.getBoolean(KEY_TOKEN_REGISTERED, false)

            if (token != null && !isRegistered) {
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        notificationRepository.registerDeviceToken(token, DevicePlatform.ANDROID)
                        prefs.edit()
                            .putBoolean(KEY_TOKEN_REGISTERED, true)
                            .putLong(KEY_REGISTRATION_TIMESTAMP, System.currentTimeMillis())
                            .apply()
                    } catch (e: Exception) {
                        android.util.Log.e(TAG, "Failed to register cached FCM token", e)
                    }
                }
            }
        }
    }
}
