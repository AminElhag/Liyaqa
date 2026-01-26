-- Sales Forecasting Tables
-- Supports revenue forecasting, seasonality analysis, budgets, and scenario planning

-- Forecast models (ML/statistical models for predictions)
CREATE TABLE forecast_models (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    model_type VARCHAR(30) NOT NULL, -- REVENUE, MEMBERSHIP_COUNT, CHURN
    algorithm VARCHAR(50) NOT NULL, -- ARIMA, EXPONENTIAL_SMOOTHING, PROPHET, LINEAR_REGRESSION
    training_date TIMESTAMPTZ NOT NULL,
    accuracy_mape DECIMAL(5,2), -- Mean Absolute Percentage Error
    accuracy_rmse DECIMAL(15,2), -- Root Mean Square Error
    feature_importance JSONB, -- Key features used for prediction
    hyperparameters JSONB, -- Model configuration
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_forecast_models_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- Generated forecasts
CREATE TABLE forecasts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    model_id UUID NOT NULL,
    forecast_type VARCHAR(30) NOT NULL, -- REVENUE, MEMBERSHIP_COUNT, ATTENDANCE, CHURN_RATE
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    predicted_value DECIMAL(15,2) NOT NULL,
    lower_bound DECIMAL(15,2), -- 95% confidence interval lower
    upper_bound DECIMAL(15,2), -- 95% confidence interval upper
    actual_value DECIMAL(15,2), -- Filled in after period ends
    confidence_score DECIMAL(5,4), -- Model confidence 0-1
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_forecasts_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_forecasts_model FOREIGN KEY (model_id) REFERENCES forecast_models(id) ON DELETE CASCADE
);

-- Seasonality patterns detected
CREATE TABLE seasonality_patterns (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    pattern_type VARCHAR(20) NOT NULL, -- WEEKLY, MONTHLY, QUARTERLY, YEARLY
    period_key VARCHAR(20) NOT NULL, -- e.g., "MONDAY", "JANUARY", "Q1", "RAMADAN"
    metric_type VARCHAR(30) NOT NULL, -- REVENUE, ATTENDANCE, SIGN_UPS
    adjustment_factor DECIMAL(5,4) NOT NULL, -- Multiplier (1.0 = normal, 1.2 = 20% increase)
    sample_size INT NOT NULL, -- Number of data points used
    confidence_level DECIMAL(5,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_seasonality_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- Budget planning
CREATE TABLE budgets (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    fiscal_year INT NOT NULL,
    fiscal_month INT NOT NULL, -- 1-12
    metric_type VARCHAR(30) NOT NULL, -- REVENUE, MEMBERSHIP_REVENUE, PT_REVENUE, RETAIL_REVENUE
    budgeted_value DECIMAL(15,2) NOT NULL,
    actual_value DECIMAL(15,2), -- Filled as actuals come in
    variance DECIMAL(15,2), -- actual - budgeted
    variance_percentage DECIMAL(5,2),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_budgets_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT uq_budgets_period UNIQUE (tenant_id, fiscal_year, fiscal_month, metric_type)
);

-- What-if scenario planning
CREATE TABLE forecast_scenarios (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description TEXT,
    description_ar TEXT,
    adjustments JSONB NOT NULL, -- {membership_growth: 0.1, price_change: 50, churn_reduction: 0.05}
    scenario_forecasts JSONB, -- Calculated forecasts for this scenario
    base_forecast_id UUID, -- Reference forecast this is based on
    is_baseline BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_scenarios_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_forecast_models_tenant ON forecast_models(tenant_id);
CREATE INDEX idx_forecast_models_active ON forecast_models(tenant_id, is_active);
CREATE INDEX idx_forecast_models_type ON forecast_models(tenant_id, model_type);

CREATE INDEX idx_forecasts_tenant ON forecasts(tenant_id);
CREATE INDEX idx_forecasts_model ON forecasts(model_id);
CREATE INDEX idx_forecasts_type_period ON forecasts(tenant_id, forecast_type, period_start);
CREATE INDEX idx_forecasts_period ON forecasts(period_start, period_end);

CREATE INDEX idx_seasonality_tenant ON seasonality_patterns(tenant_id);
CREATE INDEX idx_seasonality_type ON seasonality_patterns(tenant_id, pattern_type, metric_type);

CREATE INDEX idx_budgets_tenant ON budgets(tenant_id);
CREATE INDEX idx_budgets_period ON budgets(tenant_id, fiscal_year, fiscal_month);

CREATE INDEX idx_scenarios_tenant ON forecast_scenarios(tenant_id);

-- Comments
COMMENT ON TABLE forecast_models IS 'Machine learning/statistical models used for forecasting';
COMMENT ON TABLE forecasts IS 'Generated predictions with confidence intervals';
COMMENT ON TABLE seasonality_patterns IS 'Detected seasonal variations in metrics';
COMMENT ON TABLE budgets IS 'Budget targets vs actual performance by period';
COMMENT ON TABLE forecast_scenarios IS 'What-if scenario simulations for planning';
COMMENT ON COLUMN forecast_models.accuracy_mape IS 'Mean Absolute Percentage Error - lower is better';
COMMENT ON COLUMN forecasts.confidence_score IS 'Model confidence in prediction, 0.0-1.0';
COMMENT ON COLUMN seasonality_patterns.adjustment_factor IS 'Multiplier: 1.0=normal, 1.2=20% above average';
