package com.liyaqa.platform.content.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.util.UUID

@Entity
@Table(name = "document_templates")
class DocumentTemplate(
    id: UUID = UUID.randomUUID(),

    @Column(name = "key", unique = true, nullable = false, length = 200)
    val key: String,

    @Column(name = "name", nullable = false, length = 500)
    var name: String,

    @Column(name = "name_ar", length = 500)
    var nameAr: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    var type: TemplateType,

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    var content: String,

    @Column(name = "content_ar", columnDefinition = "TEXT")
    var contentAr: String? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "variables", columnDefinition = "jsonb")
    var variables: MutableList<String> = mutableListOf(),

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "updated_by")
    var updatedBy: UUID? = null

) : OrganizationLevelEntity(id) {

    fun activate() {
        isActive = true
    }

    fun deactivate() {
        isActive = false
    }

    companion object {
        fun create(
            key: String,
            name: String,
            nameAr: String? = null,
            type: TemplateType,
            content: String,
            contentAr: String? = null,
            variables: List<String> = emptyList()
        ): DocumentTemplate {
            return DocumentTemplate(
                key = key,
                name = name,
                nameAr = nameAr,
                type = type,
                content = content,
                contentAr = contentAr,
                variables = variables.toMutableList()
            )
        }
    }
}
