-- V61: Security Compliance Tables
-- Supports ISO 27001, SOC 2 Type II, PCI DSS, and PDPL (Saudi Privacy Law)

-- Security Events Log (auth failures, intrusion attempts, PII access)
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    event_type VARCHAR(50) NOT NULL, -- AUTH_FAILURE, INTRUSION_ATTEMPT, PII_ACCESS, SUSPICIOUS_ACTIVITY, PASSWORD_CHANGE, ROLE_CHANGE, DATA_EXPORT, CONFIG_CHANGE
    severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    source_ip VARCHAR(45),
    user_id UUID REFERENCES users(id),
    user_agent TEXT,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    action VARCHAR(50),
    outcome VARCHAR(20), -- SUCCESS, FAILURE, BLOCKED
    details JSONB,
    risk_score INT DEFAULT 0,
    investigated BOOLEAN DEFAULT false,
    investigated_by UUID REFERENCES users(id),
    investigated_at TIMESTAMPTZ,
    investigation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_events_tenant ON security_events(tenant_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_created ON security_events(created_at);
CREATE INDEX idx_security_events_investigated ON security_events(investigated);

-- Compliance Frameworks (ISO 27001, SOC 2, PCI DSS, PDPL)
CREATE TABLE compliance_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE, -- ISO_27001, SOC_2, PCI_DSS, PDPL
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description TEXT,
    description_ar TEXT,
    version VARCHAR(20),
    issuing_body VARCHAR(100),
    certification_validity_months INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance Requirements (Control requirements per framework)
CREATE TABLE compliance_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id UUID NOT NULL REFERENCES compliance_frameworks(id),
    control_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    description TEXT,
    description_ar TEXT,
    category VARCHAR(100), -- Access Control, Cryptography, Physical Security, etc.
    parent_requirement_id UUID REFERENCES compliance_requirements(id),
    is_mandatory BOOLEAN DEFAULT true,
    evidence_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (framework_id, control_number)
);

CREATE INDEX idx_compliance_requirements_framework ON compliance_requirements(framework_id);
CREATE INDEX idx_compliance_requirements_category ON compliance_requirements(category);
CREATE INDEX idx_compliance_requirements_parent ON compliance_requirements(parent_requirement_id);

-- Organization Compliance Status (Compliance status per org/framework)
CREATE TABLE organization_compliance_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    framework_id UUID NOT NULL REFERENCES compliance_frameworks(id),
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED', -- NOT_STARTED, IN_PROGRESS, COMPLIANT, NON_COMPLIANT, CERTIFIED
    compliance_score DECIMAL(5,2) DEFAULT 0.00,
    total_controls INT DEFAULT 0,
    implemented_controls INT DEFAULT 0,
    certification_date DATE,
    certification_expiry_date DATE,
    last_assessment_date DATE,
    next_assessment_date DATE,
    auditor_name VARCHAR(100),
    auditor_company VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0,
    UNIQUE (organization_id, framework_id)
);

CREATE INDEX idx_org_compliance_status_org ON organization_compliance_status(organization_id);
CREATE INDEX idx_org_compliance_status_framework ON organization_compliance_status(framework_id);
CREATE INDEX idx_org_compliance_status_status ON organization_compliance_status(status);

-- Control Implementations (Control status per org/requirement)
CREATE TABLE control_implementations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    requirement_id UUID NOT NULL REFERENCES compliance_requirements(id),
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_IMPLEMENTED', -- NOT_IMPLEMENTED, IN_PROGRESS, IMPLEMENTED, NOT_APPLICABLE
    implementation_date DATE,
    implementation_notes TEXT,
    responsible_user_id UUID REFERENCES users(id),
    review_date DATE,
    next_review_date DATE,
    effectiveness VARCHAR(20), -- EFFECTIVE, PARTIALLY_EFFECTIVE, NOT_EFFECTIVE, NOT_TESTED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0,
    UNIQUE (organization_id, requirement_id)
);

CREATE INDEX idx_control_implementations_org ON control_implementations(organization_id);
CREATE INDEX idx_control_implementations_req ON control_implementations(requirement_id);
CREATE INDEX idx_control_implementations_status ON control_implementations(status);

