package com.liyaqa.shared.api

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.membership.application.services.MemberService
import com.liyaqa.shared.infrastructure.storage.FileCategory
import com.liyaqa.shared.infrastructure.storage.FileStorageService
import com.liyaqa.shared.infrastructure.storage.StoredFile
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.util.UUID

/**
 * REST controller for file upload and download operations.
 */
@RestController
@RequestMapping("/api/files")
@Tag(name = "Files", description = "File upload and download operations")
class FileController(
    private val storageService: FileStorageService,
    private val memberService: MemberService
) {

    /**
     * Uploads a file.
     */
    @PostMapping("/upload", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasAuthority('files_upload')")
    @Operation(summary = "Upload file", description = "Uploads a file to the server")
    fun uploadFile(
        @RequestParam("file") file: MultipartFile,
        @RequestParam("category", required = false, defaultValue = "OTHER") category: String,
        @RequestParam("referenceId", required = false) referenceId: UUID?
    ): ResponseEntity<FileUploadResponse> {
        val validation = storageService.validate(file)
        if (!validation.valid) {
            return ResponseEntity.badRequest().body(
                FileUploadResponse(
                    success = false,
                    error = validation.error
                )
            )
        }

        val fileCategory = try {
            FileCategory.valueOf(category.uppercase())
        } catch (e: IllegalArgumentException) {
            FileCategory.OTHER
        }

        val storedFile = storageService.store(file, fileCategory, referenceId)

        return ResponseEntity.status(HttpStatus.CREATED).body(
            FileUploadResponse(
                success = true,
                file = FileResponse.from(storedFile)
            )
        )
    }

    /**
     * Uploads a member profile photo.
     */
    @PostMapping("/members/{memberId}/photo", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasAuthority('files_upload')")
    @Operation(summary = "Upload member photo", description = "Uploads a profile photo for a member")
    fun uploadMemberPhoto(
        @PathVariable memberId: UUID,
        @RequestParam("file") file: MultipartFile
    ): ResponseEntity<FileUploadResponse> {
        val validation = storageService.validate(file)
        if (!validation.valid) {
            return ResponseEntity.badRequest().body(
                FileUploadResponse(
                    success = false,
                    error = validation.error
                )
            )
        }

        // Check if it's an image
        val contentType = file.contentType ?: ""
        if (!contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(
                FileUploadResponse(
                    success = false,
                    error = "Profile photo must be an image file"
                )
            )
        }

        val storedFile = storageService.store(file, FileCategory.MEMBER_PROFILE, memberId)

        return ResponseEntity.status(HttpStatus.CREATED).body(
            FileUploadResponse(
                success = true,
                file = FileResponse.from(storedFile)
            )
        )
    }

    /**
     * Uploads an invoice receipt attachment.
     */
    @PostMapping("/invoices/{invoiceId}/receipt", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasAuthority('files_upload')")
    @Operation(summary = "Upload invoice receipt", description = "Uploads a receipt attachment for an invoice")
    fun uploadInvoiceReceipt(
        @PathVariable invoiceId: UUID,
        @RequestParam("file") file: MultipartFile
    ): ResponseEntity<FileUploadResponse> {
        val validation = storageService.validate(file)
        if (!validation.valid) {
            return ResponseEntity.badRequest().body(
                FileUploadResponse(
                    success = false,
                    error = validation.error
                )
            )
        }

        val storedFile = storageService.store(file, FileCategory.INVOICE_RECEIPT, invoiceId)

        return ResponseEntity.status(HttpStatus.CREATED).body(
            FileUploadResponse(
                success = true,
                file = FileResponse.from(storedFile)
            )
        )
    }

    /**
     * Downloads a file by ID.
     * For MEMBER_PROFILE files, verifies the requester is the owner or has admin/staff role.
     */
    @GetMapping("/{fileId}")
    @PreAuthorize("hasAuthority('files_view')")
    @Operation(summary = "Download file", description = "Downloads a file by its ID")
    fun downloadFile(
        @PathVariable fileId: UUID,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<Resource> {
        val metadata = storageService.getMetadata(fileId)
            ?: return ResponseEntity.notFound().build()

        // Owner verification for member profile files
        if (metadata.category == FileCategory.MEMBER_PROFILE) {
            val isAdminOrStaff = principal.role in listOf(Role.SUPER_ADMIN, Role.CLUB_ADMIN, Role.STAFF)
            if (!isAdminOrStaff) {
                // Check if user is the owner of this profile photo
                val member = memberService.findMemberByUserId(principal.userId)
                if (member == null || metadata.referenceId != member.id) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
                }
            }
        }

        val resource = storageService.load(fileId)

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(metadata.mimeType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"${metadata.originalName}\"")
            .body(resource)
    }

    /**
     * Gets file metadata.
     * For MEMBER_PROFILE files, verifies the requester is the owner or has admin/staff role.
     */
    @GetMapping("/{fileId}/metadata")
    @PreAuthorize("hasAuthority('files_view')")
    @Operation(summary = "Get file metadata", description = "Gets metadata for a file")
    fun getFileMetadata(
        @PathVariable fileId: UUID,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<FileResponse> {
        val metadata = storageService.getMetadata(fileId)
            ?: return ResponseEntity.notFound().build()

        // Owner verification for member profile files
        if (metadata.category == FileCategory.MEMBER_PROFILE) {
            val isAdminOrStaff = principal.role in listOf(Role.SUPER_ADMIN, Role.CLUB_ADMIN, Role.STAFF)
            if (!isAdminOrStaff) {
                val member = memberService.findMemberByUserId(principal.userId)
                if (member == null || metadata.referenceId != member.id) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
                }
            }
        }

        return ResponseEntity.ok(FileResponse.from(metadata))
    }

    /**
     * Deletes a file.
     */
    @DeleteMapping("/{fileId}")
    @PreAuthorize("hasAuthority('files_delete')")
    @Operation(summary = "Delete file", description = "Deletes a file by its ID")
    fun deleteFile(
        @PathVariable fileId: UUID
    ): ResponseEntity<DeleteFileResponse> {
        val deleted = storageService.delete(fileId)

        return if (deleted) {
            ResponseEntity.ok(DeleteFileResponse(success = true))
        } else {
            ResponseEntity.notFound().build()
        }
    }
}

// Response DTOs

data class FileUploadResponse(
    val success: Boolean,
    val file: FileResponse? = null,
    val error: String? = null
)

data class FileResponse(
    val id: UUID,
    val originalName: String,
    val mimeType: String,
    val size: Long,
    val category: String,
    val url: String
) {
    companion object {
        fun from(file: StoredFile) = FileResponse(
            id = file.id,
            originalName = file.originalName,
            mimeType = file.mimeType,
            size = file.size,
            category = file.category.name,
            url = file.url
        )
    }
}

data class DeleteFileResponse(
    val success: Boolean
)
