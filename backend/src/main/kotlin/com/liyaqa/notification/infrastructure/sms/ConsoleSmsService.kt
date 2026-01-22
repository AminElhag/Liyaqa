package com.liyaqa.notification.infrastructure.sms

import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * Console-based SMS service for development and testing.
 * Logs messages to console instead of sending real SMS.
 */
@Service
@ConditionalOnProperty(
    name = ["liyaqa.sms.enabled"],
    havingValue = "false",
    matchIfMissing = true
)
class ConsoleSmsService : SmsService {
    private val logger = LoggerFactory.getLogger(ConsoleSmsService::class.java)

    override fun send(to: String, message: String): String? {
        val messageId = "console-${UUID.randomUUID()}"

        logger.info("""
            |
            |╔══════════════════════════════════════════════════════════════════╗
            |║                         SMS MESSAGE                              ║
            |╠══════════════════════════════════════════════════════════════════╣
            |║ Provider:    Console (Development Mode)                          ║
            |║ Message ID:  $messageId
            |║ To:          $to
            |║ Content:
            |║ ${message.lines().joinToString("\n║ ")}
            |╚══════════════════════════════════════════════════════════════════╝
            |
        """.trimMargin())

        return messageId
    }

    override fun isAvailable(): Boolean = true

    override fun getProviderName(): String = "Console (Development)"
}
