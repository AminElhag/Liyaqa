package com.liyaqa.organization.api

import com.liyaqa.organization.application.commands.CreateOrganizationCommand
import com.liyaqa.organization.application.commands.UpdateOrganizationCommand
import com.liyaqa.organization.application.services.OrganizationService
import com.liyaqa.shared.domain.LocalizedText
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
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
@RequestMapping("/api/organizations")
class OrganizationController(
    private val organizationService: OrganizationService
) {
    @PostMapping
    @PreAuthorize("hasAuthority('organizations_create')")
    fun createOrganization(
        @Valid @RequestBody request: CreateOrganizationRequest
    ): ResponseEntity<OrganizationResponse> {
        val command = CreateOrganizationCommand(
            name = LocalizedText(request.nameEn, request.nameAr),
            tradeName = request.tradeNameEn?.let { LocalizedText(it, request.tradeNameAr) },
            organizationType = request.organizationType,
            email = request.email,
            phone = request.phone,
            website = request.website,
            vatRegistrationNumber = request.vatRegistrationNumber,
            commercialRegistrationNumber = request.commercialRegistrationNumber
        )
        val org = organizationService.createOrganization(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(OrganizationResponse.from(org))
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('organizations_view')")
    fun getOrganization(@PathVariable id: UUID): ResponseEntity<OrganizationResponse> {
        val org = organizationService.getOrganization(id)
        return ResponseEntity.ok(OrganizationResponse.from(org))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('organizations_view')")
    fun getAllOrganizations(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<OrganizationResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))
        val orgPage = organizationService.getAllOrganizations(pageable)

        val response = PageResponse(
            content = orgPage.content.map { OrganizationResponse.from(it) },
            page = orgPage.number,
            size = orgPage.size,
            totalElements = orgPage.totalElements,
            totalPages = orgPage.totalPages,
            first = orgPage.isFirst,
            last = orgPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('organizations_update')")
    fun updateOrganization(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateOrganizationRequest
    ): ResponseEntity<OrganizationResponse> {
        val command = UpdateOrganizationCommand(
            name = request.nameEn?.let { LocalizedText(it, request.nameAr) },
            tradeName = request.tradeNameEn?.let { LocalizedText(it, request.tradeNameAr) },
            organizationType = request.organizationType,
            email = request.email,
            phone = request.phone,
            website = request.website,
            vatRegistrationNumber = request.vatRegistrationNumber,
            commercialRegistrationNumber = request.commercialRegistrationNumber
        )
        val org = organizationService.updateOrganization(id, command)
        return ResponseEntity.ok(OrganizationResponse.from(org))
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('organizations_update')")
    fun activateOrganization(@PathVariable id: UUID): ResponseEntity<OrganizationResponse> {
        val org = organizationService.activateOrganization(id)
        return ResponseEntity.ok(OrganizationResponse.from(org))
    }

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasAuthority('organizations_update')")
    fun suspendOrganization(@PathVariable id: UUID): ResponseEntity<OrganizationResponse> {
        val org = organizationService.suspendOrganization(id)
        return ResponseEntity.ok(OrganizationResponse.from(org))
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAuthority('organizations_update')")
    fun closeOrganization(@PathVariable id: UUID): ResponseEntity<OrganizationResponse> {
        val org = organizationService.closeOrganization(id)
        return ResponseEntity.ok(OrganizationResponse.from(org))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('organizations_delete')")
    fun deleteOrganization(@PathVariable id: UUID): ResponseEntity<Unit> {
        organizationService.deleteOrganization(id)
        return ResponseEntity.noContent().build()
    }
}