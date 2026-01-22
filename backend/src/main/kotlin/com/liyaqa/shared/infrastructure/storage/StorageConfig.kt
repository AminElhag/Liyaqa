package com.liyaqa.shared.infrastructure.storage

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

/**
 * Configuration properties for file storage.
 */
@Configuration
@ConfigurationProperties(prefix = "liyaqa.storage")
class StorageConfig {
    /**
     * Storage type: "local" or "s3" (s3 for future implementation).
     */
    var type: String = "local"

    /**
     * Local storage configuration.
     */
    var local: LocalStorageConfig = LocalStorageConfig()

    /**
     * Maximum file size in bytes (default 10MB).
     */
    var maxFileSize: Long = 10 * 1024 * 1024

    /**
     * Allowed MIME types for upload.
     */
    var allowedTypes: List<String> = listOf(
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf"
    )

    /**
     * Checks if a MIME type is allowed.
     */
    fun isAllowedType(mimeType: String): Boolean {
        return allowedTypes.any { it.equals(mimeType, ignoreCase = true) }
    }
}

class LocalStorageConfig {
    /**
     * Base directory for file uploads.
     */
    var uploadDir: String = "./uploads"
}
