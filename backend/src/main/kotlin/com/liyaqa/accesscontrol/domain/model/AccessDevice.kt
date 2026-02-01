package com.liyaqa.accesscontrol.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.*

@Entity
@Table(name = "access_devices")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class AccessDevice(
    @Column(name = "location_id", nullable = false)
    var locationId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false, length = 30)
    var deviceType: DeviceType,

    @Column(name = "device_name", nullable = false, length = 100)
    var deviceName: String,

    @Column(name = "device_name_ar", length = 100)
    var deviceNameAr: String? = null,

    @Column(name = "manufacturer", length = 50)
    var manufacturer: String? = null,

    @Column(name = "model", length = 50)
    var model: String? = null,

    @Column(name = "serial_number", length = 100)
    var serialNumber: String? = null,

    @Column(name = "ip_address", length = 45)
    var ipAddress: String? = null,

    @Column(name = "api_endpoint", length = 255)
    var apiEndpoint: String? = null,

    @Column(name = "api_key_encrypted", columnDefinition = "TEXT")
    var apiKeyEncrypted: String? = null,

    @Column(name = "zone_id")
    var zoneId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 15)
    var direction: DeviceDirection,

    @Column(name = "is_online")
    var isOnline: Boolean = false,

    @Column(name = "last_heartbeat")
    var lastHeartbeat: Instant? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    var status: DeviceStatus = DeviceStatus.ACTIVE,

    @Column(name = "config")
    var config: String? = null
) : BaseEntity() {

    fun updateHeartbeat() {
        lastHeartbeat = Instant.now()
        isOnline = true
    }

    fun markOffline() {
        isOnline = false
        status = DeviceStatus.OFFLINE
    }
}
