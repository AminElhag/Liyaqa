package com.liyaqa.shared.exception

/**
 * Exception thrown when attempting to create/update a record with a field value
 * that already exists and must be unique within the tenant.
 */
class DuplicateFieldException(
    val field: DuplicateField,
    message: String
) : RuntimeException(message)

/**
 * Enum representing fields that have uniqueness constraints.
 * Contains bilingual display names for error messages.
 */
enum class DuplicateField(
    val fieldName: String,
    val displayName: String,
    val displayNameAr: String
) {
    EMAIL("email", "Email", "البريد الإلكتروني"),
    PHONE("phone", "Phone number", "رقم الهاتف"),
    NATIONAL_ID("nationalId", "National ID", "رقم الهوية الوطنية")
}
