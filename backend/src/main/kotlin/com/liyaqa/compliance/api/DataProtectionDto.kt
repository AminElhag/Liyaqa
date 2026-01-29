package com.liyaqa.compliance.api

import com.liyaqa.compliance.domain.model.*
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ===== Data Processing Activity DTOs =====

data class DataProcessingActivityResponse(
    val id: UUID,
    val activityName: String,
    val activityNameAr: String?,
    val description: String?,
    val purpose: String,
    val purposeAr: String?,
    val legalBasis: LegalBasis,
    val dataCategories: List<String>,
    val dataSubjects: List<String>,
    val recipients: List<String>?,
    val retentionPeriodDays: Int?,
    val crossBorderTransfer: Boolean,
    val transferCountry: String?,
    val automatedDecisionMaking: Boolean,
    val profiling: Boolean,
    val privacyImpactRequired: Boolean,
    val privacyImpactCompleted: Boolean,
    val status: ProcessingActivityStatus,
    val ownerId: UUID?,
    val nextReviewDate: LocalDate?,
    val createdAt: Instant
) {
    companion object {
        fun from(activity: DataProcessingActivity) = DataProcessingActivityResponse(
            id = activity.id,
            activityName = activity.activityName,
            activityNameAr = activity.activityNameAr,
            description = activity.description,
            purpose = activity.purpose,
            purposeAr = activity.purposeAr,
            legalBasis = activity.legalBasis,
            dataCategories = activity.dataCategories,
            dataSubjects = activity.dataSubjects,
            recipients = activity.recipients,
            retentionPeriodDays = activity.retentionPeriodDays,
            crossBorderTransfer = activity.crossBorderTransfer,
            transferCountry = activity.transferCountry,
            automatedDecisionMaking = activity.automatedDecisionMaking,
            profiling = activity.profiling,
            privacyImpactRequired = activity.privacyImpactRequired,
            privacyImpactCompleted = activity.privacyImpactCompleted,
            status = activity.status,
            ownerId = activity.ownerId,
            nextReviewDate = activity.nextReviewDate,
            createdAt = activity.createdAt
        )
    }
}

data class CreateActivityRequest(
    val activityName: String,
    val activityNameAr: String? = null,
    val description: String? = null,
    val purpose: String,
    val purposeAr: String? = null,
    val legalBasis: LegalBasis,
    val dataCategories: List<String>,
    val dataSubjects: List<String>,
    val recipients: List<String>? = null,
    val retentionPeriodDays: Int? = null,
    val retentionJustification: String? = null,
    val crossBorderTransfer: Boolean = false,
    val transferCountry: String? = null,
    val transferSafeguards: String? = null,
    val securityMeasures: String? = null,
    val automatedDecisionMaking: Boolean = false,
    val profiling: Boolean = false,
    val ownerId: UUID? = null
)

// ===== Consent DTOs =====

data class ConsentResponse(
    val id: UUID,
    val memberId: UUID?,
    val leadId: UUID?,
    val consentType: ConsentType,
    val purpose: String,
    val purposeAr: String?,
    val version: String,
    val consentGiven: Boolean,
    val consentMethod: ConsentMethod,
    val givenAt: Instant?,
    val expiresAt: Instant?,
    val withdrawnAt: Instant?,
    val withdrawalReason: String?,
    val isValid: Boolean,
    val createdAt: Instant
) {
    companion object {
        fun from(consent: ConsentRecord) = ConsentResponse(
            id = consent.id,
            memberId = consent.memberId,
            leadId = consent.leadId,
            consentType = consent.consentType,
            purpose = consent.purpose,
            purposeAr = consent.purposeAr,
            version = consent.version,
            consentGiven = consent.consentGiven,
            consentMethod = consent.consentMethod,
            givenAt = consent.givenAt,
            expiresAt = consent.expiresAt,
            withdrawnAt = consent.withdrawnAt,
            withdrawalReason = consent.withdrawalReason,
            isValid = consent.isValid(),
            createdAt = consent.createdAt
        )
    }
}

data class RecordConsentRequest(
    val memberId: UUID? = null,
    val leadId: UUID? = null,
    val consentType: ConsentType,
    val purpose: String,
    val purposeAr: String? = null,
    val consentGiven: Boolean,
    val consentMethod: ConsentMethod,
    val consentText: String? = null,
    val expiresAt: Instant? = null
)

data class WithdrawConsentRequest(
    val reason: String? = null
)

// ===== DSR DTOs =====

