package com.liyaqa.member.data.repository

import com.liyaqa.member.data.api.MemberApiService
import com.liyaqa.member.data.api.toResult
import com.liyaqa.member.data.mapper.toDomain
import com.liyaqa.member.domain.model.QrCode
import com.liyaqa.member.domain.repository.QrCodeRepository

/**
 * Implementation of QrCodeRepository using MemberApiService.
 */
class QrCodeRepositoryImpl(
    private val api: MemberApiService
) : QrCodeRepository {

    override suspend fun getQrCode(size: Int): Result<QrCode> {
        return api.getQrCode(size).toResult { it.toDomain() }
    }
}
