package com.liyaqa.facilities.domain.ports

import com.liyaqa.facilities.domain.model.Facility
import com.liyaqa.facilities.domain.model.FacilityStatus
import com.liyaqa.facilities.domain.model.FacilityType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.*

interface FacilityRepository {
    fun save(facility: Facility): Facility
    fun findById(id: UUID): Optional<Facility>
    fun findAll(pageable: Pageable): Page<Facility>
    fun findByLocationId(locationId: UUID, pageable: Pageable): Page<Facility>
    fun findByType(type: FacilityType, pageable: Pageable): Page<Facility>
    fun findByStatus(status: FacilityStatus, pageable: Pageable): Page<Facility>
    fun findByLocationIdAndStatus(locationId: UUID, status: FacilityStatus, pageable: Pageable): Page<Facility>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
}