data class DSRResponse(
    val id: UUID,
    val requestNumber: String,
    val memberId: UUID?,
    val requesterName: String,
    val requesterEmail: String,
    val requesterPhone: String?,
    val requestType: DataSubjectRequestType,
    val description: String?,
    val identityVerified: Boolean,
    val verificationMethod: VerificationMethod?,
    val status: DSRStatus,
    val priority: DSRPriority,
    val assignedToUserId: UUID?,
    val receivedAt: Instant,
    val dueDate: LocalDate,
    val extendedDueDate: LocalDate?,
    val extensionReason: String?,
    val completedAt: Instant?,
    val rejectionReason: String?,
    val responseMethod: ResponseMethod?,
    val isOverdue: Boolean,
    val daysUntilDue: Long,
    val createdAt: Instant
) {
    companion object {
        fun from(dsr: DataSubjectRequest) = DSRResponse(
            id = dsr.id,
            requestNumber = dsr.requestNumber,
            memberId = dsr.memberId,
            requesterName = dsr.requesterName,
            requesterEmail = dsr.requesterEmail,
            requesterPhone = dsr.requesterPhone,
            requestType = dsr.requestType,
            description = dsr.description,
            identityVerified = dsr.identityVerified,
            verificationMethod = dsr.verificationMethod,
            status = dsr.status,
            priority = dsr.priority,
            assignedToUserId = dsr.assignedToUserId,
            receivedAt = dsr.receivedAt,
            dueDate = dsr.dueDate,
            extendedDueDate = dsr.extendedDueDate,
            extensionReason = dsr.extensionReason,
            completedAt = dsr.completedAt,
            rejectionReason = dsr.rejectionReason,
            responseMethod = dsr.responseMethod,
            isOverdue = dsr.isOverdue(),
            daysUntilDue = dsr.getDaysUntilDue(),
            createdAt = dsr.createdAt
        )
    }
}

data class CreateDSRRequest(
    val memberId: UUID? = null,
    val requesterName: String,
    val requesterEmail: String,
    val requesterPhone: String? = null,
    val requestType: DataSubjectRequestType,
    val description: String? = null,
    val priority: DSRPriority = DSRPriority.NORMAL
)

data class VerifyIdentityRequest(
    val method: VerificationMethod
)

data class CompleteDSRRequest(
    val responseMethod: ResponseMethod,
    val dataExportPath: String? = null
)

data class ExtendDSRRequest(
    val newDueDate: LocalDate,
    val reason: String
)

// ===== Breach DTOs =====

data class BreachResponse(
    val id: UUID,
    val breachNumber: String,
    val title: String,
    val description: String?,
    val discoveredAt: Instant,
    val occurredAt: Instant?,
    val containedAt: Instant?,
    val resolvedAt: Instant?,
    val breachType: BreachType,
    val breachSource: BreachSource?,
    val affectedDataTypes: List<String>?,
    val affectedRecordsCount: Int?,
    val affectedMembersCount: Int?,
    val severity: SecuritySeverity,
    val status: BreachStatus,
    val leadInvestigatorId: UUID?,
    val rootCause: String?,
    val sdaiaNotificationRequired: Boolean,
    val sdaiaNotifiedAt: Instant?,
    val sdaiaNotificationDeadline: Instant?,
    val individualsNotificationRequired: Boolean,
    val individualsNotifiedAt: Instant?,
    val isSdaiaOverdue: Boolean,
    val createdAt: Instant
) {
    companion object {
        fun from(breach: DataBreach) = BreachResponse(
            id = breach.id,
            breachNumber = breach.breachNumber,
            title = breach.title,
            description = breach.description,
            discoveredAt = breach.discoveredAt,
            occurredAt = breach.occurredAt,
            containedAt = breach.containedAt,
            resolvedAt = breach.resolvedAt,
            breachType = breach.breachType,
            breachSource = breach.breachSource,
            affectedDataTypes = breach.affectedDataTypes,
            affectedRecordsCount = breach.affectedRecordsCount,
            affectedMembersCount = breach.affectedMembersCount,
            severity = breach.severity,
            status = breach.status,
            leadInvestigatorId = breach.leadInvestigatorId,
            rootCause = breach.rootCause,
            sdaiaNotificationRequired = breach.sdaiaNotificationRequired,
            sdaiaNotifiedAt = breach.sdaiaNotifiedAt,
            sdaiaNotificationDeadline = breach.sdaiaNotificationDeadline,
            individualsNotificationRequired = breach.individualsNotificationRequired,
            individualsNotifiedAt = breach.individualsNotifiedAt,
            isSdaiaOverdue = breach.isSdaiaNotificationOverdue(),
            createdAt = breach.createdAt
        )
    }
}

data class ReportBreachRequest(
    val title: String,
    val description: String? = null,
    val discoveredAt: Instant,
    val occurredAt: Instant? = null,
    val breachType: BreachType,
    val breachSource: BreachSource? = null,
    val affectedDataTypes: List<String>? = null,
    val affectedRecordsCount: Int? = null,
    val affectedMembersCount: Int? = null,
    val severity: SecuritySeverity
)

data class ResolveBreachRequest(
    val rootCause: String,
    val remediation: String
)
