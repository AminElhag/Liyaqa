package com.liyaqa.trainer.api

import com.liyaqa.trainer.application.services.TrainerSecurityService
import com.liyaqa.trainer.domain.model.TrainerCertification
import com.liyaqa.trainer.domain.ports.TrainerRepository
import com.liyaqa.trainer.infrastructure.persistence.JpaTrainerCertificationRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for trainer certification management.
 *
 * Endpoints:
 * - CRUD operations for trainer certifications
 * - List certifications by trainer
 */
@RestController
@RequestMapping("/api/trainer-portal/certifications")
@Tag(name = "Trainer Portal - Certifications", description = "Trainer certification management")
class TrainerCertificationController(
    private val certificationRepository: JpaTrainerCertificationRepository,
    private val trainerRepository: TrainerRepository,
    private val trainerSecurityService: TrainerSecurityService
) {
    private val logger = LoggerFactory.getLogger(TrainerCertificationController::class.java)

    @PostMapping
    @PreAuthorize("hasAuthority('trainer_portal_update') or @trainerSecurityService.isTrainer()")
    @Operation(summary = "Create certification", description = "Create a new certification for a trainer")
    fun createCertification(
        @RequestParam(required = false) trainerId: UUID? = null,
        @Valid @RequestBody request: CreateCertificationRequest
    ): ResponseEntity<TrainerCertificationResponse> {
        val resolvedTrainerId = trainerId ?: trainerSecurityService.getCurrentTrainerId()
            ?: throw NoSuchElementException("No trainer profile found for current user")
        logger.debug("Creating certification for trainer $resolvedTrainerId: ${request.nameEn}")

        // Verify trainer exists
        val trainer = trainerRepository.findById(resolvedTrainerId)
            .orElseThrow { NoSuchElementException("Trainer not found: $resolvedTrainerId") }

        val certification = TrainerCertification(
            trainerId = resolvedTrainerId,
            nameEn = request.nameEn,
            nameAr = request.nameAr,
            issuingOrganization = request.issuingOrganization,
            issuedDate = request.issuedDate,
            expiryDate = request.expiryDate,
            certificateNumber = request.certificateNumber,
            certificateFileUrl = request.certificateFileUrl
        )

        // tenantId and organizationId will be set automatically by @PrePersist hook
        val saved = certificationRepository.save(certification)
        logger.info("Created certification ${saved.id} for trainer $resolvedTrainerId")

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(TrainerCertificationResponse.from(saved))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isTrainer()")
    @Operation(summary = "List certifications", description = "Get all certifications for a trainer")
    fun getCertifications(
        @RequestParam(required = false) trainerId: UUID? = null,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<TrainerCertificationResponse>> {
        val resolvedTrainerId = trainerId ?: trainerSecurityService.getCurrentTrainerId()
            ?: throw NoSuchElementException("No trainer profile found for current user")
        logger.debug("Fetching certifications for trainer $resolvedTrainerId")

        val pageable = PageRequest.of(page, size)
        val certPage = certificationRepository.findByTrainerId(resolvedTrainerId, pageable)

        val response = PageResponse(
            content = certPage.content.map { TrainerCertificationResponse.from(it) },
            page = certPage.number,
            size = certPage.size,
            totalElements = certPage.totalElements,
            totalPages = certPage.totalPages,
            first = certPage.isFirst,
            last = certPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('trainer_portal_view')")
    @Operation(summary = "Get certification details", description = "Get a specific certification by ID")
    fun getCertification(@PathVariable id: UUID): ResponseEntity<TrainerCertificationResponse> {
        logger.debug("Fetching certification $id")

        val certification = certificationRepository.findById(id)
            .orElseThrow { NoSuchElementException("Certification not found: $id") }

        return ResponseEntity.ok(TrainerCertificationResponse.from(certification))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('trainer_portal_update')")
    @Operation(summary = "Update certification", description = "Update certification information")
    fun updateCertification(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateCertificationRequest
    ): ResponseEntity<TrainerCertificationResponse> {
        logger.debug("Updating certification $id")

        val certification = certificationRepository.findById(id)
            .orElseThrow { NoSuchElementException("Certification not found: $id") }

        // Update mutable fields
        request.nameEn?.let { certification.nameEn = it }
        request.nameAr?.let { certification.nameAr = it }
        request.issuingOrganization?.let { certification.issuingOrganization = it }
        request.issuedDate?.let { certification.issuedDate = it }
        request.expiryDate?.let { certification.renew(it) }
        request.certificateNumber?.let { certification.certificateNumber = it }
        request.certificateFileUrl?.let { certification.certificateFileUrl = it }
        request.status?.let { certification.status = it }

        val saved = certificationRepository.save(certification)
        logger.info("Updated certification $id")

        return ResponseEntity.ok(TrainerCertificationResponse.from(saved))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('trainer_portal_update')")
    @Operation(summary = "Delete certification", description = "Delete a certification")
    fun deleteCertification(@PathVariable id: UUID): ResponseEntity<Void> {
        logger.debug("Deleting certification $id")

        if (!certificationRepository.existsById(id)) {
            throw NoSuchElementException("Certification not found: $id")
        }

        certificationRepository.deleteById(id)
        logger.info("Deleted certification $id")

        return ResponseEntity.noContent().build()
    }
}
