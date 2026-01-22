package com.liyaqa.shared.domain.ports

import com.liyaqa.shared.domain.model.FileMetadata
import com.liyaqa.shared.infrastructure.storage.FileCategory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for file metadata operations.
 */
interface FileMetadataRepository {
    /**
     * Saves file metadata.
     */
    fun save(fileMetadata: FileMetadata): FileMetadata

    /**
     * Finds file metadata by ID.
     */
    fun findById(id: UUID): Optional<FileMetadata>

    /**
     * Finds all file metadata by reference ID (e.g., member ID, invoice ID).
     */
    fun findByReferenceId(referenceId: UUID): List<FileMetadata>

    /**
     * Finds all file metadata by category.
     */
    fun findByCategory(category: FileCategory, pageable: Pageable): Page<FileMetadata>

    /**
     * Finds file metadata by reference ID and category.
     */
    fun findByReferenceIdAndCategory(referenceId: UUID, category: FileCategory): List<FileMetadata>

    /**
     * Deletes file metadata by ID.
     */
    fun deleteById(id: UUID)

    /**
     * Checks if file metadata exists by ID.
     */
    fun existsById(id: UUID): Boolean

    /**
     * Counts files by category.
     */
    fun countByCategory(category: FileCategory): Long
}
