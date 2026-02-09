package com.liyaqa.platform.infrastructure.security

import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.domain.model.PlatformUserRole

/**
 * Annotation for securing platform controller methods with role and permission checks.
 *
 * When applied to a class, all methods inherit the check.
 * When applied to a method, it overrides the class-level annotation.
 *
 * If [roles] is empty, any authenticated platform user is allowed.
 * If [permissions] is specified, the user's role must grant all listed permissions.
 */
@Target(AnnotationTarget.FUNCTION, AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class PlatformSecured(
    val roles: Array<PlatformUserRole> = [],
    val permissions: Array<PlatformPermission> = []
)
