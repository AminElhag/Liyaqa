-- Scheduling and class booking tables

-- Gym classes table (class definitions)
CREATE TABLE gym_classes (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,

    -- Class details (bilingual)
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,

    -- Location and trainer
    location_id UUID NOT NULL,
    default_trainer_id UUID,

    -- Class configuration
    class_type VARCHAR(30) NOT NULL DEFAULT 'GROUP_FITNESS',
    difficulty_level VARCHAR(30) NOT NULL DEFAULT 'ALL_LEVELS',
    duration_minutes INT NOT NULL DEFAULT 60,
    max_capacity INT NOT NULL DEFAULT 20,
    waitlist_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    max_waitlist_size INT NOT NULL DEFAULT 5,
    requires_subscription BOOLEAN NOT NULL DEFAULT TRUE,
    deducts_class_from_plan BOOLEAN NOT NULL DEFAULT TRUE,

    -- Display options
    color_code VARCHAR(10),
    image_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    sort_order INT NOT NULL DEFAULT 0,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT fk_gym_classes_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT fk_gym_classes_location FOREIGN KEY (location_id) REFERENCES locations(id),
    CONSTRAINT fk_gym_classes_trainer FOREIGN KEY (default_trainer_id) REFERENCES users(id)
);

-- Class schedules table (recurring schedules)
CREATE TABLE class_schedules (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    gym_class_id UUID NOT NULL,

    -- Schedule pattern
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Optional trainer override
    trainer_id UUID,

    -- Effective date range
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,

    -- Override capacity (if different from class default)
    override_capacity INT,

    -- Active flag
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT fk_class_schedules_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT fk_class_schedules_class FOREIGN KEY (gym_class_id) REFERENCES gym_classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_schedules_trainer FOREIGN KEY (trainer_id) REFERENCES users(id)
);

-- Class sessions table (specific occurrences)
CREATE TABLE class_sessions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    gym_class_id UUID NOT NULL,
    schedule_id UUID,

    -- Session details
    location_id UUID NOT NULL,
    trainer_id UUID,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Capacity and booking counts
    max_capacity INT NOT NULL,
    current_bookings INT NOT NULL DEFAULT 0,
    waitlist_count INT NOT NULL DEFAULT 0,
    checked_in_count INT NOT NULL DEFAULT 0,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',

    -- Notes (bilingual)
    notes_en TEXT,
    notes_ar TEXT,

    -- Cancellation info
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT fk_class_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT fk_class_sessions_class FOREIGN KEY (gym_class_id) REFERENCES gym_classes(id),
    CONSTRAINT fk_class_sessions_schedule FOREIGN KEY (schedule_id) REFERENCES class_schedules(id),
    CONSTRAINT fk_class_sessions_location FOREIGN KEY (location_id) REFERENCES locations(id),
    CONSTRAINT fk_class_sessions_trainer FOREIGN KEY (trainer_id) REFERENCES users(id)
);

-- Class bookings table (member reservations)
CREATE TABLE class_bookings (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    session_id UUID NOT NULL,
    member_id UUID NOT NULL,
    subscription_id UUID,

    -- Booking status
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',

    -- Timestamps
    booked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checked_in_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,

    -- Waitlist tracking
    waitlist_position INT,
    promoted_from_waitlist_at TIMESTAMP,

    -- Class deduction tracking
    class_deducted BOOLEAN NOT NULL DEFAULT FALSE,

    -- Notes and audit
    notes TEXT,
    booked_by UUID,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT fk_class_bookings_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT fk_class_bookings_session FOREIGN KEY (session_id) REFERENCES class_sessions(id),
    CONSTRAINT fk_class_bookings_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_class_bookings_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
    CONSTRAINT fk_class_bookings_booked_by FOREIGN KEY (booked_by) REFERENCES users(id)
);

-- Indexes for gym_classes
CREATE INDEX idx_gym_classes_tenant_id ON gym_classes(tenant_id);
CREATE INDEX idx_gym_classes_location_id ON gym_classes(location_id);
CREATE INDEX idx_gym_classes_trainer_id ON gym_classes(default_trainer_id);
CREATE INDEX idx_gym_classes_status ON gym_classes(status);
CREATE INDEX idx_gym_classes_class_type ON gym_classes(class_type);
CREATE INDEX idx_gym_classes_location_status ON gym_classes(location_id, status);

-- Indexes for class_schedules
CREATE INDEX idx_class_schedules_tenant_id ON class_schedules(tenant_id);
CREATE INDEX idx_class_schedules_gym_class_id ON class_schedules(gym_class_id);
CREATE INDEX idx_class_schedules_trainer_id ON class_schedules(trainer_id);
CREATE INDEX idx_class_schedules_day_of_week ON class_schedules(day_of_week);
CREATE INDEX idx_class_schedules_active ON class_schedules(is_active);

-- Indexes for class_sessions
CREATE INDEX idx_class_sessions_tenant_id ON class_sessions(tenant_id);
CREATE INDEX idx_class_sessions_gym_class_id ON class_sessions(gym_class_id);
CREATE INDEX idx_class_sessions_schedule_id ON class_sessions(schedule_id);
CREATE INDEX idx_class_sessions_location_id ON class_sessions(location_id);
CREATE INDEX idx_class_sessions_trainer_id ON class_sessions(trainer_id);
CREATE INDEX idx_class_sessions_session_date ON class_sessions(session_date);
CREATE INDEX idx_class_sessions_status ON class_sessions(status);
CREATE INDEX idx_class_sessions_date_status ON class_sessions(session_date, status);

-- Composite index for checking if session already exists for schedule
CREATE UNIQUE INDEX idx_class_sessions_schedule_date ON class_sessions(schedule_id, session_date)
    WHERE schedule_id IS NOT NULL;

-- Indexes for class_bookings
CREATE INDEX idx_class_bookings_tenant_id ON class_bookings(tenant_id);
CREATE INDEX idx_class_bookings_session_id ON class_bookings(session_id);
CREATE INDEX idx_class_bookings_member_id ON class_bookings(member_id);
CREATE INDEX idx_class_bookings_subscription_id ON class_bookings(subscription_id);
CREATE INDEX idx_class_bookings_status ON class_bookings(status);
CREATE INDEX idx_class_bookings_waitlist_position ON class_bookings(waitlist_position)
    WHERE waitlist_position IS NOT NULL;

-- Unique constraint: one active booking per member per session
CREATE UNIQUE INDEX idx_class_bookings_member_session_active
    ON class_bookings(session_id, member_id)
    WHERE status IN ('CONFIRMED', 'WAITLISTED', 'CHECKED_IN');
