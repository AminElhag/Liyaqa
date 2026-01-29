package com.liyaqa.compliance.domain.ports

import com.liyaqa.compliance.domain.model.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

@Repository
interface SecurityEventRepository : JpaRepository<SecurityEvent, UUID> {
    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<SecurityEvent>

    fun findByTenantIdAndEventType(tenantId: UUID, eventType: SecurityEventType, pageable: Pageable): Page<SecurityEvent>

    fun findByTenantIdAndSeverity(tenantId: UUID, severity: SecuritySeverity, pageable: Pageable): Page<SecurityEvent>

    fun findByTenantIdAndInvestigated(tenantId: UUID, investigated: Boolean, pageable: Pageable): Page<SecurityEvent>

    fun findByTenantIdAndUserId(tenantId: UUID, userId: UUID, pageable: Pageable): Page<SecurityEvent>

    @Query("""
        SELECT e FROM SecurityEvent e
        WHERE e.tenantId = :tenantId
        AND e.createdAt BETWEEN :startDate AND :endDate
    """)
    fun findByTenantIdAndDateRange(
        @Param("tenantId") tenantId: UUID,
        @Param("startDate") startDate: Instant,
        @Param("endDate") endDate: Instant,
        pageable: Pageable
    ): Page<SecurityEvent>

    fun countByTenantIdAndSeverity(tenantId: UUID, severity: SecuritySeverity): Long

    fun countByTenantIdAndInvestigated(tenantId: UUID, investigated: Boolean): Long
}

@Repository
interface ComplianceFrameworkRepository : JpaRepository<ComplianceFramework, UUID> {
    fun findByCode(code: String): Optional<ComplianceFramework>

    fun findByIsActive(isActive: Boolean): List<ComplianceFramework>

    fun existsByCode(code: String): Boolean
}

@Repository
interface ComplianceRequirementRepository : JpaRepository<ComplianceRequirement, UUID> {
    fun findByFrameworkId(frameworkId: UUID): List<ComplianceRequirement>

    fun findByFrameworkCode(code: String): List<ComplianceRequirement>

    fun findByFrameworkIdAndCategory(frameworkId: UUID, category: String): List<ComplianceRequirement>

    fun countByFrameworkId(frameworkId: UUID): Int

    fun countByFrameworkIdAndIsMandatory(frameworkId: UUID, isMandatory: Boolean): Int

    @Query("""
        SELECT DISTINCT r.category FROM ComplianceRequirement r
        WHERE r.framework.id = :frameworkId AND r.category IS NOT NULL
    """)
    fun findDistinctCategoriesByFrameworkId(@Param("frameworkId") frameworkId: UUID): List<String>
}

@Repository
interface OrganizationComplianceStatusRepository : JpaRepository<OrganizationComplianceStatus, UUID> {
    fun findByOrganizationId(organizationId: UUID): List<OrganizationComplianceStatus>

    fun findByOrganizationIdAndFrameworkId(organizationId: UUID, frameworkId: UUID): Optional<OrganizationComplianceStatus>

    fun findByOrganizationIdAndStatus(organizationId: UUID, status: ComplianceStatus): List<OrganizationComplianceStatus>

    @Query("""
        SELECT s FROM OrganizationComplianceStatus s
        WHERE s.organizationId = :organizationId
        AND s.status = 'CERTIFIED'
        AND s.certificationExpiryDate > :now
    """)
    fun findActivelyCompliant(@Param("organizationId") organizationId: UUID, @Param("now") now: LocalDate): List<OrganizationComplianceStatus>
}

@Repository
interface ControlImplementationRepository : JpaRepository<ControlImplementation, UUID> {
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<ControlImplementation>

    fun findByOrganizationIdAndRequirementFrameworkId(organizationId: UUID, frameworkId: UUID): List<ControlImplementation>

    fun findByOrganizationIdAndStatus(organizationId: UUID, status: ControlStatus): List<ControlImplementation>

    fun findByOrganizationIdAndRequirementId(organizationId: UUID, requirementId: UUID): Optional<ControlImplementation>

