package com.liyaqa.forecasting.domain.ports

import com.liyaqa.forecasting.domain.model.Forecast
import com.liyaqa.forecasting.domain.model.ForecastType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.*

interface ForecastRepository {
    fun save(forecast: Forecast): Forecast
    fun saveAll(forecasts: List<Forecast>): List<Forecast>
    fun findById(id: UUID): Optional<Forecast>
    fun findAll(pageable: Pageable): Page<Forecast>
    fun findByForecastType(type: ForecastType, pageable: Pageable): Page<Forecast>
    fun findByForecastTypeAndPeriod(
        type: ForecastType,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<Forecast>
    fun findByModelId(modelId: UUID): List<Forecast>
    fun findLatestByType(type: ForecastType, limit: Int): List<Forecast>
    fun findPendingActuals(beforeDate: LocalDate): List<Forecast>
    fun deleteById(id: UUID)
    fun deleteByModelId(modelId: UUID)
}
