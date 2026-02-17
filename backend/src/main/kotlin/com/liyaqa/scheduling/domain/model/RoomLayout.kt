package com.liyaqa.scheduling.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.util.UUID

/**
 * Represents a room layout for spot-based booking.
 * The layout is a grid (rows x columns) with individually configured spots.
 *
 * The layout_json field stores an array of spot definitions:
 * [{"id":"A1","row":0,"col":0,"label":"Front Row 1","status":"AVAILABLE"}, ...]
 */
@Entity
@Table(name = "room_layouts")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class RoomLayout(
    id: UUID = UUID.randomUUID(),

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    @Column(name = "rows", nullable = false)
    var rows: Int = 4,

    @Column(name = "columns", nullable = false)
    var columns: Int = 5,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "layout_json", nullable = false, columnDefinition = "jsonb")
    var layoutJson: String = "[]",

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true

) : BaseEntity(id) {

    fun activate() {
        isActive = true
    }

    fun deactivate() {
        isActive = false
    }
}
