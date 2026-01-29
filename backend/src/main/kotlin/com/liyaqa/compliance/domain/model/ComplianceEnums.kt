package com.liyaqa.compliance.domain.model

/**
 * Security event types for audit logging.
 */
enum class SecurityEventType {
    AUTH_FAILURE,
    INTRUSION_ATTEMPT,
    PII_ACCESS,
    SUSPICIOUS_ACTIVITY,
    PASSWORD_CHANGE,
    ROLE_CHANGE,
    DATA_EXPORT,
    CONFIG_CHANGE,
    LOGIN_SUCCESS,
    LOGOUT,
    SESSION_EXPIRED,
    MFA_CHALLENGE,
    API_ACCESS,
    PERMISSION_DENIED
}

/**
 * Severity levels for security events.
 */
enum class SecuritySeverity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

/**
 * Outcome of a security event.
 */
enum class SecurityOutcome {
    SUCCESS,
    FAILURE,
    BLOCKED
}

/**
 * Compliance framework codes.
 */
enum class FrameworkCode {
    ISO_27001,
    SOC_2,
    PCI_DSS,
    PDPL
}

/**
 * Organization compliance status.
 */
enum class ComplianceStatus {
    NOT_STARTED,
    IN_PROGRESS,
    COMPLIANT,
    NON_COMPLIANT,
    CERTIFIED
}

/**
 * Control implementation status.
 */
enum class ControlStatus {
    NOT_IMPLEMENTED,
    IN_PROGRESS,
    IMPLEMENTED,
    NOT_APPLICABLE
}

/**
 * Control effectiveness assessment.
 */
enum class ControlEffectiveness {
    EFFECTIVE,
    PARTIALLY_EFFECTIVE,
    NOT_EFFECTIVE,
    NOT_TESTED
}

/**
 * Types of compliance evidence.
 */
enum class EvidenceType {
    DOCUMENT,
    SCREENSHOT,
    REPORT,
    LOG,
    POLICY,
    PROCEDURE,
    CONFIGURATION,
    AUDIT_TRAIL
}

/**
 * Risk assessment status.
 */
enum class RiskAssessmentStatus {
    DRAFT,
    IN_PROGRESS,
    COMPLETED,
    APPROVED,
    ARCHIVED
}

/**
 * Risk categories.
 */
enum class RiskCategory {
    STRATEGIC,
    OPERATIONAL,
    FINANCIAL,
    COMPLIANCE,
    IT_SECURITY,
    DATA_PRIVACY,
    REPUTATIONAL,
    THIRD_PARTY
}

/**
 * Risk likelihood levels.
 */
enum class RiskLikelihood {
    RARE,       // 1
    UNLIKELY,   // 2
    POSSIBLE,   // 3
    LIKELY,     // 4
    ALMOST_CERTAIN // 5
}

/**
 * Risk impact levels.
 */
enum class RiskImpact {
    INSIGNIFICANT, // 1
    MINOR,         // 2
    MODERATE,      // 3
    MAJOR,         // 4
    CATASTROPHIC   // 5
}

/**
 * Risk level based on likelihood x impact matrix.
 */
