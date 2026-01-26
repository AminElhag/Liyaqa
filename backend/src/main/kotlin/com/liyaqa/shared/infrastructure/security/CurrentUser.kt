package com.liyaqa.shared.infrastructure.security

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import org.springframework.core.MethodParameter
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.bind.support.WebDataBinderFactory
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.method.support.ModelAndViewContainer
import java.util.UUID

/**
 * Represents the currently authenticated user.
 * Used with @AuthenticationPrincipal in controller methods.
 */
data class CurrentUser(
    val id: UUID,
    val tenantId: UUID,
    val email: String,
    val role: Role,
    val permissions: List<String> = emptyList()
) {
    companion object {
        fun from(principal: JwtUserPrincipal): CurrentUser {
            return CurrentUser(
                id = principal.userId,
                tenantId = principal.tenantId,
                email = principal.email,
                role = principal.role,
                permissions = principal.permissions
            )
        }
    }

    fun hasPermission(permission: String): Boolean = permissions.contains(permission)

    fun hasAnyPermission(vararg perms: String): Boolean = perms.any { permissions.contains(it) }

    fun hasRole(checkRole: Role): Boolean = role == checkRole

    fun isAdmin(): Boolean = role == Role.SUPER_ADMIN || role == Role.CLUB_ADMIN
}

/**
 * Resolves CurrentUser from the SecurityContext for controller method parameters.
 */
@Component
class CurrentUserArgumentResolver : HandlerMethodArgumentResolver {

    override fun supportsParameter(parameter: MethodParameter): Boolean {
        return parameter.parameterType == CurrentUser::class.java
    }

    override fun resolveArgument(
        parameter: MethodParameter,
        mavContainer: ModelAndViewContainer?,
        webRequest: NativeWebRequest,
        binderFactory: WebDataBinderFactory?
    ): CurrentUser? {
        val authentication = SecurityContextHolder.getContext().authentication
            ?: return null

        val principal = authentication.principal as? JwtUserPrincipal
            ?: return null

        return CurrentUser.from(principal)
    }
}
