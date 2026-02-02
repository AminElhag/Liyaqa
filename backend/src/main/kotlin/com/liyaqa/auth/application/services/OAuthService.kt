package com.liyaqa.auth.application.services

import com.liyaqa.auth.domain.model.oauth.OAuthProvider
import com.liyaqa.auth.domain.model.oauth.ProviderType
import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.ports.OAuthProviderRepository
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.shared.domain.LocalizedText
import org.slf4j.LoggerFactory
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.RestClient
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.*

@Service
class OAuthService(
    private val oauthProviderRepository: OAuthProviderRepository,
    private val userRepository: UserRepository,
    private val authService: AuthService,
    private val restClient: RestClient = RestClient.create()
) {
    private val log = LoggerFactory.getLogger(OAuthService::class.java)

    companion object {
        private const val GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
        private const val GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
        private const val GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
        
        private const val MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
        private const val MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
        private const val MICROSOFT_USERINFO_URL = "https://graph.microsoft.com/v1.0/me"
    }

    @Transactional(readOnly = true)
    fun getEnabledProviders(organizationId: UUID): List<OAuthProvider> {
        return oauthProviderRepository.findByOrganizationIdAndEnabledTrue(organizationId)
    }

    fun buildAuthorizationUrl(
        provider: OAuthProvider,
        redirectUri: String,
        state: String
    ): String {
        val authUrl = provider.authorizationUri ?: getDefaultAuthUrl(provider.provider)
        val scopes = provider.scopes ?: getDefaultScopes(provider.provider)
        
        return buildString {
            append(authUrl)
            append("?client_id=").append(encode(provider.clientId))
            append("&redirect_uri=").append(encode(redirectUri))
            append("&response_type=code")
            append("&scope=").append(encode(scopes))
            append("&state=").append(encode(state))
            
            if (provider.provider == ProviderType.GOOGLE) {
                append("&access_type=offline")
                append("&prompt=consent")
            }
        }
    }

    @Transactional
    fun handleCallback(
        organizationId: UUID,
        providerType: ProviderType,
        code: String,
        redirectUri: String
    ): OAuthLoginResult {
        val provider = oauthProviderRepository.findByOrganizationIdAndProviderAndEnabledTrue(
            organizationId, providerType
        ) ?: throw IllegalArgumentException("OAuth provider not configured or disabled")

        // Exchange code for tokens
        val tokens = exchangeCodeForTokens(provider, code, redirectUri)
        
        // Get user info from provider
        val userInfo = getUserInfo(provider, tokens.accessToken)
        
        // Find or create user
        val user = findOrCreateUser(organizationId, provider, userInfo)
        
        // Generate auth tokens
        val authResult = authService.generateTokensForUser(user, null)
        
        return OAuthLoginResult(
            user = user,
            accessToken = authResult.accessToken,
            refreshToken = authResult.refreshToken,
            expiresIn = authResult.expiresIn
        )
    }

    private fun exchangeCodeForTokens(
        provider: OAuthProvider,
        code: String,
        redirectUri: String
    ): OAuthTokens {
        val tokenUrl = provider.tokenUri ?: getDefaultTokenUrl(provider.provider)
        
        val requestBody = mapOf(
            "grant_type" to "authorization_code",
            "code" to code,
            "redirect_uri" to redirectUri,
            "client_id" to provider.clientId,
            "client_secret" to provider.clientSecret
        )
        
        try {
            val response = restClient.post()
                .uri(tokenUrl)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                .body(encodeFormData(requestBody))
                .retrieve()
                .body(Map::class.java) as Map<*, *>
            
            return OAuthTokens(
                accessToken = response["access_token"] as String,
                refreshToken = response["refresh_token"] as? String,
                expiresIn = (response["expires_in"] as? Number)?.toLong() ?: 3600
            )
        } catch (e: Exception) {
            log.error("Failed to exchange OAuth code for tokens", e)
            throw IllegalStateException("OAuth token exchange failed: ${e.message}")
        }
    }

    private fun getUserInfo(provider: OAuthProvider, accessToken: String): OAuthUserInfo {
        val userInfoUrl = provider.userInfoUri ?: getDefaultUserInfoUrl(provider.provider)
        
        try {
            val response = restClient.get()
                .uri(userInfoUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer $accessToken")
                .retrieve()
                .body(Map::class.java) as Map<*, *>
            
            return when (provider.provider) {
                ProviderType.GOOGLE -> parseGoogleUserInfo(response)
                ProviderType.MICROSOFT -> parseMicrosoftUserInfo(response)
                ProviderType.OKTA -> parseOktaUserInfo(response)
                ProviderType.GITHUB -> parseGithubUserInfo(response)
                ProviderType.CUSTOM -> parseCustomUserInfo(response)
            }
        } catch (e: Exception) {
            log.error("Failed to get OAuth user info", e)
            throw IllegalStateException("OAuth user info retrieval failed: ${e.message}")
        }
    }

    private fun findOrCreateUser(
        organizationId: UUID,
        provider: OAuthProvider,
        userInfo: OAuthUserInfo
    ): User {
        // Try to find existing user by OAuth provider ID
        val existingUser = userRepository.findByOAuthProviderAndProviderId(
            provider.provider.name,
            userInfo.providerId
        )
        
        if (existingUser != null) {
            return existingUser
        }
        
        // Try to find by email
        val userByEmail = userRepository.findByEmail(userInfo.email).orElse(null)
        if (userByEmail != null) {
            // Link OAuth to existing account
            userByEmail.linkOAuthProvider(provider.provider.name, userInfo.providerId)
            return userRepository.save(userByEmail)
        }
        
        // Auto-provision if enabled
        if (!provider.autoProvision) {
            throw IllegalStateException("User does not exist and auto-provisioning is disabled")
        }
        
        // Create new user
        val newUser = User(
            email = userInfo.email,
            passwordHash = "", // No password for OAuth users
            displayName = LocalizedText.of(userInfo.name ?: userInfo.email.substringBefore("@")),
            role = Role.MEMBER,
            oauthProvider = provider.provider.name,
            oauthProviderId = userInfo.providerId
        )
        
        log.info("Auto-provisioned new user from OAuth: ${userInfo.email}")
        return userRepository.save(newUser)
    }

    private fun parseGoogleUserInfo(response: Map<*, *>): OAuthUserInfo {
        return OAuthUserInfo(
            providerId = response["id"] as String,
            email = response["email"] as String,
            name = response["name"] as? String,
            picture = response["picture"] as? String
        )
    }

    private fun parseMicrosoftUserInfo(response: Map<*, *>): OAuthUserInfo {
        return OAuthUserInfo(
            providerId = response["id"] as String,
            email = response["mail"] as? String ?: response["userPrincipalName"] as String,
            name = response["displayName"] as? String,
            picture = null
        )
    }

    private fun parseOktaUserInfo(response: Map<*, *>): OAuthUserInfo {
        return OAuthUserInfo(
            providerId = response["sub"] as String,
            email = response["email"] as String,
            name = response["name"] as? String,
            picture = null
        )
    }

    private fun parseGithubUserInfo(response: Map<*, *>): OAuthUserInfo {
        return OAuthUserInfo(
            providerId = response["id"].toString(),
            email = response["email"] as String,
            name = response["name"] as? String ?: response["login"] as? String,
            picture = response["avatar_url"] as? String
        )
    }

    private fun parseCustomUserInfo(response: Map<*, *>): OAuthUserInfo {
        return OAuthUserInfo(
            providerId = response["sub"] as? String ?: response["id"] as String,
            email = response["email"] as String,
            name = response["name"] as? String,
            picture = null
        )
    }

    private fun getDefaultAuthUrl(provider: ProviderType): String {
        return when (provider) {
            ProviderType.GOOGLE -> GOOGLE_AUTH_URL
            ProviderType.MICROSOFT -> MICROSOFT_AUTH_URL
            else -> throw IllegalArgumentException("No default auth URL for $provider")
        }
    }

    private fun getDefaultTokenUrl(provider: ProviderType): String {
        return when (provider) {
            ProviderType.GOOGLE -> GOOGLE_TOKEN_URL
            ProviderType.MICROSOFT -> MICROSOFT_TOKEN_URL
            else -> throw IllegalArgumentException("No default token URL for $provider")
        }
    }

    private fun getDefaultUserInfoUrl(provider: ProviderType): String {
        return when (provider) {
            ProviderType.GOOGLE -> GOOGLE_USERINFO_URL
            ProviderType.MICROSOFT -> MICROSOFT_USERINFO_URL
            else -> throw IllegalArgumentException("No default user info URL for $provider")
        }
    }

    private fun getDefaultScopes(provider: ProviderType): String {
        return when (provider) {
            ProviderType.GOOGLE -> "openid email profile"
            ProviderType.MICROSOFT -> "openid email profile User.Read"
            ProviderType.OKTA -> "openid email profile"
            ProviderType.GITHUB -> "user:email"
            ProviderType.CUSTOM -> "openid email profile"
        }
    }

    private fun encode(value: String): String {
        return URLEncoder.encode(value, StandardCharsets.UTF_8)
    }

    private fun encodeFormData(data: Map<String, String>): String {
        return data.entries.joinToString("&") { (key, value) ->
            "${encode(key)}=${encode(value)}"
        }
    }
}

data class OAuthTokens(
    val accessToken: String,
    val refreshToken: String?,
    val expiresIn: Long
)

data class OAuthUserInfo(
    val providerId: String,
    val email: String,
    val name: String?,
    val picture: String?
)

data class OAuthLoginResult(
    val user: User,
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long
)
