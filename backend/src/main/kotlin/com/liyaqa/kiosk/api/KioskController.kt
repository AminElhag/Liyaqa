package com.liyaqa.kiosk.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.kiosk.application.commands.*
import com.liyaqa.kiosk.application.services.KioskService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/kiosk")
@Tag(name = "Kiosk", description = "Self-service kiosk management")
class KioskController(
    private val kioskService: KioskService,
    private val objectMapper: ObjectMapper
) {
    // ========== Admin Endpoints (Device Management) ==========

    @PostMapping("/devices")
    @PreAuthorize("hasAuthority('kiosk_manage')")
    @Operation(summary = "Create a kiosk device")
    fun createDevice(@Valid @RequestBody request: CreateKioskDeviceRequest): ResponseEntity<KioskDeviceResponse> {
        val command = CreateKioskDeviceCommand(
            locationId = request.locationId,
            deviceName = request.deviceName,
            deviceNameAr = request.deviceNameAr,
            deviceCode = request.deviceCode,
            hardwareId = request.hardwareId,
            config = request.config,
            allowedActions = request.allowedActions
        )
        val device = kioskService.createDevice(command)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(KioskDeviceResponse.from(device, request.config, request.allowedActions?.map { it.name }))
    }

    @GetMapping("/devices")
    @PreAuthorize("hasAuthority('kiosk_view')")
    @Operation(summary = "List kiosk devices")
    fun listDevices(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<KioskDeviceResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "deviceName"))
        val devicesPage = kioskService.listDevices(pageable)
        return ResponseEntity.ok(PageResponse(
            content = devicesPage.content.map { parseAndMap(it) },
            page = devicesPage.number,
            size = devicesPage.size,
            totalElements = devicesPage.totalElements,
            totalPages = devicesPage.totalPages,
            first = devicesPage.isFirst,
            last = devicesPage.isLast
        ))
    }

    @GetMapping("/devices/{id}")
    @PreAuthorize("hasAuthority('kiosk_view')")
    @Operation(summary = "Get a kiosk device")
    fun getDevice(@PathVariable id: UUID): ResponseEntity<KioskDeviceResponse> {
        val device = kioskService.getDevice(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(parseAndMap(device))
    }

    @GetMapping("/devices/code/{code}")
    @Operation(summary = "Get device by code (for kiosk app)")
    fun getDeviceByCode(@PathVariable code: String): ResponseEntity<KioskDeviceResponse> {
        val device = kioskService.getDeviceByCode(code) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(parseAndMap(device))
    }

    @PutMapping("/devices/{id}")
    @PreAuthorize("hasAuthority('kiosk_manage')")
    @Operation(summary = "Update a kiosk device")
    fun updateDevice(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateKioskDeviceRequest
    ): ResponseEntity<KioskDeviceResponse> {
        val command = UpdateKioskDeviceCommand(
            deviceName = request.deviceName,
            deviceNameAr = request.deviceNameAr,
            status = request.status,
            config = request.config,
            allowedActions = request.allowedActions
        )
        val device = kioskService.updateDevice(id, command)
        return ResponseEntity.ok(parseAndMap(device))
    }

    @PostMapping("/devices/{id}/heartbeat")
    @Operation(summary = "Update device heartbeat")
    fun updateHeartbeat(@PathVariable id: UUID): ResponseEntity<Void> {
        kioskService.updateHeartbeat(id)
        return ResponseEntity.ok().build()
    }

    @DeleteMapping("/devices/{id}")
    @PreAuthorize("hasAuthority('kiosk_manage')")
    @Operation(summary = "Delete a kiosk device")
    fun deleteDevice(@PathVariable id: UUID): ResponseEntity<Void> {
        kioskService.deleteDevice(id)
        return ResponseEntity.noContent().build()
    }

    // ========== Public Endpoints (Kiosk App) ==========

    @PostMapping("/sessions")
    @Operation(summary = "Start a new kiosk session")
    fun startSession(@Valid @RequestBody request: StartSessionRequest): ResponseEntity<KioskSessionResponse> {
        val command = StartSessionCommand(kioskId = request.kioskId)
        val session = kioskService.startSession(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(KioskSessionResponse.from(session))
    }

    @GetMapping("/sessions/{id}")
    @Operation(summary = "Get a session")
    fun getSession(@PathVariable id: UUID): ResponseEntity<KioskSessionResponse> {
        val session = kioskService.getSession(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(KioskSessionResponse.from(session))
    }

    @PostMapping("/sessions/{id}/identify")
    @Operation(summary = "Identify member in session")
    fun identifyMember(
        @PathVariable id: UUID,
        @Valid @RequestBody request: IdentifyMemberRequest
    ): ResponseEntity<KioskSessionResponse> {
        val command = IdentifyMemberCommand(
            sessionId = id,
            method = request.method,
            value = request.value
        )
        val session = kioskService.identifyMember(command)
        return ResponseEntity.ok(KioskSessionResponse.from(session))
    }

    @PostMapping("/sessions/{id}/end")
    @Operation(summary = "End a session")
    fun endSession(
        @PathVariable id: UUID,
        @Valid @RequestBody request: EndSessionRequest
    ): ResponseEntity<KioskSessionResponse> {
        val command = EndSessionCommand(
            sessionId = id,
            status = request.status,
            feedbackRating = request.feedbackRating,
            feedbackComment = request.feedbackComment
        )
        val session = kioskService.endSession(command)
        return ResponseEntity.ok(KioskSessionResponse.from(session))
    }

    @PostMapping("/sessions/{id}/check-in")
    @Operation(summary = "Perform member check-in")
    fun checkIn(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CheckInRequest
    ): ResponseEntity<KioskTransactionResponse> {
        val command = CheckInCommand(sessionId = id, memberId = request.memberId)
        val transaction = kioskService.performCheckIn(command)
        return ResponseEntity.ok(KioskTransactionResponse.from(transaction))
    }

    @PostMapping("/sessions/{id}/transactions")
    @Operation(summary = "Create a transaction")
    fun createTransaction(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreateTransactionRequest
    ): ResponseEntity<KioskTransactionResponse> {
        val command = CreateTransactionCommand(
            sessionId = id,
            transactionType = request.transactionType,
            referenceType = request.referenceType,
            referenceId = request.referenceId,
            amount = request.amount,
            paymentMethod = request.paymentMethod
        )
        val transaction = kioskService.createTransaction(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(KioskTransactionResponse.from(transaction))
    }

    @GetMapping("/sessions/{id}/transactions")
    @Operation(summary = "Get transactions for a session")
    fun getSessionTransactions(@PathVariable id: UUID): ResponseEntity<List<KioskTransactionResponse>> {
        val transactions = kioskService.getTransactionsBySession(id)
        return ResponseEntity.ok(transactions.map { KioskTransactionResponse.from(it) })
    }

    @PostMapping("/transactions/{id}/complete")
    @Operation(summary = "Complete a transaction")
    fun completeTransaction(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CompleteTransactionRequest
    ): ResponseEntity<KioskTransactionResponse> {
        val command = CompleteTransactionCommand(
            transactionId = id,
            paymentReference = request.paymentReference
        )
        val transaction = kioskService.completeTransaction(command)
        return ResponseEntity.ok(KioskTransactionResponse.from(transaction))
    }

    @PostMapping("/transactions/{id}/fail")
    @Operation(summary = "Fail a transaction")
    fun failTransaction(
        @PathVariable id: UUID,
        @Valid @RequestBody request: FailTransactionRequest
    ): ResponseEntity<KioskTransactionResponse> {
        val command = FailTransactionCommand(
            transactionId = id,
            errorMessage = request.errorMessage
        )
        val transaction = kioskService.failTransaction(command)
        return ResponseEntity.ok(KioskTransactionResponse.from(transaction))
    }

    @PostMapping("/transactions/{id}/receipt/print")
    @Operation(summary = "Mark receipt as printed")
    fun markReceiptPrinted(@PathVariable id: UUID): ResponseEntity<KioskTransactionResponse> {
        val transaction = kioskService.markReceiptPrinted(id)
        return ResponseEntity.ok(KioskTransactionResponse.from(transaction))
    }

    @PostMapping("/sessions/{id}/signatures")
    @Operation(summary = "Create e-signature")
    fun createSignature(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreateSignatureRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<KioskSignatureResponse> {
        val command = CreateSignatureCommand(
            sessionId = id,
            memberId = request.memberId,
            agreementId = request.agreementId,
            signatureData = request.signatureData,
            ipAddress = httpRequest.remoteAddr
        )
        val signature = kioskService.createSignature(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(KioskSignatureResponse.from(signature))
    }

    @GetMapping("/sessions/{id}/signatures")
    @Operation(summary = "Get signatures for a session")
    fun getSessionSignatures(@PathVariable id: UUID): ResponseEntity<List<KioskSignatureResponse>> {
        val signatures = kioskService.getSignaturesBySession(id)
        return ResponseEntity.ok(signatures.map { KioskSignatureResponse.from(it) })
    }

    // ========== Admin Endpoints (Sessions & Transactions) ==========

    @GetMapping("/admin/sessions")
    @PreAuthorize("hasAuthority('kiosk_view')")
    @Operation(summary = "List all sessions")
    fun listSessions(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int
    ): ResponseEntity<PageResponse<KioskSessionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startedAt"))
        val sessionsPage = kioskService.listSessions(pageable)
        return ResponseEntity.ok(PageResponse(
            content = sessionsPage.content.map { KioskSessionResponse.from(it) },
            page = sessionsPage.number,
            size = sessionsPage.size,
            totalElements = sessionsPage.totalElements,
            totalPages = sessionsPage.totalPages,
            first = sessionsPage.isFirst,
            last = sessionsPage.isLast
        ))
    }

    @GetMapping("/admin/transactions")
    @PreAuthorize("hasAuthority('kiosk_view')")
    @Operation(summary = "List all transactions")
    fun listTransactions(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int
    ): ResponseEntity<PageResponse<KioskTransactionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val transactionsPage = kioskService.listTransactions(pageable)
        return ResponseEntity.ok(PageResponse(
            content = transactionsPage.content.map { KioskTransactionResponse.from(it) },
            page = transactionsPage.number,
            size = transactionsPage.size,
            totalElements = transactionsPage.totalElements,
            totalPages = transactionsPage.totalPages,
            first = transactionsPage.isFirst,
            last = transactionsPage.isLast
        ))
    }

    // Helper
    private fun parseAndMap(device: com.liyaqa.kiosk.domain.model.KioskDevice): KioskDeviceResponse {
        val configMap = try {
            @Suppress("UNCHECKED_CAST")
            objectMapper.readValue(device.config, Map::class.java) as Map<String, Any>
        } catch (e: Exception) { null }

        val actions = try {
            @Suppress("UNCHECKED_CAST")
            objectMapper.readValue(device.allowedActions, List::class.java) as List<String>
        } catch (e: Exception) { null }

        return KioskDeviceResponse.from(device, configMap, actions)
    }
}
