package com.liyaqa.forecasting.domain.ports

import com.liyaqa.forecasting.domain.model.ForecastScenario
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.*

interface ForecastScenarioRepository {
    fun save(scenario: ForecastScenario): ForecastScenario
    fun findById(id: UUID): Optional<ForecastScenario>
    fun findAll(pageable: Pageable): Page<ForecastScenario>
    fun findBaseline(): ForecastScenario?
    fun findByCreatedBy(userId: UUID): List<ForecastScenario>
    fun deleteById(id: UUID)
    fun existsById(id: UUID): Boolean
}
