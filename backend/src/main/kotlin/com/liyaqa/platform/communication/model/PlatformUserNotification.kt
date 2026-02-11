package com.liyaqa.platform.communication.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.util.UUID

enum class InboxNotificationType {
    INFO, SUCCESS, WARNING, ERROR, SYSTEM
}

@Entity(name = "PlatformUserNotification")
@Table(name = "platform_user_notifications")
class PlatformUserNotification(
    id: UUID = UUID.randomUUID(),

    @Column(name = "recipient_id", nullable = false, updatable = false)
    val recipientId: UUID,

    @Column(name = "title_en", nullable = false)
    var titleEn: String,

    @Column(name = "title_ar")
    var titleAr: String? = null,

    @Column(name = "description_en", columnDefinition = "TEXT", nullable = false)
    var descriptionEn: String,

    @Column(name = "description_ar", columnDefinition = "TEXT")
    var descriptionAr: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    var type: InboxNotificationType,

    @Column(name = "read", nullable = false)
    var read: Boolean = false,

    @Column(name = "link", length = 500)
    var link: String? = null

) : OrganizationLevelEntity(id) {

    fun markRead() {
        read = true
    }

    companion object {
        fun create(
            recipientId: UUID,
            titleEn: String,
            titleAr: String? = null,
            descriptionEn: String,
            descriptionAr: String? = null,
            type: InboxNotificationType,
            link: String? = null
        ): PlatformUserNotification {
            return PlatformUserNotification(
                recipientId = recipientId,
                titleEn = titleEn,
                titleAr = titleAr,
                descriptionEn = descriptionEn,
                descriptionAr = descriptionAr,
                type = type,
                link = link
            )
        }
    }
}
