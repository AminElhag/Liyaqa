package com.liyaqa.platform.monitoring.service

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.monitoring.model.PlatformAuditActorType
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import java.util.UUID

object AuditContext {
    private val holder = ThreadLocal<AuditContextData>()

    data class AuditContextData(
        val actorId: UUID?,
        val actorType: PlatformAuditActorType,
        val actorName: String?,
        val correlationId: String = UUID.randomUUID().toString(),
        val ipAddress: String? = null,
        val userAgent: String? = null
    )

    fun set(data: AuditContextData) = holder.set(data)
    fun get(): AuditContextData? = holder.get()
    fun clear() = holder.remove()

    fun fromCurrentRequest(): AuditContextData? {
        val principal = try {
            SecurityContextHolder.getContext().authentication?.principal as? JwtUserPrincipal
        } catch (_: Exception) {
            null
        } ?: return null

        val request = try {
            (RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes)?.request
        } catch (_: Exception) {
            null
        }

        val ipAddress = request?.let { req ->
            req.getHeader("X-Forwarded-For")?.split(",")?.firstOrNull()?.trim()
                ?: req.getHeader("X-Real-IP")?.trim()
                ?: req.remoteAddr
        }

        return AuditContextData(
            actorId = principal.userId,
            actorType = PlatformAuditActorType.PLATFORM_USER,
            actorName = principal.email,
            ipAddress = ipAddress,
            userAgent = request?.getHeader("User-Agent")
        )
    }
}
