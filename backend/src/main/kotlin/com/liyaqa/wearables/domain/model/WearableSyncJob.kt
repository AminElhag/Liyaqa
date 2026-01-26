package com.liyaqa.wearables.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.*

/**
 * Tracks wearable data synchronization jobs.
 */
@Entity
@Table(name = "wearable_sync_jobs")
class WearableSyncJob(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "connection_id", nullable = false)
    val connectionId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false)
    val jobType: SyncJobType,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: SyncJobStatus = SyncJobStatus.PENDING,

    @Column(name = "started_at")
    var startedAt: Instant? = null,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @Column(name = "records_processed")
    var recordsProcessed: Int = 0,

    @Column(name = "records_created")
    var recordsCreated: Int = 0,

    @Column(name = "records_updated")
    var recordsUpdated: Int = 0,

    @Column(name = "records_failed")
    var recordsFailed: Int = 0,

    @Column(name = "error_message")
    var errorMessage: String? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
) {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connection_id", insertable = false, updatable = false)
    var connection: MemberWearableConnection? = null

    fun start() {
        status = SyncJobStatus.RUNNING
        startedAt = Instant.now()
    }

    fun complete() {
        status = SyncJobStatus.COMPLETED
        completedAt = Instant.now()
    }

    fun fail(message: String) {
        status = SyncJobStatus.FAILED
        completedAt = Instant.now()
        errorMessage = message
    }

    fun incrementProcessed() {
        recordsProcessed++
    }

    fun incrementCreated() {
        recordsCreated++
        recordsProcessed++
    }

    fun incrementUpdated() {
        recordsUpdated++
        recordsProcessed++
    }

    fun incrementFailed() {
        recordsFailed++
        recordsProcessed++
    }

    fun isRunning(): Boolean = status == SyncJobStatus.RUNNING

    fun getDurationSeconds(): Long? {
        val start = startedAt ?: return null
        val end = completedAt ?: Instant.now()
        return java.time.Duration.between(start, end).seconds
    }
}