    fun countByOrganizationIdAndRequirementFrameworkIdAndStatus(organizationId: UUID, frameworkId: UUID, status: ControlStatus): Int

    @Query("""
        SELECT c FROM ControlImplementation c
        WHERE c.organizationId = :organizationId
        AND c.nextReviewDate < :now
    """)
    fun findOverdueReviews(@Param("organizationId") organizationId: UUID, @Param("now") now: LocalDate): List<ControlImplementation>
}

@Repository
interface ComplianceEvidenceRepository : JpaRepository<ComplianceEvidence, UUID> {
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<ComplianceEvidence>

    fun findByControlImplementationId(controlImplementationId: UUID): List<ComplianceEvidence>

    fun findByControlImplementationIdAndIsCurrent(controlImplementationId: UUID, isCurrent: Boolean): List<ComplianceEvidence>

    @Query("""
        SELECT e FROM ComplianceEvidence e
        WHERE e.organizationId = :organizationId
        AND e.validUntil < :now
        AND e.isCurrent = true
    """)
    fun findExpiredEvidence(@Param("organizationId") organizationId: UUID, @Param("now") now: LocalDate): List<ComplianceEvidence>

    @Query("""
        SELECT e FROM ComplianceEvidence e
        WHERE e.isCurrent = true
        AND e.validUntil < :now
    """)
    fun findAllExpiredEvidence(@Param("now") now: LocalDate): List<ComplianceEvidence>

    @Query("""
        SELECT e FROM ComplianceEvidence e
        WHERE e.isCurrent = true
        AND e.validUntil BETWEEN :now AND :futureDate
    """)
    fun findExpiringEvidence(@Param("now") now: LocalDate, @Param("futureDate") futureDate: LocalDate): List<ComplianceEvidence>
}

@Repository
interface RiskAssessmentRepository : JpaRepository<RiskAssessment, UUID> {
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<RiskAssessment>

    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<RiskAssessment>

    fun findByOrganizationIdAndStatus(organizationId: UUID, status: RiskAssessmentStatus): List<RiskAssessment>

    @Query("""
        SELECT r FROM RiskAssessment r
        WHERE r.organizationId = :organizationId
        AND r.status = 'APPROVED'
        ORDER BY r.assessmentDate DESC
    """)
    fun findLatestApproved(@Param("organizationId") organizationId: UUID, pageable: Pageable): Page<RiskAssessment>
}

@Repository
interface IdentifiedRiskRepository : JpaRepository<IdentifiedRisk, UUID> {
    fun findByAssessmentId(assessmentId: UUID): List<IdentifiedRisk>

    fun findByAssessmentIdAndInherentRiskLevel(assessmentId: UUID, level: RiskLevel): List<IdentifiedRisk>

    fun findByAssessmentIdAndTreatmentStatus(assessmentId: UUID, status: TreatmentStatus): List<IdentifiedRisk>

    fun countByAssessmentIdAndInherentRiskLevel(assessmentId: UUID, level: RiskLevel): Int

    @Query("""
        SELECT r FROM IdentifiedRisk r
        WHERE r.assessment.id = :assessmentId
        AND r.treatmentDueDate < :now
        AND r.treatmentStatus NOT IN ('COMPLETED')
    """)
    fun findOverdueTreatments(@Param("assessmentId") assessmentId: UUID, @Param("now") now: LocalDate): List<IdentifiedRisk>
}

@Repository
interface DataProcessingActivityRepository : JpaRepository<DataProcessingActivity, UUID> {
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<DataProcessingActivity>

    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<DataProcessingActivity>

    fun findByOrganizationIdAndStatus(organizationId: UUID, status: ProcessingActivityStatus): List<DataProcessingActivity>

    fun findByOrganizationIdAndLegalBasis(organizationId: UUID, legalBasis: LegalBasis): List<DataProcessingActivity>

    @Query("""
        SELECT d FROM DataProcessingActivity d
        WHERE d.organizationId = :organizationId
        AND d.nextReviewDate < :now
        AND d.status = 'ACTIVE'
    """)
    fun findActivitiesDueForReview(@Param("organizationId") organizationId: UUID, @Param("now") now: LocalDate): List<DataProcessingActivity>

