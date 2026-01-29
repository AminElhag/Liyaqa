package com.liyaqa.compliance.api

import com.liyaqa.compliance.application.services.*
import com.liyaqa.compliance.domain.model.*
import com.liyaqa.shared.domain.TenantContext
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/data-protection")
@Tag(name = "Data Protection", description = "PDPL compliance - data processing activities, consents, DSRs, breaches")
class DataProtectionController(
    private val dataProtectionService: DataProtectionService,
    private val consentService: ConsentService,
    private val dsrService: DataSubjectRequestService,
    private val breachService: DataBreachService
) {
    // ===== Processing Activities (PDPL Article 7) =====

    @GetMapping("/activities")
    @PreAuthorize("hasAuthority('data_protection_view')")
    @Operation(summary = "Get data processing activities")
    fun getActivities(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<DataProcessingActivityResponse>> {
        val organizationId = getOrganizationId()
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val activities = dataProtectionService.getActivities(organizationId, pageable)
        return ResponseEntity.ok(activities.content.map { DataProcessingActivityResponse.from(it) })
    }

    @GetMapping("/activities/{id}")
    @PreAuthorize("hasAuthority('data_protection_view')")
    @Operation(summary = "Get activity by ID")
    fun getActivity(@PathVariable id: UUID): ResponseEntity<DataProcessingActivityResponse> {
        val activity = dataProtectionService.getActivity(id)
        return ResponseEntity.ok(DataProcessingActivityResponse.from(activity))
    }

    @PostMapping("/activities")
    @PreAuthorize("hasAuthority('data_protection_manage')")
    @Operation(summary = "Create a data processing activity")
    fun createActivity(@Valid @RequestBody request: CreateActivityRequest): ResponseEntity<DataProcessingActivityResponse> {
        val organizationId = getOrganizationId()
        val activity = dataProtectionService.createActivity(
            organizationId = organizationId,
            activityName = request.activityName,
            activityNameAr = request.activityNameAr,
            description = request.description,
            purpose = request.purpose,
            purposeAr = request.purposeAr,
            legalBasis = request.legalBasis,
            dataCategories = request.dataCategories,
            dataSubjects = request.dataSubjects,
            recipients = request.recipients,
            retentionPeriodDays = request.retentionPeriodDays,
            retentionJustification = request.retentionJustification,
            crossBorderTransfer = request.crossBorderTransfer,
            transferCountry = request.transferCountry,
            transferSafeguards = request.transferSafeguards,
            securityMeasures = request.securityMeasures,
            automatedDecisionMaking = request.automatedDecisionMaking,
            profiling = request.profiling,
            ownerId = request.ownerId
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(DataProcessingActivityResponse.from(activity))
    }

    @PostMapping("/activities/{id}/activate")
    @PreAuthorize("hasAuthority('data_protection_manage')")
    @Operation(summary = "Activate an activity")
    fun activateActivity(@PathVariable id: UUID): ResponseEntity<DataProcessingActivityResponse> {
        val activity = dataProtectionService.activateActivity(id)
        return ResponseEntity.ok(DataProcessingActivityResponse.from(activity))
    }

    @PostMapping("/activities/{id}/archive")
    @PreAuthorize("hasAuthority('data_protection_manage')")
    @Operation(summary = "Archive an activity")
    fun archiveActivity(@PathVariable id: UUID): ResponseEntity<DataProcessingActivityResponse> {
        val activity = dataProtectionService.archiveActivity(id)
        return ResponseEntity.ok(DataProcessingActivityResponse.from(activity))
    }

    @GetMapping("/activities/stats")
    @PreAuthorize("hasAuthority('data_protection_view')")
    @Operation(summary = "Get data protection statistics")
    fun getActivityStats(): ResponseEntity<DataProtectionStats> {
        val organizationId = getOrganizationId()
        val stats = dataProtectionService.getStats(organizationId)
        return ResponseEntity.ok(stats)
    }

    // ===== Consents (PDPL Article 6) =====

    @GetMapping("/consents")
    @PreAuthorize("hasAuthority('consent_view')")
    @Operation(summary = "Get consent records")
    fun getConsents(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) consentType: ConsentType?
    ): ResponseEntity<List<ConsentResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val consents = if (consentType != null) {
            consentService.getConsentsByType(consentType, pageable)
        } else {
            consentService.getAllConsents(pageable)
        }
        return ResponseEntity.ok(consents.content.map { ConsentResponse.from(it) })
    }

    @GetMapping("/consents/member/{memberId}")
    @PreAuthorize("hasAuthority('consent_view')")
    @Operation(summary = "Get consents for a member")
    fun getMemberConsents(@PathVariable memberId: UUID): ResponseEntity<List<ConsentResponse>> {
        val consents = consentService.getMemberConsents(memberId)
        return ResponseEntity.ok(consents.map { ConsentResponse.from(it) })
    }

    @GetMapping("/consents/member/{memberId}/active")
    @PreAuthorize("hasAuthority('consent_view')")
    @Operation(summary = "Get active consents for a member")
    fun getActiveConsents(@PathVariable memberId: UUID): ResponseEntity<List<ConsentResponse>> {
        val consents = consentService.getActiveConsents(memberId)
        return ResponseEntity.ok(consents.map { ConsentResponse.from(it) })
    }

    @PostMapping("/consents")
    @PreAuthorize("hasAuthority('consent_manage')")
    @Operation(summary = "Record consent")
    fun recordConsent(
        @Valid @RequestBody request: RecordConsentRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<ConsentResponse> {
        val consent = consentService.recordConsent(
            memberId = request.memberId,
            leadId = request.leadId,
            consentType = request.consentType,
            purpose = request.purpose,
            purposeAr = request.purposeAr,
            consentGiven = request.consentGiven,
            consentMethod = request.consentMethod,
            consentText = request.consentText,
            expiresAt = request.expiresAt,
            ipAddress = httpRequest.remoteAddr,
            userAgent = httpRequest.getHeader("User-Agent")
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(ConsentResponse.from(consent))
    }

    @PostMapping("/consents/{id}/withdraw")
    @PreAuthorize("hasAuthority('consent_manage')")
    @Operation(summary = "Withdraw consent")
    fun withdrawConsent(
        @PathVariable id: UUID,
        @RequestBody request: WithdrawConsentRequest
    ): ResponseEntity<ConsentResponse> {
        val consent = consentService.withdrawConsent(id, request.reason)
        return ResponseEntity.ok(ConsentResponse.from(consent))
    }

    // ===== Data Subject Requests (PDPL Articles 15-23) =====

    @GetMapping("/requests")
    @PreAuthorize("hasAuthority('dsr_view')")
    @Operation(summary = "Get data subject requests")
    fun getRequests(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) status: DSRStatus?
    ): ResponseEntity<List<DSRResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "receivedAt"))
        val requests = if (status != null) {
            dsrService.getRequestsByStatus(status, pageable)
        } else {
            dsrService.getRequests(pageable)
        }
        return ResponseEntity.ok(requests.content.map { DSRResponse.from(it) })
    }

    @GetMapping("/requests/{id}")
    @PreAuthorize("hasAuthority('dsr_view')")
    @Operation(summary = "Get DSR by ID")
    fun getRequest(@PathVariable id: UUID): ResponseEntity<DSRResponse> {
        val request = dsrService.getRequest(id)
        return ResponseEntity.ok(DSRResponse.from(request))
    }

    @GetMapping("/requests/overdue")
    @PreAuthorize("hasAuthority('dsr_view')")
    @Operation(summary = "Get overdue DSRs")
    fun getOverdueRequests(): ResponseEntity<List<DSRResponse>> {
        val requests = dsrService.getOverdueRequests()
        return ResponseEntity.ok(requests.map { DSRResponse.from(it) })
    }

    @PostMapping("/requests")
    @PreAuthorize("hasAuthority('dsr_process')")
    @Operation(summary = "Create a data subject request")
    fun createRequest(@Valid @RequestBody request: CreateDSRRequest): ResponseEntity<DSRResponse> {
        val dsr = dsrService.createRequest(
            memberId = request.memberId,
            requesterName = request.requesterName,
            requesterEmail = request.requesterEmail,
            requesterPhone = request.requesterPhone,
            requestType = request.requestType,
            description = request.description,
            priority = request.priority
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(DSRResponse.from(dsr))
    }

    @PostMapping("/requests/{id}/verify")
    @PreAuthorize("hasAuthority('dsr_process')")
    @Operation(summary = "Verify requester identity")
    fun verifyIdentity(
        @PathVariable id: UUID,
        @Valid @RequestBody request: VerifyIdentityRequest
    ): ResponseEntity<DSRResponse> {
        val userId = getCurrentUserId()
        val dsr = dsrService.verifyIdentity(id, userId, request.method)
        return ResponseEntity.ok(DSRResponse.from(dsr))
    }

    @PostMapping("/requests/{id}/assign")
    @PreAuthorize("hasAuthority('dsr_process')")
    @Operation(summary = "Assign DSR to user")
    fun assignRequest(
        @PathVariable id: UUID,
        @RequestParam userId: UUID
    ): ResponseEntity<DSRResponse> {
        val dsr = dsrService.assignRequest(id, userId)
        return ResponseEntity.ok(DSRResponse.from(dsr))
    }

    @PostMapping("/requests/{id}/start")
    @PreAuthorize("hasAuthority('dsr_process')")
    @Operation(summary = "Start processing DSR")
    fun startProcessing(@PathVariable id: UUID): ResponseEntity<DSRResponse> {
        val dsr = dsrService.startProcessing(id)
        return ResponseEntity.ok(DSRResponse.from(dsr))
    }

    @PostMapping("/requests/{id}/complete")
    @PreAuthorize("hasAuthority('dsr_process')")
    @Operation(summary = "Complete DSR")
    fun completeRequest(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CompleteDSRRequest
    ): ResponseEntity<DSRResponse> {
        val dsr = dsrService.completeRequest(id, request.responseMethod, request.dataExportPath)
        return ResponseEntity.ok(DSRResponse.from(dsr))
    }

    @PostMapping("/requests/{id}/reject")
    @PreAuthorize("hasAuthority('dsr_process')")
    @Operation(summary = "Reject DSR")
    fun rejectRequest(
        @PathVariable id: UUID,
        @RequestParam reason: String
    ): ResponseEntity<DSRResponse> {
        val dsr = dsrService.rejectRequest(id, reason)
        return ResponseEntity.ok(DSRResponse.from(dsr))
    }

    @PostMapping("/requests/{id}/extend")
    @PreAuthorize("hasAuthority('dsr_process')")
    @Operation(summary = "Extend DSR deadline")
    fun extendDeadline(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ExtendDSRRequest
    ): ResponseEntity<DSRResponse> {
        val dsr = dsrService.extendDeadline(id, request.newDueDate, request.reason)
        return ResponseEntity.ok(DSRResponse.from(dsr))
    }

    @GetMapping("/requests/stats")
    @PreAuthorize("hasAuthority('dsr_view')")
    @Operation(summary = "Get DSR statistics")
    fun getDSRStats(): ResponseEntity<DSRStats> {
        val stats = dsrService.getStats()
        return ResponseEntity.ok(stats)
    }

    // ===== Breaches (PDPL Article 29) =====

    @GetMapping("/breaches")
    @PreAuthorize("hasAuthority('breach_view')")
    @Operation(summary = "Get data breaches")
    fun getBreaches(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<BreachResponse>> {
        val organizationId = getOrganizationId()
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "discoveredAt"))
        val breaches = breachService.getBreaches(organizationId, pageable)
        return ResponseEntity.ok(breaches.content.map { BreachResponse.from(it) })
    }

    @GetMapping("/breaches/{id}")
    @PreAuthorize("hasAuthority('breach_view')")
    @Operation(summary = "Get breach by ID")
    fun getBreach(@PathVariable id: UUID): ResponseEntity<BreachResponse> {
        val breach = breachService.getBreach(id)
        return ResponseEntity.ok(BreachResponse.from(breach))
    }

    @PostMapping("/breaches")
    @PreAuthorize("hasAuthority('breach_manage')")
    @Operation(summary = "Report a data breach")
    fun reportBreach(@Valid @RequestBody request: ReportBreachRequest): ResponseEntity<BreachResponse> {
        val organizationId = getOrganizationId()
        val userId = getCurrentUserId()
        val breach = breachService.reportBreach(
            organizationId = organizationId,
            title = request.title,
            description = request.description,
            discoveredAt = request.discoveredAt,
            discoveredBy = userId,
            occurredAt = request.occurredAt,
            breachType = request.breachType,
            breachSource = request.breachSource,
            affectedDataTypes = request.affectedDataTypes,
            affectedRecordsCount = request.affectedRecordsCount,
            affectedMembersCount = request.affectedMembersCount,
            severity = request.severity
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(BreachResponse.from(breach))
    }

    @PostMapping("/breaches/{id}/investigate")
    @PreAuthorize("hasAuthority('breach_manage')")
    @Operation(summary = "Start breach investigation")
    fun startInvestigation(@PathVariable id: UUID): ResponseEntity<BreachResponse> {
        val userId = getCurrentUserId()
        val breach = breachService.startInvestigation(id, userId)
        return ResponseEntity.ok(BreachResponse.from(breach))
    }

    @PostMapping("/breaches/{id}/contain")
    @PreAuthorize("hasAuthority('breach_manage')")
    @Operation(summary = "Mark breach as contained")
    fun containBreach(@PathVariable id: UUID): ResponseEntity<BreachResponse> {
        val breach = breachService.containBreach(id)
        return ResponseEntity.ok(BreachResponse.from(breach))
    }

    @PostMapping("/breaches/{id}/resolve")
    @PreAuthorize("hasAuthority('breach_manage')")
    @Operation(summary = "Resolve breach")
    fun resolveBreach(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ResolveBreachRequest
    ): ResponseEntity<BreachResponse> {
        val breach = breachService.resolveBreach(id, request.rootCause, request.remediation)
        return ResponseEntity.ok(BreachResponse.from(breach))
    }

    @PostMapping("/breaches/{id}/sdaia-notification")
    @PreAuthorize("hasAuthority('breach_manage')")
    @Operation(summary = "Record SDAIA notification")
    fun recordSdaiaNotification(
        @PathVariable id: UUID,
        @RequestParam reference: String
    ): ResponseEntity<BreachResponse> {
        val breach = breachService.recordSdaiaNotification(id, reference)
        return ResponseEntity.ok(BreachResponse.from(breach))
    }

    @GetMapping("/breaches/stats")
    @PreAuthorize("hasAuthority('breach_view')")
    @Operation(summary = "Get breach statistics")
    fun getBreachStats(): ResponseEntity<BreachStats> {
        val organizationId = getOrganizationId()
        val stats = breachService.getBreachStats(organizationId)
        return ResponseEntity.ok(stats)
    }

    private fun getOrganizationId(): UUID {
        return TenantContext.getCurrentOrganizationOrNull()?.value
            ?: TenantContext.getCurrentTenant().value
    }

    private fun getCurrentUserId(): UUID {
        val auth = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authentication found")
        return UUID.fromString(auth.name)
    }
}
