package com.liyaqa.platform.config.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "maintenance_windows")
class MaintenanceWindow(
    id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id")
    val tenantId: UUID? = null,

    @Column(name = "title", nullable = false, length = 500)
    val title: String,

    @Column(name = "title_ar", length = 500)
    val titleAr: String? = null,

    @Column(name = "description", columnDefinition = "TEXT")
    val description: String? = null,

    @Column(name = "description_ar", columnDefinition = "TEXT")
    val descriptionAr: String? = null,

    @Column(name = "start_at", nullable = false)
    val startAt: Instant,

    @Column(name = "end_at", nullable = false)
    val endAt: Instant,

    @Column(name = "is_active")
    var isActive: Boolean = true,

    @Column(name = "created_by", nullable = false)
    val createdBy: UUID
) : OrganizationLevelEntity(id) {

    fun cancel() {
        isActive = false
    }

    fun isCurrentlyActive(): Boolean =
        isActive && Instant.now().let { now -> !now.isBefore(startAt) && now.isBefore(endAt) }

    companion object {
        fun create(
            tenantId: UUID? = null,
            title: String,
            titleAr: String? = null,
            description: String? = null,
            descriptionAr: String? = null,
            startAt: Instant,
            endAt: Instant,
            createdBy: UUID
        ): MaintenanceWindow {
            require(endAt.isAfter(startAt)) { "endAt must be after startAt" }
            return MaintenanceWindow(
                tenantId = tenantId,
                title = title,
                titleAr = titleAr,
                description = description,
                descriptionAr = descriptionAr,
                startAt = startAt,
                endAt = endAt,
                createdBy = createdBy
            )
        }
    }
}
