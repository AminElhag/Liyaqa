package com.liyaqa.trainer.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.shared.application.services.RateLimitResult
import com.liyaqa.trainer.application.services.TrainerNotificationService
import com.liyaqa.trainer.domain.model.NotificationType
import com.liyaqa.trainer.domain.model.TrainerNotification
import com.liyaqa.trainer.infrastructure.persistence.JpaTrainerNotificationRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.time.Instant
import java.util.*

@WebMvcTest(TrainerNotificationController::class)
class TrainerNotificationControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var trainerNotificationService: TrainerNotificationService

    @MockBean
    private lateinit var trainerNotificationRepository: JpaTrainerNotificationRepository

    @MockBean
    private lateinit var jwtTokenProvider: com.liyaqa.auth.infrastructure.security.JwtTokenProvider

    @MockBean
    private lateinit var rateLimitService: com.liyaqa.shared.application.services.RateLimitService

    @MockBean
    private lateinit var clubRepository: com.liyaqa.organization.domain.ports.ClubRepository

    @MockBean
    private lateinit var trainerSecurityService: com.liyaqa.trainer.application.services.TrainerSecurityService

    private lateinit var trainerId: UUID
    private lateinit var notificationId: UUID
    private lateinit var notification: TrainerNotification

    @BeforeEach
    fun setUp() {
        trainerId = UUID.randomUUID()
        notificationId = UUID.randomUUID()

        // Mock rate limit service to allow all requests
        whenever(rateLimitService.checkAndIncrement(any(), any(), any())).thenReturn(
            RateLimitResult(
                allowed = true,
                currentCount = 1,
                limit = 100,
                windowStart = Instant.now(),
                remaining = 99
            )
        )

        notification = TrainerNotification(
            id = notificationId,
            trainerId = trainerId,
            notificationType = NotificationType.PT_REQUEST,
            titleEn = "New Session Booking",
            titleAr = "حجز جلسة جديدة",
            messageEn = "You have a new PT session booking",
            messageAr = "لديك حجز جلسة تدريب شخصي جديد",
            relatedEntityId = UUID.randomUUID()
        )
        // createdAt is set automatically
    }

    // ==================== LIST NOTIFICATIONS TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getNotifications - returns paginated list of notifications`() {
        // Given
        val notificationsPage = PageImpl(listOf(notification))
        whenever(trainerNotificationService.getNotificationsForTrainer(eq(trainerId), any<Pageable>()))
            .thenReturn(notificationsPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/notifications")
                .param("trainerId", trainerId.toString())
                .param("page", "0")
                .param("size", "20")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").isArray)
            .andExpect(jsonPath("$.content[0].id").value(notificationId.toString()))
            .andExpect(jsonPath("$.content[0].notificationType").value("PT_REQUEST"))
            .andExpect(jsonPath("$.content[0].titleEn").value("New Session Booking"))
            .andExpect(jsonPath("$.content[0].isRead").value(false))
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getNotifications - filters by unread status`() {
        // Given
        val notificationsPage = PageImpl(listOf(notification))
        whenever(trainerNotificationService.getUnreadNotifications(eq(trainerId), any<Pageable>()))
            .thenReturn(notificationsPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/notifications")
                .param("trainerId", trainerId.toString())
                .param("isRead", "false")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").isArray)
            .andExpect(jsonPath("$.content[0].isRead").value(false))

        verify(trainerNotificationService).getUnreadNotifications(eq(trainerId), any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getNotifications - filters by read status`() {
        // Given
        val readNotification = TrainerNotification(
            trainerId = trainerId,
            notificationType = NotificationType.PT_REQUEST,
            titleEn = "Read Notification",
            titleAr = "إشعار مقروء"
        )
        readNotification.markAsRead()
        // createdAt is set automatically

        val notificationsPage = PageImpl(listOf(readNotification))
        whenever(trainerNotificationService.getNotificationsForTrainer(eq(trainerId), any<Pageable>()))
            .thenReturn(notificationsPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/notifications")
                .param("trainerId", trainerId.toString())
                .param("isRead", "true")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").isArray)
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getNotifications - returns empty list when no notifications`() {
        // Given
        val emptyPage = PageImpl<TrainerNotification>(emptyList())
        whenever(trainerNotificationService.getNotificationsForTrainer(eq(trainerId), any<Pageable>()))
            .thenReturn(emptyPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/notifications")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").isArray)
            .andExpect(jsonPath("$.content").isEmpty)
    }

    // ==================== UNREAD COUNT TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getUnreadCount - returns count of unread notifications`() {
        // Given
        whenever(trainerNotificationRepository.countUnreadByTrainerId(trainerId)).thenReturn(5)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/notifications/unread-count")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.unreadCount").value(5))
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getUnreadCount - returns zero when no unread notifications`() {
        // Given
        whenever(trainerNotificationRepository.countUnreadByTrainerId(trainerId)).thenReturn(0)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/notifications/unread-count")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.unreadCount").value(0))
    }

    // ==================== MARK AS READ TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `markNotificationsRead - marks multiple notifications as read`() {
        // Given
        val notificationId2 = UUID.randomUUID()
        val notification2 = TrainerNotification(
            id = notificationId2,
            trainerId = trainerId,
            notificationType = NotificationType.EARNINGS_PAID,
            titleEn = "Earning Processed",
            titleAr = "تمت معالجة الأرباح"
        )
        // createdAt is set automatically

        whenever(trainerNotificationRepository.findById(notificationId)).thenReturn(Optional.of(notification))
        whenever(trainerNotificationRepository.findById(notificationId2)).thenReturn(Optional.of(notification2))
        whenever(trainerNotificationRepository.save(any())).thenReturn(notification)

        val request = MarkNotificationsReadRequest(notificationIds = listOf(notificationId, notificationId2))

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/notifications/mark-read")
                .param("trainerId", trainerId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
        )
            .andExpect(status().isNoContent)

        verify(trainerNotificationRepository, times(2)).save(any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `markNotificationsRead - validates notification ownership`() {
        // Given
        val otherTrainerId = UUID.randomUUID()
        val otherNotification = TrainerNotification(
            id = notificationId,
            trainerId = otherTrainerId, // Different trainer
            notificationType = NotificationType.PT_REQUEST,
            titleEn = "Test",
            titleAr = "اختبار"
        )
        // createdAt is set automatically

        whenever(trainerNotificationRepository.findById(notificationId)).thenReturn(Optional.of(otherNotification))

        val request = MarkNotificationsReadRequest(notificationIds = listOf(notificationId))

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/notifications/mark-read")
                .param("trainerId", trainerId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
        )
            .andExpect(status().isNoContent)

        // Should not save notification from different trainer
        verify(trainerNotificationRepository, never()).save(any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `markNotificationRead - marks single notification as read`() {
        // Given
        whenever(trainerNotificationService.getNotification(notificationId)).thenReturn(notification)
        whenever(trainerNotificationRepository.save(any())).thenReturn(notification)

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/notifications/$notificationId/read")
                .with(csrf())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(notificationId.toString()))
            .andExpect(jsonPath("$.isRead").value(true))

        verify(trainerNotificationRepository).save(notification)
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `markNotificationRead - returns 404 when notification not found`() {
        // Given
        whenever(trainerNotificationService.getNotification(notificationId))
            .thenThrow(NoSuchElementException("Notification not found"))

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/notifications/$notificationId/read")
                .with(csrf())
        )
            .andExpect(status().isNotFound)
    }

    // ==================== MARK ALL AS READ TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `markAllNotificationsRead - marks all unread notifications as read`() {
        // Given
        val notification2 = TrainerNotification(
            trainerId = trainerId,
            notificationType = NotificationType.PT_CANCELLED,
            titleEn = "Session Cancelled",
            titleAr = "تم إلغاء الجلسة"
        )
        // createdAt is set automatically

        val unreadPage = PageImpl(listOf(notification, notification2))
        whenever(trainerNotificationService.getUnreadNotifications(eq(trainerId), any<Pageable>()))
            .thenReturn(unreadPage)
        whenever(trainerNotificationRepository.save(any())).thenReturn(notification)

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/notifications/mark-all-read")
                .param("trainerId", trainerId.toString())
                .with(csrf())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.message").value("All notifications marked as read"))
            .andExpect(jsonPath("$.count").value(2))

        verify(trainerNotificationRepository, times(2)).save(any())
    }

    // ==================== DELETE NOTIFICATION TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `deleteNotification - deletes notification`() {
        // When & Then
        mockMvc.perform(
            delete("/api/trainer-portal/notifications/$notificationId")
                .with(csrf())
        )
            .andExpect(status().isNoContent)

        verify(trainerNotificationRepository).deleteById(notificationId)
    }

    // ==================== PERMISSION TESTS ====================

    @Test
    fun `getNotifications - returns 403 when user lacks permission`() {
        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/notifications")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isUnauthorized)
    }

    @Test
    fun `markNotificationsRead - returns 403 when user lacks permission`() {
        // Given
        val request = MarkNotificationsReadRequest(notificationIds = listOf(notificationId))

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/notifications/mark-read")
                .param("trainerId", trainerId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
        )
            .andExpect(status().isUnauthorized)
    }
}
