package com.liyaqa.platform.communication.model

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
@Table(name = "communication_templates")
class CommunicationTemplate(
    id: UUID = UUID.randomUUID(),

    @Column(name = "code", unique = true, nullable = false, length = 100)
    var code: String,

    @Column(name = "name_en", nullable = false, length = 200)
    var nameEn: String,

    @Column(name = "name_ar", length = 200)
    var nameAr: String? = null,

    @Column(name = "subject_en", columnDefinition = "TEXT", nullable = false)
    var subjectEn: String,

    @Column(name = "subject_ar", columnDefinition = "TEXT")
    var subjectAr: String? = null,

    @Column(name = "body_en", columnDefinition = "TEXT", nullable = false)
    var bodyEn: String,

    @Column(name = "body_ar", columnDefinition = "TEXT")
    var bodyAr: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false)
    var channel: CommunicationChannel = CommunicationChannel.EMAIL,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "variables", columnDefinition = "jsonb")
    var variables: MutableList<String> = mutableListOf(),

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true

) : OrganizationLevelEntity(id) {

    fun getSubject(locale: String): String =
        if (locale.lowercase() == "ar" && subjectAr != null) subjectAr!! else subjectEn

    fun getBody(locale: String): String =
        if (locale.lowercase() == "ar" && bodyAr != null) bodyAr!! else bodyEn

    companion object {
        fun create(
            code: String,
            nameEn: String,
            nameAr: String? = null,
            subjectEn: String,
            subjectAr: String? = null,
            bodyEn: String,
            bodyAr: String? = null,
            channel: CommunicationChannel = CommunicationChannel.EMAIL,
            variables: MutableList<String> = mutableListOf()
        ): CommunicationTemplate {
            return CommunicationTemplate(
                code = code,
                nameEn = nameEn,
                nameAr = nameAr,
                subjectEn = subjectEn,
                subjectAr = subjectAr,
                bodyEn = bodyEn,
                bodyAr = bodyAr,
                channel = channel,
                variables = variables
            )
        }
    }
}
