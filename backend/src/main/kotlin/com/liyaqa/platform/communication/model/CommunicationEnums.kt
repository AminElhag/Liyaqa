package com.liyaqa.platform.communication.model

enum class AnnouncementType { GENERAL, MAINTENANCE, FEATURE_UPDATE, BILLING, COMPLIANCE, URGENT }

enum class AnnouncementStatus { DRAFT, SCHEDULED, PUBLISHED, ARCHIVED }

enum class TargetAudience { ALL, SPECIFIC_TENANTS, BY_PLAN_TIER, BY_STATUS }

enum class CommunicationChannel { EMAIL, SMS, IN_APP, PUSH }

enum class NotificationLogStatus { PENDING, SENT, DELIVERED, FAILED, BOUNCED }
