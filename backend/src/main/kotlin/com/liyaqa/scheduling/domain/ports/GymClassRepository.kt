package com.liyaqa.scheduling.domain.ports

import com.liyaqa.scheduling.domain.model.ClassType
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.GymClassStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository interface for GymClass entities.
 */
interface GymClassRepository {
    fun save(gymClass: GymClass): GymClass
    fun findById(id: UUID): Optional<GymClass>
    fun findAll(pageable: Pageable): Page<GymClass>
    fun findByStatus(status: GymClassStatus, pageable: Pageable): Page<GymClass>
    fun findByLocationId(locationId: UUID, pageable: Pageable): Page<GymClass>
    fun findByLocationIdAndStatus(locationId: UUID, status: GymClassStatus, pageable: Pageable): Page<GymClass>
    fun findByClassType(classType: ClassType, pageable: Pageable): Page<GymClass>
    fun findByDefaultTrainerId(trainerId: UUID, pageable: Pageable): Page<GymClass>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countByStatus(status: GymClassStatus): Long
}
