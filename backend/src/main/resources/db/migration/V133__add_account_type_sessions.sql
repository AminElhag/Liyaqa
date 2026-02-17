-- V133: Add account_type_sessions table for multi-account login flow
-- Short-lived sessions used when a user with multiple account types logs in.

CREATE TABLE account_type_sessions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id   UUID        NOT NULL,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMP   NOT NULL,
    used        BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX idx_account_type_sessions_token_hash ON account_type_sessions(token_hash);
CREATE INDEX idx_account_type_sessions_user_id ON account_type_sessions(user_id);
