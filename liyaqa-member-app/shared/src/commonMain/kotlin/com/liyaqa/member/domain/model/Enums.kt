package com.liyaqa.member.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Member status enumeration
 */
@Serializable
enum class MemberStatus {
    @SerialName("ACTIVE") ACTIVE,
    @SerialName("SUSPENDED") SUSPENDED,
    @SerialName("FROZEN") FROZEN,
    @SerialName("CANCELLED") CANCELLED,
    @SerialName("PENDING") PENDING
}

/**
 * Subscription status enumeration
 */
@Serializable
enum class SubscriptionStatus {
    @SerialName("ACTIVE") ACTIVE,
    @SerialName("FROZEN") FROZEN,
    @SerialName("CANCELLED") CANCELLED,
    @SerialName("EXPIRED") EXPIRED,
    @SerialName("PENDING") PENDING,
    @SerialName("PENDING_PAYMENT") PENDING_PAYMENT
}

/**
 * Session status enumeration
 */
@Serializable
enum class SessionStatus {
    @SerialName("SCHEDULED") SCHEDULED,
    @SerialName("IN_PROGRESS") IN_PROGRESS,
    @SerialName("COMPLETED") COMPLETED,
    @SerialName("CANCELLED") CANCELLED
}

/**
 * Booking status enumeration
 */
@Serializable
enum class BookingStatus {
    @SerialName("CONFIRMED") CONFIRMED,
    @SerialName("WAITLISTED") WAITLISTED,
    @SerialName("CANCELLED") CANCELLED,
    @SerialName("CHECKED_IN") CHECKED_IN,
    @SerialName("NO_SHOW") NO_SHOW
}

/**
 * Invoice status enumeration
 */
@Serializable
enum class InvoiceStatus {
    @SerialName("DRAFT") DRAFT,
    @SerialName("ISSUED") ISSUED,
    @SerialName("PAID") PAID,
    @SerialName("PARTIALLY_PAID") PARTIALLY_PAID,
    @SerialName("OVERDUE") OVERDUE,
    @SerialName("CANCELLED") CANCELLED,
    @SerialName("REFUNDED") REFUNDED
}

/**
 * Check-in method enumeration
 */
@Serializable
enum class CheckInMethod {
    @SerialName("MANUAL") MANUAL,
    @SerialName("QR_CODE") QR_CODE,
    @SerialName("CARD") CARD,
    @SerialName("BIOMETRIC") BIOMETRIC,
    @SerialName("MOBILE_APP") MOBILE_APP
}

/**
 * Wallet transaction type enumeration
 */
@Serializable
enum class WalletTransactionType {
    @SerialName("CREDIT") CREDIT,
    @SerialName("DEBIT") DEBIT,
    @SerialName("REFUND") REFUND,
    @SerialName("ADJUSTMENT") ADJUSTMENT,
    @SerialName("REWARD") REWARD,
    @SerialName("GIFT_CARD") GIFT_CARD
}

/**
 * Day of week enumeration
 */
@Serializable
enum class DayOfWeek {
    @SerialName("MONDAY") MONDAY,
    @SerialName("TUESDAY") TUESDAY,
    @SerialName("WEDNESDAY") WEDNESDAY,
    @SerialName("THURSDAY") THURSDAY,
    @SerialName("FRIDAY") FRIDAY,
    @SerialName("SATURDAY") SATURDAY,
    @SerialName("SUNDAY") SUNDAY
}

/**
 * Payment method enumeration
 */
@Serializable
enum class PaymentMethod {
    @SerialName("CASH") CASH,
    @SerialName("CARD") CARD,
    @SerialName("BANK_TRANSFER") BANK_TRANSFER,
    @SerialName("ONLINE") ONLINE,
    @SerialName("WALLET") WALLET
}

/**
 * Notification type enumeration
 */
@Serializable
enum class NotificationType {
    @SerialName("BOOKING_CONFIRMED") BOOKING_CONFIRMED,
    @SerialName("BOOKING_REMINDER") BOOKING_REMINDER,
    @SerialName("BOOKING_CANCELLED") BOOKING_CANCELLED,
    @SerialName("SUBSCRIPTION_EXPIRING") SUBSCRIPTION_EXPIRING,
    @SerialName("SUBSCRIPTION_EXPIRED") SUBSCRIPTION_EXPIRED,
    @SerialName("PAYMENT_RECEIVED") PAYMENT_RECEIVED,
    @SerialName("PAYMENT_DUE") PAYMENT_DUE,
    @SerialName("PROMOTION") PROMOTION,
    @SerialName("GENERAL") GENERAL
}

/**
 * Device platform enumeration
 */
@Serializable
enum class DevicePlatform {
    @SerialName("ANDROID") ANDROID,
    @SerialName("IOS") IOS
}
