package com.liyaqa.kiosk.domain.model

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.Instant
import java.util.*

@Entity
@Table(name = "kiosk_transactions")
class KioskTransaction(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "session_id", nullable = false)
    val sessionId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 30)
    val transactionType: TransactionType,

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type", length = 30)
    var referenceType: ReferenceType? = null,

    @Column(name = "reference_id")
    var referenceId: UUID? = null,

    @Column(name = "amount", precision = 10, scale = 2)
    var amount: BigDecimal? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 30)
    var paymentMethod: PaymentMethod? = null,

    @Column(name = "payment_reference", length = 100)
    var paymentReference: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    var status: TransactionStatus = TransactionStatus.PENDING,

    @Column(name = "error_message", length = 500)
    var errorMessage: String? = null,

    @Column(name = "receipt_printed")
    var receiptPrinted: Boolean = false,

    @Column(name = "receipt_sent_email")
    var receiptSentEmail: Boolean = false,

    @Column(name = "receipt_sent_sms")
    var receiptSentSms: Boolean = false,

    @Column(name = "created_at")
    val createdAt: Instant = Instant.now(),

    @Column(name = "completed_at")
    var completedAt: Instant? = null
) {
    fun complete() {
        status = TransactionStatus.COMPLETED
        completedAt = Instant.now()
    }

    fun fail(message: String) {
        status = TransactionStatus.FAILED
        errorMessage = message
        completedAt = Instant.now()
    }

    fun cancel() {
        status = TransactionStatus.CANCELLED
        completedAt = Instant.now()
    }

    fun markReceiptPrinted() {
        receiptPrinted = true
    }

    fun markReceiptEmailSent() {
        receiptSentEmail = true
    }

    fun markReceiptSmsSent() {
        receiptSentSms = true
    }
}

@Entity
@Table(name = "kiosk_signatures")
class KioskSignature(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "session_id", nullable = false)
    val sessionId: UUID,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "agreement_id", nullable = false)
    val agreementId: UUID,

    @Column(name = "signature_data", nullable = false, columnDefinition = "TEXT")
    val signatureData: String, // Base64 encoded

    @Column(name = "signed_at")
    val signedAt: Instant = Instant.now(),

    @Column(name = "ip_address", length = 45)
    val ipAddress: String? = null,

    @Column(name = "device_info")
    val deviceInfo: String? = null,

    @Column(name = "created_at")
    val createdAt: Instant = Instant.now()
)
