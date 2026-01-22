package com.liyaqa.membership.api

import com.liyaqa.membership.application.services.MemberHealthService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/members/{memberId}/health")
@Tag(name = "Member Health", description = "Member health information and PAR-Q management")
class MemberHealthController(
    private val memberHealthService: MemberHealthService
) {

    @GetMapping
    @PreAuthorize("hasAuthority('members_view')")
    @Operation(summary = "Get member's health information")
    fun getMemberHealth(
        @PathVariable memberId: UUID
    ): ResponseEntity<MemberHealthResponse> {
        val health = memberHealthService.getHealthInfo(memberId)
        return if (health != null) {
            ResponseEntity.ok(MemberHealthResponse.from(health))
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('members_view')")
    @Operation(summary = "Get member's health summary (PAR-Q status)")
    fun getMemberHealthSummary(
        @PathVariable memberId: UUID
    ): ResponseEntity<HealthSummaryResponse> {
        val health = memberHealthService.getHealthInfo(memberId)
        return ResponseEntity.ok(HealthSummaryResponse.from(memberId, health))
    }

    @PostMapping
    @PreAuthorize("hasAuthority('members_update')")
    @Operation(summary = "Create or update member's health information")
    fun createOrUpdateHealth(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: CreateOrUpdateHealthRequest
    ): ResponseEntity<MemberHealthResponse> {
        val health = memberHealthService.createOrUpdateHealth(
            memberId = memberId,
            hasHeartCondition = request.hasHeartCondition,
            hasChestPainDuringActivity = request.hasChestPainDuringActivity,
            hasChestPainAtRest = request.hasChestPainAtRest,
            hasDizzinessOrBalance = request.hasDizzinessOrBalance,
            hasBoneJointProblem = request.hasBoneJointProblem,
            takesBloodPressureMedication = request.takesBloodPressureMedication,
            hasOtherReasonNotToExercise = request.hasOtherReasonNotToExercise,
            medicalConditions = request.medicalConditions,
            allergies = request.allergies,
            currentMedications = request.currentMedications,
            injuriesAndLimitations = request.injuriesAndLimitations,
            bloodType = request.bloodType,
            emergencyMedicalNotes = request.emergencyMedicalNotes,
            doctorName = request.doctorName,
            doctorPhone = request.doctorPhone,
            medicalClearanceDate = request.medicalClearanceDate
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(MemberHealthResponse.from(health))
    }

    @PutMapping
    @PreAuthorize("hasAuthority('members_update')")
    @Operation(summary = "Update member's health information")
    fun updateHealth(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: CreateOrUpdateHealthRequest
    ): ResponseEntity<MemberHealthResponse> {
        val health = memberHealthService.createOrUpdateHealth(
            memberId = memberId,
            hasHeartCondition = request.hasHeartCondition,
            hasChestPainDuringActivity = request.hasChestPainDuringActivity,
            hasChestPainAtRest = request.hasChestPainAtRest,
            hasDizzinessOrBalance = request.hasDizzinessOrBalance,
            hasBoneJointProblem = request.hasBoneJointProblem,
            takesBloodPressureMedication = request.takesBloodPressureMedication,
            hasOtherReasonNotToExercise = request.hasOtherReasonNotToExercise,
            medicalConditions = request.medicalConditions,
            allergies = request.allergies,
            currentMedications = request.currentMedications,
            injuriesAndLimitations = request.injuriesAndLimitations,
            bloodType = request.bloodType,
            emergencyMedicalNotes = request.emergencyMedicalNotes,
            doctorName = request.doctorName,
            doctorPhone = request.doctorPhone,
            medicalClearanceDate = request.medicalClearanceDate
        )

        return ResponseEntity.ok(MemberHealthResponse.from(health))
    }

    @DeleteMapping
    @PreAuthorize("hasAuthority('members_update')")
    @Operation(summary = "Delete member's health information")
    fun deleteHealth(
        @PathVariable memberId: UUID
    ): ResponseEntity<Void> {
        memberHealthService.deleteHealthInfo(memberId)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/needs-clearance")
    @PreAuthorize("hasAuthority('members_view')")
    @Operation(summary = "Check if member needs medical clearance based on PAR-Q")
    fun needsMedicalClearance(
        @PathVariable memberId: UUID
    ): ResponseEntity<Map<String, Boolean>> {
        val needsClearance = memberHealthService.needsMedicalClearance(memberId)
        return ResponseEntity.ok(mapOf("needsMedicalClearance" to needsClearance))
    }
}
