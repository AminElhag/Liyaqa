package com.liyaqa.platform.application.services

import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.organization.domain.ports.LocationRepository
import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.platform.api.dto.ClientMemberDetailResponse
import com.liyaqa.platform.api.dto.ClientMemberInvoiceResponse
import com.liyaqa.platform.api.dto.ClientMemberSubscriptionResponse
import com.liyaqa.platform.api.dto.ClientMemberSummaryResponse
import com.liyaqa.platform.api.dto.ClientSupportOverviewResponse
import com.liyaqa.platform.api.dto.ClientUserResponse
import com.liyaqa.platform.domain.PlatformContext
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Service for platform support operations.
 * Allows viewing client data across organizations without tenant restrictions.
 */
@Service
@Transactional(readOnly = true)
class PlatformSupportService(
    private val organizationRepository: OrganizationRepository,
    private val clubRepository: ClubRepository,
    private val locationRepository: LocationRepository,
    private val memberRepository: MemberRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val invoiceRepository: InvoiceRepository,
    private val userRepository: UserRepository
) {
    /**
     * Gets a support overview for a client organization.
     */
    fun getClientOverview(organizationId: UUID): ClientSupportOverviewResponse {
        val organization = organizationRepository.findById(organizationId)
            .orElseThrow { NoSuchElementException("Organization not found: $organizationId") }

        // Get clubs for this organization
        val clubsPage = clubRepository.findByOrganizationId(organizationId, Pageable.unpaged())
        val clubs = clubsPage.content

        // Count locations at organization level
        val totalLocations = locationRepository.countByOrganizationId(organizationId).toInt()

        // For member/subscription/invoice counts, we need to query each tenant (club)
        var totalMembers = 0L
        var activeMembers = 0L
        var totalUsers = 0L
        var activeSubscriptions = 0L
        var outstandingInvoices = 0L
        var revenueThisMonth = BigDecimal.ZERO

        val today = LocalDate.now()
        val monthStart = today.withDayOfMonth(1)
        val monthEnd = today.withDayOfMonth(today.lengthOfMonth())

        for (club in clubs) {
            // Enable platform mode to bypass tenant filter
            PlatformContext.setPlatformMode(true)
            TenantContext.setCurrentTenant(TenantId(club.id))
            try {
                totalMembers += memberRepository.count()
                activeMembers += memberRepository.search(
                    search = null,
                    status = MemberStatus.ACTIVE,
                    joinedAfter = null,
                    joinedBefore = null,
                    pageable = Pageable.unpaged()
                ).totalElements

                totalUsers += userRepository.count()

                val activeSubsPage = subscriptionRepository.findByStatus(
                    SubscriptionStatus.ACTIVE,
                    Pageable.unpaged()
                )
                activeSubscriptions += activeSubsPage.totalElements

                // Count unpaid invoices
                val unpaidStatuses = listOf(InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE)
                for (status in unpaidStatuses) {
                    outstandingInvoices += invoiceRepository.countByStatus(status)
                }

                // Sum paid invoices this month using search
                val paidInvoices = invoiceRepository.search(
                    search = null,
                    status = InvoiceStatus.PAID,
                    memberId = null,
                    dateFrom = monthStart,
                    dateTo = monthEnd,
                    pageable = Pageable.unpaged()
                )
                for (invoice in paidInvoices.content) {
                    revenueThisMonth = revenueThisMonth.add(invoice.paidAmount?.amount ?: BigDecimal.ZERO)
                }
            } finally {
                TenantContext.clear()
                PlatformContext.setPlatformMode(false)
            }
        }

        return ClientSupportOverviewResponse(
            organizationId = organization.id,
            organizationNameEn = organization.name.en,
            organizationNameAr = organization.name.ar,
            totalClubs = clubs.size,
            totalLocations = totalLocations,
            totalMembers = totalMembers,
            activeMembers = activeMembers,
            totalUsers = totalUsers,
            activeSubscriptions = activeSubscriptions,
            outstandingInvoices = outstandingInvoices,
            totalRevenueThisMonth = revenueThisMonth
        )
    }

    /**
     * Gets members for a specific club (tenant).
     */
    fun getClientMembers(
        clubId: UUID,
        search: String?,
        status: MemberStatus?,
        pageable: Pageable
    ): Page<ClientMemberSummaryResponse> {
        PlatformContext.setPlatformMode(true)
        TenantContext.setCurrentTenant(TenantId(clubId))
        try {
            val membersPage = memberRepository.search(
                search = search,
                status = status,
                joinedAfter = null,
                joinedBefore = null,
                pageable = pageable
            )

            val responses = membersPage.content.map { member ->
                val hasActive = subscriptionRepository.findActiveByMemberId(member.id).isPresent
                ClientMemberSummaryResponse.from(member, hasActive)
            }

            return PageImpl(responses, pageable, membersPage.totalElements)
        } finally {
            TenantContext.clear()
            PlatformContext.setPlatformMode(false)
        }
    }

    /**
     * Gets detailed member info.
     */
    fun getMemberDetail(clubId: UUID, memberId: UUID): ClientMemberDetailResponse {
        PlatformContext.setPlatformMode(true)
        TenantContext.setCurrentTenant(TenantId(clubId))
        try {
            val member = memberRepository.findById(memberId)
                .orElseThrow { NoSuchElementException("Member not found: $memberId") }
            return ClientMemberDetailResponse.from(member)
        } finally {
            TenantContext.clear()
            PlatformContext.setPlatformMode(false)
        }
    }

    /**
     * Gets subscriptions for a specific club (tenant).
     */
    fun getClientSubscriptions(
        clubId: UUID,
        status: SubscriptionStatus?,
        pageable: Pageable
    ): Page<ClientMemberSubscriptionResponse> {
        PlatformContext.setPlatformMode(true)
        TenantContext.setCurrentTenant(TenantId(clubId))
        try {
            val subsPage = if (status != null) {
                subscriptionRepository.findByStatus(status, pageable)
            } else {
                subscriptionRepository.findAll(pageable)
            }

            val responses = subsPage.content.map { subscription ->
                val member = memberRepository.findById(subscription.memberId).orElse(null)
                val memberName = member?.let { "${it.firstName} ${it.lastName}" } ?: "Unknown"
                // Subscription.planId references the membership plan
                val planName = "Plan ${subscription.planId}"
                ClientMemberSubscriptionResponse.from(subscription, planName, memberName)
            }

            return PageImpl(responses, pageable, subsPage.totalElements)
        } finally {
            TenantContext.clear()
            PlatformContext.setPlatformMode(false)
        }
    }

    /**
     * Gets invoices for a specific club (tenant).
     */
    fun getClientInvoices(
        clubId: UUID,
        status: InvoiceStatus?,
        pageable: Pageable
    ): Page<ClientMemberInvoiceResponse> {
        PlatformContext.setPlatformMode(true)
        TenantContext.setCurrentTenant(TenantId(clubId))
        try {
            val invoicesPage = if (status != null) {
                invoiceRepository.findByStatus(status, pageable)
            } else {
                invoiceRepository.findAll(pageable)
            }

            val responses = invoicesPage.content.map { invoice ->
                val member = memberRepository.findById(invoice.memberId).orElse(null)
                val memberName = member?.let { "${it.firstName} ${it.lastName}" } ?: "Unknown"
                ClientMemberInvoiceResponse.from(invoice, memberName)
            }

            return PageImpl(responses, pageable, invoicesPage.totalElements)
        } finally {
            TenantContext.clear()
            PlatformContext.setPlatformMode(false)
        }
    }

    /**
     * Gets users for a specific club (tenant).
     */
    fun getClientUsers(
        clubId: UUID,
        pageable: Pageable
    ): Page<ClientUserResponse> {
        PlatformContext.setPlatformMode(true)
        TenantContext.setCurrentTenant(TenantId(clubId))
        try {
            // The tenant filter will scope to this tenant
            val usersPage = userRepository.findAll(pageable)
            val responses = usersPage.content.map { ClientUserResponse.from(it) }
            return PageImpl(responses, pageable, usersPage.totalElements)
        } finally {
            TenantContext.clear()
            PlatformContext.setPlatformMode(false)
        }
    }

    /**
     * Gets a specific user by ID (cross-tenant).
     */
    fun getUser(userId: UUID): ClientUserResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }
        return ClientUserResponse.from(user)
    }
}
