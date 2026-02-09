package com.liyaqa.platform.support.repository

import com.liyaqa.platform.support.model.TicketSequence
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataTicketSequenceRepository : JpaRepository<TicketSequence, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM TicketSequence s WHERE s.id = :id")
    fun findByIdForUpdate(id: UUID): Optional<TicketSequence>
}

@Repository
class JpaTicketSequenceRepository(
    private val springDataRepository: SpringDataTicketSequenceRepository
) : TicketSequenceRepository {

    override fun findForUpdate(): Optional<TicketSequence> =
        springDataRepository.findByIdForUpdate(TicketSequence.SINGLETON_ID)

    override fun save(seq: TicketSequence): TicketSequence =
        springDataRepository.save(seq)
}
