package com.liyaqa.trainer.infrastructure.persistence

import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import com.liyaqa.trainer.domain.model.CertificationStatus
import com.liyaqa.trainer.domain.model.TrainerCertification
import com.liyaqa.trainer.domain.ports.TrainerCertificationRepository
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.domain.PageRequest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Integration tests for JpaTrainerCertificationRepository.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class JpaTrainerCertificationRepositoryTest {

    @Autowired
    private lateinit var certificationRepository: TrainerCertificationRepository

    private lateinit var testTenantId: UUID
    private lateinit var testTrainerId: UUID

    @BeforeEach
    fun setUp() {
        testTenantId = UUID.randomUUID()
        testTrainerId = UUID.randomUUID()
        TenantContext.setCurrentTenant(TenantId(testTenantId))
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    private fun createTestCertification(
        trainerId: UUID = testTrainerId,
        nameEn: String = "NASM-CPT",
        nameAr: String = "شهادة مدرب شخصي",
        status: CertificationStatus = CertificationStatus.ACTIVE,
        expiryDate: LocalDate? = LocalDate.now().plusYears(1),
        isVerified: Boolean = false
    ): TrainerCertification {
        val certification = TrainerCertification(
            id = UUID.randomUUID(),
            trainerId = trainerId,
            nameEn = nameEn,
            nameAr = nameAr,
            issuingOrganization = "NASM",
            issuedDate = LocalDate.now().minusYears(1),
            expiryDate = expiryDate,
            status = status,
            isVerified = isVerified
        )
        certification.javaClass.superclass.getDeclaredField("tenantId").apply {
            isAccessible = true
            set(certification, testTenantId)
        }
        return certification
    }

    @Test
    fun `save new certification persists to database`() {
        val certification = createTestCertification()
        val savedCertification = certificationRepository.save(certification)

        val foundCertification = certificationRepository.findById(savedCertification.id)
        assertTrue(foundCertification.isPresent)
        assertEquals(certification.trainerId, foundCertification.get().trainerId)
        assertEquals(certification.nameEn, foundCertification.get().nameEn)
        assertNotNull(foundCertification.get().createdAt)
    }

    @Test
    fun `findByTrainerId returns all certifications for trainer`() {
        val cert1 = createTestCertification(nameEn = "NASM-CPT")
        val cert2 = createTestCertification(nameEn = "ACE-CPT")
        val cert3 = createTestCertification(trainerId = UUID.randomUUID()) // Different trainer

        certificationRepository.save(cert1)
        certificationRepository.save(cert2)
        certificationRepository.save(cert3)

        val certifications = certificationRepository.findByTrainerId(testTrainerId, PageRequest.of(0, 10))
        assertEquals(2, certifications.totalElements)
    }

    @Test
    fun `findActiveByTrainerId returns only active certifications`() {
        val activeCert1 = createTestCertification(status = CertificationStatus.ACTIVE)
        val activeCert2 = createTestCertification(status = CertificationStatus.ACTIVE)
        val expiredCert = createTestCertification(status = CertificationStatus.EXPIRED)

        certificationRepository.save(activeCert1)
        certificationRepository.save(activeCert2)
        certificationRepository.save(expiredCert)

        val activeCertifications = certificationRepository.findActiveByTrainerId(testTrainerId, PageRequest.of(0, 10))
        assertEquals(2, activeCertifications.totalElements)
        assertTrue(activeCertifications.content.all { it.status == CertificationStatus.ACTIVE })
    }

    @Test
    fun `findByTrainerIdAndStatus filters by status correctly`() {
        val activeCert = createTestCertification(status = CertificationStatus.ACTIVE)
        val expiredCert = createTestCertification(status = CertificationStatus.EXPIRED)
        val revokedCert = createTestCertification(status = CertificationStatus.REVOKED)

        certificationRepository.save(activeCert)
        certificationRepository.save(expiredCert)
        certificationRepository.save(revokedCert)

        val expiredCerts = certificationRepository.findByTrainerIdAndStatus(
            testTrainerId,
            CertificationStatus.EXPIRED,
            PageRequest.of(0, 10)
        )
        assertEquals(1, expiredCerts.totalElements)
        assertEquals(CertificationStatus.EXPIRED, expiredCerts.content[0].status)
    }

    @Test
    fun `findExpiringSoon returns certifications expiring within threshold`() {
        val expiringSoon1 = createTestCertification(expiryDate = LocalDate.now().plusDays(15))
        val expiringSoon2 = createTestCertification(expiryDate = LocalDate.now().plusDays(25))
        val notExpiringSoon = createTestCertification(expiryDate = LocalDate.now().plusDays(60))

        certificationRepository.save(expiringSoon1)
        certificationRepository.save(expiringSoon2)
        certificationRepository.save(notExpiringSoon)

        val expiringCerts = certificationRepository.findExpiringSoon(30, PageRequest.of(0, 10))
        assertTrue(expiringCerts.totalElements >= 2)
    }

    @Test
    fun `findExpiringSoonByTrainerId returns certifications expiring for specific trainer`() {
        val expiringSoon = createTestCertification(expiryDate = LocalDate.now().plusDays(15))
        val notExpiring = createTestCertification(expiryDate = LocalDate.now().plusDays(60))

        certificationRepository.save(expiringSoon)
        certificationRepository.save(notExpiring)

        val expiringCerts = certificationRepository.findExpiringSoonByTrainerId(testTrainerId, 30)
        assertEquals(1, expiringCerts.size)
    }

    @Test
    fun `findUnverified returns certifications not yet verified`() {
        val unverified1 = createTestCertification(isVerified = false)
        val unverified2 = createTestCertification(isVerified = false)
        val verified = createTestCertification(isVerified = true).apply {
            verifiedBy = UUID.randomUUID()
        }

        certificationRepository.save(unverified1)
        certificationRepository.save(unverified2)
        certificationRepository.save(verified)

        val unverifiedCerts = certificationRepository.findUnverified(PageRequest.of(0, 10))
        assertTrue(unverifiedCerts.totalElements >= 2)
        assertTrue(unverifiedCerts.content.all { !it.isVerified })
    }

    @Test
    fun `updateExpiredCertifications marks expired certifications`() {
        val activeCert = createTestCertification(
            status = CertificationStatus.ACTIVE,
            expiryDate = LocalDate.now().minusDays(10) // Already expired
        )
        val futureExpiringCert = createTestCertification(
            status = CertificationStatus.ACTIVE,
            expiryDate = LocalDate.now().plusDays(30)
        )

        certificationRepository.save(activeCert)
        certificationRepository.save(futureExpiringCert)

        val updatedCount = certificationRepository.updateExpiredCertifications()
        assertTrue(updatedCount >= 1)

        val foundCert = certificationRepository.findById(activeCert.id).get()
        assertEquals(CertificationStatus.EXPIRED, foundCert.status)
    }

    @Test
    fun `verify certification updates verification fields`() {
        val certification = createTestCertification(isVerified = false)
        certificationRepository.save(certification)

        val adminId = UUID.randomUUID()
        certification.verify(adminId)
        val updatedCertification = certificationRepository.save(certification)

        val foundCertification = certificationRepository.findById(updatedCertification.id).get()
        assertTrue(foundCertification.isVerified)
        assertEquals(adminId, foundCertification.verifiedBy)
        assertNotNull(foundCertification.verifiedAt)
    }

    @Test
    fun `renew certification updates expiry date`() {
        val certification = createTestCertification(expiryDate = LocalDate.now().minusDays(10))
        certificationRepository.save(certification)

        val newExpiryDate = LocalDate.now().plusYears(1)
        certification.renew(newExpiryDate)
        val updatedCertification = certificationRepository.save(certification)

        val foundCertification = certificationRepository.findById(updatedCertification.id).get()
        assertEquals(newExpiryDate, foundCertification.expiryDate)
        assertEquals(CertificationStatus.ACTIVE, foundCertification.status)
    }

    @Test
    fun `revoke certification changes status`() {
        val certification = createTestCertification(status = CertificationStatus.ACTIVE)
        certificationRepository.save(certification)

        certification.revoke()
        val updatedCertification = certificationRepository.save(certification)

        val foundCertification = certificationRepository.findById(updatedCertification.id).get()
        assertEquals(CertificationStatus.REVOKED, foundCertification.status)
    }

    @Test
    fun `delete removes certification from database`() {
        val certification = createTestCertification()
        val savedCertification = certificationRepository.save(certification)

        certificationRepository.deleteById(savedCertification.id)

        val foundCertification = certificationRepository.findById(savedCertification.id)
        assertFalse(foundCertification.isPresent)
    }
}
