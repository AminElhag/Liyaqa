-- Member Wallets table
-- Tracks balance (credit/debt) for each member
CREATE TABLE member_wallets (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL UNIQUE,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
    balance_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    last_transaction_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_wallet_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX idx_wallets_tenant_id ON member_wallets(tenant_id);
CREATE INDEX idx_wallets_member_id ON member_wallets(member_id);

-- Wallet Transactions table (immutable audit log)
-- Records all wallet balance changes
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    balance_after DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wtx_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX idx_wtx_tenant_id ON wallet_transactions(tenant_id);
CREATE INDEX idx_wtx_member_id ON wallet_transactions(member_id);
CREATE INDEX idx_wtx_type ON wallet_transactions(type);
CREATE INDEX idx_wtx_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wtx_reference ON wallet_transactions(reference_type, reference_id);
