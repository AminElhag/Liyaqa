package com.liyaqa.platform.subscription.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "feature_flags")
class FeatureFlag(
    id: UUID = UUID.randomUUID(),

    @Column(name = "key", nullable = false, unique = true, length = 100)
    var key: String,

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "description")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    var category: FeatureCategory,

    @Column(name = "default_enabled", nullable = false)
    var defaultEnabled: Boolean = false,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true

) : OrganizationLevelEntity(id) {

    companion object {
        fun create(
            key: String,
            name: String,
            category: FeatureCategory,
            defaultEnabled: Boolean = false
        ): FeatureFlag = FeatureFlag(
            key = key,
            name = name,
            category = category,
            defaultEnabled = defaultEnabled
        )
    }
}
