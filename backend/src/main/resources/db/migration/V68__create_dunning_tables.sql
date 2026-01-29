-- Migration: Create dunning (payment recovery) tables
-- Description: Automated payment recovery sequences for failed subscriptions

-- Dunning sequences table
CREATE TABLE IF NOT EXISTS dunning_sequences (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    subscription_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    amount DECIMAL(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    failed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Retry tracking
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    next_retry_date DATE,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    last_retry_result VARCHAR(255),

    -- Suspension/deactivation
    suspension_day INTEGER NOT NULL DEFAULT 10,
    deactivation_day INTEGER NOT NULL DEFAULT 30,
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    suspended_at TIMESTAMP WITH TIME ZONE,

    -- Recovery
    recovered_at TIMESTAMP WITH TIME ZONE,
    recovery_method VARCHAR(50),
    failure_reason VARCHAR(255),

    -- CSM escalation
    csm_escalated BOOLEAN NOT NULL DEFAULT FALSE,
    csm_escalated_at TIMESTAMP WITH TIME ZONE,
    csm_id UUID,
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_dunning_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_dunning_subscription
        FOREIGN KEY (subscription_id) REFERENCES client_subscriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_dunning_invoice
        FOREIGN KEY (invoice_id) REFERENCES client_invoices(id) ON DELETE CASCADE,
    CONSTRAINT chk_dunning_status
        CHECK (status IN ('ACTIVE', 'RECOVERED', 'SUSPENDED', 'DEACTIVATED', 'RESOLVED')),
    CONSTRAINT chk_retry_count_positive
        CHECK (retry_count >= 0),
    CONSTRAINT chk_amount_positive
        CHECK (amount > 0)
);

-- Dunning steps (notification schedule)
CREATE TABLE IF NOT EXISTS dunning_steps (
    id UUID PRIMARY KEY,
    dunning_sequence_id UUID NOT NULL,
    day_after_failure INTEGER NOT NULL,
    channels VARCHAR(100) NOT NULL, -- Comma-separated: EMAIL, SMS, PUSH, IN_APP
    description VARCHAR(255) NOT NULL,
    template VARCHAR(100) NOT NULL,
    include_payment_link BOOLEAN NOT NULL DEFAULT FALSE,
    escalate_to_csm BOOLEAN NOT NULL DEFAULT FALSE,
    is_sent BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    clicked BOOLEAN NOT NULL DEFAULT FALSE,
    clicked_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_step_dunning
        FOREIGN KEY (dunning_sequence_id) REFERENCES dunning_sequences(id) ON DELETE CASCADE,
    CONSTRAINT chk_day_positive
        CHECK (day_after_failure >= 0)
);

-- Indexes for efficient querying
CREATE INDEX idx_dunning_organization ON dunning_sequences(organization_id);
CREATE INDEX idx_dunning_subscription ON dunning_sequences(subscription_id);
CREATE INDEX idx_dunning_invoice ON dunning_sequences(invoice_id);
CREATE INDEX idx_dunning_status ON dunning_sequences(status);
CREATE INDEX idx_dunning_active ON dunning_sequences(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_dunning_retry_due ON dunning_sequences(next_retry_date)
    WHERE status = 'ACTIVE' AND next_retry_date IS NOT NULL;
CREATE INDEX idx_dunning_escalated ON dunning_sequences(csm_escalated, csm_id)
    WHERE csm_escalated = TRUE;
CREATE INDEX idx_dunning_csm ON dunning_sequences(csm_id) WHERE csm_id IS NOT NULL;

CREATE INDEX idx_step_dunning ON dunning_steps(dunning_sequence_id);
CREATE INDEX idx_step_pending ON dunning_steps(dunning_sequence_id, is_sent, day_after_failure)
    WHERE is_sent = FALSE;

-- Comments
COMMENT ON TABLE dunning_sequences IS 'Payment recovery sequences for failed subscription payments';
COMMENT ON COLUMN dunning_sequences.status IS 'ACTIVE (in progress), RECOVERED (payment made), SUSPENDED, DEACTIVATED, RESOLVED (manual)';
COMMENT ON COLUMN dunning_sequences.suspension_day IS 'Day after failure when subscription gets suspended (default: 10)';
COMMENT ON COLUMN dunning_sequences.deactivation_day IS 'Day after failure when account gets deactivated (default: 30)';
COMMENT ON COLUMN dunning_sequences.recovery_method IS 'How payment was recovered: automatic_retry, manual_payment, card_updated';

COMMENT ON TABLE dunning_steps IS 'Individual notification steps in the dunning sequence';
COMMENT ON COLUMN dunning_steps.channels IS 'Comma-separated notification channels: EMAIL, SMS, PUSH, IN_APP, PHONE_CALL';
COMMENT ON COLUMN dunning_steps.template IS 'Notification template identifier for the messaging system';
