package com.liyaqa.kiosk.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "kiosk_sessions")
class KioskSession(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "kiosk_id", nullable = false)
    val kioskId: UUID,

    @Column(name = "member_id")
    var memberId: UUID? = null,

    @Column(name = "started_at")
    val startedAt: Instant = Instant.now(),

    @Column(name = "ended_at")
    var endedAt: Instant? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "identification_method", length = 20)
    var identificationMethod: IdentificationMethod? = null,

    @Column(name = "identification_value", length = 255)
    var identificationValue: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "session_status", length = 20)
    var sessionStatus: SessionStatus = SessionStatus.ACTIVE,

    @Column(name = "actions_taken")
    var actionsTaken: String = "[]",

    @Column(name = "feedback_rating")
    var feedbackRating: Int? = null,

    @Column(name = "feedback_comment", columnDefinition = "TEXT")
    var feedbackComment: String? = null,

    @Column(name = "created_at")
    val createdAt: Instant = Instant.now()
) {
    fun identify(method: IdentificationMethod, value: String, memberId: UUID) {
        this.identificationMethod = method
        this.identificationValue = value
        this.memberId = memberId
    }

    fun complete() {
        sessionStatus = SessionStatus.COMPLETED
        endedAt = Instant.now()
    }

    fun abandon() {
        sessionStatus = SessionStatus.ABANDONED
        endedAt = Instant.now()
    }

    fun timeout() {
        sessionStatus = SessionStatus.TIMED_OUT
        endedAt = Instant.now()
    }

    fun addFeedback(rating: Int, comment: String?) {
        feedbackRating = rating
        feedbackComment = comment
    }

    fun getDurationSeconds(): Long? {
        val end = endedAt ?: return null
        return end.epochSecond - startedAt.epochSecond
    }
}
