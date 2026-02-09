package com.liyaqa.platform.support.repository

import com.liyaqa.platform.support.model.CannedResponse
import com.liyaqa.platform.support.model.TicketCategory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataCannedResponseRepository : JpaRepository<CannedResponse, UUID> {
    fun findByCategory(category: TicketCategory): List<CannedResponse>
    fun findByIsActiveTrue(): List<CannedResponse>
    fun findByCategoryAndIsActiveTrue(category: TicketCategory): List<CannedResponse>
}

@Repository
class JpaCannedResponseRepository(
    private val springDataRepository: SpringDataCannedResponseRepository
) : CannedResponseRepository {

    override fun save(response: CannedResponse): CannedResponse =
        springDataRepository.save(response)

    override fun findById(id: UUID): Optional<CannedResponse> =
        springDataRepository.findById(id)

    override fun findByCategory(category: TicketCategory): List<CannedResponse> =
        springDataRepository.findByCategory(category)

    override fun findByIsActiveTrue(): List<CannedResponse> =
        springDataRepository.findByIsActiveTrue()

    override fun findByCategoryAndIsActiveTrue(category: TicketCategory): List<CannedResponse> =
        springDataRepository.findByCategoryAndIsActiveTrue(category)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)
}
