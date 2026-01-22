package com.liyaqa.platform.application.services

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.organization.domain.model.ZatcaInfo
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.platform.domain.model.BillingCycle
import com.liyaqa.platform.domain.model.ClientSubscription
import com.liyaqa.platform.domain.model.ClientSubscriptionStatus
import com.liyaqa.platform.domain.ports.ClientPlanRepository
import com.liyaqa.platform.domain.ports.ClientSubscriptionRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.slf4j.LoggerFactory
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.UUID

/**
 * Command for onboarding a new client.
 */
data class OnboardClientCommand(
    // Organization details
    val organizationName: LocalizedText,
    val organizationTradeName: LocalizedText? = null,
    val organizationType: OrganizationType = OrganizationType.LLC,
    val organizationEmail: String? = null,
    val organizationPhone: String? = null,
    val organizationWebsite: String? = null,
    val vatRegistrationNumber: String? = null,
    val commercialRegistrationNumber: String? = null,

    // First club details
    val clubName: LocalizedText,
    val clubDescription: LocalizedText? = null,
    /**
     * Optional subdomain slug for the club. If null, auto-generated from club name.
     * Example: "fitness-gym" for URL fitness-gym.liyaqa.com
     */
    val clubSlug: String? = null,

    // Admin user details
    val adminEmail: String,
    val adminPassword: String,
    val adminDisplayName: LocalizedText,

    // Subscription details (optional)
    val clientPlanId: UUID? = null,
    val agreedPrice: Money? = null,
    val billingCycle: BillingCycle = BillingCycle.MONTHLY,
    val contractMonths: Int = 12,
    val startWithTrial: Boolean = true,
    val trialDays: Int = 14,
    val discountPercentage: BigDecimal? = null,

    // Sales attribution
    val salesRepId: UUID? = null,
    val dealId: UUID? = null
)

/**
 * Command for setting up an admin user for an existing client.
 */
data class SetupAdminCommand(
    val organizationId: UUID,
    val clubId: UUID,
    val adminEmail: String,
    val adminPassword: String,
    val adminDisplayName: LocalizedText
)

/**
 * Result of client onboarding.
 */
data class OnboardingResult(
    val organization: Organization,
    val club: Club,
    val adminUser: User,
    val subscription: ClientSubscription?
)

/**
 * Service for onboarding new clients to the Liyaqa platform.
 * Orchestrates creation of Organization, Club, Admin User, and optionally Subscription.
 */
