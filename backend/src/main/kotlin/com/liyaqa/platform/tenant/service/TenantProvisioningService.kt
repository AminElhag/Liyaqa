package com.liyaqa.platform.tenant.service

import com.liyaqa.platform.application.services.ClientOnboardingService
import com.liyaqa.platform.application.services.OnboardClientCommand
import com.liyaqa.platform.domain.ports.DealRepository
import com.liyaqa.platform.tenant.dto.ChangeStatusCommand
import com.liyaqa.platform.tenant.dto.ProvisionFromDealCommand
import com.liyaqa.platform.tenant.dto.ProvisionTenantCommand
import com.liyaqa.platform.tenant.dto.UpdateTenantCommand
import com.liyaqa.platform.tenant.exception.DealNotWonException
import com.liyaqa.platform.tenant.exception.TenantAlreadyExistsException
import com.liyaqa.platform.tenant.exception.TenantNotFoundException
import com.liyaqa.platform.tenant.model.OnboardingChecklist
import com.liyaqa.platform.tenant.model.OnboardingStepCompletedEvent
import com.liyaqa.platform.tenant.model.ProvisioningStep
import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.model.TenantProvisionedEvent
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.platform.tenant.model.TenantStatusChangedEvent
import com.liyaqa.platform.tenant.repository.OnboardingChecklistRepository
import com.liyaqa.platform.tenant.repository.TenantRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class TenantProvisioningService(
    private val tenantRepository: TenantRepository,
    private val checklistRepository: OnboardingChecklistRepository,
    private val clientOnboardingService: ClientOnboardingService,
    private val dealRepository: DealRepository,
    private val securityService: SecurityService,
    private val eventPublisher: ApplicationEventPublisher
) {
    private val logger = LoggerFactory.getLogger(TenantProvisioningService::class.java)

    // ============================================
    // Provisioning
    // ============================================

    fun provisionTenant(command: ProvisionTenantCommand): Tenant {
        // Check subdomain uniqueness
        if (command.subdomain != null && tenantRepository.existsBySubdomain(command.subdomain)) {
            throw TenantAlreadyExistsException("subdomain", command.subdomain)
        }

        val currentUserId = securityService.getCurrentUserId()

        val tenant = Tenant.create(
            facilityName = command.facilityName,
            contactEmail = command.contactEmail,
            onboardedBy = currentUserId,
            dealId = null
        )
        tenant.facilityNameAr = command.facilityNameAr
        tenant.subdomain = command.subdomain
        tenant.crNumber = command.crNumber
        tenant.vatNumber = command.vatNumber
        tenant.contactPhone = command.contactPhone
        tenant.address = command.address
        tenant.city = command.city
        tenant.region = command.region
        command.country.let { tenant.country = it }
        tenant.subscriptionPlanId = command.subscriptionPlanId
        tenant.metadata = command.metadata

        val saved = tenantRepository.save(tenant)

        // Create all checklist items
        val items = OnboardingChecklist.createAllForTenant(saved.id)
        checklistRepository.saveAll(items)

        // Auto-complete TENANT_CREATED
        completeStepInternal(saved.id, ProvisioningStep.TENANT_CREATED, currentUserId)

        eventPublisher.publishEvent(
            TenantProvisionedEvent(
                tenantId = saved.id,
                facilityName = saved.facilityName,
                contactEmail = saved.contactEmail,
                dealId = null
            )
        )

        logger.info("Provisioned tenant: ${saved.id} - ${saved.facilityName}")
        return saved
    }

    fun provisionFromDeal(dealId: UUID, command: ProvisionFromDealCommand): Tenant {
        // Idempotency: if tenant already exists for this deal, return it
        val existing = tenantRepository.findByDealId(dealId)
        if (existing.isPresent) {
            logger.info("Tenant already exists for deal $dealId, returning existing")
            return existing.get()
        }

        // Load and validate deal
        val deal = dealRepository.findById(dealId)
            .orElseThrow { NoSuchElementException("Deal not found: $dealId") }

        if (!deal.isWon()) {
            throw DealNotWonException(dealId)
        }

        val currentUserId = securityService.getCurrentUserId()

        // Create tenant from deal data
        val tenant = Tenant.create(
            facilityName = deal.facilityName ?: deal.contactName,
            contactEmail = deal.contactEmail,
            onboardedBy = currentUserId,
            dealId = dealId
        )
        tenant.contactPhone = deal.contactPhone

        val saved = tenantRepository.save(tenant)

        // Create all checklist items
        val items = OnboardingChecklist.createAllForTenant(saved.id)
        checklistRepository.saveAll(items)

        // Auto-complete DEAL_WON and TENANT_CREATED
        completeStepInternal(saved.id, ProvisioningStep.DEAL_WON, currentUserId)
        completeStepInternal(saved.id, ProvisioningStep.TENANT_CREATED, currentUserId)

        // Delegate to ClientOnboardingService for org/club/user creation
        val clubName = command.clubName ?: saved.facilityName
        val onboardResult = clientOnboardingService.onboardClient(
            OnboardClientCommand(
                organizationName = LocalizedText(en = saved.facilityName, ar = saved.facilityNameAr),
                clubName = LocalizedText(en = clubName),
                adminEmail = command.adminEmail,
                adminPassword = command.adminPassword,
                adminDisplayName = LocalizedText(
                    en = command.adminDisplayNameEn,
                    ar = command.adminDisplayNameAr
                ),
                clientPlanId = command.subscriptionPlanId,
                dealId = dealId,
                salesRepId = try { deal.assignedTo.id } catch (_: Exception) { null }
            )
        )

        // Store org/club IDs back on tenant
        saved.organizationId = onboardResult.organization.id
        saved.clubId = onboardResult.club.id
        tenantRepository.save(saved)

        // Auto-complete ADMIN_ACCOUNT_CREATED
        completeStepInternal(saved.id, ProvisioningStep.ADMIN_ACCOUNT_CREATED, currentUserId)

        eventPublisher.publishEvent(
            TenantProvisionedEvent(
                tenantId = saved.id,
                facilityName = saved.facilityName,
                contactEmail = saved.contactEmail,
                dealId = dealId
            )
        )

        logger.info("Provisioned tenant from deal: ${saved.id} - deal: $dealId")
        return saved
    }

    // ============================================
    // CRUD
    // ============================================

    @Transactional(readOnly = true)
    fun getTenant(id: UUID): Tenant {
        return tenantRepository.findById(id)
            .orElseThrow { TenantNotFoundException(id) }
    }

    @Transactional(readOnly = true)
    fun listTenants(status: TenantStatus? = null, pageable: Pageable): Page<Tenant> {
        return if (status != null) {
            tenantRepository.findByStatus(status, pageable)
        } else {
            tenantRepository.findAll(pageable)
        }
    }

    fun updateTenant(id: UUID, command: UpdateTenantCommand): Tenant {
        val tenant = getTenant(id)

        // Check subdomain uniqueness if changing
        if (command.subdomain != null && command.subdomain != tenant.subdomain) {
            if (tenantRepository.existsBySubdomain(command.subdomain)) {
                throw TenantAlreadyExistsException("subdomain", command.subdomain)
            }
        }

        command.facilityName?.let { tenant.facilityName = it }
        command.facilityNameAr?.let { tenant.facilityNameAr = it }
        command.subdomain?.let { tenant.subdomain = it }
        command.crNumber?.let { tenant.crNumber = it }
        command.vatNumber?.let { tenant.vatNumber = it }
        command.contactEmail?.let { tenant.contactEmail = it }
        command.contactPhone?.let { tenant.contactPhone = it }
        command.address?.let { tenant.address = it }
        command.city?.let { tenant.city = it }
        command.region?.let { tenant.region = it }
        command.country?.let { tenant.country = it }
        command.subscriptionPlanId?.let { tenant.subscriptionPlanId = it }
        command.metadata?.let { tenant.metadata = it }

        return tenantRepository.save(tenant)
    }

    // ============================================
    // Status Transitions
    // ============================================

    fun changeTenantStatus(id: UUID, command: ChangeStatusCommand): Tenant {
        val tenant = getTenant(id)
        val previousStatus = tenant.status

        tenant.changeStatus(command.newStatus)
        val saved = tenantRepository.save(tenant)

        eventPublisher.publishEvent(
            TenantStatusChangedEvent(
                tenantId = saved.id,
                previousStatus = previousStatus,
                newStatus = command.newStatus
            )
        )

        logger.info("Tenant ${saved.id} status changed: $previousStatus -> ${command.newStatus}")
        return saved
    }

    // ============================================
    // Onboarding Checklist
    // ============================================

    @Transactional(readOnly = true)
    fun getOnboardingChecklist(tenantId: UUID): List<OnboardingChecklist> {
        // Verify tenant exists
        if (!tenantRepository.existsById(tenantId)) {
            throw TenantNotFoundException(tenantId)
        }
        return checklistRepository.findByTenantId(tenantId)
    }

    fun completeOnboardingStep(tenantId: UUID, step: ProvisioningStep, notes: String? = null): OnboardingChecklist {
        if (!tenantRepository.existsById(tenantId)) {
            throw TenantNotFoundException(tenantId)
        }

        val currentUserId = securityService.getCurrentUserId()
        val item = completeStepInternal(tenantId, step, currentUserId, notes)

        // Check if all steps are done
        val totalSteps = ProvisioningStep.entries.size.toLong()
        val completedSteps = checklistRepository.countByTenantIdAndCompleted(tenantId, true)
        val allComplete = completedSteps >= totalSteps

        eventPublisher.publishEvent(
            OnboardingStepCompletedEvent(
                tenantId = tenantId,
                step = step,
                allStepsComplete = allComplete
            )
        )

        return item
    }

    // ============================================
    // Helpers
    // ============================================

    private fun completeStepInternal(
        tenantId: UUID,
        step: ProvisioningStep,
        completedBy: UUID?,
        notes: String? = null
    ): OnboardingChecklist {
        val item = checklistRepository.findByTenantIdAndStep(tenantId, step)
            .orElseThrow { NoSuchElementException("Checklist item not found: $tenantId / $step") }
        item.complete(completedBy, notes)
        return checklistRepository.save(item)
    }
}
