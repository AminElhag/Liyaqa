-- Zone & Facility Booking Tables
-- Enables booking of facilities like pools, courts, saunas, etc.

-- Facility definitions
CREATE TABLE facilities (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    location_id UUID NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description_en TEXT,
    description_ar TEXT,
    type VARCHAR(30) NOT NULL,
    capacity INT NOT NULL DEFAULT 1,
    hourly_rate DECIMAL(10,2),
    hourly_rate_currency VARCHAR(3) DEFAULT 'SAR',
    requires_subscription BOOLEAN NOT NULL DEFAULT true,
    booking_window_days INT NOT NULL DEFAULT 7,
    min_booking_minutes INT NOT NULL DEFAULT 30,
    max_booking_minutes INT NOT NULL DEFAULT 120,
    buffer_minutes INT NOT NULL DEFAULT 15,
    gender_restriction VARCHAR(20),
    image_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_facilities_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_facilities_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

-- Operating hours per facility per day
CREATE TABLE facility_operating_hours (
    id UUID PRIMARY KEY,
    facility_id UUID NOT NULL,
    day_of_week INT NOT NULL,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (facility_id, day_of_week),
    CONSTRAINT fk_facility_hours_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
);

-- Pre-generated time slots
CREATE TABLE facility_slots (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    facility_id UUID NOT NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (facility_id, slot_date, start_time),
    CONSTRAINT fk_facility_slots_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_facility_slots_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
);

-- Bookings
CREATE TABLE facility_bookings (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    facility_id UUID NOT NULL,
    slot_id UUID NOT NULL,
    member_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    notes TEXT,
    booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checked_in_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_facility_bookings_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_facility_bookings_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
    CONSTRAINT fk_facility_bookings_slot FOREIGN KEY (slot_id) REFERENCES facility_slots(id) ON DELETE CASCADE,
    CONSTRAINT fk_facility_bookings_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_facilities_tenant ON facilities(tenant_id);
CREATE INDEX idx_facilities_location ON facilities(location_id);
CREATE INDEX idx_facilities_type ON facilities(tenant_id, type);
CREATE INDEX idx_facilities_status ON facilities(tenant_id, status);

CREATE INDEX idx_facility_hours_facility ON facility_operating_hours(facility_id);

CREATE INDEX idx_facility_slots_tenant ON facility_slots(tenant_id);
CREATE INDEX idx_facility_slots_facility ON facility_slots(facility_id);
CREATE INDEX idx_facility_slots_date ON facility_slots(facility_id, slot_date);
CREATE INDEX idx_facility_slots_status ON facility_slots(facility_id, slot_date, status);

CREATE INDEX idx_facility_bookings_tenant ON facility_bookings(tenant_id);
CREATE INDEX idx_facility_bookings_facility ON facility_bookings(facility_id);
CREATE INDEX idx_facility_bookings_member ON facility_bookings(member_id);
CREATE INDEX idx_facility_bookings_slot ON facility_bookings(slot_id);
CREATE INDEX idx_facility_bookings_status ON facility_bookings(tenant_id, status);
CREATE INDEX idx_facility_bookings_date ON facility_bookings(tenant_id, booked_at);

-- Comments
COMMENT ON TABLE facilities IS 'Bookable facilities like pools, courts, saunas';
COMMENT ON TABLE facility_operating_hours IS 'Operating hours per facility per day of week';
COMMENT ON TABLE facility_slots IS 'Pre-generated time slots for booking';
COMMENT ON TABLE facility_bookings IS 'Member bookings for facility slots';
COMMENT ON COLUMN facilities.type IS 'SWIMMING_POOL, TENNIS_COURT, SQUASH_COURT, SAUNA, STEAM_ROOM, JACUZZI, MASSAGE_ROOM, PRIVATE_STUDIO';
COMMENT ON COLUMN facility_slots.status IS 'AVAILABLE, BOOKED, BLOCKED, MAINTENANCE';
COMMENT ON COLUMN facility_bookings.status IS 'CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, NO_SHOW';
