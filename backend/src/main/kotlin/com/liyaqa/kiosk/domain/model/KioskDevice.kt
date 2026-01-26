package com.liyaqa.kiosk.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.*

@Entity
@Table(name = "kiosk_devices")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class KioskDevice(
    @Column(name = "location_id", nullable = false)
    var locationId: UUID,

    @Column(name = "device_name", nullable = false, length = 100)
    var deviceName: String,

    @Column(name = "device_name_ar", length = 100)
    var deviceNameAr: String? = null,

    @Column(name = "device_code", nullable = false, length = 20)
    var deviceCode: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    var status: KioskStatus = KioskStatus.INACTIVE,

    @Column(name = "last_heartbeat")
    var lastHeartbeat: Instant? = null,

    @Column(name = "hardware_id", length = 100)
    var hardwareId: String? = null,

    @Column(name = "config", columnDefinition = "jsonb")
    var config: String = "{}",

    @Column(name = "allowed_actions", columnDefinition = "jsonb")
    var allowedActions: String = "[\"CHECK_IN\", \"CLASS_BOOKING\", \"PAYMENT\"]"
) : BaseEntity() {

    fun isOnline(): Boolean {
        if (lastHeartbeat == null) return false
        val fiveMinutesAgo = Instant.now().minusSeconds(300)
        return lastHeartbeat!!.isAfter(fiveMinutesAgo)
    }

    fun updateHeartbeat() {
        lastHeartbeat = Instant.now()
        if (status == KioskStatus.INACTIVE) {
            status = KioskStatus.ACTIVE
        }
    }

    fun activate() {
        status = KioskStatus.ACTIVE
    }

    fun deactivate() {
        status = KioskStatus.INACTIVE
    }

    fun setMaintenance() {
        status = KioskStatus.MAINTENANCE
    }
}
