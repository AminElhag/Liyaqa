-- Organization, Club, and Location tables
-- V2: Create organization hierarchy tables

-- Organizations table (no tenant_id - top level entity)
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    trade_name_en VARCHAR(255),
    trade_name_ar VARCHAR(255),
    organization_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    -- Zatca compliance fields
    vat_registration_number VARCHAR(15),
    commercial_registration_number VARCHAR(20),
    -- Zatca address fields (localized)
    zatca_street_en VARCHAR(255),
    zatca_street_ar VARCHAR(255),
    zatca_building_en VARCHAR(255),
    zatca_building_ar VARCHAR(255),
    zatca_city_en VARCHAR(255),
    zatca_city_ar VARCHAR(255),
    zatca_district_en VARCHAR(255),
    zatca_district_ar VARCHAR(255),
    zatca_postal_code VARCHAR(20),
    zatca_country_code VARCHAR(2),
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- Clubs table (organization_id for hierarchy, id serves as tenant_id)
CREATE TABLE clubs (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_clubs_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX idx_clubs_organization_id ON clubs(organization_id);
CREATE INDEX idx_clubs_status ON clubs(status);

-- Locations table (tenant_id = club_id, organization_id for cross-club queries)
CREATE TABLE locations (
    id UUID PRIMARY KEY,
    club_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    -- Address fields (localized)
    street_en VARCHAR(255),
    street_ar VARCHAR(255),
    building_en VARCHAR(255),
    building_ar VARCHAR(255),
    city_en VARCHAR(255),
    city_ar VARCHAR(255),
    district_en VARCHAR(255),
    district_ar VARCHAR(255),
    postal_code VARCHAR(20),
    country_code VARCHAR(2),
    phone VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_locations_club FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE INDEX idx_locations_club_id ON locations(club_id);
CREATE INDEX idx_locations_tenant_id ON locations(tenant_id);
CREATE INDEX idx_locations_organization_id ON locations(organization_id);
CREATE INDEX idx_locations_status ON locations(status);