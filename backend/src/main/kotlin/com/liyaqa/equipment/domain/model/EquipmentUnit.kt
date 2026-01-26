package com.liyaqa.equipment.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "equipment_units")
class EquipmentUnit(
    @Column(name = "location_id", nullable = false)
    val locationId: UUID,

    @Column(name = "provider_id", nullable = false)
    val providerId: UUID,

    @Column(name = "external_id")
    var externalId: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "equipment_type", nullable = false)
    var equipmentType: EquipmentType,

    @Column(nullable = false)
    var name: String,

    @Column(name = "name_ar")
    var nameAr: String? = null,

    @Column
    var model: String? = null,

    @Column(name = "serial_number")
    var serialNumber: String? = null,

    @Column
    var manufacturer: String? = null,

    @Column(name = "is_connected", nullable = false)
    var isConnected: Boolean = false,

    @Column(name = "last_connected_at")
    var lastConnectedAt: Instant? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: EquipmentStatus = EquipmentStatus.ACTIVE,

    @Column
    var zone: String? = null,

    @Column(name = "floor_number")
    var floorNumber: Int? = null,

    @Column(name = "position_x")
    var positionX: Int? = null,

    @Column(name = "position_y")
    var positionY: Int? = null,

    @Column(columnDefinition = "jsonb")
    var metadata: String = "{}"
) : BaseEntity() {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", insertable = false, updatable = false)
    var provider: EquipmentProvider? = null

    fun markConnected() {
        isConnected = true
        lastConnectedAt = Instant.now()
    }

    fun markDisconnected() {
        isConnected = false
    }
}
