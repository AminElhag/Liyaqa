-- ============================================
-- V18: Create Platform Users and Support Tickets Tables
-- ============================================

-- ============================================
-- 1. Platform Users Table
-- ============================================
CREATE TABLE platform_users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name_en VARCHAR(100) NOT NULL,
    display_name_ar VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'SUPPORT_REP',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    phone_number VARCHAR(20),
    avatar_url VARCHAR(500),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_by_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_platform_users_created_by FOREIGN KEY (created_by_id) REFERENCES platform_users(id)
);

CREATE INDEX idx_platform_users_email ON platform_users(email);
CREATE INDEX idx_platform_users_status ON platform_users(status);
CREATE INDEX idx_platform_users_role ON platform_users(role);
CREATE INDEX idx_platform_users_created_at ON platform_users(created_at DESC);

-- ============================================
-- 2. Platform User Activities Table
-- ============================================
CREATE TABLE platform_user_activities (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_platform_user_activities_user FOREIGN KEY (user_id) REFERENCES platform_users(id) ON DELETE CASCADE
);

CREATE INDEX idx_platform_user_activities_user ON platform_user_activities(user_id);
CREATE INDEX idx_platform_user_activities_created ON platform_user_activities(created_at DESC);
CREATE INDEX idx_platform_user_activities_action ON platform_user_activities(action);

-- ============================================
-- 3. Support Tickets Table
-- ============================================
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY,
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
    organization_id UUID NOT NULL,
    club_id UUID,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    assigned_to_id UUID,
    created_by_id UUID NOT NULL,
    created_by_email VARCHAR(255),
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    tags VARCHAR(500),
    message_count INT NOT NULL DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_support_tickets_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_support_tickets_club FOREIGN KEY (club_id) REFERENCES clubs(id),
    CONSTRAINT fk_support_tickets_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES platform_users(id),
    CONSTRAINT fk_support_tickets_created_by FOREIGN KEY (created_by_id) REFERENCES platform_users(id)
);

CREATE INDEX idx_support_tickets_number ON support_tickets(ticket_number);
CREATE INDEX idx_support_tickets_org ON support_tickets(organization_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to_id);
CREATE INDEX idx_support_tickets_created_by ON support_tickets(created_by_id);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_support_tickets_status_priority ON support_tickets(status, priority);
CREATE INDEX idx_support_tickets_org_status ON support_tickets(organization_id, status);

-- ============================================
-- 4. Ticket Messages Table
-- ============================================
CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL,
    author_email VARCHAR(255),
    is_from_client BOOLEAN NOT NULL DEFAULT FALSE,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_ticket_messages_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_messages_author FOREIGN KEY (author_id) REFERENCES platform_users(id)
);

CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_author ON ticket_messages(author_id);
CREATE INDEX idx_ticket_messages_created ON ticket_messages(created_at);

-- ============================================
-- 5. Ticket Number Sequence
-- ============================================
CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START WITH 1 INCREMENT BY 1;

-- ============================================
-- 6. Insert Default Platform Admin
-- ============================================
INSERT INTO platform_users (id, email, password_hash, display_name_en, display_name_ar, role, status)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'admin@liyaqa.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.3cZ7fG6WvqDXvLqS9K',
    'Platform Admin',
    'مدير المنصة',
    'PLATFORM_ADMIN',
    'ACTIVE'
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 7. Insert Sample Sales Rep
-- ============================================
INSERT INTO platform_users (id, email, password_hash, display_name_en, display_name_ar, role, status, created_by_id)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'sales@liyaqa.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.3cZ7fG6WvqDXvLqS9K',
    'Sales Rep',
    'مندوب المبيعات',
    'SALES_REP',
    'ACTIVE',
    '00000000-0000-0000-0000-000000000002'
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 8. Insert Sample Support Rep
-- ============================================
INSERT INTO platform_users (id, email, password_hash, display_name_en, display_name_ar, role, status, created_by_id)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    'support@liyaqa.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.3cZ7fG6WvqDXvLqS9K',
    'Support Rep',
    'مندوب الدعم',
    'SUPPORT_REP',
    'ACTIVE',
    '00000000-0000-0000-0000-000000000002'
) ON CONFLICT (email) DO NOTHING;
