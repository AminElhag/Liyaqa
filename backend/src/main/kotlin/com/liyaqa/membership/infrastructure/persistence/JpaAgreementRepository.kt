package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.Agreement
import com.liyaqa.membership.domain.model.AgreementType
import com.liyaqa.membership.domain.ports.AgreementRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for Agreement.
 */
interface SpringDataAgreementRepository : JpaRepository<Agreement, UUID> {
    fun findByIsActiveTrue(pageable: Pageable): Page<Agreement>

    @Query("SELECT a FROM Agreement a WHERE a.isActive = true AND a.isMandatory = true ORDER BY a.sortOrder")
    fun findAllMandatory(): List<Agreement>

    fun findByType(type: AgreementType): List<Agreement>

    @Query("""
        SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Agreement a
        WHERE a.title.en = :titleEn
        AND (:titleAr IS NULL AND a.title.ar IS NULL OR a.title.ar = :titleAr)
        AND a.type = :type
    """)
    fun existsByTitleEnAndTitleArAndType(titleEn: String, titleAr: String?, type: AgreementType): Boolean

    @Query("""
        SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Agreement a
        WHERE a.title.en = :titleEn
        AND (:titleAr IS NULL AND a.title.ar IS NULL OR a.title.ar = :titleAr)
        AND a.type = :type
        AND a.id <> :excludeId
    """)
    fun existsByTitleEnAndTitleArAndTypeAndIdNot(titleEn: String, titleAr: String?, type: AgreementType, excludeId: UUID): Boolean
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaAgreementRepository(
    private val springDataRepository: SpringDataAgreementRepository
) : AgreementRepository {

    override fun save(agreement: Agreement): Agreement {
        return springDataRepository.save(agreement)
    }

    override fun findById(id: UUID): Optional<Agreement> {
        return springDataRepository.findById(id)
    }

    override fun findAll(pageable: Pageable): Page<Agreement> {
        return springDataRepository.findAll(pageable)
    }

    override fun findAllActive(pageable: Pageable): Page<Agreement> {
        return springDataRepository.findByIsActiveTrue(pageable)
    }

    override fun findAllMandatory(): List<Agreement> {
        return springDataRepository.findAllMandatory()
    }

    override fun findByType(type: AgreementType): List<Agreement> {
        return springDataRepository.findByType(type)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }

    override fun existsByTitleAndType(titleEn: String, titleAr: String?, type: AgreementType): Boolean {
        return springDataRepository.existsByTitleEnAndTitleArAndType(titleEn, titleAr, type)
    }

    override fun existsByTitleAndTypeExcluding(titleEn: String, titleAr: String?, type: AgreementType, excludeId: UUID): Boolean {
        return springDataRepository.existsByTitleEnAndTitleArAndTypeAndIdNot(titleEn, titleAr, type, excludeId)
    }
}
