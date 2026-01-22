package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.FreezePackage
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

interface FreezePackageRepository {
    fun save(freezePackage: FreezePackage): FreezePackage
    fun findById(id: UUID): Optional<FreezePackage>
    fun findAll(pageable: Pageable): Page<FreezePackage>
    fun findAllActive(pageable: Pageable): Page<FreezePackage>
    fun findAllActive(): List<FreezePackage>
    fun deleteById(id: UUID)
    fun existsById(id: UUID): Boolean
}
