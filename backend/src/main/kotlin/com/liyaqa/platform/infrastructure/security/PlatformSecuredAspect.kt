package com.liyaqa.platform.infrastructure.security

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.domain.model.PlatformRolePermissions
import org.aspectj.lang.ProceedingJoinPoint
import org.aspectj.lang.annotation.Around
import org.aspectj.lang.annotation.Aspect
import org.aspectj.lang.reflect.MethodSignature
import org.slf4j.LoggerFactory
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

/**
 * AOP aspect that enforces @PlatformSecured annotations.
 *
 * Checks:
 * 1. User is authenticated with scope == "platform"
 * 2. User's platform role is in the allowed roles (if specified)
 * 3. User's role has all required permissions (if specified)
 */
@Aspect
@Component
class PlatformSecuredAspect {

    private val log = LoggerFactory.getLogger(PlatformSecuredAspect::class.java)

    @Around("@within(com.liyaqa.platform.infrastructure.security.PlatformSecured) || @annotation(com.liyaqa.platform.infrastructure.security.PlatformSecured)")
    fun checkPlatformAccess(joinPoint: ProceedingJoinPoint): Any? {
        val principal = getCurrentPrincipal()
            ?: throw AccessDeniedException("Authentication required")

        // Must be platform scope
        if (principal.scope != "platform") {
            throw AccessDeniedException("Platform access required")
        }

        val platformRole = principal.platformRole
            ?: throw AccessDeniedException("Platform role required")

        // Find the most specific annotation (method-level overrides class-level)
        val annotation = getAnnotation(joinPoint)
            ?: throw AccessDeniedException("Platform access required")

        // Check roles if specified
        if (annotation.roles.isNotEmpty() && platformRole !in annotation.roles) {
            throw AccessDeniedException("Insufficient platform role: ${platformRole.name}")
        }

        // Check permissions if specified
        if (annotation.permissions.isNotEmpty()) {
            val rolePermissions = PlatformRolePermissions.permissionsFor(platformRole)
            log.debug("Platform access check: role={}, required={}, granted={}",
                platformRole, annotation.permissions.map { it.name }, rolePermissions.size)
            val missing = annotation.permissions.filter { it !in rolePermissions }
            if (missing.isNotEmpty()) {
                log.warn("Platform access denied: role={}, missing={}", platformRole, missing.map { it.name })
                throw AccessDeniedException("Missing permissions: ${missing.joinToString { it.name }}")
            }
        }

        return joinPoint.proceed()
    }

    private fun getAnnotation(joinPoint: ProceedingJoinPoint): PlatformSecured? {
        // Method-level annotation takes priority
        val method = (joinPoint.signature as MethodSignature).method
        val methodAnnotation = method.getAnnotation(PlatformSecured::class.java)
        if (methodAnnotation != null) return methodAnnotation

        // Fall back to class-level
        return joinPoint.target.javaClass.getAnnotation(PlatformSecured::class.java)
    }

    private fun getCurrentPrincipal(): JwtUserPrincipal? {
        val auth = SecurityContextHolder.getContext().authentication ?: return null
        return auth.principal as? JwtUserPrincipal
    }
}
