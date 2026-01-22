package com.liyaqa.organization.api

import com.liyaqa.organization.application.services.CurrentGenderStatus
import com.liyaqa.organization.application.services.GenderAccessResult
import com.liyaqa.organization.application.services.GenderPolicyService
import com.liyaqa.organization.domain.model.AccessGender
import com.liyaqa.organization.domain.model.GenderPolicy
import com.liyaqa.organization.domain.model.GenderSchedule
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotNull
import org.springframework.format.annotation.DateTimeFormat
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
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.DayOfWeek
import java.time.LocalDateTime
import java.time.LocalTime
import java.util.UUID

@RestController
@RequestMapping("/api/gender-policies")
@Tag(name = "Gender Policies", description = "Gender policy management for Saudi Arabia market compliance")
class GenderPolicyController(
    private val genderPolicyService: GenderPolicyService
) {

    // ==================== LOCATION GENDER POLICY ====================

    /**
     * Updates the gender policy for a location.
     */
    @PutMapping("/locations/{locationId}")
    @PreAuthorize("hasAuthority('organization_manage')")
    @Operation(summary = "Update location gender policy")
    fun updateLocationGenderPolicy(
        @PathVariable locationId: UUID,
        @Valid @RequestBody request: UpdateGenderPolicyRequest
    ): ResponseEntity<GenderPolicyResponse> {
        genderPolicyService.updateLocationGenderPolicy(locationId, request.policy)
        return ResponseEntity.ok(GenderPolicyResponse(
            locationId = locationId,
            policy = request.policy,
            messageEn = "Gender policy updated to ${request.policy.name}",
            messageAr = "تم تحديث سياسة الجنس إلى ${getGenderPolicyAr(request.policy)}"
        ))
    }

    /**
     * Checks if a gender can access a location at the current or specified time.
     */
    @GetMapping("/locations/{locationId}/access-check")
    @Operation(summary = "Check gender access for a location")
    fun checkGenderAccess(
        @PathVariable locationId: UUID,
        @RequestParam gender: AccessGender,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) dateTime: LocalDateTime?
    ): ResponseEntity<GenderAccessResponse> {
        val result = genderPolicyService.canAccessLocation(
            locationId = locationId,
            gender = gender,
            dateTime = dateTime ?: LocalDateTime.now()
        )
        return ResponseEntity.ok(GenderAccessResponse.from(result))
    }

    /**
     * Gets the current gender status for a location.
     */
    @GetMapping("/locations/{locationId}/current-status")
    @Operation(summary = "Get current gender status for a location")
    fun getCurrentGenderStatus(
        @PathVariable locationId: UUID,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) dateTime: LocalDateTime?
    ): ResponseEntity<CurrentGenderStatusResponse> {
        val status = genderPolicyService.getCurrentGenderForLocation(
            locationId = locationId,
            dateTime = dateTime ?: LocalDateTime.now()
        )
        return ResponseEntity.ok(CurrentGenderStatusResponse.from(status))
    }

    // ==================== GENDER SCHEDULES ====================

    /**
     * Gets all gender schedules for a location.
     */
    @GetMapping("/locations/{locationId}/schedules")
    @PreAuthorize("hasAuthority('organization_manage')")
    @Operation(summary = "Get gender schedules for a location")
    fun getSchedulesForLocation(@PathVariable locationId: UUID): ResponseEntity<List<GenderScheduleResponse>> {
        val schedules = genderPolicyService.getSchedulesForLocation(locationId)
        return ResponseEntity.ok(schedules.map { GenderScheduleResponse.from(it) })
    }

    /**
     * Adds a new gender schedule for a TIME_BASED location.
     */
    @PostMapping("/locations/{locationId}/schedules")
    @PreAuthorize("hasAuthority('organization_manage')")
    @Operation(summary = "Add gender schedule for a location")
    fun addGenderSchedule(
        @PathVariable locationId: UUID,
        @Valid @RequestBody request: CreateGenderScheduleRequest
    ): ResponseEntity<GenderScheduleResponse> {
        val schedule = genderPolicyService.addGenderSchedule(
            locationId = locationId,
            dayOfWeek = request.dayOfWeek,
            startTime = request.startTime,
            endTime = request.endTime,
            gender = request.gender
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(GenderScheduleResponse.from(schedule))
    }

    /**
     * Updates an existing gender schedule.
     */
    @PutMapping("/schedules/{scheduleId}")
    @PreAuthorize("hasAuthority('organization_manage')")
    @Operation(summary = "Update gender schedule")
    fun updateGenderSchedule(
        @PathVariable scheduleId: UUID,
        @Valid @RequestBody request: UpdateGenderScheduleRequest
    ): ResponseEntity<GenderScheduleResponse> {
        val schedule = genderPolicyService.updateGenderSchedule(
            scheduleId = scheduleId,
            dayOfWeek = request.dayOfWeek,
            startTime = request.startTime,
            endTime = request.endTime,
            gender = request.gender
        )
        return ResponseEntity.ok(GenderScheduleResponse.from(schedule))
    }

    /**
     * Deletes a gender schedule.
     */
    @DeleteMapping("/schedules/{scheduleId}")
    @PreAuthorize("hasAuthority('organization_manage')")
    @Operation(summary = "Delete gender schedule")
    fun deleteGenderSchedule(@PathVariable scheduleId: UUID): ResponseEntity<Unit> {
        genderPolicyService.deleteGenderSchedule(scheduleId)
        return ResponseEntity.noContent().build()
    }

    /**
     * Deletes all schedules for a location.
     */
    @DeleteMapping("/locations/{locationId}/schedules")
    @PreAuthorize("hasAuthority('organization_manage')")
    @Operation(summary = "Delete all gender schedules for a location")
    fun deleteAllSchedulesForLocation(@PathVariable locationId: UUID): ResponseEntity<Unit> {
        genderPolicyService.deleteAllSchedulesForLocation(locationId)
        return ResponseEntity.noContent().build()
    }

    /**
     * Gets list of supported gender policies.
     */
    @GetMapping("/policies")
    @Operation(summary = "Get list of supported gender policies")
    fun getSupportedPolicies(): ResponseEntity<List<GenderPolicyInfo>> {
        return ResponseEntity.ok(GenderPolicy.entries.map {
            GenderPolicyInfo(
                code = it.name,
                nameEn = getGenderPolicyNameEn(it),
                nameAr = getGenderPolicyAr(it),
                description = getGenderPolicyDescription(it)
            )
        })
    }

    // ==================== HELPER FUNCTIONS ====================

    private fun getGenderPolicyAr(policy: GenderPolicy): String = when (policy) {
        GenderPolicy.MIXED -> "مختلط"
        GenderPolicy.MALE_ONLY -> "رجال فقط"
        GenderPolicy.FEMALE_ONLY -> "نساء فقط"
        GenderPolicy.TIME_BASED -> "حسب الوقت"
    }

    private fun getGenderPolicyNameEn(policy: GenderPolicy): String = when (policy) {
        GenderPolicy.MIXED -> "Mixed"
        GenderPolicy.MALE_ONLY -> "Male Only"
        GenderPolicy.FEMALE_ONLY -> "Female Only"
        GenderPolicy.TIME_BASED -> "Time-Based"
    }

    private fun getGenderPolicyDescription(policy: GenderPolicy): String = when (policy) {
        GenderPolicy.MIXED -> "Location is open to all genders at all times"
        GenderPolicy.MALE_ONLY -> "Location is exclusively for male members"
        GenderPolicy.FEMALE_ONLY -> "Location is exclusively for female members"
        GenderPolicy.TIME_BASED -> "Location switches between male and female based on schedule"
    }
}

