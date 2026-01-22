package com.liyaqa.shared.infrastructure.persistence

import com.liyaqa.shared.domain.model.FileMetadata
import com.liyaqa.shared.domain.ports.FileMetadataRepository
import com.liyaqa.shared.infrastructure.storage.FileCategory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for FileMetadata.
 */
interface SpringDataFileMetadataRepository : JpaRepository<FileMetadata, UUID> {
    fun findByReferenceId(referenceId: UUID): List<FileMetadata>
    fun findByCategory(category: FileCategory, pageable: Pageable): Page<FileMetadata>
    fun findByReferenceIdAndCategory(referenceId: UUID, category: FileCategory): List<FileMetadata>
    fun countByCategory(category: FileCategory): Long
}

/**
 * JPA implementation of FileMetadataRepository.
 */
@Repository
class JpaFileMetadataRepository(
    private val springDataRepository: SpringDataFileMetadataRepository
) : FileMetadataRepository {

    override fun save(fileMetadata: FileMetadata): FileMetadata {
        return springDataRepository.save(fileMetadata)
    }

    override fun findById(id: UUID): Optional<FileMetadata> {
        return springDataRepository.findById(id)
    }

    override fun findByReferenceId(referenceId: UUID): List<FileMetadata> {
        return springDataRepository.findByReferenceId(referenceId)
    }

    override fun findByCategory(category: FileCategory, pageable: Pageable): Page<FileMetadata> {
        return springDataRepository.findByCategory(category, pageable)
    }

    override fun findByReferenceIdAndCategory(referenceId: UUID, category: FileCategory): List<FileMetadata> {
        return springDataRepository.findByReferenceIdAndCategory(referenceId, category)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun countByCategory(category: FileCategory): Long {
        return springDataRepository.countByCategory(category)
    }
}
