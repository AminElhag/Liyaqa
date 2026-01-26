package com.liyaqa.kiosk.domain.ports

import com.liyaqa.kiosk.domain.model.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.*

interface KioskDeviceRepository {
    fun save(device: KioskDevice): KioskDevice
    fun findById(id: UUID): KioskDevice?
    fun findByDeviceCode(code: String): KioskDevice?
    fun findByLocationId(locationId: UUID): List<KioskDevice>
    fun findAll(pageable: Pageable): Page<KioskDevice>
    fun findActiveDevices(): List<KioskDevice>
    fun delete(device: KioskDevice)
}

interface KioskSessionRepository {
    fun save(session: KioskSession): KioskSession
    fun findById(id: UUID): KioskSession?
    fun findByKioskId(kioskId: UUID, pageable: Pageable): Page<KioskSession>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<KioskSession>
    fun findAll(pageable: Pageable): Page<KioskSession>
    fun findActiveByKioskId(kioskId: UUID): KioskSession?
    fun findByStartedAtBetween(start: Instant, end: Instant, pageable: Pageable): Page<KioskSession>
    fun countByKioskIdAndStartedAtBetween(kioskId: UUID, start: Instant, end: Instant): Long
}

interface KioskTransactionRepository {
    fun save(transaction: KioskTransaction): KioskTransaction
    fun findById(id: UUID): KioskTransaction?
    fun findBySessionId(sessionId: UUID): List<KioskTransaction>
    fun findAll(pageable: Pageable): Page<KioskTransaction>
    fun findByTransactionType(type: TransactionType, pageable: Pageable): Page<KioskTransaction>
    fun findByCreatedAtBetween(start: Instant, end: Instant, pageable: Pageable): Page<KioskTransaction>
    fun countByTransactionTypeAndCreatedAtBetween(type: TransactionType, start: Instant, end: Instant): Long
}

interface KioskSignatureRepository {
    fun save(signature: KioskSignature): KioskSignature
    fun findById(id: UUID): KioskSignature?
    fun findBySessionId(sessionId: UUID): List<KioskSignature>
    fun findByMemberId(memberId: UUID): List<KioskSignature>
    fun findByAgreementId(agreementId: UUID): List<KioskSignature>
}
