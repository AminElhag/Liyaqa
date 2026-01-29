-- Migration V78: Create member engagement scores table
-- Part of Club Member Management System Redesign - Phase 3

CREATE TABLE member_engagement_scores (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL UNIQUE,
    overall_score INT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    visit_score INT NOT NULL CHECK (visit_score BETWEEN 0 AND 100),
    recency_score INT NOT NULL CHECK (recency_score BETWEEN 0 AND 100),
    payment_score INT NOT NULL CHECK (payment_score BETWEEN 0 AND 100),
    class_score INT NOT NULL CHECK (class_score BETWEEN 0 AND 100),
    tenure_score INT NOT NULL CHECK (tenure_score BETWEEN 0 AND 100),
    risk_level VARCHAR(20) NOT NULL,
    risk_factors JSONB,
    recommended_actions JSONB,
    calculated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_engagement_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_engagement_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Index for finding at-risk members
CREATE INDEX idx_engagement_risk ON member_engagement_scores(tenant_id, risk_level, overall_score);

-- Index for finding members by score range
CREATE INDEX idx_engagement_score ON member_engagement_scores(tenant_id, overall_score);

-- Index for finding stale scores (need recalculation)
CREATE INDEX idx_engagement_calculated ON member_engagement_scores(calculated_at);

COMMENT ON TABLE member_engagement_scores IS 'Tracks member engagement scores and churn risk indicators';
COMMENT ON COLUMN member_engagement_scores.overall_score IS 'Weighted aggregate engagement score (0-100)';
COMMENT ON COLUMN member_engagement_scores.visit_score IS 'Score based on visit frequency vs expected (0-100)';
COMMENT ON COLUMN member_engagement_scores.recency_score IS 'Score based on days since last visit (0-100)';
COMMENT ON COLUMN member_engagement_scores.payment_score IS 'Score based on payment history and timeliness (0-100)';
COMMENT ON COLUMN member_engagement_scores.class_score IS 'Score based on class attendance (0-100)';
COMMENT ON COLUMN member_engagement_scores.tenure_score IS 'Score based on membership duration (0-100)';
COMMENT ON COLUMN member_engagement_scores.risk_level IS 'Churn risk level: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN member_engagement_scores.risk_factors IS 'JSON array of factors contributing to risk';
COMMENT ON COLUMN member_engagement_scores.recommended_actions IS 'JSON array of suggested retention actions';
