package com.liyaqa.shared.infrastructure.storage

import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.model.FileMetadata
import com.liyaqa.shared.domain.ports.FileMetadataRepository
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.io.IOException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.util.UUID

/**
 * Local filesystem implementation of FileStorageService.
 *
 * Stores files in a configurable local directory with the following structure:
 * {uploadDir}/{category}/{referenceId}/{uuid}.{extension}
 *
 * File metadata is persisted to the database for durability.
 * For production, consider using S3 or other cloud storage.
 */
@Service
class LocalFileStorageService(
    private val config: StorageConfig,
    private val fileMetadataRepository: FileMetadataRepository
) : FileStorageService {

    private val logger = LoggerFactory.getLogger(LocalFileStorageService::class.java)
    private lateinit var rootLocation: Path

    @PostConstruct
    fun init() {
        rootLocation = Paths.get(config.local.uploadDir).toAbsolutePath().normalize()

        try {
            Files.createDirectories(rootLocation)
            logger.info("File storage initialized at: $rootLocation")
        } catch (e: IOException) {
            throw RuntimeException("Could not create upload directory: $rootLocation", e)
        }
    }

    @Transactional
    override fun store(file: MultipartFile, category: FileCategory, referenceId: UUID?): StoredFile {
        val validation = validate(file)
        if (!validation.valid) {
            throw IllegalArgumentException(validation.error ?: "Invalid file")
        }

        val fileId = UUID.randomUUID()
        val originalName = file.originalFilename ?: "file"
        val extension = getExtension(originalName)
        val storedName = "$fileId.$extension"

        // Create category directory
        val categoryDir = rootLocation.resolve(category.name.lowercase())
        val targetDir = if (referenceId != null) {
            categoryDir.resolve(referenceId.toString())
        } else {
            categoryDir
        }

        try {
            Files.createDirectories(targetDir)

            val targetPath = targetDir.resolve(storedName)
            Files.copy(file.inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING)

            val url = "/api/files/$fileId"

            // Create and save file metadata to database
            val metadata = FileMetadata(
                id = fileId,
                originalName = originalName,
                storedName = storedName,
                mimeType = file.contentType ?: "application/octet-stream",
                fileSize = file.size,
                category = category,
                referenceId = referenceId,
                storagePath = targetPath.toString(),
                url = url
            )

            // Set tenant ID from context
            setTenantId(metadata)

            val savedMetadata = fileMetadataRepository.save(metadata)
            logger.info("File stored: $fileId (${savedMetadata.originalName})")

            return toStoredFile(savedMetadata)
        } catch (e: IOException) {
            logger.error("Failed to store file: ${e.message}", e)
            throw RuntimeException("Failed to store file: ${e.message}", e)
        }
    }

    override fun load(fileId: UUID): Resource {
        val metadata = fileMetadataRepository.findById(fileId)
            .orElseThrow { NoSuchElementException("File not found: $fileId") }

        try {
            val filePath = Paths.get(metadata.storagePath)
            val resource = UrlResource(filePath.toUri())

            if (resource.exists() && resource.isReadable) {
                return resource
            } else {
                throw NoSuchElementException("File not readable: $fileId")
            }
        } catch (e: NoSuchElementException) {
            throw e
        } catch (e: Exception) {
            logger.error("Failed to load file: ${e.message}", e)
            throw RuntimeException("Failed to load file: ${e.message}", e)
        }
    }

    @Transactional(readOnly = true)
    override fun getMetadata(fileId: UUID): StoredFile? {
        return fileMetadataRepository.findById(fileId)
            .map { toStoredFile(it) }
            .orElse(null)
    }

    @Transactional
    override fun delete(fileId: UUID): Boolean {
        val metadata = fileMetadataRepository.findById(fileId).orElse(null) ?: return false

        try {
            val filePath = Paths.get(metadata.storagePath)
            val deleted = Files.deleteIfExists(filePath)

            if (deleted) {
                fileMetadataRepository.deleteById(fileId)
                logger.info("File deleted: $fileId")
            }

            return deleted
        } catch (e: IOException) {
            logger.error("Failed to delete file: ${e.message}", e)
            return false
        }
    }

    override fun getUrl(fileId: UUID): String {
        return "/api/files/$fileId"
    }

    override fun validate(file: MultipartFile): FileValidationResult {
        // Check if file is empty
        if (file.isEmpty) {
            return FileValidationResult.invalid("File is empty")
        }

        // Check file size
        if (file.size > config.maxFileSize) {
            val maxSizeMB = config.maxFileSize / (1024 * 1024)
            return FileValidationResult.invalid("File size exceeds maximum allowed size of ${maxSizeMB}MB")
        }

        // Check MIME type
        val contentType = file.contentType
        if (contentType == null || !config.isAllowedType(contentType)) {
            return FileValidationResult.invalid("File type not allowed: $contentType. Allowed types: ${config.allowedTypes}")
        }

        // Additional security checks
        val originalName = file.originalFilename ?: ""
        if (originalName.contains("..")) {
            return FileValidationResult.invalid("Invalid file name")
        }

        return FileValidationResult.valid()
    }

    private fun getExtension(filename: String): String {
        val lastDot = filename.lastIndexOf('.')
        return if (lastDot > 0) {
            filename.substring(lastDot + 1).lowercase()
        } else {
            "bin"
        }
    }

    /**
     * Converts FileMetadata entity to StoredFile DTO.
     */
    private fun toStoredFile(metadata: FileMetadata): StoredFile {
        return StoredFile(
            id = metadata.id,
            originalName = metadata.originalName,
            storedName = metadata.storedName,
            mimeType = metadata.mimeType,
            size = metadata.fileSize,
            category = metadata.category,
            referenceId = metadata.referenceId,
            path = metadata.storagePath,
            url = metadata.url
        )
    }

    /**
     * Sets the tenant ID on the file metadata from the current context.
     */
    private fun setTenantId(metadata: FileMetadata) {
        val tenantId = TenantContext.getCurrentTenant()?.value
        if (tenantId != null) {
            // Use reflection to set tenantId on BaseEntity
            try {
                val field = metadata.javaClass.superclass.getDeclaredField("tenantId")
                field.isAccessible = true
                field.set(metadata, tenantId)
            } catch (e: Exception) {
                logger.warn("Could not set tenant ID on file metadata: ${e.message}")
            }
        }
    }
}
