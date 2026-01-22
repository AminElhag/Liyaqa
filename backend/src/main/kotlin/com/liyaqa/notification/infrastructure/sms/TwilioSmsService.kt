package com.liyaqa.notification.infrastructure.sms

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.retry.annotation.Backoff
import org.springframework.retry.annotation.Retryable
import org.springframework.stereotype.Service
import org.springframework.util.LinkedMultiValueMap
import org.springframework.web.client.RestClientException
import org.springframework.web.client.RestTemplate
import java.util.Base64

/**
 * Twilio-based SMS service for production use.
 * Uses Twilio's REST API to send SMS messages.
 *
 * Required configuration:
 * - liyaqa.sms.twilio.account-sid
 * - liyaqa.sms.twilio.auth-token
 * - liyaqa.sms.twilio.from-number
 */
@Service
@ConditionalOnProperty(
    name = ["liyaqa.sms.enabled"],
    havingValue = "true"
)
class TwilioSmsService(
    @Value("\${liyaqa.sms.twilio.account-sid}")
    private val accountSid: String,

    @Value("\${liyaqa.sms.twilio.auth-token}")
    private val authToken: String,

    @Value("\${liyaqa.sms.twilio.from-number}")
    private val fromNumber: String
) : SmsService {

    private val logger = LoggerFactory.getLogger(TwilioSmsService::class.java)
    private val restTemplate = RestTemplate()

    private val twilioApiUrl: String
        get() = "https://api.twilio.com/2010-04-01/Accounts/$accountSid/Messages.json"

    /**
     * Sends an SMS message via Twilio.
     * Retries up to 3 times with exponential backoff on network failures.
     */
    @Retryable(
        retryFor = [RestClientException::class],
        maxAttempts = 3,
        backoff = Backoff(delay = 1000, multiplier = 2.0)
    )
    override fun send(to: String, message: String): String? {
        try {
            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_FORM_URLENCODED
                setBasicAuth(accountSid, authToken)
            }

            val body = LinkedMultiValueMap<String, String>().apply {
                add("To", to)
                add("From", fromNumber)
                add("Body", message)
            }

            val request = HttpEntity(body, headers)
            val response = restTemplate.postForEntity(twilioApiUrl, request, Map::class.java)

            if (response.statusCode.is2xxSuccessful) {
                val messageId = response.body?.get("sid") as? String
                logger.info("SMS sent successfully via Twilio. SID: $messageId, To: $to")
                return messageId
            } else {
                val errorMessage = "Twilio returned status ${response.statusCode}"
                logger.error("Failed to send SMS via Twilio: $errorMessage")
                throw SmsSendException(errorMessage)
            }
        } catch (e: SmsSendException) {
            throw e
        } catch (e: Exception) {
            logger.error("Error sending SMS via Twilio to $to: ${e.message}", e)
            throw SmsSendException("Failed to send SMS: ${e.message}", e)
        }
    }

    override fun isAvailable(): Boolean {
        return accountSid.isNotBlank() && authToken.isNotBlank() && fromNumber.isNotBlank()
    }

    override fun getProviderName(): String = "Twilio"
}
