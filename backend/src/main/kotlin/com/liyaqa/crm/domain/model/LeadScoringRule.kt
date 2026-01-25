package com.liyaqa.crm.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.util.UUID

/**
 * Lead scoring rule entity that defines how leads are scored based on triggers.
 *
 * Trigger types:
 * - SOURCE: Score based on lead source (e.g., +10 for REFERRAL)
 * - ACTIVITY: Score based on activity type (e.g., +5 for CALL, +3 for EMAIL)
 * - ENGAGEMENT: Score based on engagement level
 * - ATTRIBUTE: Score based on lead attributes
 */
@Entity
@Table(name = "lead_scoring_rules")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class LeadScoringRule(
    id: UUID = UUID.randomUUID(),

    @Column(name = "name", nullable = false)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false)
    val triggerType: LeadScoringTriggerType,

    @Column(name = "trigger_value")
    var triggerValue: String? = null,

    @Column(name = "score_change", nullable = false)
    var scoreChange: Int,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true

) : BaseEntity(id) {

    /**
     * Activate the rule.
     */
    fun activate() {
        isActive = true
    }

    /**
     * Deactivate the rule.
     */
    fun deactivate() {
        isActive = false
    }

    /**
     * Check if this rule matches a given source.
     */
    fun matchesSource(source: LeadSource): Boolean {
        return triggerType == LeadScoringTriggerType.SOURCE &&
               isActive &&
               (triggerValue == null || triggerValue == source.name)
    }

    /**
     * Check if this rule matches a given activity type.
     */
    fun matchesActivity(activityType: LeadActivityType): Boolean {
        return triggerType == LeadScoringTriggerType.ACTIVITY &&
               isActive &&
               (triggerValue == null || triggerValue == activityType.name)
    }

    /**
     * Check if this rule matches an engagement trigger.
     */
    fun matchesEngagement(engagement: String): Boolean {
        return triggerType == LeadScoringTriggerType.ENGAGEMENT &&
               isActive &&
               (triggerValue == null || triggerValue == engagement)
    }

    /**
     * Check if this rule matches an attribute trigger.
     */
    fun matchesAttribute(attribute: String): Boolean {
        return triggerType == LeadScoringTriggerType.ATTRIBUTE &&
               isActive &&
               (triggerValue == null || triggerValue == attribute)
    }
}
