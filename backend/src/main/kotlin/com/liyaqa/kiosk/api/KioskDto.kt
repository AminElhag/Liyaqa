package com.liyaqa.kiosk.api

import com.liyaqa.kiosk.domain.model.*
import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.time.Instant
import java.util.*

// ========== Request DTOs ==========

data class CreateKioskDeviceRequest(
    @field:NotNull val locationId: UUID,
    @field:NotBlank @field:Size(max = 100) val deviceName: String,
    @field:Size(max = 100) val deviceNameAr: String? = null,
    @field:NotBlank @field:Size(max = 20) val deviceCode: String,
    @field:Size(max = 100) val hardwareId: String? = null,
    val config: Map<String, Any>? = null,
    val allowedActions: List<KioskAction>? = null
)

data class UpdateKioskDeviceRequest(
    @field:Size(max = 100) val deviceName: String? = null,
    @field:Size(max = 100) val deviceNameAr: String? = null,
    val status: KioskStatus? = null,
    val config: Map<String, Any>? = null,
    val allowedActions: List<KioskAction>? = null
)

data class StartSessionRequest(
    @field:NotNull val kioskId: UUID
)

data class IdentifyMemberRequest(
    @field:NotNull val method: IdentificationMethod,
    @field:NotBlank val value: String
)

data class EndSessionRequest(
    @field:NotNull val status: SessionStatus,
    @field:Min(1) @field:Max(5) val feedbackRating: Int? = null,
    val feedbackComment: String? = null
)

data class CreateTransactionRequest(
    @field:NotNull val transactionType: TransactionType,
    val referenceType: ReferenceType? = null,
    val referenceId: UUID? = null,
    val amount: BigDecimal? = null,
    val paymentMethod: PaymentMethod? = null
)

data class CompleteTransactionRequest(
    val paymentReference: String? = null
)

data class FailTransactionRequest(
    @field:NotBlank val errorMessage: String
)

data class CreateSignatureRequest(
    @field:NotNull val memberId: UUID,
    @field:NotNull val agreementId: UUID,
    @field:NotBlank val signatureData: String
)

data class CheckInRequest(
    @field:NotNull val memberId: UUID
)

// ========== Response DTOs ==========

data class KioskDeviceResponse(
    val id: UUID,
    val locationId: UUID,
    val deviceName: String,
    val deviceNameAr: String?,
    val deviceCode: String,
    val status: KioskStatus,
    val isOnline: Boolean,
    val lastHeartbeat: Instant?,
    val hardwareId: String?,
    val config: Map<String, Any>?,
    val allowedActions: List<String>?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(device: KioskDevice, configMap: Map<String, Any>? = null, actions: List<String>? = null) =
            KioskDeviceResponse(
                id = device.id,
                locationId = device.locationId,
                deviceName = device.deviceName,
                deviceNameAr = device.deviceNameAr,
                deviceCode = device.deviceCode,
                status = device.status,
                isOnline = device.isOnline(),
                lastHeartbeat = device.lastHeartbeat,
                hardwareId = device.hardwareId,
                config = configMap,
                allowedActions = actions,
                createdAt = device.createdAt,
                updatedAt = device.updatedAt
            )
    }
}

data class KioskSessionResponse(
    val id: UUID,
    val kioskId: UUID,
    val memberId: UUID?,
    val startedAt: Instant,
    val endedAt: Instant?,
    val identificationMethod: IdentificationMethod?,
    val sessionStatus: SessionStatus,
    val durationSeconds: Long?,
    val feedbackRating: Int?,
    val feedbackComment: String?,
    val createdAt: Instant
) {
    companion object {
        fun from(session: KioskSession) = KioskSessionResponse(
            id = session.id,
            kioskId = session.kioskId,
            memberId = session.memberId,
            startedAt = session.startedAt,
            endedAt = session.endedAt,
            identificationMethod = session.identificationMethod,
            sessionStatus = session.sessionStatus,
            durationSeconds = session.getDurationSeconds(),
            feedbackRating = session.feedbackRating,
            feedbackComment = session.feedbackComment,
            createdAt = session.createdAt
        )
    }
}

data class KioskTransactionResponse(
    val id: UUID,
    val sessionId: UUID,
    val transactionType: TransactionType,
    val referenceType: ReferenceType?,
    val referenceId: UUID?,
    val amount: BigDecimal?,
    val paymentMethod: PaymentMethod?,
    val paymentReference: String?,
    val status: TransactionStatus,
    val errorMessage: String?,
    val receiptPrinted: Boolean,
    val receiptSentEmail: Boolean,
    val receiptSentSms: Boolean,
    val createdAt: Instant,
    val completedAt: Instant?
) {
    companion object {
        fun from(transaction: KioskTransaction) = KioskTransactionResponse(
            id = transaction.id,
            sessionId = transaction.sessionId,
            transactionType = transaction.transactionType,
            referenceType = transaction.referenceType,
            referenceId = transaction.referenceId,
            amount = transaction.amount,
            paymentMethod = transaction.paymentMethod,
            paymentReference = transaction.paymentReference,
            status = transaction.status,
            errorMessage = transaction.errorMessage,
            receiptPrinted = transaction.receiptPrinted,
            receiptSentEmail = transaction.receiptSentEmail,
            receiptSentSms = transaction.receiptSentSms,
            createdAt = transaction.createdAt,
            completedAt = transaction.completedAt
        )
    }
}

data class KioskSignatureResponse(
    val id: UUID,
    val sessionId: UUID,
    val memberId: UUID,
    val agreementId: UUID,
    val signedAt: Instant,
    val createdAt: Instant
) {
    companion object {
        fun from(signature: KioskSignature) = KioskSignatureResponse(
            id = signature.id,
            sessionId = signature.sessionId,
            memberId = signature.memberId,
            agreementId = signature.agreementId,
            signedAt = signature.signedAt,
            createdAt = signature.createdAt
        )
    }
}

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
