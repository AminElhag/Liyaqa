package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.PagedResponse
import com.liyaqa.member.domain.model.WalletBalance
import com.liyaqa.member.domain.model.WalletTransaction
import com.liyaqa.member.domain.model.WalletTransactionType
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow

/**
 * Repository for wallet operations
 */
interface WalletRepository {
    /**
     * Get wallet balance (offline-first)
     */
    fun getBalance(): Flow<Result<WalletBalance>>

    /**
     * Get wallet transactions
     */
    suspend fun getTransactions(
        type: WalletTransactionType? = null,
        page: Int = 0,
        size: Int = 20
    ): Result<PagedResponse<WalletTransaction>>

    /**
     * Force refresh wallet from server
     */
    suspend fun refreshBalance(): Result<WalletBalance>
}
