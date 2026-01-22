package com.liyaqa.membership.api

import com.liyaqa.membership.domain.model.FreezeHistory
import com.liyaqa.membership.domain.model.FreezePackage
import com.liyaqa.membership.domain.model.FreezeSource
import com.liyaqa.membership.domain.model.FreezeType
import com.liyaqa.membership.domain.model.MemberFreezeBalance
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.LocalizedTextInput
import com.liyaqa.shared.domain.Money
import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ==========================================
// FREEZE PACKAGE DTOs
// ==========================================

data class CreateFreezePackageRequest(
    @field:Valid
    @field:NotNull(message = "Name is required")
    val name: LocalizedTextInput,

    @field:Valid
    val description: LocalizedTextInput? = null,

    @field:NotNull(message = "Freeze days is required")
    @field:Positive(message = "Freeze days must be positive")
    val freezeDays: Int,

    @field:NotNull(message = "Price amount is required")
    @field:Min(0, message = "Price cannot be negative")
    val priceAmount: BigDecimal,

    val priceCurrency: String = "SAR",
    val extendsContract: Boolean = true,
    val requiresDocumentation: Boolean = false,
    val sortOrder: Int = 0
)

data class UpdateFreezePackageRequest(
    @field:Valid
    val name: LocalizedTextInput? = null,

    @field:Valid
    val description: LocalizedTextInput? = null,

    @field:Positive(message = "Freeze days must be positive")
    val freezeDays: Int? = null,

    @field:Min(0, message = "Price cannot be negative")
    val priceAmount: BigDecimal? = null,

    val priceCurrency: String? = null,
    val extendsContract: Boolean? = null,
    val requiresDocumentation: Boolean? = null,
    val sortOrder: Int? = null
)

data class FreezePackageResponse(
    val id: UUID,
    val name: LocalizedText,
    val description: LocalizedText?,
    val freezeDays: Int,
    val price: Money,
    val isActive: Boolean,
    val extendsContract: Boolean,
    val requiresDocumentation: Boolean,
    val sortOrder: Int,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(pkg: FreezePackage): FreezePackageResponse = FreezePackageResponse(
            id = pkg.id,
            name = pkg.name,
            description = pkg.description,
            freezeDays = pkg.freezeDays,
            price = pkg.price,
            isActive = pkg.isActive,
            extendsContract = pkg.extendsContract,
            requiresDocumentation = pkg.requiresDocumentation,
            sortOrder = pkg.sortOrder,
            createdAt = pkg.createdAt,
            updatedAt = pkg.updatedAt
        )
    }
}

// ==========================================
// FREEZE BALANCE DTOs
// ==========================================

data class FreezeBalanceResponse(
    val id: UUID,
    val memberId: UUID,
    val subscriptionId: UUID,
    val totalFreezeDays: Int,
    val usedFreezeDays: Int,
    val availableDays: Int,
    val source: FreezeSource,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(balance: MemberFreezeBalance): FreezeBalanceResponse = FreezeBalanceResponse(
            id = balance.id,
            memberId = balance.memberId,
            subscriptionId = balance.subscriptionId,
            totalFreezeDays = balance.totalFreezeDays,
            usedFreezeDays = balance.usedFreezeDays,
            availableDays = balance.availableDays(),
            source = balance.source,
            createdAt = balance.createdAt,
            updatedAt = balance.updatedAt
        )

        fun empty(subscriptionId: UUID, memberId: UUID): FreezeBalanceResponse = FreezeBalanceResponse(
            id = UUID.randomUUID(),
            memberId = memberId,
            subscriptionId = subscriptionId,
            totalFreezeDays = 0,
            usedFreezeDays = 0,
            availableDays = 0,
            source = FreezeSource.NONE,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
    }
}

data class PurchaseFreezeDaysRequest(
    @field:NotNull(message = "Freeze package ID is required")
    val freezePackageId: UUID
)

data class GrantFreezeDaysRequest(
    @field:NotNull(message = "Days is required")
    @field:Positive(message = "Days must be positive")
    val days: Int,

    val source: FreezeSource = FreezeSource.COMPENSATION
)

// ==========================================
// FREEZE SUBSCRIPTION DTOs
// ==========================================

data class FreezeSubscriptionRequest(
    @field:NotNull(message = "Freeze days is required")
    @field:Positive(message = "Freeze days must be positive")
    val freezeDays: Int,

    val freezeType: FreezeType = FreezeType.PERSONAL,
    val reason: String? = null,
    val documentPath: String? = null
)

data class FreezeHistoryResponse(
    val id: UUID,
    val subscriptionId: UUID,
    val freezeStartDate: LocalDate,
    val freezeEndDate: LocalDate?,
    val freezeDays: Int,
    val freezeType: FreezeType,
    val reason: String?,
    val documentPath: String?,
    val freezePackageId: UUID?,
    val createdByUserId: UUID?,
    val contractExtended: Boolean,
    val originalEndDate: LocalDate?,
    val newEndDate: LocalDate?,
    val isActive: Boolean,
    val createdAt: Instant
) {
    companion object {
        fun from(history: FreezeHistory): FreezeHistoryResponse = FreezeHistoryResponse(
            id = history.id,
            subscriptionId = history.subscriptionId,
            freezeStartDate = history.freezeStartDate,
            freezeEndDate = history.freezeEndDate,
            freezeDays = history.freezeDays,
            freezeType = history.freezeType,
            reason = history.reason,
            documentPath = history.documentPath,
            freezePackageId = history.freezePackageId,
            createdByUserId = history.createdByUserId,
            contractExtended = history.contractExtended,
            originalEndDate = history.originalEndDate,
            newEndDate = history.newEndDate,
            isActive = history.isActive(),
            createdAt = history.createdAt
        )
    }
}

data class FreezeResultResponse(
    val subscriptionId: UUID,
    val status: String,
    val freezeHistory: FreezeHistoryResponse,
    val daysUsedFromBalance: Int,
    val originalEndDate: LocalDate?,
    val newEndDate: LocalDate?
)
