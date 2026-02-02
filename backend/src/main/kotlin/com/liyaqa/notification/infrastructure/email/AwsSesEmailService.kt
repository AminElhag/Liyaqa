package com.liyaqa.notification.infrastructure.email

import com.liyaqa.notification.domain.ports.EmailAttachment
import com.liyaqa.notification.domain.ports.EmailSendException
import com.liyaqa.notification.domain.ports.EmailService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import software.amazon.awssdk.core.SdkBytes
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.ses.SesClient
import software.amazon.awssdk.services.ses.model.*
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.util.*
import jakarta.mail.Session
import jakarta.mail.internet.InternetAddress
import jakarta.mail.internet.MimeBodyPart
import jakarta.mail.internet.MimeMessage
import jakarta.mail.internet.MimeMultipart

/**
 * AWS SES implementation of EmailService
 *
 * Configuration:
 * - email.provider=aws-ses
 * - email.aws.region=<aws-region>
 * - email.from-address=<sender-email>
 * - email.from-name=<sender-name>
 */
@Service
@Profile("!local")
@ConditionalOnProperty(
    prefix = "email",
    name = ["provider"],
    havingValue = "aws-ses"
)
class AwsSesEmailService(
    @Value("\${email.aws.region:us-east-1}") private val region: String,
    @Value("\${email.from-address}") private val fromAddress: String,
    @Value("\${email.from-name:Liyaqa}") private val fromName: String
) : EmailService {

    private val logger = LoggerFactory.getLogger(javaClass)
    private val sesClient: SesClient = SesClient.builder()
        .region(Region.of(region))
        .build()

    override fun sendEmail(to: String, subject: String, body: String, isHtml: Boolean) {
        logger.info("Sending email via AWS SES to: {}", to)

        val destination = Destination.builder()
            .toAddresses(to)
            .build()

        val content = if (isHtml) {
            Body.builder()
                .html(Content.builder().data(body).charset("UTF-8").build())
                .build()
        } else {
            Body.builder()
                .text(Content.builder().data(body).charset("UTF-8").build())
                .build()
        }

        val message = Message.builder()
            .subject(Content.builder().data(subject).charset("UTF-8").build())
            .body(content)
            .build()

        val request = SendEmailRequest.builder()
            .source("$fromName <$fromAddress>")
            .destination(destination)
            .message(message)
            .build()

        try {
            val response = sesClient.sendEmail(request)
            logger.info(
                "Email sent successfully via AWS SES to: {} (MessageId: {})",
                to,
                response.messageId()
            )
        } catch (e: Exception) {
            logger.error("Failed to send email via AWS SES to: {}", to, e)
            throw EmailSendException("AWS SES email failed: ${e.message}", e)
        }
    }

    override fun sendEmail(to: List<String>, subject: String, body: String, isHtml: Boolean) {
        logger.info("Sending email via AWS SES to {} recipients", to.size)

        val destination = Destination.builder()
            .toAddresses(to)
            .build()

        val content = if (isHtml) {
            Body.builder()
                .html(Content.builder().data(body).charset("UTF-8").build())
                .build()
        } else {
            Body.builder()
                .text(Content.builder().data(body).charset("UTF-8").build())
                .build()
        }

        val message = Message.builder()
            .subject(Content.builder().data(subject).charset("UTF-8").build())
            .body(content)
            .build()

        val request = SendEmailRequest.builder()
            .source("$fromName <$fromAddress>")
            .destination(destination)
            .message(message)
            .build()

        try {
            val response = sesClient.sendEmail(request)
            logger.info(
                "Email sent successfully via AWS SES to {} recipients (MessageId: {})",
                to.size,
                response.messageId()
            )
        } catch (e: Exception) {
            logger.error("Failed to send email via AWS SES to multiple recipients", e)
            throw EmailSendException("AWS SES email failed: ${e.message}", e)
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
        logger.info("Sending email via AWS SES to: {} with CC: {} and BCC: {}", to, cc?.size ?: 0, bcc?.size ?: 0)

        val destinationBuilder = Destination.builder()
            .toAddresses(to)

        cc?.let { destinationBuilder.ccAddresses(it) }
        bcc?.let { destinationBuilder.bccAddresses(it) }

        val destination = destinationBuilder.build()

        val content = if (isHtml) {
            Body.builder()
                .html(Content.builder().data(body).charset("UTF-8").build())
                .build()
        } else {
            Body.builder()
                .text(Content.builder().data(body).charset("UTF-8").build())
                .build()
        }

        val message = Message.builder()
            .subject(Content.builder().data(subject).charset("UTF-8").build())
            .body(content)
            .build()

        val request = SendEmailRequest.builder()
            .source("$fromName <$fromAddress>")
            .destination(destination)
            .message(message)
            .build()

        try {
            val response = sesClient.sendEmail(request)
            logger.info(
                "Email sent successfully via AWS SES to: {} with CC/BCC (MessageId: {})",
                to,
                response.messageId()
            )
        } catch (e: Exception) {
            logger.error("Failed to send email via AWS SES with CC/BCC to: {}", to, e)
            throw EmailSendException("AWS SES email failed: ${e.message}", e)
        }
    }

    override fun sendEmailWithAttachments(
        to: String,
        subject: String,
        body: String,
        attachments: List<EmailAttachment>,
        isHtml: Boolean
    ) {
        logger.info("Sending email via AWS SES to: {} with {} attachments", to, attachments.size)

        try {
            // Create a MimeMessage for attachments
            val session = Session.getDefaultInstance(Properties())
            val mimeMessage = MimeMessage(session)

            mimeMessage.setFrom(InternetAddress(fromAddress, fromName))
            mimeMessage.setRecipients(
                jakarta.mail.Message.RecipientType.TO,
                InternetAddress.parse(to)
            )
            mimeMessage.subject = subject

            // Create multipart message
            val multipart = MimeMultipart()

            // Add body part
            val bodyPart = MimeBodyPart()
            bodyPart.setContent(body, if (isHtml) "text/html; charset=UTF-8" else "text/plain; charset=UTF-8")
            multipart.addBodyPart(bodyPart)

            // Add attachments
            attachments.forEach { attachment ->
                val attachmentPart = MimeBodyPart()
                attachmentPart.setContent(attachment.content, attachment.contentType)
                attachmentPart.fileName = attachment.filename
                multipart.addBodyPart(attachmentPart)
            }

            mimeMessage.setContent(multipart)

            // Convert to raw email
            val outputStream = ByteArrayOutputStream()
            mimeMessage.writeTo(outputStream)
            val rawMessage = RawMessage.builder()
                .data(SdkBytes.fromByteArray(outputStream.toByteArray()))
                .build()

            val request = SendRawEmailRequest.builder()
                .rawMessage(rawMessage)
                .build()

            val response = sesClient.sendRawEmail(request)
            logger.info(
                "Email with attachments sent successfully via AWS SES to: {} (MessageId: {})",
                to,
                response.messageId()
            )
        } catch (e: Exception) {
            logger.error("Failed to send email via AWS SES with attachments to: {}", to, e)
            throw EmailSendException("AWS SES email with attachments failed: ${e.message}", e)
        }
    }

    override fun sendTemplatedEmail(to: String, templateId: String, templateData: Map<String, Any>) {
        logger.info("Sending templated email via AWS SES to: {} with template: {}", to, templateId)

        val destination = Destination.builder()
            .toAddresses(to)
            .build()

        // Convert template data to JSON string
        val templateDataJson = buildJsonFromMap(templateData)

        val request = SendTemplatedEmailRequest.builder()
            .source("$fromName <$fromAddress>")
            .destination(destination)
            .template(templateId)
            .templateData(templateDataJson)
            .build()

        try {
            val response = sesClient.sendTemplatedEmail(request)
            logger.info(
                "Templated email sent successfully via AWS SES to: {} (MessageId: {})",
                to,
                response.messageId()
            )
        } catch (e: Exception) {
            logger.error("Failed to send templated email via AWS SES to: {}", to, e)
            throw EmailSendException("AWS SES templated email failed: ${e.message}", e)
        }
    }

    override fun isConfigured(): Boolean {
        return fromAddress.isNotBlank()
    }

    /**
     * Build simple JSON string from map (for template data)
     */
    private fun buildJsonFromMap(data: Map<String, Any>): String {
        val jsonParts = data.map { (key, value) ->
            val valueStr = when (value) {
                is String -> "\"${value.replace("\"", "\\\"")}\""
                is Number -> value.toString()
                is Boolean -> value.toString()
                else -> "\"$value\""
            }
            "\"$key\":$valueStr"
        }
        return "{${jsonParts.joinToString(",")}}"
    }
}
