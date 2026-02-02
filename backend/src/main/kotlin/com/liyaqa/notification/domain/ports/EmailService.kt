package com.liyaqa.notification.domain.ports

/**
 * Service interface for sending emails
 */
interface EmailService {
    /**
     * Send a simple text email
     *
     * @param to Recipient email address
     * @param subject Email subject
     * @param body Email body (plain text or HTML)
     * @param isHtml Whether the body is HTML (default: true)
     */
    fun sendEmail(
        to: String,
        subject: String,
        body: String,
        isHtml: Boolean = true
    )

    /**
     * Send email with multiple recipients
     *
     * @param to List of recipient email addresses
     * @param subject Email subject
     * @param body Email body (plain text or HTML)
     * @param isHtml Whether the body is HTML (default: true)
     */
    fun sendEmail(
        to: List<String>,
        subject: String,
        body: String,
        isHtml: Boolean = true
    )

    /**
     * Send email with CC and BCC
     *
     * @param to Primary recipient email address
     * @param cc Carbon copy recipients (optional)
     * @param bcc Blind carbon copy recipients (optional)
     * @param subject Email subject
     * @param body Email body (plain text or HTML)
     * @param isHtml Whether the body is HTML (default: true)
     */
    fun sendEmail(
        to: String,
        cc: List<String>? = null,
        bcc: List<String>? = null,
        subject: String,
        body: String,
        isHtml: Boolean = true
    )

    /**
     * Send email with attachments
     *
     * @param to Recipient email address
     * @param subject Email subject
     * @param body Email body (plain text or HTML)
     * @param attachments List of attachments
     * @param isHtml Whether the body is HTML (default: true)
     */
    fun sendEmailWithAttachments(
        to: String,
        subject: String,
        body: String,
        attachments: List<EmailAttachment>,
        isHtml: Boolean = true
    )

    /**
     * Send templated email (for future use with SendGrid templates)
     *
     * @param to Recipient email address
     * @param templateId Template ID from email provider
     * @param templateData Data to populate template
     */
    fun sendTemplatedEmail(
        to: String,
        templateId: String,
        templateData: Map<String, Any>
    )

    /**
     * Check if the email service is available and configured
     */
    fun isConfigured(): Boolean
}

/**
 * Email attachment data class
 */
data class EmailAttachment(
    val filename: String,
    val content: ByteArray,
    val contentType: String
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is EmailAttachment) return false

        if (filename != other.filename) return false
        if (!content.contentEquals(other.content)) return false
        if (contentType != other.contentType) return false

        return true
    }

    override fun hashCode(): Int {
        var result = filename.hashCode()
        result = 31 * result + content.contentHashCode()
        result = 31 * result + contentType.hashCode()
        return result
    }
}

/**
 * Exception thrown when email sending fails
 */
class EmailSendException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)

/**
 * Exception thrown when email service is not configured
 */
class EmailServiceNotConfiguredException(message: String) : RuntimeException(message)