@Service
@Transactional
class ClientOnboardingService(
    private val organizationRepository: OrganizationRepository,
    private val clubRepository: ClubRepository,
    private val userRepository: UserRepository,
    private val clientPlanRepository: ClientPlanRepository,
    private val subscriptionRepository: ClientSubscriptionRepository,
    private val passwordEncoder: PasswordEncoder
) {
    private val logger = LoggerFactory.getLogger(ClientOnboardingService::class.java)

    /**
     * Onboards a new client with organization, club, admin user, and optional subscription.
     */
    fun onboardClient(command: OnboardClientCommand): OnboardingResult {
        logger.info("Onboarding new client: ${command.organizationName.en}")

        // 1. Create Organization
        val zatcaInfo = if (command.vatRegistrationNumber != null || command.commercialRegistrationNumber != null) {
            ZatcaInfo(
                vatRegistrationNumber = command.vatRegistrationNumber,
                commercialRegistrationNumber = command.commercialRegistrationNumber
            )
        } else null

        val organization = Organization(
            name = command.organizationName,
            tradeName = command.organizationTradeName,
            organizationType = command.organizationType,
            email = command.organizationEmail,
            phone = command.organizationPhone,
            website = command.organizationWebsite,
            zatcaInfo = zatcaInfo,
            status = OrganizationStatus.PENDING
        )
        val savedOrganization = organizationRepository.save(organization)
        logger.info("Created organization: ${savedOrganization.id}")

        // 2. Create Club with slug (sets tenant context)
        val club = Club(
            organizationId = savedOrganization.id,
            name = command.clubName,
            description = command.clubDescription,
            status = ClubStatus.ACTIVE
        )

        // Generate and set slug for subdomain-based access
        val baseSlug = command.clubSlug?.lowercase()?.trim() ?: Club.generateSlug(command.clubName.en)
        val uniqueSlug = try {
            ensureUniqueSlug(baseSlug)
        } catch (e: Exception) {
            logger.error("Failed to generate unique slug from: $baseSlug", e)
            throw IllegalArgumentException("Failed to generate unique club URL slug from name '${command.clubName.en}'. Please try a different club name.")
        }

        try {
            club.setSlugValidated(uniqueSlug)
        } catch (e: IllegalArgumentException) {
            logger.error("Invalid slug generated: $uniqueSlug", e)
            throw IllegalArgumentException("Generated club URL slug '$uniqueSlug' is invalid or reserved. Please provide a different club name.")
        }

        val savedClub = try {
            // Use saveAndFlush to ensure the club exists in DB before creating user
            // This is required because User.tenant_id has FK constraint to clubs.id
            clubRepository.saveAndFlush(club)
        } catch (e: DataIntegrityViolationException) {
            logger.error("Failed to save club - possible duplicate slug: $uniqueSlug", e)
            throw IllegalArgumentException("A club with URL slug '$uniqueSlug' already exists. Please try a different club name.")
        }
        logger.info("Created club: ${savedClub.id} with slug: ${savedClub.slug}")

        // 3. Create Admin User (with club as tenant)
        TenantContext.setCurrentTenant(TenantId(savedClub.id))
        try {
            // Check if email already exists in this tenant
            if (userRepository.existsByEmailAndTenantId(command.adminEmail, savedClub.id)) {
                throw IllegalArgumentException("Admin email already exists")
            }

            val passwordHash = passwordEncoder.encode(command.adminPassword)
                ?: throw IllegalStateException("Password encoding failed. Please try again.")

            val adminUser = User(
                email = command.adminEmail,
                passwordHash = passwordHash,
                displayName = command.adminDisplayName,
                role = Role.CLUB_ADMIN,
                status = UserStatus.ACTIVE
            )

            val savedAdmin = try {
                userRepository.save(adminUser)
            } catch (e: DataIntegrityViolationException) {
                logger.error("Failed to save admin user - possible duplicate email: ${command.adminEmail}", e)
                throw IllegalArgumentException("Admin email '${command.adminEmail}' is already in use. Please use a different email address.")
            }
            logger.info("Created admin user: ${savedAdmin.id}")

            // 4. Create Subscription (if plan specified)
            val subscription = if (command.clientPlanId != null && command.agreedPrice != null) {
                val plan = clientPlanRepository.findById(command.clientPlanId)
                    .orElseThrow { NoSuchElementException("Client plan not found: ${command.clientPlanId}") }

                val sub = if (command.startWithTrial) {
                    ClientSubscription.createTrial(
                        organizationId = savedOrganization.id,
                        clientPlanId = command.clientPlanId,
                        trialDays = command.trialDays,
                        agreedPrice = command.agreedPrice,
                        billingCycle = command.billingCycle,
                        salesRepId = command.salesRepId,
                        dealId = command.dealId
                    )
                } else {
                    ClientSubscription.createActive(
                        organizationId = savedOrganization.id,
                        clientPlanId = command.clientPlanId,
                        contractMonths = command.contractMonths,
                        agreedPrice = command.agreedPrice,
                        billingCycle = command.billingCycle,
                        salesRepId = command.salesRepId,
                        dealId = command.dealId
                    )
                }

                command.discountPercentage?.let { sub.applyDiscount(it) }
                val savedSub = subscriptionRepository.save(sub)
                logger.info("Created subscription: ${savedSub.id}")
                savedSub
            } else null

            return OnboardingResult(
                organization = savedOrganization,
                club = savedClub,
                adminUser = savedAdmin,
                subscription = subscription
            )
        } finally {
            TenantContext.clear()
        }
    }

    /**
     * Sets up an admin user for an existing client organization.
     */
    fun setupAdmin(command: SetupAdminCommand): User {
        // Validate organization exists
        if (!organizationRepository.existsById(command.organizationId)) {
            throw NoSuchElementException("Organization not found: ${command.organizationId}")
        }

        // Validate club exists and belongs to organization
        val club = clubRepository.findById(command.clubId)
            .orElseThrow { NoSuchElementException("Club not found: ${command.clubId}") }

        if (club.organizationId != command.organizationId) {
            throw IllegalArgumentException("Club does not belong to the specified organization")
        }

        // Set tenant context
        TenantContext.setCurrentTenant(TenantId(command.clubId))
        try {
            // Check if email already exists
            if (userRepository.existsByEmailAndTenantId(command.adminEmail, command.clubId)) {
                throw IllegalArgumentException("Admin email already exists in this club")
            }

            val passwordHash = passwordEncoder.encode(command.adminPassword)
                ?: throw IllegalStateException("Password encoding failed. Please try again.")

            val adminUser = User(
                email = command.adminEmail,
                passwordHash = passwordHash,
                displayName = command.adminDisplayName,
                role = Role.CLUB_ADMIN,
                status = UserStatus.ACTIVE
            )

            return try {
                userRepository.save(adminUser)
            } catch (e: DataIntegrityViolationException) {
                logger.error("Failed to save admin user - possible duplicate email: ${command.adminEmail}", e)
                throw IllegalArgumentException("Admin email '${command.adminEmail}' is already in use. Please use a different email address.")
            }
        } finally {
            TenantContext.clear()
        }
    }

    /**
     * Gets all clients (organizations) with pagination.
     */
    @Transactional(readOnly = true)
    fun getClients(pageable: Pageable): Page<Organization> {
        return organizationRepository.findAll(pageable)
    }

    /**
     * Gets a client (organization) by ID.
     */
    @Transactional(readOnly = true)
    fun getClient(id: UUID): Organization {
        return organizationRepository.findById(id)
            .orElseThrow { NoSuchElementException("Client not found: $id") }
    }

    /**
     * Gets clients by status.
     */
    @Transactional(readOnly = true)
    fun getClientsByStatus(status: OrganizationStatus, pageable: Pageable): Page<Organization> {
        return organizationRepository.findByStatus(status, pageable)
    }

    /**
     * Activates a client (organization and its first club).
     */
    fun activateClient(organizationId: UUID): Organization {
        val organization = organizationRepository.findById(organizationId)
            .orElseThrow { NoSuchElementException("Organization not found: $organizationId") }

        organization.activate()
        val savedOrg = organizationRepository.save(organization)

        // Also activate the first club (if it's suspended)
        val clubs = clubRepository.findByOrganizationId(organizationId, Pageable.unpaged())
        if (clubs.hasContent()) {
            val firstClub = clubs.content.first()
            if (firstClub.status == ClubStatus.SUSPENDED) {
                firstClub.activate()
                clubRepository.save(firstClub)
            }
        }

        return savedOrg
    }

    /**
     * Suspends a client (organization and all its clubs).
     */
    fun suspendClient(organizationId: UUID): Organization {
        val organization = organizationRepository.findById(organizationId)
            .orElseThrow { NoSuchElementException("Organization not found: $organizationId") }

        organization.suspend()
        val savedOrg = organizationRepository.save(organization)

        // Suspend all clubs
        val clubs = clubRepository.findByOrganizationId(organizationId, Pageable.unpaged())
        clubs.content.forEach { club ->
            if (club.status != ClubStatus.CLOSED) {
                club.suspend()
                clubRepository.save(club)
            }
        }

        // Also suspend the subscription if active
        val subscription = subscriptionRepository.findActiveByOrganizationId(organizationId)
        subscription.ifPresent {
            it.suspend()
            subscriptionRepository.save(it)
        }

        return savedOrg
    }

    /**
     * Gets clubs for a client.
     */
    @Transactional(readOnly = true)
    fun getClientClubs(organizationId: UUID, pageable: Pageable): Page<Club> {
        return clubRepository.findByOrganizationId(organizationId, pageable)
    }

    /**
     * Creates an additional club for a client.
     * @param slug Optional subdomain slug. If null, auto-generated from name.
     */
    fun createClubForClient(
        organizationId: UUID,
        name: LocalizedText,
        description: LocalizedText? = null,
        slug: String? = null
    ): Club {
        // Validate organization exists
        if (!organizationRepository.existsById(organizationId)) {
            throw NoSuchElementException("Organization not found: $organizationId")
        }

        // Check subscription limits
        val subscription = subscriptionRepository.findActiveByOrganizationId(organizationId).orElse(null)
        if (subscription != null) {
            val plan = clientPlanRepository.findById(subscription.clientPlanId).orElse(null)
            if (plan != null) {
                val currentClubCount = clubRepository.findByOrganizationId(organizationId, Pageable.unpaged()).totalElements
                if (currentClubCount >= plan.maxClubs) {
                    throw IllegalStateException("Maximum number of clubs (${plan.maxClubs}) reached for this subscription plan")
                }
            }
        }

        val club = Club(
            organizationId = organizationId,
            name = name,
            description = description,
            status = ClubStatus.ACTIVE
        )

        // Generate and set unique slug
        val baseSlug = slug?.lowercase()?.trim() ?: Club.generateSlug(name.en)
        val uniqueSlug = try {
            ensureUniqueSlug(baseSlug)
        } catch (e: Exception) {
            logger.error("Failed to generate unique slug from: $baseSlug", e)
            throw IllegalArgumentException("Failed to generate unique club URL slug from name '${name.en}'. Please try a different club name.")
        }

        try {
            club.setSlugValidated(uniqueSlug)
        } catch (e: IllegalArgumentException) {
            logger.error("Invalid slug generated: $uniqueSlug", e)
            throw IllegalArgumentException("Generated club URL slug '$uniqueSlug' is invalid or reserved. Please provide a different club name.")
        }

        return try {
            // Use saveAndFlush for consistency with onboardClient method
            clubRepository.saveAndFlush(club)
        } catch (e: DataIntegrityViolationException) {
            logger.error("Failed to save club - possible duplicate slug: $uniqueSlug", e)
            throw IllegalArgumentException("A club with URL slug '$uniqueSlug' already exists. Please try a different club name.")
        }
    }

    /**
     * Ensures a slug is unique by appending a number if necessary.
     */
    private fun ensureUniqueSlug(baseSlug: String): String {
        if (!clubRepository.existsBySlug(baseSlug)) {
            return baseSlug
        }

        // Try appending numbers until unique
        var counter = 2
        var candidateSlug: String
        do {
            candidateSlug = "$baseSlug-$counter"
            counter++
        } while (clubRepository.existsBySlug(candidateSlug) && counter < 100)

        if (counter >= 100) {
            // Fall back to UUID suffix
            candidateSlug = "$baseSlug-${UUID.randomUUID().toString().take(8)}"
        }

        return candidateSlug
    }

    /**
     * Gets the number of clients.
     */
    @Transactional(readOnly = true)
    fun getClientCount(): Long {
        return organizationRepository.count()
    }

    /**
     * Gets client statistics.
     */
    @Transactional(readOnly = true)
    fun getClientStats(): ClientStats {
        val allOrgs = organizationRepository.findAll(Pageable.unpaged())
        val stats = allOrgs.groupBy { it.status }.mapValues { it.value.size.toLong() }

        return ClientStats(
            total = allOrgs.totalElements,
            pending = stats[OrganizationStatus.PENDING] ?: 0,
            active = stats[OrganizationStatus.ACTIVE] ?: 0,
            suspended = stats[OrganizationStatus.SUSPENDED] ?: 0,
            closed = stats[OrganizationStatus.CLOSED] ?: 0
        )
    }
}

/**
 * Statistics about clients.
 */
data class ClientStats(
    val total: Long,
    val pending: Long,
    val active: Long,
    val suspended: Long,
    val closed: Long
)