-- Compliance Evidence (Evidence documents for controls)
CREATE TABLE compliance_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    control_implementation_id UUID NOT NULL REFERENCES control_implementations(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    evidence_type VARCHAR(50) NOT NULL, -- DOCUMENT, SCREENSHOT, REPORT, LOG, POLICY, PROCEDURE, CONFIGURATION, AUDIT_TRAIL
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    valid_from DATE,
    valid_until DATE,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_evidence_org ON compliance_evidence(organization_id);
CREATE INDEX idx_compliance_evidence_control ON compliance_evidence(control_implementation_id);
CREATE INDEX idx_compliance_evidence_current ON compliance_evidence(is_current);

-- Risk Assessments (Risk assessment records)
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assessment_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, IN_PROGRESS, COMPLETED, APPROVED, ARCHIVED
    scope TEXT,
    methodology VARCHAR(100), -- NIST, ISO_27005, OCTAVE, FAIR
    assessor_id UUID REFERENCES users(id),
    reviewer_id UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    total_risks INT DEFAULT 0,
    high_risks INT DEFAULT 0,
    medium_risks INT DEFAULT 0,
    low_risks INT DEFAULT 0,
    next_review_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_risk_assessments_org ON risk_assessments(organization_id);
CREATE INDEX idx_risk_assessments_tenant ON risk_assessments(tenant_id);
CREATE INDEX idx_risk_assessments_status ON risk_assessments(status);
CREATE INDEX idx_risk_assessments_date ON risk_assessments(assessment_date);

-- Identified Risks (Individual risks with treatment plans)
CREATE TABLE identified_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES risk_assessments(id),
    risk_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- STRATEGIC, OPERATIONAL, FINANCIAL, COMPLIANCE, IT_SECURITY, DATA_PRIVACY
    asset_affected VARCHAR(255),
    threat_source VARCHAR(255),
    vulnerability VARCHAR(255),
    likelihood VARCHAR(20) NOT NULL, -- RARE, UNLIKELY, POSSIBLE, LIKELY, ALMOST_CERTAIN
    impact VARCHAR(20) NOT NULL, -- INSIGNIFICANT, MINOR, MODERATE, MAJOR, CATASTROPHIC
    inherent_risk_score INT NOT NULL, -- 1-25 matrix
    inherent_risk_level VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    existing_controls TEXT,
    treatment_option VARCHAR(30) NOT NULL, -- ACCEPT, MITIGATE, TRANSFER, AVOID
    treatment_plan TEXT,
    treatment_owner_id UUID REFERENCES users(id),
    treatment_due_date DATE,
    treatment_status VARCHAR(30) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, COMPLETED, OVERDUE
    residual_likelihood VARCHAR(20),
    residual_impact VARCHAR(20),
    residual_risk_score INT,
    residual_risk_level VARCHAR(20),
    related_requirement_ids JSONB, -- Array of compliance_requirements IDs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_identified_risks_assessment ON identified_risks(assessment_id);
CREATE INDEX idx_identified_risks_category ON identified_risks(category);
CREATE INDEX idx_identified_risks_level ON identified_risks(inherent_risk_level);
CREATE INDEX idx_identified_risks_treatment ON identified_risks(treatment_status);

-- Data Processing Activities (PDPL Article 7 Register)
CREATE TABLE data_processing_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    activity_name VARCHAR(255) NOT NULL,
    activity_name_ar VARCHAR(255),
    description TEXT,
    description_ar TEXT,
    purpose VARCHAR(500) NOT NULL,
    purpose_ar VARCHAR(500),
    legal_basis VARCHAR(50) NOT NULL, -- CONSENT, CONTRACT, LEGAL_OBLIGATION, VITAL_INTEREST, PUBLIC_INTEREST, LEGITIMATE_INTEREST
    data_categories JSONB NOT NULL, -- ["personal", "financial", "health", "biometric"]
    data_subjects JSONB NOT NULL, -- ["members", "employees", "leads"]
    recipients JSONB, -- ["internal_staff", "payment_providers", "marketing"]
    retention_period_days INT,
    retention_justification TEXT,
    cross_border_transfer BOOLEAN DEFAULT false,
    transfer_country VARCHAR(100),
    transfer_safeguards TEXT,
    security_measures TEXT,
    automated_decision_making BOOLEAN DEFAULT false,
    profiling BOOLEAN DEFAULT false,
    privacy_impact_required BOOLEAN DEFAULT false,
    privacy_impact_completed BOOLEAN DEFAULT false,
    owner_id UUID REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'ACTIVE', -- DRAFT, ACTIVE, UNDER_REVIEW, ARCHIVED
    last_reviewed_at TIMESTAMPTZ,
    next_review_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_data_processing_org ON data_processing_activities(organization_id);
CREATE INDEX idx_data_processing_tenant ON data_processing_activities(tenant_id);
CREATE INDEX idx_data_processing_legal_basis ON data_processing_activities(legal_basis);
CREATE INDEX idx_data_processing_status ON data_processing_activities(status);

-- Consent Records (PDPL Article 6 Consent Tracking)
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    member_id UUID REFERENCES members(id),
    lead_id UUID REFERENCES leads(id),
    consent_type VARCHAR(50) NOT NULL, -- MARKETING, DATA_PROCESSING, THIRD_PARTY_SHARING, PROFILING, BIOMETRIC, HEALTH_DATA
    purpose VARCHAR(500) NOT NULL,
    purpose_ar VARCHAR(500),
    version VARCHAR(20) DEFAULT '1.0',
    consent_text TEXT,
    consent_given BOOLEAN NOT NULL,
    consent_method VARCHAR(30) NOT NULL, -- WEB_FORM, MOBILE_APP, PAPER, VERBAL, KIOSK
    given_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    withdrawal_reason TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    proof_document_path VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consent_records_tenant ON consent_records(tenant_id);
CREATE INDEX idx_consent_records_member ON consent_records(member_id);
CREATE INDEX idx_consent_records_lead ON consent_records(lead_id);
CREATE INDEX idx_consent_records_type ON consent_records(consent_type);
CREATE INDEX idx_consent_records_given ON consent_records(consent_given);

-- Data Subject Requests (DSR workflow - access, erasure, portability)
CREATE TABLE data_subject_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    request_number VARCHAR(50) NOT NULL,
    member_id UUID REFERENCES members(id),
    requester_name VARCHAR(255) NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    requester_phone VARCHAR(50),
    request_type VARCHAR(30) NOT NULL, -- ACCESS, RECTIFICATION, ERASURE, PORTABILITY, RESTRICTION, OBJECTION
    description TEXT,
    identity_verified BOOLEAN DEFAULT false,
    identity_verified_at TIMESTAMPTZ,
    identity_verified_by UUID REFERENCES users(id),
    verification_method VARCHAR(50), -- ID_DOCUMENT, EMAIL_VERIFICATION, IN_PERSON
    status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED', -- RECEIVED, IDENTITY_PENDING, IN_PROGRESS, PENDING_APPROVAL, COMPLETED, REJECTED, EXTENDED
    priority VARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    assigned_to_user_id UUID REFERENCES users(id),
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date DATE NOT NULL, -- PDPL Article 26: 30 days
    extended_due_date DATE,
    extension_reason TEXT,
    completed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    response_sent_at TIMESTAMPTZ,
    response_method VARCHAR(30), -- EMAIL, POSTAL, PORTAL
    data_exported_path VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0,
    UNIQUE (tenant_id, request_number)
);

