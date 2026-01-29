package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.DunningSequence
import com.liyaqa.platform.domain.model.DunningStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository port for DunningSequence entity.
 * Manages payment recovery processes.
 */
interface DunningSequenceRepository {
    fun save(dunning: DunningSequence): DunningSequence
    fun findById(id: UUID): Optional<DunningSequence>
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<DunningSequence>
    fun findBySubscriptionId(subscriptionId: UUID): Optional<DunningSequence>
    fun findByInvoiceId(invoiceId: UUID): Optional<DunningSequence>
    fun findAll(pageable: Pageable): Page<DunningSequence>
    fun findByStatus(status: DunningStatus, pageable: Pageable): Page<DunningSequence>
    fun findActive(pageable: Pageable): Page<DunningSequence>
    fun findActiveByOrganizationId(organizationId: UUID): Optional<DunningSequence>
    fun findWithRetryDue(dueDate: LocalDate): List<DunningSequence>
    fun findReadyForSuspension(suspensionDay: Int): List<DunningSequence>
    fun findReadyForDeactivation(deactivationDay: Int): List<DunningSequence>
    fun findEscalatedToCsm(pageable: Pageable): Page<DunningSequence>
    fun findByCsmId(csmId: UUID, pageable: Pageable): Page<DunningSequence>
    fun existsById(id: UUID): Boolean
    fun existsActiveByOrganizationId(organizationId: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countByStatus(status: DunningStatus): Long
    fun countActive(): Long
    fun getRecoveryRate(): Double
}
