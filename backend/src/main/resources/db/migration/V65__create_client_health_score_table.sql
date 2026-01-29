-- Migration: Create client health score tables
-- Description: Tracks client health metrics for proactive churn prevention

-- Client health scores table
CREATE TABLE IF NOT EXISTS client_health_scores (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    overall_score INTEGER NOT NULL DEFAULT 0,
    usage_score INTEGER NOT NULL DEFAULT 0,
    engagement_score INTEGER NOT NULL DEFAULT 0,
    payment_score INTEGER NOT NULL DEFAULT 0,
    support_score INTEGER NOT NULL DEFAULT 0,
    trend VARCHAR(20) NOT NULL DEFAULT 'STABLE',
    risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW',
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    previous_score INTEGER,
    score_change INTEGER,

    -- Usage metrics
    admin_logins_30d INTEGER NOT NULL DEFAULT 0,
    features_used_30d INTEGER NOT NULL DEFAULT 0,
    api_calls_30d BIGINT NOT NULL DEFAULT 0,

    -- Engagement metrics
    member_growth_30d INTEGER NOT NULL DEFAULT 0,
    checkins_30d BIGINT NOT NULL DEFAULT 0,
    bookings_30d BIGINT NOT NULL DEFAULT 0,

    -- Payment metrics
    payment_success_rate INTEGER NOT NULL DEFAULT 100,
    failed_payments_30d INTEGER NOT NULL DEFAULT 0,
    days_since_payment INTEGER,

    -- Support metrics
    open_tickets INTEGER NOT NULL DEFAULT 0,
    tickets_30d INTEGER NOT NULL DEFAULT 0,
    avg_satisfaction DOUBLE PRECISION,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_health_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT chk_overall_score
        CHECK (overall_score >= 0 AND overall_score <= 100),
    CONSTRAINT chk_usage_score
        CHECK (usage_score >= 0 AND usage_score <= 100),
    CONSTRAINT chk_engagement_score
        CHECK (engagement_score >= 0 AND engagement_score <= 100),
    CONSTRAINT chk_payment_score
        CHECK (payment_score >= 0 AND payment_score <= 100),
    CONSTRAINT chk_support_score
        CHECK (support_score >= 0 AND support_score <= 100),
    CONSTRAINT chk_trend
        CHECK (trend IN ('IMPROVING', 'STABLE', 'DECLINING')),
    CONSTRAINT chk_risk_level
        CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

-- Indexes for efficient querying
CREATE INDEX idx_health_organization ON client_health_scores(organization_id);
CREATE INDEX idx_health_risk_level ON client_health_scores(risk_level);
CREATE INDEX idx_health_calculated_at ON client_health_scores(calculated_at DESC);
CREATE INDEX idx_health_organization_latest ON client_health_scores(organization_id, calculated_at DESC);
CREATE INDEX idx_health_at_risk ON client_health_scores(risk_level) WHERE risk_level IN ('HIGH', 'CRITICAL');
CREATE INDEX idx_health_declining ON client_health_scores(trend) WHERE trend = 'DECLINING';

-- Comments
COMMENT ON TABLE client_health_scores IS 'Historical health scores for client organizations, calculated daily';
COMMENT ON COLUMN client_health_scores.overall_score IS 'Weighted average of component scores (0-100)';
COMMENT ON COLUMN client_health_scores.usage_score IS 'Score based on admin activity and feature adoption (40% weight)';
COMMENT ON COLUMN client_health_scores.engagement_score IS 'Score based on member activity (25% weight)';
COMMENT ON COLUMN client_health_scores.payment_score IS 'Score based on payment history (20% weight)';
COMMENT ON COLUMN client_health_scores.support_score IS 'Score based on support interactions (15% weight)';
COMMENT ON COLUMN client_health_scores.risk_level IS 'Risk categorization: LOW (80-100), MEDIUM (60-79), HIGH (40-59), CRITICAL (0-39)';
