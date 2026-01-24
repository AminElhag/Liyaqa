package com.liyaqa.shared

import com.liyaqa.membership.domain.model.BillingPeriod
import com.liyaqa.shared.domain.LocalizedText
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.util.UUID

class TestDataFactoryTest {

    @Test
    fun `createTestMembershipPlan should create plan with correct TaxableFee structure`() {
        // Given
        val tenantId = UUID.randomUUID()
        val planId = UUID.randomUUID()
        val planName = LocalizedText(en = "Premium Plan", ar = "خطة مميزة")
        val feeAmount = BigDecimal("499.00")
        val currency = "SAR"
        val taxRate = BigDecimal("15.00")

        // When
        val plan = TestDataFactory.createTestMembershipPlan(
            tenantId = tenantId,
            id = planId,
            name = planName,
            membershipFeeAmount = feeAmount,
            currency = currency,
            taxRate = taxRate,
            billingPeriod = BillingPeriod.MONTHLY,
            maxClassesPerPeriod = 30,
            freezeDaysAllowed = 14
        )

        // Then
        assertEquals(planId, plan.id)
        assertEquals(planName, plan.name)
        assertEquals(BillingPeriod.MONTHLY, plan.billingPeriod)
        assertEquals(30, plan.maxClassesPerPeriod)
        assertEquals(14, plan.freezeDaysAllowed)
        assertTrue(plan.isActive)

        // Verify TaxableFee structure
        assertNotNull(plan.membershipFee)
        assertEquals(feeAmount, plan.membershipFee.amount)
        assertEquals(currency, plan.membershipFee.currency)
        assertEquals(taxRate, plan.membershipFee.taxRate)
    }

    @Test
    fun `createTestMembershipPlan should use default values when not specified`() {
        // Given
        val tenantId = UUID.randomUUID()

        // When
        val plan = TestDataFactory.createTestMembershipPlan(tenantId = tenantId)

        // Then
        assertNotNull(plan.id)
        assertEquals("Monthly Plan", plan.name.en)
        assertEquals("خطة شهرية", plan.name.ar)
        assertEquals(BigDecimal("299.00"), plan.membershipFee.amount)
        assertEquals("SAR", plan.membershipFee.currency)
        assertEquals(BigDecimal("15.00"), plan.membershipFee.taxRate)
        assertEquals(BillingPeriod.MONTHLY, plan.billingPeriod)
        assertEquals(null, plan.maxClassesPerPeriod)
        assertEquals(7, plan.freezeDaysAllowed)
        assertTrue(plan.isActive)
    }

    @Test
    fun `createTestMembershipPlan should calculate fees correctly using TaxableFee`() {
        // Given
        val tenantId = UUID.randomUUID()
        val netAmount = BigDecimal("100.00")
        val taxRate = BigDecimal("15.00")

        // When
        val plan = TestDataFactory.createTestMembershipPlan(
            tenantId = tenantId,
            membershipFeeAmount = netAmount,
            taxRate = taxRate
        )

        // Then - verify TaxableFee calculations work correctly
        val fee = plan.membershipFee
        assertEquals(netAmount, fee.getNetAmount().amount)
        assertEquals(BigDecimal("15.00"), fee.getTaxAmount().amount)
        assertEquals(BigDecimal("115.00"), fee.getGrossAmount().amount)
    }

    @Test
    fun `createTestMember should create member with correct data`() {
        // Given
        val tenantId = UUID.randomUUID()
        val memberId = UUID.randomUUID()
        val firstName = LocalizedText(en = "Jane", ar = "جين")
        val lastName = LocalizedText(en = "Smith", ar = "سميث")
        val email = "jane.smith@example.com"

        // When
        val member = TestDataFactory.createTestMember(
            tenantId = tenantId,
            id = memberId,
            firstName = firstName,
            lastName = lastName,
            email = email
        )

        // Then
        assertEquals(memberId, member.id)
        assertEquals(firstName, member.firstName)
        assertEquals(lastName, member.lastName)
        assertEquals(email, member.email)
    }

    @Test
    fun `createTestSubscription should create subscription with correct data`() {
        // Given
        val tenantId = UUID.randomUUID()
        val memberId = UUID.randomUUID()
        val planId = UUID.randomUUID()
        val subscriptionId = UUID.randomUUID()

        // When
        val subscription = TestDataFactory.createTestSubscription(
            tenantId = tenantId,
            memberId = memberId,
            planId = planId,
            id = subscriptionId
        )

        // Then
        assertEquals(subscriptionId, subscription.id)
        assertEquals(memberId, subscription.memberId)
        assertEquals(planId, subscription.planId)
    }

    @Test
    fun `createTestOrganization should create organization with correct data`() {
        // Given
        val orgId = UUID.randomUUID()
        val nameEn = "Test Fitness Club"
        val nameAr = "نادي اللياقة البدنية"

        // When
        val organization = TestDataFactory.createTestOrganization(
            id = orgId,
            nameEn = nameEn,
            nameAr = nameAr
        )

        // Then
        assertEquals(orgId, organization.id)
        assertEquals(nameEn, organization.name.en)
        assertEquals(nameAr, organization.name.ar)
    }
}
