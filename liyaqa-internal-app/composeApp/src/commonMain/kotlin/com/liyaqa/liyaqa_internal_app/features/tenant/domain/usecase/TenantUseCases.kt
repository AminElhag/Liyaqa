package com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.tenant.data.dto.CreateTenantRequest
import com.liyaqa.liyaqa_internal_app.features.tenant.data.dto.UpdateTenantRequest
import com.liyaqa.liyaqa_internal_app.features.tenant.data.dto.TenantPageResponse
import com.liyaqa.liyaqa_internal_app.features.tenant.data.repository.TenantRepository
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.Tenant

class GetTenantsUseCase(
    private val repository: TenantRepository
) : BaseUseCase<GetTenantsUseCase.Params, TenantPageResponse>() {
    data class Params(
        val page: Int = 0,
        val size: Int = 20,
        val searchTerm: String? = null,
        val status: String? = null
    )

    override suspend fun execute(params: Params): Result<TenantPageResponse> {
        return repository.getTenants(params.page, params.size, params.searchTerm, params.status)
    }
}

class GetTenantByIdUseCase(
    private val repository: TenantRepository
) : BaseUseCase<String, Tenant>() {
    override suspend fun execute(params: String): Result<Tenant> {
        if (params.isBlank()) {
            return Result.Error(IllegalArgumentException("Tenant ID cannot be empty"), "Invalid tenant ID")
        }
        return repository.getTenantById(params)
    }
}

class CreateTenantUseCase(
    private val repository: TenantRepository
) : BaseUseCase<CreateTenantRequest, Tenant>() {
    override suspend fun execute(params: CreateTenantRequest): Result<Tenant> {
        if (params.name.isBlank()) {
            return Result.Error(IllegalArgumentException("Name cannot be empty"), "Tenant name is required")
        }
        if (!params.contactEmail.contains("@")) {
            return Result.Error(IllegalArgumentException("Invalid email"), "Please enter a valid email")
        }
        return repository.createTenant(params)
    }
}

class UpdateTenantUseCase(
    private val repository: TenantRepository
) : BaseUseCase<UpdateTenantUseCase.Params, Tenant>() {
    data class Params(val id: String, val request: UpdateTenantRequest)

    override suspend fun execute(params: Params): Result<Tenant> {
        if (params.id.isBlank()) {
            return Result.Error(IllegalArgumentException("Tenant ID cannot be empty"), "Invalid tenant ID")
        }
        return repository.updateTenant(params.id, params.request)
    }
}

class DeleteTenantUseCase(
    private val repository: TenantRepository
) : BaseUseCase<String, Unit>() {
    override suspend fun execute(params: String): Result<Unit> {
        if (params.isBlank()) {
            return Result.Error(IllegalArgumentException("Tenant ID cannot be empty"), "Invalid tenant ID")
        }
        return repository.deleteTenant(params)
    }
}