// ==================== REQUEST DTOs ====================

data class UpdateGenderPolicyRequest(
    @field:NotNull
    val policy: GenderPolicy
)

data class CreateGenderScheduleRequest(
    @field:NotNull
    val dayOfWeek: DayOfWeek,

    @field:NotNull
    @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
    val startTime: LocalTime,

    @field:NotNull
    @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
    val endTime: LocalTime,

    @field:NotNull
    val gender: AccessGender
)

data class UpdateGenderScheduleRequest(
    val dayOfWeek: DayOfWeek? = null,

    @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
    val startTime: LocalTime? = null,

    @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
    val endTime: LocalTime? = null,

    val gender: AccessGender? = null
)

// ==================== RESPONSE DTOs ====================

data class GenderPolicyResponse(
    val locationId: UUID,
    val policy: GenderPolicy,
    val messageEn: String,
    val messageAr: String
)

data class GenderAccessResponse(
    val allowed: Boolean,
    val policy: GenderPolicy,
    val currentGender: AccessGender?,
    val reasonEn: String,
    val reasonAr: String,
    val scheduleEnd: String?
) {
    companion object {
        fun from(result: GenderAccessResult) = GenderAccessResponse(
            allowed = result.allowed,
            policy = result.policy,
            currentGender = result.currentGender,
            reasonEn = result.reason,
            reasonAr = translateReason(result.reason, result.currentGender),
            scheduleEnd = result.scheduleEnd?.toString()
        )

        private fun translateReason(reason: String, currentGender: AccessGender?): String {
            return when {
                reason.contains("mixed") || reason.contains("all genders") -> "هذا الموقع مفتوح للجميع"
                reason.contains("Male-only") -> "موقع للرجال فقط"
                reason.contains("Female-only") -> "موقع للنساء فقط"
                reason.contains("males only") -> "هذا الموقع للرجال فقط"
                reason.contains("females only") -> "هذا الموقع للنساء فقط"
                reason.contains("male hours") -> "ساعات الرجال"
                reason.contains("female hours") -> "ساعات النساء"
                reason.contains("Outside scheduled") -> "خارج أوقات الجنس المحددة"
                else -> reason
            }
        }
    }
}

