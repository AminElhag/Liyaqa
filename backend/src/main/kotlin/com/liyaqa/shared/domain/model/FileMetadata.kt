package com.liyaqa.shared.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.infrastructure.storage.FileCategory
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.util.UUID

/**
 * Entity for storing file metadata in the database.
 * This replaces the in-memory ConcurrentHashMap storage.
 */
@Entity
@Table(name = "file_metadata")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class FileMetadata(
    id: UUID = UUID.randomUUID(),

    /**
     * Original filename as uploaded by the user.
     */
    @Column(name = "original_name", nullable = false)
    var originalName: String,

    /**
     * Name used for storage (UUID + extension).
     */
    @Column(name = "stored_name", nullable = false)
    var storedName: String,

    /**
     * MIME type of the file.
     */
    @Column(name = "mime_type", nullable = false)
    var mimeType: String,

    /**
     * File size in bytes.
     */
    @Column(name = "file_size", nullable = false)
    var fileSize: Long,

    /**
     * Category of the file for organization.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    var category: FileCategory,

    /**
     * Optional reference to related entity (e.g., member ID for profile photo).
     */
    @Column(name = "reference_id")
    var referenceId: UUID? = null,

    /**
     * Full path to the stored file on disk.
     */
    @Column(name = "storage_path", nullable = false)
    var storagePath: String,

    /**
     * Public URL for accessing the file.
     */
    @Column(name = "url", nullable = false)
    var url: String

) : BaseEntity(id) {

    /**
     * Checks if this file is an image based on MIME type.
     */
    fun isImage(): Boolean = mimeType.startsWith("image/")

    /**
     * Checks if this file is a PDF.
     */
    fun isPdf(): Boolean = mimeType == "application/pdf"

    /**
     * Gets the file extension from the stored name.
     */
    fun getExtension(): String {
        val lastDot = storedName.lastIndexOf('.')
        return if (lastDot > 0) storedName.substring(lastDot + 1) else ""
    }
}
