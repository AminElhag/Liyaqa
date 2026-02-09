package com.liyaqa.platform.config.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "global_settings")
class GlobalSetting(
    id: UUID = UUID.randomUUID(),

    @Column(name = "key", nullable = false, unique = true, updatable = false, length = 200)
    val key: String,

    @Column(name = "value", nullable = false, columnDefinition = "TEXT")
    var value: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "value_type", nullable = false, length = 20)
    val valueType: SettingValueType,

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    val category: SettingCategory,

    @Column(name = "description", columnDefinition = "TEXT")
    val description: String? = null,

    @Column(name = "description_ar", columnDefinition = "TEXT")
    val descriptionAr: String? = null,

    @Column(name = "is_editable")
    val isEditable: Boolean = true,

    @Column(name = "updated_by")
    var updatedBy: UUID? = null
) : OrganizationLevelEntity(id) {

    companion object {
        fun create(
            key: String,
            value: String,
            valueType: SettingValueType,
            category: SettingCategory,
            description: String? = null,
            descriptionAr: String? = null,
            isEditable: Boolean = true
        ): GlobalSetting = GlobalSetting(
            key = key,
            value = value,
            valueType = valueType,
            category = category,
            description = description,
            descriptionAr = descriptionAr,
            isEditable = isEditable
        )
    }
}
