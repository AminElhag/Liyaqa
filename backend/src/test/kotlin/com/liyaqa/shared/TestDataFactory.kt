package com.liyaqa.shared

import com.liyaqa.membership.domain.model.BillingPeriod
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import com.liyaqa.organization.domain.model.Location
import com.liyaqa.organization.domain.model.LocationStatus
import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TaxableFee
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Factory methods for creating test entities with sensible defaults.
 * Reduces boilerplate in integration tests.
 */
object TestDataFactory {

    /**
     * Creates a test Organization with default values.
     */
    fun createTestOrganization(
        id: UUID = UUID.randomUUID(),
        nameEn: String = "Test Organization",
        nameAr: String? = "منظمة اختبار",
        status: OrganizationStatus = OrganizationStatus.ACTIVE
    ): Organization {
        return Organization(
            id = id,
            name = LocalizedText(en = nameEn, ar = nameAr),
            organizationType = OrganizationType.LLC,
            status = status,
            email = "org@test.com",
            phone = "+966500000000"
        )
    }

    /**
     * Creates a test Club with default values.
     */
    fun createTestClub(
        organizationId: UUID,
        id: UUID = UUID.randomUUID(),
        name: LocalizedText = LocalizedText(en = "Test Club", ar = "نادي اختبار"),
        status: ClubStatus = ClubStatus.ACTIVE
    ): Club {
        return Club(
            id = id,
            organizationId = organizationId,
            name = name,
            status = status
        )
    }

    /**
     * Creates a test Location with default values.
     */
    fun createTestLocation(
        clubId: UUID,
        id: UUID = UUID.randomUUID(),
        nameEn: String = "Test Location",
        nameAr: String? = "موقع اختبار",
        status: LocationStatus = LocationStatus.ACTIVE
    ): Location {
        return Location(
            id = id,
            clubId = clubId,
            name = LocalizedText(en = nameEn, ar = nameAr),
            status = status
        )
    }

    /**
     * Creates a test Member with default values.
     * Note: tenantId must be set manually after creation or via TenantContext.
     */
    fun createTestMember(
        tenantId: UUID,
        id: UUID = UUID.randomUUID(),
        firstName: LocalizedText = LocalizedText(en = "John", ar = "جون"),
        lastName: LocalizedText = LocalizedText(en = "Doe", ar = "دو"),
        email: String = "john.doe.${UUID.randomUUID()}@example.com",
        phone: String? = "+966500000001",
        status: MemberStatus = MemberStatus.ACTIVE
    ): Member {
        val member = Member(
            id = id,
            firstName = firstName,
            lastName = lastName,
            email = email,
            phone = phone,
            status = status
        )
        // Set tenantId directly using reflection or by setting context
        setTenantId(member, tenantId)
        return member
    }

    /**
     * Creates a test MembershipPlan with default values.
     */
    fun createTestMembershipPlan(
        tenantId: UUID,
        id: UUID = UUID.randomUUID(),
        name: LocalizedText = LocalizedText(en = "Monthly Plan", ar = "خطة شهرية"),
        membershipFeeAmount: BigDecimal = BigDecimal("299.00"),
        currency: String = "SAR",
        taxRate: BigDecimal = BigDecimal("15.00"),
        billingPeriod: BillingPeriod = BillingPeriod.MONTHLY,
        maxClassesPerPeriod: Int? = null,
        freezeDaysAllowed: Int = 7
    ): MembershipPlan {
        val plan = MembershipPlan(
            id = id,
            name = name,
            membershipFee = TaxableFee(amount = membershipFeeAmount, currency = currency, taxRate = taxRate),
            billingPeriod = billingPeriod,
            maxClassesPerPeriod = maxClassesPerPeriod,
            freezeDaysAllowed = freezeDaysAllowed,
            isActive = true
        )
        setTenantId(plan, tenantId)
        return plan
    }

    /**
     * Creates a test Subscription with default values.
     */
    fun createTestSubscription(
        tenantId: UUID,
        memberId: UUID,
        planId: UUID,
        id: UUID = UUID.randomUUID(),
        status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
        startDate: LocalDate = LocalDate.now(),
        endDate: LocalDate = LocalDate.now().plusDays(30),
        classesRemaining: Int? = null,
        freezeDaysRemaining: Int = 7
    ): Subscription {
        val subscription = Subscription(
            id = id,
            memberId = memberId,
            planId = planId,
            status = status,
            startDate = startDate,
            endDate = endDate,
            classesRemaining = classesRemaining,
            freezeDaysRemaining = freezeDaysRemaining,
            autoRenew = false
        )
        setTenantId(subscription, tenantId)
        return subscription
    }

    /**
     * Creates an expired subscription for testing.
     */
    fun createExpiredSubscription(
        tenantId: UUID,
        memberId: UUID,
        planId: UUID
    ): Subscription {
        return createTestSubscription(
            tenantId = tenantId,
            memberId = memberId,
            planId = planId,
            status = SubscriptionStatus.EXPIRED,
            startDate = LocalDate.now().minusDays(60),
            endDate = LocalDate.now().minusDays(30)
        )
    }

    /**
     * Creates a frozen subscription for testing.
     */
    fun createFrozenSubscription(
        tenantId: UUID,
        memberId: UUID,
        planId: UUID
    ): Subscription {
        val subscription = createTestSubscription(
            tenantId = tenantId,
            memberId = memberId,
            planId = planId,
            status = SubscriptionStatus.FROZEN,
            freezeDaysRemaining = 5
        )
        // Set frozenAt date
        subscription.javaClass.getDeclaredField("frozenAt").apply {
            isAccessible = true
            set(subscription, LocalDate.now().minusDays(2))
        }
        return subscription
    }

    /**
     * Helper to set tenantId on a BaseEntity using reflection.
     * This is needed because tenantId is protected and normally set via TenantContext.
     */
    private fun setTenantId(entity: Any, tenantId: UUID) {
        try {
            val field = entity.javaClass.superclass.getDeclaredField("tenantId")
            field.isAccessible = true
            field.set(entity, tenantId)
        } catch (e: Exception) {
            // For entities without tenantId (Organization level), ignore
        }
    }
}
