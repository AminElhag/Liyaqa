package com.liyaqa.member.data.api

import com.liyaqa.member.data.dto.AttendanceLiteDto
import com.liyaqa.member.data.dto.AvailableSessionDto
import com.liyaqa.member.data.dto.BookSessionRequestDto
import com.liyaqa.member.data.dto.BookingLiteDto
import com.liyaqa.member.data.dto.ChangePasswordRequestDto
import com.liyaqa.member.data.dto.InitiatePaymentRequestDto
import com.liyaqa.member.data.dto.InvoiceDetailDto
import com.liyaqa.member.data.dto.InvoiceLiteDto
import com.liyaqa.member.data.dto.MobileHomeDashboardDto
import com.liyaqa.member.data.dto.MobilePageResponse
import com.liyaqa.member.data.dto.MyProfileDto
import com.liyaqa.member.data.dto.MySubscriptionDto
import com.liyaqa.member.data.dto.NotificationLiteDto
import com.liyaqa.member.data.dto.NotificationPreferencesDto
import com.liyaqa.member.data.dto.PaymentInitiateDto
import com.liyaqa.member.data.dto.QrCodeResponseDto
import com.liyaqa.member.data.dto.QuickStatsDto
import com.liyaqa.member.data.dto.SubscriptionLiteDto
import com.liyaqa.member.data.dto.UnreadCountDto
import com.liyaqa.member.data.dto.UpdatePreferencesRequestDto
import com.liyaqa.member.data.dto.UpdateProfileRequestDto
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsBytes

/**
 * API service for all member-facing endpoints.
 * Provides type-safe access to backend APIs with proper error handling.
 */
