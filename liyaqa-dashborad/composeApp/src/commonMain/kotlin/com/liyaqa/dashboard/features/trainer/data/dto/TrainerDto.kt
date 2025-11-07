package com.liyaqa.dashboard.features.trainer.data.dto

import com.liyaqa.dashboard.features.trainer.domain.model.*
import kotlinx.serialization.Serializable

@Serializable
data class TrainerDto(
    val id: String,
    val facilityId: String,
    val branchId: String? = null,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phoneNumber: String? = null,
    val bio: String? = null,
    val specializations: List<String> = emptyList(),
    val certifications: List<String> = emptyList(),
    val languages: List<String> = emptyList(),
    val sessionRate30Min: Double? = null,
    val sessionRate60Min: Double? = null,
    val sessionRate90Min: Double? = null,
    val hourlyRate: Double? = null,
    val averageRating: Double = 0.0,
    val totalSessions: Int = 0,
    val totalReviews: Int = 0,
    val status: String,
    val hireDate: String,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class TrainerBookingDto(
    val id: String,
    val trainerId: String,
    val trainerName: String,
    val memberId: String,
    val memberName: String,
    val sessionType: String,
    val startTime: String,
    val endTime: String,
    val duration: Int,
    val status: String,
    val price: Double,
    val paymentStatus: String,
    val checkInTime: String? = null,
    val checkOutTime: String? = null,
    val trainerNotes: String? = null,
    val memberPerformanceRating: Int? = null,
    val createdAt: String,
    val updatedAt: String? = null
)

@Serializable
data class TrainerReviewDto(
    val id: String,
    val trainerId: String,
    val memberId: String,
    val memberName: String,
    val bookingId: String,
    val overallRating: Double,
    val professionalismRating: Int? = null,
    val knowledgeRating: Int? = null,
    val communicationRating: Int? = null,
    val motivationRating: Int? = null,
    val reviewText: String? = null,
    val trainerResponse: String? = null,
    val status: String,
    val createdAt: String,
    val updatedAt: String? = null
)

@Serializable
data class CreateTrainerRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val phoneNumber: String? = null,
    val bio: String? = null,
    val specializations: List<String> = emptyList(),
    val certifications: List<String> = emptyList(),
    val languages: List<String> = emptyList(),
    val sessionRate30Min: Double? = null,
    val sessionRate60Min: Double? = null,
    val sessionRate90Min: Double? = null,
    val branchId: String? = null
)

@Serializable
data class CreateTrainerBookingRequest(
    val trainerId: String,
    val memberId: String,
    val sessionType: String,
    val startTime: String,
    val endTime: String,
    val notes: String? = null
)

@Serializable
data class TrainerPageResponse(
    val content: List<TrainerDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int
)

@Serializable
data class TrainerBookingPageResponse(
    val content: List<TrainerBookingDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int
)

@Serializable
data class TrainerReviewPageResponse(
    val content: List<TrainerReviewDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int
)

// Mapping functions
fun TrainerDto.toDomain() = Trainer(
    id = id,
    facilityId = facilityId,
    branchId = branchId,
    firstName = firstName,
    lastName = lastName,
    email = email,
    phoneNumber = phoneNumber,
    bio = bio,
    specializations = specializations,
    certifications = certifications,
    languages = languages,
    sessionRate30Min = sessionRate30Min,
    sessionRate60Min = sessionRate60Min,
    sessionRate90Min = sessionRate90Min,
    hourlyRate = hourlyRate,
    averageRating = averageRating,
    totalSessions = totalSessions,
    totalReviews = totalReviews,
    status = TrainerStatus.valueOf(status),
    hireDate = hireDate,
    createdAt = createdAt,
    updatedAt = updatedAt
)

fun TrainerBookingDto.toDomain() = TrainerBooking(
    id = id,
    trainerId = trainerId,
    trainerName = trainerName,
    memberId = memberId,
    memberName = memberName,
    sessionType = SessionType.valueOf(sessionType),
    startTime = startTime,
    endTime = endTime,
    duration = duration,
    status = BookingStatus.valueOf(status),
    price = price,
    paymentStatus = PaymentStatus.valueOf(paymentStatus),
    checkInTime = checkInTime,
    checkOutTime = checkOutTime,
    trainerNotes = trainerNotes,
    memberPerformanceRating = memberPerformanceRating,
    createdAt = createdAt,
    updatedAt = updatedAt
)

fun TrainerReviewDto.toDomain() = TrainerReview(
    id = id,
    trainerId = trainerId,
    memberId = memberId,
    memberName = memberName,
    bookingId = bookingId,
    overallRating = overallRating,
    professionalismRating = professionalismRating,
    knowledgeRating = knowledgeRating,
    communicationRating = communicationRating,
    motivationRating = motivationRating,
    reviewText = reviewText,
    trainerResponse = trainerResponse,
    status = ReviewStatus.valueOf(status),
    createdAt = createdAt,
    updatedAt = updatedAt
)
