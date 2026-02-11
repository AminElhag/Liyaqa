package com.liyaqa.platform.communication.dto

import com.liyaqa.platform.communication.model.PlatformUserNotification
import java.time.Instant
import java.util.UUID

data class PlatformUserNotificationResponse(
    val id: UUID,
    val titleEn: String,
    val titleAr: String?,
    val descriptionEn: String,
    val descriptionAr: String?,
    val type: String,
    val read: Boolean,
    val createdAt: Instant,
    val link: String?
) {
    companion object {
        fun from(entity: PlatformUserNotification): PlatformUserNotificationResponse {
            return PlatformUserNotificationResponse(
                id = entity.id,
                titleEn = entity.titleEn,
                titleAr = entity.titleAr,
                descriptionEn = entity.descriptionEn,
                descriptionAr = entity.descriptionAr,
                type = entity.type.name,
                read = entity.read,
                createdAt = entity.createdAt,
                link = entity.link
            )
        }
    }
}