CREATE INDEX idx_dsr_tenant ON data_subject_requests(tenant_id);
CREATE INDEX idx_dsr_member ON data_subject_requests(member_id);
CREATE INDEX idx_dsr_type ON data_subject_requests(request_type);
CREATE INDEX idx_dsr_status ON data_subject_requests(status);
CREATE INDEX idx_dsr_due_date ON data_subject_requests(due_date);
CREATE INDEX idx_dsr_assigned ON data_subject_requests(assigned_to_user_id);

-- Data Breaches (Breach register with SDAIA notification tracking)
CREATE TABLE data_breaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    breach_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discovered_at TIMESTAMPTZ NOT NULL,
    discovered_by UUID REFERENCES users(id),
    occurred_at TIMESTAMPTZ,
    contained_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    breach_type VARCHAR(50) NOT NULL, -- CONFIDENTIALITY, INTEGRITY, AVAILABILITY
    breach_source VARCHAR(50), -- EXTERNAL_ATTACK, INSIDER_THREAT, SYSTEM_ERROR, THIRD_PARTY, PHYSICAL
    affected_data_types JSONB, -- ["personal", "financial", "health"]
    affected_records_count INT,
    affected_members_count INT,
    severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(30) NOT NULL DEFAULT 'DETECTED', -- DETECTED, INVESTIGATING, CONTAINED, RESOLVED, CLOSED
    lead_investigator_id UUID REFERENCES users(id),
    root_cause TEXT,
    impact_assessment TEXT,
    remediation_actions TEXT,
    lessons_learned TEXT,
    -- SDAIA Notification (PDPL Article 29: within 72 hours)
    sdaia_notification_required BOOLEAN DEFAULT false,
    sdaia_notified_at TIMESTAMPTZ,
    sdaia_notification_reference VARCHAR(100),
    sdaia_notification_deadline TIMESTAMPTZ,
    -- Affected individuals notification
    individuals_notification_required BOOLEAN DEFAULT false,
    individuals_notified_at TIMESTAMPTZ,
    individuals_notification_method VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0,
    UNIQUE (organization_id, breach_number)
);

