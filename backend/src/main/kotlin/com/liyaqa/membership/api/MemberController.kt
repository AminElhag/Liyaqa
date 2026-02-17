package com.liyaqa.membership.api

import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.membership.application.commands.CreateMemberCommand
import com.liyaqa.membership.application.commands.HealthInfoCommand
import com.liyaqa.membership.application.commands.UpdateMemberCommand
import com.liyaqa.membership.application.services.MemberService
import com.liyaqa.membership.domain.model.Language
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.shared.api.BulkItemResult
import com.liyaqa.shared.api.BulkItemStatus
import com.liyaqa.shared.api.BulkOperationResponse
import com.liyaqa.shared.api.validateBulkSize
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/members")
@Tag(name = "Members", description = "Member management - create, update, and search gym members")
class MemberController(
    private val memberService: MemberService,
    private val userRepository: UserRepository
) {

    @PostMapping
    @PreAuthorize("hasAuthority('members_create')")
    @Operation(summary = "Create a new member", description = "Create a member with optional health info and agreement signing")
    fun createMember(
        @Valid @RequestBody request: CreateMemberRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<MemberResponse> {
        val command = CreateMemberCommand(
            firstName = request.firstName.toLocalizedText(),
            lastName = request.lastName.toLocalizedText(),
            email = request.email,
            phone = request.phone,
            dateOfBirth = request.dateOfBirth,
            address = request.address?.toLocalizedText(),
            emergencyContactName = request.emergencyContactName,
            emergencyContactPhone = request.emergencyContactPhone,
            notes = request.notes?.en,
            // Enhanced registration fields
            gender = request.gender,
            nationality = request.nationality,
            nationalId = request.nationalId,
            registrationNotes = request.registrationNotes,
            preferredLanguage = request.preferredLanguage,
            // Health info
            healthInfo = request.healthInfo?.let { health ->
                HealthInfoCommand(
                    hasHeartCondition = health.hasHeartCondition,
                    hasChestPainDuringActivity = health.hasChestPainDuringActivity,
                    hasChestPainAtRest = health.hasChestPainAtRest,
                    hasDizzinessOrBalance = health.hasDizzinessOrBalance,
                    hasBoneJointProblem = health.hasBoneJointProblem,
                    takesBloodPressureMedication = health.takesBloodPressureMedication,
                    hasOtherReasonNotToExercise = health.hasOtherReasonNotToExercise,
                    medicalConditions = health.medicalConditions,
                    allergies = health.allergies,
                    currentMedications = health.currentMedications,
                    injuriesAndLimitations = health.injuriesAndLimitations,
                    bloodType = health.bloodType,
                    emergencyMedicalNotes = health.emergencyMedicalNotes,
                    doctorName = health.doctorName,
                    doctorPhone = health.doctorPhone,
                    medicalClearanceDate = health.medicalClearanceDate
                )
            },
            // Agreements
            agreementIds = request.agreementIds,
            signatureData = request.signatureData,
            ipAddress = getClientIpAddress(httpRequest),
            userAgent = httpRequest.getHeader("User-Agent")
        )

        val member = memberService.createMember(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(MemberResponse.from(member))
    }

    private fun getClientIpAddress(request: HttpServletRequest): String {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        return if (!xForwardedFor.isNullOrEmpty()) {
            xForwardedFor.split(",")[0].trim()
        } else {
            request.remoteAddr ?: "unknown"
        }
    }

    @GetMapping("/{id}")
    fun getMember(@PathVariable id: UUID): ResponseEntity<MemberResponse> {
        val member = memberService.getMember(id)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    /**
     * Gets all members with optional search and filtering.
     *
     * @param search Search term for name or email (case-insensitive, partial match)
     * @param status Filter by member status (ACTIVE, SUSPENDED, FROZEN, CANCELLED, PENDING)
     * @param joinedAfter Filter members who joined on or after this date (ISO format: YYYY-MM-DD)
     * @param joinedBefore Filter members who joined on or before this date (ISO format: YYYY-MM-DD)
     */
    @GetMapping
    fun getAllMembers(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) status: MemberStatus?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) joinedAfter: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) joinedBefore: LocalDate?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<MemberResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))

        // Use search if any filter is provided, otherwise get all
        val memberPage = if (search != null || status != null || joinedAfter != null || joinedBefore != null) {
            memberService.searchMembers(search, status, joinedAfter, joinedBefore, pageable)
        } else {
            memberService.getAllMembers(pageable)
        }

        val response = PageResponse(
            content = memberPage.content.map { MemberResponse.from(it) },
            page = memberPage.number,
            size = memberPage.size,
            totalElements = memberPage.totalElements,
            totalPages = memberPage.totalPages,
            first = memberPage.isFirst,
            last = memberPage.isLast
        )

        return ResponseEntity.ok(response)
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('members_update')")
    fun updateMember(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateMemberRequest
    ): ResponseEntity<MemberResponse> {
        val command = UpdateMemberCommand(
            firstName = request.firstName?.toLocalizedText(),
            lastName = request.lastName?.toLocalizedText(),
            phone = request.phone,
            dateOfBirth = request.dateOfBirth,
            address = request.address?.toLocalizedText(),
            emergencyContactName = request.emergencyContactName,
            emergencyContactPhone = request.emergencyContactPhone,
            notes = request.notes?.en,
            // Enhanced fields
            gender = request.gender,
            nationality = request.nationality,
            nationalId = request.nationalId,
            registrationNotes = request.registrationNotes,
            preferredLanguage = request.preferredLanguage
        )

        val member = memberService.updateMember(id, command)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasAuthority('members_update')")
    fun suspendMember(@PathVariable id: UUID): ResponseEntity<MemberResponse> {
        val member = memberService.suspendMember(id)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('members_update')")
    fun activateMember(@PathVariable id: UUID): ResponseEntity<MemberResponse> {
        val member = memberService.activateMember(id)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    @PostMapping("/{id}/freeze")
    @PreAuthorize("hasAuthority('members_update')")
    fun freezeMember(@PathVariable id: UUID): ResponseEntity<MemberResponse> {
        val member = memberService.freezeMember(id)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    @PostMapping("/{id}/unfreeze")
    @PreAuthorize("hasAuthority('members_update')")
    fun unfreezeMember(@PathVariable id: UUID): ResponseEntity<MemberResponse> {
        val member = memberService.unfreezeMember(id)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('members_delete')")
    fun cancelMember(@PathVariable id: UUID): ResponseEntity<MemberResponse> {
        val member = memberService.cancelMember(id)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('members_delete')")
    fun deleteMember(@PathVariable id: UUID): ResponseEntity<Void> {
        memberService.deleteMember(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/count")
    fun countMembers(): ResponseEntity<Map<String, Long>> {
        val count = memberService.countMembers()
        return ResponseEntity.ok(mapOf("count" to count))
    }

    // ==================== USER ACCOUNT MANAGEMENT ====================

    /**
     * Create a user account for a member.
     * This allows the member to log in and access member features like shopping.
     */
    @PostMapping("/{id}/user")
    @PreAuthorize("hasAuthority('users_create')")
    @Operation(summary = "Create user account for member", description = "Create a login account for a member with MEMBER role")
    fun createUserForMember(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreateUserForMemberRequest
    ): ResponseEntity<UserAccountResponse> {
        val user = memberService.createUserForMember(id, request.password)
        return ResponseEntity.status(HttpStatus.CREATED).body(UserAccountResponse(
            userId = user.id,
            email = user.email,
            role = user.role.name,
            status = user.status.name
        ))
    }

    /**
     * Unlink a user account from a member.
     */
    @DeleteMapping("/{id}/user")
    @PreAuthorize("hasAuthority('users_delete')")
    @Operation(summary = "Unlink user account from member", description = "Remove the user account link from a member")
    fun unlinkUserFromMember(@PathVariable id: UUID): ResponseEntity<MemberResponse> {
        val member = memberService.unlinkUserFromMember(id)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    /**
     * Link an existing user account to a member.
     */
    @PostMapping("/{id}/link-user")
    @PreAuthorize("hasAuthority('users_update')")
    @Operation(summary = "Link existing user to member", description = "Link an existing user account to a member")
    fun linkUserToMember(
        @PathVariable id: UUID,
        @Valid @RequestBody request: LinkUserToMemberRequest
    ): ResponseEntity<MemberResponse> {
        val member = memberService.linkUserToMember(id, request.userId)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    /**
     * Reset a member's password (admin action).
     * Sets a new password and revokes all refresh tokens for security.
     */
    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAnyAuthority('users_update', 'members_update')")
    @Operation(summary = "Reset member password (admin)", description = "Reset a member's password and revoke all sessions")
    fun resetMemberPassword(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AdminResetPasswordRequest
    ): ResponseEntity<Map<String, String>> {
        memberService.resetMemberPassword(id, request.newPassword)
        return ResponseEntity.ok(mapOf("message" to "Password reset successfully"))
    }

    @PostMapping("/{id}/view")
    @PreAuthorize("hasAnyAuthority('members_view', 'activities_view')")
    @Operation(summary = "Log profile view", description = "Log that a staff member viewed this member's profile")
    fun logProfileView(
        @PathVariable id: UUID,
        @AuthenticationPrincipal user: UserDetails?
    ): ResponseEntity<Void> {
        val staffUserId = user?.let {
            try { UUID.fromString(it.username) } catch (_: Exception) { null }
        }
        val staffUser = staffUserId?.let { userRepository.findById(it).orElse(null) }
        val staffName = staffUser?.displayName?.en

        memberService.logProfileView(id, staffUserId, staffName)
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build()
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Bulk update member status (suspend, activate, freeze, unfreeze, cancel).
     * Restricted to SUPER_ADMIN and CLUB_ADMIN roles.
     */
    @PostMapping("/bulk/status")
    @PreAuthorize("hasAuthority('members_update')")
    @Operation(summary = "Bulk update member status", description = "Update status for multiple members at once")
    fun bulkUpdateStatus(
        @Valid @RequestBody request: BulkMemberStatusRequest
    ): ResponseEntity<BulkOperationResponse> {
        validateBulkSize(request.memberIds)
        val startTime = System.currentTimeMillis()

        val resultsMap = when (request.action) {
            BulkMemberAction.SUSPEND -> memberService.bulkSuspendMembers(request.memberIds)
            BulkMemberAction.ACTIVATE -> memberService.bulkActivateMembers(request.memberIds)
            BulkMemberAction.FREEZE -> memberService.bulkFreezeMembers(request.memberIds)
            BulkMemberAction.UNFREEZE -> memberService.bulkUnfreezeMembers(request.memberIds)
            BulkMemberAction.CANCEL -> memberService.bulkCancelMembers(request.memberIds)
        }

        val results = resultsMap.map { (id, result) ->
            if (result.isSuccess) {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.SUCCESS,
                    message = "Status changed to ${request.action.name}",
                    messageAr = getArabicStatusMessage(request.action)
                )
            } else {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.FAILED,
                    message = result.exceptionOrNull()?.message ?: "Unknown error",
                    messageAr = "فشل في تحديث الحالة"
                )
            }
        }

        return ResponseEntity.ok(BulkOperationResponse.from(results, startTime))
    }

    /**
     * Bulk delete members.
     * Restricted to SUPER_ADMIN and CLUB_ADMIN roles.
     */
    @PostMapping("/bulk/delete")
    @PreAuthorize("hasAuthority('members_delete')")
    @Operation(summary = "Bulk delete members", description = "Delete multiple members at once")
    fun bulkDeleteMembers(
        @Valid @RequestBody request: BulkMemberDeleteRequest
    ): ResponseEntity<BulkOperationResponse> {
        validateBulkSize(request.memberIds)
        val startTime = System.currentTimeMillis()

        val resultsMap = memberService.bulkDeleteMembers(request.memberIds)

        val results = resultsMap.map { (id, result) ->
            if (result.isSuccess) {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.SUCCESS,
                    message = "Member deleted",
                    messageAr = "تم حذف العضو"
                )
            } else {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.FAILED,
                    message = result.exceptionOrNull()?.message ?: "Unknown error",
                    messageAr = "فشل في حذف العضو"
                )
            }
        }

        return ResponseEntity.ok(BulkOperationResponse.from(results, startTime))
    }

    private fun getArabicStatusMessage(action: BulkMemberAction): String {
        return when (action) {
            BulkMemberAction.SUSPEND -> "تم تعليق العضوية"
            BulkMemberAction.ACTIVATE -> "تم تفعيل العضوية"
            BulkMemberAction.FREEZE -> "تم تجميد العضوية"
            BulkMemberAction.UNFREEZE -> "تم إلغاء تجميد العضوية"
            BulkMemberAction.CANCEL -> "تم إلغاء العضوية"
        }
    }
}
