package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.FreezePackage
import com.liyaqa.membership.domain.ports.FreezePackageRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

@Repository
class JpaFreezePackageRepository(
    private val springData: SpringDataFreezePackageRepository
) : FreezePackageRepository {

    override fun save(freezePackage: FreezePackage): FreezePackage = springData.save(freezePackage)

    override fun findById(id: UUID): Optional<FreezePackage> = springData.findById(id)

    override fun findAll(pageable: Pageable): Page<FreezePackage> = springData.findAll(pageable)

    override fun findAllActive(pageable: Pageable): Page<FreezePackage> =
        springData.findByIsActiveTrue(pageable)

    override fun findAllActive(): List<FreezePackage> = springData.findByIsActiveTrue()

    override fun deleteById(id: UUID) = springData.deleteById(id)

    override fun existsById(id: UUID): Boolean = springData.existsById(id)
}

interface SpringDataFreezePackageRepository : JpaRepository<FreezePackage, UUID> {
    fun findByIsActiveTrue(pageable: Pageable): Page<FreezePackage>
    fun findByIsActiveTrue(): List<FreezePackage>
}
