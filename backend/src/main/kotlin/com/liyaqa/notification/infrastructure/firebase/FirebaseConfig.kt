package com.liyaqa.notification.infrastructure.firebase

import com.google.auth.oauth2.GoogleCredentials
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.messaging.FirebaseMessaging
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.io.FileInputStream
import java.io.InputStream
import jakarta.annotation.PostConstruct

@Configuration
@ConditionalOnProperty(name = ["liyaqa.firebase.enabled"], havingValue = "true")
class FirebaseConfig {

    private val logger = LoggerFactory.getLogger(FirebaseConfig::class.java)

    @Value("\${liyaqa.firebase.service-account-path:}")
    private lateinit var serviceAccountPath: String

    @Value("\${liyaqa.firebase.service-account-json:}")
    private lateinit var serviceAccountJson: String

    @PostConstruct
    fun initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                val credentials = getCredentials()
                val options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build()

                FirebaseApp.initializeApp(options)
                logger.info("Firebase Admin SDK initialized successfully")
            } else {
                logger.info("Firebase Admin SDK already initialized")
            }
        } catch (e: Exception) {
            logger.error("Failed to initialize Firebase Admin SDK: ${e.message}", e)
            throw IllegalStateException("Firebase initialization failed", e)
        }
    }

    private fun getCredentials(): GoogleCredentials {
        // First, try to load from JSON string (useful for containerized deployments)
        if (serviceAccountJson.isNotBlank()) {
            logger.info("Loading Firebase credentials from JSON string")
            return GoogleCredentials.fromStream(serviceAccountJson.byteInputStream())
        }

        // Second, try to load from file path
        if (serviceAccountPath.isNotBlank()) {
            logger.info("Loading Firebase credentials from file: $serviceAccountPath")
            return GoogleCredentials.fromStream(FileInputStream(serviceAccountPath))
        }

        // Third, try default credentials (useful for GCP environments)
        logger.info("Loading Firebase credentials from default application credentials")
        return GoogleCredentials.getApplicationDefault()
    }

    @Bean
    fun firebaseMessaging(): FirebaseMessaging {
        return FirebaseMessaging.getInstance()
    }
}
