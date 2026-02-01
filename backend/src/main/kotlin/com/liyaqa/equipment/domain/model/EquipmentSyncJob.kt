package com.liyaqa.equipment.domain.model

import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.*

@Entity
@Table(name = "equipment_sync_jobs")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class EquipmentSyncJob(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "provider_config_id", nullable = false)
    val providerConfigId: UUID,

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

    @Column(name = "error_details")
    var errorDetails: String? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
) {
    fun start() {
        status = SyncJobStatus.RUNNING
        startedAt = Instant.now()
    }

    fun complete() {
        status = SyncJobStatus.COMPLETED
        completedAt = Instant.now()
    }

    fun fail(message: String, details: String? = null) {
        status = SyncJobStatus.FAILED
        completedAt = Instant.now()
        errorMessage = message
        errorDetails = details
    }

    fun incrementProcessed() {
        recordsProcessed++
    }

    fun incrementCreated() {
        recordsCreated++
    }

    fun incrementUpdated() {
        recordsUpdated++
    }

    fun incrementFailed() {
        recordsFailed++
    }
}
