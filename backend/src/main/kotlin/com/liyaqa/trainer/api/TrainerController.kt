package com.liyaqa.trainer.api

import com.liyaqa.auth.application.commands.ForgotPasswordCommand
import com.liyaqa.auth.application.services.AuthService
import com.liyaqa.auth.domain.ports.RefreshTokenRepository
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.scheduling.domain.ports.ClassCategoryRepository
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.trainer.application.commands.*
import com.liyaqa.trainer.application.services.TrainerService
import com.liyaqa.trainer.domain.model.TrainerStatus
import com.liyaqa.trainer.domain.model.TrainerType
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for trainer management.
 *
 * Endpoints:
 * - CRUD operations for trainers
 * - Status transitions
 * - Club assignments
 * - Availability management
 */
@RestController
@RequestMapping("/api/trainers")
@Tag(name = "Trainers", description = "Trainer management - create, update, and search trainers")
class TrainerController(
    private val trainerService: TrainerService,
    private val userRepository: UserRepository,
    private val clubRepository: ClubRepository,
    private val classCategoryRepository: ClassCategoryRepository,
    private val passwordEncoder: PasswordEncoder,
    private val authService: AuthService,
    private val refreshTokenRepository: RefreshTokenRepository
) {

    // ==================== CRUD OPERATIONS ====================

    @PostMapping
    @PreAuthorize("hasAuthority('trainers_create')")
    @Operation(summary = "Create a new trainer", description = "Create a trainer profile from an existing user")
    fun createTrainer(
        @Valid @RequestBody request: CreateTrainerRequest
    ): ResponseEntity<TrainerResponse> {
        val tenantId = TenantContext.getCurrentTenant()?.value
            ?: throw IllegalStateException("Tenant context not set")

        val command = CreateTrainerCommand(
            userId = request.userId,
            email = request.email?.takeIf { it.isNotBlank() },
            password = request.password?.takeIf { it.isNotBlank() },
            organizationId = request.organizationId,
            tenantId = tenantId,
            displayName = request.displayName?.toLocalizedText(),
            dateOfBirth = request.dateOfBirth,
            gender = request.gender,
            bio = request.bio?.toLocalizedText(),
            profileImageUrl = request.profileImageUrl,
            experienceYears = request.experienceYears,
            employmentType = request.employmentType,
            trainerType = request.trainerType,
            specializations = request.specializations,
            certifications = request.certifications?.map {
                CertificationInput(
                    name = it.name,
                    issuedBy = it.issuedBy,
                    issuedAt = it.issuedAt?.toString(),
                    expiresAt = it.expiresAt?.toString()
                )
            },
            hourlyRate = request.hourlyRate,
            ptSessionRate = request.ptSessionRate,
            compensationModel = request.compensationModel,
            phone = request.phone,
            notes = request.notes?.toLocalizedText(),
            assignedClubIds = request.assignedClubIds,
            primaryClubId = request.primaryClubId,
            skillCategoryIds = request.skillCategoryIds
        )

        val trainer = trainerService.createTrainer(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(buildTrainerResponse(trainer))
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('trainers_view')")
    @Operation(summary = "Get trainer by ID", description = "Retrieve a trainer's full profile")
    fun getTrainer(@PathVariable id: UUID): ResponseEntity<TrainerResponse> {
        val trainer = trainerService.getTrainer(id)
        return ResponseEntity.ok(buildTrainerResponse(trainer))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('trainers_view')")
    @Operation(summary = "List trainers", description = "List trainers with optional search and filtering")
    fun getTrainers(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) status: TrainerStatus?,
        @RequestParam(required = false) trainerType: TrainerType?,
        @RequestParam(required = false) clubId: UUID?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<TrainerSummaryResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))

        val trainerPage = if (clubId != null) {
            trainerService.getTrainersByClub(clubId, pageable)
        } else if (search != null || status != null || trainerType != null) {
            trainerService.searchTrainers(search, status, trainerType, pageable)
        } else {
            trainerService.getAllTrainers(pageable)
        }

        val response = PageResponse(
            content = trainerPage.content.map { buildTrainerSummaryResponse(it) },
            page = trainerPage.number,
            size = trainerPage.size,
            totalElements = trainerPage.totalElements,
            totalPages = trainerPage.totalPages,
            first = trainerPage.isFirst,
            last = trainerPage.isLast
        )

        return ResponseEntity.ok(response)
    }

    @GetMapping("/group-fitness")
    @PreAuthorize("hasAuthority('trainers_view')")
    @Operation(summary = "List group fitness trainers", description = "List trainers who can teach group classes")
    fun getGroupFitnessTrainers(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<TrainerSummaryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"))
        val trainerPage = trainerService.getActiveGroupFitnessTrainers(pageable)

        val response = PageResponse(
            content = trainerPage.content.map { buildTrainerSummaryResponse(it) },
            page = trainerPage.number,
            size = trainerPage.size,
            totalElements = trainerPage.totalElements,
            totalPages = trainerPage.totalPages,
            first = trainerPage.isFirst,
            last = trainerPage.isLast
        )

        return ResponseEntity.ok(response)
    }

    @GetMapping("/personal-trainers")
    @PreAuthorize("hasAuthority('trainers_view')")
    @Operation(summary = "List personal trainers", description = "List trainers who can provide personal training")
    fun getPersonalTrainers(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<TrainerSummaryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"))
        val trainerPage = trainerService.getActivePersonalTrainers(pageable)

        val response = PageResponse(
            content = trainerPage.content.map { buildTrainerSummaryResponse(it) },
            page = trainerPage.number,
            size = trainerPage.size,
            totalElements = trainerPage.totalElements,
            totalPages = trainerPage.totalPages,
            first = trainerPage.isFirst,
            last = trainerPage.isLast
        )

        return ResponseEntity.ok(response)
    }

    // ==================== UPDATE OPERATIONS ====================

    @PatchMapping("/{id}/profile")
    @PreAuthorize("hasAuthority('trainers_update') or @trainerSecurityService.isOwnProfile(#id)")
    @Operation(summary = "Update trainer profile", description = "Update trainer's profile information")
    fun updateTrainerProfile(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTrainerProfileRequest
    ): ResponseEntity<TrainerResponse> {
        val command = UpdateTrainerProfileCommand(
            trainerId = id,
            bio = request.bio?.toLocalizedText(),
            profileImageUrl = request.profileImageUrl,
            experienceYears = request.experienceYears,
            phone = request.phone
        )

        val trainer = trainerService.updateTrainerProfile(command)
        return ResponseEntity.ok(buildTrainerResponse(trainer))
    }

    @PatchMapping("/{id}/classification")
    @PreAuthorize("hasAuthority('trainers_update')")
    @Operation(summary = "Update trainer classification", description = "Update trainer's employment and trainer type")
    fun updateTrainerClassification(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTrainerClassificationRequest
    ): ResponseEntity<TrainerResponse> {
        val command = UpdateTrainerClassificationCommand(
            trainerId = id,
            employmentType = request.employmentType,
            trainerType = request.trainerType
        )

        val trainer = trainerService.updateTrainerClassification(command)
        return ResponseEntity.ok(buildTrainerResponse(trainer))
    }

    @PatchMapping("/{id}/qualifications")
    @PreAuthorize("hasAuthority('trainers_update') or @trainerSecurityService.isOwnProfile(#id)")
    @Operation(summary = "Update trainer qualifications", description = "Update trainer's specializations and certifications")
    fun updateTrainerQualifications(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTrainerQualificationsRequest
    ): ResponseEntity<TrainerResponse> {
        val command = UpdateTrainerQualificationsCommand(
            trainerId = id,
            specializations = request.specializations,
            certifications = request.certifications?.map {
                CertificationInput(
                    name = it.name,
                    issuedBy = it.issuedBy,
                    issuedAt = it.issuedAt?.toString(),
                    expiresAt = it.expiresAt?.toString()
                )
            }
        )

        val trainer = trainerService.updateTrainerQualifications(command)
        return ResponseEntity.ok(buildTrainerResponse(trainer))
    }

    @PatchMapping("/{id}/compensation")
    @PreAuthorize("hasAuthority('trainers_update')")
    @Operation(summary = "Update trainer compensation", description = "Update trainer's compensation information (admin only)")
    fun updateTrainerCompensation(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTrainerCompensationRequest
    ): ResponseEntity<TrainerResponse> {
        val command = UpdateTrainerCompensationCommand(
            trainerId = id,
            hourlyRate = request.hourlyRate,
            ptSessionRate = request.ptSessionRate,
            compensationModel = request.compensationModel
        )

        val trainer = trainerService.updateTrainerCompensation(command)
        return ResponseEntity.ok(buildTrainerResponse(trainer))
    }

    @PutMapping("/{id}/availability")
    @PreAuthorize("hasAuthority('trainers_update') or @trainerSecurityService.isOwnProfile(#id)")
    @Operation(summary = "Update trainer availability", description = "Set trainer's weekly availability for personal training")
    fun updateTrainerAvailability(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTrainerAvailabilityRequest
    ): ResponseEntity<TrainerResponse> {
        val command = UpdateTrainerAvailabilityCommand(
            trainerId = id,
            availability = com.liyaqa.trainer.application.commands.AvailabilityInput(
                monday = request.availability.monday?.map { com.liyaqa.trainer.application.commands.TimeSlotInput(it.start, it.end) },
                tuesday = request.availability.tuesday?.map { com.liyaqa.trainer.application.commands.TimeSlotInput(it.start, it.end) },
                wednesday = request.availability.wednesday?.map { com.liyaqa.trainer.application.commands.TimeSlotInput(it.start, it.end) },
                thursday = request.availability.thursday?.map { com.liyaqa.trainer.application.commands.TimeSlotInput(it.start, it.end) },
                friday = request.availability.friday?.map { com.liyaqa.trainer.application.commands.TimeSlotInput(it.start, it.end) },
                saturday = request.availability.saturday?.map { com.liyaqa.trainer.application.commands.TimeSlotInput(it.start, it.end) },
                sunday = request.availability.sunday?.map { com.liyaqa.trainer.application.commands.TimeSlotInput(it.start, it.end) }
            )
        )

        val trainer = trainerService.updateTrainerAvailability(command)
        return ResponseEntity.ok(buildTrainerResponse(trainer))
    }

    @GetMapping("/{id}/availability")
    @PreAuthorize("hasAuthority('trainers_view')")
    @Operation(summary = "Get trainer availability", description = "Get trainer's weekly availability for booking")
    fun getTrainerAvailability(@PathVariable id: UUID): ResponseEntity<Any> {
        val trainer = trainerService.getTrainer(id)
        val availability = trainerService.deserializeAvailability(trainer.availability)
        return if (availability != null) {
            ResponseEntity.ok(AvailabilityResponse.from(availability))
        } else {
            ResponseEntity.ok(emptyMap<String, Any>())
        }
    }

    @PatchMapping("/{id}/basic-info")
    @PreAuthorize("hasAuthority('trainers_update') or @trainerSecurityService.isOwnProfile(#id)")
    @Operation(summary = "Update trainer basic info", description = "Update trainer's display name, date of birth, and gender")
    fun updateTrainerBasicInfo(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTrainerBasicInfoRequest
    ): ResponseEntity<TrainerResponse> {
        val command = UpdateTrainerBasicInfoCommand(
            trainerId = id,
            displayName = request.displayName?.toLocalizedText(),
            dateOfBirth = request.dateOfBirth,
            gender = request.gender
        )

        val trainer = trainerService.updateTrainerBasicInfo(command)
        return ResponseEntity.ok(buildTrainerResponse(trainer))
    }

    // ==================== STATUS TRANSITIONS ====================

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('trainers_update')")
    @Operation(summary = "Activate trainer", description = "Activate an inactive or on-leave trainer")
    fun activateTrainer(@PathVariable id: UUID): ResponseEntity<TrainerResponse> {
        val trainer = trainerService.activateTrainer(id)
        return ResponseEntity.ok(buildTrainerResponse(trainer))
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('trainers_update')")
    @Operation(summary = "Deactivate trainer", description = "Temporarily deactivate a trainer")
    fun deactivateTrainer(@PathVariable id: UUID): ResponseEntity<TrainerResponse> {
        val trainer = trainerService.deactivateTrainer(id)
        return ResponseEntity.ok(buildTrainerResponse(trainer))
    }

    @PostMapping("/{id}/set-on-leave")
    @PreAuthorize("hasAuthority('trainers_update')")
    @Operation(summary = "Set trainer on leave", description = "Mark trainer as on extended leave")
    fun setTrainerOnLeave(@PathVariable id: UUID): ResponseEntity<TrainerResponse> {
        val trainer = trainerService.setTrainerOnLeave(id)
        return ResponseEntity.ok(buildTrainerResponse(trainer))
    }

    @PostMapping("/{id}/return-from-leave")
    @PreAuthorize("hasAuthority('trainers_update')")
    @Operation(summary = "Return trainer from leave", description = "Mark trainer as returned from leave")
    fun returnTrainerFromLeave(@PathVariable id: UUID): ResponseEntity<TrainerResponse> {
        val trainer = trainerService.returnTrainerFromLeave(id)
        return ResponseEntity.ok(buildTrainerResponse(trainer))
    }

    @PostMapping("/{id}/terminate")
    @PreAuthorize("hasAuthority('trainers_update')")
    @Operation(summary = "Terminate trainer", description = "Terminate trainer (deactivates all club assignments)")
    fun terminateTrainer(@PathVariable id: UUID): ResponseEntity<TrainerResponse> {
        val trainer = trainerService.terminateTrainer(id)
        return ResponseEntity.ok(buildTrainerResponse(trainer))
    }

    // ==================== CLUB ASSIGNMENTS ====================

    @GetMapping("/{id}/clubs")
    @PreAuthorize("hasAuthority('trainers_view')")
    @Operation(summary = "Get trainer's clubs", description = "Get all clubs the trainer is assigned to")
    fun getTrainerClubs(@PathVariable id: UUID): ResponseEntity<List<TrainerClubAssignmentResponse>> {
        val assignments = trainerService.getActiveTrainerClubAssignments(id)
        val responses = assignments.map { assignment ->
            val club = clubRepository.findById(assignment.clubId).orElse(null)
            TrainerClubAssignmentResponse.from(
                assignment = assignment,
                clubName = club?.name?.get("en")
            )
        }
        return ResponseEntity.ok(responses)
    }

    @PostMapping("/{id}/clubs")
    @PreAuthorize("hasAuthority('trainers_update')")
    @Operation(summary = "Assign trainer to club", description = "Assign a trainer to a club")
    fun assignTrainerToClub(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AssignTrainerToClubRequest
    ): ResponseEntity<TrainerClubAssignmentResponse> {
        val command = AssignTrainerToClubCommand(
            trainerId = id,
            clubId = request.clubId,
            isPrimary = request.isPrimary
        )

        val assignment = trainerService.assignTrainerToClub(command)
        val club = clubRepository.findById(assignment.clubId).orElse(null)

        return ResponseEntity.status(HttpStatus.CREATED).body(
            TrainerClubAssignmentResponse.from(
                assignment = assignment,
                clubName = club?.name?.get("en")
            )
        )
    }

    @DeleteMapping("/{id}/clubs/{clubId}")
    @PreAuthorize("hasAuthority('trainers_update')")
    @Operation(summary = "Remove trainer from club", description = "Remove a trainer's assignment to a club")
    fun removeTrainerFromClub(
        @PathVariable id: UUID,
        @PathVariable clubId: UUID
    ): ResponseEntity<Void> {
        val command = RemoveTrainerFromClubCommand(
            trainerId = id,
            clubId = clubId
        )

        trainerService.removeTrainerFromClub(command)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/{id}/clubs/{clubId}/set-primary")
    @PreAuthorize("hasAuthority('trainers_update')")
    @Operation(summary = "Set primary club", description = "Set a club as the trainer's primary club")
    fun setPrimaryClub(
        @PathVariable id: UUID,
        @PathVariable clubId: UUID
    ): ResponseEntity<TrainerClubAssignmentResponse> {
        val assignment = trainerService.setPrimaryClub(id, clubId)
        val club = clubRepository.findById(assignment.clubId).orElse(null)

        return ResponseEntity.ok(
            TrainerClubAssignmentResponse.from(
                assignment = assignment,
                clubName = club?.name?.get("en")
            )
        )
    }

    // ==================== SKILLS ====================

    @PutMapping("/{id}/skills")
    @PreAuthorize("hasAuthority('trainers_update')")
    @Operation(summary = "Update trainer skills", description = "Set the class categories a trainer can teach")
    fun updateTrainerSkills(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTrainerSkillsRequest
    ): ResponseEntity<TrainerResponse> {
        val command = UpdateTrainerSkillsCommand(
            trainerId = id,
            categoryIds = request.categoryIds
        )
        trainerService.updateTrainerSkills(command)
        val trainer = trainerService.getTrainer(id)
        return ResponseEntity.ok(buildTrainerResponse(trainer))
    }

    // ==================== DELETE ====================

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('trainers_delete')")
    @Operation(summary = "Delete trainer", description = "Permanently delete a trainer profile")
    fun deleteTrainer(@PathVariable id: UUID): ResponseEntity<Void> {
        trainerService.deleteTrainer(id)
        return ResponseEntity.noContent().build()
    }

    // ==================== PASSWORD MANAGEMENT ====================

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('trainers_update')")
    @Operation(summary = "Reset trainer password", description = "Admin sets a new password for the trainer")
    fun resetTrainerPassword(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ResetTrainerPasswordRequest
    ): ResponseEntity<Map<String, String>> {
        val trainer = trainerService.getTrainer(id)
        val userId = trainer.userId
            ?: throw IllegalStateException("Trainer $id has no linked user account")

        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found with id: $userId") }

        user.changePassword(passwordEncoder.encode(request.newPassword))
        userRepository.save(user)

        // Revoke all refresh tokens to force re-login
        refreshTokenRepository.revokeAllByUserId(userId)

        return ResponseEntity.ok(mapOf("message" to "Password reset successfully"))
    }

    @PostMapping("/{id}/send-reset-email")
    @PreAuthorize("hasAuthority('trainers_update')")
    @Operation(summary = "Send password reset email", description = "Admin triggers a password reset email for the trainer")
    fun sendTrainerResetEmail(@PathVariable id: UUID): ResponseEntity<Map<String, String>> {
        val trainer = trainerService.getTrainer(id)
        val userId = trainer.userId
            ?: throw IllegalStateException("Trainer $id has no linked user account")

        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found with id: $userId") }

        val tenantId = TenantContext.getCurrentTenant()?.value
            ?: throw IllegalStateException("Tenant context not set")

        authService.forgotPassword(
            ForgotPasswordCommand(email = user.email, tenantId = tenantId)
        )

        return ResponseEntity.ok(mapOf("message" to "Password reset email sent"))
    }

    // ==================== HELPER METHODS ====================

    private fun buildSkillResponses(trainerId: UUID): List<TrainerSkillResponse> {
        val skills = trainerService.getTrainerSkills(trainerId)
        return skills.mapNotNull { skill ->
            val category = classCategoryRepository.findById(skill.categoryId).orElse(null)
            if (category != null) {
                TrainerSkillResponse(
                    categoryId = category.id,
                    categoryName = category.name,
                    colorCode = category.colorCode,
                    icon = category.icon
                )
            } else null
        }
    }

    private fun buildTrainerSummaryResponse(trainer: com.liyaqa.trainer.domain.model.Trainer): TrainerSummaryResponse {
        val user = trainer.userId?.let { userRepository.findById(it).orElse(null) }
        val specializations = trainerService.deserializeSpecializations(trainer.specializations)
        val skills = buildSkillResponses(trainer.id)
        return TrainerSummaryResponse.from(
            trainer = trainer,
            specializations = specializations,
            userName = user?.displayName?.get("en"),
            userEmail = user?.email,
            skills = skills
        )
    }

    private fun buildTrainerResponse(trainer: com.liyaqa.trainer.domain.model.Trainer): TrainerResponse {
        val user = trainer.userId?.let { userRepository.findById(it).orElse(null) }
        val specializations = trainerService.deserializeSpecializations(trainer.specializations)
        val certifications = trainerService.deserializeCertifications(trainer.certifications)
        val availability = trainerService.deserializeAvailability(trainer.availability)
        val clubAssignments = trainerService.getActiveTrainerClubAssignments(trainer.id).map { assignment ->
            val club = clubRepository.findById(assignment.clubId).orElse(null)
            TrainerClubAssignmentResponse.from(
                assignment = assignment,
                clubName = club?.name?.get("en")
            )
        }
        val skills = buildSkillResponses(trainer.id)

        return TrainerResponse.from(
            trainer = trainer,
            specializations = specializations,
            certifications = certifications,
            availability = availability,
            userName = user?.displayName?.get("en"),
            userEmail = user?.email,
            clubAssignments = clubAssignments,
            skills = skills
        )
    }
}

/**
 * Page response wrapper for paginated results.
 */
data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
