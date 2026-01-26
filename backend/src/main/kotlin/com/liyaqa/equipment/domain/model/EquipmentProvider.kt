package com.liyaqa.equipment.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "equipment_providers")
class EquipmentProvider(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(nullable = false, unique = true)
    val name: String,

    @Column(name = "display_name", nullable = false)
    var displayName: String,

    @Column(name = "api_base_url")
    var apiBaseUrl: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_type", nullable = false)
    val authType: AuthType,

    @Column(name = "documentation_url")
    var documentationUrl: String? = null,

    @Column(name = "logo_url")
    var logoUrl: String? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
