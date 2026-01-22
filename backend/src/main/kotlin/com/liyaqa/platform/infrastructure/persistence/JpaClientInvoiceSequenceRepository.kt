package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.ClientInvoiceSequence
import com.liyaqa.platform.domain.ports.ClientInvoiceSequenceRepository
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataClientInvoiceSequenceRepository : JpaRepository<ClientInvoiceSequence, UUID> {

    companion object {
        val SEQUENCE_ID: UUID = UUID.fromString("00000000-0000-0000-0000-000000000002")
    }

    /**
     * Finds the singleton sequence record with a pessimistic write lock.
     * This ensures thread-safe invoice number generation.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ClientInvoiceSequence s WHERE s.id = :id")
    fun findForUpdate(id: UUID): Optional<ClientInvoiceSequence>
}

@Repository
class JpaClientInvoiceSequenceRepository(
    private val springDataRepository: SpringDataClientInvoiceSequenceRepository
) : ClientInvoiceSequenceRepository {

    override fun save(sequence: ClientInvoiceSequence): ClientInvoiceSequence =
        springDataRepository.save(sequence)

    override fun findById(id: UUID): Optional<ClientInvoiceSequence> =
        springDataRepository.findById(id)

    override fun findForUpdate(): Optional<ClientInvoiceSequence> =
        springDataRepository.findForUpdate(SpringDataClientInvoiceSequenceRepository.SEQUENCE_ID)
}
