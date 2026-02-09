package com.liyaqa.platform.api.dto

import com.fasterxml.jackson.annotation.JsonProperty
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.Role
import com.liyaqa.shared.domain.Money
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ============================================
// Client Member DTOs
// ============================================

/**
 * Member summary for platform support view.
 */
data class ClientMemberSummaryResponse(
    val id: UUID,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phone: String?,
    val status: MemberStatus,
    val createdAt: Instant,
    val hasActiveSubscription: Boolean
) {
    companion object {
        fun from(member: Member, hasActiveSubscription: Boolean): ClientMemberSummaryResponse {
            return ClientMemberSummaryResponse(
                id = member.id,
                firstName = member.firstName.en,
                lastName = member.lastName.en,
                email = member.email,
                phone = member.phone,
                status = member.status,
                createdAt = member.createdAt,
                hasActiveSubscription = hasActiveSubscription
            )
        }
    }
}

/**
 * Detailed member view for platform support.
 */
data class ClientMemberDetailResponse(
    val id: UUID,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phone: String?,
    val dateOfBirth: LocalDate?,
    val status: MemberStatus,
    val notes: String?,
    val createdAt: Instant,
    val updatedAt: Instant?
) {
    companion object {
        fun from(member: Member): ClientMemberDetailResponse {
            return ClientMemberDetailResponse(
                id = member.id,
                firstName = member.firstName.en,
                lastName = member.lastName.en,
                email = member.email,
                phone = member.phone,
                dateOfBirth = member.dateOfBirth,
                status = member.status,
                notes = member.notes,
                createdAt = member.createdAt,
                updatedAt = member.updatedAt
            )
        }
    }
}

// ============================================
// Client Subscription DTOs
// ============================================

/**
 * Member subscription summary for platform support view.
 */
data class ClientMemberSubscriptionResponse(
    val id: UUID,
    val memberId: UUID,
    val memberName: String,
    val planName: String,
    val status: SubscriptionStatus,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val price: BigDecimal?,
    val currency: String?,
    @get:JsonProperty("isFrozen")
    val isFrozen: Boolean,
    val autoRenew: Boolean
) {
    companion object {
        fun from(subscription: Subscription, planName: String, memberName: String): ClientMemberSubscriptionResponse {
            return ClientMemberSubscriptionResponse(
                id = subscription.id,
                memberId = subscription.memberId,
                memberName = memberName,
                planName = planName,
                status = subscription.status,
                startDate = subscription.startDate,
                endDate = subscription.endDate,
                price = subscription.paidAmount?.amount,
                currency = subscription.paidAmount?.currency,
                isFrozen = subscription.status == SubscriptionStatus.FROZEN,
                autoRenew = subscription.autoRenew
            )
        }
    }
}

// ============================================
// Client Invoice DTOs
// ============================================

/**
 * Member invoice summary for platform support view.
 */
data class ClientMemberInvoiceResponse(
    val id: UUID,
    val invoiceNumber: String,
    val memberId: UUID,
    val memberName: String,
    val status: InvoiceStatus,
    val totalAmount: BigDecimal,
    val paidAmount: BigDecimal?,
    val currency: String,
    val issueDate: LocalDate?,
    val dueDate: LocalDate?,
    val createdAt: Instant
) {
    companion object {
        fun from(invoice: Invoice, memberName: String): ClientMemberInvoiceResponse {
            return ClientMemberInvoiceResponse(
                id = invoice.id,
                invoiceNumber = invoice.invoiceNumber,
                memberId = invoice.memberId,
                memberName = memberName,
                status = invoice.status,
                totalAmount = invoice.totalAmount.amount,
                paidAmount = invoice.paidAmount?.amount,
                currency = invoice.totalAmount.currency,
                issueDate = invoice.issueDate,
                dueDate = invoice.dueDate,
                createdAt = invoice.createdAt
            )
        }
    }
}

// ============================================
// Client User DTOs
// ============================================

/**
 * User summary for platform support view.
 */
data class ClientUserResponse(
    val id: UUID,
    val email: String,
    val displayNameEn: String,
    val displayNameAr: String?,
    val role: Role,
    val status: String,
    val memberId: UUID?,
    val lastLoginAt: Instant?,
    val createdAt: Instant
) {
    companion object {
        fun from(user: User): ClientUserResponse {
            return ClientUserResponse(
                id = user.id,
                email = user.email,
                displayNameEn = user.displayName.en,
                displayNameAr = user.displayName.ar,
                role = user.role,
                status = user.status.name,
                memberId = user.memberId,
                lastLoginAt = user.lastLoginAt,
                createdAt = user.createdAt
            )
        }
    }
}

// ============================================
// Support Overview DTOs
// ============================================

/**
 * Overview of a client for support purposes.
 */
data class ClientSupportOverviewResponse(
    val organizationId: UUID,
    val organizationNameEn: String,
    val organizationNameAr: String?,
    val totalClubs: Int,
    val totalLocations: Int,
    val totalMembers: Long,
    val activeMembers: Long,
    val totalUsers: Long,
    val activeSubscriptions: Long,
    val outstandingInvoices: Long,
    val totalRevenueThisMonth: BigDecimal
)
