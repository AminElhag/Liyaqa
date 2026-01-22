package com.liyaqa.organization.application.services

import com.liyaqa.organization.domain.model.AccessGender
import com.liyaqa.organization.domain.model.GenderPolicy
import com.liyaqa.organization.domain.model.GenderSchedule
import com.liyaqa.organization.domain.ports.GenderScheduleRepository
import com.liyaqa.organization.domain.ports.LocationRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.DayOfWeek
import java.time.LocalDateTime
import java.time.LocalTime
import java.util.UUID

/**
 * Service for managing gender policies and schedules.
 * Handles gender-based access control for Saudi Arabia market compliance.
 */
@Service
@Transactional
class GenderPolicyService(
    private val locationRepository: LocationRepository,
    private val genderScheduleRepository: GenderScheduleRepository
) {
    private val logger = LoggerFactory.getLogger(GenderPolicyService::class.java)

    /**
     * Updates the gender policy for a location.
     */
    fun updateLocationGenderPolicy(locationId: UUID, policy: GenderPolicy): Unit {
        val location = locationRepository.findById(locationId)
            .orElseThrow { NoSuchElementException("Location not found: $locationId") }

        location.genderPolicy = policy
        locationRepository.save(location)

        // If changing away from TIME_BASED, clear schedules
        if (policy != GenderPolicy.TIME_BASED) {
            genderScheduleRepository.deleteAllByLocationId(locationId)
        }

        logger.info("Updated gender policy for location $locationId to $policy")
    }

    /**
     * Gets gender schedules for a location.
     */
    @Transactional(readOnly = true)
    fun getSchedulesForLocation(locationId: UUID): List<GenderSchedule> {
        return genderScheduleRepository.findByLocationId(locationId)
    }

    /**
     * Adds a gender schedule for a location with TIME_BASED policy.
     */
    fun addGenderSchedule(
        locationId: UUID,
        dayOfWeek: DayOfWeek,
        startTime: LocalTime,
        endTime: LocalTime,
        gender: AccessGender
    ): GenderSchedule {
        val location = locationRepository.findById(locationId)
            .orElseThrow { NoSuchElementException("Location not found: $locationId") }

        require(location.genderPolicy == GenderPolicy.TIME_BASED) {
            "Location must have TIME_BASED gender policy to add schedules"
        }

        require(endTime.isAfter(startTime)) {
            "End time must be after start time"
        }

        // Check for overlapping schedules
        val existingSchedules = genderScheduleRepository.findByLocationIdAndDayOfWeek(locationId, dayOfWeek)
        val newSchedule = GenderSchedule(
            locationId = locationId,
            dayOfWeek = dayOfWeek,
            startTime = startTime,
            endTime = endTime,
            gender = gender
        )
        // Note: tenantId is automatically set by BaseEntity.prePersist from TenantContext

        for (existing in existingSchedules) {
            if (existing.overlapsWith(newSchedule)) {
                throw IllegalArgumentException(
                    "Schedule overlaps with existing schedule: ${existing.startTime}-${existing.endTime}"
                )
            }
        }

        return genderScheduleRepository.save(newSchedule)
    }

    /**
     * Updates a gender schedule.
     */
    fun updateGenderSchedule(
        scheduleId: UUID,
        dayOfWeek: DayOfWeek? = null,
        startTime: LocalTime? = null,
        endTime: LocalTime? = null,
        gender: AccessGender? = null
    ): GenderSchedule {
        val schedule = genderScheduleRepository.findById(scheduleId)
            .orElseThrow { NoSuchElementException("Schedule not found: $scheduleId") }

        dayOfWeek?.let { schedule.dayOfWeek = it }
        startTime?.let { schedule.startTime = it }
        endTime?.let { schedule.endTime = it }
        gender?.let { schedule.gender = it }

        require(schedule.isValid()) { "End time must be after start time" }

        return genderScheduleRepository.save(schedule)
    }

    /**
     * Deletes a gender schedule.
     */
    fun deleteGenderSchedule(scheduleId: UUID) {
        if (!genderScheduleRepository.existsById(scheduleId)) {
            throw NoSuchElementException("Schedule not found: $scheduleId")
        }
        genderScheduleRepository.deleteById(scheduleId)
    }

    /**
     * Deletes all gender schedules for a location.
     */
    fun deleteAllSchedulesForLocation(locationId: UUID) {
        genderScheduleRepository.deleteAllByLocationId(locationId)
    }

    /**
     * Checks if a location allows access for a given gender at the specified time.
     */
    @Transactional(readOnly = true)
    fun canAccessLocation(
        locationId: UUID,
        gender: AccessGender,
        dateTime: LocalDateTime = LocalDateTime.now()
    ): GenderAccessResult {
        val location = locationRepository.findById(locationId)
            .orElseThrow { NoSuchElementException("Location not found: $locationId") }

        return when (location.genderPolicy) {
            GenderPolicy.MIXED -> GenderAccessResult(
                allowed = true,
                policy = GenderPolicy.MIXED,
                reason = "Location is open to all genders"
            )

            GenderPolicy.MALE_ONLY -> GenderAccessResult(
                allowed = gender == AccessGender.MALE,
                policy = GenderPolicy.MALE_ONLY,
                reason = if (gender == AccessGender.MALE) "Male-only location" else "This location is for males only"
            )

            GenderPolicy.FEMALE_ONLY -> GenderAccessResult(
                allowed = gender == AccessGender.FEMALE,
                policy = GenderPolicy.FEMALE_ONLY,
                reason = if (gender == AccessGender.FEMALE) "Female-only location" else "This location is for females only"
            )

            GenderPolicy.TIME_BASED -> {
                val dayOfWeek = dateTime.dayOfWeek
                val time = dateTime.toLocalTime()
                val schedules = genderScheduleRepository.findByLocationIdAndDayOfWeek(locationId, dayOfWeek)

                val matchingSchedule = schedules.find { it.isWithinSchedule(dayOfWeek, time) }

                if (matchingSchedule != null) {
                    GenderAccessResult(
                        allowed = matchingSchedule.gender == gender,
                        policy = GenderPolicy.TIME_BASED,
                        currentGender = matchingSchedule.gender,
                        reason = if (matchingSchedule.gender == gender) {
                            "Access allowed during ${matchingSchedule.gender.name.lowercase()} hours"
                        } else {
                            "Current hours are for ${matchingSchedule.gender.name.lowercase()} only"
                        },
                        scheduleEnd = matchingSchedule.endTime
                    )
                } else {
                    // Outside scheduled times - default to mixed
                    GenderAccessResult(
                        allowed = true,
                        policy = GenderPolicy.TIME_BASED,
                        reason = "Outside scheduled gender-specific hours"
                    )
                }
            }
        }
    }

    /**
     * Gets the current gender designation for a location.
     * For TIME_BASED locations, returns the gender for the current time slot.
     */
    @Transactional(readOnly = true)
    fun getCurrentGenderForLocation(
        locationId: UUID,
        dateTime: LocalDateTime = LocalDateTime.now()
    ): CurrentGenderStatus {
        val location = locationRepository.findById(locationId)
            .orElseThrow { NoSuchElementException("Location not found: $locationId") }

        return when (location.genderPolicy) {
            GenderPolicy.MIXED -> CurrentGenderStatus(
                policy = GenderPolicy.MIXED,
                currentGender = null,
                allowsMale = true,
                allowsFemale = true
            )

            GenderPolicy.MALE_ONLY -> CurrentGenderStatus(
                policy = GenderPolicy.MALE_ONLY,
                currentGender = AccessGender.MALE,
                allowsMale = true,
                allowsFemale = false
            )

            GenderPolicy.FEMALE_ONLY -> CurrentGenderStatus(
                policy = GenderPolicy.FEMALE_ONLY,
                currentGender = AccessGender.FEMALE,
                allowsMale = false,
                allowsFemale = true
            )

            GenderPolicy.TIME_BASED -> {
                val dayOfWeek = dateTime.dayOfWeek
                val time = dateTime.toLocalTime()
                val schedules = genderScheduleRepository.findByLocationIdAndDayOfWeek(locationId, dayOfWeek)

                val matchingSchedule = schedules.find { it.isWithinSchedule(dayOfWeek, time) }

                if (matchingSchedule != null) {
                    CurrentGenderStatus(
                        policy = GenderPolicy.TIME_BASED,
                        currentGender = matchingSchedule.gender,
                        allowsMale = matchingSchedule.gender == AccessGender.MALE,
                        allowsFemale = matchingSchedule.gender == AccessGender.FEMALE,
                        scheduleEnd = matchingSchedule.endTime
                    )
                } else {
                    CurrentGenderStatus(
                        policy = GenderPolicy.TIME_BASED,
                        currentGender = null,
                        allowsMale = true,
                        allowsFemale = true
                    )
                }
            }
        }
    }
}

/**
 * Result of a gender access check.
 */
data class GenderAccessResult(
    val allowed: Boolean,
    val policy: GenderPolicy,
    val currentGender: AccessGender? = null,
    val reason: String,
    val scheduleEnd: LocalTime? = null
)

/**
 * Current gender status for a location.
 */
data class CurrentGenderStatus(
    val policy: GenderPolicy,
    val currentGender: AccessGender?,
    val allowsMale: Boolean,
    val allowsFemale: Boolean,
    val scheduleEnd: LocalTime? = null
)
