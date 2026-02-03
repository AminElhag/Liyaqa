-- Platform Passwordless Login Tokens
-- Stores OTP codes (hashed) for passwordless authentication via email

CREATE TABLE platform_login_tokens (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    failed_attempts INT NOT NULL DEFAULT 0,

    CONSTRAINT check_failed_attempts CHECK (failed_attempts >= 0 AND failed_attempts <= 5)
);

-- Index for looking up tokens by email (for cleanup and rate limiting)
CREATE INDEX idx_platform_login_tokens_email ON platform_login_tokens(email);

-- Index for verifying codes (primary lookup path)
CREATE INDEX idx_platform_login_tokens_code_hash ON platform_login_tokens(code_hash);

-- Index for cleanup job (deleting expired tokens)
CREATE INDEX idx_platform_login_tokens_expires_at ON platform_login_tokens(expires_at);
