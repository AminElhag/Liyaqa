package com.liyaqa.forecasting.domain.ports

import com.liyaqa.forecasting.domain.model.ForecastModel
import com.liyaqa.forecasting.domain.model.ModelType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.*

interface ForecastModelRepository {
    fun save(model: ForecastModel): ForecastModel
    fun findById(id: UUID): Optional<ForecastModel>
    fun findAll(pageable: Pageable): Page<ForecastModel>
    fun findByModelType(modelType: ModelType, pageable: Pageable): Page<ForecastModel>
    fun findActiveByModelType(modelType: ModelType): ForecastModel?
    fun findAllActive(): List<ForecastModel>
    fun deleteById(id: UUID)
    fun existsById(id: UUID): Boolean
}
