package com.liyaqa.shared.domain

import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.Embedded
import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import jakarta.validation.constraints.NotBlank
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.Currency
import kotlin.reflect.KClass

/**
 * Value object for bilingual text fields (Arabic/English).
 * Embeddable for use in JPA entities.
 * Designed to be extensible for additional languages.
 */
@Embeddable
data class LocalizedText(
    @Column(name = "_en", nullable = false)
    val en: String,

    @Column(name = "_ar")
    val ar: String? = null
) {
    /**
     * Get localized value based on locale preference.
     * Falls back to English if the requested locale is not available.
     */
    fun get(locale: String = "en"): String {
        return when (locale.lowercase()) {
            "ar" -> ar ?: en
            else -> en
        }
    }

    companion object {
        fun of(en: String, ar: String? = null) = LocalizedText(en, ar)
    }
}

/**
 * Input DTO for receiving bilingual text from API requests.
 * Used in request DTOs to accept LocalizedText input.
 * Requires English text (strict validation).
 */
data class LocalizedTextInput(
    @field:NotBlank(message = "English text is required")
    val en: String,
    val ar: String? = null
) {
    fun toLocalizedText() = LocalizedText(en, ar)
}

/**
 * Custom validation annotation for FlexibleLocalizedTextInput.
 * Validates that at least one language (English or Arabic) is provided.
 */
@Target(AnnotationTarget.CLASS, AnnotationTarget.TYPE)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [AtLeastOneLanguageValidator::class])
@MustBeDocumented
annotation class AtLeastOneLanguage(
    val message: String = "At least one language (English or Arabic) is required",
    val messageAr: String = "مطلوب لغة واحدة على الأقل (إنجليزي أو عربي)",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

/**
 * Validator implementation for AtLeastOneLanguage annotation.
 */
class AtLeastOneLanguageValidator : ConstraintValidator<AtLeastOneLanguage, FlexibleLocalizedTextInput> {
    override fun isValid(value: FlexibleLocalizedTextInput?, context: ConstraintValidatorContext?): Boolean {
        if (value == null) return false
        return !value.en.isNullOrBlank() || !value.ar.isNullOrBlank()
    }
}

/**
 * Flexible input DTO for bilingual text that requires at least one language.
 * Used for member names where either English OR Arabic is required, not necessarily both.
 */
@AtLeastOneLanguage
data class FlexibleLocalizedTextInput(
    val en: String? = null,
    val ar: String? = null
) {
    fun toLocalizedText() = LocalizedText(en ?: "", ar)
}

/**
 * Localized address for Zatca compliance and general use.
 * All text fields support Arabic/English localization.
 */
@Embeddable
data class LocalizedAddress(
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "street_en")),
        AttributeOverride(name = "ar", column = Column(name = "street_ar"))
    )
    val street: LocalizedText? = null,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "building_en")),
        AttributeOverride(name = "ar", column = Column(name = "building_ar"))
    )
    val building: LocalizedText? = null,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "city_en")),
        AttributeOverride(name = "ar", column = Column(name = "city_ar"))
    )
    val city: LocalizedText? = null,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "district_en")),
        AttributeOverride(name = "ar", column = Column(name = "district_ar"))
    )
    val district: LocalizedText? = null,

    @Column(name = "postal_code")
    val postalCode: String? = null,

    @Column(name = "country_code", length = 2)
    val countryCode: String? = null  // ISO 3166-1 alpha-2
) {
    fun toFormattedString(locale: String = "en"): String {
        return listOfNotNull(
            building?.get(locale),
            street?.get(locale),
            district?.get(locale),
            city?.get(locale),
            postalCode,
            countryCode
        ).filter { it.isNotBlank() }.joinToString(", ")
    }
}

/**
 * Value object representing monetary amounts.
 * Immutable and provides safe arithmetic operations.
 */
