package com.liyaqa.member.presentation.screens.subscription

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.repository.MemberRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SubscriptionDetailState(
    val isLoading: Boolean = false,
    val subscription: Subscription? = null,
    val error: SubscriptionDetailError? = null
)

data class SubscriptionDetailError(
    val message: String,
    val messageAr: String? = null
)

class SubscriptionDetailScreenModel(
    private val memberRepository: MemberRepository
) : ScreenModel {

    private val _state = MutableStateFlow(SubscriptionDetailState())
    val state: StateFlow<SubscriptionDetailState> = _state.asStateFlow()

    fun loadSubscription() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            memberRepository.getSubscription().collect { result ->
                result.onSuccess { response ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            subscription = response.subscription
                        )
                    }
                }.onError { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = SubscriptionDetailError(
                                message = error.message ?: "Failed to load subscription",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
            }
        }
    }
}
