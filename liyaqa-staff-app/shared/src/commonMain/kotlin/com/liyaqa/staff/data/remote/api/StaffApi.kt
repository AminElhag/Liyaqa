package com.liyaqa.staff.data.remote.api

import com.liyaqa.staff.domain.model.*
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.*
import io.ktor.http.HttpStatusCode

class StaffApi(
    private val client: HttpClient,
    private val tokenProvider: TokenProvider
) {
    private suspend fun authHeader(): String = "Bearer ${tokenProvider.getAccessToken()}"

    // Auth
    suspend fun login(request: LoginRequest): LoginResponse =
        client.post("/api/staff/auth/login") {
            setBody(request)
        }.body()

    suspend fun refreshToken(request: RefreshTokenRequest): RefreshTokenResponse =
        client.post("/api/staff/auth/refresh") {
            setBody(request)
        }.body()

    // Dashboard
    suspend fun getDashboard(): StaffDashboard =
        client.get("/api/staff-mobile/dashboard") {
            header("Authorization", authHeader())
        }.body()

    // Members
    suspend fun searchMembers(query: String, page: Int, size: Int): MemberSearchResult =
        client.get("/api/staff-mobile/members") {
            header("Authorization", authHeader())
            parameter("query", query)
            parameter("page", page)
            parameter("size", size)
        }.body()

    suspend fun getMemberById(id: String): MemberSummary =
        client.get("/api/staff-mobile/members/$id") {
            header("Authorization", authHeader())
        }.body()

    suspend fun getMemberByQrCode(qrCode: String): MemberSummary =
        client.get("/api/staff-mobile/members/qr/$qrCode") {
            header("Authorization", authHeader())
        }.body()

    // Attendance
    suspend fun checkInMember(memberId: String, source: CheckInSource): RecentCheckIn =
        client.post("/api/staff-mobile/attendance/check-in") {
            header("Authorization", authHeader())
            setBody(mapOf("memberId" to memberId, "source" to source.name))
        }.body()

    suspend fun getRecentCheckIns(limit: Int): List<RecentCheckIn> =
        client.get("/api/staff-mobile/attendance/recent") {
            header("Authorization", authHeader())
            parameter("limit", limit)
        }.body()

    // Sessions
    suspend fun getTodaySessions(): TodaySessions =
        client.get("/api/staff-mobile/sessions/today") {
            header("Authorization", authHeader())
        }.body()

    suspend fun getSessionById(id: String): ClassSession =
        client.get("/api/staff-mobile/sessions/$id") {
            header("Authorization", authHeader())
        }.body()

    suspend fun getSessionBookings(sessionId: String): List<SessionBooking> =
        client.get("/api/staff-mobile/sessions/$sessionId/bookings") {
            header("Authorization", authHeader())
        }.body()

    suspend fun markBookingAttended(bookingId: String): SessionBooking =
        client.post("/api/staff-mobile/bookings/$bookingId/check-in") {
            header("Authorization", authHeader())
        }.body()

    suspend fun markBookingNoShow(bookingId: String): SessionBooking =
        client.post("/api/staff-mobile/bookings/$bookingId/no-show") {
            header("Authorization", authHeader())
        }.body()

    // Facility Bookings
    suspend fun getTodayFacilityBookings(): TodayFacilityBookings =
        client.get("/api/staff-mobile/facility-bookings/today") {
            header("Authorization", authHeader())
        }.body()

    suspend fun getFacilityBookingById(id: String): FacilityBooking =
        client.get("/api/staff-mobile/facility-bookings/$id") {
            header("Authorization", authHeader())
        }.body()

    suspend fun markFacilityBookingCheckedIn(bookingId: String): FacilityBooking =
        client.post("/api/staff-mobile/facility-bookings/$bookingId/check-in") {
            header("Authorization", authHeader())
        }.body()

    suspend fun cancelFacilityBooking(bookingId: String): FacilityBooking =
        client.post("/api/staff-mobile/facility-bookings/$bookingId/cancel") {
            header("Authorization", authHeader())
        }.body()
}
