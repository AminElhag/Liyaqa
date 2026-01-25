package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Personal trainer information
 */
@Serializable
data class Trainer(
    val id: String,
    val name: LocalizedText,
    val bio: LocalizedText? = null,
    val specializations: List<LocalizedText> = emptyList(),
    val photoUrl: String? = null,
    val rating: Double? = null,
    val reviewCount: Int = 0
)

/**
 * Trainer availability slot
 */
@Serializable
data class TrainerAvailability(
    val trainerId: String,
    val date: String,
    val slots: List<TimeSlot>
)

/**
 * Available time slot
 */
@Serializable
data class TimeSlot(
    val startTime: String,
    val endTime: String,
    val isAvailable: Boolean
)

/**
 * Personal training session
 */
@Serializable
data class PTSession(
    val id: String,
    val trainerId: String,
    val trainerName: LocalizedText,
    val date: String,
    val startTime: String,
    val endTime: String,
    val status: SessionStatus,
    val notes: String? = null,
    val createdAt: String
) {
    val timeDisplay: String get() = "$startTime - $endTime"
}

/**
 * Request to book a PT session
 */
@Serializable
data class PTBookingRequest(
    val trainerId: String,
    val date: String,
    val startTime: String,
    val notes: String? = null
)
