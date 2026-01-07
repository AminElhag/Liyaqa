-- Attendance tracking tables
-- Records member visits to gym locations

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    location_id UUID NOT NULL,
    check_in_time TIMESTAMP NOT NULL,
    check_out_time TIMESTAMP,
    check_in_method VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    status VARCHAR(20) NOT NULL DEFAULT 'CHECKED_IN',
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Foreign keys
    CONSTRAINT fk_attendance_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT fk_attendance_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_attendance_location FOREIGN KEY (location_id) REFERENCES locations(id),
    CONSTRAINT fk_attendance_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Indexes for common queries
CREATE INDEX idx_attendance_tenant_id ON attendance_records(tenant_id);
CREATE INDEX idx_attendance_member_id ON attendance_records(member_id);
CREATE INDEX idx_attendance_location_id ON attendance_records(location_id);
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_attendance_check_in_time ON attendance_records(check_in_time);

-- Composite index for member attendance queries by date
CREATE INDEX idx_attendance_member_date ON attendance_records(member_id, check_in_time);

-- Composite index for location attendance on specific day
CREATE INDEX idx_attendance_location_date ON attendance_records(location_id, check_in_time);

-- Index for finding currently checked-in members
CREATE INDEX idx_attendance_active ON attendance_records(tenant_id, status) WHERE status = 'CHECKED_IN';
