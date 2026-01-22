package com.liyaqa.member.data.auth

import com.liyaqa.member.data.api.TokenProvider
import com.liyaqa.member.data.auth.repository.AuthRepository
import com.liyaqa.member.data.auth.repository.AuthResult
import com.liyaqa.member.data.auth.storage.TokenStorage
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/**
 * Events emitted by the token provider for UI state changes.
 */
sealed interface TokenProviderEvent {
    /**
     * Session has expired and user needs to log in again.
     */
    data object SessionExpired : TokenProviderEvent

    /**
     * Access was forbidden (403 error).
     */
    data object AccessForbidden : TokenProviderEvent

    /**
     * Token was successfully refreshed.
     */
    data object TokenRefreshed : TokenProviderEvent

    /**
     * Token refresh failed.
     */
    data class RefreshFailed(val message: String) : TokenProviderEvent
}

/**
 * Implementation of TokenProvider that integrates with TokenStorage and AuthRepository.
 * Handles token refresh on 401 responses.
 */
class AuthTokenProviderImpl(
    private val tokenStorage: TokenStorage,
    private val authRepositoryProvider: () -> AuthRepository,
    private val localeProvider: () -> String = { "en" }
) : TokenProvider {

    private val _events = MutableSharedFlow<TokenProviderEvent>()
    val events: SharedFlow<TokenProviderEvent> = _events.asSharedFlow()

    private var isRefreshing = false

    override suspend fun getAccessToken(): String? {
        return tokenStorage.getAccessToken()
    }

    override suspend fun getTenantId(): String? {
        return tokenStorage.getTenantId()
    }

    override fun getLocale(): String {
        return localeProvider()
    }

    override suspend fun onUnauthorized() {
        // Attempt token refresh if not already refreshing
        if (!isRefreshing) {
            isRefreshing = true
            try {
                val result = authRepositoryProvider().refreshToken()
                when (result) {
                    is AuthResult.Success -> {
                        _events.emit(TokenProviderEvent.TokenRefreshed)
                    }
                    is AuthResult.Error -> {
                        // Refresh failed - session expired
                        tokenStorage.clearAll()
                        _events.emit(TokenProviderEvent.SessionExpired)
                    }
                    is AuthResult.NetworkError -> {
                        _events.emit(TokenProviderEvent.RefreshFailed("Network error"))
                    }
                }
            } finally {
                isRefreshing = false
            }
        }
    }

    override suspend fun onForbidden() {
        _events.emit(TokenProviderEvent.AccessForbidden)
    }
}
