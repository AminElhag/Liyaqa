package com.liyaqa.scheduling.api

import com.liyaqa.trainer.application.services.AvailabilitySlotInput
import com.liyaqa.trainer.application.services.BlockSlotCommand
import com.liyaqa.trainer.application.services.TrainerAvailabilityService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/trainer-availability")
class TrainerAvailabilityController(
    private val trainerAvailabilityService: TrainerAvailabilityService
) {

    @PutMapping("/{trainerId}")
    @PreAuthorize("hasAuthority('trainers_update') or @trainerSecurityService.isOwnProfile(#trainerId)")
    fun setAvailability(
        @PathVariable trainerId: UUID,
        @Valid @RequestBody request: SetTrainerAvailabilityRequest
    ): ResponseEntity<List<TrainerAvailabilitySlotResponse>> {
        val slots = request.slots.map { slot ->
            AvailabilitySlotInput(
                dayOfWeek = slot.dayOfWeek,
                startTime = slot.startTime,
                endTime = slot.endTime,
                locationType = slot.locationType,
                locationId = slot.locationId,
                isRecurring = slot.isRecurring,
                effectiveFrom = slot.effectiveFrom,
                effectiveUntil = slot.effectiveUntil
            )
        }

        val saved = trainerAvailabilityService.setAvailability(trainerId, slots)
        return ResponseEntity.ok(saved.map { TrainerAvailabilitySlotResponse.from(it) })
    }

    @GetMapping("/{trainerId}")
    @PreAuthorize("hasAuthority('trainers_view') or @trainerSecurityService.isOwnProfile(#trainerId)")
    fun getAvailability(
        @PathVariable trainerId: UUID
    ): ResponseEntity<List<TrainerAvailabilitySlotResponse>> {
        val slots = trainerAvailabilityService.getAvailability(trainerId)
        return ResponseEntity.ok(slots.map { TrainerAvailabilitySlotResponse.from(it) })
    }

    @GetMapping("/{trainerId}/slots")
    @PreAuthorize("hasAuthority('trainers_view') or @trainerSecurityService.isOwnProfile(#trainerId)")
    fun getAvailableSlots(
        @PathVariable trainerId: UUID,
        @RequestParam date: LocalDate
    ): ResponseEntity<List<TrainerAvailabilitySlotResponse>> {
        val slots = trainerAvailabilityService.getAvailableSlots(trainerId, date)
        return ResponseEntity.ok(slots.map { TrainerAvailabilitySlotResponse.from(it) })
    }

    @PostMapping("/{trainerId}/block")
    @PreAuthorize("hasAuthority('trainers_update') or @trainerSecurityService.isOwnProfile(#trainerId)")
    fun blockSlot(
        @PathVariable trainerId: UUID,
        @Valid @RequestBody request: BlockSlotRequest
    ): ResponseEntity<TrainerAvailabilitySlotResponse> {
        val slot = trainerAvailabilityService.blockSlot(
            BlockSlotCommand(
                trainerId = trainerId,
                dayOfWeek = request.dayOfWeek,
                startTime = request.startTime,
                endTime = request.endTime,
                effectiveFrom = request.effectiveFrom,
                effectiveUntil = request.effectiveUntil
            )
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(TrainerAvailabilitySlotResponse.from(slot))
    }
}
