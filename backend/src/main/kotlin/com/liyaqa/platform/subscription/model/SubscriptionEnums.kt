package com.liyaqa.platform.subscription.model

enum class PlanTier {
    STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE
}

enum class FeatureCategory {
    MEMBER_ENGAGEMENT, MARKETING_LOYALTY, OPERATIONS,
    ACCOUNTS_PAYMENTS, REPORTING, INTEGRATIONS, SUPPORT
}

enum class SubscriptionStatus { TRIAL, ACTIVE, PAST_DUE, CANCELLED, EXPIRED }

enum class InvoiceStatus { DRAFT, ISSUED, PAID, OVERDUE, CANCELLED, REFUNDED }

enum class ZatcaStatus { PENDING, SUBMITTED, ACCEPTED, REJECTED }

enum class PaymentMethod { BANK_TRANSFER, CREDIT_CARD, MADA, STC_PAY, SADAD, CASH, OTHER }

enum class PaymentStatus { SUCCESS, FAILED, REFUNDED }

enum class SubscriptionBillingCycle { MONTHLY, ANNUAL }
