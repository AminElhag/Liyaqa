package com.liyaqa.scheduling.infrastructure.persistence

import com.liyaqa.scheduling.domain.model.ClassType
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.GymClassStatus
import com.liyaqa.scheduling.domain.ports.GymClassRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataGymClassRepository : JpaRepository<GymClass, UUID> {
    fun findByStatus(status: GymClassStatus, pageable: Pageable): Page<GymClass>
    fun findByLocationId(locationId: UUID, pageable: Pageable): Page<GymClass>
    fun findByLocationIdAndStatus(locationId: UUID, status: GymClassStatus, pageable: Pageable): Page<GymClass>
    fun findByClassType(classType: ClassType, pageable: Pageable): Page<GymClass>
    fun findByDefaultTrainerId(trainerId: UUID, pageable: Pageable): Page<GymClass>
    fun countByStatus(status: GymClassStatus): Long
}

@Repository
class JpaGymClassRepository(
    private val springDataRepository: SpringDataGymClassRepository
) : GymClassRepository {

    override fun save(gymClass: GymClass): GymClass =
        springDataRepository.save(gymClass)

    override fun findById(id: UUID): Optional<GymClass> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<GymClass> =
        springDataRepository.findAll(pageable)

    override fun findByStatus(status: GymClassStatus, pageable: Pageable): Page<GymClass> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByLocationId(locationId: UUID, pageable: Pageable): Page<GymClass> =
        springDataRepository.findByLocationId(locationId, pageable)

    override fun findByLocationIdAndStatus(
        locationId: UUID,
        status: GymClassStatus,
        pageable: Pageable
    ): Page<GymClass> =
        springDataRepository.findByLocationIdAndStatus(locationId, status, pageable)

    override fun findByClassType(classType: ClassType, pageable: Pageable): Page<GymClass> =
        springDataRepository.findByClassType(classType, pageable)

    override fun findByDefaultTrainerId(trainerId: UUID, pageable: Pageable): Page<GymClass> =
        springDataRepository.findByDefaultTrainerId(trainerId, pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByStatus(status: GymClassStatus): Long =
        springDataRepository.countByStatus(status)
}