class MemberApiService(
    private val apiClient: ApiClient
) {
    // ===================
    // Dashboard Endpoints
    // ===================

    /**
     * Get the home dashboard data.
     * GET /api/mobile/home
     */
    suspend fun getDashboard(): ApiResult<MobileHomeDashboardDto> {
        return apiClient.authenticatedGet("/api/mobile/home")
    }

    /**
     * Get quick stats for the member.
     * GET /api/mobile/quick-stats
     */
    suspend fun getQuickStats(): ApiResult<QuickStatsDto> {
        return apiClient.authenticatedGet("/api/mobile/quick-stats")
    }

    // =================
    // Profile Endpoints
    // =================

    /**
     * Get the current member's profile.
     * GET /api/me
     */
    suspend fun getProfile(): ApiResult<MyProfileDto> {
        return apiClient.authenticatedGet("/api/me")
    }

    /**
     * Update the current member's profile.
     * PATCH /api/me
     */
    suspend fun updateProfile(request: UpdateProfileRequestDto): ApiResult<MyProfileDto> {
        return apiClient.authenticatedPatch("/api/me", request)
    }

    /**
     * Change the current member's password.
     * POST /api/me/password/change
     */
    suspend fun changePassword(request: ChangePasswordRequestDto): ApiResult<Unit> {
        return apiClient.authenticatedPost("/api/me/password/change", request)
    }

    // =================
    // QR Code Endpoints
    // =================

    /**
     * Get QR code for member check-in.
     * GET /api/qr/me?size={size}
     */
    suspend fun getQrCode(size: Int = 300): ApiResult<QrCodeResponseDto> {
        return apiClient.authenticatedGet("/api/qr/me") {
            parameter("size", size)
        }
    }

    // ======================
    // Subscription Endpoints
    // ======================

    /**
     * Get the current member's active subscription.
     * GET /api/me/subscription
     */
    suspend fun getSubscription(): ApiResult<MySubscriptionDto> {
        return apiClient.authenticatedGet("/api/me/subscription")
    }

    /**
     * Get subscription history for the current member.
     * GET /api/me/subscriptions
     */
    suspend fun getSubscriptionHistory(): ApiResult<List<SubscriptionLiteDto>> {
        return apiClient.authenticatedGet("/api/me/subscriptions")
    }

    // ==================
    // Booking Endpoints
    // ==================

    /**
     * Get upcoming bookings for the current member.
     * GET /api/me/bookings/upcoming?page={page}&size={size}
     */
    suspend fun getUpcomingBookings(
        page: Int = 0,
        size: Int = 20
    ): ApiResult<MobilePageResponse<BookingLiteDto>> {
        return apiClient.authenticatedGet("/api/me/bookings/upcoming") {
            parameter("page", page)
            parameter("size", size)
        }
    }

    /**
     * Get past bookings for the current member.
     * GET /api/me/bookings/past?page={page}&size={size}
     */
    suspend fun getPastBookings(
        page: Int = 0,
        size: Int = 20
    ): ApiResult<MobilePageResponse<BookingLiteDto>> {
        return apiClient.authenticatedGet("/api/me/bookings/past") {
            parameter("page", page)
            parameter("size", size)
        }
    }

    /**
     * Get available sessions for booking.
     * GET /api/mobile/sessions/available?days={days}&classId={classId}&locationId={locationId}
     */
    suspend fun getAvailableSessions(
        days: Int = 7,
        classId: String? = null,
        locationId: String? = null
    ): ApiResult<List<AvailableSessionDto>> {
        return apiClient.authenticatedGet("/api/mobile/sessions/available") {
            parameter("days", days)
            classId?.let { parameter("classId", it) }
            locationId?.let { parameter("locationId", it) }
        }
    }

    /**
     * Book a session.
     * POST /api/me/bookings
     */
    suspend fun bookSession(request: BookSessionRequestDto): ApiResult<BookingLiteDto> {
        return apiClient.authenticatedPost("/api/me/bookings", request)
    }

    /**
     * Cancel a booking.
     * POST /api/me/bookings/{bookingId}/cancel
     */
    suspend fun cancelBooking(bookingId: String): ApiResult<Unit> {
        return apiClient.authenticatedPost("/api/me/bookings/$bookingId/cancel")
    }

    // ==================
    // Invoice Endpoints
    // ==================

    /**
     * Get invoices for the current member.
     * GET /api/me/invoices?status={status}&page={page}&size={size}
     */
    suspend fun getInvoices(
        status: String? = null,
        page: Int = 0,
        size: Int = 20
    ): ApiResult<MobilePageResponse<InvoiceLiteDto>> {
        return apiClient.authenticatedGet("/api/me/invoices") {
            status?.let { parameter("status", it) }
            parameter("page", page)
            parameter("size", size)
        }
    }

    /**
     * Get pending invoices for the current member.
     * GET /api/me/invoices/pending
     */
    suspend fun getPendingInvoices(): ApiResult<List<InvoiceLiteDto>> {
        return apiClient.authenticatedGet("/api/me/invoices/pending")
    }

    /**
     * Get invoice detail by ID.
     * GET /api/invoices/{invoiceId}
     */
    suspend fun getInvoiceDetail(invoiceId: String): ApiResult<InvoiceDetailDto> {
        return apiClient.authenticatedGet("/api/invoices/$invoiceId")
    }

    /**
     * Download invoice PDF.
     * GET /api/invoices/{invoiceId}/pdf
     *
     * Returns the PDF file as ByteArray.
     */
    suspend fun downloadInvoicePdf(invoiceId: String): ApiResult<ByteArray> {
        val client = apiClient.createAuthenticatedClient()
        return try {
            val response: HttpResponse = client.get("/api/invoices/$invoiceId/pdf")
            if (response.status.value in 200..299) {
                val bytes = response.bodyAsBytes()
                ApiResult.success(bytes)
            } else {
                apiClient.handleHttpError(response)
            }
        } catch (e: Exception) {
            ApiResult.networkError(e)
        } finally {
            client.close()
        }
    }

    // ==================
    // Payment Endpoints
    // ==================

    /**
     * Initiate a payment for an invoice.
     * POST /api/payments/initiate
     */
    suspend fun initiatePayment(request: InitiatePaymentRequestDto): ApiResult<PaymentInitiateDto> {
        return apiClient.authenticatedPost("/api/payments/initiate", request)
    }

    // ====================
    // Attendance Endpoints
    // ====================

    /**
     * Get attendance history for the current member.
     * GET /api/me/attendance?page={page}&size={size}
     */
    suspend fun getAttendance(
        page: Int = 0,
        size: Int = 20
    ): ApiResult<MobilePageResponse<AttendanceLiteDto>> {
        return apiClient.authenticatedGet("/api/me/attendance") {
            parameter("page", page)
            parameter("size", size)
        }
    }

    /**
     * Get attendance history within a date range.
     * GET /api/me/attendance/range?startDate={startDate}&endDate={endDate}&page={page}&size={size}
     */
    suspend fun getAttendanceRange(
        startDate: String,
        endDate: String,
        page: Int = 0,
        size: Int = 20
    ): ApiResult<MobilePageResponse<AttendanceLiteDto>> {
        return apiClient.authenticatedGet("/api/me/attendance/range") {
            parameter("startDate", startDate)
            parameter("endDate", endDate)
            parameter("page", page)
            parameter("size", size)
        }
    }

    // ======================
    // Notification Endpoints
    // ======================

    /**
     * Get notifications for the current member.
     * GET /api/me/notifications?unreadOnly={unreadOnly}&page={page}&size={size}
     */
    suspend fun getNotifications(
        unreadOnly: Boolean = false,
        page: Int = 0,
        size: Int = 20
    ): ApiResult<MobilePageResponse<NotificationLiteDto>> {
        return apiClient.authenticatedGet("/api/me/notifications") {
            parameter("unreadOnly", unreadOnly)
            parameter("page", page)
            parameter("size", size)
        }
    }

    /**
     * Get unread notification count.
     * GET /api/me/notifications/unread-count
     */
    suspend fun getUnreadCount(): ApiResult<UnreadCountDto> {
        return apiClient.authenticatedGet("/api/me/notifications/unread-count")
    }

    /**
     * Mark a notification as read.
     * POST /api/notifications/{notificationId}/read
     */
    suspend fun markNotificationRead(notificationId: String): ApiResult<Unit> {
        return apiClient.authenticatedPost("/api/notifications/$notificationId/read")
    }

    /**
     * Mark all notifications as read.
     * POST /api/me/notifications/read-all
     */
    suspend fun markAllNotificationsRead(): ApiResult<Unit> {
        return apiClient.authenticatedPost("/api/me/notifications/read-all")
    }

    /**
     * Get notification preferences for a member.
     * GET /api/notifications/preferences/{memberId}
     */
    suspend fun getNotificationPreferences(memberId: String): ApiResult<NotificationPreferencesDto> {
        return apiClient.authenticatedGet("/api/notifications/preferences/$memberId")
    }

    /**
     * Update notification preferences for a member.
     * PUT /api/notifications/preferences/{memberId}
     */
    suspend fun updateNotificationPreferences(
        memberId: String,
        request: UpdatePreferencesRequestDto
    ): ApiResult<NotificationPreferencesDto> {
        return apiClient.authenticatedPut("/api/notifications/preferences/$memberId", request)
    }
}
