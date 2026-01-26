-- V57: Self-Service Kiosk Integration
-- Supports member check-in, class booking, payments, and e-signatures

-- Kiosk Devices
CREATE TABLE kiosk_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    device_name VARCHAR(100) NOT NULL,
    device_name_ar VARCHAR(100),
    device_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'INACTIVE', -- ACTIVE, INACTIVE, MAINTENANCE
    last_heartbeat TIMESTAMPTZ,
    hardware_id VARCHAR(100), -- Device hardware identifier
    config JSONB DEFAULT '{}', -- {idle_timeout: 120, receipt_printer: true, camera_enabled: true}
    allowed_actions JSONB DEFAULT '["CHECK_IN", "CLASS_BOOKING", "PAYMENT"]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 0,
    UNIQUE (tenant_id, device_code)
);

CREATE INDEX idx_kiosk_devices_tenant ON kiosk_devices(tenant_id);
CREATE INDEX idx_kiosk_devices_location ON kiosk_devices(location_id);
CREATE INDEX idx_kiosk_devices_code ON kiosk_devices(device_code);

-- Kiosk Sessions (member interaction sessions)
CREATE TABLE kiosk_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    kiosk_id UUID NOT NULL REFERENCES kiosk_devices(id),
    member_id UUID REFERENCES members(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    identification_method VARCHAR(20), -- QR_CODE, PHONE, CARD, BIOMETRIC
    identification_value VARCHAR(255), -- The actual credential used
    session_status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, ABANDONED, TIMED_OUT
    actions_taken JSONB DEFAULT '[]', -- [{action: "CHECK_IN", timestamp: "...", success: true}]
    feedback_rating INT, -- 1-5 star rating
    feedback_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kiosk_sessions_tenant ON kiosk_sessions(tenant_id);
CREATE INDEX idx_kiosk_sessions_kiosk ON kiosk_sessions(kiosk_id);
CREATE INDEX idx_kiosk_sessions_member ON kiosk_sessions(member_id);
CREATE INDEX idx_kiosk_sessions_started ON kiosk_sessions(started_at);

-- Kiosk Transactions (financial/action transactions)
CREATE TABLE kiosk_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    session_id UUID NOT NULL REFERENCES kiosk_sessions(id),
    transaction_type VARCHAR(30) NOT NULL, -- CHECK_IN, CLASS_BOOKING, PAYMENT, MEMBERSHIP_RENEWAL, FREEZE, AGREEMENT_SIGN
    reference_type VARCHAR(30), -- ATTENDANCE, CLASS_BOOKING, INVOICE, MEMBERSHIP, AGREEMENT
    reference_id UUID,
    amount DECIMAL(10,2),
    payment_method VARCHAR(30), -- CARD, APPLE_PAY, MADA, CASH
    payment_reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED, CANCELLED
    error_message VARCHAR(500),
    receipt_printed BOOLEAN DEFAULT false,
    receipt_sent_email BOOLEAN DEFAULT false,
    receipt_sent_sms BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_kiosk_transactions_tenant ON kiosk_transactions(tenant_id);
CREATE INDEX idx_kiosk_transactions_session ON kiosk_transactions(session_id);
CREATE INDEX idx_kiosk_transactions_type ON kiosk_transactions(transaction_type);
CREATE INDEX idx_kiosk_transactions_status ON kiosk_transactions(status);

-- Kiosk E-Signatures (for agreements)
CREATE TABLE kiosk_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    session_id UUID NOT NULL REFERENCES kiosk_sessions(id),
    member_id UUID NOT NULL REFERENCES members(id),
    agreement_id UUID NOT NULL,
    signature_data TEXT NOT NULL, -- Base64 encoded signature image
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(45),
    device_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kiosk_signatures_tenant ON kiosk_signatures(tenant_id);
CREATE INDEX idx_kiosk_signatures_session ON kiosk_signatures(session_id);
CREATE INDEX idx_kiosk_signatures_member ON kiosk_signatures(member_id);
CREATE INDEX idx_kiosk_signatures_agreement ON kiosk_signatures(agreement_id);

-- Kiosk Analytics (daily aggregates)
CREATE TABLE kiosk_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES clubs(id),
    kiosk_id UUID NOT NULL REFERENCES kiosk_devices(id),
    analytics_date DATE NOT NULL,
    total_sessions INT DEFAULT 0,
    successful_sessions INT DEFAULT 0,
    abandoned_sessions INT DEFAULT 0,
    check_ins INT DEFAULT 0,
    class_bookings INT DEFAULT 0,
    payments_count INT DEFAULT 0,
    payments_total DECIMAL(10,2) DEFAULT 0,
    avg_session_duration_seconds INT,
    avg_feedback_rating DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (kiosk_id, analytics_date)
);

CREATE INDEX idx_kiosk_analytics_tenant ON kiosk_analytics(tenant_id);
CREATE INDEX idx_kiosk_analytics_kiosk ON kiosk_analytics(kiosk_id);
CREATE INDEX idx_kiosk_analytics_date ON kiosk_analytics(analytics_date);

-- Add new permissions for kiosk management
INSERT INTO permissions (name, description, category) VALUES
    ('kiosk_view', 'View kiosk devices and sessions', 'KIOSK'),
    ('kiosk_manage', 'Manage kiosk devices and configuration', 'KIOSK'),
    ('kiosk_analytics', 'View kiosk analytics and reports', 'KIOSK')
ON CONFLICT (name) DO NOTHING;
