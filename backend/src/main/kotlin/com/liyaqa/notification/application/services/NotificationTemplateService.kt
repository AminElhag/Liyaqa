package com.liyaqa.notification.application.services

import com.github.jknack.handlebars.Handlebars
import com.github.jknack.handlebars.Helper
import com.github.jknack.handlebars.Options
import com.liyaqa.notification.domain.model.NotificationTemplate
import com.liyaqa.notification.domain.ports.NotificationTemplateRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.text.NumberFormat
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Service for rendering notification templates with Handlebars
 */
@Service
class NotificationTemplateService(
    private val templateRepository: NotificationTemplateRepository
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val handlebars = Handlebars().apply {
        registerHelpers()
    }

    /**
     * Render a template by code with variables
     *
     * @param templateCode Unique template code
     * @param locale Language locale (en, ar)
     * @param variables Map of variable name to value
     * @return Rendered template with subject and body
     * @throws TemplateNotFoundException if template doesn't exist
     */
    fun renderTemplate(
        templateCode: String,
        locale: String,
        variables: Map<String, Any>
    ): RenderedTemplate {
        logger.debug("Rendering template: code={}, locale={}", templateCode, locale)

        val template = templateRepository.findByCode(templateCode)
            ?: throw TemplateNotFoundException("Template not found: $templateCode")

        if (!template.isActive) {
            throw TemplateInactiveException("Template is inactive: $templateCode")
        }

        return try {
            val subject = compileAndRender(template.getSubject(locale), variables)
            val body = compileAndRender(template.getBody(locale), variables)
            val sms = template.getSms(locale)?.let { compileAndRender(it, variables) }

            RenderedTemplate(
                subject = subject,
                body = body,
                sms = sms,
                templateCode = templateCode,
                locale = locale
            )
        } catch (e: Exception) {
            logger.error("Error rendering template: code={}, error={}", templateCode, e.message, e)
            throw TemplateRenderException("Failed to render template: $templateCode", e)
        }
    }

    /**
     * Render template for email
     */
    fun renderEmailTemplate(
        templateCode: String,
        locale: String,
        variables: Map<String, Any>
    ): EmailTemplate {
        val rendered = renderTemplate(templateCode, locale, variables)
        return EmailTemplate(
            subject = rendered.subject,
            body = rendered.body
        )
    }

    /**
     * Render template for SMS
     */
    fun renderSmsTemplate(
        templateCode: String,
        locale: String,
        variables: Map<String, Any>
    ): SmsTemplate {
        val rendered = renderTemplate(templateCode, locale, variables)
        return SmsTemplate(
            text = rendered.sms ?: throw TemplateNotFoundException("SMS template not available for: $templateCode")
        )
    }

    /**
     * Compile and render a Handlebars template
     */
    private fun compileAndRender(templateString: String, variables: Map<String, Any>): String {
        val template = handlebars.compileInline(templateString)
        return template.apply(variables)
    }

    /**
     * Register custom Handlebars helpers
     */
    private fun Handlebars.registerHelpers() {
        // Date formatting helper
        registerHelper("formatDate", Helper<Any> { context, options ->
            val locale = options.hash<String>("locale") ?: "en"
            val pattern = options.hash<String>("pattern") ?: "MMMM dd, yyyy"

            when (context) {
                is LocalDate -> {
                    val formatter = DateTimeFormatter.ofPattern(pattern, getLocale(locale))
                    context.format(formatter)
                }
                is LocalDateTime -> {
                    val formatter = DateTimeFormatter.ofPattern(pattern, getLocale(locale))
                    context.format(formatter)
                }
                is Instant -> {
                    val formatter = DateTimeFormatter.ofPattern(pattern, getLocale(locale))
                        .withZone(ZoneId.of("Asia/Riyadh"))
                    formatter.format(context)
                }
                is String -> {
                    try {
                        val instant = Instant.parse(context)
                        val formatter = DateTimeFormatter.ofPattern(pattern, getLocale(locale))
                            .withZone(ZoneId.of("Asia/Riyadh"))
                        formatter.format(instant)
                    } catch (e: Exception) {
                        context
                    }
                }
                else -> context.toString()
            }
        })

        // Currency formatting helper
        registerHelper("formatCurrency", Helper<Number> { context, options ->
            val locale = options.hash<String>("locale") ?: "en"
            val currency = options.hash<String>("currency") ?: "SAR"

            val numberFormat = NumberFormat.getCurrencyInstance(getLocale(locale))
            numberFormat.format(context.toDouble()) + " $currency"
        })

        // Number formatting helper
        registerHelper("formatNumber", Helper<Number> { context, options ->
            val locale = options.hash<String>("locale") ?: "en"
            val numberFormat = NumberFormat.getNumberInstance(getLocale(locale))
            numberFormat.format(context.toLong())
        })

        // Conditional helper for Arabic
        registerHelper("ifArabic", Helper<String> { context, options ->
            if (context == "ar") {
                options.fn()
            } else {
                options.inverse()
            }
        })

        // Uppercase helper
        registerHelper("uppercase", Helper<String> { context, _ ->
            context.uppercase()
        })

        // Lowercase helper
        registerHelper("lowercase", Helper<String> { context, _ ->
            context.lowercase()
        })

        // Default value helper
        registerHelper("default", Helper<Any> { context, options ->
            val defaultValue = options.hash<String>("value") ?: ""
            if (context == null || context.toString().isBlank()) {
                defaultValue
            } else {
                context
            }
        })
    }

    /**
     * Get Java Locale from locale string
     */
    private fun getLocale(locale: String): Locale {
        return when (locale.lowercase()) {
            "ar" -> Locale("ar", "SA")
            else -> Locale.ENGLISH
        }
    }

    /**
     * Preview a template with example data (for testing)
     */
    fun previewTemplate(templateCode: String, locale: String): RenderedTemplate {
        val template = templateRepository.findByCode(templateCode)
            ?: throw TemplateNotFoundException("Template not found: $templateCode")

        // Use example data if available, otherwise use default values
        val exampleVariables = parseExampleData(template.exampleData)
            ?: getDefaultExampleData()

        return renderTemplate(templateCode, locale, exampleVariables)
    }

    /**
     * Parse example data JSON to Map
     */
    private fun parseExampleData(exampleDataJson: String?): Map<String, Any>? {
        if (exampleDataJson == null) return null

        return try {
            // Simple JSON parsing - in production use Jackson
            val map = mutableMapOf<String, Any>()
            // TODO: Implement proper JSON parsing
            map
        } catch (e: Exception) {
            logger.warn("Failed to parse example data", e)
            null
        }
    }

    /**
     * Get default example data for testing
     */
    private fun getDefaultExampleData(): Map<String, Any> {
        return mapOf(
            "memberName" to "Ahmed Al-Rashid",
            "invoiceNumber" to "INV-2026-001234",
            "amount" to 500.0,
            "currency" to "SAR",
            "dueDate" to LocalDate.now().plusDays(7),
            "subscriptionName" to "Premium Monthly",
            "className" to "HIIT Training",
            "classDate" to LocalDate.now().plusDays(1),
            "classTime" to "06:00 AM"
        )
    }
}

/**
 * Rendered template result
 */
data class RenderedTemplate(
    val subject: String,
    val body: String,
    val sms: String?,
    val templateCode: String,
    val locale: String
)

/**
 * Email template result
 */
data class EmailTemplate(
    val subject: String,
    val body: String
)

/**
 * SMS template result
 */
data class SmsTemplate(
    val text: String
)

/**
 * Exception thrown when template is not found
 */
class TemplateNotFoundException(message: String) : RuntimeException(message)

/**
 * Exception thrown when template is inactive
 */
class TemplateInactiveException(message: String) : RuntimeException(message)

/**
 * Exception thrown when template rendering fails
 */
class TemplateRenderException(message: String, cause: Throwable) : RuntimeException(message, cause)
