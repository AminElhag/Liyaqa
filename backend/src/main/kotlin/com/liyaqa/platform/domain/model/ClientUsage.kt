package com.liyaqa.platform.domain.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.time.Instant
import java.time.YearMonth
import java.util.UUID

/**
 * Tracks a client's resource usage against their plan limits.
 * Updated in real-time for enforcement and proactive alerts.
 *
 * This is a platform-level entity that monitors B2B client usage.
 * Each organization has one current ClientUsage record.
 */
@Entity
@Table(name = "client_usage")
class ClientUsage(
    id: UUID = UUID.randomUUID(),

    /**
     * The organization this usage belongs to.
     */
    @Column(name = "organization_id", nullable = false, unique = true)
    var organizationId: UUID,

    /**
     * The billing period this usage is for (YYYY-MM format).
     */
    @Column(name = "period_year_month", nullable = false)
    var periodYearMonth: String = YearMonth.now().toString(),

    // ============================================
    // Current Usage Counts
    // ============================================

    /**
     * Current number of clubs.
     */
    @Column(name = "current_clubs", nullable = false)
    var currentClubs: Int = 0,

    /**
     * Current total number of locations across all clubs.
     */
    @Column(name = "current_locations", nullable = false)
    var currentLocations: Int = 0,

    /**
     * Current total number of active members across all clubs.
     */
    @Column(name = "current_members", nullable = false)
    var currentMembers: Int = 0,

    /**
     * Current number of staff/admin users.
     */
    @Column(name = "current_staff", nullable = false)
    var currentStaff: Int = 0,

    /**
     * API calls made this billing period.
     */
    @Column(name = "api_calls_this_month", nullable = false)
    var apiCallsThisMonth: Long = 0,

    /**
     * Storage used in GB.
     */
    @Column(name = "storage_used_gb", nullable = false)
    var storageUsedGb: Double = 0.0,

    // ============================================
    // Plan Limits (cached from ClientPlan)
    // ============================================

    /**
     * Maximum clubs allowed by the plan.
     */
    @Column(name = "max_clubs", nullable = false)
    var maxClubs: Int = 1,

    /**
     * Maximum locations per club allowed.
     */
    @Column(name = "max_locations_per_club", nullable = false)
    var maxLocationsPerClub: Int = 1,

    /**
     * Maximum total members allowed.
     */
    @Column(name = "max_members", nullable = false)
    var maxMembers: Int = 100,

    /**
     * Maximum staff users allowed.
     */
    @Column(name = "max_staff_users", nullable = false)
    var maxStaffUsers: Int = 5,

    /**
     * Maximum API calls per month (null = unlimited).
     */
    @Column(name = "max_api_calls")
    var maxApiCalls: Long? = null,

    /**
     * Maximum storage in GB (null = unlimited).
     */
    @Column(name = "max_storage_gb")
    var maxStorageGb: Double? = null,

    // ============================================
    // Tracking
    // ============================================

    /**
     * When usage was last updated.
     */
    @Column(name = "last_updated", nullable = false)
    var lastUpdated: Instant = Instant.now(),

    /**
     * Whether any limit is currently exceeded.
     */
    @Column(name = "is_exceeded", nullable = false)
    var isExceeded: Boolean = false,

    /**
     * Grace period end date if exceeded (null if not in grace period).
     */
    @Column(name = "grace_period_ends")
    var gracePeriodEnds: Instant? = null

) : OrganizationLevelEntity(id) {

    companion object {
        // Threshold percentages
        const val WARNING_THRESHOLD = 80
        const val CRITICAL_THRESHOLD = 95
        const val EXCEEDED_THRESHOLD = 100

        // Grace period in days
        const val GRACE_PERIOD_DAYS = 7L

        /**
         * Creates new usage tracking for an organization.
         */
        fun createForOrganization(organizationId: UUID, plan: ClientPlan): ClientUsage {
            return ClientUsage(
                organizationId = organizationId,
                periodYearMonth = YearMonth.now().toString(),
                maxClubs = plan.maxClubs,
                maxLocationsPerClub = plan.maxLocationsPerClub,
                maxMembers = plan.maxMembers,
                maxStaffUsers = plan.maxStaffUsers
            )
        }
    }

    // ============================================
    // Domain Methods - Usage Updates
    // ============================================

    /**
     * Updates the current club count.
     */
    fun updateClubCount(count: Int) {
        currentClubs = count.coerceAtLeast(0)
        lastUpdated = Instant.now()
        checkExceeded()
    }

    /**
     * Updates the current location count.
     */
    fun updateLocationCount(count: Int) {
        currentLocations = count.coerceAtLeast(0)
        lastUpdated = Instant.now()
        checkExceeded()
    }

    /**
     * Updates the current member count.
     */
    fun updateMemberCount(count: Int) {
        currentMembers = count.coerceAtLeast(0)
        lastUpdated = Instant.now()
        checkExceeded()
    }

    /**
     * Updates the current staff count.
     */
    fun updateStaffCount(count: Int) {
        currentStaff = count.coerceAtLeast(0)
        lastUpdated = Instant.now()
        checkExceeded()
    }

    /**
     * Increments the API call counter.
     */
    fun incrementApiCalls(count: Long = 1) {
        apiCallsThisMonth += count.coerceAtLeast(0)
        lastUpdated = Instant.now()
        checkExceeded()
    }

    /**
     * Updates storage usage.
     */
    fun updateStorageUsage(gb: Double) {
        storageUsedGb = gb.coerceAtLeast(0.0)
        lastUpdated = Instant.now()
        checkExceeded()
    }

    /**
     * Updates plan limits from a ClientPlan.
     */
    fun updateLimits(plan: ClientPlan) {
        maxClubs = plan.maxClubs
        maxLocationsPerClub = plan.maxLocationsPerClub
        maxMembers = plan.maxMembers
        maxStaffUsers = plan.maxStaffUsers
        // API and storage limits could be added to ClientPlan if needed
        lastUpdated = Instant.now()
        checkExceeded()
    }

    /**
     * Resets API calls for new billing period.
     */
    fun resetPeriod() {
        val newPeriod = YearMonth.now().toString()
        if (periodYearMonth != newPeriod) {
            periodYearMonth = newPeriod
            apiCallsThisMonth = 0
            lastUpdated = Instant.now()
        }
    }

    // ============================================
    // Domain Methods - Status Calculation
    // ============================================

    /**
     * Checks if any limit is exceeded and updates status.
     */
    private fun checkExceeded() {
        val wasExceeded = isExceeded
        isExceeded = getClubsLevel() == UsageLevel.EXCEEDED ||
                     getMembersLevel() == UsageLevel.EXCEEDED ||
                     getStaffLevel() == UsageLevel.EXCEEDED ||
                     getApiCallsLevel() == UsageLevel.EXCEEDED

        // Start grace period if newly exceeded
        if (!wasExceeded && isExceeded && gracePeriodEnds == null) {
            gracePeriodEnds = Instant.now().plusSeconds(GRACE_PERIOD_DAYS * 24 * 60 * 60)
        }

        // Clear grace period if no longer exceeded
        if (!isExceeded) {
            gracePeriodEnds = null
        }
    }

    /**
     * Gets the usage level for a specific metric.
     */
    private fun getLevel(current: Int, max: Int): UsageLevel {
        if (max <= 0) return UsageLevel.NORMAL // Unlimited or not set
        val percent = (current.toDouble() / max * 100).toInt()
        return when {
            percent > EXCEEDED_THRESHOLD -> UsageLevel.EXCEEDED
            percent >= CRITICAL_THRESHOLD -> UsageLevel.CRITICAL
            percent >= WARNING_THRESHOLD -> UsageLevel.WARNING
            else -> UsageLevel.NORMAL
        }
    }

    /**
     * Gets the usage level for API calls.
     */
    private fun getApiLevel(current: Long, max: Long?): UsageLevel {
        if (max == null) return UsageLevel.NORMAL // Unlimited
        if (max <= 0) return UsageLevel.NORMAL
        val percent = (current.toDouble() / max * 100).toInt()
        return when {
            percent > EXCEEDED_THRESHOLD -> UsageLevel.EXCEEDED
            percent >= CRITICAL_THRESHOLD -> UsageLevel.CRITICAL
            percent >= WARNING_THRESHOLD -> UsageLevel.WARNING
            else -> UsageLevel.NORMAL
        }
    }

    // ============================================
    // Domain Methods - Queries
    // ============================================

    /**
     * Gets the usage level for clubs.
     */
    fun getClubsLevel(): UsageLevel = getLevel(currentClubs, maxClubs)

    /**
     * Gets the usage percentage for clubs.
     */
    fun getClubsPercent(): Int {
        if (maxClubs <= 0) return 0
        return ((currentClubs.toDouble() / maxClubs) * 100).toInt()
    }

    /**
     * Gets the usage level for members.
     */
    fun getMembersLevel(): UsageLevel = getLevel(currentMembers, maxMembers)

    /**
     * Gets the usage percentage for members.
     */
    fun getMembersPercent(): Int {
        if (maxMembers <= 0) return 0
        return ((currentMembers.toDouble() / maxMembers) * 100).toInt()
    }

    /**
     * Gets the usage level for staff.
     */
    fun getStaffLevel(): UsageLevel = getLevel(currentStaff, maxStaffUsers)

    /**
     * Gets the usage percentage for staff.
     */
    fun getStaffPercent(): Int {
        if (maxStaffUsers <= 0) return 0
        return ((currentStaff.toDouble() / maxStaffUsers) * 100).toInt()
    }

    /**
     * Gets the usage level for API calls.
     */
    fun getApiCallsLevel(): UsageLevel = getApiLevel(apiCallsThisMonth, maxApiCalls)

    /**
     * Gets the usage percentage for API calls.
     */
    fun getApiCallsPercent(): Int {
        val max = maxApiCalls ?: return 0
        if (max <= 0) return 0
        return ((apiCallsThisMonth.toDouble() / max) * 100).toInt()
    }

    /**
     * Gets the usage level for storage.
     */
    fun getStorageLevel(): UsageLevel {
        val max = maxStorageGb ?: return UsageLevel.NORMAL
        if (max <= 0) return UsageLevel.NORMAL
        val percent = (storageUsedGb / max * 100).toInt()
        return when {
            percent > EXCEEDED_THRESHOLD -> UsageLevel.EXCEEDED
            percent >= CRITICAL_THRESHOLD -> UsageLevel.CRITICAL
            percent >= WARNING_THRESHOLD -> UsageLevel.WARNING
            else -> UsageLevel.NORMAL
        }
    }

    /**
     * Gets the storage usage percentage.
     */
    fun getStoragePercent(): Int {
        val max = maxStorageGb ?: return 0
        if (max <= 0) return 0
        return ((storageUsedGb / max) * 100).toInt()
    }

    /**
     * Gets a summary of all usage statuses.
     */
    fun getUsageSummary(): Map<String, UsageStatus> {
        return mapOf(
            "clubs" to UsageStatus(
                label = "Clubs",
                current = currentClubs,
                max = maxClubs,
                percentUsed = getClubsPercent(),
                level = getClubsLevel()
            ),
            "members" to UsageStatus(
                label = "Members",
                current = currentMembers,
                max = maxMembers,
                percentUsed = getMembersPercent(),
                level = getMembersLevel()
            ),
            "staff" to UsageStatus(
                label = "Staff Users",
                current = currentStaff,
                max = maxStaffUsers,
                percentUsed = getStaffPercent(),
                level = getStaffLevel()
            ),
            "apiCalls" to UsageStatus(
                label = "API Calls",
                current = apiCallsThisMonth.toInt(),
                max = maxApiCalls?.toInt() ?: -1,
                percentUsed = getApiCallsPercent(),
                level = getApiCallsLevel()
            )
        )
    }

    /**
     * Checks if any resource is at warning level or above.
     */
    fun hasWarnings(): Boolean {
        return getClubsLevel() != UsageLevel.NORMAL ||
               getMembersLevel() != UsageLevel.NORMAL ||
               getStaffLevel() != UsageLevel.NORMAL ||
               getApiCallsLevel() != UsageLevel.NORMAL ||
               getStorageLevel() != UsageLevel.NORMAL
    }

    /**
     * Gets all resources that are at warning level or above.
     */
    fun getWarningResources(): List<String> {
        val warnings = mutableListOf<String>()
        if (getClubsLevel() != UsageLevel.NORMAL) warnings.add("clubs")
        if (getMembersLevel() != UsageLevel.NORMAL) warnings.add("members")
        if (getStaffLevel() != UsageLevel.NORMAL) warnings.add("staff")
        if (getApiCallsLevel() != UsageLevel.NORMAL) warnings.add("apiCalls")
        if (getStorageLevel() != UsageLevel.NORMAL) warnings.add("storage")
        return warnings
    }

    /**
     * Checks if the grace period has expired.
     */
    fun isGracePeriodExpired(): Boolean {
        return gracePeriodEnds != null && Instant.now().isAfter(gracePeriodEnds)
    }

    /**
     * Checks if a new member can be added.
     */
    fun canAddMember(): Boolean {
        return currentMembers < maxMembers || isInGracePeriod()
    }

    /**
     * Checks if a new staff user can be added.
     */
    fun canAddStaff(): Boolean {
        return currentStaff < maxStaffUsers || isInGracePeriod()
    }

    /**
     * Checks if a new club can be added.
     */
    fun canAddClub(): Boolean {
        return currentClubs < maxClubs || isInGracePeriod()
    }

    /**
     * Checks if currently in grace period.
     */
    fun isInGracePeriod(): Boolean {
        return gracePeriodEnds != null && Instant.now().isBefore(gracePeriodEnds)
    }

}

/**
 * Status summary for a single usage metric.
 */
data class UsageStatus(
    val label: String,
    val current: Int,
    val max: Int,
    val percentUsed: Int,
    val level: UsageLevel
)
