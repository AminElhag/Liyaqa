package com.liyaqa.auth.api

import com.liyaqa.auth.application.services.AuthService
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.branding.application.services.BrandingService
import com.liyaqa.organization.api.LocalizedTextResponse
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.shared.application.services.PermissionService
import com.liyaqa.shared.domain.TenantId
import com.liyaqa.shared.infrastructure.TenantInterceptor
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User authentication and session management")
class AuthController(
    private val authService: AuthService,
    private val clubRepository: ClubRepository,
    private val permissionService: PermissionService,
    private val brandingService: BrandingService
) {
    @Operation(
        summary = "Login",
        description = "Authenticates a user with email and password. Returns JWT access and refresh tokens. " +
                "Tenant ID can be provided in the request body, or resolved automatically from subdomain."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Login successful"),
        ApiResponse(responseCode = "400", description = "Tenant ID required (not in body or subdomain)"),
        ApiResponse(responseCode = "401", description = "Invalid credentials"),
        ApiResponse(responseCode = "429", description = "Too many requests - rate limited")
    ])
    @PostMapping("/login")
    fun login(
        @Valid @RequestBody request: LoginRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<AuthResponse> {
        // Resolve tenant ID from request body or subdomain
        val tenantId = request.tenantId
            ?: (httpRequest.getAttribute(TenantInterceptor.SUBDOMAIN_TENANT_ATTRIBUTE) as? TenantId)?.value
            ?: throw IllegalArgumentException(
                "Tenant ID is required. Access via your club's subdomain or provide tenantId in the request. | " +
                "معرّف المنشأة مطلوب. قم بالوصول عبر النطاق الفرعي لناديك أو قم بتوفير tenantId في الطلب."
            )

        val result = authService.login(request.toCommand(tenantId))

        // Look up organization ID from club to include in response
        val organizationId = clubRepository.findById(tenantId)
            .map { it.organizationId }
            .orElse(null)

        // Load user permissions
        val permissions = permissionService.getUserPermissionCodes(result.user.id)

        return ResponseEntity.ok(AuthResponse.from(result, organizationId, permissions))
    }

    @Operation(
        summary = "Get Tenant Info",
        description = "Returns tenant information resolved from the subdomain. " +
                "Used by frontend to determine if tenant ID field should be shown on login page."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Tenant info returned (may or may not be resolved)")
    ])
    @GetMapping("/tenant-info")
    fun getTenantInfo(httpRequest: HttpServletRequest): ResponseEntity<TenantInfoResponse> {
        val tenantId = httpRequest.getAttribute(TenantInterceptor.SUBDOMAIN_TENANT_ATTRIBUTE) as? TenantId
        val club = httpRequest.getAttribute(TenantInterceptor.SUBDOMAIN_CLUB_ATTRIBUTE) as? Club

        return if (tenantId != null && club != null) {
            // Fetch branding for the tenant
            val branding = brandingService.getBrandingForMobile(tenantId.value)

            ResponseEntity.ok(
                TenantInfoResponse(
                    resolved = true,
                    tenantId = tenantId.value,
                    clubName = LocalizedTextResponse.from(club.name),
                    slug = club.slug,
                    primaryColor = branding.primaryColor,
                    secondaryColor = branding.secondaryColor,
                    accentColor = branding.accentColor,
                    logoUrl = branding.logoLightUrl
                )
            )
        } else {
            ResponseEntity.ok(TenantInfoResponse(resolved = false))
        }
    }

    @Operation(
        summary = "Register",
        description = "Creates a new user account and returns JWT tokens"
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "201", description = "User registered successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request or email already exists"),
        ApiResponse(responseCode = "429", description = "Too many requests - rate limited")
    ])
    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): ResponseEntity<AuthResponse> {
        val result = authService.register(request.toCommand())

        // Look up organization ID from club
        val organizationId = clubRepository.findById(request.tenantId)
            .map { it.organizationId }
            .orElse(null)

        // Load user permissions (new users get default permissions based on role)
        val permissions = permissionService.getUserPermissionCodes(result.user.id)

        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.from(result, organizationId, permissions))
    }

    @Operation(
        summary = "Refresh Token",
        description = "Issues new access and refresh tokens using a valid refresh token"
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Tokens refreshed successfully"),
        ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    ])
    @PostMapping("/refresh")
    fun refresh(@Valid @RequestBody request: RefreshTokenRequest): ResponseEntity<AuthResponse> {
        val result = authService.refreshTokens(request.toCommand())

        // Look up organization ID from user's tenant (club)
        val organizationId = clubRepository.findById(result.user.tenantId)
            .map { it.organizationId }
            .orElse(null)

        // Load user permissions
        val permissions = permissionService.getUserPermissionCodes(result.user.id)

        return ResponseEntity.ok(AuthResponse.from(result, organizationId, permissions))
    }

    /**
     * Logs out by revoking the provided refresh token.
     */
    @PostMapping("/logout")
    fun logout(@Valid @RequestBody request: LogoutRequest): ResponseEntity<Unit> {
        authService.logout(request.refreshToken)
        return ResponseEntity.noContent().build()
    }

    /**
     * Logs out from all devices by revoking all refresh tokens.
     * Requires authentication.
     */
    @PostMapping("/logout-all")
    fun logoutAll(@AuthenticationPrincipal principal: JwtUserPrincipal): ResponseEntity<Unit> {
        authService.logoutAll(principal.userId)
        return ResponseEntity.noContent().build()
    }

    @Operation(
        summary = "Get Current User",
        description = "Returns the profile of the currently authenticated user"
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "User profile retrieved"),
        ApiResponse(responseCode = "401", description = "Not authenticated")
    ])
    @GetMapping("/me")
    fun getCurrentUser(@AuthenticationPrincipal principal: JwtUserPrincipal): ResponseEntity<UserResponse> {
        val user = authService.getCurrentUser(principal.userId)

        // Look up organization ID from user's tenant (club)
        val organizationId = if (user.tenantId != null && !user.isPlatformUser) {
            clubRepository.findById(user.tenantId)
                .map { it.organizationId }
                .orElse(null)
        } else {
            null
        }

        // Load user permissions
        val permissions = permissionService.getUserPermissionCodes(user.id)

        return ResponseEntity.ok(UserResponse.from(user, organizationId, permissions))
    }

    /**
     * Changes the authenticated user's password.
     * Requires authentication.
     */
    @PostMapping("/change-password")
    fun changePassword(
        @AuthenticationPrincipal principal: JwtUserPrincipal,
        @Valid @RequestBody request: ChangePasswordRequest
    ): ResponseEntity<Unit> {
        authService.changePassword(request.toCommand(principal.userId))
        return ResponseEntity.noContent().build()
    }

    /**
     * Requests a password reset.
     * Always returns success to prevent email enumeration.
     */
    @PostMapping("/forgot-password")
    fun forgotPassword(@Valid @RequestBody request: ForgotPasswordRequest): ResponseEntity<MessageResponse> {
        authService.forgotPassword(request.toCommand())
        // Always return success message to prevent email enumeration
        return ResponseEntity.ok(
            MessageResponse(
                message = "If an account exists with this email, a password reset link will be sent.",
                messageAr = "إذا كان هناك حساب بهذا البريد الإلكتروني، سيتم إرسال رابط إعادة تعيين كلمة المرور."
            )
        )
    }

    /**
     * Resets password using a valid reset token.
     */
    @PostMapping("/reset-password")
    fun resetPassword(@Valid @RequestBody request: ResetPasswordRequest): ResponseEntity<MessageResponse> {
        authService.resetPassword(request.toCommand())
        return ResponseEntity.ok(
            MessageResponse(
                message = "Password has been reset successfully. Please login with your new password.",
                messageAr = "تم إعادة تعيين كلمة المرور بنجاح. يرجى تسجيل الدخول بكلمة المرور الجديدة."
            )
        )
    }
}