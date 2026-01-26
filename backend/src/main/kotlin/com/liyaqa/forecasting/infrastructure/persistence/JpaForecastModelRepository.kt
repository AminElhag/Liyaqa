package com.liyaqa.forecasting.infrastructure.persistence

import com.liyaqa.forecasting.domain.model.ForecastModel
import com.liyaqa.forecasting.domain.model.ModelType
import com.liyaqa.forecasting.domain.ports.ForecastModelRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

interface SpringDataForecastModelRepository : JpaRepository<ForecastModel, UUID> {
    fun findByModelType(modelType: ModelType, pageable: Pageable): Page<ForecastModel>

    @Query("SELECT m FROM ForecastModel m WHERE m.modelType = :modelType AND m.isActive = true")
    fun findActiveByModelType(@Param("modelType") modelType: ModelType): ForecastModel?

    @Query("SELECT m FROM ForecastModel m WHERE m.isActive = true")
    fun findAllActive(): List<ForecastModel>
}

@Repository
class JpaForecastModelRepository(
    private val springDataRepository: SpringDataForecastModelRepository
) : ForecastModelRepository {

    override fun save(model: ForecastModel): ForecastModel =
        springDataRepository.save(model)

    override fun findById(id: UUID): Optional<ForecastModel> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<ForecastModel> =
        springDataRepository.findAll(pageable)

    override fun findByModelType(modelType: ModelType, pageable: Pageable): Page<ForecastModel> =
        springDataRepository.findByModelType(modelType, pageable)

    override fun findActiveByModelType(modelType: ModelType): ForecastModel? =
        springDataRepository.findActiveByModelType(modelType)

    override fun findAllActive(): List<ForecastModel> =
        springDataRepository.findAllActive()

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)
}
