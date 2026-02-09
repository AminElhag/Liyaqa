package com.liyaqa.platform.compliance.controller

import com.liyaqa.platform.compliance.dto.ContractResponse
import com.liyaqa.platform.compliance.dto.CreateContractRequest
import com.liyaqa.platform.compliance.dto.RenewContractRequest
import com.liyaqa.platform.compliance.dto.UpdateContractRequest
import com.liyaqa.platform.compliance.service.ContractService
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.shared.api.PageResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/platform/compliance/contracts")
@PlatformSecured
@Tag(name = "Compliance Contracts", description = "Manage compliance contracts")
class ComplianceContractController(
    private val contractService: ContractService
) {

    @PostMapping
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_MANAGE])
    @Operation(summary = "Create contract", description = "Create a new compliance contract")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Contract created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data")
    )
    fun createContract(
        @RequestBody request: CreateContractRequest
    ): ResponseEntity<ContractResponse> {
        val response = contractService.createContract(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @GetMapping
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_VIEW])
    @Operation(summary = "List contracts", description = "List all compliance contracts with pagination and sorting")
    @ApiResponse(responseCode = "200", description = "Contracts retrieved successfully")
    fun listContracts(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<ContractResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val contracts = contractService.listContracts(pageable)
        return ResponseEntity.ok(PageResponse.from(contracts))
    }

    @GetMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_VIEW])
    @Operation(summary = "Get contract by ID", description = "Retrieve a compliance contract by its unique identifier")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Contract found"),
        ApiResponse(responseCode = "404", description = "Contract not found")
    )
    fun getContract(@PathVariable id: UUID): ResponseEntity<ContractResponse> {
        return ResponseEntity.ok(contractService.getContract(id))
    }

    @PutMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_MANAGE])
    @Operation(summary = "Update contract", description = "Update an existing compliance contract")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Contract updated successfully"),
        ApiResponse(responseCode = "404", description = "Contract not found")
    )
    fun updateContract(
        @PathVariable id: UUID,
        @RequestBody request: UpdateContractRequest
    ): ResponseEntity<ContractResponse> {
        return ResponseEntity.ok(contractService.updateContract(id, request))
    }

    @DeleteMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_MANAGE])
    @Operation(summary = "Delete contract", description = "Delete a compliance contract by its ID")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Contract deleted successfully"),
        ApiResponse(responseCode = "404", description = "Contract not found")
    )
    fun deleteContract(@PathVariable id: UUID): ResponseEntity<Void> {
        contractService.deleteContract(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/expiring")
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_VIEW])
    @Operation(summary = "Get expiring contracts", description = "Retrieve contracts expiring within a specified number of days")
    @ApiResponse(responseCode = "200", description = "Expiring contracts retrieved successfully")
    fun getExpiringContracts(
        @RequestParam(defaultValue = "30") days: Int,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "endDate") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDirection: String
    ): ResponseEntity<PageResponse<ContractResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val contracts = contractService.getExpiringContracts(days, pageable)
        return ResponseEntity.ok(PageResponse.from(contracts))
    }

    @PutMapping("/{id}/renew")
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_MANAGE])
    @Operation(summary = "Renew contract", description = "Renew an existing compliance contract with new terms")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Contract renewed successfully"),
        ApiResponse(responseCode = "404", description = "Contract not found"),
        ApiResponse(responseCode = "422", description = "Contract cannot be renewed in its current state")
    )
    fun renewContract(
        @PathVariable id: UUID,
        @RequestBody request: RenewContractRequest
    ): ResponseEntity<ContractResponse> {
        return ResponseEntity.ok(contractService.renewContract(id, request))
    }
}
