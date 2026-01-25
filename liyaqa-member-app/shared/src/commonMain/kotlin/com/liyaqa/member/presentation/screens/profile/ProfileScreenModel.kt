package com.liyaqa.member.presentation.screens.profile

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.repository.AuthRepository
import com.liyaqa.member.domain.repository.MemberRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileState(
    val isLoading: Boolean = false,
    val member: Member? = null,
    val subscription: Subscription? = null,
    val isLoggedOut: Boolean = false,
    val error: ProfileError? = null
)

data class ProfileError(
    val message: String,
    val messageAr: String? = null
)

class ProfileScreenModel(
    private val memberRepository: MemberRepository,
    private val authRepository: AuthRepository
) : ScreenModel {

    private val _state = MutableStateFlow(ProfileState())
    val state: StateFlow<ProfileState> = _state.asStateFlow()

    fun loadProfile() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            memberRepository.getProfile().collect { result ->
                result.onSuccess { member ->
                    _state.update {
                        it.copy(isLoading = false, member = member)
                    }
                }.onError { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = ProfileError(
                                message = error.message ?: "Failed to load profile",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
            }
        }

        // Also load subscription
        screenModelScope.launch {
            memberRepository.getSubscription().collect { result ->
                result.onSuccess { response ->
                    _state.update {
                        it.copy(subscription = response.subscription)
                    }
                }
            }
        }
    }

    fun logout() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }

            authRepository.logout().onSuccess {
                _state.update { it.copy(isLoading = false, isLoggedOut = true) }
            }.onError {
                // Even if API fails, clear local state
                _state.update { it.copy(isLoading = false, isLoggedOut = true) }
            }
        }
    }
}
