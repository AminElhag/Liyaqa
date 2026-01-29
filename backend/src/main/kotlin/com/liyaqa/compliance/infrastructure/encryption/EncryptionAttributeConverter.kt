package com.liyaqa.compliance.infrastructure.encryption

import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter
import org.springframework.stereotype.Component

/**
 * JPA AttributeConverter for transparent field encryption/decryption.
 * Use with @Convert annotation on entity fields that need encryption at rest.
 *
 * Example:
 * ```
 * @Convert(converter = EncryptionAttributeConverter::class)
 * @Column(name = "ssn")
 * var ssn: String? = null
 * ```
 */
@Converter
@Component
class EncryptionAttributeConverter(
    private val encryptionService: FieldEncryptionService
) : AttributeConverter<String?, String?> {

    /**
     * Encrypt the value before storing in the database.
     */
    override fun convertToDatabaseColumn(attribute: String?): String? {
        return encryptionService.encrypt(attribute)
    }

    /**
     * Decrypt the value when reading from the database.
     */
    override fun convertToEntityAttribute(dbData: String?): String? {
        return encryptionService.decrypt(dbData)
    }
}

/**
 * Annotation to mark fields that should be encrypted.
 * For documentation purposes - actual encryption is handled by @Convert annotation.
 */
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY)
@Retention(AnnotationRetention.RUNTIME)
annotation class Encrypted(
    val description: String = ""
)
