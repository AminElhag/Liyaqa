package com.liyaqa.liyaqa_internal_app.features.facility.presentation.detail

import androidx.lifecycle.viewModelScope
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.core.presentation.BaseViewModel
import com.liyaqa.liyaqa_internal_app.core.presentation.UiEvent
import com.liyaqa.liyaqa_internal_app.core.presentation.UiState
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.Facility
import com.liyaqa.liyaqa_internal_app.features.facility.domain.usecase.GetFacilityByIdUseCase
import kotlinx.coroutines.launch

/**
 * ViewModel for Facility Detail Screen.
 * Loads and displays comprehensive facility information.
 */
class FacilityDetailViewModel(
    private val getFacilityByIdUseCase: GetFacilityByIdUseCase,
    private val facilityId: String
) : BaseViewModel<FacilityDetailUiState, FacilityDetailUiEvent>() {

    override fun initialState(): FacilityDetailUiState = FacilityDetailUiState()

    init {
        loadFacilityDetails()
    }

    override fun onEvent(event: FacilityDetailUiEvent) {
        when (event) {
            is FacilityDetailUiEvent.Refresh -> loadFacilityDetails()
            is FacilityDetailUiEvent.ClearError -> setState { copy(error = null) }
        }
    }

    private fun loadFacilityDetails() {
        viewModelScope.launch {
            setState { copy(isLoading = true, error = null) }

            when (val result = getFacilityByIdUseCase(facilityId)) {
                is Result.Success -> {
                    setState {
                        copy(
                            isLoading = false,
                            facility = result.data,
                            error = null
                        )
                    }
                }

                is Result.Error -> {
                    setState {
                        copy(
                            isLoading = false,
                            error = result.message ?: "Failed to load facility details"
                        )
                    }
                }

                is Result.Loading -> {
                    // Already handled
                }
            }
        }
    }
}

/**
 * UI State for Facility Detail Screen
 */
data class FacilityDetailUiState(
    val isLoading: Boolean = false,
    val facility: Facility? = null,
    val error: String? = null
) : UiState

/**
 * UI Events for Facility Detail Screen
 */
sealed interface FacilityDetailUiEvent : UiEvent {
    data object Refresh : FacilityDetailUiEvent
    data object ClearError : FacilityDetailUiEvent
}
