package com.liyaqa.member.data.repository

import com.liyaqa.member.data.api.MemberApiService
import com.liyaqa.member.data.api.toResult
import com.liyaqa.member.data.dto.ChannelPreferencesDto
import com.liyaqa.member.data.dto.TypePreferencesDto
import com.liyaqa.member.data.dto.UpdatePreferencesRequestDto
import com.liyaqa.member.data.mapper.toDomain
import com.liyaqa.member.domain.model.Notification
import com.liyaqa.member.domain.model.NotificationPreferences
import com.liyaqa.member.domain.model.PagedResult
import com.liyaqa.member.domain.repository.NotificationRepository

/**
 * Implementation of NotificationRepository using MemberApiService.
 */
class NotificationRepositoryImpl(
    private val api: MemberApiService
) : NotificationRepository {

    override suspend fun getNotifications(
        unreadOnly: Boolean,
        page: Int,
        size: Int
    ): Result<PagedResult<Notification>> {
        return api.getNotifications(unreadOnly, page, size).toResult { response ->
            PagedResult(
                items = response.items.map { it.toDomain() },
                hasMore = response.hasMore,
                totalCount = response.totalCount
            )
        }
    }

    override suspend fun getUnreadCount(): Result<Int> {
        return api.getUnreadCount().toResult { it.count }
    }

    override suspend fun markAsRead(notificationId: String): Result<Unit> {
        return api.markNotificationRead(notificationId).toResult { }
    }

    override suspend fun markAllAsRead(): Result<Unit> {
        return api.markAllNotificationsRead().toResult { }
    }

    override suspend fun getPreferences(memberId: String): Result<NotificationPreferences> {
        return api.getNotificationPreferences(memberId).toResult { dto ->
            NotificationPreferences(
                memberId = dto.memberId,
                emailEnabled = dto.channelPreferences.emailEnabled,
                smsEnabled = dto.channelPreferences.smsEnabled,
                pushEnabled = dto.channelPreferences.pushEnabled,
                subscriptionReminders = dto.typePreferences.subscriptionReminders,
                invoiceAlerts = dto.typePreferences.invoiceAlerts,
                bookingUpdates = dto.typePreferences.bookingUpdates,
                classReminders = dto.typePreferences.classReminders,
                marketing = dto.typePreferences.marketing,
                preferredLanguage = dto.preferredLanguage
            )
        }
    }

    override suspend fun updatePreferences(
        memberId: String,
        preferences: NotificationPreferences
    ): Result<NotificationPreferences> {
        val request = UpdatePreferencesRequestDto(
            channelPreferences = ChannelPreferencesDto(
                emailEnabled = preferences.emailEnabled,
                smsEnabled = preferences.smsEnabled,
                pushEnabled = preferences.pushEnabled
            ),
            typePreferences = TypePreferencesDto(
                subscriptionReminders = preferences.subscriptionReminders,
                invoiceAlerts = preferences.invoiceAlerts,
                bookingUpdates = preferences.bookingUpdates,
                classReminders = preferences.classReminders,
                marketing = preferences.marketing
            ),
            preferredLanguage = preferences.preferredLanguage
        )
        return api.updateNotificationPreferences(memberId, request).toResult { dto ->
            NotificationPreferences(
                memberId = dto.memberId,
                emailEnabled = dto.channelPreferences.emailEnabled,
                smsEnabled = dto.channelPreferences.smsEnabled,
                pushEnabled = dto.channelPreferences.pushEnabled,
                subscriptionReminders = dto.typePreferences.subscriptionReminders,
                invoiceAlerts = dto.typePreferences.invoiceAlerts,
                bookingUpdates = dto.typePreferences.bookingUpdates,
                classReminders = dto.typePreferences.classReminders,
                marketing = dto.typePreferences.marketing,
                preferredLanguage = dto.preferredLanguage
            )
        }
    }
}
