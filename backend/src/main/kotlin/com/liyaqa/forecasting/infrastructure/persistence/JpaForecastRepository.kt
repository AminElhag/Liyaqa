package com.liyaqa.forecasting.infrastructure.persistence

import com.liyaqa.forecasting.domain.model.Forecast
import com.liyaqa.forecasting.domain.model.ForecastType
import com.liyaqa.forecasting.domain.ports.ForecastRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.*

interface SpringDataForecastRepository : JpaRepository<Forecast, UUID> {
    fun findByForecastType(type: ForecastType, pageable: Pageable): Page<Forecast>

    @Query("""
        SELECT f FROM Forecast f
        WHERE f.forecastType = :type
        AND f.periodStart >= :startDate
        AND f.periodEnd <= :endDate
        ORDER BY f.periodStart ASC
    """)
    fun findByForecastTypeAndPeriod(
        @Param("type") type: ForecastType,
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): List<Forecast>

    fun findByModelId(modelId: UUID): List<Forecast>

    @Query("SELECT f FROM Forecast f WHERE f.forecastType = :type ORDER BY f.periodStart DESC")
    fun findLatestByType(@Param("type") type: ForecastType, pageable: Pageable): List<Forecast>

    @Query("SELECT f FROM Forecast f WHERE f.actualValue IS NULL AND f.periodEnd < :beforeDate")
    fun findPendingActuals(@Param("beforeDate") beforeDate: LocalDate): List<Forecast>

    @Modifying
    @Query("DELETE FROM Forecast f WHERE f.modelId = :modelId")
    fun deleteByModelId(@Param("modelId") modelId: UUID)
}

@Repository
class JpaForecastRepository(
    private val springDataRepository: SpringDataForecastRepository
) : ForecastRepository {

    override fun save(forecast: Forecast): Forecast =
        springDataRepository.save(forecast)

    override fun saveAll(forecasts: List<Forecast>): List<Forecast> =
        springDataRepository.saveAll(forecasts)

    override fun findById(id: UUID): Optional<Forecast> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<Forecast> =
        springDataRepository.findAll(pageable)

    override fun findByForecastType(type: ForecastType, pageable: Pageable): Page<Forecast> =
        springDataRepository.findByForecastType(type, pageable)

    override fun findByForecastTypeAndPeriod(
        type: ForecastType,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<Forecast> = springDataRepository.findByForecastTypeAndPeriod(type, startDate, endDate)

    override fun findByModelId(modelId: UUID): List<Forecast> =
        springDataRepository.findByModelId(modelId)

    override fun findLatestByType(type: ForecastType, limit: Int): List<Forecast> =
        springDataRepository.findLatestByType(type, PageRequest.of(0, limit))

    override fun findPendingActuals(beforeDate: LocalDate): List<Forecast> =
        springDataRepository.findPendingActuals(beforeDate)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun deleteByModelId(modelId: UUID) =
        springDataRepository.deleteByModelId(modelId)
}
