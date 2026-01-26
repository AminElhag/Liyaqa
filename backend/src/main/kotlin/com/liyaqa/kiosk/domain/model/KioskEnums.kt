package com.liyaqa.kiosk.domain.model

enum class KioskStatus {
    ACTIVE,
    INACTIVE,
    MAINTENANCE
}

enum class SessionStatus {
    ACTIVE,
    COMPLETED,
    ABANDONED,
    TIMED_OUT
}

enum class IdentificationMethod {
    QR_CODE,
    PHONE,
    CARD,
    BIOMETRIC,
    MEMBER_ID
}

enum class TransactionType {
    CHECK_IN,
    CLASS_BOOKING,
    PAYMENT,
    MEMBERSHIP_RENEWAL,
    FREEZE,
    AGREEMENT_SIGN
}

enum class ReferenceType {
    ATTENDANCE,
    CLASS_BOOKING,
    INVOICE,
    MEMBERSHIP,
    AGREEMENT
}

enum class PaymentMethod {
    CARD,
    APPLE_PAY,
    MADA,
    CASH,
    WALLET
}

enum class TransactionStatus {
    PENDING,
    COMPLETED,
    FAILED,
    CANCELLED
}

enum class KioskAction {
    CHECK_IN,
    CLASS_BOOKING,
    PAYMENT,
    MEMBERSHIP_VIEW,
    AGREEMENT_SIGN,
    PROFILE_UPDATE,
    RECEIPT_PRINT
}