    @Query("""
        SELECT d FROM DataProcessingActivity d
        WHERE d.organizationId = :organizationId
        AND d.crossBorderTransfer = true
        AND d.status = 'ACTIVE'
    """)
    fun findCrossBorderActivities(@Param("organizationId") organizationId: UUID): List<DataProcessingActivity>
}

@Repository
interface ConsentRecordRepository : JpaRepository<ConsentRecord, UUID> {
    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<ConsentRecord>

    fun findByMemberId(memberId: UUID): List<ConsentRecord>

    fun findByLeadId(leadId: UUID): List<ConsentRecord>

    fun findByMemberIdAndConsentType(memberId: UUID, consentType: ConsentType): Optional<ConsentRecord>

    fun findByMemberIdAndConsentGiven(memberId: UUID, consentGiven: Boolean): List<ConsentRecord>

    fun findByTenantIdAndConsentType(tenantId: UUID, consentType: ConsentType, pageable: Pageable): Page<ConsentRecord>

    @Query("""
        SELECT c FROM ConsentRecord c
        WHERE c.memberId = :memberId
        AND c.consentGiven = true
        AND c.withdrawnAt IS NULL
        AND (c.expiresAt IS NULL OR c.expiresAt > :now)
    """)
    fun findActiveConsents(@Param("memberId") memberId: UUID, @Param("now") now: Instant): List<ConsentRecord>
}

@Repository
interface DataSubjectRequestRepository : JpaRepository<DataSubjectRequest, UUID> {
    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<DataSubjectRequest>

    fun findByTenantIdAndRequestNumber(tenantId: UUID, requestNumber: String): Optional<DataSubjectRequest>

    fun findByTenantIdAndStatus(tenantId: UUID, status: DSRStatus, pageable: Pageable): Page<DataSubjectRequest>

    fun findByTenantIdAndRequestType(tenantId: UUID, requestType: DataSubjectRequestType, pageable: Pageable): Page<DataSubjectRequest>

    fun findByMemberId(memberId: UUID): List<DataSubjectRequest>

    fun findByAssignedToUserId(userId: UUID, pageable: Pageable): Page<DataSubjectRequest>

    @Query("""
        SELECT d FROM DataSubjectRequest d
        WHERE d.tenantId = :tenantId
        AND (d.dueDate < :now OR (d.extendedDueDate IS NOT NULL AND d.extendedDueDate < :now))
        AND d.status NOT IN ('COMPLETED', 'REJECTED')
    """)
    fun findOverdueRequests(@Param("tenantId") tenantId: UUID, @Param("now") now: LocalDate): List<DataSubjectRequest>

    fun countByTenantIdAndStatus(tenantId: UUID, status: DSRStatus): Long
}

@Repository
interface DataBreachRepository : JpaRepository<DataBreach, UUID> {
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<DataBreach>

    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<DataBreach>

    fun findByOrganizationIdAndBreachNumber(organizationId: UUID, breachNumber: String): Optional<DataBreach>

    fun findByOrganizationIdAndStatus(organizationId: UUID, status: BreachStatus): List<DataBreach>

    fun findByOrganizationIdAndSeverity(organizationId: UUID, severity: SecuritySeverity): List<DataBreach>

    @Query("""
        SELECT b FROM DataBreach b
        WHERE b.organizationId = :organizationId
        AND b.sdaiaNotificationRequired = true
        AND b.sdaiaNotifiedAt IS NULL
        AND b.sdaiaNotificationDeadline < :now
    """)
    fun findOverdueSdaiaNotifications(@Param("organizationId") organizationId: UUID, @Param("now") now: Instant): List<DataBreach>

    @Query("""
        SELECT b FROM DataBreach b
        WHERE b.sdaiaNotificationRequired = true
        AND b.sdaiaNotifiedAt IS NULL
    """)
    fun findPendingSdaiaNotifications(): List<DataBreach>

    fun countByOrganizationIdAndStatus(organizationId: UUID, status: BreachStatus): Long
}

@Repository
interface SecurityPolicyRepository : JpaRepository<SecurityPolicy, UUID> {
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<SecurityPolicy>

