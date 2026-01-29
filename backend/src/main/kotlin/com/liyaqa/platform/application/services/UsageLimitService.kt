package com.liyaqa.platform.application.services

import com.liyaqa.platform.domain.model.ClientPlan
import com.liyaqa.platform.domain.model.ClientUsage
import com.liyaqa.platform.domain.model.UsageLevel
import com.liyaqa.platform.domain.model.UsageStatus
import com.liyaqa.platform.domain.ports.ClientUsageRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for tracking and enforcing usage limits.
 * Monitors resource usage against plan limits and triggers alerts.
 */
@Service
@Transactional
class UsageLimitService(
    private val usageRepository: ClientUsageRepository
) {
    /**
     * Gets or creates usage tracking for an organization.
     */
    fun getOrCreateUsage(organizationId: UUID, plan: ClientPlan): ClientUsage {
        return usageRepository.findByOrganizationId(organizationId).orElseGet {
            val usage = ClientUsage.createForOrganization(organizationId, plan)
            usageRepository.save(usage)
        }
    }

    /**
     * Gets usage for an organization.
     */
    @Transactional(readOnly = true)
    fun getUsage(organizationId: UUID): ClientUsage {
        return usageRepository.findByOrganizationId(organizationId)
            .orElseThrow { NoSuchElementException("Usage tracking not found for organization: $organizationId") }
    }

    /**
     * Updates club count.
     */
    fun updateClubCount(organizationId: UUID, count: Int): ClientUsage {
        val usage = getUsage(organizationId)
        usage.updateClubCount(count)
        return usageRepository.save(usage)
    }

    /**
     * Updates location count.
     */
    fun updateLocationCount(organizationId: UUID, count: Int): ClientUsage {
        val usage = getUsage(organizationId)
        usage.updateLocationCount(count)
        return usageRepository.save(usage)
    }

    /**
     * Updates member count.
     */
    fun updateMemberCount(organizationId: UUID, count: Int): ClientUsage {
        val usage = getUsage(organizationId)
        usage.updateMemberCount(count)
        return usageRepository.save(usage)
    }

    /**
     * Updates staff count.
     */
    fun updateStaffCount(organizationId: UUID, count: Int): ClientUsage {
        val usage = getUsage(organizationId)
        usage.updateStaffCount(count)
        return usageRepository.save(usage)
    }

    /**
     * Increments API call counter.
     */
    fun incrementApiCalls(organizationId: UUID, count: Long = 1): ClientUsage {
        val usage = getUsage(organizationId)
        usage.resetPeriod() // Reset if new billing period
        usage.incrementApiCalls(count)
        return usageRepository.save(usage)
    }

    /**
     * Updates storage usage.
     */
    fun updateStorageUsage(organizationId: UUID, gb: Double): ClientUsage {
        val usage = getUsage(organizationId)
        usage.updateStorageUsage(gb)
        return usageRepository.save(usage)
    }

    /**
     * Updates plan limits (when plan changes).
     */
    fun updateLimits(organizationId: UUID, plan: ClientPlan): ClientUsage {
        val usage = getUsage(organizationId)
        usage.updateLimits(plan)
        return usageRepository.save(usage)
    }

    /**
     * Checks if a new member can be added.
     */
    @Transactional(readOnly = true)
    fun canAddMember(organizationId: UUID): UsageCheckResult {
        val usage = usageRepository.findByOrganizationId(organizationId).orElse(null)
            ?: return UsageCheckResult(allowed = true, level = UsageLevel.NORMAL)

        val allowed = usage.canAddMember()
        return UsageCheckResult(
            allowed = allowed,
            level = usage.getMembersLevel(),
            currentCount = usage.currentMembers,
            maxCount = usage.maxMembers,
            percentUsed = usage.getMembersPercent(),
            isInGracePeriod = usage.isInGracePeriod(),
            message = if (!allowed) "Member limit reached. Please upgrade your plan." else null
        )
    }

    /**
     * Checks if a new staff user can be added.
     */
    @Transactional(readOnly = true)
    fun canAddStaff(organizationId: UUID): UsageCheckResult {
        val usage = usageRepository.findByOrganizationId(organizationId).orElse(null)
            ?: return UsageCheckResult(allowed = true, level = UsageLevel.NORMAL)

        val allowed = usage.canAddStaff()
        return UsageCheckResult(
            allowed = allowed,
            level = usage.getStaffLevel(),
            currentCount = usage.currentStaff,
            maxCount = usage.maxStaffUsers,
            percentUsed = usage.getStaffPercent(),
            isInGracePeriod = usage.isInGracePeriod(),
            message = if (!allowed) "Staff user limit reached. Please upgrade your plan." else null
        )
    }

    /**
     * Checks if a new club can be added.
     */
    @Transactional(readOnly = true)
    fun canAddClub(organizationId: UUID): UsageCheckResult {
        val usage = usageRepository.findByOrganizationId(organizationId).orElse(null)
            ?: return UsageCheckResult(allowed = true, level = UsageLevel.NORMAL)

        val allowed = usage.canAddClub()
        return UsageCheckResult(
            allowed = allowed,
            level = usage.getClubsLevel(),
            currentCount = usage.currentClubs,
            maxCount = usage.maxClubs,
            percentUsed = usage.getClubsPercent(),
            isInGracePeriod = usage.isInGracePeriod(),
            message = if (!allowed) "Club limit reached. Please upgrade your plan." else null
        )
    }

    /**
     * Gets a summary of all usage for an organization.
     */
    @Transactional(readOnly = true)
    fun getUsageSummary(organizationId: UUID): UsageSummary {
        val usage = getUsage(organizationId)

        return UsageSummary(
            organizationId = organizationId,
            usages = usage.getUsageSummary(),
            hasWarnings = usage.hasWarnings(),
            warningResources = usage.getWarningResources(),
            isExceeded = usage.isExceeded,
            isInGracePeriod = usage.isInGracePeriod(),
            gracePeriodEnds = usage.gracePeriodEnds
        )
    }

    /**
     * Gets all organizations approaching limits.
     */
    @Transactional(readOnly = true)
    fun getApproachingLimits(warningThreshold: Int = 80, pageable: Pageable): Page<ClientUsage> {
        return usageRepository.findApproachingLimits(warningThreshold, pageable)
    }

    /**
     * Gets all organizations that have exceeded limits.
     */
    @Transactional(readOnly = true)
    fun getExceeded(pageable: Pageable): Page<ClientUsage> {
        return usageRepository.findExceeded(pageable)
    }

    /**
     * Gets all organizations in grace period.
     */
    @Transactional(readOnly = true)
    fun getInGracePeriod(pageable: Pageable): Page<ClientUsage> {
        return usageRepository.findInGracePeriod(pageable)
    }

    /**
     * Gets usage limit statistics.
     */
    @Transactional(readOnly = true)
    fun getStatistics(): UsageLimitStatistics {
        return UsageLimitStatistics(
            totalTracked = usageRepository.count(),
            exceededCount = usageRepository.countExceeded(),
            warningCount = usageRepository.countApproachingLimits(80),
            criticalCount = usageRepository.countApproachingLimits(95)
        )
    }
}

/**
 * Result of a usage limit check.
 */
data class UsageCheckResult(
    val allowed: Boolean,
    val level: UsageLevel,
    val currentCount: Int? = null,
    val maxCount: Int? = null,
    val percentUsed: Int? = null,
    val isInGracePeriod: Boolean = false,
    val message: String? = null
)

/**
 * Summary of all usage for an organization.
 */
data class UsageSummary(
    val organizationId: UUID,
    val usages: Map<String, UsageStatus>,
    val hasWarnings: Boolean,
    val warningResources: List<String>,
    val isExceeded: Boolean,
    val isInGracePeriod: Boolean,
    val gracePeriodEnds: java.time.Instant?
)

/**
 * Usage limit statistics for platform dashboard.
 */
data class UsageLimitStatistics(
    val totalTracked: Long,
    val exceededCount: Long,
    val warningCount: Long,
    val criticalCount: Long
)
