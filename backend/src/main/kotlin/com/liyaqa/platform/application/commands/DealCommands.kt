package com.liyaqa.platform.application.commands

import com.liyaqa.platform.domain.model.DealActivityType
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStage
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

data class CreateDealCommand(
    val facilityName: String?,
    val contactName: String,
    val contactEmail: String,
    val contactPhone: String? = null,
    val source: DealSource = DealSource.WEBSITE,
    val notes: String? = null,
    val assignedToId: UUID?,
    val estimatedValue: BigDecimal? = null,
    val currency: String = "SAR",
    val expectedCloseDate: LocalDate? = null
)

data class UpdateDealCommand(
    val facilityName: String? = null,
    val contactName: String? = null,
    val contactEmail: String? = null,
    val contactPhone: String? = null,
    val notes: String? = null,
    val estimatedValue: BigDecimal? = null,
    val expectedCloseDate: LocalDate? = null
)

data class ChangeStageCommand(
    val newStage: DealStage,
    val reason: String? = null
)

data class CreateDealActivityCommand(
    val type: DealActivityType,
    val content: String
)
