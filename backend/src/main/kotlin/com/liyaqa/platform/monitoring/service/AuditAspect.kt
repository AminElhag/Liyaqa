package com.liyaqa.platform.monitoring.service

import org.aspectj.lang.JoinPoint
import org.aspectj.lang.annotation.AfterReturning
import org.aspectj.lang.annotation.Aspect
import org.aspectj.lang.reflect.MethodSignature
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.util.UUID

@Aspect
@Component
class AuditAspect(private val auditLogService: PlatformAuditLogService) {

    private val logger = LoggerFactory.getLogger(AuditAspect::class.java)

    @AfterReturning(
        pointcut = "@annotation(audited)",
        returning = "result"
    )
    fun auditAfterSuccess(joinPoint: JoinPoint, audited: Audited, result: Any?) {
        try {
            val resourceId = extractResourceId(result, joinPoint)
            val details = buildDetailsMap(joinPoint, audited)

            auditLogService.log(
                action = audited.action,
                resourceType = audited.resourceType,
                resourceId = resourceId,
                details = details
            )
        } catch (e: Exception) {
            logger.warn("Failed to create audit log for {}: {}", audited.action, e.message)
        }
    }

    private fun extractResourceId(result: Any?, joinPoint: JoinPoint): UUID? {
        // Try to get id from return value via reflection
        if (result != null) {
            try {
                val idProperty = result::class.java.methods.firstOrNull { it.name == "getId" }
                val idValue = idProperty?.invoke(result)
                if (idValue is UUID) return idValue
            } catch (_: Exception) {
                // Ignore reflection errors
            }
        }

        // Fall back to first UUID parameter
        val args = joinPoint.args
        return args.firstOrNull { it is UUID } as? UUID
    }

    private fun buildDetailsMap(joinPoint: JoinPoint, audited: Audited): Map<String, Any?>? {
        val signature = joinPoint.signature as MethodSignature
        val paramNames = signature.parameterNames
        val args = joinPoint.args

        if (paramNames.isNullOrEmpty()) return null

        val details = mutableMapOf<String, Any?>()

        if (audited.description.isNotBlank()) {
            details["description"] = audited.description
        }

        for (i in paramNames.indices) {
            val value = args[i]
            if (value != null) {
                details[paramNames[i]] = when (value) {
                    is UUID, is String, is Number, is Boolean, is Enum<*> -> value.toString()
                    else -> value::class.simpleName
                }
            }
        }

        return details.ifEmpty { null }
    }
}
