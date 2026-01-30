-- Create trainer_earnings table for financial tracking and payment management
-- This table tracks all trainer earnings from PT sessions, group classes, bonuses, and commissions

CREATE TABLE trainer_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    trainer_id UUID NOT NULL,
    earning_type VARCHAR(20) NOT NULL,
    session_id UUID,
    earning_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    deduction_amount DECIMAL(10,2),
    deduction_currency VARCHAR(3),
    net_amount DECIMAL(10,2) NOT NULL,
    net_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_date DATE,
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_trainer_earnings_type CHECK (earning_type IN ('PT_SESSION', 'GROUP_CLASS', 'BONUS', 'COMMISSION')),
    CONSTRAINT chk_trainer_earnings_status CHECK (status IN ('PENDING', 'APPROVED', 'PAID', 'DISPUTED')),
    CONSTRAINT chk_trainer_earnings_amount_positive CHECK (amount >= 0),
    CONSTRAINT chk_trainer_earnings_net_positive CHECK (net_amount >= 0),
    CONSTRAINT chk_trainer_earnings_deduction CHECK (deduction_amount IS NULL OR deduction_amount >= 0),
    CONSTRAINT chk_trainer_earnings_payment_date CHECK (
        payment_date IS NULL OR status = 'PAID'
    ),
    CONSTRAINT chk_trainer_earnings_payment_ref CHECK (
        payment_reference IS NULL OR status = 'PAID'
    )
);

-- Add foreign key constraints
ALTER TABLE trainer_earnings
    ADD CONSTRAINT fk_trainer_earnings_trainer
    FOREIGN KEY (trainer_id)
    REFERENCES trainers(id)
    ON DELETE CASCADE;

ALTER TABLE trainer_earnings
    ADD CONSTRAINT fk_trainer_earnings_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

-- Create indexes for efficient queries
CREATE INDEX idx_trainer_earnings_trainer_status ON trainer_earnings(trainer_id, status);
CREATE INDEX idx_trainer_earnings_trainer_date ON trainer_earnings(trainer_id, earning_date DESC);
CREATE INDEX idx_trainer_earnings_date ON trainer_earnings(earning_date DESC);
CREATE INDEX idx_trainer_earnings_session ON trainer_earnings(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_trainer_earnings_tenant ON trainer_earnings(tenant_id);
CREATE INDEX idx_trainer_earnings_org ON trainer_earnings(organization_id);
CREATE INDEX idx_trainer_earnings_status ON trainer_earnings(status);
CREATE INDEX idx_trainer_earnings_type ON trainer_earnings(earning_type);
CREATE INDEX idx_trainer_earnings_pending ON trainer_earnings(trainer_id, status) WHERE status IN ('PENDING', 'APPROVED');
CREATE INDEX idx_trainer_earnings_payment_date ON trainer_earnings(payment_date DESC NULLS LAST);

-- Add comments for documentation
COMMENT ON TABLE trainer_earnings IS 'Tracks all trainer earnings with payment status and details';
COMMENT ON COLUMN trainer_earnings.earning_type IS 'PT_SESSION: Personal training, GROUP_CLASS: Group fitness class, BONUS: Performance bonus, COMMISSION: Sales commission';
COMMENT ON COLUMN trainer_earnings.session_id IS 'References personal_training_sessions.id or class_sessions.id depending on earning_type';
COMMENT ON COLUMN trainer_earnings.status IS 'PENDING: Awaiting approval, APPROVED: Approved for payment, PAID: Payment processed, DISPUTED: Under review';
COMMENT ON COLUMN trainer_earnings.amount IS 'Gross earning amount before deductions';
COMMENT ON COLUMN trainer_earnings.deduction_amount IS 'Total deductions (tax, fees, etc.)';
COMMENT ON COLUMN trainer_earnings.net_amount IS 'Net amount after deductions (amount - deduction_amount)';
COMMENT ON COLUMN trainer_earnings.payment_reference IS 'Bank transfer reference, check number, or payment transaction ID';
