package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Class session available for booking
 */
@Serializable
data class Session(
    val id: String,
    val classId: String,
    val className: LocalizedText,
    val trainerId: String? = null,
    val trainerName: LocalizedText? = null,
    val date: String,
    val startTime: String,
    val endTime: String,
    val capacity: Int,
    val bookedCount: Int,
    val waitlistCount: Int = 0,
    val availableSpots: Int,
    val status: SessionStatus,
    val locationId: String? = null,
    val locationName: LocalizedText? = null
) {
    val isFull: Boolean get() = availableSpots <= 0

    val hasWaitlist: Boolean get() = waitlistCount > 0

    val isBookable: Boolean get() = status == SessionStatus.SCHEDULED

    val occupancyPercentage: Int get() = if (capacity > 0) (bookedCount * 100) / capacity else 0

    /**
     * Time display in "HH:MM - HH:MM" format
     */
    val timeDisplay: String get() = "$startTime - $endTime"
}

/**
 * Gym class definition
 */
@Serializable
data class GymClass(
    val id: String,
    val name: LocalizedText,
    val description: LocalizedText? = null,
    val trainerId: String? = null,
    val trainerName: LocalizedText? = null,
    val capacity: Int,
    val durationMinutes: Int,
    val locationId: String? = null,
    val locationName: LocalizedText? = null
)

/**
 * Class schedule entry
 */
@Serializable
data class ClassSchedule(
    val id: String,
    val dayOfWeek: DayOfWeek,
    val startTime: String,
    val endTime: String
)
