# Liyaqa Database Schema

**Complete Database Schema Reference**

---

## Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [Multi-Tenancy Implementation](#2-multi-tenancy-implementation)
3. [Core Tables](#3-core-tables)
4. [Module-Specific Tables](#4-module-specific-tables)
5. [Indexes and Performance](#5-indexes-and-performance)
6. [Database Migrations](#6-database-migrations)

---

## 1. Schema Overview

### 1.1 Statistics

| Metric | Value |
|--------|-------|
| **Total Migrations** | 73+ |
| **Total Tables** | 150+ |
| **Database Engine** | PostgreSQL |
| **Migration Tool** | Flyway |
| **ORM** | Spring Data JPA with Hibernate |

### 1.2 Database Design Principles

**Multi-Tenancy**:
- Two-level isolation: `organization_id` and `club_id`
- Tenant filtering at query level
- Composite indexes for performance

**Audit Trail**:
- `created_at`, `updated_at` timestamps on most tables
- `created_by`, `updated_by` user references
- Soft deletes where applicable (`deleted_at`)

**Data Types**:
- UUIDs for primary keys
- TIMESTAMP WITH TIME ZONE for dates
- JSONB for flexible data structures
- ENUM types for status fields

**Naming Conventions**:
- Snake_case for table and column names
- Singular table names where appropriate
- Foreign keys: `{table}_id`

---

## 2. Multi-Tenancy Implementation

### 2.1 Tenant Isolation Pattern

**Organization-Level Tables** (most tables):
```sql
CREATE TABLE {table_name} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    -- ... other columns
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_{table}_org ON {table_name}(organization_id);
CREATE INDEX idx_{table}_org_id ON {table_name}(organization_id, id);
```

**Club-Level Tables** (where club-specific):
```sql
CREATE TABLE {table_name} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    club_id UUID NOT NULL REFERENCES clubs(id),
    -- ... other columns
);

CREATE INDEX idx_{table}_org_club ON {table_name}(organization_id, club_id);
```

**Platform-Level Tables** (no tenant isolation):
```sql
CREATE TABLE client_plans (
    id UUID PRIMARY KEY,
    -- No organization_id - this is platform-level data
);
```

### 2.2 Tenant Filtering

**Hibernate Filter** (applied automatically):
```sql
-- Application-level filter ensures queries like:
SELECT * FROM members WHERE organization_id = :current_org_id;

-- Even when developer writes:
SELECT * FROM members;
```

---

## 3. Core Tables

### 3.1 Organizations & Clubs

**`organizations`** - Client organizations (gyms/chains)
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    slug VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- PENDING, ACTIVE, SUSPENDED, CLOSED
    logo_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**`clubs`** - Gym locations/branches
```sql
CREATE TABLE clubs (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    slug VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    timezone VARCHAR(100) DEFAULT 'Asia/Riyadh',
    status VARCHAR(50) NOT NULL, -- ACTIVE, INACTIVE, UNDER_CONSTRUCTION
    capacity INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, slug)
);
```

### 3.2 Members & Subscriptions

**`members`** - Gym members
```sql
CREATE TABLE members (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    club_id UUID REFERENCES clubs(id),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    first_name_ar VARCHAR(255),
    last_name_ar VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20), -- MALE, FEMALE, OTHER
    status VARCHAR(50) NOT NULL, -- PENDING, ACTIVE, FROZEN, EXPIRED, CANCELLED
    member_number VARCHAR(100) UNIQUE,
    qr_code TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, email)
);

CREATE INDEX idx_members_org ON members(organization_id);
CREATE INDEX idx_members_org_club ON members(organization_id, club_id);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_status ON members(organization_id, status);
```

**`membership_plans`** - Plan definitions
```sql
CREATE TABLE membership_plans (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    description_ar TEXT,
    duration_days INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SAR',
    billing_cycle VARCHAR(50), -- MONTHLY, QUARTERLY, ANNUAL
    classes_per_month INT,
    guest_passes INT,
    freeze_days_allocated INT,
    access_hours VARCHAR(50), -- 24_7, PEAK, OFF_PEAK
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**`subscriptions`** - Active member subscriptions
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    member_id UUID NOT NULL REFERENCES members(id),
    plan_id UUID NOT NULL REFERENCES membership_plans(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL, -- ACTIVE, EXPIRED, CANCELLED, FROZEN
    auto_renew BOOLEAN DEFAULT FALSE,
    classes_remaining INT,
    guest_passes_remaining INT,
    freeze_days_remaining INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_member ON subscriptions(organization_id, member_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(organization_id, status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(organization_id, end_date);
```

**`membership_contracts`** - Legal contracts
```sql
CREATE TABLE membership_contracts (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    member_id UUID NOT NULL REFERENCES members(id),
    subscription_id UUID REFERENCES subscriptions(id),
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    contract_type VARCHAR(50), -- FIXED_TERM, ROLLING, PAY_AS_YOU_GO
    commitment_months INT,
    early_termination_fee DECIMAL(10,2),
    cooling_off_period_days INT DEFAULT 7, -- Saudi Arabia requirement
    signed_at TIMESTAMP,
    cooling_off_expiry TIMESTAMP,
    status VARCHAR(50) NOT NULL, -- PENDING, ACTIVE, COOLING_OFF, EXPIRED, TERMINATED
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 Classes & Scheduling

**`gym_classes`** - Class definitions
```sql
CREATE TABLE gym_classes (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    duration_minutes INT NOT NULL,
    capacity INT NOT NULL,
    difficulty_level VARCHAR(50), -- BEGINNER, INTERMEDIATE, ADVANCED
    category VARCHAR(100), -- CARDIO, STRENGTH, FLEXIBILITY, MIND_BODY
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**`class_sessions`** - Individual class instances
```sql
CREATE TABLE class_sessions (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    club_id UUID NOT NULL REFERENCES clubs(id),
    class_id UUID NOT NULL REFERENCES gym_classes(id),
    trainer_id UUID REFERENCES trainers(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    capacity INT NOT NULL,
    booked_count INT DEFAULT 0,
    status VARCHAR(50) NOT NULL, -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    location VARCHAR(255), -- Studio A, Pool, etc.
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_org_club ON class_sessions(organization_id, club_id);
CREATE INDEX idx_sessions_start_time ON class_sessions(organization_id, start_time);
CREATE INDEX idx_sessions_trainer ON class_sessions(trainer_id);
```

**`class_bookings`** - Member bookings
```sql
CREATE TABLE class_bookings (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    member_id UUID NOT NULL REFERENCES members(id),
    session_id UUID NOT NULL REFERENCES class_sessions(id),
    booking_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL, -- CONFIRMED, CANCELLED, COMPLETED, NO_SHOW, WAITLIST
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(member_id, session_id)
);

CREATE INDEX idx_bookings_member ON class_bookings(organization_id, member_id);
CREATE INDEX idx_bookings_session ON class_bookings(session_id);
CREATE INDEX idx_bookings_status ON class_bookings(organization_id, status);
```

### 3.4 Billing & Invoices

**`invoices`**
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    member_id UUID REFERENCES members(id),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'SAR',
    status VARCHAR(50) NOT NULL, -- DRAFT, ISSUED, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED
    payment_method VARCHAR(50), -- CARD, CASH, BANK_TRANSFER, STC_PAY, SADAD, TAMARA
    payment_reference VARCHAR(255),
    paid_at TIMESTAMP,
    notes TEXT,
    zatca_qr_code TEXT, -- ZATCA e-invoice QR code
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_member ON invoices(organization_id, member_id);
CREATE INDEX idx_invoices_status ON invoices(organization_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(organization_id, due_date);
```

**`invoice_line_items`**
```sql
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    description_ar VARCHAR(500),
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_line_items_invoice ON invoice_line_items(invoice_id);
```

### 3.5 Attendance & Access

**`attendance_records`**
```sql
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    club_id UUID NOT NULL REFERENCES clubs(id),
    member_id UUID NOT NULL REFERENCES members(id),
    check_in_time TIMESTAMP NOT NULL,
    check_out_time TIMESTAMP,
    duration_minutes INT,
    check_in_method VARCHAR(50), -- QR_CODE, RFID_CARD, MANUAL, BIOMETRIC
    checked_in_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_org_club ON attendance_records(organization_id, club_id);
CREATE INDEX idx_attendance_member ON attendance_records(organization_id, member_id);
CREATE INDEX idx_attendance_date ON attendance_records(organization_id, check_in_time);
```

---

## 4. Module-Specific Tables

### 4.1 CRM Module

**`leads`**
```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100), -- WEBSITE, WALK_IN, REFERRAL, SOCIAL, ADS
    status VARCHAR(50) NOT NULL, -- NEW, CONTACTED, QUALIFIED, CONVERTED, LOST
    stage VARCHAR(50), -- NEW, CONTACTED, TOUR_SCHEDULED, TRIAL, NEGOTIATION, WON, LOST
    score INT DEFAULT 0,
    assigned_to UUID REFERENCES users(id),
    converted_member_id UUID REFERENCES members(id),
    converted_at TIMESTAMP,
    lost_reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**`lead_activities`**
```sql
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- CALL, EMAIL, MEETING, TOUR, NOTE
    subject VARCHAR(500),
    notes TEXT,
    activity_date TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Marketing Module

**`campaigns`**
```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- ONE_TIME, DRIP, TRIGGERED, AB_TEST
    channel VARCHAR(50) NOT NULL, -- EMAIL, SMS, WHATSAPP, PUSH
    status VARCHAR(50) NOT NULL, -- DRAFT, SCHEDULED, ACTIVE, COMPLETED, CANCELLED
    subject VARCHAR(500),
    content TEXT,
    send_at TIMESTAMP,
    completed_at TIMESTAMP,
    target_count INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    delivered_count INT DEFAULT 0,
    opened_count INT DEFAULT 0,
    clicked_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**`segments`**
```sql
CREATE TABLE segments (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- STATIC, DYNAMIC
    criteria JSONB NOT NULL, -- Segment criteria as JSON
    member_count INT DEFAULT 0,
    last_calculated TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 Loyalty Module

**`member_points`**
```sql
CREATE TABLE member_points (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    member_id UUID NOT NULL REFERENCES members(id),
    balance INT DEFAULT 0,
    lifetime_earned INT DEFAULT 0,
    lifetime_redeemed INT DEFAULT 0,
    tier VARCHAR(50), -- BRONZE, SILVER, GOLD, PLATINUM
    tier_expiry DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, member_id)
);
```

**`points_transactions`**
```sql
CREATE TABLE points_transactions (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    member_points_id UUID NOT NULL REFERENCES member_points(id),
    transaction_type VARCHAR(50) NOT NULL, -- EARN, REDEEM, EXPIRE, ADJUSTMENT
    points INT NOT NULL,
    balance_after INT NOT NULL,
    reason VARCHAR(255),
    reference_type VARCHAR(100), -- ATTENDANCE, PURCHASE, REFERRAL, MANUAL
    reference_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 4.4 Referral Module

**`referral_codes`**
```sql
CREATE TABLE referral_codes (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    member_id UUID NOT NULL REFERENCES members(id),
    code VARCHAR(50) UNIQUE NOT NULL,
    clicks INT DEFAULT 0,
    signups INT DEFAULT 0,
    conversions INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**`referrals`**
```sql
CREATE TABLE referrals (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    referrer_member_id UUID NOT NULL REFERENCES members(id),
    referred_member_id UUID REFERENCES members(id),
    referral_code VARCHAR(50),
    status VARCHAR(50) NOT NULL, -- PENDING, SIGNED_UP, CONVERTED, REWARDED
    referred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    converted_at TIMESTAMP,
    reward_status VARCHAR(50), -- PENDING, APPROVED, CREDITED
    reward_amount DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 4.5 Platform Module (B2B)

**`client_plans`** - B2B subscription plans
```sql
CREATE TABLE client_plans (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    billing_cycle VARCHAR(50) NOT NULL, -- MONTHLY, QUARTERLY, ANNUAL
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SAR',
    trial_period_days INT DEFAULT 0,
    max_members INT,
    max_locations INT,
    max_staff_users INT,
    storage_limit_gb INT,
    api_rate_limit INT,
    features JSONB, -- Feature flags as JSON
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**`client_subscriptions`**
```sql
CREATE TABLE client_subscriptions (
    id UUID PRIMARY KEY,
    organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id),
    plan_id UUID NOT NULL REFERENCES client_plans(id),
    status VARCHAR(50) NOT NULL, -- TRIAL, ACTIVE, SUSPENDED, CANCELLED
    start_date DATE NOT NULL,
    end_date DATE,
    trial_end_date DATE,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**`client_health_scores`**
```sql
CREATE TABLE client_health_scores (
    id UUID PRIMARY KEY,
    organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id),
    overall_score INT NOT NULL, -- 0-100
    usage_score INT, -- 0-100
    engagement_score INT, -- 0-100
    payment_score INT, -- 0-100
    support_score INT, -- 0-100
    risk_level VARCHAR(50), -- HEALTHY, MONITOR, AT_RISK, CRITICAL
    trend VARCHAR(50), -- IMPROVING, STABLE, DECLINING
    last_calculated TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Indexes and Performance

### 5.1 Index Strategy

**Primary Indexes**:
- UUIDs as primary keys (always indexed)
- Unique constraints on natural keys (email, slug, code)

**Multi-Tenant Indexes**:
```sql
-- Pattern for most tables
CREATE INDEX idx_{table}_org ON {table}(organization_id);
CREATE INDEX idx_{table}_org_id ON {table}(organization_id, id);
CREATE INDEX idx_{table}_org_club ON {table}(organization_id, club_id);
```

**Query Optimization Indexes**:
```sql
-- Status queries
CREATE INDEX idx_members_status ON members(organization_id, status);
CREATE INDEX idx_subscriptions_status ON subscriptions(organization_id, status);

-- Date range queries
CREATE INDEX idx_sessions_start_time ON class_sessions(organization_id, start_time);
CREATE INDEX idx_invoices_due_date ON invoices(organization_id, due_date);

-- Foreign key lookups
CREATE INDEX idx_bookings_member ON class_bookings(organization_id, member_id);
CREATE INDEX idx_bookings_session ON class_bookings(session_id);
```

**Performance Considerations**:
- Composite indexes for common query patterns
- Index selectivity (high cardinality columns)
- Avoid over-indexing (impacts write performance)
- EXPLAIN ANALYZE for query optimization

### 5.2 Query Patterns

**Common Query Pattern 1: List with Filters**
```sql
-- Optimized with composite index
SELECT * FROM members
WHERE organization_id = ? AND status = 'ACTIVE'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- Index: idx_members_status (organization_id, status, created_at)
```

**Common Query Pattern 2: Tenant Isolation**
```sql
-- All queries automatically filtered by organization_id via Hibernate filter
SELECT * FROM class_sessions
WHERE organization_id = :current_org
  AND club_id = :current_club
  AND start_time >= CURRENT_DATE
ORDER BY start_time;
```

---

## 6. Database Migrations

### 6.1 Migration Tool: Flyway

**Migration Naming Convention**:
```
V{version}__{description}.sql
Examples:
  V1__initial_schema.sql
  V2__create_users_table.sql
  V61__create_security_compliance_tables.sql
  V72__create_membership_contracts.sql
```

**Migration Versioning**:
- Sequential version numbers (V1, V2, V3, ...)
- Never modify applied migrations
- Rollback via new migration (not ALTER)
- Database schema versioning tracked in `flyway_schema_history`

### 6.2 Key Migrations

| Migration | Description |
|-----------|-------------|
| V1-V9 | Initial core schema (orgs, clubs, members, plans, subscriptions) |
| V10 | Performance indexes |
| V11 | Audit logs |
| V12 | Notification enhancements |
| V13 | ShedLock for distributed job scheduling |
| V14 | File metadata storage |
| V15 | Rate limiting |
| V16-V18 | Platform/B2B tables |
| V19-V20 | Additional indexes, club slugs |
| V21-V24 | Agreements, health, freezes, wallets |
| V25-V29 | Trainers, plans enhancement, shop |
| V30-V40 | Class scheduling, bookings, facilities |
| V41-V50 | CRM, marketing, loyalty, referrals |
| V51-V60 | Wearables, equipment, vouchers, webhooks |
| V61-V62 | Security and compliance framework |
| V63-V68 | Platform enhancements (onboarding, health, alerts, dunning) |
| V69-V71 | Performance indexes, default plans |
| V72-V74 | Membership contracts, plan changes, cancellation flow |

### 6.3 Migration Best Practices

**DO**:
- Test migrations on development/staging first
- Use transactions (Flyway default)
- Create indexes concurrently in production (`CREATE INDEX CONCURRENTLY`)
- Add columns with defaults or NULL initially
- Backfill data in separate migration

**DON'T**:
- Modify applied migrations (breaks version control)
- Drop tables with data without backup
- Run DDL and DML in same transaction (some databases)
- Create indexes inline during large data loads

---

## Summary

Liyaqa's database schema provides:
- **Multi-tenant isolation** at organization and club levels
- **Comprehensive audit trail** with created/updated timestamps
- **Performance optimization** with strategic indexes
- **Data integrity** with foreign key constraints
- **Flexible schema evolution** via Flyway migrations
- **Scalability** with partitioning readiness
- **Compliance-ready** with soft deletes and audit logs

The schema supports 100K+ members, 1M+ transactions, and horizontal scaling as the platform grows.

---

*Last Updated: January 2026*
*Version: 1.0*
