package com.liyaqa.facilities.domain.ports

import com.liyaqa.facilities.domain.model.FacilitySlot
import com.liyaqa.facilities.domain.model.SlotStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.*

interface FacilitySlotRepository {
    fun save(slot: FacilitySlot): FacilitySlot
    fun saveAll(slots: List<FacilitySlot>): List<FacilitySlot>
    fun findById(id: UUID): Optional<FacilitySlot>
    fun findByFacilityIdAndSlotDate(facilityId: UUID, slotDate: LocalDate): List<FacilitySlot>
    fun findByFacilityIdAndSlotDateBetween(facilityId: UUID, startDate: LocalDate, endDate: LocalDate): List<FacilitySlot>
    fun findByFacilityIdAndSlotDateAndStatus(facilityId: UUID, slotDate: LocalDate, status: SlotStatus): List<FacilitySlot>
    fun existsByFacilityIdAndSlotDate(facilityId: UUID, slotDate: LocalDate): Boolean
    fun deleteByFacilityIdAndSlotDateAfter(facilityId: UUID, date: LocalDate)
}