@Embeddable
data class Money(
    val amount: BigDecimal,
    val currency: String = "USD"
) : Comparable<Money> {

    init {
        require(amount.scale() <= 2) { "Money amount cannot have more than 2 decimal places" }
    }

    companion object {
        val ZERO = Money(BigDecimal.ZERO)

        fun of(amount: Double, currency: String = "USD"): Money =
            Money(BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP), currency)

        fun of(amount: BigDecimal, currency: String = "USD"): Money =
            Money(amount.setScale(2, RoundingMode.HALF_UP), currency)
    }

    operator fun plus(other: Money): Money {
        requireSameCurrency(other)
        return Money(amount.add(other.amount), currency)
    }

    operator fun minus(other: Money): Money {
        requireSameCurrency(other)
        return Money(amount.subtract(other.amount), currency)
    }

    operator fun times(multiplier: Int): Money =
        Money(amount.multiply(BigDecimal.valueOf(multiplier.toLong())), currency)

    operator fun times(multiplier: BigDecimal): Money =
        Money(amount.multiply(multiplier).setScale(2, RoundingMode.HALF_UP), currency)

    fun isPositive(): Boolean = amount > BigDecimal.ZERO
    fun isNegative(): Boolean = amount < BigDecimal.ZERO
    fun isZero(): Boolean = amount.compareTo(BigDecimal.ZERO) == 0

    override fun compareTo(other: Money): Int {
        requireSameCurrency(other)
        return amount.compareTo(other.amount)
    }

    private fun requireSameCurrency(other: Money) {
        require(currency == other.currency) {
            "Cannot operate on different currencies: $currency vs ${other.currency}"
        }
    }

    override fun toString(): String = "$currency $amount"
}

/**
 * Value object representing an email address.
 */
@JvmInline
value class Email(val value: String) {
    init {
        require(value.matches(EMAIL_REGEX)) { "Invalid email format: $value" }
    }

    companion object {
        private val EMAIL_REGEX = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
    }

    override fun toString(): String = value
}

/**
 * Value object representing a phone number.
 */
@JvmInline
value class PhoneNumber(val value: String) {
    init {
        require(value.matches(PHONE_REGEX)) { "Invalid phone number format: $value" }
    }

    companion object {
        private val PHONE_REGEX = Regex("^\\+?[1-9]\\d{1,14}$")
    }

    override fun toString(): String = value
}

/**
 * Value object representing a fee with an associated tax rate.
 * Used for membership plan fees (membership fee, administration fee, join fee).
 * Provides methods to calculate tax amount and gross total.
 */
@Embeddable
data class TaxableFee(
    @Column(name = "_amount", nullable = false)
    val amount: BigDecimal = BigDecimal.ZERO,

    @Column(name = "_currency", nullable = false)
    val currency: String = "SAR",

    @Column(name = "_tax_rate", nullable = false)
    val taxRate: BigDecimal = BigDecimal.ZERO  // Percentage (e.g., 15.00 for 15%)
) {
    init {
        require(amount.scale() <= 2) { "Fee amount cannot have more than 2 decimal places" }
        require(amount >= BigDecimal.ZERO) { "Fee amount cannot be negative" }
        require(taxRate >= BigDecimal.ZERO && taxRate <= BigDecimal("100")) {
            "Tax rate must be between 0 and 100"
        }
    }

    /**
     * Get the net amount (before tax) as a Money object.
     */
    fun getNetAmount(): Money = Money(amount.setScale(2, RoundingMode.HALF_UP), currency)

    /**
     * Calculate the tax amount based on the tax rate.
     */
    fun getTaxAmount(): Money = Money(
        amount.multiply(taxRate).divide(BigDecimal("100"), 2, RoundingMode.HALF_UP),
        currency
    )

    /**
     * Get the gross amount (net + tax) as a Money object.
     */
    fun getGrossAmount(): Money = getNetAmount() + getTaxAmount()

    /**
     * Check if this fee has a zero amount.
     */
    fun isZero(): Boolean = amount.compareTo(BigDecimal.ZERO) == 0

    companion object {
        val ZERO = TaxableFee()

        fun of(amount: BigDecimal, currency: String = "SAR", taxRate: BigDecimal = BigDecimal("15.00")): TaxableFee =
            TaxableFee(amount.setScale(2, RoundingMode.HALF_UP), currency, taxRate)
    }
}
