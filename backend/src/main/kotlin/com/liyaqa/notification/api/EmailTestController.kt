package com.liyaqa.notification.api

import com.liyaqa.notification.domain.ports.EmailService
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Controller for testing email functionality
 * Should be secured and only accessible to administrators
 */
@RestController
@RequestMapping("/api/admin/test/email")
class EmailTestController(
    private val emailService: EmailService
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Send a test email
     */
    @PostMapping
    fun sendTestEmail(
        @RequestBody request: TestEmailRequest
    ): ResponseEntity<TestEmailResponse> {
        logger.info("Sending test email to: {}", request.to)

        return try {
            emailService.sendEmail(
                to = request.to,
                subject = request.subject,
                body = request.body,
                isHtml = request.isHtml
            )

            logger.info("Test email sent successfully to: {}", request.to)
            ResponseEntity.ok(
                TestEmailResponse(
                    success = true,
                    message = "Test email sent successfully to ${request.to}",
                    provider = emailService::class.simpleName ?: "Unknown"
                )
            )
        } catch (e: Exception) {
            logger.error("Failed to send test email to: {}", request.to, e)
            ResponseEntity.status(500).body(
                TestEmailResponse(
                    success = false,
                    message = "Failed to send test email: ${e.message}",
                    provider = emailService::class.simpleName ?: "Unknown",
                    error = e.message
                )
            )
        }
    }

    /**
     * Send a test email with attachments
     */
    @PostMapping("/with-attachments")
    fun sendTestEmailWithAttachments(
        @RequestBody request: TestEmailWithAttachmentsRequest
    ): ResponseEntity<TestEmailResponse> {
        logger.info("Sending test email with attachments to: {}", request.to)

        return try {
            val attachments = request.attachments.map {
                com.liyaqa.notification.domain.ports.EmailAttachment(
                    filename = it.filename,
                    content = java.util.Base64.getDecoder().decode(it.contentBase64),
                    contentType = it.contentType
                )
            }

            emailService.sendEmailWithAttachments(
                to = request.to,
                subject = request.subject,
                body = request.body,
                attachments = attachments,
                isHtml = request.isHtml
            )

            logger.info("Test email with attachments sent successfully to: {}", request.to)
            ResponseEntity.ok(
                TestEmailResponse(
                    success = true,
                    message = "Test email with ${attachments.size} attachment(s) sent successfully",
                    provider = emailService::class.simpleName ?: "Unknown"
                )
            )
        } catch (e: Exception) {
            logger.error("Failed to send test email with attachments to: {}", request.to, e)
            ResponseEntity.status(500).body(
                TestEmailResponse(
                    success = false,
                    message = "Failed to send test email with attachments: ${e.message}",
                    provider = emailService::class.simpleName ?: "Unknown",
                    error = e.message
                )
            )
        }
    }

    /**
     * Check email service configuration
     */
    @GetMapping("/status")
    fun checkEmailStatus(): ResponseEntity<EmailStatusResponse> {
        val isConfigured = emailService.isConfigured()
        val providerName = emailService::class.simpleName ?: "Unknown"

        return ResponseEntity.ok(
            EmailStatusResponse(
                configured = isConfigured,
                provider = providerName,
                message = if (isConfigured) {
                    "Email service is configured and ready ($providerName)"
                } else {
                    "Email service is not properly configured"
                }
            )
        )
    }
}

/**
 * Request for sending test email
 */
data class TestEmailRequest(
    val to: String,
    val subject: String = "Test Email from Liyaqa",
    val body: String = "This is a test email to verify the email service configuration.",
    val isHtml: Boolean = false
)

/**
 * Request for sending test email with attachments
 */
data class TestEmailWithAttachmentsRequest(
    val to: String,
    val subject: String = "Test Email with Attachments from Liyaqa",
    val body: String = "This is a test email with attachments.",
    val attachments: List<AttachmentData>,
    val isHtml: Boolean = false
)

/**
 * Attachment data
 */
data class AttachmentData(
    val filename: String,
    val contentBase64: String,
    val contentType: String = "application/octet-stream"
)

/**
 * Response for test email
 */
data class TestEmailResponse(
    val success: Boolean,
    val message: String,
    val provider: String,
    val error: String? = null
)

/**
 * Response for email status check
 */
data class EmailStatusResponse(
    val configured: Boolean,
    val provider: String,
    val message: String
)
