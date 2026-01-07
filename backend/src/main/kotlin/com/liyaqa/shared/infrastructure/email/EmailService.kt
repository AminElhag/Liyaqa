package com.liyaqa.shared.infrastructure.email

import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service

/**
 * Email service interface for sending emails.
 * Implementation is selected based on configuration.
 */
interface EmailService {
    /**
     * Sends a simple text email.
     */
    fun sendEmail(to: String, subject: String, body: String)

    /**
     * Sends an HTML email.
     */
    fun sendHtmlEmail(to: String, subject: String, htmlBody: String)

    /**
     * Sends a password reset email.
     */
    fun sendPasswordResetEmail(to: String, resetToken: String, locale: String = "en")

    /**
     * Checks if email service is enabled.
     */
    fun isEnabled(): Boolean
}

/**
 * SMTP-based email service implementation.
 * Activated when liyaqa.email.enabled=true
 */
@Service
@ConditionalOnProperty(name = ["liyaqa.email.enabled"], havingValue = "true")
class SmtpEmailService(
    private val mailSender: JavaMailSender,
    private val emailConfig: EmailConfiguration
) : EmailService {

    private val logger = LoggerFactory.getLogger(SmtpEmailService::class.java)

    override fun sendEmail(to: String, subject: String, body: String) {
        try {
            val message = SimpleMailMessage()
            message.from = emailConfig.fromAddress
            message.setTo(to)
            message.subject = subject
            message.text = body

            mailSender.send(message)
            logger.info("Email sent to: $to, subject: $subject")
        } catch (e: Exception) {
            logger.error("Failed to send email to: $to", e)
            throw EmailSendException("Failed to send email", e)
        }
    }

    override fun sendHtmlEmail(to: String, subject: String, htmlBody: String) {
        try {
            val mimeMessage = mailSender.createMimeMessage()
            val helper = MimeMessageHelper(mimeMessage, true, "UTF-8")

            helper.setFrom(emailConfig.fromAddress)
            helper.setTo(to)
            helper.setSubject(subject)
            helper.setText(htmlBody, true)

            mailSender.send(mimeMessage)
            logger.info("HTML email sent to: $to, subject: $subject")
        } catch (e: Exception) {
            logger.error("Failed to send HTML email to: $to", e)
            throw EmailSendException("Failed to send HTML email", e)
        }
    }

    override fun sendPasswordResetEmail(to: String, resetToken: String, locale: String) {
        val (subject, body) = if (locale == "ar") {
            "إعادة تعيين كلمة المرور - Liyaqa" to """
                |مرحباً،
                |
                |لقد طلبت إعادة تعيين كلمة المرور الخاصة بك.
                |
                |رمز إعادة التعيين: $resetToken
                |
                |هذا الرمز صالح لمدة ساعة واحدة فقط.
                |
                |إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.
                |
                |مع تحيات،
                |فريق Liyaqa
            """.trimMargin()
        } else {
            "Password Reset - Liyaqa" to """
                |Hello,
                |
                |You have requested to reset your password.
                |
                |Reset Token: $resetToken
                |
                |This token is valid for 1 hour only.
                |
                |If you did not request a password reset, please ignore this email.
                |
                |Best regards,
                |Liyaqa Team
            """.trimMargin()
        }

        sendEmail(to, subject, body)
    }

    override fun isEnabled(): Boolean = true
}

/**
 * Console/logging-based email service implementation (for development).
 * Activated when liyaqa.email.enabled=false or not set
 */
@Service
@ConditionalOnProperty(name = ["liyaqa.email.enabled"], havingValue = "false", matchIfMissing = true)
class ConsoleEmailService : EmailService {

    private val logger = LoggerFactory.getLogger(ConsoleEmailService::class.java)

    override fun sendEmail(to: String, subject: String, body: String) {
        logger.info("""
            |
            |========== EMAIL (Console Mode) ==========
            |To: $to
            |Subject: $subject
            |Body:
            |$body
            |==========================================
        """.trimMargin())
    }

    override fun sendHtmlEmail(to: String, subject: String, htmlBody: String) {
        logger.info("""
            |
            |========== HTML EMAIL (Console Mode) ==========
            |To: $to
            |Subject: $subject
            |HTML Body:
            |$htmlBody
            |================================================
        """.trimMargin())
    }

    override fun sendPasswordResetEmail(to: String, resetToken: String, locale: String) {
        val subject = if (locale == "ar") "إعادة تعيين كلمة المرور" else "Password Reset"
        logger.info("""
            |
            |========== PASSWORD RESET EMAIL (Console Mode) ==========
            |To: $to
            |Subject: $subject
            |Reset Token: $resetToken
            |Locale: $locale
            |==========================================================
        """.trimMargin())
    }

    override fun isEnabled(): Boolean = false
}

/**
 * Exception thrown when email sending fails.
 */
class EmailSendException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)
