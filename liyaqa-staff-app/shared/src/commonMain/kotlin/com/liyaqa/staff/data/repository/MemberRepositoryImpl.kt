package com.liyaqa.staff.data.repository

import com.liyaqa.staff.data.remote.api.StaffApi
import com.liyaqa.staff.domain.model.MemberSearchResult
import com.liyaqa.staff.domain.model.MemberSummary
import com.liyaqa.staff.domain.repository.MemberRepository
import com.liyaqa.staff.util.Result

class MemberRepositoryImpl(
    private val api: StaffApi
) : MemberRepository {

    override suspend fun searchMembers(query: String, page: Int, size: Int): Result<MemberSearchResult> {
        return try {
            Result.Success(api.searchMembers(query, page, size))
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun getMemberById(id: String): Result<MemberSummary> {
        return try {
            Result.Success(api.getMemberById(id))
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun getMemberByNumber(memberNumber: String): Result<MemberSummary> {
        // Search by member number and return the first result
        return try {
            val result = api.searchMembers(memberNumber, 0, 1)
            val member = result.content.firstOrNull()
                ?: throw NoSuchElementException("Member not found: $memberNumber")
            Result.Success(member)
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun getMemberByQrCode(qrCode: String): Result<MemberSummary> {
        return try {
            Result.Success(api.getMemberByQrCode(qrCode))
        } catch (e: Exception) {
            Result.Error(e)
        }
    }
}
