package com.liyaqa.liyaqa_internal_app.features.facility.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.facility.data.dto.CreateFacilityRequest
import com.liyaqa.liyaqa_internal_app.features.facility.data.dto.UpdateFacilityRequest
import com.liyaqa.liyaqa_internal_app.features.facility.data.dto.FacilityPageResponse
import com.liyaqa.liyaqa_internal_app.features.facility.data.repository.FacilityRepository
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.Facility
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.FacilityBranch

class GetFacilitiesUseCase(
    private val repository: FacilityRepository
) : BaseUseCase<GetFacilitiesUseCase.Params, FacilityPageResponse>() {
    data class Params(
        val page: Int = 0,
        val size: Int = 20,
        val searchTerm: String? = null,
        val tenantId: String? = null,
        val status: String? = null
    )

    override suspend fun execute(params: Params): Result<FacilityPageResponse> {
        return repository.getFacilities(params.page, params.size, params.searchTerm, params.tenantId, params.status)
    }
}

class GetFacilityByIdUseCase(
    private val repository: FacilityRepository
) : BaseUseCase<String, Facility>() {
    override suspend fun execute(params: String): Result<Facility> {
        if (params.isBlank()) {
            return Result.Error(IllegalArgumentException("Facility ID cannot be empty"), "Invalid facility ID")
        }
        return repository.getFacilityById(params)
    }
}

class CreateFacilityUseCase(
    private val repository: FacilityRepository
) : BaseUseCase<CreateFacilityRequest, Facility>() {
    override suspend fun execute(params: CreateFacilityRequest): Result<Facility> {
        if (params.name.isBlank()) {
            return Result.Error(IllegalArgumentException("Name cannot be empty"), "Facility name is required")
        }
        if (!params.contactEmail.contains("@")) {
            return Result.Error(IllegalArgumentException("Invalid email"), "Please enter a valid email")
        }
        return repository.createFacility(params)
    }
}

class UpdateFacilityUseCase(
    private val repository: FacilityRepository
) : BaseUseCase<UpdateFacilityUseCase.Params, Facility>() {
    data class Params(val id: String, val request: UpdateFacilityRequest)

    override suspend fun execute(params: Params): Result<Facility> {
        if (params.id.isBlank()) {
            return Result.Error(IllegalArgumentException("Facility ID cannot be empty"), "Invalid facility ID")
        }
        return repository.updateFacility(params.id, params.request)
    }
}

class DeleteFacilityUseCase(
    private val repository: FacilityRepository
) : BaseUseCase<String, Unit>() {
    override suspend fun execute(params: String): Result<Unit> {
        if (params.isBlank()) {
            return Result.Error(IllegalArgumentException("Facility ID cannot be empty"), "Invalid facility ID")
        }
        return repository.deleteFacility(params)
    }
}

class GetBranchesUseCase(
    private val repository: FacilityRepository
) : BaseUseCase<String, List<FacilityBranch>>() {
    override suspend fun execute(params: String): Result<List<FacilityBranch>> {
        if (params.isBlank()) {
            return Result.Error(IllegalArgumentException("Facility ID cannot be empty"), "Invalid facility ID")
        }
        return repository.getBranches(params)
    }
}