CREATE INDEX idx_data_breaches_org ON data_breaches(organization_id);
CREATE INDEX idx_data_breaches_tenant ON data_breaches(tenant_id);
CREATE INDEX idx_data_breaches_status ON data_breaches(status);
CREATE INDEX idx_data_breaches_severity ON data_breaches(severity);
CREATE INDEX idx_data_breaches_discovered ON data_breaches(discovered_at);

-- Security Policies (Policy documents with versioning)
CREATE TABLE security_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    policy_type VARCHAR(50) NOT NULL, -- INFORMATION_SECURITY, DATA_PROTECTION, ACCESS_CONTROL, INCIDENT_RESPONSE, BCP, RETENTION, ACCEPTABLE_USE
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    content TEXT,
    content_ar TEXT,
    version VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, UNDER_REVIEW, APPROVED, PUBLISHED, ARCHIVED
    effective_date DATE,
    review_date DATE,
    next_review_date DATE,
    owner_id UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    acknowledgement_required BOOLEAN DEFAULT false,
    related_framework_ids JSONB, -- Array of compliance_frameworks IDs
    document_path VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version_num BIGINT DEFAULT 0
);

CREATE INDEX idx_security_policies_org ON security_policies(organization_id);
CREATE INDEX idx_security_policies_type ON security_policies(policy_type);
CREATE INDEX idx_security_policies_status ON security_policies(status);

-- Policy Acknowledgements (User policy acceptance)
CREATE TABLE policy_acknowledgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES security_policies(id),
    user_id UUID NOT NULL REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledgement_method VARCHAR(30) NOT NULL, -- WEB, MOBILE, EMAIL, PAPER
    ip_address VARCHAR(45),
    user_agent TEXT,
    policy_version VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (policy_id, user_id, policy_version)
);

CREATE INDEX idx_policy_ack_policy ON policy_acknowledgements(policy_id);
CREATE INDEX idx_policy_ack_user ON policy_acknowledgements(user_id);

-- Data Retention Rules (Retention periods per entity type)
CREATE TABLE data_retention_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    entity_type VARCHAR(100) NOT NULL, -- MEMBER, INVOICE, ATTENDANCE, AUDIT_LOG, SECURITY_EVENT, etc.
    retention_period_days INT NOT NULL,
    action_on_expiry VARCHAR(30) NOT NULL, -- DELETE, ANONYMIZE, ARCHIVE
    legal_basis TEXT,
    applies_to_deleted_only BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0,
    UNIQUE (organization_id, entity_type)
);

CREATE INDEX idx_retention_rules_org ON data_retention_rules(organization_id);
CREATE INDEX idx_retention_rules_entity ON data_retention_rules(entity_type);

-- Data Deletion Log (Deletion audit trail)
CREATE TABLE data_deletion_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    deletion_type VARCHAR(30) NOT NULL, -- HARD_DELETE, ANONYMIZATION, ARCHIVE
    deleted_by UUID REFERENCES users(id),
    deletion_reason VARCHAR(50), -- RETENTION_POLICY, DSR_REQUEST, MANUAL, SYSTEM
    retention_rule_id UUID REFERENCES data_retention_rules(id),
    dsr_request_id UUID REFERENCES data_subject_requests(id),
    original_data_hash VARCHAR(64), -- SHA-256 hash for verification
    deleted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deletion_log_tenant ON data_deletion_log(tenant_id);
