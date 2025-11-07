package com.liyaqa.dashboard.features.trainer.domain.model

/**
 * Personal trainer domain model
 */
data class Trainer(
    val id: String,
    val facilityId: String,
    val branchId: String?,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phoneNumber: String?,
    val bio: String?,
    val specializations: List<String> = emptyList(),
    val certifications: List<String> = emptyList(),
    val languages: List<String> = emptyList(),
    val sessionRate30Min: Double?,
    val sessionRate60Min: Double?,
    val sessionRate90Min: Double?,
    val hourlyRate: Double?,
    val averageRating: Double = 0.0,
    val totalSessions: Int = 0,
    val totalReviews: Int = 0,
    val status: TrainerStatus,
    val hireDate: String,
    val createdAt: String? = null,
    val updatedAt: String? = null
) {
    val fullName: String
        get() = "$firstName $lastName"

    fun isActive(): Boolean = status == TrainerStatus.ACTIVE

    fun hasGoodRating(): Boolean = averageRating >= 4.0
}

enum class TrainerStatus {
    ACTIVE,
    INACTIVE,
    ON_LEAVE,
    TERMINATED
}

/**
 * Trainer booking/session domain model
 */
data class TrainerBooking(
    val id: String,
    val trainerId: String,
    val trainerName: String,
    val memberId: String,
    val memberName: String,
    val sessionType: SessionType,
    val startTime: String,
    val endTime: String,
    val duration: Int, // minutes
    val status: BookingStatus,
    val price: Double,
    val paymentStatus: PaymentStatus,
    val checkInTime: String? = null,
    val checkOutTime: String? = null,
    val trainerNotes: String? = null,
    val memberPerformanceRating: Int? = null,
    val createdAt: String,
    val updatedAt: String? = null
) {
    fun isCompleted(): Boolean = status == BookingStatus.COMPLETED
    fun canReview(): Boolean = isCompleted() && memberPerformanceRating == null
}

enum class SessionType {
    PERSONAL,
    SEMI_PRIVATE,
    GROUP,
    ASSESSMENT
}

enum class BookingStatus {
    PENDING,
    CONFIRMED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED,
    NO_SHOW
}

enum class PaymentStatus {
    PAID,
    PENDING,
    FAILED,
    REFUNDED
}

/**
 * Trainer review/rating domain model
 */
data class TrainerReview(
    val id: String,
    val trainerId: String,
    val memberId: String,
    val memberName: String,
    val bookingId: String,
    val overallRating: Double,
    val professionalismRating: Int?,
    val knowledgeRating: Int?,
    val communicationRating: Int?,
    val motivationRating: Int?,
    val reviewText: String?,
    val trainerResponse: String? = null,
    val status: ReviewStatus,
    val createdAt: String,
    val updatedAt: String? = null
) {
    fun isApproved(): Boolean = status == ReviewStatus.APPROVED
    fun hasTrainerResponse(): Boolean = !trainerResponse.isNullOrBlank()
}

enum class ReviewStatus {
    PENDING,
    APPROVED,
    REJECTED,
    HIDDEN
}
