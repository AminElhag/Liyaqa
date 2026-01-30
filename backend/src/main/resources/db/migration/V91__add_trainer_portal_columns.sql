-- Add trainer portal columns to existing tables
-- This migration enhances trainers and personal_training_sessions tables with new fields

-- ============================================================================
-- TRAINERS TABLE ENHANCEMENTS
-- ============================================================================

-- Onboarding fields
ALTER TABLE trainers ADD COLUMN onboarding_completed_at TIMESTAMP;
ALTER TABLE trainers ADD COLUMN profile_completeness INT NOT NULL DEFAULT 0;

-- Public profile fields
ALTER TABLE trainers ADD COLUMN is_public_profile BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trainers ADD COLUMN public_bio_en TEXT;
ALTER TABLE trainers ADD COLUMN public_bio_ar TEXT;
ALTER TABLE trainers ADD COLUMN video_intro_url TEXT;

-- Rating and review fields
ALTER TABLE trainers ADD COLUMN average_rating DECIMAL(3,2);
ALTER TABLE trainers ADD COLUMN total_ratings INT NOT NULL DEFAULT 0;

-- Statistics fields
ALTER TABLE trainers ADD COLUMN total_sessions_completed INT NOT NULL DEFAULT 0;
ALTER TABLE trainers ADD COLUMN total_classes_taught INT NOT NULL DEFAULT 0;
ALTER TABLE trainers ADD COLUMN total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Preference fields
ALTER TABLE trainers ADD COLUMN preferred_language VARCHAR(5) NOT NULL DEFAULT 'en';
ALTER TABLE trainers ADD COLUMN notification_preferences TEXT;

-- Calendar sync fields
ALTER TABLE trainers ADD COLUMN calendar_sync_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trainers ADD COLUMN calendar_sync_token TEXT;
ALTER TABLE trainers ADD COLUMN calendar_sync_type VARCHAR(20);

-- Payment information fields
ALTER TABLE trainers ADD COLUMN bank_account_name VARCHAR(255);
ALTER TABLE trainers ADD COLUMN bank_account_number VARCHAR(50);
ALTER TABLE trainers ADD COLUMN bank_name VARCHAR(255);
ALTER TABLE trainers ADD COLUMN iban VARCHAR(50);
ALTER TABLE trainers ADD COLUMN tax_id VARCHAR(50);

-- Add constraints for trainers
ALTER TABLE trainers ADD CONSTRAINT chk_trainer_profile_completeness
    CHECK (profile_completeness >= 0 AND profile_completeness <= 100);

ALTER TABLE trainers ADD CONSTRAINT chk_trainer_average_rating
    CHECK (average_rating IS NULL OR (average_rating >= 0 AND average_rating <= 5));

ALTER TABLE trainers ADD CONSTRAINT chk_trainer_total_ratings
    CHECK (total_ratings >= 0);

ALTER TABLE trainers ADD CONSTRAINT chk_trainer_stats_positive
    CHECK (
        total_sessions_completed >= 0 AND
        total_classes_taught >= 0 AND
        total_revenue >= 0
    );

ALTER TABLE trainers ADD CONSTRAINT chk_trainer_preferred_language
    CHECK (preferred_language IN ('en', 'ar'));

ALTER TABLE trainers ADD CONSTRAINT chk_trainer_calendar_sync
    CHECK (
        (NOT calendar_sync_enabled) OR
        (calendar_sync_enabled AND calendar_sync_token IS NOT NULL AND calendar_sync_type IS NOT NULL)
    );

ALTER TABLE trainers ADD CONSTRAINT chk_trainer_calendar_sync_type
    CHECK (calendar_sync_type IS NULL OR calendar_sync_type IN ('GOOGLE', 'OUTLOOK', 'APPLE'));

-- Create new indexes for trainers
CREATE INDEX idx_trainers_public_profile ON trainers(is_public_profile, status)
    WHERE is_public_profile = true AND status = 'ACTIVE';

CREATE INDEX idx_trainers_rating ON trainers(average_rating DESC NULLS LAST)
    WHERE average_rating IS NOT NULL;

CREATE INDEX idx_trainers_onboarding_incomplete ON trainers(id)
    WHERE onboarding_completed_at IS NULL;

CREATE INDEX idx_trainers_profile_completeness ON trainers(profile_completeness);

