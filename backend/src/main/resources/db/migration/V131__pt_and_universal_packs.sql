-- V131: PT Redesign & Universal Packs
-- Adds PT-specific fields to existing entities, creates trainer_availability table,
-- adds universal service_type to class_packs, and PT access on membership_plans.

-- 1. Extend trainers table with PT-specific fields
ALTER TABLE trainers
  ADD COLUMN home_service_available BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN travel_fee_amount DECIMAL(10,2),
  ADD COLUMN travel_fee_currency VARCHAR(3),
  ADD COLUMN travel_radius_km INT,
  ADD COLUMN max_concurrent_clients INT NOT NULL DEFAULT 1,
  ADD COLUMN rating DECIMAL(3,2);

-- 2. Trainer availability (structured slots replacing JSON)
CREATE TABLE trainer_availability (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  trainer_id UUID NOT NULL,
  day_of_week VARCHAR(10) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_type VARCHAR(10) NOT NULL DEFAULT 'CLUB',
  location_id UUID,
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  effective_from DATE NOT NULL,
  effective_until DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT fk_avail_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id)
);

-- 3. PT fields on gym_classes
ALTER TABLE gym_classes
  ADD COLUMN pt_session_type VARCHAR(20),
  ADD COLUMN pt_location_type VARCHAR(10),
  ADD COLUMN travel_fee_amount DECIMAL(10,2),
  ADD COLUMN travel_fee_currency VARCHAR(3),
  ADD COLUMN trainer_profile_id UUID,
  ADD COLUMN min_capacity INT NOT NULL DEFAULT 1;

ALTER TABLE gym_classes
  ADD CONSTRAINT fk_class_trainer_profile
  FOREIGN KEY (trainer_profile_id) REFERENCES trainers(id);

-- 4. PT fields on class_sessions
ALTER TABLE class_sessions
  ADD COLUMN pt_location_type VARCHAR(10),
  ADD COLUMN client_address TEXT,
  ADD COLUMN travel_fee_applied_amount DECIMAL(10,2),
  ADD COLUMN travel_fee_applied_currency VARCHAR(3),
  ADD COLUMN trainer_notes TEXT,
  ADD COLUMN completion_notes TEXT;

-- 5. Universal packs: add service_type to class_packs
ALTER TABLE class_packs
  ADD COLUMN service_type VARCHAR(10) NOT NULL DEFAULT 'GX';

-- 6. Travel fee on bookings
ALTER TABLE class_bookings
  ADD COLUMN travel_fee_paid_amount DECIMAL(10,2),
  ADD COLUMN travel_fee_paid_currency VARCHAR(3);

-- 7. PT access on membership plans
ALTER TABLE membership_plans
  ADD COLUMN pt_access_level VARCHAR(20) NOT NULL DEFAULT 'NO_ACCESS',
  ADD COLUMN max_pt_sessions_per_period INT,
  ADD COLUMN pt_sessions_included INT;

-- Indexes
CREATE INDEX idx_trainer_avail_trainer ON trainer_availability(trainer_id);
CREATE INDEX idx_trainer_avail_day ON trainer_availability(day_of_week);
CREATE INDEX idx_trainer_avail_tenant ON trainer_availability(tenant_id);
CREATE INDEX idx_gym_classes_trainer_profile ON gym_classes(trainer_profile_id);
CREATE INDEX idx_gym_classes_pt_session_type ON gym_classes(pt_session_type);
CREATE INDEX idx_class_packs_service_type ON class_packs(service_type);
CREATE INDEX idx_class_sessions_pt_location ON class_sessions(pt_location_type);
