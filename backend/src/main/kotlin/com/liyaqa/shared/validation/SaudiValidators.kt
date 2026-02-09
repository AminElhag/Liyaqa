package com.liyaqa.shared.validation

import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import kotlin.reflect.KClass

@Target(AnnotationTarget.FIELD, AnnotationTarget.VALUE_PARAMETER, AnnotationTarget.PROPERTY_GETTER)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [SaudiCRValidator::class])
@MustBeDocumented
annotation class ValidSaudiCR(
    val message: String = "Invalid Saudi Commercial Registration number",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

@Target(AnnotationTarget.FIELD, AnnotationTarget.VALUE_PARAMETER, AnnotationTarget.PROPERTY_GETTER)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [SaudiVATValidator::class])
@MustBeDocumented
annotation class ValidSaudiVAT(
    val message: String = "Invalid Saudi VAT registration number",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

@Target(AnnotationTarget.FIELD, AnnotationTarget.VALUE_PARAMETER, AnnotationTarget.PROPERTY_GETTER)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [SaudiPhoneValidator::class])
@MustBeDocumented
annotation class ValidSaudiPhone(
    val message: String = "Invalid Saudi mobile number",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class SaudiCRValidator : ConstraintValidator<ValidSaudiCR, String> {
    private val pattern = Regex("^[0-9]{10}$")

    override fun isValid(value: String?, context: ConstraintValidatorContext?): Boolean {
        if (value == null) return true
        return pattern.matches(value)
    }
}

class SaudiVATValidator : ConstraintValidator<ValidSaudiVAT, String> {
    private val pattern = Regex("^3[0-9]{13}3$")

    override fun isValid(value: String?, context: ConstraintValidatorContext?): Boolean {
        if (value == null) return true
        return pattern.matches(value)
    }
}

class SaudiPhoneValidator : ConstraintValidator<ValidSaudiPhone, String> {
    private val pattern = Regex("^(\\+966|00966|0)?5[0-9]{8}$")

    override fun isValid(value: String?, context: ConstraintValidatorContext?): Boolean {
        if (value == null) return true
        return pattern.matches(value)
    }
}
