package com.liyaqa.facilities.infrastructure.persistence

import com.liyaqa.facilities.domain.model.FacilitySlot
import com.liyaqa.facilities.domain.model.SlotStatus
import com.liyaqa.facilities.domain.ports.FacilitySlotRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.*

interface SpringDataFacilitySlotRepository : JpaRepository<FacilitySlot, UUID> {
    fun findByFacilityIdAndSlotDate(facilityId: UUID, slotDate: LocalDate): List<FacilitySlot>
    fun findByFacilityIdAndSlotDateBetween(facilityId: UUID, startDate: LocalDate, endDate: LocalDate): List<FacilitySlot>
    fun findByFacilityIdAndSlotDateAndStatus(facilityId: UUID, slotDate: LocalDate, status: SlotStatus): List<FacilitySlot>
    fun existsByFacilityIdAndSlotDate(facilityId: UUID, slotDate: LocalDate): Boolean

    @Modifying
    @Query("DELETE FROM FacilitySlot s WHERE s.facilityId = :facilityId AND s.slotDate > :date")
    fun deleteByFacilityIdAndSlotDateAfter(@Param("facilityId") facilityId: UUID, @Param("date") date: LocalDate)
}

@Repository
class JpaFacilitySlotRepository(
    private val springDataRepository: SpringDataFacilitySlotRepository
) : FacilitySlotRepository {

    override fun save(slot: FacilitySlot): FacilitySlot =
        springDataRepository.save(slot)

    override fun saveAll(slots: List<FacilitySlot>): List<FacilitySlot> =
        springDataRepository.saveAll(slots)

    override fun findById(id: UUID): Optional<FacilitySlot> =
        springDataRepository.findById(id)

    override fun findByFacilityIdAndSlotDate(facilityId: UUID, slotDate: LocalDate): List<FacilitySlot> =
        springDataRepository.findByFacilityIdAndSlotDate(facilityId, slotDate)

    override fun findByFacilityIdAndSlotDateBetween(facilityId: UUID, startDate: LocalDate, endDate: LocalDate): List<FacilitySlot> =
        springDataRepository.findByFacilityIdAndSlotDateBetween(facilityId, startDate, endDate)

    override fun findByFacilityIdAndSlotDateAndStatus(facilityId: UUID, slotDate: LocalDate, status: SlotStatus): List<FacilitySlot> =
        springDataRepository.findByFacilityIdAndSlotDateAndStatus(facilityId, slotDate, status)

    override fun existsByFacilityIdAndSlotDate(facilityId: UUID, slotDate: LocalDate): Boolean =
        springDataRepository.existsByFacilityIdAndSlotDate(facilityId, slotDate)

    override fun deleteByFacilityIdAndSlotDateAfter(facilityId: UUID, date: LocalDate) =
        springDataRepository.deleteByFacilityIdAndSlotDateAfter(facilityId, date)
}
