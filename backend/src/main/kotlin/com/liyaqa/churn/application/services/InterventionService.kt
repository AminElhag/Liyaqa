package com.liyaqa.churn.application.services

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.churn.application.commands.*
import com.liyaqa.churn.domain.model.*
import com.liyaqa.churn.domain.ports.*
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional
class InterventionService(
    private val interventionRepository: ChurnInterventionRepository,
    private val templateRepository: InterventionTemplateRepository,
    private val predictionRepository: MemberChurnPredictionRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(InterventionService::class.java)

    // ========== Interventions ==========

    fun createIntervention(command: CreateInterventionCommand, userId: UUID): ChurnIntervention {
        val prediction = predictionRepository.findById(command.predictionId)
            .orElseThrow { NoSuchElementException("Prediction not found: ${command.predictionId}") }

        val intervention = ChurnIntervention(
            predictionId = command.predictionId,
            memberId = prediction.memberId,
            interventionType = command.interventionType,
            interventionTemplateId = command.templateId,
            description = command.description,
            descriptionAr = command.descriptionAr,
            assignedTo = command.assignedTo,
            scheduledAt = command.scheduledAt,
            createdBy = userId
        )

        // Update prediction status
        prediction.startIntervention()
        predictionRepository.save(prediction)

        logger.info("Created intervention: ${intervention.id} for prediction: ${command.predictionId}")
        return interventionRepository.save(intervention)
    }

    fun assignIntervention(command: AssignInterventionCommand): ChurnIntervention {
        val intervention = interventionRepository.findById(command.interventionId)
            .orElseThrow { NoSuchElementException("Intervention not found: ${command.interventionId}") }

        intervention.assign(command.assignedTo)
        logger.info("Assigned intervention ${intervention.id} to user ${command.assignedTo}")
        return interventionRepository.save(intervention)
    }

    fun executeIntervention(command: ExecuteInterventionCommand): ChurnIntervention {
        val intervention = interventionRepository.findById(command.interventionId)
            .orElseThrow { NoSuchElementException("Intervention not found: ${command.interventionId}") }

        intervention.execute()
        logger.info("Executed intervention: ${intervention.id}")
        return interventionRepository.save(intervention)
    }

    fun recordInterventionOutcome(command: RecordInterventionOutcomeCommand): ChurnIntervention {
        val intervention = interventionRepository.findById(command.interventionId)
            .orElseThrow { NoSuchElementException("Intervention not found: ${command.interventionId}") }

        intervention.recordOutcome(command.outcome, command.notes)

        // Update prediction status if outcome is successful
        if (command.outcome == InterventionOutcome.SUCCESS) {
            val prediction = predictionRepository.findById(intervention.predictionId).orElse(null)
            prediction?.let {
                it.completeIntervention()
                predictionRepository.save(it)
            }
        }

        logger.info("Recorded outcome ${command.outcome} for intervention: ${intervention.id}")
        return interventionRepository.save(intervention)
    }

    @Transactional(readOnly = true)
    fun getIntervention(id: UUID): ChurnIntervention? =
        interventionRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun listInterventions(pageable: Pageable): Page<ChurnIntervention> =
        interventionRepository.findAll(pageable)

    @Transactional(readOnly = true)
    fun getInterventionsByMember(memberId: UUID): List<ChurnIntervention> =
        interventionRepository.findByMemberId(memberId)

    @Transactional(readOnly = true)
    fun getInterventionsByPrediction(predictionId: UUID): List<ChurnIntervention> =
        interventionRepository.findByPredictionId(predictionId)

    @Transactional(readOnly = true)
    fun getMyAssignedInterventions(userId: UUID, pageable: Pageable): Page<ChurnIntervention> =
        interventionRepository.findByAssignedTo(userId, pageable)

    @Transactional(readOnly = true)
    fun getPendingInterventions(pageable: Pageable): Page<ChurnIntervention> =
        interventionRepository.findPending(pageable)

    fun deleteIntervention(id: UUID) {
        if (!interventionRepository.findById(id).isPresent) {
            throw NoSuchElementException("Intervention not found: $id")
        }
        interventionRepository.deleteById(id)
        logger.info("Deleted intervention: $id")
    }

    // ========== Templates ==========

    fun createTemplate(command: CreateInterventionTemplateCommand): InterventionTemplate {
        val template = InterventionTemplate(
            name = command.name,
            nameAr = command.nameAr,
            interventionType = command.interventionType,
            description = command.description,
            descriptionAr = command.descriptionAr,
            messageTemplate = command.messageTemplate,
            messageTemplateAr = command.messageTemplateAr,
            offerDetails = command.offerDetails?.let { objectMapper.writeValueAsString(it) },
            targetRiskLevels = command.targetRiskLevels?.let { objectMapper.writeValueAsString(it) }
        )

        logger.info("Created intervention template: ${template.name}")
        return templateRepository.save(template)
    }

    fun updateTemplate(id: UUID, command: UpdateInterventionTemplateCommand): InterventionTemplate {
        val template = templateRepository.findById(id)
            .orElseThrow { NoSuchElementException("Template not found: $id") }

        command.name?.let { template.name = it }
        command.nameAr?.let { template.nameAr = it }
        command.description?.let { template.description = it }
        command.descriptionAr?.let { template.descriptionAr = it }
        command.messageTemplate?.let { template.messageTemplate = it }
        command.messageTemplateAr?.let { template.messageTemplateAr = it }
        command.offerDetails?.let { template.offerDetails = objectMapper.writeValueAsString(it) }
        command.targetRiskLevels?.let { template.targetRiskLevels = objectMapper.writeValueAsString(it) }
        command.isActive?.let { if (it) template.activate() else template.deactivate() }

        logger.info("Updated template: $id")
        return templateRepository.save(template)
    }

    @Transactional(readOnly = true)
    fun getTemplate(id: UUID): InterventionTemplate? =
        templateRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun listTemplates(): List<InterventionTemplate> =
        templateRepository.findAll()

    @Transactional(readOnly = true)
    fun listActiveTemplates(): List<InterventionTemplate> =
        templateRepository.findActive()

    @Transactional(readOnly = true)
    fun getTemplatesByType(type: InterventionType): List<InterventionTemplate> =
        templateRepository.findByType(type)

    fun deleteTemplate(id: UUID) {
        if (!templateRepository.findById(id).isPresent) {
            throw NoSuchElementException("Template not found: $id")
        }
        templateRepository.deleteById(id)
        logger.info("Deleted template: $id")
    }
}
