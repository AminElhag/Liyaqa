package com.liyaqa.trainer.application.services

import com.liyaqa.trainer.application.commands.*
import com.liyaqa.trainer.domain.model.TrainerClient
import com.liyaqa.trainer.domain.model.TrainerClientStatus
import com.liyaqa.trainer.domain.ports.TrainerClientRepository
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
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TrainerClientServiceTest {

    @Mock
    private lateinit var clientRepository: TrainerClientRepository

    private lateinit var clientService: TrainerClientService

    private lateinit var testTrainerId: UUID
    private lateinit var testMemberId: UUID
    private lateinit var testClient: TrainerClient

    @BeforeEach
    fun setUp() {
        clientService = TrainerClientService(clientRepository)

        testTrainerId = UUID.randomUUID()
        testMemberId = UUID.randomUUID()

        testClient = TrainerClient(
            id = UUID.randomUUID(),
            trainerId = testTrainerId,
            memberId = testMemberId,
            startDate = LocalDate.now(),
            status = TrainerClientStatus.ACTIVE
        )
    }

    // ==================== AUTO-CREATION ====================

    @Test
    fun `getOrCreateClientRelationship returns existing relationship when found`() {
        whenever(clientRepository.findByTrainerIdAndMemberId(testTrainerId, testMemberId))
            .thenReturn(Optional.of(testClient))

        val result = clientService.getOrCreateClientRelationship(testTrainerId, testMemberId)

        assertEquals(testClient.id, result.id)
        verify(clientRepository, never()).save(any())
    }

    @Test
    fun `getOrCreateClientRelationship creates new relationship when not found`() {
        whenever(clientRepository.findByTrainerIdAndMemberId(testTrainerId, testMemberId))
            .thenReturn(Optional.empty())

        whenever(clientRepository.save(any())).thenAnswer { it.arguments[0] as TrainerClient }

        val result = clientService.getOrCreateClientRelationship(testTrainerId, testMemberId)

        assertEquals(testTrainerId, result.trainerId)
        assertEquals(testMemberId, result.memberId)
        assertEquals(TrainerClientStatus.ACTIVE, result.status)
        verify(clientRepository).save(any())
    }

    // ==================== SESSION TRACKING ====================

    @Test
    fun `recordSessionCreated increments session count`() {
        whenever(clientRepository.findByTrainerIdAndMemberId(testTrainerId, testMemberId))
            .thenReturn(Optional.of(testClient))
        whenever(clientRepository.save(any())).thenAnswer { it.arguments[0] as TrainerClient }

        clientService.recordSessionCreated(testTrainerId, testMemberId)

        verify(clientRepository).save(argThat { totalSessions == 1 })
    }

    @Test
    fun `recordSessionCompleted increments completed sessions and updates last session date`() {
        val sessionDate = LocalDate.now()
        whenever(clientRepository.findByTrainerIdAndMemberId(testTrainerId, testMemberId))
            .thenReturn(Optional.of(testClient))
        whenever(clientRepository.save(any())).thenAnswer { it.arguments[0] as TrainerClient }

        clientService.recordSessionCompleted(testTrainerId, testMemberId, sessionDate)

        verify(clientRepository).save(argThat {
            completedSessions == 1 && lastSessionDate == sessionDate
        })
    }

    @Test
    fun `recordSessionCancelled increments cancelled sessions`() {
        whenever(clientRepository.findByTrainerIdAndMemberId(testTrainerId, testMemberId))
            .thenReturn(Optional.of(testClient))
        whenever(clientRepository.save(any())).thenAnswer { it.arguments[0] as TrainerClient }

        clientService.recordSessionCancelled(testTrainerId, testMemberId)

        verify(clientRepository).save(argThat { cancelledSessions == 1 })
    }

    @Test
    fun `recordNoShow increments no-show sessions and updates last session date`() {
        val sessionDate = LocalDate.now()
        whenever(clientRepository.findByTrainerIdAndMemberId(testTrainerId, testMemberId))
            .thenReturn(Optional.of(testClient))
        whenever(clientRepository.save(any())).thenAnswer { it.arguments[0] as TrainerClient }

        clientService.recordNoShow(testTrainerId, testMemberId, sessionDate)

        verify(clientRepository).save(argThat {
            noShowSessions == 1 && lastSessionDate == sessionDate
        })
    }

    // ==================== CREATE & UPDATE ====================

    @Test
    fun `createClient creates new client relationship`() {
        val command = CreateTrainerClientCommand(
            trainerId = testTrainerId,
            memberId = testMemberId,
            goalsEn = "Lose weight",
            goalsAr = "إنقاص الوزن"
        )

        whenever(clientRepository.findByTrainerIdAndMemberId(testTrainerId, testMemberId))
            .thenReturn(Optional.empty())
        whenever(clientRepository.save(any())).thenAnswer { it.arguments[0] as TrainerClient }

        val result = clientService.createClient(command)

        assertEquals(testTrainerId, result.trainerId)
        assertEquals(testMemberId, result.memberId)
        assertEquals("Lose weight", result.goalsEn)
        verify(clientRepository).save(any())
    }

    @Test
    fun `createClient throws exception when relationship already exists`() {
        val command = CreateTrainerClientCommand(
            trainerId = testTrainerId,
            memberId = testMemberId
        )

        whenever(clientRepository.findByTrainerIdAndMemberId(testTrainerId, testMemberId))
            .thenReturn(Optional.of(testClient))

        assertThrows(IllegalStateException::class.java) {
            clientService.createClient(command)
        }
    }

    @Test
    fun `updateClientGoals updates goals successfully`() {
        val command = UpdateClientGoalsCommand(
            clientId = testClient.id,
            goalsEn = "Build muscle",
            goalsAr = "بناء العضلات"
        )

        whenever(clientRepository.findById(testClient.id)).thenReturn(Optional.of(testClient))
        whenever(clientRepository.save(any())).thenAnswer { it.arguments[0] as TrainerClient }

        val result = clientService.updateClientGoals(command)

        assertEquals("Build muscle", result.goalsEn)
        assertEquals("بناء العضلات", result.goalsAr)
        verify(clientRepository).save(any())
    }

    @Test
    fun `updateClientNotes updates notes successfully`() {
        val command = UpdateClientNotesCommand(
            clientId = testClient.id,
            notesEn = "Works hard",
            notesAr = "مجتهد"
        )

        whenever(clientRepository.findById(testClient.id)).thenReturn(Optional.of(testClient))
        whenever(clientRepository.save(any())).thenAnswer { it.arguments[0] as TrainerClient }

        val result = clientService.updateClientNotes(command)

        assertEquals("Works hard", result.notesEn)
        assertEquals("مجتهد", result.notesAr)
        verify(clientRepository).save(any())
    }

    // ==================== STATUS TRANSITIONS ====================

    @Test
    fun `deactivate sets client status to INACTIVE`() {
        val endDate = LocalDate.now()
        val command = DeactivateClientCommand(
            clientId = testClient.id,
            endDate = endDate
        )

        whenever(clientRepository.findById(testClient.id)).thenReturn(Optional.of(testClient))
        whenever(clientRepository.save(any())).thenAnswer { it.arguments[0] as TrainerClient }

        val result = clientService.deactivate(command)

        assertEquals(TrainerClientStatus.INACTIVE, result.status)
        assertEquals(endDate, result.endDate)
        verify(clientRepository).save(any())
    }

    @Test
    fun `reactivate sets client status to ACTIVE`() {
        testClient.status = TrainerClientStatus.INACTIVE
        val command = ReactivateClientCommand(clientId = testClient.id)

        whenever(clientRepository.findById(testClient.id)).thenReturn(Optional.of(testClient))
        whenever(clientRepository.save(any())).thenAnswer { it.arguments[0] as TrainerClient }

        val result = clientService.reactivate(command)

        assertEquals(TrainerClientStatus.ACTIVE, result.status)
        assertNull(result.endDate)
        verify(clientRepository).save(any())
    }

    @Test
    fun `complete sets client status to COMPLETED`() {
        val endDate = LocalDate.now()
        val command = CompleteClientCommand(
            clientId = testClient.id,
            endDate = endDate
        )

        whenever(clientRepository.findById(testClient.id)).thenReturn(Optional.of(testClient))
        whenever(clientRepository.save(any())).thenAnswer { it.arguments[0] as TrainerClient }

        val result = clientService.complete(command)

        assertEquals(TrainerClientStatus.COMPLETED, result.status)
        assertEquals(endDate, result.endDate)
        verify(clientRepository).save(any())
    }

    @Test
    fun `putOnHold sets client status to ON_HOLD`() {
        whenever(clientRepository.findById(testClient.id)).thenReturn(Optional.of(testClient))
        whenever(clientRepository.save(any())).thenAnswer { it.arguments[0] as TrainerClient }

        val result = clientService.putOnHold(testClient.id)

        assertEquals(TrainerClientStatus.ON_HOLD, result.status)
        verify(clientRepository).save(any())
    }

    // ==================== QUERY OPERATIONS ====================

    @Test
    fun `getClient returns client by id`() {
        whenever(clientRepository.findById(testClient.id)).thenReturn(Optional.of(testClient))

        val result = clientService.getClient(testClient.id)

        assertEquals(testClient.id, result.id)
    }

    @Test
    fun `getClient throws exception when not found`() {
        whenever(clientRepository.findById(any())).thenReturn(Optional.empty())

        assertThrows(NoSuchElementException::class.java) {
            clientService.getClient(UUID.randomUUID())
        }
    }

    @Test
    fun `getClientsForTrainer returns paginated clients`() {
        val clients = listOf(testClient)
        val page = PageImpl(clients, PageRequest.of(0, 10), 1)

        whenever(clientRepository.findByTrainerId(testTrainerId, PageRequest.of(0, 10)))
            .thenReturn(page)

        val result = clientService.getClientsForTrainer(testTrainerId, PageRequest.of(0, 10))

        assertEquals(1, result.totalElements)
        assertEquals(testClient.id, result.content[0].id)
    }

    @Test
    fun `getActiveClientsForTrainer returns only active clients`() {
        val clients = listOf(testClient)
        val page = PageImpl(clients, PageRequest.of(0, 10), 1)

        whenever(clientRepository.findActiveByTrainerId(testTrainerId, PageRequest.of(0, 10)))
            .thenReturn(page)

        val result = clientService.getActiveClientsForTrainer(testTrainerId, PageRequest.of(0, 10))

        assertEquals(1, result.totalElements)
        assertTrue(result.content.all { it.status == TrainerClientStatus.ACTIVE })
    }

    @Test
    fun `relationshipExists returns true when relationship exists`() {
        whenever(clientRepository.existsByTrainerIdAndMemberId(testTrainerId, testMemberId))
            .thenReturn(true)

        val result = clientService.relationshipExists(testTrainerId, testMemberId)

        assertTrue(result)
    }

    @Test
    fun `relationshipExists returns false when relationship does not exist`() {
        whenever(clientRepository.existsByTrainerIdAndMemberId(any(), any()))
            .thenReturn(false)

        val result = clientService.relationshipExists(UUID.randomUUID(), UUID.randomUUID())

        assertFalse(result)
    }

    @Test
    fun `getClientByTrainerAndMember returns client when found`() {
        whenever(clientRepository.findByTrainerIdAndMemberId(testTrainerId, testMemberId))
            .thenReturn(Optional.of(testClient))

        val result = clientService.getClientByTrainerAndMember(testTrainerId, testMemberId)

        assertNotNull(result)
        assertEquals(testClient.id, result!!.id)
    }

    @Test
    fun `getClientByTrainerAndMember returns null when not found`() {
        whenever(clientRepository.findByTrainerIdAndMemberId(any(), any()))
            .thenReturn(Optional.empty())

        val result = clientService.getClientByTrainerAndMember(UUID.randomUUID(), UUID.randomUUID())

        assertNull(result)
    }

    @Test
    fun `deleteClient deletes client successfully`() {
        whenever(clientRepository.existsById(testClient.id)).thenReturn(true)

        clientService.deleteClient(testClient.id)

        verify(clientRepository).deleteById(testClient.id)
    }

    @Test
    fun `deleteClient throws exception when client not found`() {
        whenever(clientRepository.existsById(any())).thenReturn(false)

        assertThrows(IllegalArgumentException::class.java) {
            clientService.deleteClient(UUID.randomUUID())
        }
    }
}
