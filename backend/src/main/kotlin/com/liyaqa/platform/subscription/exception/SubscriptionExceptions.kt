package com.liyaqa.platform.subscription.exception

import com.liyaqa.platform.exception.*
import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import java.util.UUID

class SubscriptionPlanNotFoundException(id: UUID) :
    PlatformResourceNotFoundException(PlatformErrorCode.PLAN_NOT_FOUND, "Subscription plan not found: $id")

class DuplicatePlanTierException(tier: PlanTier) :
    PlatformDuplicateResourceException(PlatformErrorCode.DUPLICATE_PLAN_TIER, "A subscription plan already exists for tier: $tier")

class FeatureFlagNotFoundException(key: String) :
    PlatformResourceNotFoundException(PlatformErrorCode.FEATURE_FLAG_NOT_FOUND, "Feature flag not found: $key")

class DuplicateFeatureKeyException(key: String) :
    PlatformDuplicateResourceException(PlatformErrorCode.DUPLICATE_FEATURE_KEY, "A feature flag already exists with key: $key")

class TenantSubscriptionNotFoundException(tenantId: UUID) :
    PlatformResourceNotFoundException(PlatformErrorCode.SUBSCRIPTION_NOT_FOUND, "Subscription not found for tenant: $tenantId")

class ActiveSubscriptionExistsException(tenantId: UUID) :
    PlatformDuplicateResourceException(PlatformErrorCode.ACTIVE_SUBSCRIPTION_EXISTS, "An active subscription already exists for tenant: $tenantId")

class InvalidSubscriptionStateException(current: SubscriptionStatus, target: String) :
    PlatformInvalidStateException(PlatformErrorCode.INVALID_SUBSCRIPTION_STATE, "Cannot transition from $current to $target")

class InvoiceNotFoundException(id: UUID) :
    PlatformResourceNotFoundException(PlatformErrorCode.INVOICE_NOT_FOUND, "Invoice not found: $id")

class InvoiceStateException(msg: String) :
    PlatformInvalidStateException(PlatformErrorCode.INVOICE_INVALID_STATE, msg)
