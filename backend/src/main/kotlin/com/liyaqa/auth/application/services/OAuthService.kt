package com.liyaqa.auth.application.services

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.auth.domain.model.oauth.OAuthProvider
import com.liyaqa.auth.domain.model.oauth.ProviderType
import com.liyaqa.auth.domain.ports.OAuthProviderRepository
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.shared.domain.LocalizedText
import org.slf4j.LoggerFactory
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap
import org.springframework.web.client.RestTemplate
import org.springframework.web.util.UriComponentsBuilder
import java.security.SecureRandom
import java.util.*

/**
 * OAuth user information from provider.
 */
data class OAuthUserInfo(
    val providerId: String,
    val email: String,
    val name: String?,
    val givenName: String?,
    val familyName: String?,
    val picture: String?
)

/**
 * OAuth token response.
 */
data class OAuth2TokenResponse(
    val accessToken: String,
    val tokenType: String,
    val expiresIn: Int?,
    val refreshToken: String?,
    val scope: String?,
    val idToken: String?
)

/**
 * Service for OAuth 2.0 / OpenID Connect authentication.
 */
@Service
@Transactional
class OAuthService(
    private val oauthProviderRepository: OAuthProviderRepository,
    private val userRepository: UserRepository,
    private val restTemplate: RestTemplate = RestTemplate()
) {
    private val logger = LoggerFactory.getLogger(OAuthService::class.java)
    private val secureRandom = SecureRandom()

    /**
     * Gets enabled OAuth providers for an organization.
     */
    @Transactional(readOnly = true)
    fun getEnabledProviders(organizationId: UUID?): List<OAuthProvider> {
        return oauthProviderRepository.findEnabledByOrganizationId(organizationId)
    }

    /**
     * Builds the authorization URL for OAuth flow.
     * 
     * @param providerId OAuth provider ID
     * @param baseUrl Base URL for redirect URI
     * @return Authorization URL to redirect user to
     */
    fun buildAuthorizationUrl(providerId: UUID, baseUrl: String): String {
        val provider = oauthProviderRepository.findByIdOrNull(providerId)
            ?: throw IllegalArgumentException("OAuth provider not found: $providerId")

        if (!provider.enabled) {
            throw IllegalStateException("OAuth provider is disabled: ${provider.provider}")
        }

        // Generate state for CSRF protection
        val state = generateState()

        // Build authorization URL
        val authUri = provider.authorizationUri ?: getDefaultAuthorizationUri(provider.provider)
        val redirectUri = provider.getRedirectUri(baseUrl)
        val scopes = provider.getScopesList().joinToString(" ")

        return UriComponentsBuilder.fromUriString(authUri)
            .queryParam("client_id", provider.clientId)
            .queryParam("redirect_uri", redirectUri)
            .queryParam("response_type", "code")
            .queryParam("scope", scopes.ifBlank { getDefaultScopes(provider.provider) })
            .queryParam("state", state)
            .build()
            .toUriString()
    }

    /**
     * Handles OAuth callback and exchanges authorization code for tokens.
     * 
     * @param code Authorization code from provider
     * @param state State parameter for CSRF validation
     * @param providerId OAuth provider ID
     * @param baseUrl Base URL for redirect URI
     * @return User info from OAuth provider
     */
    fun handleCallback(code: String, state: String, providerId: UUID, baseUrl: String): OAuthUserInfo {
        val provider = oauthProviderRepository.findByIdOrNull(providerId)
            ?: throw IllegalArgumentException("OAuth provider not found: $providerId")

        // TODO: Validate state parameter against stored value (requires state storage)

        // Exchange authorization code for access token
        val tokens = exchangeCodeForTokens(code, provider, baseUrl)

        // Fetch user info from provider
        return fetchUserInfo(tokens.accessToken, provider)
    }

    /**
     * Logs in or creates a user from OAuth user info.
     * 
     * @param userInfo OAuth user information
     * @param provider OAuth provider
     * @param tenantId Tenant ID
     * @return User (existing or newly created)
     */
    fun loginOrCreateUser(userInfo: OAuthUserInfo, provider: OAuthProvider, tenantId: UUID): User {
        // Try to find existing user by OAuth provider ID
        val existingUser = userRepository.findByOAuthProviderAndProviderId(
            provider.provider.name,
            userInfo.providerId
        )

        if (existingUser != null) {
            // User exists with OAuth link
            existingUser.recordSuccessfulLogin()
            logger.info("OAuth login for existing user: ${existingUser.id}")
            return userRepository.save(existingUser)
        }

        // Try to find by email
        val userByEmail = userRepository.findByEmailAndTenantId(userInfo.email, tenantId).orElse(null)

        if (userByEmail != null) {
            // User exists with same email - link OAuth account
            userByEmail.linkOAuthProvider(provider.provider.name, userInfo.providerId)
            userByEmail.recordSuccessfulLogin()
            logger.info("Linked OAuth provider to existing user: ${userByEmail.id}")
            return userRepository.save(userByEmail)
        }

        // No existing user - check if auto-provisioning is enabled
        if (!provider.autoProvision) {
            throw IllegalStateException("User not found and auto-provisioning is disabled")
        }

        // Create new user
        val newUser = User(
            email = userInfo.email,
            passwordHash = UUID.randomUUID().toString(), // Random password (user can't login without OAuth)
            displayName = LocalizedText(
                en = userInfo.name ?: userInfo.email,
                ar = null
            ),
            role = Role.MEMBER, // Default role
            status = UserStatus.ACTIVE,
            oauthProvider = provider.provider.name,
            oauthProviderId = userInfo.providerId
        )

        newUser.recordSuccessfulLogin()
        val savedUser = userRepository.save(newUser)
        logger.info("Created new user via OAuth: ${savedUser.id}")

        return savedUser
    }

    /**
     * Links an OAuth provider to an existing user account.
     */
    fun linkOAuthToUser(userId: UUID, provider: OAuthProvider, oauthUserId: String) {
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }

        user.linkOAuthProvider(provider.provider.name, oauthUserId)
        userRepository.save(user)

        logger.info("Linked OAuth provider ${provider.provider} to user: $userId")
    }

    /**
     * Unlinks OAuth provider from user account.
     */
    fun unlinkOAuthFromUser(userId: UUID) {
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }

        user.unlinkOAuthProvider()
        userRepository.save(user)

        logger.info("Unlinked OAuth provider from user: $userId")
    }

    /**
     * Exchanges authorization code for access token.
     */
    private fun exchangeCodeForTokens(code: String, provider: OAuthProvider, baseUrl: String): OAuth2TokenResponse {
        val tokenUri = provider.tokenUri ?: getDefaultTokenUri(provider.provider)
        val redirectUri = provider.getRedirectUri(baseUrl)

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED

        val body: MultiValueMap<String, String> = LinkedMultiValueMap()
        body.add("grant_type", "authorization_code")
        body.add("code", code)
        body.add("redirect_uri", redirectUri)
        body.add("client_id", provider.clientId)
        body.add("client_secret", provider.clientSecret)

        val request = HttpEntity(body, headers)

        try {
            val response = restTemplate.postForObject(tokenUri, request, Map::class.java)
                ?: throw RuntimeException("Empty response from token endpoint")

            return OAuth2TokenResponse(
                accessToken = response["access_token"] as String,
                tokenType = response["token_type"] as? String ?: "Bearer",
                expiresIn = (response["expires_in"] as? Number)?.toInt(),
                refreshToken = response["refresh_token"] as? String,
                scope = response["scope"] as? String,
                idToken = response["id_token"] as? String
            )
        } catch (e: Exception) {
            logger.error("Failed to exchange code for tokens: ${e.message}", e)
            throw RuntimeException("Failed to authenticate with OAuth provider", e)
        }
    }

    /**
     * Fetches user information from OAuth provider.
     */
    private fun fetchUserInfo(accessToken: String, provider: OAuthProvider): OAuthUserInfo {
        val userInfoUri = provider.userInfoUri ?: getDefaultUserInfoUri(provider.provider)

        val headers = HttpHeaders()
        headers.setBearerAuth(accessToken)

        val request = HttpEntity<Void>(headers)

        try {
            val response = restTemplate.exchange(userInfoUri, HttpMethod.GET, request, Map::class.java)
            val body = response.body ?: throw RuntimeException("Empty response from user info endpoint")

            return when (provider.provider) {
                ProviderType.GOOGLE -> parseGoogleUserInfo(body)
                ProviderType.MICROSOFT -> parseMicrosoftUserInfo(body)
                ProviderType.GITHUB -> parseGitHubUserInfo(body)
                else -> parseGenericUserInfo(body)
            }
        } catch (e: Exception) {
            logger.error("Failed to fetch user info: ${e.message}", e)
            throw RuntimeException("Failed to fetch user information from OAuth provider", e)
        }
    }

    /**
     * Parses Google user info response.
     */
    private fun parseGoogleUserInfo(response: Map<*, *>): OAuthUserInfo {
        return OAuthUserInfo(
            providerId = response["sub"] as String,
            email = response["email"] as String,
            name = response["name"] as? String,
            givenName = response["given_name"] as? String,
            familyName = response["family_name"] as? String,
            picture = response["picture"] as? String
        )
    }

    /**
     * Parses Microsoft user info response.
     */
    private fun parseMicrosoftUserInfo(response: Map<*, *>): OAuthUserInfo {
        return OAuthUserInfo(
            providerId = response["id"] as String,
            email = response["userPrincipalName"] as? String ?: response["mail"] as String,
            name = response["displayName"] as? String,
            givenName = response["givenName"] as? String,
            familyName = response["surname"] as? String,
            picture = null
        )
    }

    /**
     * Parses GitHub user info response.
     */
    private fun parseGitHubUserInfo(response: Map<*, *>): OAuthUserInfo {
        return OAuthUserInfo(
            providerId = (response["id"] as Number).toString(),
            email = response["email"] as String,
            name = response["name"] as? String,
            givenName = null,
            familyName = null,
            picture = response["avatar_url"] as? String
        )
    }

    /**
     * Parses generic OAuth user info response.
     */
    private fun parseGenericUserInfo(response: Map<*, *>): OAuthUserInfo {
        return OAuthUserInfo(
            providerId = (response["sub"] ?: response["id"]) as String,
            email = response["email"] as String,
            name = response["name"] as? String,
            givenName = response["given_name"] as? String,
            familyName = response["family_name"] as? String,
            picture = response["picture"] as? String
        )
    }

    /**
     * Generates a random state parameter for CSRF protection.
     */
    private fun generateState(): String {
        val bytes = ByteArray(32)
        secureRandom.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    /**
     * Gets default authorization URI for known providers.
     */
    private fun getDefaultAuthorizationUri(provider: ProviderType): String {
        return when (provider) {
            ProviderType.GOOGLE -> "https://accounts.google.com/o/oauth2/v2/auth"
            ProviderType.MICROSOFT -> "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
            ProviderType.GITHUB -> "https://github.com/login/oauth/authorize"
            else -> throw IllegalArgumentException("Unknown provider: $provider")
        }
    }

    /**
     * Gets default token URI for known providers.
     */
    private fun getDefaultTokenUri(provider: ProviderType): String {
        return when (provider) {
            ProviderType.GOOGLE -> "https://oauth2.googleapis.com/token"
            ProviderType.MICROSOFT -> "https://login.microsoftonline.com/common/oauth2/v2.0/token"
            ProviderType.GITHUB -> "https://github.com/login/oauth/access_token"
            else -> throw IllegalArgumentException("Unknown provider: $provider")
        }
    }

    /**
     * Gets default user info URI for known providers.
     */
    private fun getDefaultUserInfoUri(provider: ProviderType): String {
        return when (provider) {
            ProviderType.GOOGLE -> "https://www.googleapis.com/oauth2/v3/userinfo"
            ProviderType.MICROSOFT -> "https://graph.microsoft.com/v1.0/me"
            ProviderType.GITHUB -> "https://api.github.com/user"
            else -> throw IllegalArgumentException("Unknown provider: $provider")
        }
    }

    /**
     * Gets default scopes for known providers.
     */
    private fun getDefaultScopes(provider: ProviderType): String {
        return when (provider) {
            ProviderType.GOOGLE -> "openid email profile"
            ProviderType.MICROSOFT -> "openid email profile User.Read"
            ProviderType.GITHUB -> "user:email"
            else -> "openid email profile"
        }
    }
}
