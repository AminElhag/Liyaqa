package com.liyaqa.membership.application.services

import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.model.ProrationMode
import com.liyaqa.shared.domain.Money
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/**
 * Result of proration calculation.
 */
data class ProrationResult(
    val credit: Money,
    val charge: Money,
    val netAmount: Money,
    val effectiveDate: LocalDate,
    val daysRemaining: Int,
    val totalDays: Int,
    val prorationMode: ProrationMode
) {
    companion object {
        fun zero(effectiveDate: LocalDate, prorationMode: ProrationMode = ProrationMode.END_OF_PERIOD) = ProrationResult(
            credit = Money.ZERO,
            charge = Money.ZERO,
            netAmount = Money.ZERO,
            effectiveDate = effectiveDate,
            daysRemaining = 0,
            totalDays = 0,
            prorationMode = prorationMode
        )
    }
}

/**
 * Service for calculating proration for plan upgrades and downgrades.
 *
 * Proration Modes:
 * - PRORATE_IMMEDIATELY: Calculate credit for unused days on current plan, charge for remaining days on new plan
 * - END_OF_PERIOD: Schedule change for end of billing period (no proration)
 * - FULL_PERIOD_CREDIT: Full credit + full new charge (special cases)
 * - NO_PRORATION: Just switch plans (promotional)
 */
@Service
class ProrationService {

    /**
     * Calculate proration for a plan change.
     *
     * @param currentPlan The current membership plan
     * @param newPlan The new membership plan
     * @param billingPeriodStart Start of current billing period
     * @param billingPeriodEnd End of current billing period
     * @param changeDate When the change takes effect
     * @param mode Proration mode to use
     */
    fun calculateProration(
        currentPlan: MembershipPlan,
        newPlan: MembershipPlan,
        billingPeriodStart: LocalDate,
        billingPeriodEnd: LocalDate,
        changeDate: LocalDate,
        mode: ProrationMode
    ): ProrationResult {
        return when (mode) {
            ProrationMode.PRORATE_IMMEDIATELY -> calculateImmediateProration(
                currentPlan, newPlan, billingPeriodStart, billingPeriodEnd, changeDate
            )
            ProrationMode.END_OF_PERIOD -> ProrationResult.zero(billingPeriodEnd, mode)
            ProrationMode.FULL_PERIOD_CREDIT -> calculateFullPeriodCredit(
                currentPlan, newPlan, billingPeriodStart, billingPeriodEnd, changeDate
            )
            ProrationMode.NO_PRORATION -> ProrationResult.zero(changeDate, mode)
        }
    }

    /**
     * Calculate proration for immediate plan change.
     * Used for upgrades where member wants immediate access to new benefits.
     *
     * Formula:
     * - Credit = Current plan daily rate × days remaining
     * - Charge = New plan daily rate × days remaining
     * - Net = Charge - Credit (positive means member pays, negative means refund)
     */
    private fun calculateImmediateProration(
        currentPlan: MembershipPlan,
        newPlan: MembershipPlan,
        billingPeriodStart: LocalDate,
        billingPeriodEnd: LocalDate,
        changeDate: LocalDate
    ): ProrationResult {
        val totalDays = ChronoUnit.DAYS.between(billingPeriodStart, billingPeriodEnd).toInt()
        val daysRemaining = ChronoUnit.DAYS.between(changeDate, billingPeriodEnd).toInt()

        if (daysRemaining <= 0 || totalDays <= 0) {
            return ProrationResult.zero(changeDate, ProrationMode.PRORATE_IMMEDIATELY)
        }

        val currentMonthlyFee = currentPlan.getRecurringTotal()
        val newMonthlyFee = newPlan.getRecurringTotal()

        val currentDailyRate = calculateDailyRate(currentMonthlyFee, totalDays)
        val newDailyRate = calculateDailyRate(newMonthlyFee, totalDays)

        val credit = Money.of(
            currentDailyRate.multiply(BigDecimal(daysRemaining)),
            currentMonthlyFee.currency
        )

        val charge = Money.of(
            newDailyRate.multiply(BigDecimal(daysRemaining)),
            newMonthlyFee.currency
        )

        val netAmount = charge - credit

        return ProrationResult(
            credit = credit,
            charge = charge,
            netAmount = netAmount,
            effectiveDate = changeDate,
            daysRemaining = daysRemaining,
            totalDays = totalDays,
            prorationMode = ProrationMode.PRORATE_IMMEDIATELY
        )
    }

