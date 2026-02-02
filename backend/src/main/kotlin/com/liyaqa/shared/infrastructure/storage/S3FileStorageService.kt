package com.liyaqa.shared.infrastructure.storage

import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.model.FileMetadata
import com.liyaqa.shared.domain.ports.FileMetadataRepository
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.core.io.ByteArrayResource
import org.springframework.core.io.Resource
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.*
import software.amazon.awssdk.services.s3.presigner.S3Presigner
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest
import java.time.Duration
import java.util.UUID

/**
 * AWS S3 implementation of FileStorageService.
 *
 * Stores files in Amazon S3 with the following structure:
 * s3://{bucket}/{tenantId}/{category}/{referenceId}/{uuid}.{extension}
 *
 * Features:
 * - Multi-tenant isolation (files are stored in tenant-specific paths)
 * - Presigned URLs for direct client downloads
 * - Server-side encryption (AES256)
 * - Lifecycle policies (configure in S3 console)
 *
 * Configuration:
 * ```yaml
 * liyaqa:
 *   storage:
 *     type: s3
 *     s3:
 *       bucket: liyaqa-files-prod
 *       region: us-east-1
 * ```
 *
 * IAM permissions required:
 * - s3:PutObject
 * - s3:GetObject
 * - s3:DeleteObject
 * - s3:ListBucket
 */
