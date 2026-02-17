package com.liyaqa.trainer.infrastructure.persistence

import com.liyaqa.scheduling.domain.model.DayOfWeek
import com.liyaqa.scheduling.domain.model.TrainerAvailabilityStatus
import com.liyaqa.trainer.domain.model.TrainerAvailability
import com.liyaqa.trainer.domain.ports.TrainerAvailabilityRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for TrainerAvailability entity.
 */
interface SpringDataTrainerAvailabilityRepository : JpaRepository<TrainerAvailability, UUID> {

    fun findByTrainerId(trainerId: UUID): List<TrainerAvailability>

    fun findByTrainerIdAndStatus(trainerId: UUID, status: TrainerAvailabilityStatus): List<TrainerAvailability>

    fun findByTrainerIdAndDayOfWeek(trainerId: UUID, dayOfWeek: DayOfWeek): List<TrainerAvailability>

    @Query("""
        SELECT ta FROM TrainerAvailability ta
        WHERE ta.trainerId = :trainerId
        AND ta.dayOfWeek = :dayOfWeek
        AND ta.status = 'AVAILABLE'
        AND ta.effectiveFrom <= :date
        AND (ta.effectiveUntil IS NULL OR ta.effectiveUntil >= :date)
    """)
    fun findAvailableByTrainerIdAndDayOfWeek(
        @Param("trainerId") trainerId: UUID,
        @Param("dayOfWeek") dayOfWeek: DayOfWeek,
        @Param("date") date: LocalDate
    ): List<TrainerAvailability>

    fun existsByTrainerId(trainerId: UUID): Boolean

    fun deleteByTrainerId(trainerId: UUID)
}

/**
 * Adapter implementing TrainerAvailabilityRepository using Spring Data JPA.
 */
@Repository
class JpaTrainerAvailabilityRepository(
    private val springDataRepository: SpringDataTrainerAvailabilityRepository
) : TrainerAvailabilityRepository {

    override fun save(availability: TrainerAvailability): TrainerAvailability {
        return springDataRepository.save(availability)
    }

    override fun saveAll(availabilities: List<TrainerAvailability>): List<TrainerAvailability> {
        return springDataRepository.saveAll(availabilities)
    }

    override fun findById(id: UUID): Optional<TrainerAvailability> {
        return springDataRepository.findById(id)
    }

    override fun findByTrainerId(trainerId: UUID): List<TrainerAvailability> {
        return springDataRepository.findByTrainerId(trainerId)
    }

    override fun findByTrainerIdAndStatus(trainerId: UUID, status: TrainerAvailabilityStatus): List<TrainerAvailability> {
        return springDataRepository.findByTrainerIdAndStatus(trainerId, status)
    }

    override fun findByTrainerIdAndDayOfWeek(trainerId: UUID, dayOfWeek: DayOfWeek): List<TrainerAvailability> {
        return springDataRepository.findByTrainerIdAndDayOfWeek(trainerId, dayOfWeek)
    }

    override fun findAvailableByTrainerIdAndDayOfWeek(trainerId: UUID, dayOfWeek: DayOfWeek, date: LocalDate): List<TrainerAvailability> {
        return springDataRepository.findAvailableByTrainerIdAndDayOfWeek(trainerId, dayOfWeek, date)
    }

    override fun existsByTrainerId(trainerId: UUID): Boolean {
        return springDataRepository.existsByTrainerId(trainerId)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun deleteByTrainerId(trainerId: UUID) {
        springDataRepository.deleteByTrainerId(trainerId)
    }
}
