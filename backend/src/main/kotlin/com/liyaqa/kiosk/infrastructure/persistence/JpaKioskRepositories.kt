package com.liyaqa.kiosk.infrastructure.persistence

import com.liyaqa.kiosk.domain.model.*
import com.liyaqa.kiosk.domain.ports.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.*

// ========== Kiosk Device ==========

interface SpringDataKioskDeviceRepository : JpaRepository<KioskDevice, UUID> {
    fun findByDeviceCode(code: String): KioskDevice?
    fun findByLocationId(locationId: UUID): List<KioskDevice>

    @Query("SELECT d FROM KioskDevice d WHERE d.status = 'ACTIVE'")
    fun findActiveDevices(): List<KioskDevice>
}

@Repository
class JpaKioskDeviceRepository(
    private val springRepo: SpringDataKioskDeviceRepository
) : KioskDeviceRepository {
    override fun save(device: KioskDevice) = springRepo.save(device)
    override fun findById(id: UUID) = springRepo.findById(id).orElse(null)
    override fun findByDeviceCode(code: String) = springRepo.findByDeviceCode(code)
    override fun findByLocationId(locationId: UUID) = springRepo.findByLocationId(locationId)
    override fun findAll(pageable: Pageable) = springRepo.findAll(pageable)
    override fun findActiveDevices() = springRepo.findActiveDevices()
    override fun delete(device: KioskDevice) = springRepo.delete(device)
}

// ========== Kiosk Session ==========

interface SpringDataKioskSessionRepository : JpaRepository<KioskSession, UUID> {
    fun findByKioskId(kioskId: UUID, pageable: Pageable): Page<KioskSession>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<KioskSession>
    fun findByStartedAtBetween(start: Instant, end: Instant, pageable: Pageable): Page<KioskSession>

    @Query("SELECT s FROM KioskSession s WHERE s.kioskId = :kioskId AND s.sessionStatus = 'ACTIVE'")
    fun findActiveByKioskId(@Param("kioskId") kioskId: UUID): KioskSession?

    fun countByKioskIdAndStartedAtBetween(kioskId: UUID, start: Instant, end: Instant): Long
}

@Repository
class JpaKioskSessionRepository(
    private val springRepo: SpringDataKioskSessionRepository
) : KioskSessionRepository {
    override fun save(session: KioskSession) = springRepo.save(session)
    override fun findById(id: UUID) = springRepo.findById(id).orElse(null)
    override fun findByKioskId(kioskId: UUID, pageable: Pageable) = springRepo.findByKioskId(kioskId, pageable)
    override fun findByMemberId(memberId: UUID, pageable: Pageable) = springRepo.findByMemberId(memberId, pageable)
    override fun findAll(pageable: Pageable) = springRepo.findAll(pageable)
    override fun findActiveByKioskId(kioskId: UUID) = springRepo.findActiveByKioskId(kioskId)
    override fun findByStartedAtBetween(start: Instant, end: Instant, pageable: Pageable) =
        springRepo.findByStartedAtBetween(start, end, pageable)
    override fun countByKioskIdAndStartedAtBetween(kioskId: UUID, start: Instant, end: Instant) =
        springRepo.countByKioskIdAndStartedAtBetween(kioskId, start, end)
}

// ========== Kiosk Transaction ==========

interface SpringDataKioskTransactionRepository : JpaRepository<KioskTransaction, UUID> {
    fun findBySessionId(sessionId: UUID): List<KioskTransaction>
    fun findByTransactionType(type: TransactionType, pageable: Pageable): Page<KioskTransaction>
    fun findByCreatedAtBetween(start: Instant, end: Instant, pageable: Pageable): Page<KioskTransaction>
    fun countByTransactionTypeAndCreatedAtBetween(type: TransactionType, start: Instant, end: Instant): Long
}

@Repository
class JpaKioskTransactionRepository(
    private val springRepo: SpringDataKioskTransactionRepository
) : KioskTransactionRepository {
    override fun save(transaction: KioskTransaction) = springRepo.save(transaction)
    override fun findById(id: UUID) = springRepo.findById(id).orElse(null)
    override fun findBySessionId(sessionId: UUID) = springRepo.findBySessionId(sessionId)
    override fun findAll(pageable: Pageable) = springRepo.findAll(pageable)
    override fun findByTransactionType(type: TransactionType, pageable: Pageable) =
        springRepo.findByTransactionType(type, pageable)
    override fun findByCreatedAtBetween(start: Instant, end: Instant, pageable: Pageable) =
        springRepo.findByCreatedAtBetween(start, end, pageable)
    override fun countByTransactionTypeAndCreatedAtBetween(type: TransactionType, start: Instant, end: Instant) =
        springRepo.countByTransactionTypeAndCreatedAtBetween(type, start, end)
}

// ========== Kiosk Signature ==========

interface SpringDataKioskSignatureRepository : JpaRepository<KioskSignature, UUID> {
    fun findBySessionId(sessionId: UUID): List<KioskSignature>
    fun findByMemberId(memberId: UUID): List<KioskSignature>
    fun findByAgreementId(agreementId: UUID): List<KioskSignature>
}

@Repository
class JpaKioskSignatureRepository(
    private val springRepo: SpringDataKioskSignatureRepository
) : KioskSignatureRepository {
    override fun save(signature: KioskSignature) = springRepo.save(signature)
    override fun findById(id: UUID) = springRepo.findById(id).orElse(null)
    override fun findBySessionId(sessionId: UUID) = springRepo.findBySessionId(sessionId)
    override fun findByMemberId(memberId: UUID) = springRepo.findByMemberId(memberId)
    override fun findByAgreementId(agreementId: UUID) = springRepo.findByAgreementId(agreementId)
}
