package com.liyaqa.notification.api

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.notification.application.services.DeviceTokenService
import com.liyaqa.notification.domain.model.DevicePlatform
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/mobile/device-tokens")
@Tag(name = "Device Tokens", description = "Mobile push notification device token management")
class DeviceTokenController(
    private val deviceTokenService: DeviceTokenService,
    private val memberRepository: MemberRepository
) {

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Register device token for push notifications")
    fun registerDeviceToken(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @Valid @RequestBody request: RegisterDeviceTokenRequest
    ): ResponseEntity<DeviceTokenResponse> {
        val member = memberRepository.findByUserId(principal.userId).orElse(null)
            ?: throw IllegalStateException("Only members can register device tokens")

        val token = deviceTokenService.registerToken(
            memberId = member.id!!,
            token = request.token,
            platform = request.platform,
            tenantId = principal.tenantId,
            deviceName = request.deviceName,
            appVersion = request.appVersion
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(
            DeviceTokenResponse(
                success = true,
                message = "Device token registered successfully",
                messageAr = "تم تسجيل رمز الجهاز بنجاح"
            )
        )
    }

    @DeleteMapping("/{token}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Unregister device token")
    fun unregisterDeviceToken(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @PathVariable token: String
    ): ResponseEntity<DeviceTokenResponse> {
        deviceTokenService.unregisterToken(token)

        return ResponseEntity.ok(
            DeviceTokenResponse(
                success = true,
                message = "Device token unregistered successfully",
                messageAr = "تم إلغاء تسجيل رمز الجهاز بنجاح"
            )
        )
    }

    @DeleteMapping("/all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Unregister all device tokens for current member")
    fun unregisterAllDeviceTokens(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<DeviceTokenResponse> {
        val member = memberRepository.findByUserId(principal.userId).orElse(null)
            ?: throw IllegalStateException("Only members can manage device tokens")

        deviceTokenService.unregisterAllTokensForMember(member.id!!)

        return ResponseEntity.ok(
            DeviceTokenResponse(
                success = true,
                message = "All device tokens unregistered successfully",
                messageAr = "تم إلغاء تسجيل جميع رموز الأجهزة بنجاح"
            )
        )
    }
}

data class RegisterDeviceTokenRequest(
    @field:NotBlank(message = "Token is required")
    val token: String,

    @field:NotNull(message = "Platform is required")
    val platform: DevicePlatform,

    val deviceName: String? = null,
    val appVersion: String? = null
)

data class DeviceTokenResponse(
    val success: Boolean,
    val message: String,
    val messageAr: String? = null
)
