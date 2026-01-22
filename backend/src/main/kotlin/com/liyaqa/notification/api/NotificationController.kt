package com.liyaqa.notification.api

import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.notification.domain.model.Notification
import com.liyaqa.notification.domain.model.NotificationChannel
import com.liyaqa.shared.domain.LocalizedText
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/notifications")
class NotificationController(
    private val notificationService: NotificationService
) {
    // ==================== NOTIFICATION ENDPOINTS ====================

    /**
     * Sends a notification.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('notifications_create')")
    fun sendNotification(@Valid @RequestBody request: SendNotificationRequest): ResponseEntity<NotificationResponse> {
        val subject = if (request.subjectEn != null) {
            LocalizedText(en = request.subjectEn, ar = request.subjectAr)
        } else null

        val body = LocalizedText(en = request.bodyEn, ar = request.bodyAr)

        val notification: Notification = when (request.channel) {
            NotificationChannel.EMAIL -> {
                require(request.recipientEmail != null) { "Email address is required for email notifications" }
                require(subject != null) { "Subject is required for email notifications" }
                notificationService.sendEmail(
                    memberId = request.memberId,
                    email = request.recipientEmail,
                    type = request.notificationType,
                    subject = subject,
                    body = body,
                    priority = request.priority,
                    referenceId = request.referenceId,
                    referenceType = request.referenceType
                )
            }
            NotificationChannel.SMS -> {
                require(request.recipientPhone != null) { "Phone number is required for SMS notifications" }
                notificationService.sendSms(
                    memberId = request.memberId,
                    phone = request.recipientPhone,
                    type = request.notificationType,
                    body = body,
                    priority = request.priority,
                    referenceId = request.referenceId,
                    referenceType = request.referenceType
                )
            }
            else -> throw IllegalArgumentException("Unsupported notification channel: ${request.channel}")
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(NotificationResponse.from(notification))
    }

    /**
     * Gets a notification by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('notifications_view')")
    fun getNotification(@PathVariable id: UUID): ResponseEntity<NotificationResponse> {
        val notification = notificationService.getNotification(id)
        return ResponseEntity.ok(NotificationResponse.from(notification))
    }

    /**
     * Gets notifications for a member.
     */
    @GetMapping("/member/{memberId}")
    @PreAuthorize("hasAuthority('notifications_view')")
    fun getNotificationsByMember(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<NotificationResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val notificationsPage = notificationService.getNotificationsByMember(memberId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = notificationsPage.content.map { NotificationResponse.from(it) },
                page = notificationsPage.number,
                size = notificationsPage.size,
                totalElements = notificationsPage.totalElements,
                totalPages = notificationsPage.totalPages,
                first = notificationsPage.isFirst,
                last = notificationsPage.isLast
            )
        )
    }

    /**
     * Gets unread notification count for a member.
     */
    @GetMapping("/member/{memberId}/unread-count")
    @PreAuthorize("hasAuthority('notifications_view')")
    fun getUnreadCount(@PathVariable memberId: UUID): ResponseEntity<Map<String, Long>> {
        val count = notificationService.getUnreadCount(memberId)
        return ResponseEntity.ok(mapOf("unreadCount" to count))
    }

    /**
     * Marks a notification as read.
     */
    @PostMapping("/{id}/read")
    @PreAuthorize("hasAuthority('notifications_update')")
    fun markAsRead(@PathVariable id: UUID): ResponseEntity<NotificationResponse> {
        val notification = notificationService.markAsRead(id)
        return ResponseEntity.ok(NotificationResponse.from(notification))
    }

    /**
     * Marks all notifications as read for a member.
     */
    @PostMapping("/member/{memberId}/read-all")
    @PreAuthorize("hasAuthority('notifications_update')")
    fun markAllAsRead(@PathVariable memberId: UUID): ResponseEntity<Map<String, Int>> {
        val count = notificationService.markAllAsRead(memberId)
        return ResponseEntity.ok(mapOf("markedAsRead" to count))
    }

    // ==================== PREFERENCE ENDPOINTS ====================

    /**
     * Gets notification preferences for a member.
     */
    @GetMapping("/preferences/{memberId}")
    @PreAuthorize("hasAuthority('notifications_view')")
    fun getPreferences(@PathVariable memberId: UUID): ResponseEntity<NotificationPreferenceResponse> {
        val preference = notificationService.getOrCreatePreference(memberId)
        return ResponseEntity.ok(NotificationPreferenceResponse.from(preference))
    }

    /**
     * Updates notification preferences for a member.
     */
    @PutMapping("/preferences/{memberId}")
    @PreAuthorize("hasAuthority('notifications_update')")
    fun updatePreferences(
        @PathVariable memberId: UUID,
        @RequestBody request: UpdateNotificationPreferenceRequest
    ): ResponseEntity<NotificationPreferenceResponse> {
        val preference = notificationService.updatePreferences(
            memberId = memberId,
            emailEnabled = request.emailEnabled,
            smsEnabled = request.smsEnabled,
            pushEnabled = request.pushEnabled,
            subscriptionRemindersEnabled = request.subscriptionRemindersEnabled,
            invoiceNotificationsEnabled = request.invoiceNotificationsEnabled,
            classBookingNotificationsEnabled = request.classBookingNotificationsEnabled,
            classReminder24hEnabled = request.classReminder24hEnabled,
            classReminder1hEnabled = request.classReminder1hEnabled,
            marketingEnabled = request.marketingEnabled,
            preferredLanguage = request.preferredLanguage
        )
        return ResponseEntity.ok(NotificationPreferenceResponse.from(preference))
    }
}
