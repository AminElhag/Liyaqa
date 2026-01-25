package com.liyaqa.notification.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "device_tokens")
class DeviceToken(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(nullable = false, unique = true, length = 500)
    val token: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    val platform: DevicePlatform,

    @Column(name = "device_name", length = 100)
    val deviceName: String? = null,

    @Column(name = "app_version", length = 20)
    val appVersion: String? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "last_used_at", nullable = false)
    var lastUsedAt: Instant = Instant.now(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID
) {
    fun updateLastUsed() {
        lastUsedAt = Instant.now()
    }
}

enum class DevicePlatform {
    ANDROID,
    IOS
}