CREATE INDEX idx_deletion_log_entity ON data_deletion_log(entity_type, entity_id);
CREATE INDEX idx_deletion_log_date ON data_deletion_log(deleted_at);

-- Encryption Keys (Key metadata - actual keys in vault)
CREATE TABLE encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    key_alias VARCHAR(100) NOT NULL,
    key_type VARCHAR(30) NOT NULL, -- AES_256, RSA_2048, RSA_4096
    purpose VARCHAR(50) NOT NULL, -- DATA_ENCRYPTION, TOKEN_SIGNING, BACKUP
    vault_reference VARCHAR(255), -- Reference to key in external vault
    algorithm VARCHAR(30) NOT NULL, -- AES-256-GCM, RSA-OAEP
    key_size INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rotated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ROTATING, EXPIRED, REVOKED
    created_by UUID REFERENCES users(id),
    version BIGINT DEFAULT 0,
    UNIQUE (organization_id, key_alias)
);

CREATE INDEX idx_encryption_keys_org ON encryption_keys(organization_id);
CREATE INDEX idx_encryption_keys_status ON encryption_keys(status);

-- Compliance Reports (Generated reports)
CREATE TABLE compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    framework_id UUID REFERENCES compliance_frameworks(id),
    report_type VARCHAR(50) NOT NULL, -- COMPLIANCE_STATUS, RISK_ASSESSMENT, AUDIT_TRAIL, DSR_SUMMARY, BREACH_REPORT
    title VARCHAR(255) NOT NULL,
    description TEXT,
    report_period_start DATE,
    report_period_end DATE,
    generated_by UUID NOT NULL REFERENCES users(id),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size BIGINT,
    format VARCHAR(20) DEFAULT 'PDF', -- PDF, XLSX, CSV, JSON
    status VARCHAR(20) DEFAULT 'GENERATED', -- GENERATING, GENERATED, FAILED
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_reports_org ON compliance_reports(organization_id);
CREATE INDEX idx_compliance_reports_framework ON compliance_reports(framework_id);
CREATE INDEX idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX idx_compliance_reports_date ON compliance_reports(generated_at);

-- Add new permissions for compliance and security
INSERT INTO permissions (name, description, category) VALUES
    -- Compliance
    ('compliance_view', 'View compliance status and frameworks', 'COMPLIANCE'),
    ('compliance_manage', 'Manage compliance controls and evidence', 'COMPLIANCE'),
    ('compliance_reports', 'Generate compliance reports', 'COMPLIANCE'),
    -- Security Events
    ('security_events_view', 'View security event logs', 'SECURITY'),
    ('security_events_investigate', 'Investigate security events', 'SECURITY'),
    -- Data Protection (PDPL)
    ('data_protection_view', 'View data processing activities', 'DATA_PROTECTION'),
    ('data_protection_manage', 'Manage data processing activities', 'DATA_PROTECTION'),
    ('consent_view', 'View consent records', 'DATA_PROTECTION'),
    ('consent_manage', 'Manage consent records', 'DATA_PROTECTION'),
    ('dsr_view', 'View data subject requests', 'DATA_PROTECTION'),
    ('dsr_process', 'Process data subject requests', 'DATA_PROTECTION'),
    ('breach_view', 'View data breach records', 'DATA_PROTECTION'),
    ('breach_manage', 'Manage data breach records', 'DATA_PROTECTION'),
    -- Risk Management
    ('risk_view', 'View risk assessments', 'RISK'),
    ('risk_manage', 'Manage risk assessments and treatments', 'RISK'),
    -- Policies
    ('policy_view', 'View security policies', 'POLICY'),
    ('policy_manage', 'Manage security policies', 'POLICY'),
    ('policy_approve', 'Approve security policies', 'POLICY'),
    -- Data Retention
    ('retention_view', 'View data retention rules', 'DATA_RETENTION'),
    ('retention_manage', 'Manage data retention rules', 'DATA_RETENTION'),
    -- Encryption
    ('encryption_view', 'View encryption key metadata', 'ENCRYPTION'),
    ('encryption_manage', 'Manage encryption keys', 'ENCRYPTION')
ON CONFLICT (name) DO NOTHING;
