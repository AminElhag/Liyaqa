package com.liyaqa.membership.application.services

import com.liyaqa.membership.application.commands.CreateSubscriptionCommand
import com.liyaqa.membership.application.commands.RenewSubscriptionCommand
import com.liyaqa.membership.application.commands.UpdateSubscriptionCommand
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.MemberWalletRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.referral.application.services.ReferralRewardService
import com.liyaqa.referral.application.services.ReferralTrackingService
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.voucher.application.commands.RedeemVoucherCommand
import com.liyaqa.voucher.application.services.VoucherRedemptionService
import com.liyaqa.webhook.application.services.WebhookEventPublisher
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID

@Service
@Transactional
class SubscriptionService(
    private val subscriptionRepository: SubscriptionRepository,
    private val memberRepository: MemberRepository,
    private val membershipPlanRepository: MembershipPlanRepository,
    private val memberWalletRepository: MemberWalletRepository,
    private val notificationService: NotificationService,
    private val walletService: WalletService,
    private val webhookPublisher: WebhookEventPublisher,
    private val voucherRedemptionService: VoucherRedemptionService,
    private val referralTrackingService: ReferralTrackingService,
    private val referralRewardService: ReferralRewardService
) {
    private val logger = LoggerFactory.getLogger(SubscriptionService::class.java)
    private val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    /**
     * Creates a new subscription for a member.
     * @throws NoSuchElementException if member or plan not found
     * @throws IllegalStateException if member already has an active subscription
     */
    fun createSubscription(command: CreateSubscriptionCommand): Subscription {
        // Get member for validation
        val member = memberRepository.findById(command.memberId)
            .orElseThrow { NoSuchElementException("Member not found: ${command.memberId}") }

        // Validate plan exists and is active
        val plan = membershipPlanRepository.findById(command.planId)
            .orElseThrow { NoSuchElementException("Membership plan not found: ${command.planId}") }

        if (!plan.isActive) {
            throw IllegalStateException("Membership plan is not active: ${command.planId}")
        }

        // Validate plan is currently available (within date range)
        if (!plan.isCurrentlyAvailable()) {
            throw IllegalStateException(
                "Membership plan '${plan.name.en}' is not currently available. " +
                "Available from: ${plan.availableFrom ?: "any time"}, " +
                "until: ${plan.availableUntil ?: "any time"}"
            )
        }

        // Validate member age if plan has age restrictions
        if (plan.minimumAge != null || plan.maximumAge != null) {
            val memberAge = member.getAge()
                ?: throw IllegalStateException(
                    "Member date of birth is required for age-restricted plans. " +
                    "Plan '${plan.name.en}' requires age ${plan.minimumAge ?: 0} - ${plan.maximumAge ?: "any"} years."
                )

            if (!plan.isAgeEligible(memberAge)) {
                val ageRange = buildString {
                    if (plan.minimumAge != null) append("minimum ${plan.minimumAge}")
                    if (plan.minimumAge != null && plan.maximumAge != null) append(" and ")
                    if (plan.maximumAge != null) append("maximum ${plan.maximumAge}")
                }
                throw IllegalStateException(
                    "Member age ($memberAge years) does not meet plan requirements: $ageRange years"
                )
            }
        }

        // Check if member already has an active subscription
        if (subscriptionRepository.existsActiveByMemberId(command.memberId)) {
            throw IllegalStateException("Member already has an active subscription")
        }

        // Calculate end date based on plan
        val endDate = command.startDate.plusDays(plan.getEffectiveDurationDays().toLong())

        val subscription = Subscription(
            memberId = command.memberId,
            planId = command.planId,
            startDate = command.startDate,
            endDate = endDate,
            autoRenew = command.autoRenew,
            paidAmount = command.paidAmount,
            classesRemaining = plan.maxClassesPerPeriod,
            guestPassesRemaining = if (plan.hasGuestPasses) plan.guestPassesCount else 0,
            freezeDaysRemaining = plan.freezeDaysAllowed,
            notes = command.notes,
            status = if (command.paidAmount != null) SubscriptionStatus.ACTIVE else SubscriptionStatus.PENDING_PAYMENT
        )

        val savedSubscription = subscriptionRepository.save(subscription)

        // If subscription is PENDING_PAYMENT, charge the wallet (balance may go negative)
        if (savedSubscription.status == SubscriptionStatus.PENDING_PAYMENT) {
            walletService.chargeSubscription(
                memberId = savedSubscription.memberId,
                subscriptionId = savedSubscription.id,
                amount = plan.getRecurringTotal()
            )
            logger.info("Charged wallet for pending subscription ${savedSubscription.id}")

            // Check if member already has sufficient balance to auto-pay
            val activatedSubscriptions = walletService.autoPayPendingSubscriptions(savedSubscription.memberId)
            if (activatedSubscriptions.any { it.id == savedSubscription.id }) {
                // Subscription was auto-activated, reload it to get updated status
                val updatedSubscription = subscriptionRepository.findById(savedSubscription.id).orElse(savedSubscription)
                sendSubscriptionCreatedNotification(updatedSubscription, plan.name)
                return updatedSubscription
            }
        }

        // Send subscription created notification
        if (savedSubscription.status == SubscriptionStatus.ACTIVE) {
            sendSubscriptionCreatedNotification(savedSubscription, plan.name)
        }

        // Apply voucher if provided
        command.voucherCode?.let { code ->
            try {
                val result = voucherRedemptionService.redeemVoucher(
                    RedeemVoucherCommand(
                        code = code,
                        memberId = command.memberId,
                        purchaseAmount = plan.getRecurringTotal().amount,
                        usedForType = "SUBSCRIPTION",
                        usedForId = savedSubscription.id
                    )
                )
                if (result.success) {
                    logger.info("Applied voucher $code to subscription ${savedSubscription.id}, discount: ${result.discountApplied}")
                } else {
                    logger.warn("Failed to apply voucher $code to subscription ${savedSubscription.id}: ${result.errorMessage}")
                }
            } catch (e: Exception) {
                logger.error("Error applying voucher $code to subscription ${savedSubscription.id}: ${e.message}", e)
            }
        }

        // Trigger referral conversion if member was referred
        try {
            val convertedReferral = referralTrackingService.convertReferral(command.memberId, savedSubscription.id)
            if (convertedReferral != null) {
                logger.info("Converted referral ${convertedReferral.id} for member ${command.memberId}")
                // Create and distribute reward
                val reward = referralRewardService.createReward(convertedReferral)
                if (reward != null) {
                    referralRewardService.distributeReward(reward.id)
                    logger.info("Distributed referral reward ${reward.id}")
                }
            }
        } catch (e: Exception) {
            logger.error("Error processing referral conversion for member ${command.memberId}: ${e.message}", e)
        }

        // Publish webhook event
        try {
            webhookPublisher.publishSubscriptionCreated(savedSubscription)
        } catch (e: Exception) {
            logger.error("Failed to publish subscription created webhook: ${e.message}", e)
        }

        return savedSubscription
    }

    /**
     * Gets a subscription by ID.
     */
    @Transactional(readOnly = true)
    fun getSubscription(id: UUID): Subscription {
        return subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }
    }

    /**
     * Gets all subscriptions for a member.
     */
    @Transactional(readOnly = true)
    fun getSubscriptionsByMember(memberId: UUID, pageable: Pageable): Page<Subscription> {
        return subscriptionRepository.findByMemberId(memberId, pageable)
    }

    /**
     * Gets the active subscription for a member.
     */
    @Transactional(readOnly = true)
    fun getActiveSubscription(memberId: UUID): Subscription? {
        return subscriptionRepository.findActiveByMemberId(memberId).orElse(null)
    }

    /**
     * Gets all subscriptions with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllSubscriptions(pageable: Pageable): Page<Subscription> {
        return subscriptionRepository.findAll(pageable)
    }

    /**
     * Search subscriptions with filters.
     */
    @Transactional(readOnly = true)
    fun searchSubscriptions(
        planId: UUID?,
        status: SubscriptionStatus?,
        expiringBefore: LocalDate?,
        pageable: Pageable
    ): Page<Subscription> {
        return subscriptionRepository.search(planId, status, expiringBefore, pageable)
    }

    /**
     * Gets subscriptions by status.
     */
    @Transactional(readOnly = true)
    fun getSubscriptionsByStatus(status: SubscriptionStatus, pageable: Pageable): Page<Subscription> {
        return subscriptionRepository.findByStatus(status, pageable)
    }

    /**
     * Gets subscriptions expiring within the given number of days.
     */
    @Transactional(readOnly = true)
    fun getExpiringSubscriptions(daysAhead: Int, pageable: Pageable): Page<Subscription> {
        val expirationDate = LocalDate.now().plusDays(daysAhead.toLong())
        return subscriptionRepository.findExpiringBefore(expirationDate, pageable)
    }

    /**
     * Updates a subscription.
     */
    fun updateSubscription(id: UUID, command: UpdateSubscriptionCommand): Subscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        command.autoRenew?.let { subscription.autoRenew = it }
        command.notes?.let { subscription.notes = it }

        return subscriptionRepository.save(subscription)
    }

    /**
     * Freezes a subscription.
     */
    fun freezeSubscription(id: UUID): Subscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        subscription.freeze()
        val savedSubscription = subscriptionRepository.save(subscription)

        // Send freeze notification
        sendSubscriptionFrozenNotification(savedSubscription)

        // Publish webhook event
        try {
            webhookPublisher.publishSubscriptionFrozen(savedSubscription)
        } catch (e: Exception) {
            logger.error("Failed to publish subscription frozen webhook: ${e.message}", e)
        }

        return savedSubscription
    }

    /**
     * Unfreezes a subscription.
     */
    fun unfreezeSubscription(id: UUID): Subscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        subscription.unfreeze()
        val savedSubscription = subscriptionRepository.save(subscription)

        // Send unfreeze notification
        sendSubscriptionUnfrozenNotification(savedSubscription)

        // Publish webhook event
        try {
            webhookPublisher.publishSubscriptionUnfrozen(savedSubscription)
        } catch (e: Exception) {
            logger.error("Failed to publish subscription unfrozen webhook: ${e.message}", e)
        }

        return savedSubscription
    }

    /**
     * Cancels a subscription.
     */
    fun cancelSubscription(id: UUID): Subscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        subscription.cancel()
        val savedSubscription = subscriptionRepository.save(subscription)

        // Send cancellation notification
        sendSubscriptionCancelledNotification(savedSubscription)

        // Publish webhook event
        try {
            webhookPublisher.publishSubscriptionCancelled(savedSubscription)
        } catch (e: Exception) {
            logger.error("Failed to publish subscription cancelled webhook: ${e.message}", e)
        }

        return savedSubscription
    }

    /**
     * Renews a subscription.
     */
    fun renewSubscription(id: UUID, command: RenewSubscriptionCommand): Subscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        // Get the plan to calculate new end date if not provided
        val plan = membershipPlanRepository.findById(subscription.planId)
            .orElseThrow { NoSuchElementException("Membership plan not found: ${subscription.planId}") }

        val newEndDate = command.newEndDate
            ?: LocalDate.now().plusDays(plan.getEffectiveDurationDays().toLong())

        subscription.renew(newEndDate)

        // Reset class allowance and guest passes
        subscription.classesRemaining = plan.maxClassesPerPeriod
        subscription.guestPassesRemaining = if (plan.hasGuestPasses) plan.guestPassesCount else 0
        subscription.freezeDaysRemaining = plan.freezeDaysAllowed

        command.paidAmount?.let { subscription.paidAmount = it }

        val savedSubscription = subscriptionRepository.save(subscription)

        // Send renewal notification
        sendSubscriptionRenewedNotification(savedSubscription, plan.name)

        // Publish webhook event
        try {
            webhookPublisher.publishSubscriptionRenewed(savedSubscription)
        } catch (e: Exception) {
            logger.error("Failed to publish subscription renewed webhook: ${e.message}", e)
        }

        return savedSubscription
    }

    /**
     * Uses a class from the subscription.
     */
    fun useClass(id: UUID): Subscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        if (!subscription.isActive()) {
            throw IllegalStateException("Subscription is not active")
        }

        subscription.useClass()
        return subscriptionRepository.save(subscription)
    }

    /**
     * Uses a guest pass from the subscription.
     */
    fun useGuestPass(id: UUID): Subscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        if (!subscription.isActive()) {
            throw IllegalStateException("Subscription is not active")
        }

        subscription.useGuestPass()
        return subscriptionRepository.save(subscription)
    }

    /**
     * Deletes a subscription.
     * Only CANCELLED or EXPIRED subscriptions can be deleted.
     */
    fun deleteSubscription(id: UUID) {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        require(subscription.status == SubscriptionStatus.CANCELLED || subscription.status == SubscriptionStatus.EXPIRED) {
            "Only cancelled or expired subscriptions can be deleted"
        }

        subscriptionRepository.deleteById(id)
    }

    // ==================== NOTIFICATION METHODS ====================

    private fun sendSubscriptionCreatedNotification(subscription: Subscription, planName: LocalizedText) {
        try {
            val member = memberRepository.findById(subscription.memberId).orElse(null) ?: return

            val subject = LocalizedText(
                en = "Subscription Activated - Liyaqa",
                ar = "تم تفعيل الاشتراك - لياقة"
            )
            val body = LocalizedText(
                en = """
                    <h2>Your Subscription is Now Active!</h2>
                    <p>Dear ${member.firstName},</p>
                    <p>Your subscription to <strong>${planName.en}</strong> has been activated.</p>
                    <p><strong>Details:</strong></p>
                    <ul>
                        <li>Start Date: ${subscription.startDate.format(dateFormatter)}</li>
                        <li>End Date: ${subscription.endDate.format(dateFormatter)}</li>
                        ${if (subscription.classesRemaining != null) "<li>Classes Available: ${subscription.classesRemaining}</li>" else ""}
                    </ul>
                    <p>Welcome to Liyaqa! We're excited to have you.</p>
                """.trimIndent(),
                ar = """
                    <h2>اشتراكك نشط الآن!</h2>
                    <p>عزيزي ${member.firstName}،</p>
                    <p>تم تفعيل اشتراكك في <strong>${planName.ar ?: planName.en}</strong>.</p>
                    <p><strong>التفاصيل:</strong></p>
                    <ul>
                        <li>تاريخ البدء: ${subscription.startDate.format(dateFormatter)}</li>
                        <li>تاريخ الانتهاء: ${subscription.endDate.format(dateFormatter)}</li>
                        ${if (subscription.classesRemaining != null) "<li>الحصص المتاحة: ${subscription.classesRemaining}</li>" else ""}
                    </ul>
                    <p>مرحباً بك في لياقة! يسعدنا انضمامك.</p>
                """.trimIndent()
            )

            notificationService.sendMultiChannelIfNotDuplicate(
                memberId = member.id,
                email = member.email,
                phone = member.phone,
                type = NotificationType.SUBSCRIPTION_CREATED,
                subject = subject,
                body = body,
                priority = NotificationPriority.NORMAL,
                referenceId = subscription.id,
                referenceType = "subscription"
            )
        } catch (e: Exception) {
            logger.error("Failed to send subscription created notification: ${e.message}", e)
        }
    }

    private fun sendSubscriptionFrozenNotification(subscription: Subscription) {
        try {
            val member = memberRepository.findById(subscription.memberId).orElse(null) ?: return

            val subject = LocalizedText(
                en = "Subscription Frozen - Liyaqa",
                ar = "تم تجميد الاشتراك - لياقة"
            )
            val body = LocalizedText(
                en = """
                    <h2>Your Subscription Has Been Frozen</h2>
                    <p>Dear ${member.firstName},</p>
                    <p>Your subscription has been frozen as requested.</p>
                    <p>Freeze days remaining: <strong>${subscription.freezeDaysRemaining}</strong></p>
                    <p>To resume your subscription, please contact us or unfreeze through the app.</p>
                """.trimIndent(),
                ar = """
                    <h2>تم تجميد اشتراكك</h2>
                    <p>عزيزي ${member.firstName}،</p>
                    <p>تم تجميد اشتراكك كما طلبت.</p>
                    <p>أيام التجميد المتبقية: <strong>${subscription.freezeDaysRemaining}</strong></p>
                    <p>لاستئناف اشتراكك، يرجى التواصل معنا أو إلغاء التجميد عبر التطبيق.</p>
                """.trimIndent()
            )

            notificationService.sendMultiChannelIfNotDuplicate(
                memberId = member.id,
                email = member.email,
                phone = member.phone,
                type = NotificationType.SUBSCRIPTION_FROZEN,
                subject = subject,
                body = body,
                priority = NotificationPriority.NORMAL,
                referenceId = subscription.id,
                referenceType = "subscription"
            )
        } catch (e: Exception) {
            logger.error("Failed to send subscription frozen notification: ${e.message}", e)
        }
    }

    private fun sendSubscriptionUnfrozenNotification(subscription: Subscription) {
        try {
            val member = memberRepository.findById(subscription.memberId).orElse(null) ?: return

            val subject = LocalizedText(
                en = "Subscription Reactivated - Liyaqa",
                ar = "تم إعادة تفعيل الاشتراك - لياقة"
            )
            val body = LocalizedText(
                en = """
                    <h2>Your Subscription is Active Again!</h2>
                    <p>Dear ${member.firstName},</p>
                    <p>Your subscription has been unfrozen and is now active.</p>
                    <p><strong>Details:</strong></p>
                    <ul>
                        <li>New End Date: ${subscription.endDate.format(dateFormatter)}</li>
                        ${if (subscription.classesRemaining != null) "<li>Classes Remaining: ${subscription.classesRemaining}</li>" else ""}
                    </ul>
                    <p>Welcome back! We look forward to seeing you.</p>
                """.trimIndent(),
                ar = """
                    <h2>اشتراكك نشط مرة أخرى!</h2>
                    <p>عزيزي ${member.firstName}،</p>
                    <p>تم إلغاء تجميد اشتراكك وهو نشط الآن.</p>
                    <p><strong>التفاصيل:</strong></p>
                    <ul>
                        <li>تاريخ الانتهاء الجديد: ${subscription.endDate.format(dateFormatter)}</li>
                        ${if (subscription.classesRemaining != null) "<li>الحصص المتبقية: ${subscription.classesRemaining}</li>" else ""}
                    </ul>
                    <p>مرحباً بعودتك! نتطلع لرؤيتك.</p>
                """.trimIndent()
            )

            notificationService.sendMultiChannelIfNotDuplicate(
                memberId = member.id,
                email = member.email,
                phone = member.phone,
                type = NotificationType.SUBSCRIPTION_UNFROZEN,
                subject = subject,
                body = body,
                priority = NotificationPriority.NORMAL,
                referenceId = subscription.id,
                referenceType = "subscription"
            )
        } catch (e: Exception) {
            logger.error("Failed to send subscription unfrozen notification: ${e.message}", e)
        }
    }

    private fun sendSubscriptionCancelledNotification(subscription: Subscription) {
        try {
            val member = memberRepository.findById(subscription.memberId).orElse(null) ?: return

            val subject = LocalizedText(
                en = "Subscription Cancelled - Liyaqa",
                ar = "تم إلغاء الاشتراك - لياقة"
            )
            val body = LocalizedText(
                en = """
                    <h2>Your Subscription Has Been Cancelled</h2>
                    <p>Dear ${member.firstName},</p>
                    <p>Your subscription has been cancelled.</p>
                    <p>We're sorry to see you go. If you have any feedback or would like to rejoin, please don't hesitate to contact us.</p>
                    <p>Thank you for being a member of Liyaqa.</p>
                """.trimIndent(),
                ar = """
                    <h2>تم إلغاء اشتراكك</h2>
                    <p>عزيزي ${member.firstName}،</p>
                    <p>تم إلغاء اشتراكك.</p>
                    <p>نأسف لرحيلك. إذا كان لديك أي ملاحظات أو ترغب في العودة، فلا تتردد في التواصل معنا.</p>
                    <p>شكراً لكونك عضواً في لياقة.</p>
                """.trimIndent()
            )

            notificationService.sendMultiChannelIfNotDuplicate(
                memberId = member.id,
                email = member.email,
                phone = member.phone,
                type = NotificationType.SUBSCRIPTION_CANCELLED,
                subject = subject,
                body = body,
                priority = NotificationPriority.HIGH,
                referenceId = subscription.id,
                referenceType = "subscription"
            )
        } catch (e: Exception) {
            logger.error("Failed to send subscription cancelled notification: ${e.message}", e)
        }
    }

    private fun sendSubscriptionRenewedNotification(subscription: Subscription, planName: LocalizedText) {
        try {
            val member = memberRepository.findById(subscription.memberId).orElse(null) ?: return

            val subject = LocalizedText(
                en = "Subscription Renewed - Liyaqa",
                ar = "تم تجديد الاشتراك - لياقة"
            )
            val body = LocalizedText(
                en = """
                    <h2>Your Subscription Has Been Renewed!</h2>
                    <p>Dear ${member.firstName},</p>
                    <p>Your subscription to <strong>${planName.en}</strong> has been renewed.</p>
                    <p><strong>Details:</strong></p>
                    <ul>
                        <li>New End Date: ${subscription.endDate.format(dateFormatter)}</li>
                        ${if (subscription.classesRemaining != null) "<li>Classes Available: ${subscription.classesRemaining}</li>" else ""}
                    </ul>
                    <p>Thank you for continuing with Liyaqa!</p>
                """.trimIndent(),
                ar = """
                    <h2>تم تجديد اشتراكك!</h2>
                    <p>عزيزي ${member.firstName}،</p>
                    <p>تم تجديد اشتراكك في <strong>${planName.ar ?: planName.en}</strong>.</p>
                    <p><strong>التفاصيل:</strong></p>
                    <ul>
                        <li>تاريخ الانتهاء الجديد: ${subscription.endDate.format(dateFormatter)}</li>
                        ${if (subscription.classesRemaining != null) "<li>الحصص المتاحة: ${subscription.classesRemaining}</li>" else ""}
                    </ul>
                    <p>شكراً لاستمرارك مع لياقة!</p>
                """.trimIndent()
            )

            notificationService.sendMultiChannelIfNotDuplicate(
                memberId = member.id,
                email = member.email,
                phone = member.phone,
                type = NotificationType.SUBSCRIPTION_RENEWED,
                subject = subject,
                body = body,
                priority = NotificationPriority.NORMAL,
                referenceId = subscription.id,
                referenceType = "subscription"
            )
        } catch (e: Exception) {
            logger.error("Failed to send subscription renewed notification: ${e.message}", e)
        }
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Bulk freeze subscriptions.
     * @return Map of subscription ID to success/failure status
     */
    fun bulkFreezeSubscriptions(subscriptionIds: List<UUID>): Map<UUID, Result<Subscription>> {
        return subscriptionIds.associateWith { id ->
            runCatching {
                freezeSubscription(id)
            }
        }
    }

    /**
     * Bulk unfreeze subscriptions.
     * @return Map of subscription ID to success/failure status
     */
    fun bulkUnfreezeSubscriptions(subscriptionIds: List<UUID>): Map<UUID, Result<Subscription>> {
        return subscriptionIds.associateWith { id ->
            runCatching {
                unfreezeSubscription(id)
            }
        }
    }

    /**
     * Bulk cancel subscriptions.
     * @return Map of subscription ID to success/failure status
     */
    fun bulkCancelSubscriptions(subscriptionIds: List<UUID>): Map<UUID, Result<Subscription>> {
        return subscriptionIds.associateWith { id ->
            runCatching {
                cancelSubscription(id)
            }
        }
    }

    /**
     * Bulk renew subscriptions.
     * @return Map of subscription ID to success/failure status
     */
    fun bulkRenewSubscriptions(
        subscriptionIds: List<UUID>,
        newEndDate: LocalDate?,
        paidAmount: com.liyaqa.shared.domain.Money?
    ): Map<UUID, Result<Subscription>> {
        return subscriptionIds.associateWith { id ->
            runCatching {
                val command = RenewSubscriptionCommand(
                    newEndDate = newEndDate,
                    paidAmount = paidAmount
                )
                renewSubscription(id, command)
            }
        }
    }
}