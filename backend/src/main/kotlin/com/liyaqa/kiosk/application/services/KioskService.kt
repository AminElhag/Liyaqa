package com.liyaqa.kiosk.application.services

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.kiosk.application.commands.*
import com.liyaqa.kiosk.domain.model.*
import com.liyaqa.kiosk.domain.ports.*
import com.liyaqa.shared.domain.TenantContext
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

@Service
@Transactional
class KioskService(
    private val deviceRepository: KioskDeviceRepository,
    private val sessionRepository: KioskSessionRepository,
    private val transactionRepository: KioskTransactionRepository,
    private val signatureRepository: KioskSignatureRepository,
    private val objectMapper: ObjectMapper
) {
    // ========== Device Management ==========

    fun createDevice(command: CreateKioskDeviceCommand): KioskDevice {
        // Check if device code already exists
        val existing = deviceRepository.findByDeviceCode(command.deviceCode)
        if (existing != null) {
            throw IllegalArgumentException("Device code already exists: ${command.deviceCode}")
        }

        val device = KioskDevice(
            locationId = command.locationId,
            deviceName = command.deviceName,
            deviceNameAr = command.deviceNameAr,
            deviceCode = command.deviceCode,
            hardwareId = command.hardwareId,
            config = command.config?.let { objectMapper.writeValueAsString(it) } ?: "{}",
            allowedActions = command.allowedActions?.let {
                objectMapper.writeValueAsString(it.map { a -> a.name })
            } ?: "[\"CHECK_IN\", \"CLASS_BOOKING\", \"PAYMENT\"]"
        )
        // tenantId is automatically set by BaseEntity's @PrePersist
        return deviceRepository.save(device)
    }

    fun updateDevice(id: UUID, command: UpdateKioskDeviceCommand): KioskDevice {
        val device = deviceRepository.findById(id)
            ?: throw IllegalArgumentException("Device not found: $id")

        command.deviceName?.let { device.deviceName = it }
        command.deviceNameAr?.let { device.deviceNameAr = it }
        command.status?.let { device.status = it }
        command.config?.let { device.config = objectMapper.writeValueAsString(it) }
        command.allowedActions?.let {
            device.allowedActions = objectMapper.writeValueAsString(it.map { a -> a.name })
        }

        return deviceRepository.save(device)
    }

    fun getDevice(id: UUID) = deviceRepository.findById(id)
    fun getDeviceByCode(code: String) = deviceRepository.findByDeviceCode(code)
    fun listDevices(pageable: Pageable) = deviceRepository.findAll(pageable)
    fun listDevicesByLocation(locationId: UUID) = deviceRepository.findByLocationId(locationId)
    fun getActiveDevices() = deviceRepository.findActiveDevices()

    fun updateHeartbeat(id: UUID) {
        val device = deviceRepository.findById(id) ?: return
        device.updateHeartbeat()
        deviceRepository.save(device)
    }

    fun deleteDevice(id: UUID) {
        val device = deviceRepository.findById(id)
            ?: throw IllegalArgumentException("Device not found: $id")
        deviceRepository.delete(device)
    }

    // ========== Session Management ==========

    fun startSession(command: StartSessionCommand): KioskSession {
        val device = deviceRepository.findById(command.kioskId)
            ?: throw IllegalArgumentException("Kiosk not found: ${command.kioskId}")

        // End any existing active session for this kiosk
        val activeSession = sessionRepository.findActiveByKioskId(command.kioskId)
        if (activeSession != null) {
            activeSession.timeout()
            sessionRepository.save(activeSession)
        }

        val session = KioskSession(
            tenantId = device.tenantId,
            kioskId = device.id
        )
        return sessionRepository.save(session)
    }

    fun identifyMember(command: IdentifyMemberCommand): KioskSession {
        val session = sessionRepository.findById(command.sessionId)
            ?: throw IllegalArgumentException("Session not found: ${command.sessionId}")

        // Here you would look up the member by the credential
        // For now, we'll assume the value is the member ID for simplicity
        val memberId = try {
            UUID.fromString(command.value)
        } catch (e: Exception) {
            throw IllegalArgumentException("Invalid member credential: ${command.value}")
        }

        session.identify(command.method, command.value, memberId)
        return sessionRepository.save(session)
    }

    fun endSession(command: EndSessionCommand): KioskSession {
        val session = sessionRepository.findById(command.sessionId)
            ?: throw IllegalArgumentException("Session not found: ${command.sessionId}")

        when (command.status) {
            SessionStatus.COMPLETED -> session.complete()
            SessionStatus.ABANDONED -> session.abandon()
            SessionStatus.TIMED_OUT -> session.timeout()
            else -> {}
        }

        if (command.feedbackRating != null) {
            session.addFeedback(command.feedbackRating, command.feedbackComment)
        }

        return sessionRepository.save(session)
    }

    fun getSession(id: UUID) = sessionRepository.findById(id)
    fun getActiveSessionForKiosk(kioskId: UUID) = sessionRepository.findActiveByKioskId(kioskId)
    fun listSessions(pageable: Pageable) = sessionRepository.findAll(pageable)
    fun listSessionsByKiosk(kioskId: UUID, pageable: Pageable) = sessionRepository.findByKioskId(kioskId, pageable)
    fun listSessionsByMember(memberId: UUID, pageable: Pageable) = sessionRepository.findByMemberId(memberId, pageable)

    // ========== Transaction Management ==========

    fun createTransaction(command: CreateTransactionCommand): KioskTransaction {
        val session = sessionRepository.findById(command.sessionId)
            ?: throw IllegalArgumentException("Session not found: ${command.sessionId}")

        val transaction = KioskTransaction(
            tenantId = session.tenantId,
            sessionId = session.id,
            transactionType = command.transactionType,
            referenceType = command.referenceType,
            referenceId = command.referenceId,
            amount = command.amount,
            paymentMethod = command.paymentMethod
        )
        return transactionRepository.save(transaction)
    }

    fun completeTransaction(command: CompleteTransactionCommand): KioskTransaction {
        val transaction = transactionRepository.findById(command.transactionId)
            ?: throw IllegalArgumentException("Transaction not found: ${command.transactionId}")

        transaction.paymentReference = command.paymentReference
        transaction.complete()
        return transactionRepository.save(transaction)
    }

    fun failTransaction(command: FailTransactionCommand): KioskTransaction {
        val transaction = transactionRepository.findById(command.transactionId)
            ?: throw IllegalArgumentException("Transaction not found: ${command.transactionId}")

        transaction.fail(command.errorMessage)
        return transactionRepository.save(transaction)
    }

    fun getTransaction(id: UUID) = transactionRepository.findById(id)
    fun getTransactionsBySession(sessionId: UUID) = transactionRepository.findBySessionId(sessionId)
    fun listTransactions(pageable: Pageable) = transactionRepository.findAll(pageable)

    fun markReceiptPrinted(id: UUID): KioskTransaction {
        val transaction = transactionRepository.findById(id)
            ?: throw IllegalArgumentException("Transaction not found: $id")
        transaction.markReceiptPrinted()
        return transactionRepository.save(transaction)
    }

    // ========== Signature Management ==========

    fun createSignature(command: CreateSignatureCommand): KioskSignature {
        val session = sessionRepository.findById(command.sessionId)
            ?: throw IllegalArgumentException("Session not found: ${command.sessionId}")

        val signature = KioskSignature(
            tenantId = session.tenantId,
            sessionId = session.id,
            memberId = command.memberId,
            agreementId = command.agreementId,
            signatureData = command.signatureData,
            ipAddress = command.ipAddress,
            deviceInfo = command.deviceInfo?.let { objectMapper.writeValueAsString(it) }
        )
        return signatureRepository.save(signature)
    }

    fun getSignature(id: UUID) = signatureRepository.findById(id)
    fun getSignaturesBySession(sessionId: UUID) = signatureRepository.findBySessionId(sessionId)
    fun getSignaturesByMember(memberId: UUID) = signatureRepository.findByMemberId(memberId)
    fun getSignaturesByAgreement(agreementId: UUID) = signatureRepository.findByAgreementId(agreementId)

    // ========== Check-in ==========

    fun performCheckIn(command: CheckInCommand): KioskTransaction {
        val session = sessionRepository.findById(command.sessionId)
            ?: throw IllegalArgumentException("Session not found: ${command.sessionId}")

        // Create a check-in transaction
        val transaction = KioskTransaction(
            tenantId = session.tenantId,
            sessionId = session.id,
            transactionType = TransactionType.CHECK_IN,
            referenceType = ReferenceType.ATTENDANCE,
            // referenceId would be set to the created attendance record ID
        )
        transaction.complete()
        return transactionRepository.save(transaction)
    }
}