    /**
     * Calculate full period credit proration.
     * Full credit for current period + full charge for new plan.
     */
    private fun calculateFullPeriodCredit(
        currentPlan: MembershipPlan,
        newPlan: MembershipPlan,
        billingPeriodStart: LocalDate,
        billingPeriodEnd: LocalDate,
        changeDate: LocalDate
    ): ProrationResult {
        val totalDays = ChronoUnit.DAYS.between(billingPeriodStart, billingPeriodEnd).toInt()
        val daysRemaining = ChronoUnit.DAYS.between(changeDate, billingPeriodEnd).toInt()

        val credit = currentPlan.getRecurringTotal()
        val charge = newPlan.getRecurringTotal()
        val netAmount = charge - credit

        return ProrationResult(
            credit = credit,
            charge = charge,
            netAmount = netAmount,
            effectiveDate = changeDate,
            daysRemaining = daysRemaining,
            totalDays = totalDays,
            prorationMode = ProrationMode.FULL_PERIOD_CREDIT
        )
    }

    /**
     * Calculate daily rate from monthly fee.
     */
    private fun calculateDailyRate(monthlyFee: Money, daysInPeriod: Int): BigDecimal {
        if (daysInPeriod <= 0) return BigDecimal.ZERO
        return monthlyFee.amount.divide(BigDecimal(daysInPeriod), 4, RoundingMode.HALF_UP)
    }

    /**
     * Determine the appropriate proration mode for a plan change.
     *
     * @param isUpgrade Whether this is an upgrade (new plan is more expensive)
     * @param memberPreference Member's preference for timing (null = use default)
     * @return Recommended proration mode
     */
    fun determineProrationMode(
        isUpgrade: Boolean,
        memberPreference: ProrationMode? = null
    ): ProrationMode {
        // If member has a preference, use it (within reason)
        memberPreference?.let {
            return when {
                // Upgrades can be immediate or end of period
                isUpgrade -> when (it) {
                    ProrationMode.PRORATE_IMMEDIATELY -> it
                    ProrationMode.END_OF_PERIOD -> it
                    else -> ProrationMode.PRORATE_IMMEDIATELY // Default for upgrades
                }
                // Downgrades are typically end of period
                else -> when (it) {
                    ProrationMode.END_OF_PERIOD -> it
                    else -> ProrationMode.END_OF_PERIOD // Default for downgrades
                }
            }
        }

        // Default behavior:
        // - Upgrades: Immediate proration (member gets new benefits right away)
        // - Downgrades: End of period (member keeps current benefits until period ends)
        return if (isUpgrade) {
            ProrationMode.PRORATE_IMMEDIATELY
        } else {
            ProrationMode.END_OF_PERIOD
        }
    }

    /**
     * Check if a plan change is an upgrade.
     */
    fun isUpgrade(currentPlan: MembershipPlan, newPlan: MembershipPlan): Boolean {
        return newPlan.getRecurringTotal() > currentPlan.getRecurringTotal()
    }

    /**
     * Format proration summary for display.
     */
    fun formatProrationSummary(result: ProrationResult, locale: String = "en"): String {
        return when (locale) {
            "ar" -> formatArabicSummary(result)
            else -> formatEnglishSummary(result)
        }
    }

    private fun formatEnglishSummary(result: ProrationResult): String {
        return when (result.prorationMode) {
            ProrationMode.PRORATE_IMMEDIATELY -> {
                if (result.netAmount.isPositive()) {
                    "You'll be charged ${result.netAmount.currency} ${result.netAmount.amount} for the remaining ${result.daysRemaining} days this month"
                } else if (result.netAmount.isNegative()) {
                    "You'll receive a credit of ${result.netAmount.currency} ${result.netAmount.amount.abs()} for the remaining ${result.daysRemaining} days"
                } else {
                    "No additional charge for switching plans"
                }
            }
            ProrationMode.END_OF_PERIOD -> {
                "Your plan change will take effect on ${result.effectiveDate}. You'll continue to have your current benefits until then."
            }
            else -> "Plan change processed"
        }
    }

    private fun formatArabicSummary(result: ProrationResult): String {
        return when (result.prorationMode) {
            ProrationMode.PRORATE_IMMEDIATELY -> {
                if (result.netAmount.isPositive()) {
                    "سيتم خصم ${result.netAmount.amount} ${result.netAmount.currency} للـ ${result.daysRemaining} يوم المتبقية من هذا الشهر"
                } else if (result.netAmount.isNegative()) {
                    "ستحصل على رصيد بقيمة ${result.netAmount.amount.abs()} ${result.netAmount.currency} للـ ${result.daysRemaining} يوم المتبقية"
                } else {
                    "لا توجد رسوم إضافية لتغيير الباقة"
                }
            }
            ProrationMode.END_OF_PERIOD -> {
                "سيتم تغيير باقتك في ${result.effectiveDate}. ستستمر في الحصول على مزايا باقتك الحالية حتى ذلك الحين."
            }
            else -> "تم معالجة تغيير الباقة"
        }
    }
}
