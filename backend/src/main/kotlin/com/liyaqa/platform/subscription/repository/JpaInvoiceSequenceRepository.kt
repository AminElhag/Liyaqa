package com.liyaqa.platform.subscription.repository

import com.liyaqa.platform.subscription.model.InvoiceSequence
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface PlatformSpringDataInvoiceSequenceRepository : JpaRepository<InvoiceSequence, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SubscriptionInvoiceSequence s WHERE s.id = :id")
    fun findByIdForUpdate(id: UUID): Optional<InvoiceSequence>
}

@Repository("platformInvoiceSequenceRepository")
class JpaInvoiceSequenceRepository(
    private val springDataRepository: PlatformSpringDataInvoiceSequenceRepository
) : InvoiceSequenceRepository {

    override fun findForUpdate(): Optional<InvoiceSequence> =
        springDataRepository.findByIdForUpdate(InvoiceSequence.SINGLETON_ID)

    override fun save(seq: InvoiceSequence): InvoiceSequence =
        springDataRepository.save(seq)
}
