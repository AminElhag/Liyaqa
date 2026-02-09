package com.liyaqa.platform.tenant.repository

import com.liyaqa.platform.tenant.model.OnboardingChecklist
import com.liyaqa.platform.tenant.model.ProvisioningStep
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataOnboardingChecklistRepository : JpaRepository<OnboardingChecklist, UUID> {
    fun findByTenantId(tenantId: UUID): List<OnboardingChecklist>
    fun findByTenantIdAndStep(tenantId: UUID, step: ProvisioningStep): Optional<OnboardingChecklist>
    fun countByTenantIdAndCompleted(tenantId: UUID, completed: Boolean): Long
}

@Repository
class JpaOnboardingChecklistRepository(
    private val springDataRepository: SpringDataOnboardingChecklistRepository
) : OnboardingChecklistRepository {

    override fun save(item: OnboardingChecklist): OnboardingChecklist =
        springDataRepository.save(item)

    override fun saveAll(items: List<OnboardingChecklist>): List<OnboardingChecklist> =
        springDataRepository.saveAll(items)

    override fun findByTenantId(tenantId: UUID): List<OnboardingChecklist> =
        springDataRepository.findByTenantId(tenantId)

    override fun findByTenantIdAndStep(tenantId: UUID, step: ProvisioningStep): Optional<OnboardingChecklist> =
        springDataRepository.findByTenantIdAndStep(tenantId, step)

    override fun countByTenantIdAndCompleted(tenantId: UUID, completed: Boolean): Long =
        springDataRepository.countByTenantIdAndCompleted(tenantId, completed)
}
