package com.liyaqa.churn.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.churn.application.commands.*
import com.liyaqa.churn.application.services.*
import com.liyaqa.churn.domain.model.*
import com.liyaqa.shared.infrastructure.security.CurrentUser
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/churn")
@Tag(name = "Churn Prediction", description = "ML-based churn prediction and intervention management")
class ChurnController(
    private val churnPredictionService: ChurnPredictionService,
    private val interventionService: InterventionService,
    private val objectMapper: ObjectMapper
) {
    // ========== Churn Models ==========

    @PostMapping("/models")
    @PreAuthorize("hasAuthority('churn_manage')")
    @Operation(summary = "Create a new churn model")
    fun createChurnModel(
        @Valid @RequestBody request: CreateChurnModelRequest
    ): ResponseEntity<ChurnModelResponse> {
        val command = CreateChurnModelCommand(
            modelVersion = request.modelVersion,
            algorithm = request.algorithm
        )
        val model = churnPredictionService.createChurnModel(command)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ChurnModelResponse.from(model, objectMapper))
    }

    @GetMapping("/models")
    @PreAuthorize("hasAuthority('churn_view')")
    @Operation(summary = "List churn models")
    fun listChurnModels(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ChurnModelResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "trainedAt"))
        val modelsPage = churnPredictionService.listChurnModels(pageable)
        return ResponseEntity.ok(PageResponse(
            content = modelsPage.content.map { ChurnModelResponse.from(it, objectMapper) },
            page = modelsPage.number,
            size = modelsPage.size,
            totalElements = modelsPage.totalElements,
            totalPages = modelsPage.totalPages,
            first = modelsPage.isFirst,
            last = modelsPage.isLast
        ))
    }

    @GetMapping("/models/{id}")
    @PreAuthorize("hasAuthority('churn_view')")
    @Operation(summary = "Get a churn model")
    fun getChurnModel(@PathVariable id: UUID): ResponseEntity<ChurnModelResponse> {
        val model = churnPredictionService.getChurnModel(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(ChurnModelResponse.from(model, objectMapper))
    }

    @GetMapping("/models/active")
    @PreAuthorize("hasAuthority('churn_view')")
    @Operation(summary = "Get active churn model")
    fun getActiveModel(): ResponseEntity<ChurnModelResponse> {
        val model = churnPredictionService.getActiveModel()
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(ChurnModelResponse.from(model, objectMapper))
    }

    @PostMapping("/models/{id}/activate")
    @PreAuthorize("hasAuthority('churn_manage')")
    @Operation(summary = "Activate a churn model")
    fun activateChurnModel(@PathVariable id: UUID): ResponseEntity<ChurnModelResponse> {
        val model = churnPredictionService.activateChurnModel(id)
        return ResponseEntity.ok(ChurnModelResponse.from(model, objectMapper))
    }

    @PutMapping("/models/{id}/metrics")
    @PreAuthorize("hasAuthority('churn_manage')")
    @Operation(summary = "Update model metrics")
    fun updateChurnModelMetrics(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateChurnModelMetricsRequest
    ): ResponseEntity<ChurnModelResponse> {
        val command = UpdateChurnModelMetricsCommand(
            modelId = id,
            accuracy = request.accuracy,
            precision = request.precision,
            recall = request.recall,
            f1Score = request.f1Score,
            aucScore = request.aucScore,
            featureWeights = request.featureWeights
        )
        val model = churnPredictionService.updateChurnModelMetrics(command)
        return ResponseEntity.ok(ChurnModelResponse.from(model, objectMapper))
    }

    // ========== Predictions ==========

    @PostMapping("/predictions/generate")
    @PreAuthorize("hasAuthority('churn_manage')")
    @Operation(summary = "Generate churn predictions")
    fun generatePredictions(
        @Valid @RequestBody request: GeneratePredictionsRequest
    ): ResponseEntity<List<MemberChurnPredictionResponse>> {
        val command = GeneratePredictionsCommand(
            memberIds = request.memberIds,
            validityDays = request.validityDays
        )
        val predictions = churnPredictionService.generatePredictions(command)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(predictions.map { MemberChurnPredictionResponse.from(it, objectMapper) })
    }

    @GetMapping("/predictions")
    @PreAuthorize("hasAuthority('churn_view')")
    @Operation(summary = "List all predictions")
    fun listPredictions(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<MemberChurnPredictionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "predictionDate"))
        val predictionsPage = churnPredictionService.listPredictions(pageable)
        return ResponseEntity.ok(PageResponse(
            content = predictionsPage.content.map { MemberChurnPredictionResponse.from(it, objectMapper) },
            page = predictionsPage.number,
            size = predictionsPage.size,
            totalElements = predictionsPage.totalElements,
            totalPages = predictionsPage.totalPages,
            first = predictionsPage.isFirst,
            last = predictionsPage.isLast
        ))
    }

    @GetMapping("/predictions/{id}")
    @PreAuthorize("hasAuthority('churn_view')")
    @Operation(summary = "Get a prediction")
    fun getPrediction(@PathVariable id: UUID): ResponseEntity<MemberChurnPredictionResponse> {
        val prediction = churnPredictionService.getPrediction(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(MemberChurnPredictionResponse.from(prediction, objectMapper))
    }

    @GetMapping("/predictions/at-risk")
    @PreAuthorize("hasAuthority('churn_view')")
    @Operation(summary = "Get at-risk members (HIGH and CRITICAL)")
    fun getAtRiskMembers(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<MemberChurnPredictionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "churnScore"))
        val predictionsPage = churnPredictionService.getAtRiskMembers(pageable)
        return ResponseEntity.ok(PageResponse(
            content = predictionsPage.content.map { MemberChurnPredictionResponse.from(it, objectMapper) },
            page = predictionsPage.number,
            size = predictionsPage.size,
            totalElements = predictionsPage.totalElements,
            totalPages = predictionsPage.totalPages,
            first = predictionsPage.isFirst,
            last = predictionsPage.isLast
        ))
    }

    @GetMapping("/predictions/by-risk/{riskLevel}")
    @PreAuthorize("hasAuthority('churn_view')")
    @Operation(summary = "Get predictions by risk level")
    fun getPredictionsByRiskLevel(
        @PathVariable riskLevel: RiskLevel,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<MemberChurnPredictionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "churnScore"))
        val predictionsPage = churnPredictionService.getPredictionsByRiskLevel(riskLevel, pageable)
        return ResponseEntity.ok(PageResponse(
            content = predictionsPage.content.map { MemberChurnPredictionResponse.from(it, objectMapper) },
            page = predictionsPage.number,
            size = predictionsPage.size,
            totalElements = predictionsPage.totalElements,
            totalPages = predictionsPage.totalPages,
            first = predictionsPage.isFirst,
            last = predictionsPage.isLast
        ))
    }

    @GetMapping("/predictions/distribution")
    @PreAuthorize("hasAuthority('churn_view')")
    @Operation(summary = "Get risk distribution")
    fun getRiskDistribution(): ResponseEntity<RiskDistributionResponse> {
        val distribution = churnPredictionService.getRiskDistribution()
        return ResponseEntity.ok(RiskDistributionResponse.from(distribution))
    }

    @PostMapping("/predictions/{id}/outcome")
    @PreAuthorize("hasAuthority('churn_manage')")
    @Operation(summary = "Record prediction outcome")
    fun recordPredictionOutcome(
        @PathVariable id: UUID,
        @Valid @RequestBody request: RecordOutcomeRequest
    ): ResponseEntity<MemberChurnPredictionResponse> {
        val command = RecordPredictionOutcomeCommand(
            predictionId = id,
            outcome = request.outcome
        )
        val prediction = churnPredictionService.recordPredictionOutcome(command)
        return ResponseEntity.ok(MemberChurnPredictionResponse.from(prediction, objectMapper))
    }

    // ========== Interventions ==========

    @PostMapping("/interventions")
    @PreAuthorize("hasAuthority('churn_manage')")
    @Operation(summary = "Create an intervention")
    fun createIntervention(
        @Valid @RequestBody request: CreateInterventionRequest,
        currentUser: CurrentUser
    ): ResponseEntity<ChurnInterventionResponse> {
        val command = CreateInterventionCommand(
            predictionId = request.predictionId,
            interventionType = request.interventionType,
            templateId = request.templateId,
            description = request.description,
            descriptionAr = request.descriptionAr,
            assignedTo = request.assignedTo,
            scheduledAt = request.scheduledAt
        )
        val intervention = interventionService.createIntervention(command, currentUser.id)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ChurnInterventionResponse.from(intervention))
    }

    @GetMapping("/interventions")
    @PreAuthorize("hasAuthority('churn_view')")
    @Operation(summary = "List interventions")
    fun listInterventions(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ChurnInterventionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val interventionsPage = interventionService.listInterventions(pageable)
        return ResponseEntity.ok(PageResponse(
            content = interventionsPage.content.map { ChurnInterventionResponse.from(it) },
            page = interventionsPage.number,
            size = interventionsPage.size,
            totalElements = interventionsPage.totalElements,
            totalPages = interventionsPage.totalPages,
            first = interventionsPage.isFirst,
            last = interventionsPage.isLast
        ))
    }

    @GetMapping("/interventions/{id}")
    @PreAuthorize("hasAuthority('churn_view')")
    @Operation(summary = "Get an intervention")
    fun getIntervention(@PathVariable id: UUID): ResponseEntity<ChurnInterventionResponse> {
        val intervention = interventionService.getIntervention(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(ChurnInterventionResponse.from(intervention))
    }

    @PostMapping("/interventions/{id}/assign")
    @PreAuthorize("hasAuthority('churn_manage')")
    @Operation(summary = "Assign an intervention")
    fun assignIntervention(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AssignInterventionRequest
    ): ResponseEntity<ChurnInterventionResponse> {
        val command = AssignInterventionCommand(
            interventionId = id,
            assignedTo = request.assignedTo
        )
        val intervention = interventionService.assignIntervention(command)
        return ResponseEntity.ok(ChurnInterventionResponse.from(intervention))
    }

    @PostMapping("/interventions/{id}/execute")
    @PreAuthorize("hasAuthority('churn_manage')")
    @Operation(summary = "Execute an intervention")
    fun executeIntervention(@PathVariable id: UUID): ResponseEntity<ChurnInterventionResponse> {
        val command = ExecuteInterventionCommand(interventionId = id)
        val intervention = interventionService.executeIntervention(command)
        return ResponseEntity.ok(ChurnInterventionResponse.from(intervention))
    }

    @PostMapping("/interventions/{id}/outcome")
    @PreAuthorize("hasAuthority('churn_manage')")
    @Operation(summary = "Record intervention outcome")
    fun recordInterventionOutcome(
        @PathVariable id: UUID,
        @Valid @RequestBody request: RecordInterventionOutcomeRequest
    ): ResponseEntity<ChurnInterventionResponse> {
        val command = RecordInterventionOutcomeCommand(
            interventionId = id,
            outcome = request.outcome,
            notes = request.notes
        )
        val intervention = interventionService.recordInterventionOutcome(command)
        return ResponseEntity.ok(ChurnInterventionResponse.from(intervention))
    }

    @DeleteMapping("/interventions/{id}")
    @PreAuthorize("hasAuthority('churn_manage')")
    @Operation(summary = "Delete an intervention")
    fun deleteIntervention(@PathVariable id: UUID): ResponseEntity<Void> {
        interventionService.deleteIntervention(id)
        return ResponseEntity.noContent().build()
    }

    // ========== Templates ==========

    @PostMapping("/templates")
    @PreAuthorize("hasAuthority('churn_manage')")
    @Operation(summary = "Create an intervention template")
    fun createTemplate(
        @Valid @RequestBody request: CreateInterventionTemplateRequest
    ): ResponseEntity<InterventionTemplateResponse> {
        val command = CreateInterventionTemplateCommand(
            name = request.name,
            nameAr = request.nameAr,
            interventionType = request.interventionType,
            description = request.description,
            descriptionAr = request.descriptionAr,
            messageTemplate = request.messageTemplate,
            messageTemplateAr = request.messageTemplateAr,
            offerDetails = request.offerDetails,
            targetRiskLevels = request.targetRiskLevels
        )
        val template = interventionService.createTemplate(command)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(InterventionTemplateResponse.from(template, objectMapper))
    }

    @GetMapping("/templates")
    @PreAuthorize("hasAuthority('churn_view')")
    @Operation(summary = "List intervention templates")
    fun listTemplates(): ResponseEntity<List<InterventionTemplateResponse>> {
        val templates = interventionService.listTemplates()
        return ResponseEntity.ok(templates.map { InterventionTemplateResponse.from(it, objectMapper) })
    }

    @GetMapping("/templates/active")
    @PreAuthorize("hasAuthority('churn_view')")
    @Operation(summary = "List active intervention templates")
    fun listActiveTemplates(): ResponseEntity<List<InterventionTemplateResponse>> {
        val templates = interventionService.listActiveTemplates()
        return ResponseEntity.ok(templates.map { InterventionTemplateResponse.from(it, objectMapper) })
    }

    @GetMapping("/templates/{id}")
    @PreAuthorize("hasAuthority('churn_view')")
    @Operation(summary = "Get an intervention template")
    fun getTemplate(@PathVariable id: UUID): ResponseEntity<InterventionTemplateResponse> {
        val template = interventionService.getTemplate(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(InterventionTemplateResponse.from(template, objectMapper))
    }

    @PutMapping("/templates/{id}")
    @PreAuthorize("hasAuthority('churn_manage')")
    @Operation(summary = "Update an intervention template")
    fun updateTemplate(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateInterventionTemplateRequest
    ): ResponseEntity<InterventionTemplateResponse> {
        val command = UpdateInterventionTemplateCommand(
            name = request.name,
            nameAr = request.nameAr,
            description = request.description,
            descriptionAr = request.descriptionAr,
            messageTemplate = request.messageTemplate,
            messageTemplateAr = request.messageTemplateAr,
            offerDetails = request.offerDetails,
            targetRiskLevels = request.targetRiskLevels,
            isActive = request.isActive
        )
        val template = interventionService.updateTemplate(id, command)
        return ResponseEntity.ok(InterventionTemplateResponse.from(template, objectMapper))
    }

    @DeleteMapping("/templates/{id}")
    @PreAuthorize("hasAuthority('churn_manage')")
    @Operation(summary = "Delete an intervention template")
    fun deleteTemplate(@PathVariable id: UUID): ResponseEntity<Void> {
        interventionService.deleteTemplate(id)
        return ResponseEntity.noContent().build()
    }
}
