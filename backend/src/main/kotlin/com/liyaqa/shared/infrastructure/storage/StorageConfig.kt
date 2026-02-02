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
     * Storage type: "local", "s3", or "minio".
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

/**
 * AWS S3 storage configuration.
 */
@Configuration
@ConfigurationProperties(prefix = "liyaqa.storage.s3")
class S3StorageConfig {
    /**
     * S3 bucket name.
     */
    var bucket: String = ""

    /**
     * AWS region (e.g., "us-east-1").
     */
    var region: String = "us-east-1"
}

/**
 * MinIO storage configuration.
 */
@Configuration
@ConfigurationProperties(prefix = "liyaqa.storage.minio")
class MinioStorageConfig {
    /**
     * MinIO endpoint URL (e.g., "https://minio.example.com").
     */
    var endpoint: String = ""

    /**
     * MinIO access key.
     */
    var accessKey: String = ""

    /**
     * MinIO secret key.
     */
    var secretKey: String = ""

    /**
     * MinIO bucket name.
     */
    var bucket: String = ""
}
