package com.liyaqa.marketing.domain.model

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Column
import jakarta.persistence.Convert
import jakarta.persistence.Converter
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.LocalDate
import java.util.UUID

/**
 * Converter for storing trigger config as JSON.
 */
@Converter
class TriggerConfigConverter : AttributeConverter<TriggerConfig?, String?> {
    private val objectMapper = ObjectMapper()

    override fun convertToDatabaseColumn(attribute: TriggerConfig?): String? {
        return attribute?.let { objectMapper.writeValueAsString(it) }
    }

    override fun convertToEntityAttribute(dbData: String?): TriggerConfig? {
        return dbData?.let {
            objectMapper.readValue(it, object : TypeReference<TriggerConfig>() {})
        }
    }
}

/**
 * Configuration for campaign triggers.
 */
data class TriggerConfig(
    val days: Int? = null,              // Days for time-based triggers (before/after expiry, inactive days)
    val time: String? = null,           // Preferred send time (HH:mm format)
    val excludeWeekends: Boolean? = null, // Skip weekends for sending
    val planIds: List<UUID>? = null     // Specific plans to target
)

/**
 * Marketing campaign definition.
 */
@Entity
@Table(name = "marketing_campaigns")
class Campaign(
    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "description", columnDefinition = "text")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "campaign_type", nullable = false)
    var campaignType: CampaignType,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: CampaignStatus = CampaignStatus.DRAFT,

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false)
    var triggerType: TriggerType,

    @Convert(converter = TriggerConfigConverter::class)
    @Column(name = "trigger_config", columnDefinition = "jsonb")
    var triggerConfig: TriggerConfig? = null,

    @Column(name = "segment_id")
    var segmentId: UUID? = null,

    @Column(name = "start_date")
    var startDate: LocalDate? = null,

    @Column(name = "end_date")
    var endDate: LocalDate? = null,

    @Column(name = "total_enrolled", nullable = false)
    var totalEnrolled: Int = 0,

    @Column(name = "total_completed", nullable = false)
    var totalCompleted: Int = 0,

    @Column(name = "is_template", nullable = false)
    var isTemplate: Boolean = false,

    id: UUID = UUID.randomUUID()
) : BaseEntity(id) {

    /**
     * Update campaign details.
     */
    fun update(
        name: String? = null,
        description: String? = null,
        triggerConfig: TriggerConfig? = null,
        segmentId: UUID? = null,
        startDate: LocalDate? = null,
        endDate: LocalDate? = null
    ) {
        name?.let { this.name = it }
        description?.let { this.description = it }
        triggerConfig?.let { this.triggerConfig = it }
        segmentId?.let { this.segmentId = it }
        startDate?.let { this.startDate = it }
        endDate?.let { this.endDate = it }
    }

    /**
     * Activate the campaign.
     */
    fun activate() {
        require(status == CampaignStatus.DRAFT || status == CampaignStatus.PAUSED) {
            "Campaign can only be activated from DRAFT or PAUSED status"
        }
        this.status = CampaignStatus.ACTIVE
    }

    /**
     * Pause the campaign.
     */
    fun pause() {
        require(status == CampaignStatus.ACTIVE) {
            "Campaign can only be paused from ACTIVE status"
        }
        this.status = CampaignStatus.PAUSED
    }

    /**
     * Complete the campaign.
     */
    fun complete() {
        this.status = CampaignStatus.COMPLETED
    }

    /**
     * Archive the campaign.
     */
    fun archive() {
        this.status = CampaignStatus.ARCHIVED
    }

    /**
     * Increment enrolled count.
     */
    fun incrementEnrolled() {
        this.totalEnrolled++
    }

    /**
     * Increment completed count.
     */
    fun incrementCompleted() {
        this.totalCompleted++
    }

    /**
     * Check if campaign is currently active and within date range.
     */
    fun isRunning(): Boolean {
        if (status != CampaignStatus.ACTIVE) return false
        val today = LocalDate.now()
        if (startDate != null && today.isBefore(startDate)) return false
        if (endDate != null && today.isAfter(endDate)) return false
        return true
    }

    /**
     * Check if the campaign can accept new enrollments.
     */
    fun canEnroll(): Boolean = isRunning()

    /**
     * Get trigger days from config.
     */
    fun getTriggerDays(): Int = triggerConfig?.days ?: 0

    companion object {
        fun create(
            name: String,
            description: String? = null,
            campaignType: CampaignType,
            triggerType: TriggerType,
            triggerConfig: TriggerConfig? = null,
            segmentId: UUID? = null,
            startDate: LocalDate? = null,
            endDate: LocalDate? = null
        ): Campaign {
            return Campaign(
                name = name,
                description = description,
                campaignType = campaignType,
                triggerType = triggerType,
                triggerConfig = triggerConfig,
                segmentId = segmentId,
                startDate = startDate,
                endDate = endDate
            )
        }

        fun createWelcomeSequence(name: String, description: String? = null): Campaign {
            return Campaign(
                name = name,
                description = description,
                campaignType = CampaignType.WELCOME_SEQUENCE,
                triggerType = TriggerType.MEMBER_CREATED
            )
        }

        fun createExpiryReminder(name: String, daysBeforeExpiry: Int): Campaign {
            return Campaign(
                name = name,
                campaignType = CampaignType.EXPIRY_REMINDER,
                triggerType = TriggerType.DAYS_BEFORE_EXPIRY,
                triggerConfig = TriggerConfig(days = daysBeforeExpiry)
            )
        }

        fun createWinBack(name: String, daysAfterExpiry: Int): Campaign {
            return Campaign(
                name = name,
                campaignType = CampaignType.WIN_BACK,
                triggerType = TriggerType.DAYS_AFTER_EXPIRY,
                triggerConfig = TriggerConfig(days = daysAfterExpiry)
            )
        }

        fun createBirthday(name: String): Campaign {
            return Campaign(
                name = name,
                campaignType = CampaignType.BIRTHDAY,
                triggerType = TriggerType.BIRTHDAY
            )
        }

        fun createInactivityAlert(name: String, daysInactive: Int): Campaign {
            return Campaign(
                name = name,
                campaignType = CampaignType.INACTIVITY_ALERT,
                triggerType = TriggerType.DAYS_INACTIVE,
                triggerConfig = TriggerConfig(days = daysInactive)
            )
        }
    }
}
