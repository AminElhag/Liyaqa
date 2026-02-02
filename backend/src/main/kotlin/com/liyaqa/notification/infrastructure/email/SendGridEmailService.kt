package com.liyaqa.notification.infrastructure.email

import com.liyaqa.notification.domain.ports.EmailAttachment
import com.liyaqa.notification.domain.ports.EmailSendException
import com.liyaqa.notification.domain.ports.EmailService
import com.sendgrid.Method
import com.sendgrid.Request
import com.sendgrid.SendGrid
import com.sendgrid.helpers.mail.Mail
import com.sendgrid.helpers.mail.objects.Attachments
import com.sendgrid.helpers.mail.objects.Content
import com.sendgrid.helpers.mail.objects.Email
import com.sendgrid.helpers.mail.objects.Personalization
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.util.Base64

/**
 * SendGrid implementation of EmailService
 *
 * Configuration:
 * - email.provider=sendgrid
 * - email.sendgrid.api-key=<your-sendgrid-api-key>
 * - email.from-address=<sender-email>
 * - email.from-name=<sender-name>
 */
@Service
@Profile("!local")
@ConditionalOnProperty(
    prefix = "email",
    name = ["provider"],
    havingValue = "sendgrid"
)
class SendGridEmailService(
    @Value("\${email.sendgrid.api-key}") private val apiKey: String,
    @Value("\${email.from-address}") private val fromAddress: String,
    @Value("\${email.from-name:Liyaqa}") private val fromName: String
) : EmailService {

    private val logger = LoggerFactory.getLogger(javaClass)
    private val sendGrid = SendGrid(apiKey)

    override fun sendEmail(to: String, subject: String, body: String, isHtml: Boolean) {
        logger.info("Sending email via SendGrid to: {}", to)

        val from = Email(fromAddress, fromName)
        val toEmail = Email(to)
        val content = Content(if (isHtml) "text/html" else "text/plain", body)
        val mail = Mail(from, subject, toEmail, content)

        try {
            val response = sendMail(mail)
            logResponse(response, to)
        } catch (e: Exception) {
            logger.error("Failed to send email via SendGrid to: {}", to, e)
            throw EmailSendException("SendGrid email failed: ${e.message}", e)
        }
    }

    override fun sendEmail(to: List<String>, subject: String, body: String, isHtml: Boolean) {
        logger.info("Sending email via SendGrid to {} recipients", to.size)

        val from = Email(fromAddress, fromName)
        val content = Content(if (isHtml) "text/html" else "text/plain", body)
        val mail = Mail()
        mail.from = from
        mail.subject = subject
        mail.addContent(content)

        // Add all recipients
        val personalization = Personalization()
        to.forEach { email ->
            personalization.addTo(Email(email))
        }
        mail.addPersonalization(personalization)

        try {
            val response = sendMail(mail)
            logResponse(response, to.joinToString(", "))
        } catch (e: Exception) {
            logger.error("Failed to send email via SendGrid to multiple recipients", e)
            throw EmailSendException("SendGrid email failed: ${e.message}", e)
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
        logger.info("Sending email via SendGrid to: {} with CC: {} and BCC: {}", to, cc?.size ?: 0, bcc?.size ?: 0)

        val from = Email(fromAddress, fromName)
        val content = Content(if (isHtml) "text/html" else "text/plain", body)
        val mail = Mail()
        mail.from = from
        mail.subject = subject
        mail.addContent(content)

        val personalization = Personalization()
        personalization.addTo(Email(to))

        // Add CC recipients
        cc?.forEach { email ->
            personalization.addCc(Email(email))
        }

        // Add BCC recipients
        bcc?.forEach { email ->
            personalization.addBcc(Email(email))
        }

        mail.addPersonalization(personalization)

        try {
            val response = sendMail(mail)
            logResponse(response, to)
        } catch (e: Exception) {
            logger.error("Failed to send email via SendGrid with CC/BCC to: {}", to, e)
            throw EmailSendException("SendGrid email failed: ${e.message}", e)
        }
    }

    override fun sendEmailWithAttachments(
        to: String,
        subject: String,
        body: String,
        attachments: List<EmailAttachment>,
        isHtml: Boolean
    ) {
        logger.info("Sending email via SendGrid to: {} with {} attachments", to, attachments.size)

        val from = Email(fromAddress, fromName)
        val toEmail = Email(to)
        val content = Content(if (isHtml) "text/html" else "text/plain", body)
        val mail = Mail(from, subject, toEmail, content)

        // Add attachments
        attachments.forEach { attachment ->
            val sendGridAttachment = Attachments()
            sendGridAttachment.content = Base64.getEncoder().encodeToString(attachment.content)
            sendGridAttachment.type = attachment.contentType
            sendGridAttachment.filename = attachment.filename
            sendGridAttachment.disposition = "attachment"
            mail.addAttachments(sendGridAttachment)
        }

        try {
            val response = sendMail(mail)
            logResponse(response, to)
        } catch (e: Exception) {
            logger.error("Failed to send email via SendGrid with attachments to: {}", to, e)
            throw EmailSendException("SendGrid email failed: ${e.message}", e)
        }
    }

    override fun sendTemplatedEmail(to: String, templateId: String, templateData: Map<String, Any>) {
        logger.info("Sending templated email via SendGrid to: {} with template: {}", to, templateId)

        val from = Email(fromAddress, fromName)
        val toEmail = Email(to)
        val mail = Mail()
        mail.from = from
        mail.templateId = templateId

        val personalization = Personalization()
        personalization.addTo(toEmail)

        // Add dynamic template data
        templateData.forEach { (key, value) ->
            personalization.addDynamicTemplateData(key, value)
        }

        mail.addPersonalization(personalization)

        try {
            val response = sendMail(mail)
            logResponse(response, to)
        } catch (e: Exception) {
            logger.error("Failed to send templated email via SendGrid to: {}", to, e)
            throw EmailSendException("SendGrid templated email failed: ${e.message}", e)
        }
    }

    override fun isConfigured(): Boolean {
        return apiKey.isNotBlank() && fromAddress.isNotBlank()
    }

    /**
     * Send mail via SendGrid API
     */
    private fun sendMail(mail: Mail): com.sendgrid.Response {
        val request = Request()
        request.method = Method.POST
        request.endpoint = "mail/send"
        request.body = mail.build()

        val response = sendGrid.api(request)

        if (response.statusCode !in 200..299) {
            throw EmailSendException(
                "SendGrid API error: ${response.statusCode} - ${response.body}"
            )
        }

        return response
    }

    /**
     * Log SendGrid API response
     */
    private fun logResponse(response: com.sendgrid.Response, recipient: String) {
        if (response.statusCode in 200..299) {
            logger.info(
                "Email sent successfully via SendGrid to: {} (Status: {})",
                recipient,
                response.statusCode
            )
        } else {
            logger.warn(
                "Email send returned non-2xx status to: {} (Status: {}, Body: {})",
                recipient,
                response.statusCode,
                response.body
            )
        }
    }
}
