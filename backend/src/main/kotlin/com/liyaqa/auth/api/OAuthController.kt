package com.liyaqa.auth.api

import com.liyaqa.auth.application.services.OAuthService
import com.liyaqa.auth.domain.model.oauth.OAuthProvider
import com.liyaqa.auth.domain.model.oauth.ProviderType
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/auth/oauth")
@Tag(name = "OAuth", description = "OAuth 2.0 / OpenID Connect authentication")
class OAuthController(
    private val oauthService: OAuthService
) {

    @Operation(
        summary = "Get Enabled OAuth Providers",
        description = "Returns list of enabled OAuth providers for the organization"
    )
    @GetMapping("/providers")
    fun getProviders(
        @RequestParam organizationId: UUID
    ): ResponseEntity<List<OAuthProviderResponse>> {
        val providers = oauthService.getEnabledProviders(organizationId)
        val response = providers.map { OAuthProviderResponse.from(it) }
        return ResponseEntity.ok(response)
    }

    @Operation(
        summary = "Initiate OAuth Login",
        description = "Redirects to OAuth provider authorization page"
    )
    @GetMapping("/authorize/{provider}")
    fun authorize(
        @PathVariable provider: ProviderType,
        @RequestParam organizationId: UUID,
        @RequestParam redirectUri: String,
        @RequestParam state: String,
        response: HttpServletResponse
    ) {
        val oauthProvider = oauthService.getEnabledProviders(organizationId)
            .firstOrNull { it.provider == provider }
            ?: throw IllegalArgumentException("OAuth provider not configured")

        val authUrl = oauthService.buildAuthorizationUrl(oauthProvider, redirectUri, state)
        response.sendRedirect(authUrl)
    }

    @Operation(
        summary = "OAuth Callback",
        description = "Handles OAuth callback and completes authentication"
    )
    @GetMapping("/callback/{provider}")
    fun callback(
        @PathVariable provider: ProviderType,
        @RequestParam code: String,
        @RequestParam state: String,
        @RequestParam organizationId: UUID,
        @RequestParam redirectUri: String
    ): ResponseEntity<OAuthLoginResponse> {
        val result = oauthService.handleCallback(organizationId, provider, code, redirectUri)
        
        val response = OAuthLoginResponse(
            accessToken = result.accessToken,
            refreshToken = result.refreshToken,
            expiresIn = result.expiresIn,
            user = UserResponse.from(result.user, organizationId, emptyList())
        )
        
        return ResponseEntity.ok(response)
    }
}

data class OAuthProviderResponse(
    val id: UUID,
    val provider: ProviderType,
    val enabled: Boolean
) {
    companion object {
        fun from(provider: OAuthProvider): OAuthProviderResponse {
            return OAuthProviderResponse(
                id = provider.id!!,
                provider = provider.provider,
                enabled = provider.enabled
            )
        }
    }
}

data class OAuthLoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val user: UserResponse
)
