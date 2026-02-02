-- Security Alerts Table
CREATE TABLE security_alerts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    details TEXT,
    login_attempt_id UUID,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    CONSTRAINT fk_security_alerts_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_security_alerts_login FOREIGN KEY (login_attempt_id) 
        REFERENCES login_attempts(id) ON DELETE SET NULL
);

CREATE INDEX idx_security_alerts_user ON security_alerts(user_id);
CREATE INDEX idx_security_alerts_unresolved ON security_alerts(user_id, resolved);
CREATE INDEX idx_security_alerts_created ON security_alerts(created_at);

COMMENT ON TABLE security_alerts IS 'Security anomaly alerts for suspicious login activity';
COMMENT ON COLUMN security_alerts.alert_type IS 'Type: IMPOSSIBLE_TRAVEL, NEW_DEVICE, BRUTE_FORCE, UNUSUAL_TIME, NEW_LOCATION';
COMMENT ON COLUMN security_alerts.severity IS 'Severity level: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN security_alerts.details IS 'JSON details about the anomaly';
COMMENT ON COLUMN security_alerts.resolved IS 'Whether user has acknowledged the alert';
