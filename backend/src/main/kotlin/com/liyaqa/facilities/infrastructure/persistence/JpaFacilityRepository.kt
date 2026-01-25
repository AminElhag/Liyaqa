package com.liyaqa.facilities.infrastructure.persistence

import com.liyaqa.facilities.domain.model.Facility
import com.liyaqa.facilities.domain.model.FacilityStatus
import com.liyaqa.facilities.domain.model.FacilityType
import com.liyaqa.facilities.domain.ports.FacilityRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.*

interface SpringDataFacilityRepository : JpaRepository<Facility, UUID> {
    fun findByLocationId(locationId: UUID, pageable: Pageable): Page<Facility>
    fun findByType(type: FacilityType, pageable: Pageable): Page<Facility>
    fun findByStatus(status: FacilityStatus, pageable: Pageable): Page<Facility>
    fun findByLocationIdAndStatus(locationId: UUID, status: FacilityStatus, pageable: Pageable): Page<Facility>
}

@Repository
class JpaFacilityRepository(
    private val springDataRepository: SpringDataFacilityRepository
) : FacilityRepository {

    override fun save(facility: Facility): Facility =
        springDataRepository.save(facility)

    override fun findById(id: UUID): Optional<Facility> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<Facility> =
        springDataRepository.findAll(pageable)

    override fun findByLocationId(locationId: UUID, pageable: Pageable): Page<Facility> =
        springDataRepository.findByLocationId(locationId, pageable)

    override fun findByType(type: FacilityType, pageable: Pageable): Page<Facility> =
        springDataRepository.findByType(type, pageable)

    override fun findByStatus(status: FacilityStatus, pageable: Pageable): Page<Facility> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByLocationIdAndStatus(locationId: UUID, status: FacilityStatus, pageable: Pageable): Page<Facility> =
        springDataRepository.findByLocationIdAndStatus(locationId, status, pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)
}
