package com.liyaqa.trainer.domain.ports

import com.liyaqa.scheduling.domain.model.DayOfWeek
import com.liyaqa.scheduling.domain.model.TrainerAvailabilityStatus
import com.liyaqa.trainer.domain.model.TrainerAvailability
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface TrainerAvailabilityRepository {
    fun save(availability: TrainerAvailability): TrainerAvailability
    fun saveAll(availabilities: List<TrainerAvailability>): List<TrainerAvailability>
    fun findById(id: UUID): Optional<TrainerAvailability>
    fun findByTrainerId(trainerId: UUID): List<TrainerAvailability>
    fun findByTrainerIdAndStatus(trainerId: UUID, status: TrainerAvailabilityStatus): List<TrainerAvailability>
    fun findByTrainerIdAndDayOfWeek(trainerId: UUID, dayOfWeek: DayOfWeek): List<TrainerAvailability>
    fun findAvailableByTrainerIdAndDayOfWeek(trainerId: UUID, dayOfWeek: DayOfWeek, date: LocalDate): List<TrainerAvailability>
    fun deleteById(id: UUID)
    fun existsByTrainerId(trainerId: UUID): Boolean
    fun deleteByTrainerId(trainerId: UUID)
}