    fun findByOrganizationIdAndStatus(organizationId: UUID, status: PolicyStatus): List<SecurityPolicy>

    fun findByOrganizationIdAndPolicyType(organizationId: UUID, policyType: PolicyType): List<SecurityPolicy>

    fun findByOrganizationIdAndPolicyTypeAndStatus(organizationId: UUID, policyType: PolicyType, status: PolicyStatus): Optional<SecurityPolicy>

    @Query("""
        SELECT p FROM SecurityPolicy p
        WHERE p.organizationId = :organizationId
        AND p.nextReviewDate < :now
        AND p.status = 'PUBLISHED'
    """)
    fun findPoliciesDueForReview(@Param("organizationId") organizationId: UUID, @Param("now") now: LocalDate): List<SecurityPolicy>

    @Query("""
        SELECT p FROM SecurityPolicy p
        WHERE p.organizationId = :organizationId
        AND p.acknowledgementRequired = true
        AND p.status = 'PUBLISHED'
    """)
    fun findPoliciesRequiringAcknowledgement(@Param("organizationId") organizationId: UUID): List<SecurityPolicy>
}

@Repository
interface PolicyAcknowledgementRepository : JpaRepository<PolicyAcknowledgement, UUID> {
    fun findByPolicyId(policyId: UUID): List<PolicyAcknowledgement>

    fun findByUserId(userId: UUID): List<PolicyAcknowledgement>

    fun findByPolicyIdAndUserId(policyId: UUID, userId: UUID): List<PolicyAcknowledgement>

    fun existsByPolicyIdAndUserIdAndPolicyVersion(policyId: UUID, userId: UUID, policyVersion: String): Boolean

    fun countByPolicyId(policyId: UUID): Long
}

@Repository
interface DataRetentionRuleRepository : JpaRepository<DataRetentionRule, UUID> {
    fun findByOrganizationId(organizationId: UUID): List<DataRetentionRule>

    fun findByOrganizationIdAndEntityType(organizationId: UUID, entityType: String): Optional<DataRetentionRule>

    fun findByOrganizationIdAndIsActive(organizationId: UUID, isActive: Boolean): List<DataRetentionRule>

    fun findByIsActive(isActive: Boolean): List<DataRetentionRule>
}

@Repository
interface DataDeletionLogRepository : JpaRepository<DataDeletionLog, UUID> {
    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<DataDeletionLog>

    fun findByEntityTypeAndEntityId(entityType: String, entityId: UUID): List<DataDeletionLog>

    fun findByDeletionReason(deletionReason: DeletionReason, pageable: Pageable): Page<DataDeletionLog>

    @Query("""
        SELECT d FROM DataDeletionLog d
        WHERE d.tenantId = :tenantId
        AND d.deletedAt BETWEEN :startDate AND :endDate
    """)
    fun findByDateRange(
        @Param("tenantId") tenantId: UUID,
        @Param("startDate") startDate: Instant,
        @Param("endDate") endDate: Instant,
        pageable: Pageable
    ): Page<DataDeletionLog>
}

@Repository
interface EncryptionKeyRepository : JpaRepository<EncryptionKey, UUID> {
    fun findByOrganizationId(organizationId: UUID): List<EncryptionKey>

    fun findByOrganizationIdAndKeyAlias(organizationId: UUID, keyAlias: String): Optional<EncryptionKey>

    fun findByOrganizationIdAndStatus(organizationId: UUID, status: KeyStatus): List<EncryptionKey>

    fun findByOrganizationIdAndPurpose(organizationId: UUID, purpose: KeyPurpose): List<EncryptionKey>
}

@Repository
interface ComplianceReportRepository : JpaRepository<ComplianceReport, UUID> {
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<ComplianceReport>

    fun findByOrganizationIdAndReportType(organizationId: UUID, reportType: ReportType, pageable: Pageable): Page<ComplianceReport>

    fun findByOrganizationIdAndFrameworkId(organizationId: UUID, frameworkId: UUID, pageable: Pageable): Page<ComplianceReport>

    fun findByGeneratedBy(userId: UUID, pageable: Pageable): Page<ComplianceReport>
}
