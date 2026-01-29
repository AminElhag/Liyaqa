package com.liyaqa.compliance.application.services

import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.Period

/**
 * Service for anonymizing personal data for PDPL compliance.
 * Used for DSR requests, data retention, and privacy-preserving analytics.
 */
@Service
class DataAnonymizationService {

    /**
     * Anonymize an email address.
     * john.doe@example.com → j***.d**@e***.com
     */
    fun anonymizeEmail(email: String?): String? {
        if (email.isNullOrBlank()) return email

        val parts = email.split("@")
        if (parts.size != 2) return maskString(email, 3)

        val localPart = parts[0]
        val domainParts = parts[1].split(".")

        val anonymizedLocal = if (localPart.length > 1) {
            "${localPart.first()}${"*".repeat(minOf(localPart.length - 1, 3))}"
        } else {
            "*"
        }

        val anonymizedDomain = domainParts.mapIndexed { index, part ->
            if (index == domainParts.lastIndex) {
                part // Keep TLD
            } else {
                "${part.first()}${"*".repeat(minOf(part.length - 1, 2))}"
            }
        }.joinToString(".")

        return "$anonymizedLocal@$anonymizedDomain"
    }

    /**
     * Anonymize a phone number.
     * +966501234567 → +966*****4567
     */
    fun anonymizePhone(phone: String?): String? {
        if (phone.isNullOrBlank()) return phone

        val digits = phone.filter { it.isDigit() || it == '+' }
        if (digits.length < 7) return "*".repeat(digits.length)

        val prefix = if (digits.startsWith("+")) {
            digits.take(4) // Country code + prefix
        } else {
            digits.take(3)
        }

        val suffix = digits.takeLast(4)
        val middleLength = digits.length - prefix.length - suffix.length

        return "$prefix${"*".repeat(middleLength)}$suffix"
    }

    /**
     * Anonymize a person's name.
     * John Doe → J*** D**
     */
    fun anonymizeName(name: String?): String? {
        if (name.isNullOrBlank()) return name

        return name.split(" ").joinToString(" ") { part ->
            if (part.isNotEmpty()) {
                "${part.first()}${"*".repeat(minOf(part.length - 1, 3))}"
            } else {
                part
            }
        }
    }

    /**
     * Generalize age/birthdate to age range.
     * 1990-05-15 → "30-35"
     */
    fun generalizeAge(birthDate: LocalDate?): String? {
        if (birthDate == null) return null

        val age = Period.between(birthDate, LocalDate.now()).years
        val lowerBound = (age / 5) * 5
        val upperBound = lowerBound + 5

        return "$lowerBound-$upperBound"
    }

    /**
     * Generalize a date to month/year only.
     * 2024-03-15 → "March 2024"
     */
    fun generalizeDate(date: LocalDate?): String? {
        if (date == null) return null
        return "${date.month.name.lowercase().replaceFirstChar { it.uppercase() }} ${date.year}"
    }

    /**
     * Anonymize an address.
     * 123 Main Street, Riyadh → ***, Riyadh
     */
    fun anonymizeAddress(address: String?): String? {
        if (address.isNullOrBlank()) return address

        // Keep only the city/region (last part after comma)
        val parts = address.split(",").map { it.trim() }
        return if (parts.size > 1) {
            "${"*".repeat(3)}, ${parts.last()}"
        } else {
            "*".repeat(minOf(address.length, 10))
        }
    }

    /**
     * Anonymize national ID / civil ID.
     * 1234567890 → ******7890
     */
    fun anonymizeNationalId(id: String?): String? {
        if (id.isNullOrBlank()) return id

        val cleanId = id.filter { it.isLetterOrDigit() }
        if (cleanId.length <= 4) return "*".repeat(cleanId.length)

        val suffix = cleanId.takeLast(4)
        return "*".repeat(cleanId.length - 4) + suffix
    }

    /**
     * Mask a generic string, keeping first N characters.
     */
    fun maskString(value: String?, visibleChars: Int = 3): String? {
        if (value.isNullOrBlank()) return value
        if (value.length <= visibleChars) return "*".repeat(value.length)

        return value.take(visibleChars) + "*".repeat(minOf(value.length - visibleChars, 5))
    }

    /**
     * Completely redact a value.
     */
    fun redact(value: String?): String {
        return "[REDACTED]"
    }

    /**
     * Hash a value for pseudonymization (one-way).
     */
    fun pseudonymize(value: String?, salt: String = "liyaqa"): String? {
        if (value.isNullOrBlank()) return value

        val input = "$salt:$value"
        val md = java.security.MessageDigest.getInstance("SHA-256")
        val hash = md.digest(input.toByteArray())
        return hash.take(8).joinToString("") { "%02x".format(it) }
    }

    /**
     * Anonymize a member record for PDPL compliance.
     */
    fun anonymizeMemberData(data: Map<String, Any?>): Map<String, Any?> {
        return data.mapValues { (key, value) ->
            when {
                key.contains("email", ignoreCase = true) && value is String -> anonymizeEmail(value)
                key.contains("phone", ignoreCase = true) && value is String -> anonymizePhone(value)
                key.contains("name", ignoreCase = true) && value is String -> anonymizeName(value)
                key.contains("address", ignoreCase = true) && value is String -> anonymizeAddress(value)
                key.contains("birth", ignoreCase = true) && value is LocalDate -> generalizeAge(value)
                key.contains("national", ignoreCase = true) && value is String -> anonymizeNationalId(value)
                key.contains("id", ignoreCase = true) && value is String -> anonymizeNationalId(value)
                else -> value
            }
        }
    }

    /**
     * Get a list of PII field names commonly found in member data.
     */
    fun getPiiFieldNames(): Set<String> {
        return setOf(
            "email", "phone", "mobile", "firstName", "lastName", "name", "fullName",
            "address", "street", "city", "postalCode", "nationalId", "civilId",
            "dateOfBirth", "birthDate", "emergencyContact", "emergencyPhone",
            "bankAccount", "iban", "creditCard"
        )
    }
}
