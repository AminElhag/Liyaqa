package com.liyaqa.auth.api

import com.liyaqa.auth.domain.model.LoginAttempt
import com.liyaqa.auth.domain.model.LoginAttemptType
import com.liyaqa.auth.domain.ports.LoginAttemptRepository
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID

/**
 * Response DTO for login attempt.
 */
data class LoginAttemptResponse(
    val id: UUID,
    val userId: UUID?,
    val email: String,
    val ipAddress: String,
    val deviceDescription: String,
    val locationDescription: String,
    val attemptType: LoginAttemptType,
    val failureReason: String?,
    val timestamp: Instant,
    val flaggedAsSuspicious: Boolean,
    val acknowledgedAt: Instant?,
    val browser: String?,
    val os: String?,
    val deviceName: String?
) {
    companion object {
        fun from(loginAttempt: LoginAttempt) = LoginAttemptResponse(
            id = loginAttempt.id,
            userId = loginAttempt.userId,
            email = loginAttempt.email,
            ipAddress = loginAttempt.ipAddress,
            deviceDescription = loginAttempt.getDeviceDescription(),
            locationDescription = loginAttempt.getLocationDescription(),
            attemptType = loginAttempt.attemptType,
            failureReason = loginAttempt.failureReason,
            timestamp = loginAttempt.timestamp,
            flaggedAsSuspicious = loginAttempt.flaggedAsSuspicious,
            acknowledgedAt = loginAttempt.acknowledgedAt,
            browser = loginAttempt.browser,
            os = loginAttempt.os,
            deviceName = loginAttempt.deviceName
        )
    }
}

/**
 * Paginated response for login history.
 */
data class LoginHistoryPageResponse(
    val content: List<LoginAttemptResponse>,
    val totalElements: Long,
    val totalPages: Int,
    val pageNumber: Int,
    val pageSize: Int,
    val isFirst: Boolean,
    val isLast: Boolean
) {
    companion object {
        fun from(page: Page<LoginAttempt>) = LoginHistoryPageResponse(
            content = page.content.map { LoginAttemptResponse.from(it) },
            totalElements = page.totalElements,
            totalPages = page.totalPages,
            pageNumber = page.number,
            pageSize = page.size,
            isFirst = page.isFirst,
            isLast = page.isLast
        )
    }
}

/**
 * Controller for login history and security audit endpoints.
 */
@RestController
@RequestMapping("/api/auth/login-history")
@Tag(name = "Login History", description = "View and manage login activity audit trail")
class LoginHistoryController(
    private val loginAttemptRepository: LoginAttemptRepository
) {

    @Operation(
        summary = "Get Login History",
        description = "Retrieves the authenticated user's login history with pagination"
    )
    @GetMapping
    fun getLoginHistory(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<LoginHistoryPageResponse> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"))
        val loginHistory = loginAttemptRepository.findByUserIdOrderByTimestampDesc(
            principal.userId,
            pageable
        )

        return ResponseEntity.ok(LoginHistoryPageResponse.from(loginHistory))
    }

    @Operation(
        summary = "Get Suspicious Login Attempts",
        description = "Retrieves login attempts that were flagged as suspicious"
    )
    @GetMapping("/suspicious")
    fun getSuspiciousAttempts(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<LoginHistoryPageResponse> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"))
        val suspiciousAttempts = loginAttemptRepository
            .findByUserIdAndFlaggedAsSuspiciousTrueOrderByTimestampDesc(principal.userId, pageable)

        return ResponseEntity.ok(LoginHistoryPageResponse.from(suspiciousAttempts))
    }

    @Operation(
        summary = "Acknowledge Suspicious Login",
        description = "Marks a suspicious login attempt as acknowledged by the user"
    )
    @PostMapping("/{attemptId}/acknowledge")
    fun acknowledgeSuspiciousLogin(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @PathVariable attemptId: UUID
    ): ResponseEntity<Unit> {
        val attempt = loginAttemptRepository.findById(attemptId)
            .orElseThrow { NoSuchElementException("Login attempt not found") }

        // Verify this attempt belongs to the authenticated user
        if (attempt.userId != principal.userId) {
            throw IllegalArgumentException("Cannot acknowledge another user's login attempt")
        }

        attempt.acknowledge()
        loginAttemptRepository.save(attempt)

        return ResponseEntity.noContent().build()
    }

    @Operation(
        summary = "Get Login Stats",
        description = "Returns statistics about recent login activity"
    )
    @GetMapping("/stats")
    fun getLoginStats(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<LoginStatsResponse> {
        val last30Days = Instant.now().minusSeconds(30 * 24 * 60 * 60)

        val successCount = loginAttemptRepository.countByUserIdAndAttemptTypeAndTimestampAfter(
            principal.userId,
            LoginAttemptType.SUCCESS,
            last30Days
        )

        val failedCount = loginAttemptRepository.countByUserIdAndAttemptTypeAndTimestampAfter(
            principal.userId,
            LoginAttemptType.FAILED,
            last30Days
        )

        val suspiciousCount = loginAttemptRepository
            .findByUserIdAndFlaggedAsSuspiciousTrueOrderByTimestampDesc(
                principal.userId,
                PageRequest.of(0, 1000)
            )
            .totalElements

        val uniqueDevices = loginAttemptRepository.findUniqueDeviceFingerprintsForUser(principal.userId).size

        return ResponseEntity.ok(
            LoginStatsResponse(
                successfulLogins30Days = successCount,
                failedLogins30Days = failedCount,
                suspiciousLogins = suspiciousCount,
                uniqueDevices = uniqueDevices
            )
        )
    }
}

/**
 * Response DTO for login statistics.
 */
data class LoginStatsResponse(
    val successfulLogins30Days: Long,
    val failedLogins30Days: Long,
    val suspiciousLogins: Long,
    val uniqueDevices: Int
)
