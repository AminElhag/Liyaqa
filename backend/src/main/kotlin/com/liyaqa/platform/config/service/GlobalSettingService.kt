package com.liyaqa.platform.config.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.platform.config.dto.GlobalSettingResponse
import com.liyaqa.platform.config.dto.SettingHistoryEntryResponse
import com.liyaqa.platform.config.dto.SettingsByCategoryResponse
import com.liyaqa.platform.config.exception.SettingNotFoundException
import com.liyaqa.platform.config.exception.SettingNotEditableException
import com.liyaqa.platform.config.exception.SettingValueTypeMismatchException
import com.liyaqa.platform.config.model.SettingValueType
import com.liyaqa.platform.config.repository.GlobalSettingRepository
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class GlobalSettingService(
    private val globalSettingRepository: GlobalSettingRepository,
    private val auditService: AuditService,
    private val securityService: SecurityService,
    private val objectMapper: ObjectMapper
) {

    @Transactional(readOnly = true)
    fun getAllSettingsGrouped(): List<SettingsByCategoryResponse> {
        val allSettings = globalSettingRepository.findAll()
        return allSettings
            .groupBy { it.category }
            .map { (category, settings) ->
                SettingsByCategoryResponse(
                    category = category,
                    settings = settings.map { GlobalSettingResponse.from(it) }
                )
            }
    }

    @Cacheable(cacheNames = ["globalSettings"], key = "#key")
    @Transactional(readOnly = true)
    fun getSetting(key: String): String {
        val setting = globalSettingRepository.findByKey(key)
            .orElseThrow { SettingNotFoundException(key) }
        return setting.value
    }

    final inline fun <reified T> getSettingAs(key: String): T {
        val raw = getSetting(key)
        return convertValue(raw, T::class.java)
    }

    @Suppress("UNCHECKED_CAST")
    fun <T> convertValue(raw: String, type: Class<T>): T {
        return when (type) {
            String::class.java -> raw as T
            Int::class.java, java.lang.Integer::class.java -> raw.toInt() as T
            Long::class.java, java.lang.Long::class.java -> raw.toLong() as T
            Double::class.java, java.lang.Double::class.java -> raw.toDouble() as T
            Boolean::class.java, java.lang.Boolean::class.java -> raw.toBoolean() as T
            else -> objectMapper.readValue(raw, type)
        }
    }

    @CacheEvict(cacheNames = ["globalSettings"], key = "#key")
    fun updateSetting(key: String, newValue: String): GlobalSettingResponse {
        val setting = globalSettingRepository.findByKey(key)
            .orElseThrow { SettingNotFoundException(key) }

        if (!setting.isEditable) {
            throw SettingNotEditableException(key)
        }

        validateValueType(key, setting.valueType, newValue)

        val oldValue = setting.value
        setting.value = newValue
        setting.updatedBy = securityService.getCurrentUserId()

        val saved = globalSettingRepository.save(setting)

        auditService.logAsync(
            action = AuditAction.UPDATE,
            entityType = "GlobalSetting",
            entityId = saved.id,
            description = "Updated setting '$key'",
            oldValue = oldValue,
            newValue = newValue
        )

        return GlobalSettingResponse.from(saved)
    }

    fun validateValueType(key: String, expectedType: SettingValueType, value: String) {
        when (expectedType) {
            SettingValueType.STRING -> { /* any string is valid */ }
            SettingValueType.NUMBER -> {
                if (value.toDoubleOrNull() == null) {
                    throw SettingValueTypeMismatchException(key, "NUMBER", value)
                }
            }
            SettingValueType.BOOLEAN -> {
                if (value != "true" && value != "false") {
                    throw SettingValueTypeMismatchException(key, "BOOLEAN", value)
                }
            }
            SettingValueType.JSON -> {
                try {
                    objectMapper.readTree(value)
                } catch (e: Exception) {
                    throw SettingValueTypeMismatchException(key, "JSON", value)
                }
            }
        }
    }

    @Transactional(readOnly = true)
    fun getSettingsHistory(pageable: Pageable): Page<SettingHistoryEntryResponse> {
        return auditService.getAuditLogsByEntityType("GlobalSetting", pageable)
            .map { log ->
                SettingHistoryEntryResponse(
                    id = log.id,
                    settingKey = log.description?.removePrefix("Updated setting '")?.removeSuffix("'") ?: "unknown",
                    action = log.action,
                    oldValue = log.oldValue,
                    newValue = log.newValue,
                    userId = log.userId,
                    userEmail = log.userEmail,
                    description = log.description,
                    createdAt = log.createdAt
                )
            }
    }
}
