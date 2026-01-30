package com.liyaqa.trainer.infrastructure.persistence

import com.liyaqa.trainer.domain.model.TrainerClient
import com.liyaqa.trainer.domain.model.TrainerClientStatus
import com.liyaqa.trainer.domain.ports.TrainerClientRepository
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.domain.PageRequest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Integration tests for JpaTrainerClientRepository.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class JpaTrainerClientRepositoryTest {

    @Autowired
    private lateinit var trainerClientRepository: TrainerClientRepository

    private lateinit var testTenantId: UUID
    private lateinit var testTrainerId: UUID
    private lateinit var testMemberId: UUID

    @BeforeEach
    fun setUp() {
        testTenantId = UUID.randomUUID()
        testTrainerId = UUID.randomUUID()
        testMemberId = UUID.randomUUID()
        TenantContext.setCurrentTenant(TenantId(testTenantId))
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    private fun createTestClient(
        trainerId: UUID = testTrainerId,
        memberId: UUID = testMemberId,
        status: TrainerClientStatus = TrainerClientStatus.ACTIVE,
        startDate: LocalDate = LocalDate.now()
    ): TrainerClient {
        val client = TrainerClient(
            id = UUID.randomUUID(),
            trainerId = trainerId,
            memberId = memberId,
            startDate = startDate,
            status = status
        )
        client.javaClass.superclass.getDeclaredField("tenantId").apply {
            isAccessible = true
            set(client, testTenantId)
        }
        return client
    }

    @Test
    fun `save new client persists to database`() {
        val client = createTestClient()
        val savedClient = trainerClientRepository.save(client)

        val foundClient = trainerClientRepository.findById(savedClient.id)
        assertTrue(foundClient.isPresent)
        assertEquals(client.trainerId, foundClient.get().trainerId)
        assertEquals(client.memberId, foundClient.get().memberId)
        assertNotNull(foundClient.get().createdAt)
    }

    @Test
    fun `findByTrainerIdAndMemberId returns client when exists`() {
        val client = createTestClient()
        trainerClientRepository.save(client)

        val foundClient = trainerClientRepository.findByTrainerIdAndMemberId(testTrainerId, testMemberId)
        assertTrue(foundClient.isPresent)
        assertEquals(client.id, foundClient.get().id)
    }

    @Test
    fun `findByTrainerIdAndMemberId returns empty when not exists`() {
        val foundClient = trainerClientRepository.findByTrainerIdAndMemberId(UUID.randomUUID(), UUID.randomUUID())
        assertFalse(foundClient.isPresent)
    }

    @Test
    fun `findByTrainerId returns all clients for trainer`() {
        val client1 = createTestClient(memberId = UUID.randomUUID())
        val client2 = createTestClient(memberId = UUID.randomUUID())
        val client3 = createTestClient(trainerId = UUID.randomUUID()) // Different trainer

        trainerClientRepository.save(client1)
        trainerClientRepository.save(client2)
        trainerClientRepository.save(client3)

        val clients = trainerClientRepository.findByTrainerId(testTrainerId, PageRequest.of(0, 10))
        assertEquals(2, clients.totalElements)
    }

    @Test
    fun `findByTrainerIdAndStatus filters by status correctly`() {
        val activeClient = createTestClient(status = TrainerClientStatus.ACTIVE, memberId = UUID.randomUUID())
        val inactiveClient = createTestClient(status = TrainerClientStatus.INACTIVE, memberId = UUID.randomUUID())
        val onHoldClient = createTestClient(status = TrainerClientStatus.ON_HOLD, memberId = UUID.randomUUID())

        trainerClientRepository.save(activeClient)
        trainerClientRepository.save(inactiveClient)
        trainerClientRepository.save(onHoldClient)

        val activeClients = trainerClientRepository.findByTrainerIdAndStatus(
            testTrainerId,
            TrainerClientStatus.ACTIVE,
            PageRequest.of(0, 10)
        )
        assertEquals(1, activeClients.totalElements)
        assertEquals(TrainerClientStatus.ACTIVE, activeClients.content[0].status)
    }

    @Test
    fun `findActiveByTrainerId returns only active clients`() {
        val activeClient1 = createTestClient(status = TrainerClientStatus.ACTIVE, memberId = UUID.randomUUID())
        val activeClient2 = createTestClient(status = TrainerClientStatus.ACTIVE, memberId = UUID.randomUUID())
        val inactiveClient = createTestClient(status = TrainerClientStatus.INACTIVE, memberId = UUID.randomUUID())

        trainerClientRepository.save(activeClient1)
        trainerClientRepository.save(activeClient2)
        trainerClientRepository.save(inactiveClient)

        val activeClients = trainerClientRepository.findActiveByTrainerId(testTrainerId, PageRequest.of(0, 10))
        assertEquals(2, activeClients.totalElements)
        assertTrue(activeClients.content.all { it.status == TrainerClientStatus.ACTIVE })
    }

    @Test
    fun `findByMemberId returns all trainers for member`() {
        val trainer1 = UUID.randomUUID()
        val trainer2 = UUID.randomUUID()

        val client1 = createTestClient(trainerId = trainer1)
        val client2 = createTestClient(trainerId = trainer2)

        trainerClientRepository.save(client1)
        trainerClientRepository.save(client2)

        val clients = trainerClientRepository.findByMemberId(testMemberId, PageRequest.of(0, 10))
        assertEquals(2, clients.totalElements)
    }

    @Test
    fun `existsByTrainerIdAndMemberId returns true when relationship exists`() {
        val client = createTestClient()
        trainerClientRepository.save(client)

        val exists = trainerClientRepository.existsByTrainerIdAndMemberId(testTrainerId, testMemberId)
        assertTrue(exists)
    }

    @Test
    fun `existsByTrainerIdAndMemberId returns false when relationship does not exist`() {
        val exists = trainerClientRepository.existsByTrainerIdAndMemberId(UUID.randomUUID(), UUID.randomUUID())
        assertFalse(exists)
    }

    @Test
    fun `update client modifies session statistics`() {
        val client = createTestClient()
        trainerClientRepository.save(client)

        client.recordSessionCompleted(LocalDate.now())
        client.recordSessionCancelled()
        val updatedClient = trainerClientRepository.save(client)

        val foundClient = trainerClientRepository.findById(updatedClient.id).get()
        assertEquals(1, foundClient.completedSessions)
        assertEquals(1, foundClient.cancelledSessions)
    }

    @Test
    fun `delete removes client from database`() {
        val client = createTestClient()
        val savedClient = trainerClientRepository.save(client)

        trainerClientRepository.deleteById(savedClient.id)

        val foundClient = trainerClientRepository.findById(savedClient.id)
        assertFalse(foundClient.isPresent)
    }

    @Test
    fun `count returns correct number of clients`() {
        val client1 = createTestClient(memberId = UUID.randomUUID())
        val client2 = createTestClient(memberId = UUID.randomUUID())

        trainerClientRepository.save(client1)
        trainerClientRepository.save(client2)

        val count = trainerClientRepository.count()
        assertTrue(count >= 2)
    }
}
