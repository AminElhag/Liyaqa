-- Membership Module tables
-- V4: Create members, membership_plans, and subscriptions tables

-- Members table (tenant-scoped)
CREATE TABLE members (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    -- Address fields
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    -- Emergency contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_members_club FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT fk_members_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_members_tenant_id ON members(tenant_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_status ON members(status);

-- Add FK from users.member_id to members.id now that members table exists
ALTER TABLE users ADD CONSTRAINT fk_users_member FOREIGN KEY (member_id) REFERENCES members(id);

-- Membership plans table (tenant-scoped)
CREATE TABLE membership_plans (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    price_amount DECIMAL(10, 2) NOT NULL,
    price_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    billing_period VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
    duration_days INT,
    max_classes_per_period INT,
    has_guest_passes BOOLEAN NOT NULL DEFAULT FALSE,
    guest_passes_count INT NOT NULL DEFAULT 0,
    has_locker_access BOOLEAN NOT NULL DEFAULT FALSE,
    has_sauna_access BOOLEAN NOT NULL DEFAULT FALSE,
    has_pool_access BOOLEAN NOT NULL DEFAULT FALSE,
    freeze_days_allowed INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_membership_plans_club FOREIGN KEY (tenant_id) REFERENCES clubs(id)
);

CREATE INDEX idx_membership_plans_tenant_id ON membership_plans(tenant_id);
CREATE INDEX idx_membership_plans_is_active ON membership_plans(is_active);

-- Subscriptions table (tenant-scoped)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    paid_amount DECIMAL(10, 2),
    paid_currency VARCHAR(3),
    classes_remaining INT,
    guest_passes_remaining INT NOT NULL DEFAULT 0,
    freeze_days_remaining INT NOT NULL DEFAULT 0,
    frozen_at DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_subscriptions_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES membership_plans(id),
    CONSTRAINT fk_subscriptions_club FOREIGN KEY (tenant_id) REFERENCES clubs(id)
);

CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);