-- Add comments for trainers columns
COMMENT ON COLUMN trainers.onboarding_completed_at IS 'Timestamp when trainer completed onboarding wizard';
COMMENT ON COLUMN trainers.profile_completeness IS 'Profile completion percentage (0-100)';
COMMENT ON COLUMN trainers.is_public_profile IS 'Whether trainer profile is visible to members in directory';
COMMENT ON COLUMN trainers.public_bio_en IS 'Public-facing bio in English (may differ from internal bio)';
COMMENT ON COLUMN trainers.public_bio_ar IS 'Public-facing bio in Arabic (may differ from internal bio)';
COMMENT ON COLUMN trainers.video_intro_url IS 'URL to trainer intro video (S3 or YouTube)';
COMMENT ON COLUMN trainers.average_rating IS 'Average member rating (0.00 - 5.00)';
COMMENT ON COLUMN trainers.total_ratings IS 'Total number of ratings received';
COMMENT ON COLUMN trainers.total_sessions_completed IS 'Lifetime count of completed PT sessions';
COMMENT ON COLUMN trainers.total_classes_taught IS 'Lifetime count of taught group classes';
COMMENT ON COLUMN trainers.total_revenue IS 'Lifetime total revenue generated';
COMMENT ON COLUMN trainers.preferred_language IS 'Trainer preferred UI language (en or ar)';
COMMENT ON COLUMN trainers.notification_preferences IS 'JSON object with notification channel preferences';
COMMENT ON COLUMN trainers.calendar_sync_enabled IS 'Whether external calendar sync is enabled';
COMMENT ON COLUMN trainers.calendar_sync_token IS 'Encrypted OAuth token for calendar sync';
COMMENT ON COLUMN trainers.calendar_sync_type IS 'Calendar provider (GOOGLE, OUTLOOK, APPLE)';
COMMENT ON COLUMN trainers.bank_account_name IS 'Bank account holder name';
COMMENT ON COLUMN trainers.bank_account_number IS 'Bank account number';
COMMENT ON COLUMN trainers.iban IS 'International Bank Account Number';
COMMENT ON COLUMN trainers.tax_id IS 'Tax identification number (for contractors/freelancers)';

-- ============================================================================
-- PERSONAL_TRAINING_SESSIONS TABLE ENHANCEMENTS
-- ============================================================================

-- Reminder tracking fields
ALTER TABLE personal_training_sessions ADD COLUMN reminder_sent_to_trainer BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE personal_training_sessions ADD COLUMN reminder_sent_to_member BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE personal_training_sessions ADD COLUMN reminder_sent_at TIMESTAMP;

-- Earnings link fields
ALTER TABLE personal_training_sessions ADD COLUMN earnings_id UUID;
ALTER TABLE personal_training_sessions ADD COLUMN earnings_status VARCHAR(20);

-- Client relationship link
ALTER TABLE personal_training_sessions ADD COLUMN trainer_client_id UUID;

-- Add foreign key constraints for personal_training_sessions
ALTER TABLE personal_training_sessions
    ADD CONSTRAINT fk_pt_session_earnings
    FOREIGN KEY (earnings_id)
    REFERENCES trainer_earnings(id)
    ON DELETE SET NULL;

ALTER TABLE personal_training_sessions
    ADD CONSTRAINT fk_pt_session_trainer_client
    FOREIGN KEY (trainer_client_id)
    REFERENCES trainer_clients(id)
    ON DELETE SET NULL;

-- Add constraints for personal_training_sessions
ALTER TABLE personal_training_sessions ADD CONSTRAINT chk_pt_session_earnings_status
    CHECK (earnings_status IS NULL OR earnings_status IN ('PENDING', 'APPROVED', 'PAID', 'DISPUTED'));

ALTER TABLE personal_training_sessions ADD CONSTRAINT chk_pt_session_reminder
    CHECK (
        (NOT reminder_sent_to_trainer AND NOT reminder_sent_to_member AND reminder_sent_at IS NULL) OR
        (reminder_sent_at IS NOT NULL)
    );

-- Create indexes for personal_training_sessions
CREATE INDEX idx_pt_sessions_earnings ON personal_training_sessions(earnings_id)
    WHERE earnings_id IS NOT NULL;

CREATE INDEX idx_pt_sessions_trainer_client ON personal_training_sessions(trainer_client_id)
    WHERE trainer_client_id IS NOT NULL;

CREATE INDEX idx_pt_sessions_pending_reminders ON personal_training_sessions(session_date, start_time)
    WHERE status = 'CONFIRMED' AND reminder_sent_to_trainer = false;

-- Add comments for personal_training_sessions columns
COMMENT ON COLUMN personal_training_sessions.reminder_sent_to_trainer IS 'Whether reminder was sent to trainer';
COMMENT ON COLUMN personal_training_sessions.reminder_sent_to_member IS 'Whether reminder was sent to member';
COMMENT ON COLUMN personal_training_sessions.reminder_sent_at IS 'Timestamp when reminders were sent';
COMMENT ON COLUMN personal_training_sessions.earnings_id IS 'Link to trainer_earnings record for this session';
COMMENT ON COLUMN personal_training_sessions.earnings_status IS 'Current status of earnings for this session';
COMMENT ON COLUMN personal_training_sessions.trainer_client_id IS 'Link to trainer_clients relationship record';
