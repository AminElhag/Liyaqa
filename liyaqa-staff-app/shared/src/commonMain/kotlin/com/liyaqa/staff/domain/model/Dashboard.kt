package com.liyaqa.staff.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class StaffDashboard(
    val todayCheckIns: Int,
    val activeMembers: Int,
    val todaySessions: Int,
    val todayFacilityBookings: Int,
    val upcomingSessions: List<ClassSession> = emptyList(),
    val recentCheckIns: List<RecentCheckIn> = emptyList()
)

@Serializable
data class RecentCheckIn(
    val memberId: String,
    val memberName: String,
    val memberNumber: String,
    val checkedInAt: String,
    val source: CheckInSource
)
