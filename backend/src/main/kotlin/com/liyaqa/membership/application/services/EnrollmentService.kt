package com.liyaqa.membership.application.services

import com.liyaqa.billing.application.commands.CreateSubscriptionInvoiceCommand
import com.liyaqa.billing.application.commands.IssueInvoiceCommand
import com.liyaqa.billing.application.commands.RecordPaymentCommand
import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.billing.domain.model.PaymentMethod
import com.liyaqa.membership.api.MoneyResponse
import com.liyaqa.membership.api.dto.EnrollmentPreviewRequest
import com.liyaqa.membership.api.dto.EnrollmentPreviewResponse
import com.liyaqa.membership.api.dto.EnrollmentRequest
import com.liyaqa.membership.api.dto.EnrollmentResponse
import com.liyaqa.membership.api.dto.FeeLineResponse
import com.liyaqa.membership.application.commands.CreateMemberCommand
import com.liyaqa.membership.application.commands.CreateSubscriptionCommand
import com.liyaqa.membership.domain.model.ContractTerm
import com.liyaqa.membership.domain.model.ContractType
import com.liyaqa.membership.domain.model.DiscountType
import com.liyaqa.membership.domain.model.Gender
import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.organization.api.LocalizedTextResponse
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal


@Service
class EnrollmentService(
    private val memberService: MemberService,
    private val subscriptionService: SubscriptionService,
    private val contractService: ContractService,
    private val invoiceService: InvoiceService,
    private val memberRepository: MemberRepository,
    private val membershipPlanRepository: MembershipPlanRepository,
    private val subscriptionRepository: SubscriptionRepository
) {
    private val logger = LoggerFactory.getLogger(EnrollmentService::class.java)

    /**
     * Preview enrollment fees without creating anything.
     */
    @Transactional(readOnly = true)
    fun preview(request: EnrollmentPreviewRequest): EnrollmentPreviewResponse {
        val plan = membershipPlanRepository.findById(request.planId)
            .orElseThrow { NoSuchElementException("Plan not found: ${request.planId}") }

        if (!plan.isActive) {
            throw IllegalStateException("Plan is not active: ${request.planId}")
        }

        val contractTerm = ContractTerm.valueOf(request.contractTerm)

        // Determine if join fee applies (first subscription for this member)
        val isFirstSubscription = if (request.existingMemberId != null) {
            subscriptionRepository.countByMemberId(request.existingMemberId) == 0L
        } else {
            true // new member, always first
        }

        // Build fee breakdown
        val membershipFeeLine = buildFeeLine(
            label = LocalizedText(
                en = "Membership Fee - ${plan.name.en}",
                ar = plan.name.ar?.let { "رسوم العضوية - $it" } ?: "رسوم العضوية"
            ),
            fee = plan.membershipFee
        )

        val adminFeeLine = buildFeeLine(
            label = LocalizedText(en = "Administration Fee", ar = "رسوم إدارية"),
            fee = plan.administrationFee
        )

        val joinFeeLine = buildFeeLine(
            label = LocalizedText(en = "Joining Fee (One-time)", ar = "رسوم الانضمام (مرة واحدة)"),
            fee = plan.joinFee,
            applicable = isFirstSubscription && !plan.joinFee.isZero()
        )

        // Calculate totals
        var subtotal = membershipFeeLine.netMoney + adminFeeLine.netMoney
        var vatTotal = membershipFeeLine.taxMoney + adminFeeLine.taxMoney

        if (joinFeeLine.applicable) {
            subtotal += joinFeeLine.netMoney
            vatTotal += joinFeeLine.taxMoney
        }

        var grandTotal = subtotal + vatTotal

        // Apply discount
        var discountAmount: Money? = null
        if (request.discountType != null && request.discountValue != null) {
            val discountMoney = when (DiscountType.valueOf(request.discountType)) {
                DiscountType.PERCENTAGE -> Money(
                    grandTotal.amount * request.discountValue / BigDecimal("100"),
                    grandTotal.currency
                )
                else -> Money(request.discountValue, grandTotal.currency)
            }
            discountAmount = discountMoney
            grandTotal -= discountMoney
        }

        val commitmentMonths = contractTerm.toMonths()

        return EnrollmentPreviewResponse(
            planId = plan.id,
            planName = LocalizedTextResponse.from(plan.name),
            billingPeriod = plan.billingPeriod.name,
            durationDays = plan.getEffectiveDurationDays(),
            membershipFee = membershipFeeLine.toResponse(),
            administrationFee = adminFeeLine.toResponse(),
            joinFee = joinFeeLine.toResponse(),
            subtotal = MoneyResponse.from(subtotal),
            vatTotal = MoneyResponse.from(vatTotal),
            discountAmount = discountAmount?.let { MoneyResponse.from(it) },
            grandTotal = MoneyResponse.from(grandTotal),
            contractTerm = contractTerm.name,
            commitmentMonths = commitmentMonths,
            coolingOffDays = plan.coolingOffDays,
            noticePeriodDays = plan.defaultNoticePeriodDays,
            isFirstSubscription = isFirstSubscription
        )
    }

    /**
     * Atomically enroll a member: create/load member + contract + subscription + invoice + payment.
     */
    @Transactional
    fun enroll(request: EnrollmentRequest): EnrollmentResponse {
        // 1. Validate plan
        val plan = membershipPlanRepository.findById(request.planId)
            .orElseThrow { NoSuchElementException("Plan not found: ${request.planId}") }

        if (!plan.isActive) {
            throw IllegalStateException("Plan is not active: ${request.planId}")
        }
        if (!plan.isCurrentlyAvailable()) {
            throw IllegalStateException("Plan is not currently available: ${plan.name.en}")
        }

        // 2. Create or load member
        val member = if (request.existingMemberId != null) {
            val existing = memberRepository.findById(request.existingMemberId)
                .orElseThrow { NoSuchElementException("Member not found: ${request.existingMemberId}") }

            if (subscriptionRepository.existsActiveByMemberId(existing.id)) {
                throw IllegalStateException("Member already has an active subscription")
            }

            // Validate age eligibility
            if (plan.minimumAge != null || plan.maximumAge != null) {
                val age = existing.getAge()
                    ?: throw IllegalStateException("Member date of birth required for age-restricted plans")
                if (!plan.isAgeEligible(age)) {
                    throw IllegalStateException("Member age ($age) does not meet plan age requirements")
                }
            }

            existing
        } else {
            val input = request.newMember!!
            val command = CreateMemberCommand(
                firstName = LocalizedText(en = input.firstNameEn, ar = input.firstNameAr),
                lastName = LocalizedText(en = input.lastNameEn, ar = input.lastNameAr),
                email = input.email,
                phone = input.phone,
                dateOfBirth = input.dateOfBirth,
                gender = input.gender?.let { Gender.valueOf(it) },
                nationalId = input.nationalId
            )
            memberService.createMember(command)
        }

        logger.info("Enrollment: member resolved id=${member.id}")

        // 3. Create contract
        val startDate = request.startDate ?: java.time.LocalDate.now()
        val contractType = ContractType.valueOf(request.contractType)
        val contractTerm = ContractTerm.valueOf(request.contractTerm)

        val contractResult = contractService.createContract(
            CreateContractCommand(
                memberId = member.id,
                planId = plan.id,
                contractType = contractType,
                contractTerm = contractTerm,
                startDate = startDate,
                categoryId = request.categoryId
            )
        )

        logger.info("Enrollment: contract created id=${contractResult.contract.id}")

        // 4. Create subscription (delegates to existing SubscriptionService for wallet/voucher/referral/notification logic)
        val paidMoney = request.paidAmount?.let { Money(it, request.paidCurrency) }
        val subscription = subscriptionService.createSubscription(
            CreateSubscriptionCommand(
                memberId = member.id,
                planId = plan.id,
                startDate = startDate,
                autoRenew = request.autoRenew,
                paidAmount = paidMoney,
                notes = request.staffNotes,
                voucherCode = request.voucherCode
            )
        )

        // Link contract ↔ subscription
        subscription.linkContract(contractResult.contract.id)
        subscriptionRepository.save(subscription)
        contractService.linkSubscription(contractResult.contract.id, subscription.id)

        // Apply discount fields on subscription
        if (request.discountType != null && request.discountValue != null) {
            subscription.discountType = DiscountType.valueOf(request.discountType)
            subscription.discountValue = request.discountValue
            subscription.discountReason = request.discountReason
            subscription.originalPrice = plan.getRecurringTotal()
            subscriptionRepository.save(subscription)
        }

        // Set staff notes and referral
        subscription.staffNotes = request.staffNotes
        subscription.referredByMemberId = request.referredByMemberId
        subscriptionRepository.save(subscription)

        logger.info("Enrollment: subscription created id=${subscription.id}")

        // 5. Create invoice
        val invoice = invoiceService.createInvoiceFromSubscription(
            CreateSubscriptionInvoiceCommand(subscriptionId = subscription.id)
        )

        // Issue the invoice (DRAFT → ISSUED) so payment can be recorded
        invoiceService.issueInvoice(invoice.id, IssueInvoiceCommand())

        // 6. Record payment if provided
        if (request.paidAmount != null && request.paymentMethod != null) {
            val paymentMethod = PaymentMethod.valueOf(request.paymentMethod)
            invoiceService.recordPayment(
                invoice.id,
                RecordPaymentCommand(
                    amount = Money(request.paidAmount, request.paidCurrency),
                    paymentMethod = paymentMethod
                )
            )
        }

        logger.info("Enrollment: invoice created id=${invoice.id}, issued and payment recorded")

        val memberName = LocalizedText(
            en = "${member.firstName.en} ${member.lastName.en}",
            ar = (member.firstName.ar ?: member.firstName.en) + " " + (member.lastName.ar ?: member.lastName.en)
        )

        return EnrollmentResponse(
            memberId = member.id,
            subscriptionId = subscription.id,
            contractId = contractResult.contract.id,
            invoiceId = invoice.id,
            status = subscription.status.name,
            memberName = LocalizedTextResponse.from(memberName),
            planName = LocalizedTextResponse.from(plan.name),
            totalAmount = MoneyResponse.from(plan.getRecurringTotal()),
            paidAmount = paidMoney?.let { MoneyResponse.from(it) },
            startDate = subscription.startDate,
            endDate = subscription.endDate
        )
    }

    // === Internal helpers ===

    private data class FeeLineCalc(
        val label: LocalizedText,
        val netMoney: Money,
        val taxRate: BigDecimal,
        val taxMoney: Money,
        val grossMoney: Money,
        val applicable: Boolean
    ) {
        fun toResponse() = FeeLineResponse(
            label = LocalizedTextResponse.from(label),
            netAmount = MoneyResponse.from(netMoney),
            taxRate = taxRate,
            taxAmount = MoneyResponse.from(taxMoney),
            grossAmount = MoneyResponse.from(grossMoney),
            applicable = applicable
        )
    }

    private fun buildFeeLine(
        label: LocalizedText,
        fee: com.liyaqa.shared.domain.TaxableFee,
        applicable: Boolean = !fee.isZero()
    ): FeeLineCalc {
        if (!applicable || fee.isZero()) {
            val zero = Money(BigDecimal.ZERO, "SAR")
            return FeeLineCalc(label, zero, BigDecimal.ZERO, zero, zero, false)
        }
        val net = fee.getNetAmount()
        val tax = fee.getTaxAmount()
        val gross = fee.getGrossAmount()
        return FeeLineCalc(label, net, fee.taxRate, tax, gross, true)
    }
}
