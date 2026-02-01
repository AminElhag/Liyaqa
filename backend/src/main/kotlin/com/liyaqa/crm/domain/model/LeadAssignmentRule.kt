package com.liyaqa.crm.domain.model

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
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

/**
 * Lead assignment rule entity that defines how leads are automatically assigned.
 *
 * Rule types:
 * - ROUND_ROBIN: Distribute leads evenly among configured users
 * - LOCATION_BASED: Assign based on lead's location matching user territories
 * - SOURCE_BASED: Assign based on lead source to specific users
 * - MANUAL: No auto-assignment, manual only
 */
@Entity
@Table(name = "lead_assignment_rules")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class LeadAssignmentRule(
    id: UUID = UUID.randomUUID(),

    @Column(name = "name", nullable = false)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false)
    val ruleType: LeadAssignmentRuleType,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "priority", nullable = false)
    var priority: Int = 0,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "config", nullable = false)
    var config: String = "{}"

) : BaseEntity(id) {

    companion object {
        private val objectMapper: ObjectMapper = jacksonObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
    }

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
     * Parse round-robin configuration.
     */
    fun getRoundRobinConfig(): RoundRobinConfig {
        return try {
            objectMapper.readValue(config)
        } catch (e: Exception) {
            RoundRobinConfig()
        }
    }

    /**
     * Update round-robin configuration.
     */
    fun setRoundRobinConfig(roundRobinConfig: RoundRobinConfig) {
        config = objectMapper.writeValueAsString(roundRobinConfig)
    }

    /**
     * Parse location-based configuration.
     */
    fun getLocationConfig(): LocationBasedConfig {
        return try {
            objectMapper.readValue(config)
        } catch (e: Exception) {
            LocationBasedConfig()
        }
    }

    /**
     * Update location-based configuration.
     */
    fun setLocationConfig(locationConfig: LocationBasedConfig) {
        config = objectMapper.writeValueAsString(locationConfig)
    }

    /**
     * Parse source-based configuration.
     */
    fun getSourceConfig(): SourceBasedConfig {
        return try {
            objectMapper.readValue(config)
        } catch (e: Exception) {
            SourceBasedConfig()
        }
    }

    /**
     * Update source-based configuration.
     */
    fun setSourceConfig(sourceConfig: SourceBasedConfig) {
        config = objectMapper.writeValueAsString(sourceConfig)
    }
}

/**
 * Configuration for round-robin assignment.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
data class RoundRobinConfig(
    val userIds: List<UUID> = emptyList(),
    var lastAssignedIndex: Int = -1
) {
    /**
     * Get the next user in round-robin order.
     */
    fun getNextUserId(): UUID? {
        if (userIds.isEmpty()) return null
        val nextIndex = (lastAssignedIndex + 1) % userIds.size
        return userIds[nextIndex]
    }

    /**
     * Advance to the next user.
     */
    fun advance(): RoundRobinConfig {
        if (userIds.isEmpty()) return this
        return copy(lastAssignedIndex = (lastAssignedIndex + 1) % userIds.size)
    }
}

/**
 * Configuration for location-based assignment.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
data class LocationBasedConfig(
    val locationMappings: List<LocationMapping> = emptyList(),
    val defaultUserId: UUID? = null
)

/**
 * Mapping of location to user.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
data class LocationMapping(
    val location: String,
    val userId: UUID
)

/**
 * Configuration for source-based assignment.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
data class SourceBasedConfig(
    val sourceMappings: List<SourceMapping> = emptyList(),
    val defaultUserId: UUID? = null
)

/**
 * Mapping of source to user.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
data class SourceMapping(
    val source: LeadSource,
    val userId: UUID
)
