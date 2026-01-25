package com.liyaqa.member.data.remote.api

import com.liyaqa.member.domain.model.Attendance
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.BookingRequest
import com.liyaqa.member.domain.model.Invoice
import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.model.MessageResponse
import com.liyaqa.member.domain.model.MySubscriptionResponse
import com.liyaqa.member.domain.model.Notification
import com.liyaqa.member.domain.model.PagedResponse
import com.liyaqa.member.domain.model.UnreadCount
import com.liyaqa.member.domain.model.UpdateProfileRequest
import com.liyaqa.member.domain.model.WalletBalance
import com.liyaqa.member.domain.model.WalletTransaction
import com.liyaqa.member.util.Result
import io.ktor.client.HttpClient
import io.ktor.client.request.parameter
import io.ktor.util.reflect.typeInfo
import kotlinx.serialization.json.Json

class MemberApi(
    client: HttpClient,
    json: Json
) : BaseApi(client, json) {

    suspend fun getProfile(): Result<Member> =
        httpGet("/api/me", typeInfo<Member>())

    suspend fun updateProfile(request: UpdateProfileRequest): Result<Member> =
        httpPatch("/api/me", typeInfo<Member>(), request)

    suspend fun getSubscription(): Result<MySubscriptionResponse> =
        httpGet("/api/me/subscription", typeInfo<MySubscriptionResponse>())

    suspend fun getUpcomingBookings(page: Int = 0, size: Int = 20): Result<PagedResponse<Booking>> =
        httpGet("/api/me/bookings/upcoming", typeInfo<PagedResponse<Booking>>()) {
            parameter("page", page)
            parameter("size", size)
        }

    suspend fun getPastBookings(page: Int = 0, size: Int = 20): Result<PagedResponse<Booking>> =
        httpGet("/api/me/bookings/past", typeInfo<PagedResponse<Booking>>()) {
            parameter("page", page)
            parameter("size", size)
        }

    suspend fun bookSession(request: BookingRequest): Result<Booking> =
        httpPost("/api/me/bookings", typeInfo<Booking>(), request)

    suspend fun cancelBooking(bookingId: String): Result<MessageResponse> =
        httpPost("/api/me/bookings/$bookingId/cancel", typeInfo<MessageResponse>())

    suspend fun getAttendance(page: Int = 0, size: Int = 20): Result<PagedResponse<Attendance>> =
        httpGet("/api/me/attendance", typeInfo<PagedResponse<Attendance>>()) {
            parameter("page", page)
            parameter("size", size)
        }

    suspend fun getAttendanceByRange(
        startDate: String,
        endDate: String,
        page: Int = 0,
        size: Int = 20
    ): Result<PagedResponse<Attendance>> =
        httpGet("/api/me/attendance/range", typeInfo<PagedResponse<Attendance>>()) {
            parameter("startDate", startDate)
            parameter("endDate", endDate)
            parameter("page", page)
            parameter("size", size)
        }

    suspend fun getInvoices(status: String? = null, page: Int = 0, size: Int = 20): Result<PagedResponse<Invoice>> =
        httpGet("/api/me/invoices", typeInfo<PagedResponse<Invoice>>()) {
            status?.let { parameter("status", it) }
            parameter("page", page)
            parameter("size", size)
        }

    suspend fun getPendingInvoices(): Result<List<Invoice>> =
        httpGet("/api/me/invoices/pending", typeInfo<List<Invoice>>())

    suspend fun getNotifications(
        unreadOnly: Boolean = false,
        page: Int = 0,
        size: Int = 20
    ): Result<PagedResponse<Notification>> =
        httpGet("/api/me/notifications", typeInfo<PagedResponse<Notification>>()) {
            parameter("unreadOnly", unreadOnly)
            parameter("page", page)
            parameter("size", size)
        }

    suspend fun getUnreadCount(): Result<UnreadCount> =
        httpGet("/api/me/notifications/unread-count", typeInfo<UnreadCount>())

    suspend fun markAllNotificationsAsRead(): Result<MessageResponse> =
        httpPost("/api/me/notifications/read-all", typeInfo<MessageResponse>())

    suspend fun getWalletBalance(): Result<WalletBalance> =
        httpGet("/api/me/wallet", typeInfo<WalletBalance>())

    suspend fun getWalletTransactions(
        type: String? = null,
        page: Int = 0,
        size: Int = 20
    ): Result<PagedResponse<WalletTransaction>> =
        httpGet("/api/me/wallet/transactions", typeInfo<PagedResponse<WalletTransaction>>()) {
            type?.let { parameter("type", it) }
            parameter("page", page)
            parameter("size", size)
        }
}
