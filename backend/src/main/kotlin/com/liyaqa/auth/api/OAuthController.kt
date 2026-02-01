package com.liyaqa.auth.api

import com.liyaqa.auth.application.services.AuthResult
import com.liyaqa.auth.application.services.AuthService
import com.liyaqa.auth.application.services.OAuthService
import com.liyaqa.auth.domain.model.oauth.OAuthProvider
import com.liyaqa.auth.domain.ports.OAuthProviderRepository
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for OAuth 2.0 / OpenID Connect authentication.
 */
@RestController
@RequestMapping("/api/auth/oauth")
class OAuthController(
    private val oauthService: OAuthService,
    private val oauthProviderRepository: OAuthProviderRepository,
    private val authService: AuthService
) {
    private val logger = LoggerFactory.getLogger(OAuthController::class.java)

    /**
     * Lists enabled OAuth providers for an organization.
     */
    @GetMapping("/providers")
    fun listProviders(
        @RequestParam(required = false) organizationId: UUID?
    ): ResponseEntity<OAuthProvidersResponse> {
        val providers = oauthService.getEnabledProviders(organizationId)
        val providerDtos = providers.map { OAuthProviderDto.from(it) }
        return ResponseEntity.ok(OAuthProvidersResponse(providerDtos))
    }

    /**
     * Initiates OAuth authorization flow.
     * Redirects user to OAuth provider's login page.
     */
    @GetMapping("/authorize/{providerId}")
    fun authorize(
        @PathVariable providerId: UUID,
        @RequestParam(required = false) baseUrl: String?,
        request: HttpServletRequest,
        response: HttpServletResponse
    ) {
        // Build base URL from request if not provided
        val effectiveBaseUrl = baseUrl ?: "${request.scheme}://${request.serverName}:${request.serverPort}"

        // Build authorization URL
        val authUrl = oauthService.buildAuthorizationUrl(providerId, effectiveBaseUrl)

        logger.info("Redirecting to OAuth provider: $providerId")

        // Redirect to OAuth provider
        response.sendRedirect(authUrl)
    }

    /**
     * Handles OAuth callback from provider.
     * Exchanges authorization code for tokens and creates/logs in user.
     */
    @GetMapping("/callback/{providerId}")
    fun callback(
        @PathVariable providerId: UUID,
        @RequestParam code: String,
        @RequestParam state: String,
        @RequestParam(required = false) tenantId: UUID?,
        request: HttpServletRequest,
        response: HttpServletResponse
    ): ResponseEntity<AuthResponse> {
        // Build base URL from request
        val baseUrl = "${request.scheme}://${request.serverName}:${request.serverPort}"

        // Handle callback and get user info
        val userInfo = oauthService.handleCallback(code, state, providerId, baseUrl)

        // Get provider
        val provider = oauthProviderRepository.findByIdOrNull(providerId)
            ?: throw IllegalArgumentException("OAuth provider not found: $providerId")

        // Determine tenant ID (use provider's org ID if not specified)
        val effectiveTenantId = tenantId ?: provider.organizationId
            ?: throw IllegalArgumentException("Tenant ID required for OAuth login")

        // Set tenant context
        TenantContext.setCurrentTenant(TenantId(effectiveTenantId))

        // Login or create user
        val user = oauthService.loginOrCreateUser(userInfo, provider, effectiveTenantId)

        // Generate tokens using existing auth service
        val authResult = authService.generateTokensForUser(user, "OAuth ${provider.provider}")

        logger.info("OAuth login successful for user: ${user.id}")

        return ResponseEntity.ok(AuthResponse.from(authResult))
    }

    /**
     * Links OAuth provider to existing user account.
     * Requires user to be authenticated.
     */
    @PostMapping("/link")
    fun linkProvider(
        @RequestBody request: LinkOAuthRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<MessageResponse> {
        val provider = oauthProviderRepository.findByIdOrNull(request.providerId)
            ?: throw IllegalArgumentException("OAuth provider not found: ${request.providerId}")

        oauthService.linkOAuthToUser(principal.userId, provider, request.oauthUserId)

        return ResponseEntity.ok(MessageResponse("OAuth provider linked successfully"))
    }

    /**
     * Unlinks OAuth provider from user account.
     * Requires user to be authenticated.
     */
    @PostMapping("/unlink")
    fun unlinkProvider(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<MessageResponse> {
        oauthService.unlinkOAuthFromUser(principal.userId)

        return ResponseEntity.ok(MessageResponse("OAuth provider unlinked successfully"))
    }
}

/**
 * DTO for OAuth provider information (public-facing).
 */
data class OAuthProviderDto(
    val id: UUID,
    val provider: String,
    val displayName: String?,
    val iconUrl: String?,
    val enabled: Boolean
) {
    companion object {
        fun from(provider: OAuthProvider): OAuthProviderDto {
            return OAuthProviderDto(
                id = provider.id,
                provider = provider.provider.name,
                displayName = provider.displayName ?: provider.provider.name,
                iconUrl = provider.iconUrl,
                enabled = provider.enabled
            )
        }
    }
}

/**
 * Response for list providers endpoint.
 */
data class OAuthProvidersResponse(
    val providers: List<OAuthProviderDto>
)

/**
 * Request for linking OAuth provider to account.
 */
data class LinkOAuthRequest(
    val providerId: UUID,
    val oauthUserId: String
)
