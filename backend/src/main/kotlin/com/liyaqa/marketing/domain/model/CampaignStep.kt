package com.liyaqa.marketing.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.util.UUID

/**
 * A step in a marketing campaign sequence.
 * Supports A/B testing with variants.
 */
@Entity
@Table(name = "marketing_campaign_steps")
class CampaignStep(
    @Column(name = "campaign_id", nullable = false)
    val campaignId: UUID,

    @Column(name = "step_number", nullable = false)
    var stepNumber: Int,

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "delay_days", nullable = false)
    var delayDays: Int = 0,

    @Column(name = "delay_hours", nullable = false)
    var delayHours: Int = 0,

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false)
    var channel: MarketingChannel,

    @Column(name = "subject_en", length = 500)
    var subjectEn: String? = null,

    @Column(name = "subject_ar", length = 500)
    var subjectAr: String? = null,

    @Column(name = "body_en", columnDefinition = "text", nullable = false)
    var bodyEn: String,

    @Column(name = "body_ar", columnDefinition = "text", nullable = false)
    var bodyAr: String,

    @Column(name = "is_ab_test", nullable = false)
    var isAbTest: Boolean = false,

    @Column(name = "ab_variant")
    var abVariant: Char? = null,

    @Column(name = "ab_split_percentage")
    var abSplitPercentage: Int? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    id: UUID = UUID.randomUUID()
) : BaseEntity(id) {

    /**
     * Get total delay in hours.
     */
    fun getTotalDelayHours(): Int = (delayDays * 24) + delayHours

    /**
     * Update step details.
     */
    fun update(
        name: String? = null,
        delayDays: Int? = null,
        delayHours: Int? = null,
        channel: MarketingChannel? = null,
        subjectEn: String? = null,
        subjectAr: String? = null,
        bodyEn: String? = null,
        bodyAr: String? = null
    ) {
        name?.let { this.name = it }
        delayDays?.let { this.delayDays = it }
        delayHours?.let { this.delayHours = it }
        channel?.let { this.channel = it }
        subjectEn?.let { this.subjectEn = it }
        subjectAr?.let { this.subjectAr = it }
        bodyEn?.let { this.bodyEn = it }
        bodyAr?.let { this.bodyAr = it }
    }

    /**
     * Configure A/B test.
     */
    fun configureAbTest(variant: Char, splitPercentage: Int) {
        require(variant in listOf('A', 'B')) { "Variant must be 'A' or 'B'" }
        require(splitPercentage in 1..99) { "Split percentage must be between 1 and 99" }
        this.isAbTest = true
        this.abVariant = variant
        this.abSplitPercentage = splitPercentage
    }

    /**
     * Disable A/B test.
     */
    fun disableAbTest() {
        this.isAbTest = false
        this.abVariant = null
        this.abSplitPercentage = null
    }

    /**
     * Activate the step.
     */
    fun activate() {
        this.isActive = true
    }

    /**
     * Deactivate the step.
     */
    fun deactivate() {
        this.isActive = false
    }

    /**
     * Check if this step requires a subject (email channel).
     */
    fun requiresSubject(): Boolean = channel == MarketingChannel.EMAIL

    /**
     * Get subject for a locale.
     */
    fun getSubject(locale: String): String? {
        return if (locale.startsWith("ar")) subjectAr else subjectEn
    }

    /**
     * Get body for a locale.
     */
    fun getBody(locale: String): String {
        return if (locale.startsWith("ar")) bodyAr else bodyEn
    }

    companion object {
        fun create(
            campaignId: UUID,
            stepNumber: Int,
            name: String,
            channel: MarketingChannel,
            bodyEn: String,
            bodyAr: String,
            subjectEn: String? = null,
            subjectAr: String? = null,
            delayDays: Int = 0,
            delayHours: Int = 0
        ): CampaignStep {
            return CampaignStep(
                campaignId = campaignId,
                stepNumber = stepNumber,
                name = name,
                channel = channel,
                bodyEn = bodyEn,
                bodyAr = bodyAr,
                subjectEn = subjectEn,
                subjectAr = subjectAr,
                delayDays = delayDays,
                delayHours = delayHours
            )
        }

        fun createEmailStep(
            campaignId: UUID,
            stepNumber: Int,
            name: String,
            subjectEn: String,
            subjectAr: String,
            bodyEn: String,
            bodyAr: String,
            delayDays: Int = 0
        ): CampaignStep {
            return CampaignStep(
                campaignId = campaignId,
                stepNumber = stepNumber,
                name = name,
                channel = MarketingChannel.EMAIL,
                subjectEn = subjectEn,
                subjectAr = subjectAr,
                bodyEn = bodyEn,
                bodyAr = bodyAr,
                delayDays = delayDays
            )
        }

        fun createSmsStep(
            campaignId: UUID,
            stepNumber: Int,
            name: String,
            bodyEn: String,
            bodyAr: String,
            delayDays: Int = 0
        ): CampaignStep {
            return CampaignStep(
                campaignId = campaignId,
                stepNumber = stepNumber,
                name = name,
                channel = MarketingChannel.SMS,
                bodyEn = bodyEn,
                bodyAr = bodyAr,
                delayDays = delayDays
            )
        }
    }
}
