package com.liyaqa.trainer.domain.model

import com.liyaqa.shared.domain.OrganizationAwareEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.LocalDate
import java.util.UUID

/**
 * TrainerClient entity representing the ongoing relationship between
 * a trainer and their PT (Personal Training) client.
 *
 * Key features:
 * - Tracks the relationship lifecycle (active, inactive, on hold, completed)
 * - Stores client-specific goals and trainer notes
 * - Maintains session statistics (total, completed, cancelled, no-shows)
 * - Automatically created on first PT session between trainer and member
 * - Used for client roster management and progress tracking
 */
@Entity
@Table(name = "trainer_clients")
@Filter(
    name = "tenantFilter",
    condition = "tenant_id = :tenantId OR organization_id = (SELECT c.organization_id FROM clubs c WHERE c.id = :tenantId)"
)
class TrainerClient(
    id: UUID = UUID.randomUUID(),

    /**
     * Reference to the Trainer.
     */
    @Column(name = "trainer_id", nullable = false)
    var trainerId: UUID,

    /**
     * Reference to the Member (client).
     */
    @Column(name = "member_id", nullable = false)
    var memberId: UUID,

    /**
     * Date when the trainer-client relationship started.
     * Typically the date of the first PT session.
     */
    @Column(name = "start_date", nullable = false)
    var startDate: LocalDate,

    /**
     * Date when the relationship ended (null if still active).
     */
    @Column(name = "end_date")
    var endDate: LocalDate? = null,

    /**
     * Current status of the relationship.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: TrainerClientStatus = TrainerClientStatus.ACTIVE,

    // ========== Goals and Notes ==========

    /**
     * Client fitness goals in English.
     * Editable by trainer to track client objectives.
     */
    @Column(name = "goals_en", columnDefinition = "TEXT")
    var goalsEn: String? = null,

    /**
     * Client fitness goals in Arabic.
     */
    @Column(name = "goals_ar", columnDefinition = "TEXT")
    var goalsAr: String? = null,

    /**
     * Trainer notes about the client in English.
     * Can include preferences, restrictions, observations, etc.
     */
    @Column(name = "notes_en", columnDefinition = "TEXT")
    var notesEn: String? = null,

    /**
     * Trainer notes about the client in Arabic.
     */
    @Column(name = "notes_ar", columnDefinition = "TEXT")
    var notesAr: String? = null,

    // ========== Session Statistics ==========

    /**
     * Total number of PT sessions (all statuses combined).
     */
    @Column(name = "total_sessions", nullable = false)
    var totalSessions: Int = 0,

    /**
     * Number of completed sessions.
     */
    @Column(name = "completed_sessions", nullable = false)
    var completedSessions: Int = 0,

    /**
     * Number of cancelled sessions (by either party).
     */
    @Column(name = "cancelled_sessions", nullable = false)
    var cancelledSessions: Int = 0,

    /**
     * Number of no-show sessions (member didn't attend).
     */
    @Column(name = "no_show_sessions", nullable = false)
    var noShowSessions: Int = 0,

    /**
     * Date of the most recent session.
     */
    @Column(name = "last_session_date")
    var lastSessionDate: LocalDate? = null

) : OrganizationAwareEntity(id) {

    // ========== Domain Methods ==========

    /**
     * Increment session counters when a new session is created.
     */
    fun recordSessionCreated() {
        totalSessions++
    }

    /**
     * Record a completed session and update statistics.
     */
    fun recordSessionCompleted(sessionDate: LocalDate) {
        completedSessions++
        lastSessionDate = sessionDate
    }

    /**
     * Record a cancelled session.
     */
    fun recordSessionCancelled() {
        cancelledSessions++
    }

    /**
     * Record a no-show session.
     */
    fun recordNoShow(sessionDate: LocalDate) {
        noShowSessions++
        lastSessionDate = sessionDate
    }

    /**
     * Set relationship status to INACTIVE.
     */
    fun deactivate(endDate: LocalDate = LocalDate.now()) {
        this.status = TrainerClientStatus.INACTIVE
        this.endDate = endDate
    }

    /**
     * Set relationship status to ON_HOLD (temporarily paused).
     */
    fun putOnHold() {
        this.status = TrainerClientStatus.ON_HOLD
    }

    /**
     * Reactivate relationship from ON_HOLD or INACTIVE.
     */
    fun reactivate() {
        this.status = TrainerClientStatus.ACTIVE
        this.endDate = null
    }

    /**
     * Mark relationship as COMPLETED (goals achieved).
     */
    fun complete(endDate: LocalDate = LocalDate.now()) {
        this.status = TrainerClientStatus.COMPLETED
        this.endDate = endDate
    }

    // ========== Computed Properties ==========

    /**
     * Calculate attendance rate (completed / total).
     */
    fun getAttendanceRate(): Double {
        if (totalSessions == 0) return 0.0
        return (completedSessions.toDouble() / totalSessions.toDouble()) * 100
    }

    /**
     * Calculate no-show rate.
     */
    fun getNoShowRate(): Double {
        if (totalSessions == 0) return 0.0
        return (noShowSessions.toDouble() / totalSessions.toDouble()) * 100
    }

    /**
     * Check if relationship is currently active.
     */
    fun isActive(): Boolean {
        return status == TrainerClientStatus.ACTIVE
    }

    /**
     * Check if relationship is paused.
     */
    fun isOnHold(): Boolean {
        return status == TrainerClientStatus.ON_HOLD
    }

    /**
     * Get relationship duration in days.
     */
    fun getRelationshipDurationDays(): Long {
        val end = endDate ?: LocalDate.now()
        return java.time.temporal.ChronoUnit.DAYS.between(startDate, end)
    }
}
