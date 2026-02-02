package com.liyaqa.observability

import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.DistributionSummary
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.Timer
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.util.concurrent.TimeUnit

/**
 * Service for tracking business-level metrics
 *
 * Exposes metrics to Prometheus/Grafana for monitoring:
 * - Member registrations, check-ins, bookings
 * - Revenue, payments, subscriptions
 * - Class attendance, capacity utilization
 * - Inventory sales, low stock alerts
 * - Per-tenant metrics for multi-tenancy insights
 *
 * Metrics naming convention:
 * - liyaqa.business.* for business metrics
 * - All metrics include tenant_id tag for multi-tenant analytics
 */
@Service
class BusinessMetricsService(
    private val meterRegistry: MeterRegistry
) {

    // ============================================================
    // MEMBER METRICS
    // ============================================================

    /**
     * Record a new member registration
     */
    fun recordMemberRegistration(tenantId: String, membershipType: String) {
        Counter.builder("liyaqa.business.members.registered")
            .tag("tenant_id", tenantId)
            .tag("membership_type", membershipType)
            .description("Total member registrations")
            .register(meterRegistry)
            .increment()
    }

    /**
     * Record a member check-in
     */
    fun recordCheckIn(tenantId: String, membershipType: String) {
        Counter.builder("liyaqa.business.checkins.total")
            .tag("tenant_id", tenantId)
            .tag("membership_type", membershipType)
            .description("Total member check-ins")
            .register(meterRegistry)
            .increment()
    }

    /**
     * Record a member cancellation
     */
    fun recordMemberCancellation(tenantId: String, reason: String) {
        Counter.builder("liyaqa.business.members.cancelled")
            .tag("tenant_id", tenantId)
            .tag("reason", reason)
            .description("Total member cancellations")
            .register(meterRegistry)
            .increment()
    }

    // ============================================================
    // CLASS BOOKING METRICS
    // ============================================================

    /**
     * Record a class booking
     */
    fun recordClassBooking(tenantId: String, classType: String, isWaitlist: Boolean = false) {
        Counter.builder("liyaqa.business.bookings.created")
            .tag("tenant_id", tenantId)
            .tag("class_type", classType)
            .tag("waitlist", isWaitlist.toString())
            .description("Total class bookings")
            .register(meterRegistry)
            .increment()
    }

    /**
     * Record a booking cancellation
     */
    fun recordBookingCancellation(
        tenantId: String,
        classType: String,
        advanceHours: Long
    ) {
        Counter.builder("liyaqa.business.bookings.cancelled")
            .tag("tenant_id", tenantId)
            .tag("class_type", classType)
            .tag("advance_notice", categorizeAdvanceNotice(advanceHours))
            .description("Total booking cancellations")
            .register(meterRegistry)
            .increment()
    }

    /**
     * Record class capacity utilization
     */
    fun recordClassCapacityUtilization(
        tenantId: String,
        classType: String,
        utilization: Double
    ) {
        DistributionSummary.builder("liyaqa.business.classes.capacity.utilization")
            .tag("tenant_id", tenantId)
            .tag("class_type", classType)
            .description("Class capacity utilization percentage")
            .baseUnit("percent")
            .register(meterRegistry)
            .record(utilization)
    }

    // ============================================================
    // PAYMENT & REVENUE METRICS
    // ============================================================

    /**
     * Record a successful payment
     */
    fun recordPaymentSuccess(
        tenantId: String,
        amount: BigDecimal,
        paymentMethod: String,
        invoiceType: String
    ) {
        Counter.builder("liyaqa.business.payments.success")
            .tag("tenant_id", tenantId)
            .tag("payment_method", paymentMethod)
            .tag("invoice_type", invoiceType)
            .description("Total successful payments")
            .register(meterRegistry)
            .increment()

        // Track revenue
        Counter.builder("liyaqa.business.revenue.total")
            .tag("tenant_id", tenantId)
            .tag("invoice_type", invoiceType)
            .description("Total revenue in SAR")
            .baseUnit("SAR")
            .register(meterRegistry)
            .increment(amount.toDouble())
    }

    /**
     * Record a failed payment
     */
    fun recordPaymentFailure(
        tenantId: String,
        paymentMethod: String,
        failureReason: String
    ) {
        Counter.builder("liyaqa.business.payments.failed")
            .tag("tenant_id", tenantId)
            .tag("payment_method", paymentMethod)
            .tag("failure_reason", failureReason)
            .description("Total failed payments")
            .register(meterRegistry)
            .increment()
    }

    /**
     * Record payment processing time
     */
    fun recordPaymentProcessingTime(
        tenantId: String,
        paymentMethod: String,
        durationMs: Long
    ) {
        Timer.builder("liyaqa.business.payments.processing.time")
            .tag("tenant_id", tenantId)
            .tag("payment_method", paymentMethod)
            .description("Payment processing time")
            .register(meterRegistry)
            .record(durationMs, TimeUnit.MILLISECONDS)
    }

    // ============================================================
    // SUBSCRIPTION METRICS
    // ============================================================

    /**
     * Record a subscription activation
     */
    fun recordSubscriptionActivated(
        tenantId: String,
        planType: String,
        planPrice: BigDecimal
    ) {
        Counter.builder("liyaqa.business.subscriptions.activated")
            .tag("tenant_id", tenantId)
            .tag("plan_type", planType)
            .description("Total subscription activations")
            .register(meterRegistry)
            .increment()

        // Track MRR (Monthly Recurring Revenue)
        Counter.builder("liyaqa.business.revenue.mrr")
            .tag("tenant_id", tenantId)
            .tag("plan_type", planType)
            .description("Monthly Recurring Revenue in SAR")
            .baseUnit("SAR")
            .register(meterRegistry)
            .increment(planPrice.toDouble())
    }

    /**
     * Record a subscription cancellation
     */
    fun recordSubscriptionCancelled(
        tenantId: String,
        planType: String,
        planPrice: BigDecimal,
        reason: String
    ) {
        Counter.builder("liyaqa.business.subscriptions.cancelled")
            .tag("tenant_id", tenantId)
            .tag("plan_type", planType)
            .tag("reason", reason)
            .description("Total subscription cancellations")
            .register(meterRegistry)
            .increment()

        // Reduce MRR
        Counter.builder("liyaqa.business.revenue.mrr")
            .tag("tenant_id", tenantId)
            .tag("plan_type", planType)
            .description("Monthly Recurring Revenue in SAR")
            .baseUnit("SAR")
            .register(meterRegistry)
            .increment(-planPrice.toDouble())
    }

    /**
     * Record a subscription freeze
     */
    fun recordSubscriptionFrozen(
        tenantId: String,
        planType: String,
        durationDays: Int
    ) {
        Counter.builder("liyaqa.business.subscriptions.frozen")
            .tag("tenant_id", tenantId)
            .tag("plan_type", planType)
            .tag("duration", categorizeDuration(durationDays))
            .description("Total subscription freezes")
            .register(meterRegistry)
            .increment()
    }

    // ============================================================
    // INVENTORY METRICS
    // ============================================================

    /**
     * Record a product sale
     */
    fun recordProductSale(
        tenantId: String,
        productCategory: String,
        quantity: Int,
        amount: BigDecimal
    ) {
        Counter.builder("liyaqa.business.products.sold")
            .tag("tenant_id", tenantId)
            .tag("category", productCategory)
            .description("Total products sold")
            .register(meterRegistry)
            .increment(quantity.toDouble())

        // Track product revenue
        Counter.builder("liyaqa.business.revenue.products")
            .tag("tenant_id", tenantId)
            .tag("category", productCategory)
            .description("Product revenue in SAR")
            .baseUnit("SAR")
            .register(meterRegistry)
            .increment(amount.toDouble())
    }

    /**
     * Record low stock alert
     */
    fun recordLowStockAlert(
        tenantId: String,
        productCategory: String,
        stockLevel: Int
    ) {
        Counter.builder("liyaqa.business.inventory.low_stock_alerts")
            .tag("tenant_id", tenantId)
            .tag("category", productCategory)
            .description("Total low stock alerts")
            .register(meterRegistry)
            .increment()
    }

    // ============================================================
    // LEAD & CAMPAIGN METRICS
    // ============================================================

    /**
     * Record a new lead
     */
    fun recordLeadCreated(
        tenantId: String,
        source: String,
        campaignId: String?
    ) {
        Counter.builder("liyaqa.business.leads.created")
            .tag("tenant_id", tenantId)
            .tag("source", source)
            .tag("campaign_id", campaignId ?: "none")
            .description("Total leads created")
            .register(meterRegistry)
            .increment()
    }

    /**
     * Record lead conversion to member
     */
    fun recordLeadConverted(
        tenantId: String,
        source: String,
        daysToConversion: Long
    ) {
        Counter.builder("liyaqa.business.leads.converted")
            .tag("tenant_id", tenantId)
            .tag("source", source)
            .description("Total lead conversions")
            .register(meterRegistry)
            .increment()

        // Track conversion time
        Timer.builder("liyaqa.business.leads.conversion.time")
            .tag("tenant_id", tenantId)
            .tag("source", source)
            .description("Time from lead to conversion")
            .register(meterRegistry)
            .record(daysToConversion, TimeUnit.DAYS)
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    private fun categorizeAdvanceNotice(hours: Long): String {
        return when {
            hours < 1 -> "< 1 hour"
            hours < 24 -> "< 24 hours"
            hours < 48 -> "< 48 hours"
            else -> "> 48 hours"
        }
    }

    private fun categorizeDuration(days: Int): String {
        return when {
            days <= 7 -> "1 week"
            days <= 14 -> "2 weeks"
            days <= 30 -> "1 month"
            else -> "> 1 month"
        }
    }
}
