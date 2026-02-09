package com.liyaqa.platform.monitoring.service

import com.liyaqa.platform.monitoring.model.PlatformAuditAction
import com.liyaqa.platform.monitoring.model.PlatformAuditResourceType

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Audited(
    val action: PlatformAuditAction,
    val resourceType: PlatformAuditResourceType,
    val description: String = ""
)
