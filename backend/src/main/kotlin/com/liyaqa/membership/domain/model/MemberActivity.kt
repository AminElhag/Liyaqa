package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.annotations.ParamDef
import org.hibernate.type.SqlTypes
import java.util.UUID

@Entity
@Table(name = "member_activities")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MemberActivity(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false)
    val activityType: ActivityType,

    @Column(name = "title", nullable = false)
    val title: String,

    @Column(name = "description", columnDefinition = "TEXT")
    val description: String? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    val metadata: Map<String, Any>? = null,

    @Column(name = "performed_by_user_id")
    val performedByUserId: UUID? = null,

    @Column(name = "performed_by_name")
    val performedByName: String? = null,

    @Column(name = "ip_address")
    val ipAddress: String? = null,

    @Column(name = "user_agent", columnDefinition = "TEXT")
    val userAgent: String? = null

) : BaseEntity(id) {

    companion object {
        /**
         * Creates a status change activity.
         */
        fun statusChanged(
            memberId: UUID,
            oldStatus: MemberStatus,
            newStatus: MemberStatus,
            reason: String? = null,
            performedByUserId: UUID? = null,
            performedByName: String? = null
        ): MemberActivity = MemberActivity(
            memberId = memberId,
            activityType = ActivityType.STATUS_CHANGED,
            title = "Status changed from $oldStatus to $newStatus",
            description = reason,
            metadata = mapOf(
                "oldStatus" to oldStatus.name,
                "newStatus" to newStatus.name
            ),
            performedByUserId = performedByUserId,
            performedByName = performedByName
        )

        /**
         * Creates a subscription created activity.
         */
        fun subscriptionCreated(
            memberId: UUID,
            planName: String,
            startDate: String,
            endDate: String,
            performedByUserId: UUID? = null,
            performedByName: String? = null
        ): MemberActivity = MemberActivity(
            memberId = memberId,
            activityType = ActivityType.SUBSCRIPTION_CREATED,
            title = "Subscription created: $planName",
            description = "Valid from $startDate to $endDate",
            metadata = mapOf(
                "planName" to planName,
                "startDate" to startDate,
                "endDate" to endDate
            ),
            performedByUserId = performedByUserId,
            performedByName = performedByName
        )

        /**
         * Creates a payment received activity.
         */
        fun paymentReceived(
            memberId: UUID,
            amount: String,
            paymentMethod: String,
            reference: String? = null,
            performedByUserId: UUID? = null,
            performedByName: String? = null
        ): MemberActivity = MemberActivity(
            memberId = memberId,
            activityType = ActivityType.PAYMENT_RECEIVED,
            title = "Payment received: $amount",
            description = "Via $paymentMethod${reference?.let { " (Ref: $it)" } ?: ""}",
            metadata = mapOf(
                "amount" to amount,
                "paymentMethod" to paymentMethod,
                "reference" to (reference ?: "")
            ),
            performedByUserId = performedByUserId,
            performedByName = performedByName
        )

        /**
         * Creates a check-in activity.
         */
        fun checkIn(
            memberId: UUID,
            method: String,
            location: String? = null
        ): MemberActivity = MemberActivity(
            memberId = memberId,
            activityType = ActivityType.CHECK_IN,
            title = "Checked in via $method",
            description = location?.let { "At $it" },
            metadata = mapOf(
                "method" to method,
                "location" to (location ?: "")
            )
        )

        /**
         * Creates a note added activity.
         */
        fun noteAdded(
            memberId: UUID,
            notePreview: String,
            performedByUserId: UUID,
            performedByName: String
        ): MemberActivity = MemberActivity(
            memberId = memberId,
            activityType = ActivityType.NOTE_ADDED,
            title = "Note added",
            description = notePreview.take(200),
            performedByUserId = performedByUserId,
            performedByName = performedByName
        )

        /**
         * Creates a profile updated activity.
         */
        fun profileUpdated(
            memberId: UUID,
            fieldsChanged: List<String>,
            performedByUserId: UUID? = null,
            performedByName: String? = null
        ): MemberActivity = MemberActivity(
            memberId = memberId,
            activityType = ActivityType.PROFILE_UPDATED,
            title = "Profile updated",
            description = "Fields changed: ${fieldsChanged.joinToString(", ")}",
            metadata = mapOf("fieldsChanged" to fieldsChanged),
            performedByUserId = performedByUserId,
            performedByName = performedByName
        )

        /**
         * Creates a communication sent activity.
         */
        fun communicationSent(
            memberId: UUID,
            channel: String,
            subject: String,
            performedByUserId: UUID? = null,
            performedByName: String? = null
        ): MemberActivity = MemberActivity(
            memberId = memberId,
            activityType = when (channel.uppercase()) {
                "EMAIL" -> ActivityType.EMAIL_SENT
                "SMS" -> ActivityType.SMS_SENT
                "WHATSAPP" -> ActivityType.WHATSAPP_SENT
                else -> ActivityType.EMAIL_SENT
            },
            title = "$channel sent: $subject",
            description = null,
            metadata = mapOf("channel" to channel, "subject" to subject),
            performedByUserId = performedByUserId,
            performedByName = performedByName
        )
    }
}

enum class ActivityType {
    // Status changes
    STATUS_CHANGED,

    // Subscription lifecycle
    SUBSCRIPTION_CREATED,
    SUBSCRIPTION_RENEWED,
    SUBSCRIPTION_FROZEN,
    SUBSCRIPTION_UNFROZEN,
    SUBSCRIPTION_CANCELLED,
    SUBSCRIPTION_EXPIRED,
    SUBSCRIPTION_UPGRADED,
    SUBSCRIPTION_DOWNGRADED,

    // Profile changes
    PROFILE_UPDATED,
    PHOTO_UPDATED,
    HEALTH_INFO_UPDATED,
    PREFERENCES_UPDATED,

    // Financial
    PAYMENT_RECEIVED,
    PAYMENT_FAILED,
    REFUND_ISSUED,
    WALLET_CREDITED,
    WALLET_DEBITED,
    INVOICE_CREATED,

    // Access
    CHECK_IN,
    CHECK_OUT,

    // Communication
    EMAIL_SENT,
    SMS_SENT,
    WHATSAPP_SENT,
    CALL_LOGGED,

    // Staff actions
    NOTE_ADDED,
    TASK_CREATED,
    TASK_COMPLETED,
    DOCUMENT_UPLOADED,

    // Contract
    CONTRACT_SIGNED,
    CONTRACT_TERMINATED,

    // Onboarding
    ONBOARDING_STEP_COMPLETED,
    ONBOARDING_COMPLETED,

    // Referral
    REFERRAL_MADE,
    REFERRAL_REWARD_EARNED,

    // System
    SYSTEM_ACTION,
    MEMBER_CREATED,
    AGREEMENT_SIGNED
}
