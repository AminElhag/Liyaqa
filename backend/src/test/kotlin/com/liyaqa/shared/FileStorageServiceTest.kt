package com.liyaqa.shared

import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import com.liyaqa.shared.domain.model.FileMetadata
import com.liyaqa.shared.domain.ports.FileMetadataRepository
import com.liyaqa.shared.infrastructure.storage.FileCategory
import com.liyaqa.shared.infrastructure.storage.LocalFileStorageService
import com.liyaqa.shared.infrastructure.storage.LocalStorageConfig
import com.liyaqa.shared.infrastructure.storage.StorageConfig
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.jupiter.api.io.TempDir
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.mock.web.MockMultipartFile
import java.nio.file.Files
import java.nio.file.Path
import java.util.Optional
import java.util.UUID

/**
 * Unit tests for LocalFileStorageService.
 * Tests file storage, retrieval, deletion, and validation.
 */
@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FileStorageServiceTest {

    @Mock
    private lateinit var fileMetadataRepository: FileMetadataRepository

    private lateinit var config: StorageConfig
    private lateinit var storageService: LocalFileStorageService

    @TempDir
    lateinit var tempDir: Path

    private val testTenantId = UUID.randomUUID()
    private val testReferenceId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        // Configure storage to use temp directory
        config = StorageConfig().apply {
            local = LocalStorageConfig().apply {
                uploadDir = tempDir.toString()
            }
            maxFileSize = 10 * 1024 * 1024 // 10MB
            allowedTypes = listOf(
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
                "application/pdf"
            )
        }

        storageService = LocalFileStorageService(config, fileMetadataRepository)
        storageService.init()

        // Set tenant context
        TenantContext.setCurrentTenant(TenantId(testTenantId))
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    // ========== Store File Tests ==========

    @Test
    fun `store file successfully saves to disk and database`() {
        // Given
        val file = createMockFile("test-image.jpg", "image/jpeg", ByteArray(1024) { 0x01 })
        val savedMetadata = createFileMetadata(
            originalName = file.originalFilename!!,
            mimeType = file.contentType!!,
            fileSize = file.size,
            category = FileCategory.MEMBER_PROFILE,
            referenceId = testReferenceId
        )

        whenever(fileMetadataRepository.save(any<FileMetadata>())).thenReturn(savedMetadata)

        // When
        val result = storageService.store(file, FileCategory.MEMBER_PROFILE, testReferenceId)

        // Then
        assertNotNull(result)
        assertEquals("test-image.jpg", result.originalName)
        assertEquals("image/jpeg", result.mimeType)
        assertEquals(1024L, result.size)
        assertEquals(FileCategory.MEMBER_PROFILE, result.category)
        assertEquals(testReferenceId, result.referenceId)
        assertTrue(result.url.startsWith("/api/files/"))

        // Verify database save was called
        verify(fileMetadataRepository).save(any<FileMetadata>())
    }

    @Test
    fun `store file with empty content returns validation error`() {
        // Given
        val emptyFile = createMockFile("empty.jpg", "image/jpeg", ByteArray(0))

        // When
        val exception = org.junit.jupiter.api.assertThrows<IllegalArgumentException> {
            storageService.store(emptyFile, FileCategory.DOCUMENT)
        }

        // Then
        assertTrue(exception.message?.contains("empty") == true || exception.message?.contains("Empty") == true)
        verify(fileMetadataRepository, never()).save(any())
    }

    @Test
    fun `store file exceeding max size returns validation error`() {
        // Given - file larger than maxFileSize (10MB)
        val largeContent = ByteArray(11 * 1024 * 1024) { 0x01 }
        val largeFile = createMockFile("large.pdf", "application/pdf", largeContent)

        // When
        val exception = org.junit.jupiter.api.assertThrows<IllegalArgumentException> {
            storageService.store(largeFile, FileCategory.DOCUMENT)
        }

        // Then
        assertTrue(exception.message?.contains("size") == true)
        verify(fileMetadataRepository, never()).save(any())
    }

    @Test
    fun `store file with disallowed MIME type returns validation error`() {
        // Given - executable file type not in allowed list
        val exeFile = createMockFile("virus.exe", "application/x-msdownload", ByteArray(1024) { 0x01 })

        // When
        val exception = org.junit.jupiter.api.assertThrows<IllegalArgumentException> {
            storageService.store(exeFile, FileCategory.DOCUMENT)
        }

        // Then
        assertTrue(exception.message?.contains("type") == true || exception.message?.contains("allowed") == true)
        verify(fileMetadataRepository, never()).save(any())
    }

    @Test
    fun `store file with path traversal attempt returns validation error`() {
        // Given - filename with path traversal
        val maliciousFile = createMockFile("../../../etc/passwd", "text/plain", ByteArray(100) { 0x01 })

        // When
        val exception = org.junit.jupiter.api.assertThrows<IllegalArgumentException> {
            storageService.store(maliciousFile, FileCategory.DOCUMENT)
        }

        // Then - should reject files with ".." in the name
        assertNotNull(exception.message)
        verify(fileMetadataRepository, never()).save(any())
    }

    @Test
    fun `store file with correct category and referenceId`() {
        // Given
        val file = createMockFile("profile.png", "image/png", ByteArray(512) { 0x02 })
        val metadataCaptor = argumentCaptor<FileMetadata>()

        whenever(fileMetadataRepository.save(metadataCaptor.capture())).thenAnswer { invocation ->
            invocation.getArgument(0)
        }

        // When
        val result = storageService.store(file, FileCategory.MEMBER_PROFILE, testReferenceId)

        // Then
        val savedMetadata = metadataCaptor.firstValue
        assertEquals(FileCategory.MEMBER_PROFILE, savedMetadata.category)
        assertEquals(testReferenceId, savedMetadata.referenceId)
        assertEquals("profile.png", savedMetadata.originalName)
    }

    // ========== Load File Tests ==========

    @Test
    fun `load file returns correct resource`() {
        // Given - create a real file on disk
        val fileId = UUID.randomUUID()
        val content = "Test file content".toByteArray()
        val categoryDir = tempDir.resolve("member_profile")
        Files.createDirectories(categoryDir)
        val filePath = categoryDir.resolve("$fileId.txt")
        Files.write(filePath, content)

        val metadata = createFileMetadata(
            id = fileId,
            storagePath = filePath.toString()
        )

        whenever(fileMetadataRepository.findById(fileId)) doReturn Optional.of(metadata)

        // When
        val resource = storageService.load(fileId)

        // Then
        assertTrue(resource.exists())
        assertTrue(resource.isReadable)
    }

    @Test
    fun `load non-existent file throws NoSuchElementException`() {
        // Given
        val nonExistentId = UUID.randomUUID()
        whenever(fileMetadataRepository.findById(nonExistentId)) doReturn Optional.empty()

        // When/Then
        val exception = org.junit.jupiter.api.assertThrows<NoSuchElementException> {
            storageService.load(nonExistentId)
        }
        assertTrue(exception.message?.contains(nonExistentId.toString()) == true)
    }

    // ========== GetMetadata Tests ==========

    @Test
    fun `getMetadata returns correct StoredFile DTO`() {
        // Given
        val fileId = UUID.randomUUID()
        val metadata = createFileMetadata(
            id = fileId,
            originalName = "document.pdf",
            mimeType = "application/pdf",
            fileSize = 2048,
            category = FileCategory.INVOICE_RECEIPT,
            referenceId = testReferenceId
        )

        whenever(fileMetadataRepository.findById(fileId)) doReturn Optional.of(metadata)

        // When
        val result = storageService.getMetadata(fileId)

        // Then
        assertNotNull(result)
        assertEquals(fileId, result?.id)
        assertEquals("document.pdf", result?.originalName)
        assertEquals("application/pdf", result?.mimeType)
        assertEquals(2048L, result?.size)
        assertEquals(FileCategory.INVOICE_RECEIPT, result?.category)
        assertEquals(testReferenceId, result?.referenceId)
    }

    @Test
    fun `getMetadata for non-existent file returns null`() {
        // Given
        val nonExistentId = UUID.randomUUID()
        whenever(fileMetadataRepository.findById(nonExistentId)) doReturn Optional.empty()

        // When
        val result = storageService.getMetadata(nonExistentId)

        // Then
        assertNull(result)
    }

    // ========== Delete File Tests ==========

    @Test
    fun `delete file removes from disk and database`() {
        // Given - create a real file on disk
        val fileId = UUID.randomUUID()
        val categoryDir = tempDir.resolve("document")
        Files.createDirectories(categoryDir)
        val filePath = categoryDir.resolve("$fileId.pdf")
        Files.write(filePath, "PDF content".toByteArray())

        val metadata = createFileMetadata(
            id = fileId,
            storagePath = filePath.toString()
        )

        whenever(fileMetadataRepository.findById(fileId)) doReturn Optional.of(metadata)

        // Verify file exists before deletion
        assertTrue(Files.exists(filePath))

        // When
        val result = storageService.delete(fileId)

        // Then
        assertTrue(result)
        assertFalse(Files.exists(filePath))
        verify(fileMetadataRepository).deleteById(fileId)
    }

    @Test
    fun `delete non-existent file returns false`() {
        // Given
        val nonExistentId = UUID.randomUUID()
        whenever(fileMetadataRepository.findById(nonExistentId)) doReturn Optional.empty()

        // When
        val result = storageService.delete(nonExistentId)

        // Then
        assertFalse(result)
        verify(fileMetadataRepository, never()).deleteById(any())
    }

    // ========== GetUrl Tests ==========

    @Test
    fun `getUrl returns correct URL format`() {
        // Given
        val fileId = UUID.randomUUID()

        // When
        val url = storageService.getUrl(fileId)

        // Then
        assertEquals("/api/files/$fileId", url)
    }

    // ========== Validation Tests ==========

    @Test
    fun `validate returns valid for allowed file types`() {
        // Given
        val jpegFile = createMockFile("image.jpg", "image/jpeg", ByteArray(1024) { 0x01 })
        val pngFile = createMockFile("image.png", "image/png", ByteArray(1024) { 0x01 })
        val pdfFile = createMockFile("document.pdf", "application/pdf", ByteArray(1024) { 0x01 })

        // When/Then
        assertTrue(storageService.validate(jpegFile).valid)
        assertTrue(storageService.validate(pngFile).valid)
        assertTrue(storageService.validate(pdfFile).valid)
    }

    @Test
    fun `validate returns invalid for disallowed file types`() {
        // Given
        val exeFile = createMockFile("app.exe", "application/x-msdownload", ByteArray(1024) { 0x01 })
        val htmlFile = createMockFile("page.html", "text/html", ByteArray(1024) { 0x01 })

        // When
        val exeResult = storageService.validate(exeFile)
        val htmlResult = storageService.validate(htmlFile)

        // Then
        assertFalse(exeResult.valid)
        assertNotNull(exeResult.error)
        assertFalse(htmlResult.valid)
        assertNotNull(htmlResult.error)
    }

    @Test
    fun `validate returns invalid for empty files`() {
        // Given
        val emptyFile = createMockFile("empty.jpg", "image/jpeg", ByteArray(0))

        // When
        val result = storageService.validate(emptyFile)

        // Then
        assertFalse(result.valid)
        assertTrue(result.error?.lowercase()?.contains("empty") == true)
    }

    @Test
    fun `validate returns invalid for files exceeding max size`() {
        // Given
        val largeContent = ByteArray(11 * 1024 * 1024) { 0x01 }
        val largeFile = createMockFile("large.pdf", "application/pdf", largeContent)

        // When
        val result = storageService.validate(largeFile)

        // Then
        assertFalse(result.valid)
        assertTrue(result.error?.lowercase()?.contains("size") == true)
    }

    @Test
    fun `validate returns invalid for path traversal attempts`() {
        // Given
        val maliciousFile = createMockFile("../secret.txt", "text/plain", ByteArray(100) { 0x01 })

        // When
        val result = storageService.validate(maliciousFile)

        // Then
        assertFalse(result.valid)
    }

    // ========== Helper Methods ==========

    private fun createMockFile(
        filename: String,
        contentType: String,
        content: ByteArray
    ): MockMultipartFile {
        return MockMultipartFile(
            "file",
            filename,
            contentType,
            content
        )
    }

    private fun createFileMetadata(
        id: UUID = UUID.randomUUID(),
        originalName: String = "test-file.jpg",
        storedName: String = "$id.jpg",
        mimeType: String = "image/jpeg",
        fileSize: Long = 1024,
        category: FileCategory = FileCategory.DOCUMENT,
        referenceId: UUID? = null,
        storagePath: String = tempDir.resolve("$storedName").toString(),
        url: String = "/api/files/$id"
    ): FileMetadata {
        return FileMetadata(
            id = id,
            originalName = originalName,
            storedName = storedName,
            mimeType = mimeType,
            fileSize = fileSize,
            category = category,
            referenceId = referenceId,
            storagePath = storagePath,
            url = url
        )
    }
}
