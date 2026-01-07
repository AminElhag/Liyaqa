package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.Money
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

@Entity
@Table(name = "subscriptions")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Subscription(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "plan_id", nullable = false)
    val planId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: SubscriptionStatus = SubscriptionStatus.ACTIVE,

    @Column(name = "start_date", nullable = false)
    var startDate: LocalDate,

    @Column(name = "end_date", nullable = false)
    var endDate: LocalDate,

    @Column(name = "auto_renew", nullable = false)
    var autoRenew: Boolean = false,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "paid_amount")),
        AttributeOverride(name = "currency", column = Column(name = "paid_currency"))
    )
    var paidAmount: Money? = null,

    @Column(name = "classes_remaining")
    var classesRemaining: Int? = null,

    @Column(name = "guest_passes_remaining", nullable = false)
    var guestPassesRemaining: Int = 0,

    @Column(name = "freeze_days_remaining", nullable = false)
    var freezeDaysRemaining: Int = 0,

    @Column(name = "frozen_at")
    var frozenAt: LocalDate? = null,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null

) : BaseEntity(id) {

    /**
     * Checks if the subscription end date has passed.
     */
    fun isExpired(): Boolean = LocalDate.now().isAfter(endDate)

    /**
     * Checks if the subscription is currently active and not expired.
     */
    fun isActive(): Boolean = status == SubscriptionStatus.ACTIVE && !isExpired()

    /**
     * Returns the number of days remaining until expiration.
     * Returns negative number if already expired.
     */
    fun daysRemaining(): Long = ChronoUnit.DAYS.between(LocalDate.now(), endDate)

    /**
     * Freezes the subscription.
     * @throws IllegalStateException if subscription is not active or no freeze days remaining
     */
    fun freeze() {
        require(status == SubscriptionStatus.ACTIVE) { "Only active subscriptions can be frozen" }
        require(freezeDaysRemaining > 0) { "No freeze days remaining" }
        status = SubscriptionStatus.FROZEN
        frozenAt = LocalDate.now()
    }

    /**
     * Unfreezes the subscription and extends the end date by the number of frozen days.
     * @throws IllegalStateException if subscription is not frozen
     */
    fun unfreeze() {
        require(status == SubscriptionStatus.FROZEN) { "Subscription is not frozen" }
        requireNotNull(frozenAt) { "Frozen date is not set" }

        val frozenDays = ChronoUnit.DAYS.between(frozenAt, LocalDate.now()).toInt()
        freezeDaysRemaining = maxOf(0, freezeDaysRemaining - frozenDays)
        endDate = endDate.plusDays(frozenDays.toLong()) // Extend by frozen days
        status = SubscriptionStatus.ACTIVE
        frozenAt = null
    }

    /**
     * Cancels the subscription.
     * @throws IllegalStateException if subscription is already cancelled
     */
    fun cancel() {
        require(status != SubscriptionStatus.CANCELLED) { "Subscription is already cancelled" }
        status = SubscriptionStatus.CANCELLED
    }

    /**
     * Marks the subscription as expired if the end date has passed.
     */
    fun expire() {
        if (isExpired() && status == SubscriptionStatus.ACTIVE) {
            status = SubscriptionStatus.EXPIRED
        }
    }

    /**
     * Renews the subscription with a new end date.
     * @param newEndDate the new expiration date
     * @throws IllegalStateException if subscription cannot be renewed
     */
    fun renew(newEndDate: LocalDate) {
        require(status in listOf(SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED)) {
            "Cannot renew subscription in status: $status"
        }
        endDate = newEndDate
        status = SubscriptionStatus.ACTIVE
    }

    /**
     * Uses one class from the subscription's class allowance.
     * @throws IllegalStateException if no classes remaining
     */
    fun useClass() {
        require(classesRemaining == null || classesRemaining!! > 0) { "No classes remaining" }
        classesRemaining?.let { classesRemaining = it - 1 }
    }

    /**
     * Uses one guest pass from the subscription.
     * @throws IllegalStateException if no guest passes remaining
     */
    fun useGuestPass() {
        require(guestPassesRemaining > 0) { "No guest passes remaining" }
        guestPassesRemaining--
    }

    /**
     * Checks if the subscription has classes remaining (or unlimited).
     */
    fun hasClassesAvailable(): Boolean = classesRemaining == null || classesRemaining!! > 0

    /**
     * Checks if the subscription has guest passes available.
     */
    fun hasGuestPassesAvailable(): Boolean = guestPassesRemaining > 0

    /**
     * Marks the subscription as pending payment.
     */
    fun markPendingPayment() {
        status = SubscriptionStatus.PENDING_PAYMENT
    }

    /**
     * Confirms payment and activates the subscription.
     * @param amount the paid amount
     */
    fun confirmPayment(amount: Money) {
        require(status == SubscriptionStatus.PENDING_PAYMENT) { "Subscription is not pending payment" }
        paidAmount = amount
        status = SubscriptionStatus.ACTIVE
    }
}