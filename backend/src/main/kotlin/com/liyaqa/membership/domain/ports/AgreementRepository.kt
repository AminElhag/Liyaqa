package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.Agreement
import com.liyaqa.membership.domain.model.AgreementType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Port (interface) for agreement persistence operations.
 */
interface AgreementRepository {
    fun save(agreement: Agreement): Agreement
    fun findById(id: UUID): Optional<Agreement>
    fun findAll(pageable: Pageable): Page<Agreement>
    fun findAllActive(pageable: Pageable): Page<Agreement>
    fun findAllMandatory(): List<Agreement>
    fun findByType(type: AgreementType): List<Agreement>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun existsByTitleAndType(titleEn: String, titleAr: String?, type: AgreementType): Boolean
    fun existsByTitleAndTypeExcluding(titleEn: String, titleAr: String?, type: AgreementType, excludeId: UUID): Boolean
}
