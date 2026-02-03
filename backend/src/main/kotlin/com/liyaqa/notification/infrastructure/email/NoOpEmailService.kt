package com.liyaqa.notification.infrastructure.email

import com.liyaqa.notification.domain.ports.EmailAttachment
import com.liyaqa.notification.domain.ports.EmailService
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Service

@Service
@ConditionalOnProperty(
    prefix = "liyaqa.email",
    name = ["enabled"],
    havingValue = "false",
    matchIfMissing = false
)
class NoOpEmailService : EmailService {

    private val logger = LoggerFactory.getLogger(javaClass)

    override fun sendEmail(to: String, subject: String, body: String, isHtml: Boolean) {
        logger.debug("Email disabled - skipping send to: {}", to)
    }

    override fun sendEmail(to: List<String>, subject: String, body: String, isHtml: Boolean) {
        logger.debug("Email disabled - skipping send to {} recipients", to.size)
    }

    override fun sendEmail(to: String, cc: List<String>?, bcc: List<String>?, subject: String, body: String, isHtml: Boolean) {
        logger.debug("Email disabled - skipping send to: {}", to)
    }

    override fun sendEmailWithAttachments(to: String, subject: String, body: String, attachments: List<EmailAttachment>, isHtml: Boolean) {
        logger.debug("Email disabled - skipping send with attachments to: {}", to)
    }

    override fun sendTemplatedEmail(to: String, templateId: String, templateData: Map<String, Any>) {
        logger.debug("Email disabled - skipping templated email to: {}", to)
    }

    override fun isConfigured(): Boolean = false
}
