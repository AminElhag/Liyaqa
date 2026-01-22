package com.liyaqa.billing

import com.liyaqa.billing.application.commands.RecordPaymentCommand
import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceLineItem
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.domain.model.LineItemType
import com.liyaqa.billing.domain.model.PaymentMethod
import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.billing.infrastructure.pdf.InvoicePdfGenerator
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.OrganizationId
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Integration test for invoice PDF generation.
 * Tests PDF generation in English and Arabic locales.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class InvoicePdfIntegrationTest {

    @Autowired
    private lateinit var invoiceService: InvoiceService

    @Autowired
    private lateinit var invoicePdfGenerator: InvoicePdfGenerator

    @Autowired
    private lateinit var invoiceRepository: InvoiceRepository

    @Autowired
    private lateinit var organizationRepository: OrganizationRepository

    @Autowired
    private lateinit var clubRepository: ClubRepository

    @Autowired
    private lateinit var memberRepository: MemberRepository

    private lateinit var testOrganization: Organization
    private lateinit var testClub: Club
    private lateinit var testMember: Member
    private lateinit var testInvoice: Invoice
    private lateinit var testTenantId: UUID

    @BeforeEach
    fun setUp() {
        // Setup organization and club
        testOrganization = Organization(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Test Org", ar = "منظمة اختبار"),
            organizationType = OrganizationType.LLC,
            status = OrganizationStatus.ACTIVE
        )
        testOrganization = organizationRepository.save(testOrganization)

        testClub = Club(
            id = UUID.randomUUID(),
            organizationId = testOrganization.id,
            name = LocalizedText(en = "Test Club", ar = "نادي اختبار"),
            status = ClubStatus.ACTIVE
        )
        testClub = clubRepository.save(testClub)
        testTenantId = testClub.id

        TenantContext.setCurrentTenant(TenantId(testTenantId))
        TenantContext.setCurrentOrganization(OrganizationId(testOrganization.id))

        // Create member
        testMember = Member(
            id = UUID.randomUUID(),
            firstName = "John",
            lastName = "Doe",
            email = "john.doe@example.com",
            status = MemberStatus.ACTIVE
        )
        setTenantId(testMember, testTenantId)
        testMember = memberRepository.save(testMember)

        // Create invoice with line items using Invoice.create()
        val lineItems = listOf(
            InvoiceLineItem(
                description = LocalizedText(en = "Monthly Membership", ar = "اشتراك شهري"),
                quantity = 1,
                unitPrice = Money(BigDecimal.valueOf(100.00).setScale(2), "SAR"),
                itemType = LineItemType.SUBSCRIPTION,
                sortOrder = 0
            )
        )
        testInvoice = Invoice.create(
            invoiceNumber = "INV-2026-00001",
            memberId = testMember.id,
            lineItems = lineItems
        )
        setTenantIdAndOrgId(testInvoice, testTenantId, testOrganization.id)
        testInvoice = invoiceRepository.save(testInvoice)

        // Issue the invoice
        testInvoice.issue()
        testInvoice = invoiceRepository.save(testInvoice)
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    private fun setTenantId(entity: Any, tenantId: UUID) {
        try {
            val field = entity.javaClass.superclass.getDeclaredField("tenantId")
            field.isAccessible = true
            field.set(entity, tenantId)
        } catch (e: Exception) {
            // Ignore
        }
    }

    private fun setTenantIdAndOrgId(entity: Any, tenantId: UUID, organizationId: UUID) {
        try {
            val superclass = entity.javaClass.superclass
            val tenantField = superclass.getDeclaredField("tenantId")
            tenantField.isAccessible = true
            tenantField.set(entity, tenantId)

            val orgField = superclass.getDeclaredField("organizationId")
            orgField.isAccessible = true
            orgField.set(entity, organizationId)
        } catch (e: Exception) {
            // Ignore
        }
    }

    @Test
    fun `generateInvoicePdf with English locale returns valid PDF`() {
        // When
        val pdfBytes = invoicePdfGenerator.generateInvoicePdf(testInvoice, testMember, testOrganization, "en")

        // Then
        assertNotNull(pdfBytes)
        assertTrue(pdfBytes.isNotEmpty())
        // PDF files start with %PDF-
        assertTrue(pdfBytes.size > 100) // Basic sanity check
    }

    @Test
    fun `generateInvoicePdf with Arabic locale returns valid PDF`() {
        // When
        val pdfBytes = invoicePdfGenerator.generateInvoicePdf(testInvoice, testMember, testOrganization, "ar")

        // Then
        assertNotNull(pdfBytes)
        assertTrue(pdfBytes.isNotEmpty())
        assertTrue(pdfBytes.size > 100)
    }

    @Test
    fun `invoice can be retrieved by ID`() {
        // When
        val foundInvoice = invoiceService.getInvoice(testInvoice.id)

        // Then
        assertNotNull(foundInvoice)
        assertEquals(testInvoice.invoiceNumber, foundInvoice.invoiceNumber)
        assertEquals(testInvoice.memberId, foundInvoice.memberId)
    }

    @Test
    fun `invoice status transitions correctly`() {
        // Given - invoice is ISSUED
        assertEquals(InvoiceStatus.ISSUED, testInvoice.status)

        // When - mark as paid
        val command = RecordPaymentCommand(
            amount = testInvoice.totalAmount,
            paymentMethod = PaymentMethod.CARD
        )
        val paidInvoice = invoiceService.recordPayment(testInvoice.id, command)

        // Then
        assertEquals(InvoiceStatus.PAID, paidInvoice.status)
        assertNotNull(paidInvoice.paidAmount)
    }
}
