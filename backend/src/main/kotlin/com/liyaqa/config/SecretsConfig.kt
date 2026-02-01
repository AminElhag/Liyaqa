package com.liyaqa.config

import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest

/**
 * AWS Secrets Manager Configuration
 *
 * This configuration provides secure secrets management for production environments.
 * Secrets are loaded from AWS Secrets Manager instead of environment variables.
 *
 * **Usage:**
 * - Enable by setting `aws.secrets.enabled=true` in application.yml
 * - Configure AWS region via `aws.region` property or AWS_REGION env var
 * - Ensure IAM role has `secretsmanager:GetSecretValue` permission
 *
 * **Local Development:**
 * - Disabled by default (falls back to environment variables)
 * - Set `aws.secrets.enabled=false` or omit the property
 */
@Configuration
@ConditionalOnProperty(name = ["aws.secrets.enabled"], havingValue = "true", matchIfMissing = false)
class SecretsConfig {

    private val logger = LoggerFactory.getLogger(SecretsConfig::class.java)

    @Bean
    fun secretsManagerClient(): SecretsManagerClient {
        val region = System.getenv("AWS_REGION") ?: "me-south-1"
        logger.info("Initializing AWS Secrets Manager client for region: $region")

        return SecretsManagerClient.builder()
            .region(Region.of(region))
            .build()
    }

    /**
     * Retrieves a secret value from AWS Secrets Manager
     *
     * @param secretName The name/ARN of the secret in AWS Secrets Manager
     * @return The secret value as a string
     * @throws software.amazon.awssdk.services.secretsmanager.model.ResourceNotFoundException if secret doesn't exist
     */
    fun getSecret(secretsManager: SecretsManagerClient, secretName: String): String {
        logger.debug("Retrieving secret: $secretName")

        val request = GetSecretValueRequest.builder()
            .secretId(secretName)
            .build()

        val response = secretsManager.getSecretValue(request)
        return response.secretString()
    }
}

/**
 * Secrets Manager Service
 *
 * Provides a convenient interface for retrieving secrets from AWS Secrets Manager
 * with fallback to environment variables for local development.
 */
@org.springframework.stereotype.Service
@ConditionalOnProperty(name = ["aws.secrets.enabled"], havingValue = "true", matchIfMissing = false)
class SecretsManagerService(
    private val secretsManagerClient: SecretsManagerClient
) {
    private val logger = LoggerFactory.getLogger(SecretsManagerService::class.java)

    /**
     * Gets a secret from AWS Secrets Manager with optional fallback to environment variable
     *
     * @param secretName The AWS Secrets Manager secret name
     * @param envVarFallback Optional environment variable name to use as fallback
     * @return The secret value
     */
    fun getSecret(secretName: String, envVarFallback: String? = null): String {
        return try {
            val request = GetSecretValueRequest.builder()
                .secretId(secretName)
                .build()

            val response = secretsManagerClient.getSecretValue(request)
            logger.debug("Successfully retrieved secret: $secretName")
            response.secretString()
        } catch (e: Exception) {
            logger.error("Failed to retrieve secret $secretName from AWS Secrets Manager", e)

            // Fallback to environment variable if provided
            if (envVarFallback != null) {
                val envValue = System.getenv(envVarFallback)
                if (envValue != null) {
                    logger.warn("Using fallback environment variable $envVarFallback for secret $secretName")
                    return envValue
                }
            }

            throw IllegalStateException("Failed to retrieve secret $secretName and no fallback available", e)
        }
    }

    /**
     * Gets a secret from AWS Secrets Manager and parses it as JSON
     *
     * This is useful for secrets that contain multiple values stored as JSON.
     *
     * Example JSON secret:
     * ```json
     * {
     *   "username": "admin",
     *   "password": "secret123",
     *   "host": "db.example.com"
     * }
     * ```
     *
     * @param secretName The AWS Secrets Manager secret name
     * @return A map of key-value pairs from the JSON secret
     */
    fun getSecretAsJson(secretName: String): Map<String, String> {
        val secretJson = getSecret(secretName)
        return parseJsonSecret(secretJson)
    }

    private fun parseJsonSecret(json: String): Map<String, String> {
        // Simple JSON parsing - for production, consider using Jackson or Gson
        val result = mutableMapOf<String, String>()

        val trimmed = json.trim().removeSurrounding("{", "}")
        trimmed.split(",").forEach { pair ->
            val parts = pair.split(":", limit = 2)
            if (parts.size == 2) {
                val key = parts[0].trim().removeSurrounding("\"")
                val value = parts[1].trim().removeSurrounding("\"")
                result[key] = value
            }
        }

        return result
    }
}

/**
 * Example usage in application configuration:
 *
 * ```kotlin
 * @Configuration
 * class DatabaseConfig(
 *     @Value("\${aws.secrets.database-secret-name:liyaqa/prod/database}")
 *     private val databaseSecretName: String,
 *     private val secretsService: SecretsManagerService?
 * ) {
 *     @Bean
 *     fun dataSource(): DataSource {
 *         val dbConfig = if (secretsService != null) {
 *             secretsService.getSecretAsJson(databaseSecretName)
 *         } else {
 *             // Fallback to environment variables for local development
 *             mapOf(
 *                 "host" to System.getenv("DB_HOST"),
 *                 "username" to System.getenv("DB_USERNAME"),
 *                 "password" to System.getenv("DB_PASSWORD")
 *             )
 *         }
 *
 *         return HikariDataSource().apply {
 *             jdbcUrl = "jdbc:postgresql://${dbConfig["host"]}/liyaqa"
 *             username = dbConfig["username"]
 *             password = dbConfig["password"]
 *         }
 *     }
 * }
 * ```
 */
