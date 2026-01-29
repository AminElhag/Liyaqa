-- Migration V76: Create member check-ins table for attendance tracking
-- Part of Club Member Management System Redesign - Phase 1

CREATE TABLE member_check_ins (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    check_in_time TIMESTAMPTZ NOT NULL,
    check_out_time TIMESTAMPTZ,
    method VARCHAR(20) NOT NULL,
    device_id VARCHAR(100),
    location VARCHAR(255),
    processed_by_user_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_checkin_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_checkin_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_checkin_processed_by FOREIGN KEY (processed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for querying member's check-in history (most recent first)
CREATE INDEX idx_checkins_member ON member_check_ins(member_id, check_in_time DESC);

-- Index for querying tenant's check-ins by date (for dashboard)
CREATE INDEX idx_checkins_tenant_date ON member_check_ins(tenant_id, check_in_time DESC);

-- Index for finding check-ins by device (kiosk tracking)
CREATE INDEX idx_checkins_device ON member_check_ins(tenant_id, device_id, check_in_time DESC) WHERE device_id IS NOT NULL;

-- Index for finding check-ins by staff member who processed them
CREATE INDEX idx_checkins_processed_by ON member_check_ins(processed_by_user_id, check_in_time DESC) WHERE processed_by_user_id IS NOT NULL;

COMMENT ON TABLE member_check_ins IS 'Tracks member gym attendance and check-in/check-out events';
COMMENT ON COLUMN member_check_ins.method IS 'Check-in method: QR_CODE, MEMBER_ID, PHONE, RFID_CARD, MANUAL, BIOMETRIC';
COMMENT ON COLUMN member_check_ins.device_id IS 'Identifier of kiosk or terminal used for check-in';
COMMENT ON COLUMN member_check_ins.location IS 'Facility location or zone where check-in occurred';
COMMENT ON COLUMN member_check_ins.processed_by_user_id IS 'Staff member who processed manual check-in (null for self-service)';
