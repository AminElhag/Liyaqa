package com.liyaqa.shared.infrastructure.storage

import org.springframework.core.io.Resource
import org.springframework.web.multipart.MultipartFile
import java.util.UUID

/**
 * Service interface for file storage operations.
 */
interface FileStorageService {
    /**
     * Stores a file and returns the stored file metadata.
     */
    fun store(file: MultipartFile, category: FileCategory, referenceId: UUID? = null): StoredFile

    /**
     * Loads a file by its ID.
     */
    fun load(fileId: UUID): Resource

    /**
     * Loads file metadata by ID.
     */
    fun getMetadata(fileId: UUID): StoredFile?

    /**
     * Deletes a file by its ID.
     */
    fun delete(fileId: UUID): Boolean

    /**
     * Gets the public URL for a file.
     */
    fun getUrl(fileId: UUID): String

    /**
     * Validates file before storage.
     */
    fun validate(file: MultipartFile): FileValidationResult
}

/**
 * Categories for organizing stored files.
 */
enum class FileCategory {
    MEMBER_PROFILE,      // Member profile photos
    INVOICE_RECEIPT,     // Invoice receipt attachments
    DOCUMENT,            // General documents
    CLUB_LOGO,           // Club logos
    CLASS_IMAGE,         // Gym class images
    OTHER                // Other files
}

/**
 * Metadata for a stored file.
 */
data class StoredFile(
    val id: UUID,
    val originalName: String,
    val storedName: String,
    val mimeType: String,
    val size: Long,
    val category: FileCategory,
    val referenceId: UUID? = null,
    val path: String,
    val url: String
)

/**
 * Result of file validation.
 */
data class FileValidationResult(
    val valid: Boolean,
    val error: String? = null
) {
    companion object {
        fun valid() = FileValidationResult(true)
        fun invalid(error: String) = FileValidationResult(false, error)
    }
}
