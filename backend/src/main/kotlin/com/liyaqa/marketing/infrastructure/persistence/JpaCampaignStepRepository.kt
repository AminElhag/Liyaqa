package com.liyaqa.marketing.infrastructure.persistence

import com.liyaqa.marketing.domain.model.CampaignStep
import com.liyaqa.marketing.domain.ports.CampaignStepRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataCampaignStepRepository : JpaRepository<CampaignStep, UUID> {

    fun findByCampaignIdOrderByStepNumberAsc(campaignId: UUID): List<CampaignStep>

    @Query("""
        SELECT s FROM CampaignStep s
        WHERE s.campaignId = :campaignId
        AND s.isActive = true
        ORDER BY s.stepNumber ASC
    """)
    fun findActiveByCampaignId(@Param("campaignId") campaignId: UUID): List<CampaignStep>

    fun findByCampaignIdAndStepNumber(campaignId: UUID, stepNumber: Int): Optional<CampaignStep>

    @Query("""
        SELECT s FROM CampaignStep s
        WHERE s.campaignId = :campaignId
        AND s.stepNumber = :stepNumber
        AND s.isAbTest = true
        ORDER BY s.abVariant ASC
    """)
    fun findAbVariants(
        @Param("campaignId") campaignId: UUID,
        @Param("stepNumber") stepNumber: Int
    ): List<CampaignStep>

    @Modifying
    @Query("DELETE FROM CampaignStep s WHERE s.campaignId = :campaignId")
    fun deleteByCampaignId(@Param("campaignId") campaignId: UUID)

    fun countByCampaignId(campaignId: UUID): Long

    @Query("SELECT MAX(s.stepNumber) FROM CampaignStep s WHERE s.campaignId = :campaignId")
    fun getMaxStepNumber(@Param("campaignId") campaignId: UUID): Int?
}

@Repository
class JpaCampaignStepRepository(
    private val springDataRepository: SpringDataCampaignStepRepository
) : CampaignStepRepository {

    override fun save(step: CampaignStep): CampaignStep = springDataRepository.save(step)

    override fun saveAll(steps: List<CampaignStep>): List<CampaignStep> = springDataRepository.saveAll(steps)

    override fun findById(id: UUID): Optional<CampaignStep> = springDataRepository.findById(id)

    override fun deleteById(id: UUID) = springDataRepository.deleteById(id)

    override fun existsById(id: UUID): Boolean = springDataRepository.existsById(id)

    override fun findByCampaignIdOrderByStepNumber(campaignId: UUID): List<CampaignStep> =
        springDataRepository.findByCampaignIdOrderByStepNumberAsc(campaignId)

    override fun findActiveByCampaignId(campaignId: UUID): List<CampaignStep> =
        springDataRepository.findActiveByCampaignId(campaignId)

    override fun findByCampaignIdAndStepNumber(campaignId: UUID, stepNumber: Int): Optional<CampaignStep> =
        springDataRepository.findByCampaignIdAndStepNumber(campaignId, stepNumber)

    override fun findAbVariants(campaignId: UUID, stepNumber: Int): List<CampaignStep> =
        springDataRepository.findAbVariants(campaignId, stepNumber)

    override fun deleteByCampaignId(campaignId: UUID) = springDataRepository.deleteByCampaignId(campaignId)

    override fun countByCampaignId(campaignId: UUID): Long = springDataRepository.countByCampaignId(campaignId)

    override fun getMaxStepNumber(campaignId: UUID): Int? = springDataRepository.getMaxStepNumber(campaignId)
}
