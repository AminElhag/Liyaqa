package com.liyaqa.trainer.api

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
    private val trainerRepository: TrainerRepository
) {
    private val logger = LoggerFactory.getLogger(TrainerCertificationController::class.java)

    @PostMapping
    @PreAuthorize("hasAuthority('trainer_portal_update') or @trainerSecurityService.isOwnProfile(#trainerId)")
    @Operation(summary = "Create certification", description = "Create a new certification for a trainer")
    fun createCertification(
        @RequestParam trainerId: UUID,
        @Valid @RequestBody request: CreateCertificationRequest
    ): ResponseEntity<TrainerCertificationResponse> {
        logger.debug("Creating certification for trainer $trainerId: ${request.nameEn}")

        // Verify trainer exists
        val trainer = trainerRepository.findById(trainerId)
            .orElseThrow { NoSuchElementException("Trainer not found: $trainerId") }

        val certification = TrainerCertification(
            trainerId = trainerId,
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
        logger.info("Created certification ${saved.id} for trainer $trainerId")

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(TrainerCertificationResponse.from(saved))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isOwnProfile(#trainerId)")
    @Operation(summary = "List certifications", description = "Get all certifications for a trainer")
    fun getCertifications(@RequestParam trainerId: UUID): ResponseEntity<List<TrainerCertificationResponse>> {
        logger.debug("Fetching certifications for trainer $trainerId")

        val certifications = certificationRepository.findByTrainerId(trainerId, PageRequest.of(0, 100)).content
        val responses = certifications.map { TrainerCertificationResponse.from(it) }

        return ResponseEntity.ok(responses)
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
