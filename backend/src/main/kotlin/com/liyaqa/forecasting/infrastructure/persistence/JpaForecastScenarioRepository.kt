package com.liyaqa.forecasting.infrastructure.persistence

import com.liyaqa.forecasting.domain.model.ForecastScenario
import com.liyaqa.forecasting.domain.ports.ForecastScenarioRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.*

interface SpringDataForecastScenarioRepository : JpaRepository<ForecastScenario, UUID> {
    @Query("SELECT s FROM ForecastScenario s WHERE s.isBaseline = true")
    fun findBaseline(): ForecastScenario?

    fun findByCreatedBy(userId: UUID): List<ForecastScenario>
}

@Repository
class JpaForecastScenarioRepository(
    private val springDataRepository: SpringDataForecastScenarioRepository
) : ForecastScenarioRepository {

    override fun save(scenario: ForecastScenario): ForecastScenario =
        springDataRepository.save(scenario)

    override fun findById(id: UUID): Optional<ForecastScenario> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<ForecastScenario> =
        springDataRepository.findAll(pageable)

    override fun findBaseline(): ForecastScenario? =
        springDataRepository.findBaseline()

    override fun findByCreatedBy(userId: UUID): List<ForecastScenario> =
        springDataRepository.findByCreatedBy(userId)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)
}
