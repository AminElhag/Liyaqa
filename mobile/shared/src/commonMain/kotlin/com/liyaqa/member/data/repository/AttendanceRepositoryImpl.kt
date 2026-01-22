package com.liyaqa.member.data.repository

import com.liyaqa.member.data.api.MemberApiService
import com.liyaqa.member.data.api.toResult
import com.liyaqa.member.data.mapper.toDomain
import com.liyaqa.member.domain.model.AttendanceRecord
import com.liyaqa.member.domain.model.PagedResult
import com.liyaqa.member.domain.repository.AttendanceRepository

/**
 * Implementation of AttendanceRepository using MemberApiService.
 */
class AttendanceRepositoryImpl(
    private val api: MemberApiService
) : AttendanceRepository {

    override suspend fun getAttendance(
        page: Int,
        size: Int
    ): Result<PagedResult<AttendanceRecord>> {
        return api.getAttendance(page, size).toResult { response ->
            PagedResult(
                items = response.items.map { it.toDomain() },
                hasMore = response.hasMore,
                totalCount = response.totalCount
            )
        }
    }

    override suspend fun getAttendanceRange(
        startDate: String,
        endDate: String,
        page: Int,
        size: Int
    ): Result<PagedResult<AttendanceRecord>> {
        return api.getAttendanceRange(startDate, endDate, page, size).toResult { response ->
            PagedResult(
                items = response.items.map { it.toDomain() },
                hasMore = response.hasMore,
                totalCount = response.totalCount
            )
        }
    }
}
