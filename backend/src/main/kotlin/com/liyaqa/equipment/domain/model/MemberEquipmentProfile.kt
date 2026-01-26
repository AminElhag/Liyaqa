package com.liyaqa.equipment.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "member_equipment_profiles")
class MemberEquipmentProfile(
    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "provider_id", nullable = false)
    val providerId: UUID,

    @Column(name = "external_member_id")
    var externalMemberId: String? = null,

    @Column(name = "external_username")
    var externalUsername: String? = null,

    @Column(name = "oauth_access_token_encrypted")
    var oauthAccessTokenEncrypted: String? = null,

    @Column(name = "oauth_refresh_token_encrypted")
    var oauthRefreshTokenEncrypted: String? = null,

    @Column(name = "oauth_token_expires_at")
    var oauthTokenExpiresAt: Instant? = null,

    @Column(name = "sync_enabled", nullable = false)
    var syncEnabled: Boolean = true,

    @Column(name = "last_sync_at")
    var lastSyncAt: Instant? = null
) : BaseEntity() {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", insertable = false, updatable = false)
    var provider: EquipmentProvider? = null

    fun isTokenExpired(): Boolean {
        return oauthTokenExpiresAt?.isBefore(Instant.now()) ?: true
    }

    fun updateSyncTime() {
        lastSyncAt = Instant.now()
    }
}
