package com.liyaqa.auth.api

import com.liyaqa.auth.application.services.AuthService
import com.liyaqa.auth.application.services.MfaService
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
import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Duration

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User authentication and session management")
class AuthController(
    private val authService: AuthService,
    private val mfaService: MfaService,
    private val clubRepository: ClubRepository,
    private val permissionService: PermissionService,
    private val brandingService: BrandingService,
    private val passwordPolicyService: com.liyaqa.auth.application.services.PasswordPolicyService,
    private val csrfTokenProvider: com.liyaqa.config.CsrfTokenProvider
) {

    companion object {
        private const val ACCESS_TOKEN_COOKIE_NAME = "access_token"
        private const val REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
        private const val ACCESS_TOKEN_MAX_AGE_SECONDS = 900L // 15 minutes
        private const val REFRESH_TOKEN_MAX_AGE_SECONDS = 604800L // 7 days
    }
    @Operation(
        summary = "Login",
        description = "Authenticates a user with email and password. Returns JWT access and refresh tokens, " +
                "or MFA required response if user has MFA enabled. " +
                "Tenant ID can be provided in the request body, or resolved automatically from subdomain."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Login successful or MFA required"),
        ApiResponse(responseCode = "400", description = "Tenant ID required (not in body or subdomain)"),
        ApiResponse(responseCode = "401", description = "Invalid credentials"),
        ApiResponse(responseCode = "429", description = "Too many requests - rate limited")
    ])
    @PostMapping("/login")
    fun login(
        @Valid @RequestBody request: LoginRequest,
        httpRequest: HttpServletRequest,
        httpResponse: HttpServletResponse
    ): ResponseEntity<Any> {
        // Resolve tenant ID from request body or subdomain
        val tenantId = request.tenantId
            ?: (httpRequest.getAttribute(TenantInterceptor.SUBDOMAIN_TENANT_ATTRIBUTE) as? TenantId)?.value
            ?: throw IllegalArgumentException(
                "Tenant ID is required. Access via your club's subdomain or provide tenantId in the request. | " +
                "معرّف المنشأة مطلوب. قم بالوصول عبر النطاق الفرعي لناديك أو قم بتوفير tenantId في الطلب."
            )

        val loginResult = authService.login(request.toCommand(tenantId))
        val useCookieAuth = isCookieAuthMode(httpRequest)

        return when (loginResult) {
            is com.liyaqa.auth.application.services.LoginResult.MfaRequired -> {
                ResponseEntity.ok(
                    MfaRequiredResponse(
                        userId = loginResult.mfaResult.userId,
                        email = loginResult.mfaResult.email
                    )
                )
            }
            is com.liyaqa.auth.application.services.LoginResult.Success -> {
                // Look up organization ID from club to include in response
                val organizationId = clubRepository.findById(tenantId)
                    .map { it.organizationId }
                    .orElse(null)

                // Load user permissions
                val permissions = permissionService.getUserPermissionCodes(loginResult.authResult.user.id)

                if (useCookieAuth) {
                    // Set tokens as HTTPOnly cookies
                    val csrfToken = setAuthCookies(
                        httpResponse,
                        loginResult.authResult.accessToken,
                        loginResult.authResult.refreshToken,
                        loginResult.authResult.user.id.toString()
                    )

                    // Return user info and CSRF token (no tokens in body)
                    val response = mapOf(
                        "user" to UserResponse.from(loginResult.authResult.user, organizationId, permissions),
                        "csrfToken" to csrfToken,
                        "expiresIn" to loginResult.authResult.expiresIn,
                        "tokenType" to "Cookie"
                    )
                    ResponseEntity.ok(response)
                } else {
                    // Return tokens in response body (traditional Bearer auth)
                    ResponseEntity.ok(AuthResponse.from(loginResult.authResult, organizationId, permissions))
                }
            }
        }
    }

    @Operation(
        summary = "Verify MFA and Complete Login",
        description = "Verifies TOTP or backup code and completes the login process, returning JWT tokens"
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "MFA verified, login successful"),
        ApiResponse(responseCode = "401", description = "Invalid MFA code")
    ])
    @PostMapping("/mfa/verify-login")
    fun verifyMfaAndLogin(
        @Valid @RequestBody request: MfaLoginVerifyRequest
    ): ResponseEntity<Any> {
        // Verify the MFA code
        val isValid = mfaService.verifyMfaLogin(request.userId, request.code)

        if (!isValid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(mapOf("error" to "Invalid MFA code"))
        }

        // Complete login
        val result = authService.verifyMfaAndLogin(request.userId, request.code, request.deviceInfo)

        // Look up organization ID from club
        val organizationId = clubRepository.findById(result.user.tenantId)
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
    fun refresh(
        @Valid @RequestBody request: RefreshTokenRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<AuthResponse> {
        val ipAddress = httpRequest.remoteAddr
        val result = authService.refreshTokens(request.toCommand(ipAddress))

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

    /**
     * Checks password strength and returns a score and validation errors.
     * This endpoint is used by the frontend to provide real-time feedback during password entry.
     */
    @PostMapping("/check-password-strength")
    fun checkPasswordStrength(
        @Valid @RequestBody request: PasswordStrengthRequest
    ): ResponseEntity<PasswordStrengthResponse> {
        val strength = passwordPolicyService.calculatePasswordStrength(request.password)
        val policyConfig = passwordPolicyService.getPolicyForUser(request.isPlatformUser ?: false)
        val validation = passwordPolicyService.validatePassword(request.password, policyConfig)

        return ResponseEntity.ok(
            PasswordStrengthResponse(
                score = strength,
                isValid = validation.isValid,
                violations = validation.violations
            )
        )
    }

    /**
     * Returns a CSRF token for cookie-based authentication.
     * The token must be included in the X-CSRF-Token header for state-changing requests.
     */
    @GetMapping("/csrf")
    fun getCsrfToken(
        @AuthenticationPrincipal principal: JwtUserPrincipal?,
        httpRequest: HttpServletRequest
    ): ResponseEntity<Map<String, String>> {
        // Generate CSRF token using user ID as session identifier
        val sessionId = principal?.userId?.toString() ?: httpRequest.session.id
        val csrfToken = csrfTokenProvider.generateToken(sessionId)

        return ResponseEntity.ok(mapOf("csrfToken" to csrfToken))
    }

    // ===== Cookie Helper Methods =====

    /**
     * Checks if the request wants cookie-based authentication.
     * Determined by X-Auth-Mode header.
     */
    private fun isCookieAuthMode(request: HttpServletRequest): Boolean {
        val authMode = request.getHeader("X-Auth-Mode")
        return authMode?.equals("cookie", ignoreCase = true) ?: false
    }

    /**
     * Sets authentication tokens as HTTPOnly cookies in the response.
     * Also generates and returns a CSRF token.
     */
    private fun setAuthCookies(
        response: HttpServletResponse,
        accessToken: String,
        refreshToken: String,
        userId: String
    ): String {
        // Set access token cookie
        val accessTokenCookie = ResponseCookie.from(ACCESS_TOKEN_COOKIE_NAME, accessToken)
            .httpOnly(true)
            .secure(true) // Only over HTTPS in production
            .sameSite("Strict")
            .path("/")
            .maxAge(Duration.ofSeconds(ACCESS_TOKEN_MAX_AGE_SECONDS))
            .build()

        // Set refresh token cookie
        val refreshTokenCookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, refreshToken)
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/")
            .maxAge(Duration.ofSeconds(REFRESH_TOKEN_MAX_AGE_SECONDS))
            .build()

        response.addHeader("Set-Cookie", accessTokenCookie.toString())
        response.addHeader("Set-Cookie", refreshTokenCookie.toString())

        // Generate CSRF token
        val csrfToken = csrfTokenProvider.generateToken(userId)

        return csrfToken
    }

    /**
     * Clears authentication cookies on logout.
     */
    private fun clearAuthCookies(response: HttpServletResponse, userId: String?) {
        // Clear access token cookie
        val clearAccessToken = ResponseCookie.from(ACCESS_TOKEN_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/")
            .maxAge(Duration.ZERO)
            .build()

        // Clear refresh token cookie
        val clearRefreshToken = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/")
            .maxAge(Duration.ZERO)
            .build()

        response.addHeader("Set-Cookie", clearAccessToken.toString())
        response.addHeader("Set-Cookie", clearRefreshToken.toString())

        // Remove CSRF token
        if (userId != null) {
            csrfTokenProvider.removeToken(userId)
        }
    }
}