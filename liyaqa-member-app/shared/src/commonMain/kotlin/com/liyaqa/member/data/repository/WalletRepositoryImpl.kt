package com.liyaqa.member.data.repository

import com.liyaqa.member.data.remote.api.MemberApi
import com.liyaqa.member.domain.model.PagedResponse
import com.liyaqa.member.domain.model.WalletBalance
import com.liyaqa.member.domain.model.WalletTransaction
import com.liyaqa.member.domain.model.WalletTransactionType
import com.liyaqa.member.domain.repository.WalletRepository
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class WalletRepositoryImpl(
    private val memberApi: MemberApi
) : WalletRepository {

    // Cache for wallet balance
    private var cachedBalance: WalletBalance? = null

    override fun getBalance(): Flow<Result<WalletBalance>> = flow {
        // Emit cached data if available
        cachedBalance?.let {
            emit(Result.success(it))
        }

        // Fetch fresh data
        memberApi.getWalletBalance()
            .onSuccess { balance ->
                cachedBalance = balance
                emit(Result.success(balance))
            }
            .onError { error ->
                if (cachedBalance == null) {
                    emit(Result.error(
                        exception = error.exception,
                        message = error.message,
                        messageAr = error.messageAr
                    ))
                }
            }
    }

    override suspend fun getTransactions(
        type: WalletTransactionType?,
        page: Int,
        size: Int
    ): Result<PagedResponse<WalletTransaction>> {
        return memberApi.getWalletTransactions(type?.name, page, size)
    }

    override suspend fun refreshBalance(): Result<WalletBalance> {
        return memberApi.getWalletBalance().onSuccess { balance ->
            cachedBalance = balance
        }
    }
}