@Service
@ConditionalOnProperty(prefix = "liyaqa.storage", name = ["type"], havingValue = "s3")
class S3FileStorageService(
    private val config: StorageConfig,
    private val fileMetadataRepository: FileMetadataRepository,
    private val s3Config: S3StorageConfig
) : FileStorageService {

    private val logger = LoggerFactory.getLogger(S3FileStorageService::class.java)
    private lateinit var s3Client: S3Client
    private lateinit var s3Presigner: S3Presigner

    @PostConstruct
    fun init() {
        val region = Region.of(s3Config.region)

        s3Client = S3Client.builder()
            .region(region)
            .build()

        s3Presigner = S3Presigner.builder()
            .region(region)
            .build()

        logger.info("S3 file storage initialized (bucket: ${s3Config.bucket}, region: ${s3Config.region})")

        // Verify bucket exists
        try {
            s3Client.headBucket { it.bucket(s3Config.bucket) }
        } catch (e: NoSuchBucketException) {
            throw IllegalStateException("S3 bucket does not exist: ${s3Config.bucket}", e)
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

        // Build S3 key: {tenantId}/{category}/{referenceId}/{uuid}.{extension}
        val tenantId = TenantContext.getCurrentTenant()?.value?.toString() ?: "global"
        val s3Key = buildS3Key(tenantId, category, referenceId, storedName)

        try {
            // Upload to S3 with server-side encryption
            val putRequest = PutObjectRequest.builder()
                .bucket(s3Config.bucket)
                .key(s3Key)
                .contentType(file.contentType ?: "application/octet-stream")
                .contentLength(file.size)
                .serverSideEncryption(ServerSideEncryption.AES256)
                .metadata(mapOf(
                    "original-name" to originalName,
                    "tenant-id" to tenantId.toString(),
                    "category" to category.name
                ))
                .build()

            s3Client.putObject(putRequest, RequestBody.fromBytes(file.bytes))

            // Generate presigned URL for public access (valid for 7 days)
            val url = generatePresignedUrl(s3Key, Duration.ofDays(7))

            // Create and save file metadata to database
            val metadata = FileMetadata(
                id = fileId,
                originalName = originalName,
                storedName = storedName,
                mimeType = file.contentType ?: "application/octet-stream",
                fileSize = file.size,
                category = category,
                referenceId = referenceId,
                storagePath = s3Key,
                url = url
            )

            setTenantId(metadata, tenantId)

            val savedMetadata = fileMetadataRepository.save(metadata)
            logger.info("File stored to S3: $fileId (${savedMetadata.originalName}) at $s3Key")

            return toStoredFile(savedMetadata)
        } catch (e: S3Exception) {
            logger.error("Failed to store file to S3: ${e.message}", e)
            throw RuntimeException("Failed to store file to S3: ${e.awsErrorDetails().errorMessage()}", e)
        } catch (e: Exception) {
            logger.error("Failed to store file: ${e.message}", e)
            throw RuntimeException("Failed to store file: ${e.message}", e)
        }
    }

    override fun load(fileId: UUID): Resource {
        val metadata = fileMetadataRepository.findById(fileId)
            .orElseThrow { NoSuchElementException("File not found: $fileId") }

        try {
            val getRequest = GetObjectRequest.builder()
                .bucket(s3Config.bucket)
                .key(metadata.storagePath)
                .build()

            val responseBytes = s3Client.getObjectAsBytes(getRequest).asByteArray()
            return ByteArrayResource(responseBytes)
        } catch (e: NoSuchKeyException) {
            throw NoSuchElementException("File not found in S3: $fileId")
        } catch (e: S3Exception) {
            logger.error("Failed to load file from S3: ${e.message}", e)
            throw RuntimeException("Failed to load file from S3: ${e.awsErrorDetails().errorMessage()}", e)
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
            val deleteRequest = DeleteObjectRequest.builder()
                .bucket(s3Config.bucket)
                .key(metadata.storagePath)
                .build()

            s3Client.deleteObject(deleteRequest)
            fileMetadataRepository.deleteById(fileId)
            logger.info("File deleted from S3: $fileId")

            return true
        } catch (e: S3Exception) {
            logger.error("Failed to delete file from S3: ${e.message}", e)
            return false
        }
    }

    override fun getUrl(fileId: UUID): String {
        val metadata = fileMetadataRepository.findById(fileId)
            .orElseThrow { NoSuchElementException("File not found: $fileId") }

        // Generate a new presigned URL (valid for 7 days)
        return generatePresignedUrl(metadata.storagePath, Duration.ofDays(7))
    }

    override fun validate(file: MultipartFile): FileValidationResult {
        if (file.isEmpty) {
            return FileValidationResult.invalid("File is empty")
        }

        if (file.size > config.maxFileSize) {
            val maxSizeMB = config.maxFileSize / (1024 * 1024)
            return FileValidationResult.invalid("File size exceeds maximum allowed size of ${maxSizeMB}MB")
        }

        val contentType = file.contentType
        if (contentType == null || !config.isAllowedType(contentType)) {
            return FileValidationResult.invalid("File type not allowed: $contentType")
        }

        val originalName = file.originalFilename ?: ""
        if (originalName.contains("..")) {
            return FileValidationResult.invalid("Invalid file name")
        }

        return FileValidationResult.valid()
    }

    /**
     * Generates a presigned URL for temporary access to a file.
     */
    private fun generatePresignedUrl(s3Key: String, duration: Duration): String {
        val getRequest = GetObjectRequest.builder()
            .bucket(s3Config.bucket)
            .key(s3Key)
            .build()

        val presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(duration)
            .getObjectRequest(getRequest)
            .build()

        return s3Presigner.presignGetObject(presignRequest).url().toString()
    }

    /**
     * Builds the S3 key (object path) for a file.
     */
    private fun buildS3Key(
        tenantId: String,
        category: FileCategory,
        referenceId: UUID?,
        storedName: String
    ): String {
        val categoryPath = category.name.lowercase()

        return if (referenceId != null) {
            "$tenantId/$categoryPath/$referenceId/$storedName"
        } else {
            "$tenantId/$categoryPath/$storedName"
        }
    }

    private fun getExtension(filename: String): String {
        val lastDot = filename.lastIndexOf('.')
        return if (lastDot > 0) {
            filename.substring(lastDot + 1).lowercase()
        } else {
            "bin"
        }
    }

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

    private fun setTenantId(metadata: FileMetadata, tenantId: String) {
        try {
            val field = metadata.javaClass.superclass.getDeclaredField("tenantId")
            field.isAccessible = true
            // Convert string to UUID if not "global"
            val tenantIdValue = if (tenantId == "global") null else UUID.fromString(tenantId)
            field.set(metadata, tenantIdValue)
        } catch (e: Exception) {
            logger.warn("Could not set tenant ID on file metadata: ${e.message}")
        }
    }
}
