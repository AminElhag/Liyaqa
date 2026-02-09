package com.liyaqa.platform.exception

import java.time.Instant

data class PlatformErrorResponse(
    val status: Int,
    val errorCode: String,
    val message: String,
    val messageAr: String,
    val traceId: String?,
    val timestamp: Instant,
    val path: String?
)
