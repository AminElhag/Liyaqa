-- Churn Prediction ML Tables
-- Supports ML-based churn prediction and intervention management

-- Trained churn prediction models
CREATE TABLE churn_models (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    algorithm VARCHAR(50) NOT NULL, -- RANDOM_FOREST, GRADIENT_BOOST, NEURAL_NET
    accuracy DECIMAL(5,4), -- Overall accuracy
    precision_score DECIMAL(5,4), -- Precision for churn class
    recall_score DECIMAL(5,4), -- Recall for churn class
    f1_score DECIMAL(5,4), -- F1 score
    auc_score DECIMAL(5,4), -- Area under ROC curve
    feature_weights JSONB, -- Feature importance
    training_samples INT, -- Number of samples used
    trained_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_churn_models_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- Member churn predictions
CREATE TABLE member_churn_predictions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    model_id UUID NOT NULL,
    churn_score INT NOT NULL, -- 0-100 probability score
    risk_level VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    top_risk_factors JSONB, -- Array of {factor, weight, description}
    recommended_interventions JSONB, -- Array of suggested actions
    prediction_date TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ, -- Prediction expiry (recalculate after)
    intervention_status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, IGNORED
    actual_outcome VARCHAR(20), -- CHURNED, RETAINED, UNKNOWN
    outcome_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_churn_predictions_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_churn_predictions_model FOREIGN KEY (model_id) REFERENCES churn_models(id) ON DELETE CASCADE
);

-- Historical member feature snapshots for ML training
CREATE TABLE member_feature_snapshots (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    snapshot_date DATE NOT NULL,
    -- Engagement features
    total_visits_30d INT DEFAULT 0,
    total_visits_90d INT DEFAULT 0,
    visit_frequency_trend DECIMAL(5,4), -- Rate of change
    days_since_last_visit INT DEFAULT 0,
    avg_visit_duration_mins INT,
    -- Booking features
    class_booking_rate DECIMAL(5,4), -- Booked vs available
    class_attendance_rate DECIMAL(5,4), -- Attended vs booked
    pt_sessions_30d INT DEFAULT 0,
    -- Financial features
    payment_on_time_rate DECIMAL(5,4),
    outstanding_balance DECIMAL(10,2),
    days_until_expiry INT,
    -- Engagement score
    engagement_score DECIMAL(5,4), -- Computed composite score
    -- Training label
    churned BOOLEAN, -- NULL if not yet known
    churn_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_feature_snapshots_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT uq_feature_snapshot UNIQUE (tenant_id, member_id, snapshot_date)
);

-- Churn intervention tracking
CREATE TABLE churn_interventions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    prediction_id UUID NOT NULL,
    member_id UUID NOT NULL,
    intervention_type VARCHAR(50) NOT NULL, -- PERSONAL_CALL, DISCOUNT_OFFER, FREE_PT_SESSION, EMAIL_CAMPAIGN
    intervention_template_id UUID,
    description TEXT,
    description_ar TEXT,
    assigned_to UUID, -- Staff user
    scheduled_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    outcome VARCHAR(30), -- SUCCESS, PARTIAL, FAILED, CANCELLED
    outcome_notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_interventions_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_interventions_prediction FOREIGN KEY (prediction_id) REFERENCES member_churn_predictions(id) ON DELETE CASCADE
);

-- Intervention templates
CREATE TABLE intervention_templates (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    intervention_type VARCHAR(50) NOT NULL,
    description TEXT,
    description_ar TEXT,
    message_template TEXT, -- For emails/SMS
    message_template_ar TEXT,
    offer_details JSONB, -- Discount, free sessions, etc.
    target_risk_levels JSONB, -- ["HIGH", "CRITICAL"]
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_intervention_templates_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_churn_models_tenant ON churn_models(tenant_id);
CREATE INDEX idx_churn_models_active ON churn_models(tenant_id, is_active);

CREATE INDEX idx_churn_predictions_tenant ON member_churn_predictions(tenant_id);
CREATE INDEX idx_churn_predictions_member ON member_churn_predictions(member_id);
CREATE INDEX idx_churn_predictions_risk ON member_churn_predictions(tenant_id, risk_level);
CREATE INDEX idx_churn_predictions_status ON member_churn_predictions(tenant_id, intervention_status);
CREATE INDEX idx_churn_predictions_date ON member_churn_predictions(prediction_date DESC);

CREATE INDEX idx_feature_snapshots_tenant ON member_feature_snapshots(tenant_id);
CREATE INDEX idx_feature_snapshots_member ON member_feature_snapshots(member_id);
CREATE INDEX idx_feature_snapshots_date ON member_feature_snapshots(snapshot_date);

CREATE INDEX idx_interventions_tenant ON churn_interventions(tenant_id);
CREATE INDEX idx_interventions_prediction ON churn_interventions(prediction_id);
CREATE INDEX idx_interventions_member ON churn_interventions(member_id);
CREATE INDEX idx_interventions_assigned ON churn_interventions(assigned_to);

CREATE INDEX idx_intervention_templates_tenant ON intervention_templates(tenant_id);
CREATE INDEX idx_intervention_templates_type ON intervention_templates(tenant_id, intervention_type);

-- Comments
COMMENT ON TABLE churn_models IS 'ML models trained for churn prediction';
COMMENT ON TABLE member_churn_predictions IS 'Per-member churn risk predictions';
COMMENT ON TABLE member_feature_snapshots IS 'Historical feature data for ML training';
COMMENT ON TABLE churn_interventions IS 'Actions taken to prevent member churn';
COMMENT ON TABLE intervention_templates IS 'Reusable intervention action templates';
COMMENT ON COLUMN member_churn_predictions.churn_score IS 'Probability 0-100 of churning';
COMMENT ON COLUMN member_churn_predictions.risk_level IS 'LOW (0-25), MEDIUM (26-50), HIGH (51-75), CRITICAL (76-100)';
COMMENT ON COLUMN member_feature_snapshots.churned IS 'Training label: true if member churned, false if retained';
