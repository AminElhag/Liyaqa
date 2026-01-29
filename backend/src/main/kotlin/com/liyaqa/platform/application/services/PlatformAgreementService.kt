package com.liyaqa.platform.application.services

import com.liyaqa.membership.domain.model.Agreement
import com.liyaqa.membership.domain.model.AgreementType
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import com.liyaqa.shared.infrastructure.audit.AuditService
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

/**
 * Service for platform-level agreement management.
 * Allows platform admins to manage agreements for specific clubs without tenant filtering.
 */
@Service
@Transactional
class PlatformAgreementService(
    private val auditService: AuditService
) {
    @PersistenceContext
    private lateinit var entityManager: EntityManager

    // ========================================
    // Agreement Queries
    // ========================================

    /**
     * Gets all agreements for a specific club.
     */
    @Transactional(readOnly = true)
    fun getAgreementsByClub(clubId: UUID, pageable: Pageable): Page<Agreement> {
        val query = entityManager.createQuery(
            """
            SELECT a FROM Agreement a
            WHERE a.tenantId = :tenantId
            ORDER BY a.sortOrder ASC, a.createdAt DESC
            """.trimIndent(),
            Agreement::class.java
        )
        query.setParameter("tenantId", clubId)
        query.firstResult = pageable.offset.toInt()
        query.maxResults = pageable.pageSize

        val agreements = query.resultList

        val countQuery = entityManager.createQuery(
            "SELECT COUNT(a) FROM Agreement a WHERE a.tenantId = :tenantId",
            Long::class.javaObjectType
        )
        countQuery.setParameter("tenantId", clubId)
        val total = countQuery.singleResult

        return PageImpl(agreements, pageable, total)
    }

    /**
     * Gets a specific agreement for a club.
     */
    @Transactional(readOnly = true)
    fun getAgreement(clubId: UUID, agreementId: UUID): Agreement {
        val query = entityManager.createQuery(
            """
            SELECT a FROM Agreement a
            WHERE a.id = :agreementId AND a.tenantId = :tenantId
            """.trimIndent(),
            Agreement::class.java
        )
        query.setParameter("agreementId", agreementId)
        query.setParameter("tenantId", clubId)

        return query.resultList.firstOrNull()
            ?: throw NoSuchElementException("Agreement not found: $agreementId in club: $clubId")
    }

    // ========================================
    // Agreement Mutations
    // ========================================

    /**
     * Creates a new agreement for a club.
     * Sets TenantContext temporarily to ensure the agreement is created for the correct club.
     */
    fun createAgreement(
        clubId: UUID,
        title: LocalizedText,
        content: LocalizedText,
        type: AgreementType,
        isMandatory: Boolean = true,
        sortOrder: Int = 0,
        hasHealthQuestions: Boolean = false,
        effectiveDate: LocalDate? = null
    ): Agreement {
        // Save current tenant context
        val previousTenant = TenantContext.getCurrentTenantOrNull()

        try {
            // Set tenant context to the target club
            TenantContext.setCurrentTenant(TenantId(clubId))

            val agreement = Agreement(
                title = title,
                content = content,
                type = type,
                isMandatory = isMandatory,
                sortOrder = sortOrder,
                hasHealthQuestions = hasHealthQuestions,
                effectiveDate = effectiveDate ?: LocalDate.now()
            )

            entityManager.persist(agreement)
            entityManager.flush() // Ensure the entity is persisted before restoring context

            auditService.log(
                action = AuditAction.CREATE,
                entityType = "Agreement",
                entityId = agreement.id,
                description = "Agreement '${title.en}' created by platform admin for club $clubId"
            )

            return agreement
        } finally {
            // Restore previous tenant context
            if (previousTenant != null) {
                TenantContext.setCurrentTenant(previousTenant)
            } else {
                TenantContext.clear()
            }
        }
    }

    /**
     * Updates an existing agreement.
     */
    fun updateAgreement(
        clubId: UUID,
        agreementId: UUID,
        title: LocalizedText?,
        content: LocalizedText?,
        isMandatory: Boolean?,
        sortOrder: Int?,
        hasHealthQuestions: Boolean?,
        effectiveDate: LocalDate?
    ): Agreement {
        val agreement = getAgreement(clubId, agreementId)

        title?.let { agreement.title = it }
        content?.let {
            agreement.content = it
            agreement.incrementVersion()
        }
        isMandatory?.let { agreement.isMandatory = it }
        sortOrder?.let { agreement.sortOrder = it }
        hasHealthQuestions?.let { agreement.hasHealthQuestions = it }
        effectiveDate?.let { agreement.effectiveDate = it }

        val updatedAgreement = entityManager.merge(agreement)

        auditService.log(
            action = AuditAction.UPDATE,
            entityType = "Agreement",
            entityId = agreementId,
            description = "Agreement updated by platform admin for club $clubId"
        )

        return updatedAgreement
    }

    /**
     * Activates an agreement.
     */
    fun activateAgreement(clubId: UUID, agreementId: UUID): Agreement {
        val agreement = getAgreement(clubId, agreementId)
        agreement.activate()

        val updatedAgreement = entityManager.merge(agreement)

        auditService.log(
            action = AuditAction.STATUS_CHANGE,
            entityType = "Agreement",
            entityId = agreementId,
            description = "Agreement activated by platform admin for club $clubId"
        )

        return updatedAgreement
    }

    /**
     * Deactivates an agreement.
     */
    fun deactivateAgreement(clubId: UUID, agreementId: UUID): Agreement {
        val agreement = getAgreement(clubId, agreementId)
        agreement.deactivate()

        val updatedAgreement = entityManager.merge(agreement)

        auditService.log(
            action = AuditAction.STATUS_CHANGE,
            entityType = "Agreement",
            entityId = agreementId,
            description = "Agreement deactivated by platform admin for club $clubId"
        )

        return updatedAgreement
    }

    /**
     * Deletes (deactivates) an agreement.
     */
    fun deleteAgreement(clubId: UUID, agreementId: UUID) {
        val agreement = getAgreement(clubId, agreementId)
        agreement.deactivate()

        entityManager.merge(agreement)

        auditService.log(
            action = AuditAction.DELETE,
            entityType = "Agreement",
            entityId = agreementId,
            description = "Agreement deleted (deactivated) by platform admin for club $clubId"
        )
    }
}
