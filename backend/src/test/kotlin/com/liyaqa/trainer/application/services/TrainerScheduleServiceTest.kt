package com.liyaqa.trainer.application.services

import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.trainer.domain.model.PTSessionStatus
import com.liyaqa.trainer.domain.model.PersonalTrainingSession
import com.liyaqa.trainer.domain.model.Trainer
import com.liyaqa.trainer.domain.ports.PersonalTrainingSessionRepository
import com.liyaqa.trainer.domain.ports.TrainerRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.*
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.time.LocalDate
import java.time.LocalTime
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TrainerScheduleServiceTest {

    @Mock
    private lateinit var ptSessionRepository: PersonalTrainingSessionRepository

    @Mock
    private lateinit var classSessionRepository: ClassSessionRepository

    @Mock
    private lateinit var trainerRepository: TrainerRepository

    private lateinit var scheduleService: TrainerScheduleService

    private lateinit var testTrainerId: UUID
    private lateinit var testTrainer: Trainer
    private lateinit var testPTSession: PersonalTrainingSession
    private lateinit var testClassSession: ClassSession

    @BeforeEach
    fun setUp() {
        scheduleService = TrainerScheduleService(
            ptSessionRepository,
            classSessionRepository,
            trainerRepository
        )

        testTrainerId = UUID.randomUUID()

        testTrainer = Trainer(
            id = testTrainerId,
            userId = UUID.randomUUID()
        )

        testPTSession = PersonalTrainingSession.create(
            trainerId = testTrainerId,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now(),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            durationMinutes = 60
        ).apply {
            this.status = PTSessionStatus.CONFIRMED
        }

        testClassSession = ClassSession(
            id = UUID.randomUUID(),
            gymClassId = UUID.randomUUID(),
            trainerId = testTrainerId,
            locationId = UUID.randomUUID(),
            sessionDate = LocalDate.now(),
            startTime = LocalTime.of(14, 0),
            endTime = LocalTime.of(15, 0),
            maxCapacity = 20,
            status = SessionStatus.SCHEDULED
        )
    }

    // ==================== SCHEDULE AGGREGATION ====================

    @Test
    fun `getSchedule aggregates PT and class sessions`() {
        val startDate = LocalDate.now()
        val endDate = LocalDate.now().plusDays(7)

        val ptPage = PageImpl(listOf(testPTSession), PageRequest.of(0, 1000), 1)
        val classPage = PageImpl(listOf(testClassSession), PageRequest.of(0, 1000), 1)

        whenever(ptSessionRepository.findByTrainerIdAndSessionDateBetween(
            eq(testTrainerId), eq(startDate), eq(endDate), any()
        )).thenReturn(ptPage)

        whenever(classSessionRepository.findByTrainerId(eq(testTrainerId), any()))
            .thenReturn(classPage)

        val result = scheduleService.getSchedule(testTrainerId, startDate, endDate)

        assertEquals(testTrainerId, result.trainerId)
        assertEquals(2, result.items.size)
        assertTrue(result.items.any { it is ScheduleItem.PersonalTraining })
        assertTrue(result.items.any { it is ScheduleItem.GroupClass })
    }

    @Test
    fun `getSchedule validates date range maximum`() {
        val startDate = LocalDate.now()
        val endDate = LocalDate.now().plusDays(31)

        assertThrows(IllegalArgumentException::class.java) {
            scheduleService.getSchedule(testTrainerId, startDate, endDate)
        }
    }

    @Test
    fun `getSchedule validates start date before end date`() {
        val startDate = LocalDate.now().plusDays(7)
        val endDate = LocalDate.now()

        assertThrows(IllegalArgumentException::class.java) {
            scheduleService.getSchedule(testTrainerId, startDate, endDate)
        }
    }

    @Test
    fun `getTodaySchedule returns schedule for today`() {
        val today = LocalDate.now()
        val ptPage = PageImpl(listOf(testPTSession), PageRequest.of(0, 1000), 1)

        whenever(ptSessionRepository.findByTrainerIdAndSessionDateBetween(
            eq(testTrainerId), eq(today), eq(today), any()
        )).thenReturn(ptPage)

        whenever(classSessionRepository.findByTrainerId(any(), any()))
            .thenReturn(PageImpl(emptyList(), PageRequest.of(0, 1000), 0))

        val result = scheduleService.getTodaySchedule(testTrainerId)

        assertEquals(today, result.startDate)
        assertEquals(today, result.endDate)
    }

    // ==================== CONFLICT DETECTION ====================

    @Test
    fun `detectConflicts identifies overlapping sessions`() {
        val conflictingPT = PersonalTrainingSession.create(
            trainerId = testTrainerId,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now(),
            startTime = LocalTime.of(10, 30),  // Overlaps with testPTSession (10:00-11:00)
            endTime = LocalTime.of(11, 30),
            durationMinutes = 60
        ).apply {
            this.status = PTSessionStatus.CONFIRMED
        }

        val items = listOf(
            ScheduleItem.PersonalTraining(testPTSession),
            ScheduleItem.PersonalTraining(conflictingPT)
        )

        val conflicts = scheduleService.detectConflicts(items)

        assertEquals(1, conflicts.size)
        assertEquals(LocalTime.of(10, 30), conflicts[0].overlapStart)
        assertEquals(LocalTime.of(11, 0), conflicts[0].overlapEnd)
    }

    @Test
    fun `detectConflicts ignores non-overlapping sessions`() {
        val nonConflictingPT = PersonalTrainingSession.create(
            trainerId = testTrainerId,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now(),
            startTime = LocalTime.of(12, 0),
            endTime = LocalTime.of(13, 0),
            durationMinutes = 60
        ).apply {
            this.status = PTSessionStatus.CONFIRMED
        }

        val items = listOf(
            ScheduleItem.PersonalTraining(testPTSession),  // 10:00-11:00
            ScheduleItem.PersonalTraining(nonConflictingPT) // 12:00-13:00
        )

        val conflicts = scheduleService.detectConflicts(items)

        assertEquals(0, conflicts.size)
    }

    @Test
    fun `detectConflicts ignores non-active sessions`() {
        val cancelledPT = PersonalTrainingSession.create(
            trainerId = testTrainerId,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now(),
            startTime = LocalTime.of(10, 30),
            endTime = LocalTime.of(11, 30),
            durationMinutes = 60
        ).apply {
            this.status = PTSessionStatus.CANCELLED
        }

        val items = listOf(
            ScheduleItem.PersonalTraining(testPTSession),
            ScheduleItem.PersonalTraining(cancelledPT)
        )

        val conflicts = scheduleService.detectConflicts(items)

        assertEquals(0, conflicts.size)
    }

    // ==================== AVAILABILITY CHECKING ====================

    @Test
    fun `isTimeSlotAvailable returns true when no conflicts exist`() {
        whenever(ptSessionRepository.isTimeSlotAvailable(
            testTrainerId, LocalDate.now(), LocalTime.of(12, 0), LocalTime.of(13, 0)
        )).thenReturn(true)

        whenever(classSessionRepository.findByTrainerId(any(), any()))
            .thenReturn(PageImpl(emptyList(), PageRequest.of(0, 100), 0))

        val result = scheduleService.isTimeSlotAvailable(
            testTrainerId, LocalDate.now(), LocalTime.of(12, 0), LocalTime.of(13, 0)
        )

        assertTrue(result)
    }

    @Test
    fun `isTimeSlotAvailable returns false when PT conflict exists`() {
        whenever(ptSessionRepository.isTimeSlotAvailable(any(), any(), any(), any()))
            .thenReturn(false)

        val result = scheduleService.isTimeSlotAvailable(
            testTrainerId, LocalDate.now(), LocalTime.of(10, 30), LocalTime.of(11, 30)
        )

        assertFalse(result)
    }

    @Test
    fun `getAvailableSlots returns available time slots`() {
        whenever(trainerRepository.findById(testTrainerId)).thenReturn(Optional.of(testTrainer))
        whenever(ptSessionRepository.findByTrainerIdAndSessionDateBetween(
            eq(testTrainerId), any(), any(), any()
        )).thenReturn(PageImpl(emptyList(), PageRequest.of(0, 1000), 0))
        whenever(classSessionRepository.findByTrainerId(any(), any()))
            .thenReturn(PageImpl(emptyList(), PageRequest.of(0, 1000), 0))

        val result = scheduleService.getAvailableSlots(testTrainerId, LocalDate.now(), 60)

        assertTrue(result.isNotEmpty())
        assertTrue(result.all { it.durationMinutes >= 60 })
    }
}
