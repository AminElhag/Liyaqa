package com.liyaqa.platform.tenant.repository

import com.liyaqa.platform.tenant.model.OnboardingChecklist
import com.liyaqa.platform.tenant.model.ProvisioningStep
import java.util.Optional
import java.util.UUID

interface OnboardingChecklistRepository {
    fun save(item: OnboardingChecklist): OnboardingChecklist
    fun saveAll(items: List<OnboardingChecklist>): List<OnboardingChecklist>
    fun findByTenantId(tenantId: UUID): List<OnboardingChecklist>
    fun findByTenantIdAndStep(tenantId: UUID, step: ProvisioningStep): Optional<OnboardingChecklist>
    fun countByTenantIdAndCompleted(tenantId: UUID, completed: Boolean): Long
}
