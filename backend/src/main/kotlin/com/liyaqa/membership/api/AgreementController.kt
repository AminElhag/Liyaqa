package com.liyaqa.membership.api

import com.liyaqa.membership.application.services.AgreementService
import com.liyaqa.membership.domain.model.AgreementType
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
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
@RequestMapping("/api/agreements")
@Tag(name = "Agreements", description = "Agreement templates management - liability waivers, terms, health disclosures")
class AgreementController(
    private val agreementService: AgreementService
) {

    @PostMapping
    @PreAuthorize("hasAuthority('agreements_create')")
    @Operation(summary = "Create a new agreement template")
    fun createAgreement(
        @Valid @RequestBody request: CreateAgreementRequest
    ): ResponseEntity<AgreementResponse> {
        val agreement = agreementService.createAgreement(
            title = request.title.toLocalizedText(),
            content = request.content.toLocalizedText(),
            type = request.type,
            isMandatory = request.isMandatory,
            sortOrder = request.sortOrder,
            hasHealthQuestions = request.hasHealthQuestions,
            effectiveDate = request.effectiveDate
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(AgreementResponse.from(agreement))
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('agreements_view')")
    @Operation(summary = "Get agreement by ID")
    fun getAgreement(@PathVariable id: UUID): ResponseEntity<AgreementResponse> {
        val agreement = agreementService.getAgreement(id)
        return ResponseEntity.ok(AgreementResponse.from(agreement))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('agreements_view')")
    @Operation(summary = "Get all agreements with optional active filter")
    fun getAllAgreements(
        @RequestParam(defaultValue = "false") activeOnly: Boolean,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "sortOrder") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDirection: String
    ): ResponseEntity<PageResponse<AgreementResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))

        val agreementPage = if (activeOnly) {
            agreementService.getActiveAgreements(pageable)
        } else {
            agreementService.getAllAgreements(pageable)
        }

        val response = PageResponse(
            content = agreementPage.content.map { AgreementResponse.from(it) },
            page = agreementPage.number,
            size = agreementPage.size,
            totalElements = agreementPage.totalElements,
            totalPages = agreementPage.totalPages,
            first = agreementPage.isFirst,
            last = agreementPage.isLast
        )

        return ResponseEntity.ok(response)
    }

    @GetMapping("/mandatory")
    @PreAuthorize("hasAuthority('agreements_view')")
    @Operation(summary = "Get all mandatory agreements")
    fun getMandatoryAgreements(): ResponseEntity<List<AgreementSummaryResponse>> {
        val agreements = agreementService.getMandatoryAgreements()
        return ResponseEntity.ok(agreements.map { AgreementSummaryResponse.from(it) })
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("hasAuthority('agreements_view')")
    @Operation(summary = "Get agreements by type")
    fun getAgreementsByType(@PathVariable type: AgreementType): ResponseEntity<List<AgreementSummaryResponse>> {
        val agreements = agreementService.getAgreementsByType(type)
        return ResponseEntity.ok(agreements.map { AgreementSummaryResponse.from(it) })
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('agreements_update')")
    @Operation(summary = "Update an agreement (increments version if content changes)")
    fun updateAgreement(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateAgreementRequest
    ): ResponseEntity<AgreementResponse> {
        val agreement = agreementService.updateAgreement(
            id = id,
            title = request.title?.toLocalizedText(),
            content = request.content?.toLocalizedText(),
            isMandatory = request.isMandatory,
            sortOrder = request.sortOrder,
            hasHealthQuestions = request.hasHealthQuestions,
            effectiveDate = request.effectiveDate
        )
        return ResponseEntity.ok(AgreementResponse.from(agreement))
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('agreements_update')")
    @Operation(summary = "Activate an agreement")
    fun activateAgreement(@PathVariable id: UUID): ResponseEntity<AgreementResponse> {
        val agreement = agreementService.activateAgreement(id)
        return ResponseEntity.ok(AgreementResponse.from(agreement))
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('agreements_update')")
    @Operation(summary = "Deactivate an agreement")
    fun deactivateAgreement(@PathVariable id: UUID): ResponseEntity<AgreementResponse> {
        val agreement = agreementService.deactivateAgreement(id)
        return ResponseEntity.ok(AgreementResponse.from(agreement))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('agreements_delete')")
    @Operation(summary = "Deactivate an agreement (soft delete)")
    fun deleteAgreement(@PathVariable id: UUID): ResponseEntity<Void> {
        agreementService.deactivateAgreement(id)
        return ResponseEntity.noContent().build()
    }
}

@RestController
@RequestMapping("/api/members/{memberId}/agreements")
@Tag(name = "Member Agreements", description = "Member agreement signing and status")
class MemberAgreementController(
    private val agreementService: AgreementService
) {

    @GetMapping
    @PreAuthorize("hasAuthority('agreements_view')")
    @Operation(summary = "Get member's signed agreements")
    fun getMemberAgreements(
        @PathVariable memberId: UUID
    ): ResponseEntity<List<MemberAgreementResponse>> {
        val memberAgreements = agreementService.getMemberAgreements(memberId)
        val responses = memberAgreements.map { ma ->
            val agreement = try {
                agreementService.getAgreement(ma.agreementId)
            } catch (e: NoSuchElementException) {
                null
            }
            MemberAgreementResponse.from(ma, agreement)
        }
        return ResponseEntity.ok(responses)
    }

    @GetMapping("/status")
    @PreAuthorize("hasAuthority('agreements_view')")
    @Operation(summary = "Get member's agreement status (signed vs pending)")
    fun getMemberAgreementStatus(
        @PathVariable memberId: UUID
    ): ResponseEntity<MemberAgreementStatusResponse> {
        val signedAgreements = agreementService.getMemberAgreements(memberId)
        val pendingMandatory = agreementService.getPendingMandatoryAgreements(memberId)
        val allMandatorySigned = agreementService.hasSignedAllMandatoryAgreements(memberId)

        val response = MemberAgreementStatusResponse(
            memberId = memberId,
            signedAgreements = signedAgreements.map { ma ->
                val agreement = try {
                    agreementService.getAgreement(ma.agreementId)
                } catch (e: NoSuchElementException) {
                    null
                }
                MemberAgreementResponse.from(ma, agreement)
            },
            pendingMandatoryAgreements = pendingMandatory.map { AgreementSummaryResponse.from(it) },
            allMandatorySigned = allMandatorySigned
        )

        return ResponseEntity.ok(response)
    }

    @PostMapping
    @PreAuthorize("hasAuthority('agreements_update')")
    @Operation(summary = "Sign an agreement for a member")
    fun signAgreement(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: SignAgreementRequest
    ): ResponseEntity<MemberAgreementResponse> {
        val memberAgreement = agreementService.signAgreement(
            memberId = memberId,
            agreementId = request.agreementId,
            ipAddress = request.ipAddress,
            userAgent = request.userAgent,
            signatureData = request.signatureData,
            healthData = request.healthData
        )
        val agreement = agreementService.getAgreement(request.agreementId)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(MemberAgreementResponse.from(memberAgreement, agreement))
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAuthority('agreements_update')")
    @Operation(summary = "Sign multiple agreements for a member")
    fun signAgreements(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: SignAgreementsRequest
    ): ResponseEntity<List<MemberAgreementResponse>> {
        val memberAgreements = agreementService.signAgreements(
            memberId = memberId,
            agreementIds = request.agreementIds,
            ipAddress = request.ipAddress,
            userAgent = request.userAgent,
            signatureData = request.signatureData,
            healthData = request.healthData
        )
        val responses = memberAgreements.map { ma ->
            val agreement = agreementService.getAgreement(ma.agreementId)
            MemberAgreementResponse.from(ma, agreement)
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(responses)
    }
}
