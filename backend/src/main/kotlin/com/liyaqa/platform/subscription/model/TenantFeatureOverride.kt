package com.liyaqa.platform.subscription.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "tenant_feature_overrides")
class TenantFeatureOverride(
    id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    var tenantId: UUID,

    @Column(name = "feature_key", nullable = false, length = 100)
    var featureKey: String,

    @Column(name = "enabled", nullable = false)
    var enabled: Boolean,

    @Column(name = "reason")
    var reason: String? = null,

    @Column(name = "overridden_by", nullable = false)
    var overriddenBy: UUID

) : OrganizationLevelEntity(id) {

    companion object {
        fun create(
            tenantId: UUID,
            featureKey: String,
            enabled: Boolean,
            reason: String? = null,
            overriddenBy: UUID
        ): TenantFeatureOverride = TenantFeatureOverride(
            tenantId = tenantId,
            featureKey = featureKey,
            enabled = enabled,
            reason = reason,
            overriddenBy = overriddenBy
        )
    }
}
