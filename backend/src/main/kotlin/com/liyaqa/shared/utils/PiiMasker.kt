package com.liyaqa.shared.utils

/**
 * Utility object for masking Personally Identifiable Information (PII) in logs.
 * Ensures GDPR/PDPL compliance by preventing sensitive data from being logged in plaintext.
 */
object PiiMasker {
    /**
     * Masks email for logging: john.doe@example.com -> j***e@e***.com
     * @param email The email address to mask
     * @return Masked email suitable for logging, or [empty]/[invalid-email] for invalid input
     */
    fun maskEmail(email: String?): String {
        if (email.isNullOrBlank()) return "[empty]"

        val parts = email.split("@")
        if (parts.size != 2) return "[invalid-email]"

        val localPart = parts[0]
        val domainPart = parts[1]

        val maskedLocal = when {
            localPart.isEmpty() -> ""
            localPart.length == 1 -> "*"
            localPart.length == 2 -> "**"
            else -> "${localPart.first()}${"*".repeat(localPart.length - 2)}${localPart.last()}"
        }

        val maskedDomain = when {
            domainPart.isEmpty() -> ""
            else -> "${domainPart.first()}${"*".repeat(maxOf(0, domainPart.length - 1))}"
        }

        return "$maskedLocal@$maskedDomain"
    }

    /**
     * Masks phone: +966501234567 -> +966****4567
     * @param phone The phone number to mask
     * @return Masked phone suitable for logging, or [empty] for empty input
     */
    fun maskPhone(phone: String?): String {
        if (phone.isNullOrBlank()) return "[empty]"
        if (phone.length <= 4) return "*".repeat(phone.length)

        val visiblePrefix = phone.take(4)
        val visibleSuffix = phone.takeLast(4)
        val maskedMiddle = "*".repeat(maxOf(0, phone.length - 8))

        return "$visiblePrefix$maskedMiddle$visibleSuffix"
    }

    /**
     * Fully masks sensitive data.
     * @param value The sensitive value to mask
     * @return [REDACTED] or [empty] for empty input
     */
    fun maskSensitive(value: String?): String =
        if (value.isNullOrBlank()) "[empty]" else "[REDACTED]"
}
