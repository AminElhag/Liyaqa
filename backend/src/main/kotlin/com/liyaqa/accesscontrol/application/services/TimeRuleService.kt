package com.liyaqa.accesscontrol.application.services

import com.liyaqa.accesscontrol.application.commands.*
import com.liyaqa.accesscontrol.domain.model.*
import com.liyaqa.accesscontrol.domain.ports.*
import com.liyaqa.shared.domain.TenantContext
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional
class TimeRuleService(
    private val timeRuleRepository: AccessTimeRuleRepository
) {
    fun createRule(command: CreateTimeRuleCommand): AccessTimeRule {
        val rule = AccessTimeRule(
            zoneId = command.zoneId,
            planId = command.planId,
            memberId = command.memberId,
            name = command.name,
            nameAr = command.nameAr,
            dayOfWeek = command.dayOfWeek,
            startTime = command.startTime,
            endTime = command.endTime,
            accessType = command.accessType,
            priority = command.priority,
            validFrom = command.validFrom,
            validUntil = command.validUntil
        )
        // tenantId is automatically set by BaseEntity's @PrePersist
        return timeRuleRepository.save(rule)
    }

    fun updateRule(id: UUID, command: UpdateTimeRuleCommand): AccessTimeRule {
        val rule = timeRuleRepository.findById(id)
            ?: throw IllegalArgumentException("Rule not found: $id")

        command.name?.let { rule.name = it }
        command.nameAr?.let { rule.nameAr = it }
        command.dayOfWeek?.let { rule.dayOfWeek = it }
        command.startTime?.let { rule.startTime = it }
        command.endTime?.let { rule.endTime = it }
        command.accessType?.let { rule.accessType = it }
        command.priority?.let { rule.priority = it }
        command.isActive?.let { rule.isActive = it }
        command.validFrom?.let { rule.validFrom = it }
        command.validUntil?.let { rule.validUntil = it }

        return timeRuleRepository.save(rule)
    }

    fun getRule(id: UUID) = timeRuleRepository.findById(id)

    fun listRules(pageable: Pageable) = timeRuleRepository.findAll(pageable)

    fun getRulesByZone(zoneId: UUID) = timeRuleRepository.findByZoneId(zoneId)

    fun getRulesByPlan(planId: UUID) = timeRuleRepository.findByPlanId(planId)

    fun getRulesByMember(memberId: UUID) = timeRuleRepository.findByMemberId(memberId)

    fun getActiveRules() = timeRuleRepository.findActiveRules()

    fun deactivateRule(id: UUID): AccessTimeRule {
        val rule = timeRuleRepository.findById(id)
            ?: throw IllegalArgumentException("Rule not found: $id")
        rule.isActive = false
        return timeRuleRepository.save(rule)
    }

    fun activateRule(id: UUID): AccessTimeRule {
        val rule = timeRuleRepository.findById(id)
            ?: throw IllegalArgumentException("Rule not found: $id")
        rule.isActive = true
        return timeRuleRepository.save(rule)
    }

    fun deleteRule(id: UUID) {
        val rule = timeRuleRepository.findById(id)
            ?: throw IllegalArgumentException("Rule not found: $id")
        timeRuleRepository.delete(rule)
    }
}
