package com.liyaqa.trainer.api

import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.trainer.application.services.TrainerNotificationService
import com.liyaqa.trainer.infrastructure.persistence.JpaTrainerNotificationRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for trainer notification management.
 *
 * Endpoints:
 * - List notifications with filtering
 * - Get unread count
 * - Mark notifications as read
 * - Delete notification
 */
@RestController
@RequestMapping("/api/trainer-portal/notifications")
@Tag(name = "Trainer Portal - Notifications", description = "Trainer notification management")
class TrainerNotificationController(
    private val trainerNotificationService: TrainerNotificationService,
    private val trainerNotificationRepository: JpaTrainerNotificationRepository
) {
    private val logger = LoggerFactory.getLogger(TrainerNotificationController::class.java)

    @GetMapping
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isOwnProfile(#trainerId)")
    @Operation(summary = "List trainer notifications", description = "Get paginated list of trainer's notifications with optional filtering")
    fun getNotifications(
        @RequestParam trainerId: UUID,
        @RequestParam(required = false) isRead: Boolean?,
        @RequestParam(required = false) priority: NotificationPriority?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<TrainerNotificationResponse>> {
        logger.debug("Fetching notifications for trainer $trainerId (isRead: $isRead, priority: $priority)")

        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))

        val notificationPage = when {
            isRead == false -> trainerNotificationService.getUnreadNotifications(trainerId, pageable)
            isRead == true -> {
                // Filter by read status
                val allNotifs = trainerNotificationService.getNotificationsForTrainer(trainerId, pageable)
                allNotifs // The service doesn't have getReadNotifications, so we return all and filter in response
            }
            else -> trainerNotificationService.getNotificationsForTrainer(trainerId, pageable)
        }

        val filteredContent = if (isRead == true) {
            notificationPage.content.filter { it.isRead }
        } else {
            notificationPage.content
        }

        val response = PageResponse(
            content = filteredContent.map { TrainerNotificationResponse.from(it) },
            page = notificationPage.number,
            size = notificationPage.size,
            totalElements = filteredContent.size.toLong(),
            totalPages = if (filteredContent.isEmpty()) 0 else 1,
            first = notificationPage.isFirst,
            last = notificationPage.isLast
        )

        return ResponseEntity.ok(response)
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isOwnProfile(#trainerId)")
    @Operation(summary = "Get unread notification count", description = "Get the count of unread notifications for a trainer")
    fun getUnreadCount(@RequestParam trainerId: UUID): ResponseEntity<Map<String, Long>> {
        logger.debug("Fetching unread count for trainer $trainerId")

        val count = trainerNotificationRepository.countUnreadByTrainerId(trainerId)
        return ResponseEntity.ok(mapOf("unreadCount" to count))
    }

    @PutMapping("/mark-read")
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isOwnProfile(#trainerId)")
    @Operation(summary = "Mark multiple notifications as read", description = "Mark multiple notifications as read")
    fun markNotificationsRead(
        @RequestParam trainerId: UUID,
        @Valid @RequestBody request: MarkNotificationsReadRequest
    ): ResponseEntity<Void> {
        logger.debug("Marking ${request.notificationIds.size} notifications as read for trainer $trainerId")

        request.notificationIds.forEach { notificationId ->
            val notification = trainerNotificationRepository.findById(notificationId).orElse(null)
            if (notification != null && notification.trainerId == trainerId) {
                notification.markAsRead()
                trainerNotificationRepository.save(notification)
            }
        }

        logger.info("Marked ${request.notificationIds.size} notifications as read for trainer $trainerId")
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasAuthority('trainer_portal_view')")
    @Operation(summary = "Mark single notification as read", description = "Mark a single notification as read")
    fun markNotificationRead(@PathVariable id: UUID): ResponseEntity<TrainerNotificationResponse> {
        logger.debug("Marking notification $id as read")

        val notification = trainerNotificationService.getNotification(id)
        notification.markAsRead()
        val updated = trainerNotificationRepository.save(notification)

        logger.info("Marked notification $id as read")
        return ResponseEntity.ok(TrainerNotificationResponse.from(updated))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('trainer_portal_view')")
    @Operation(summary = "Delete notification", description = "Delete a notification")
    fun deleteNotification(@PathVariable id: UUID): ResponseEntity<Void> {
        logger.debug("Deleting notification $id")

        trainerNotificationRepository.deleteById(id)

        logger.info("Deleted notification $id")
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/mark-all-read")
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isOwnProfile(#trainerId)")
    @Operation(summary = "Mark all notifications as read", description = "Mark all notifications as read for a trainer")
    fun markAllNotificationsRead(@RequestParam trainerId: UUID): ResponseEntity<Map<String, Any>> {
        logger.debug("Marking all notifications as read for trainer $trainerId")

        val notifications = trainerNotificationService.getUnreadNotifications(trainerId, PageRequest.of(0, 1000)).content
        notifications.forEach { notification ->
            notification.markAsRead()
            trainerNotificationRepository.save(notification)
        }

        logger.info("Marked ${notifications.size} notifications as read for trainer $trainerId")
        return ResponseEntity.ok(mapOf(
            "message" to "All notifications marked as read",
            "count" to notifications.size
        ))
    }
}
