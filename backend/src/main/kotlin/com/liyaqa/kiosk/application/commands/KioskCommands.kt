package com.liyaqa.kiosk.application.commands

import com.liyaqa.kiosk.domain.model.*
import java.math.BigDecimal
import java.util.*

data class CreateKioskDeviceCommand(
    val locationId: UUID,
    val deviceName: String,
    val deviceNameAr: String? = null,
    val deviceCode: String,
    val hardwareId: String? = null,
    val config: Map<String, Any>? = null,
    val allowedActions: List<KioskAction>? = null
)

data class UpdateKioskDeviceCommand(
    val deviceName: String? = null,
    val deviceNameAr: String? = null,
    val status: KioskStatus? = null,
    val config: Map<String, Any>? = null,
    val allowedActions: List<KioskAction>? = null
)

data class StartSessionCommand(
    val kioskId: UUID
)

data class IdentifyMemberCommand(
    val sessionId: UUID,
    val method: IdentificationMethod,
    val value: String // phone, card number, member ID, etc.
)

data class EndSessionCommand(
    val sessionId: UUID,
    val status: SessionStatus,
    val feedbackRating: Int? = null,
    val feedbackComment: String? = null
)

data class CreateTransactionCommand(
    val sessionId: UUID,
    val transactionType: TransactionType,
    val referenceType: ReferenceType? = null,
    val referenceId: UUID? = null,
    val amount: BigDecimal? = null,
    val paymentMethod: PaymentMethod? = null
)

data class CompleteTransactionCommand(
    val transactionId: UUID,
    val paymentReference: String? = null
)

data class FailTransactionCommand(
    val transactionId: UUID,
    val errorMessage: String
)

data class CreateSignatureCommand(
    val sessionId: UUID,
    val memberId: UUID,
    val agreementId: UUID,
    val signatureData: String,
    val ipAddress: String? = null,
    val deviceInfo: Map<String, Any>? = null
)

data class CheckInCommand(
    val sessionId: UUID,
    val memberId: UUID
)