data class CurrentGenderStatusResponse(
    val policy: GenderPolicy,
    val currentGender: AccessGender?,
    val allowsMale: Boolean,
    val allowsFemale: Boolean,
    val scheduleEnd: String?,
    val statusTextEn: String,
    val statusTextAr: String
) {
    companion object {
        fun from(status: CurrentGenderStatus) = CurrentGenderStatusResponse(
            policy = status.policy,
            currentGender = status.currentGender,
            allowsMale = status.allowsMale,
            allowsFemale = status.allowsFemale,
            scheduleEnd = status.scheduleEnd?.toString(),
            statusTextEn = getStatusTextEn(status),
            statusTextAr = getStatusTextAr(status)
        )

        private fun getStatusTextEn(status: CurrentGenderStatus): String = when {
            status.policy == GenderPolicy.MIXED -> "Open to all"
            status.policy == GenderPolicy.MALE_ONLY -> "Male only"
            status.policy == GenderPolicy.FEMALE_ONLY -> "Female only"
            status.currentGender == AccessGender.MALE -> "Currently male hours"
            status.currentGender == AccessGender.FEMALE -> "Currently female hours"
            else -> "Currently open to all"
        }

        private fun getStatusTextAr(status: CurrentGenderStatus): String = when {
            status.policy == GenderPolicy.MIXED -> "مفتوح للجميع"
            status.policy == GenderPolicy.MALE_ONLY -> "رجال فقط"
            status.policy == GenderPolicy.FEMALE_ONLY -> "نساء فقط"
            status.currentGender == AccessGender.MALE -> "ساعات الرجال حالياً"
            status.currentGender == AccessGender.FEMALE -> "ساعات النساء حالياً"
            else -> "مفتوح للجميع حالياً"
        }
    }
}

data class GenderScheduleResponse(
    val id: UUID,
    val locationId: UUID,
    val dayOfWeek: DayOfWeek,
    val dayOfWeekAr: String,
    val startTime: String,
    val endTime: String,
    val gender: AccessGender,
    val genderTextEn: String,
    val genderTextAr: String
) {
    companion object {
        fun from(schedule: GenderSchedule) = GenderScheduleResponse(
            id = schedule.id,
            locationId = schedule.locationId,
            dayOfWeek = schedule.dayOfWeek,
            dayOfWeekAr = getDayOfWeekAr(schedule.dayOfWeek),
            startTime = schedule.startTime.toString(),
            endTime = schedule.endTime.toString(),
            gender = schedule.gender,
            genderTextEn = if (schedule.gender == AccessGender.MALE) "Male" else "Female",
            genderTextAr = if (schedule.gender == AccessGender.MALE) "رجال" else "نساء"
        )

        private fun getDayOfWeekAr(day: DayOfWeek): String = when (day) {
            DayOfWeek.MONDAY -> "الإثنين"
            DayOfWeek.TUESDAY -> "الثلاثاء"
            DayOfWeek.WEDNESDAY -> "الأربعاء"
            DayOfWeek.THURSDAY -> "الخميس"
            DayOfWeek.FRIDAY -> "الجمعة"
            DayOfWeek.SATURDAY -> "السبت"
            DayOfWeek.SUNDAY -> "الأحد"
        }
    }
}

data class GenderPolicyInfo(
    val code: String,
    val nameEn: String,
    val nameAr: String,
    val description: String
)
