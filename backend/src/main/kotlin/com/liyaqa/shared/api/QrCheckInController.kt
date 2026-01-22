package com.liyaqa.shared.api

import com.liyaqa.attendance.application.commands.CheckInCommand
import com.liyaqa.attendance.application.services.AttendanceService
import com.liyaqa.attendance.domain.model.CheckInMethod
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.membership.application.services.MemberService
import com.liyaqa.membership.application.services.SubscriptionService
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.scheduling.application.services.BookingService
import com.liyaqa.scheduling.application.services.ClassService
import com.liyaqa.shared.infrastructure.qr.QrCodeService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * QR code check-in endpoints for mobile apps.
 */
@RestController
@RequestMapping("/api/qr")
@Tag(name = "QR Check-In", description = "QR code generation and check-in endpoints")
class QrCheckInController(
    private val qrCodeService: QrCodeService,
    private val attendanceService: AttendanceService,
    private val memberService: MemberService,
    private val subscriptionService: SubscriptionService,
    private val classService: ClassService,
    private val bookingService: BookingService
) {
    /**
     * Generate a personal QR code for the authenticated member.
     * This QR code can be shown at reception for quick check-in.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my QR code", description = "Generate personal QR code for check-in")
    fun getMyQrCode(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(defaultValue = "300") size: Int
    ): ResponseEntity<QrCodeResponse> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        // Generate a 24-hour token
        val token = qrCodeService.generateMemberQrToken(member.id, 1440)
        val qrDataUrl = qrCodeService.generateQrCodeDataUrl(token, size.coerceIn(100, 500), size.coerceIn(100, 500))
        val expiresAt = Instant.now().plus(24, ChronoUnit.HOURS)

        return ResponseEntity.ok(
            QrCodeResponse(
                qrCode = qrDataUrl,
                token = token,
                memberId = member.id,
                expiresAt = expiresAt,
                type = "member_check_in"
            )
        )
    }

    /**
     * Generate a QR code image (PNG) for the authenticated member.
     */
    @GetMapping("/me/image", produces = [MediaType.IMAGE_PNG_VALUE])
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my QR code image", description = "Generate QR code as PNG image")
    fun getMyQrCodeImage(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @RequestParam(defaultValue = "300") size: Int
    ): ResponseEntity<ByteArray> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.notFound().build()

        val token = qrCodeService.generateMemberQrToken(member.id, 1440)
        val imageBytes = qrCodeService.generateQrCodeImage(token, size.coerceIn(100, 500), size.coerceIn(100, 500))

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"qr-code.png\"")
            .body(imageBytes)
    }

    /**
     * Generate a QR code for a specific session (for display at reception/class).
     * Staff/Admin only.
     */
    @GetMapping("/session/{sessionId}")
    @PreAuthorize("hasAuthority('attendance_checkin')")
    @Operation(summary = "Get session QR code", description = "Generate QR code for session check-in")
    fun getSessionQrCode(
        @PathVariable sessionId: UUID,
        @RequestParam(defaultValue = "300") size: Int
    ): ResponseEntity<QrCodeResponse> {
        // Verify session exists
        try {
            classService.getSession(sessionId)
        } catch (e: NoSuchElementException) {
            return ResponseEntity.notFound().build()
        }

        val token = qrCodeService.generateSessionQrToken(sessionId, 240) // 4-hour validity
        val qrDataUrl = qrCodeService.generateQrCodeDataUrl(token, size.coerceIn(100, 500), size.coerceIn(100, 500))
        val expiresAt = Instant.now().plus(4, ChronoUnit.HOURS)

        return ResponseEntity.ok(
            QrCodeResponse(
                qrCode = qrDataUrl,
                token = token,
                sessionId = sessionId,
                expiresAt = expiresAt,
                type = "session_check_in"
            )
        )
    }

    /**
     * Process QR code check-in.
     * Validates the QR token and checks in the member at the specified location.
     */
    @PostMapping("/check-in")
    @PreAuthorize("hasAuthority('attendance_checkin')")
    @Operation(summary = "Check-in by QR code", description = "Process QR code scan and check in member")
    fun checkInByQr(
        @Valid @RequestBody request: QrCheckInRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<QrCheckInResponse> {
        // Validate QR token
        val payload = qrCodeService.validateQrToken(request.qrToken)
            ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                QrCheckInResponse(
                    success = false,
                    message = "Invalid or expired QR code",
                    messageAr = "رمز QR غير صالح أو منتهي الصلاحية"
                )
            )

        // Check token type
        if (payload.type != "check_in") {
            return ResponseEntity.badRequest().body(
                QrCheckInResponse(
                    success = false,
                    message = "Invalid QR code type",
                    messageAr = "نوع رمز QR غير صالح"
                )
            )
        }

        val memberId = payload.id

        // Get member
        val member = try {
            memberService.getMember(memberId)
        } catch (e: NoSuchElementException) {
            return ResponseEntity.badRequest().body(
                QrCheckInResponse(
                    success = false,
                    message = "Member not found",
                    messageAr = "العضو غير موجود"
                )
            )
        }

        // Check subscription status
        val subscription = subscriptionService.getActiveSubscription(memberId)
            ?: return ResponseEntity.badRequest().body(
                QrCheckInResponse(
                    success = false,
                    message = "No active subscription",
                    messageAr = "لا يوجد اشتراك نشط",
                    memberName = member.fullName.en
                )
            )

        if (subscription.status != SubscriptionStatus.ACTIVE) {
            return ResponseEntity.badRequest().body(
                QrCheckInResponse(
                    success = false,
                    message = "Subscription is ${subscription.status.name.lowercase()}",
                    messageAr = "الاشتراك ${getArabicStatus(subscription.status)}",
                    memberName = member.fullName.en
                )
            )
        }

        // Perform check-in
        val record = try {
            attendanceService.checkIn(
                CheckInCommand(
                    memberId = memberId,
                    locationId = request.locationId,
                    checkInMethod = CheckInMethod.QR_CODE,
                    notes = "QR code check-in",
                    createdBy = principal.userId
                )
            )
        } catch (e: IllegalStateException) {
            return ResponseEntity.badRequest().body(
                QrCheckInResponse(
                    success = false,
                    message = e.message ?: "Check-in failed",
                    messageAr = "فشل تسجيل الحضور",
                    memberName = member.fullName.en
                )
            )
        }

        return ResponseEntity.ok(
            QrCheckInResponse(
                success = true,
                message = "Welcome, ${member.firstName.en}!",
                messageAr = "مرحباً، ${member.firstName.get("ar")}!",
                memberName = member.fullName.en,
                checkInTime = record.checkInTime,
                subscriptionInfo = SubscriptionCheckInInfo(
                    status = subscription.status.name,
                    classesRemaining = subscription.classesRemaining,
                    daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), subscription.endDate)
                )
            )
        )
    }

    /**
     * Quick self check-in for mobile app (member scans location QR).
     */
    @PostMapping("/self-check-in")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Self check-in", description = "Member self check-in using location QR code")
    fun selfCheckIn(
        @Valid @RequestBody request: SelfCheckInRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<QrCheckInResponse> {
        val member = memberService.findMemberByUserId(principal.userId)
            ?: return ResponseEntity.badRequest().body(
                QrCheckInResponse(
                    success = false,
                    message = "Member not found",
                    messageAr = "العضو غير موجود"
                )
            )

        // Check subscription status
        val subscription = subscriptionService.getActiveSubscription(member.id)
            ?: return ResponseEntity.badRequest().body(
                QrCheckInResponse(
                    success = false,
                    message = "No active subscription",
                    messageAr = "لا يوجد اشتراك نشط",
                    memberName = member.fullName.en
                )
            )

        if (subscription.status != SubscriptionStatus.ACTIVE) {
            return ResponseEntity.badRequest().body(
                QrCheckInResponse(
                    success = false,
                    message = "Subscription is ${subscription.status.name.lowercase()}",
                    messageAr = "الاشتراك ${getArabicStatus(subscription.status)}",
                    memberName = member.fullName.en
                )
            )
        }

        // Perform check-in
        val record = try {
            attendanceService.checkIn(
                CheckInCommand(
                    memberId = member.id,
                    locationId = request.locationId,
                    checkInMethod = CheckInMethod.QR_CODE,
                    notes = "Self check-in via mobile app",
                    createdBy = null
                )
            )
        } catch (e: IllegalStateException) {
            return ResponseEntity.badRequest().body(
                QrCheckInResponse(
                    success = false,
                    message = e.message ?: "Check-in failed",
                    messageAr = "فشل تسجيل الحضور",
                    memberName = member.fullName.en
                )
            )
        }

        return ResponseEntity.ok(
            QrCheckInResponse(
                success = true,
                message = "Welcome, ${member.firstName.en}!",
                messageAr = "مرحباً، ${member.firstName.get("ar")}!",
                memberName = member.fullName.en,
                checkInTime = record.checkInTime,
                subscriptionInfo = SubscriptionCheckInInfo(
                    status = subscription.status.name,
                    classesRemaining = subscription.classesRemaining,
                    daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), subscription.endDate)
                )
            )
        )
    }

    private fun getArabicStatus(status: SubscriptionStatus): String {
        return when (status) {
            SubscriptionStatus.ACTIVE -> "نشط"
            SubscriptionStatus.PENDING_PAYMENT -> "في انتظار الدفع"
            SubscriptionStatus.FROZEN -> "مجمد"
            SubscriptionStatus.CANCELLED -> "ملغي"
            SubscriptionStatus.EXPIRED -> "منتهي"
        }
    }
}

// ==================== REQUEST/RESPONSE DTOs ====================

data class QrCodeResponse(
    val qrCode: String, // data:image/png;base64,... format
    val token: String,
    val memberId: UUID? = null,
    val sessionId: UUID? = null,
    val expiresAt: Instant,
    val type: String
)

data class QrCheckInRequest(
    @field:NotBlank(message = "QR token is required")
    val qrToken: String,

    val locationId: UUID
)

data class SelfCheckInRequest(
    val locationId: UUID
)

data class QrCheckInResponse(
    val success: Boolean,
    val message: String,
    val messageAr: String,
    val memberName: String? = null,
    val checkInTime: Instant? = null,
    val subscriptionInfo: SubscriptionCheckInInfo? = null
)

data class SubscriptionCheckInInfo(
    val status: String,
    val classesRemaining: Int?,
    val daysRemaining: Long
)
