package com.liyaqa.notification.infrastructure.email

import com.liyaqa.notification.domain.ports.EmailAttachment
import com.liyaqa.notification.domain.ports.EmailSendException
import com.liyaqa.notification.domain.ports.EmailService
import com.liyaqa.shared.utils.PiiMasker
import jakarta.mail.internet.MimeMessage
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Profile
import org.springframework.core.io.ByteArrayResource
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service

/**
 * SMTP implementation of EmailService using Spring Mail
 *
 * Configuration:
 * - email.provider=smtp (or not set, this is the default)
 * - spring.mail.host=<smtp-host>
 * - spring.mail.port=<smtp-port>
 * - spring.mail.username=<smtp-username>
 * - spring.mail.password=<smtp-password>
 * - email.from-address=<sender-email>
 * - email.from-name=<sender-name>
 *
 * Best for: Development, testing, or when SendGrid/SES are not available
 */
@Service
@Profile("!local")
@ConditionalOnProperty(
    prefix = "email",
    name = ["enabled"],
    havingValue = "true",
    matchIfMissing = true
)
class SmtpEmailService(
    private val mailSender: JavaMailSender,
    @Value("\${email.from-address}") private val fromAddress: String,
    @Value("\${email.from-name:Liyaqa}") private val fromName: String
) : EmailService {

    private val logger = LoggerFactory.getLogger(javaClass)

    override fun sendEmail(to: String, subject: String, body: String, isHtml: Boolean) {
        logger.info("Sending email via SMTP to: {}", PiiMasker.maskEmail(to))

        try {
            val message = createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")

            helper.setFrom("$fromName <$fromAddress>")
            helper.setTo(to)
            helper.setSubject(subject)
            helper.setText(body, isHtml)

            mailSender.send(message)
            logger.info("Email sent successfully via SMTP to: {}", PiiMasker.maskEmail(to))
        } catch (e: Exception) {
            logger.error("Failed to send email via SMTP to: {}", PiiMasker.maskEmail(to), e)
            throw EmailSendException("SMTP email failed: ${e.message}", e)
        }
    }

    override fun sendEmail(to: List<String>, subject: String, body: String, isHtml: Boolean) {
        logger.info("Sending email via SMTP to {} recipients", to.size)

        try {
            val message = createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")

            helper.setFrom("$fromName <$fromAddress>")
            helper.setTo(to.toTypedArray())
            helper.setSubject(subject)
            helper.setText(body, isHtml)

            mailSender.send(message)
            logger.info("Email sent successfully via SMTP to {} recipients", to.size)
        } catch (e: Exception) {
            logger.error("Failed to send email via SMTP to multiple recipients", e)
            throw EmailSendException("SMTP email failed: ${e.message}", e)
        }
    }

    override fun sendEmail(
        to: String,
        cc: List<String>?,
        bcc: List<String>?,
        subject: String,
        body: String,
        isHtml: Boolean
    ) {
        logger.info("Sending email via SMTP to: {} with CC: {} and BCC: {}", PiiMasker.maskEmail(to), cc?.size ?: 0, bcc?.size ?: 0)

        try {
            val message = createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")

            helper.setFrom("$fromName <$fromAddress>")
            helper.setTo(to)
            cc?.let { helper.setCc(it.toTypedArray()) }
            bcc?.let { helper.setBcc(it.toTypedArray()) }
            helper.setSubject(subject)
            helper.setText(body, isHtml)

            mailSender.send(message)
            logger.info("Email sent successfully via SMTP to: {} with CC/BCC", PiiMasker.maskEmail(to))
        } catch (e: Exception) {
            logger.error("Failed to send email via SMTP with CC/BCC to: {}", PiiMasker.maskEmail(to), e)
            throw EmailSendException("SMTP email failed: ${e.message}", e)
        }
    }

    override fun sendEmailWithAttachments(
        to: String,
        subject: String,
        body: String,
        attachments: List<EmailAttachment>,
        isHtml: Boolean
    ) {
        logger.info("Sending email via SMTP to: {} with {} attachments", PiiMasker.maskEmail(to), attachments.size)

        try {
            val message = createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")

            helper.setFrom("$fromName <$fromAddress>")
            helper.setTo(to)
            helper.setSubject(subject)
            helper.setText(body, isHtml)

            // Add attachments
            attachments.forEach { attachment ->
                helper.addAttachment(
                    attachment.filename,
                    ByteArrayResource(attachment.content),
                    attachment.contentType
                )
            }

            mailSender.send(message)
            logger.info("Email with attachments sent successfully via SMTP to: {}", PiiMasker.maskEmail(to))
        } catch (e: Exception) {
            logger.error("Failed to send email via SMTP with attachments to: {}", PiiMasker.maskEmail(to), e)
            throw EmailSendException("SMTP email with attachments failed: ${e.message}", e)
        }
    }

    override fun sendTemplatedEmail(to: String, templateId: String, templateData: Map<String, Any>) {
        logger.warn(
            "SMTP provider does not support native templated emails. " +
                    "Use NotificationTemplateService for template rendering instead."
        )
        throw UnsupportedOperationException(
            "SMTP provider does not support templated emails. " +
                    "Use NotificationTemplateService to render templates before sending."
        )
    }

    override fun isConfigured(): Boolean {
        return fromAddress.isNotBlank()
    }

    /**
     * Create a new MimeMessage
     */
    private fun createMimeMessage(): MimeMessage {
        return mailSender.createMimeMessage()
    }
}