enum class RiskLevel {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

/**
 * Risk treatment options.
 */
enum class RiskTreatment {
    ACCEPT,
    MITIGATE,
    TRANSFER,
    AVOID
}

/**
 * Risk treatment status.
 */
enum class TreatmentStatus {
    OPEN,
    IN_PROGRESS,
    COMPLETED,
    OVERDUE
}

/**
 * PDPL legal basis for data processing.
 */
enum class LegalBasis {
    CONSENT,
    CONTRACT,
    LEGAL_OBLIGATION,
    VITAL_INTEREST,
    PUBLIC_INTEREST,
    LEGITIMATE_INTEREST
}

/**
 * Types of consent.
 */
enum class ConsentType {
    MARKETING,
    DATA_PROCESSING,
    THIRD_PARTY_SHARING,
    PROFILING,
    BIOMETRIC,
    HEALTH_DATA,
    LOCATION_TRACKING,
    CROSS_BORDER_TRANSFER
}

/**
 * Methods of obtaining consent.
 */
enum class ConsentMethod {
    WEB_FORM,
    MOBILE_APP,
    PAPER,
    VERBAL,
    KIOSK,
    EMAIL
}

/**
 * Data subject request types (PDPL Articles 15-23).
 */
enum class DataSubjectRequestType {
    ACCESS,
    RECTIFICATION,
    ERASURE,
    PORTABILITY,
    RESTRICTION,
    OBJECTION
}

/**
 * Data subject request status.
 */
enum class DSRStatus {
    RECEIVED,
    IDENTITY_PENDING,
    IN_PROGRESS,
    PENDING_APPROVAL,
    COMPLETED,
    REJECTED,
    EXTENDED
}

/**
 * Priority levels for DSR requests.
 */
enum class DSRPriority {
    LOW,
    NORMAL,
    HIGH,
    URGENT
}

/**
 * Identity verification methods.
 */
enum class VerificationMethod {
    ID_DOCUMENT,
    EMAIL_VERIFICATION,
    IN_PERSON,
    PHONE_VERIFICATION,
    TWO_FACTOR
}

/**
 * Response delivery methods.
 */
enum class ResponseMethod {
    EMAIL,
    POSTAL,
    PORTAL,
    IN_PERSON
}

/**
 * Data breach types.
 */
enum class BreachType {
    CONFIDENTIALITY,
    INTEGRITY,
    AVAILABILITY
}

/**
 * Data breach sources.
 */
enum class BreachSource {
    EXTERNAL_ATTACK,
    INSIDER_THREAT,
    SYSTEM_ERROR,
    THIRD_PARTY,
    PHYSICAL,
    SOCIAL_ENGINEERING,
    LOST_DEVICE
}

/**
 * Data breach status.
 */
enum class BreachStatus {
    DETECTED,
    INVESTIGATING,
    CONTAINED,
    RESOLVED,
    CLOSED
}

/**
 * Security policy types.
 */
enum class PolicyType {
    INFORMATION_SECURITY,
    DATA_PROTECTION,
    ACCESS_CONTROL,
    INCIDENT_RESPONSE,
    BCP,
    RETENTION,
    ACCEPTABLE_USE,
    PRIVACY,
    ENCRYPTION,
    VENDOR_MANAGEMENT
}

/**
 * Security policy status.
 */
enum class PolicyStatus {
    DRAFT,
    UNDER_REVIEW,
    APPROVED,
    PUBLISHED,
    ARCHIVED
}

/**
 * Policy acknowledgement methods.
 */
enum class AcknowledgementMethod {
    WEB,
    MOBILE,
    EMAIL,
    PAPER
}

/**
 * Data retention actions.
 */
enum class RetentionAction {
    DELETE,
    ANONYMIZE,
    ARCHIVE
}

/**
 * Deletion types for audit trail.
 */
enum class DeletionType {
    HARD_DELETE,
    ANONYMIZATION,
    ARCHIVE
}

/**
 * Deletion reason.
 */
enum class DeletionReason {
    RETENTION_POLICY,
    DSR_REQUEST,
    MANUAL,
    SYSTEM
}

/**
 * Encryption key types.
 */
enum class KeyType {
    AES_256,
    RSA_2048,
    RSA_4096
}

/**
 * Encryption key purpose.
 */
enum class KeyPurpose {
    DATA_ENCRYPTION,
    TOKEN_SIGNING,
    BACKUP,
    COMMUNICATION
}

/**
 * Encryption key status.
 */
enum class KeyStatus {
    ACTIVE,
    ROTATING,
    EXPIRED,
    REVOKED
}

/**
 * Compliance report types.
 */
enum class ReportType {
    COMPLIANCE_STATUS,
    RISK_ASSESSMENT,
    AUDIT_TRAIL,
    DSR_SUMMARY,
    BREACH_REPORT,
    CONTROL_EFFECTIVENESS,
    POLICY_COMPLIANCE
}

/**
 * Report format.
 */
enum class ReportFormat {
    PDF,
    XLSX,
    CSV,
    JSON
}

/**
 * Report generation status.
 */
enum class ReportStatus {
    GENERATING,
    GENERATED,
    FAILED
}

/**
 * Data processing activity status.
 */
enum class ProcessingActivityStatus {
    DRAFT,
    ACTIVE,
    UNDER_REVIEW,
    ARCHIVED
}
