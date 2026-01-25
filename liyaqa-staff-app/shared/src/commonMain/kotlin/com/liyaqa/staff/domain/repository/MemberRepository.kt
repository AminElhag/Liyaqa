package com.liyaqa.staff.domain.repository

import com.liyaqa.staff.domain.model.MemberSearchResult
import com.liyaqa.staff.domain.model.MemberSummary
import com.liyaqa.staff.util.Result

interface MemberRepository {
    suspend fun searchMembers(query: String, page: Int = 0, size: Int = 20): Result<MemberSearchResult>
    suspend fun getMemberById(id: String): Result<MemberSummary>
    suspend fun getMemberByNumber(memberNumber: String): Result<MemberSummary>
    suspend fun getMemberByQrCode(qrCode: String): Result<MemberSummary>
}
