package com.liyaqa.platform.compliance.controller

import com.liyaqa.platform.compliance.dto.DataExportRequestResponse
import com.liyaqa.platform.compliance.dto.RejectDataExportRequest
import com.liyaqa.platform.compliance.model.DataExportRequestStatus
import com.liyaqa.platform.compliance.service.DataExportRequestService
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.shared.api.PageResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/platform/compliance/data-requests")
@PlatformSecured
@Tag(name = "Data Export", description = "Manage data export requests for GDPR/compliance")
class DataExportRequestController(
    private val dataExportRequestService: DataExportRequestService
) {

    @GetMapping
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_VIEW])
    @Operation(summary = "List data export requests", description = "List data export requests with optional filtering by status")
    @ApiResponse(responseCode = "200", description = "Data export requests retrieved successfully")
    fun listRequests(
        @RequestParam(required = false) status: DataExportRequestStatus?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<DataExportRequestResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val requests = dataExportRequestService.listRequests(status, pageable)
        return ResponseEntity.ok(PageResponse.from(requests))
    }

    @GetMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_VIEW])
    @Operation(summary = "Get data export request by ID", description = "Retrieve a data export request by its unique identifier")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Data export request found"),
        ApiResponse(responseCode = "404", description = "Data export request not found")
    )
    fun getRequest(@PathVariable id: UUID): ResponseEntity<DataExportRequestResponse> {
        return ResponseEntity.ok(dataExportRequestService.getRequest(id))
    }

    @PutMapping("/{id}/approve")
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_MANAGE])
    @Operation(summary = "Approve data export request", description = "Approve a pending data export request")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Data export request approved successfully"),
        ApiResponse(responseCode = "404", description = "Data export request not found"),
        ApiResponse(responseCode = "422", description = "Request is not in a state that can be approved")
    )
    fun approveRequest(@PathVariable id: UUID): ResponseEntity<DataExportRequestResponse> {
        return ResponseEntity.ok(dataExportRequestService.approveRequest(id))
    }

    @PutMapping("/{id}/reject")
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_MANAGE])
    @Operation(summary = "Reject data export request", description = "Reject a pending data export request with a reason")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Data export request rejected successfully"),
        ApiResponse(responseCode = "404", description = "Data export request not found"),
        ApiResponse(responseCode = "422", description = "Request is not in a state that can be rejected")
    )
    fun rejectRequest(
        @PathVariable id: UUID,
        @RequestBody request: RejectDataExportRequest
    ): ResponseEntity<DataExportRequestResponse> {
        return ResponseEntity.ok(dataExportRequestService.rejectRequest(id, request))
    }
}
