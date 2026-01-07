# Organization Module Documentation

## Overview

The Organization module implements a hierarchical multi-tenant structure for gym/fitness club management. It supports:
- **Organizations** - Top-level business entities (gym chains, fitness companies)
- **Clubs** - Individual gym brands under an organization
- **Locations** - Physical branches/locations of a club

## Architecture

### Entity Hierarchy

```
Organization (Fitness Corp Holdings)
├── Club A (PowerFit Gym)
│   ├── Location: PowerFit Riyadh
│   ├── Location: PowerFit Jeddah
│   └── Location: PowerFit Dammam
└── Club B (Elite Fitness)
    ├── Location: Elite Downtown
    └── Location: Elite Mall
```

### Data Visibility Rules

| Level | Can See | Cannot See |
|-------|---------|------------|
| Organization | All clubs, all locations | - |
| Club | Own locations only | Other clubs, their locations |
| Location | Own data only | Other locations |

### Tenancy Model

- **Club.id = tenant_id** for all data under that club
- **Organization as super-tenant** can query across all its clubs
- Uses Hibernate `@Filter` annotations for automatic data isolation

---

## Entities

### Organization

**Table:** `organizations`

**Purpose:** Top-level business entity that owns clubs.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| name_en | String | Yes | Legal name (English) |
| name_ar | String | No | Legal name (Arabic) |
| trade_name_en | String | No | Brand name (English) |
| trade_name_ar | String | No | Brand name (Arabic) |
| organization_type | Enum | Yes | LLC, SOLE_PROPRIETORSHIP, PARTNERSHIP, CORPORATION, OTHER |
| status | Enum | Yes | PENDING, ACTIVE, SUSPENDED, CLOSED |
| email | String | No | Contact email |
| phone | String | No | Contact phone |
| website | String | No | Website URL |
| vat_registration_number | String | No | Zatca VAT number (15 digits) |
| commercial_registration_number | String | No | CR number |
| zatca_* | Various | No | Zatca address fields |

**Status Transitions:**
```
PENDING → ACTIVE
ACTIVE → SUSPENDED
SUSPENDED → ACTIVE
ANY → CLOSED (terminal)
```

### Club

**Table:** `clubs`

**Purpose:** A gym brand owned by an organization. Acts as the tenant for data isolation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key (also serves as tenant_id) |
| organization_id | UUID | Yes | FK to organizations |
| name_en | String | Yes | Club name (English) |
| name_ar | String | No | Club name (Arabic) |
| description_en | String | No | Description (English) |
| description_ar | String | No | Description (Arabic) |
| status | Enum | Yes | ACTIVE, SUSPENDED, CLOSED |

**Status Transitions:**
```
ACTIVE ↔ SUSPENDED
ANY → CLOSED (terminal)
```

### Location

**Table:** `locations`

**Purpose:** Physical branch/location of a club.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| club_id | UUID | Yes | FK to clubs |
| tenant_id | UUID | Yes | Same as club_id (for filtering) |
| organization_id | UUID | Yes | For organization-level queries |
| name_en | String | Yes | Location name (English) |
| name_ar | String | No | Location name (Arabic) |
| street_en/ar | String | No | Street address |
| building_en/ar | String | No | Building name/number |
| city_en/ar | String | No | City |
| district_en/ar | String | No | District/neighborhood |
| postal_code | String | No | Postal code |
| country_code | String | No | ISO 3166-1 alpha-2 |
| phone | String | No | Contact phone |
| email | String | No | Contact email |
| status | Enum | Yes | ACTIVE, TEMPORARILY_CLOSED, PERMANENTLY_CLOSED |

**Status Transitions:**
```
ACTIVE ↔ TEMPORARILY_CLOSED
ANY → PERMANENTLY_CLOSED (terminal)
```

---

## API Endpoints

### Organization Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/organizations` | Create organization |
| GET | `/api/organizations/{id}` | Get organization by ID |
| GET | `/api/organizations` | List all organizations (paginated) |
| PUT | `/api/organizations/{id}` | Update organization |
| POST | `/api/organizations/{id}/activate` | Activate organization |
| POST | `/api/organizations/{id}/suspend` | Suspend organization |
| POST | `/api/organizations/{id}/close` | Close organization |

### Club Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clubs` | Create club |
| GET | `/api/clubs/{id}` | Get club by ID |
| GET | `/api/clubs/organization/{orgId}` | List clubs by organization |
| PUT | `/api/clubs/{id}` | Update club |
| POST | `/api/clubs/{id}/activate` | Activate club |
| POST | `/api/clubs/{id}/suspend` | Suspend club |
| POST | `/api/clubs/{id}/close` | Close club |

### Location Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/locations` | Create location |
| GET | `/api/locations/{id}` | Get location by ID |
| GET | `/api/locations` | List all locations (tenant-scoped) |
| GET | `/api/locations/club/{clubId}` | List locations by club |
| GET | `/api/locations/organization/{orgId}` | List locations by organization |
| PUT | `/api/locations/{id}` | Update location |
| POST | `/api/locations/{id}/temporarily-close` | Temporarily close |
| POST | `/api/locations/{id}/reopen` | Reopen location |
| POST | `/api/locations/{id}/permanently-close` | Permanently close |

---

## Request/Response Examples

### Create Organization

**Request:**
```http
POST /api/organizations
Content-Type: application/json

{
    "nameEn": "Fitness Corp Holdings",
    "nameAr": "شركة فتنس كورب القابضة",
    "tradeNameEn": "FitCorp",
    "tradeNameAr": "فت كورب",
    "organizationType": "LLC",
    "email": "info@fitcorp.com",
    "phone": "+966501234567",
    "website": "https://fitcorp.com",
    "vatRegistrationNumber": "300012345600003",
    "commercialRegistrationNumber": "1010123456"
}
```

**Response:**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": {
        "en": "Fitness Corp Holdings",
        "ar": "شركة فتنس كورب القابضة"
    },
    "tradeName": {
        "en": "FitCorp",
        "ar": "فت كورب"
    },
    "organizationType": "LLC",
    "status": "PENDING",
    "email": "info@fitcorp.com",
    "phone": "+966501234567",
    "website": "https://fitcorp.com",
    "zatcaEnabled": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Create Club

**Request:**
```http
POST /api/clubs
Content-Type: application/json

{
    "organizationId": "550e8400-e29b-41d4-a716-446655440000",
    "nameEn": "PowerFit Gym",
    "nameAr": "صالة باور فت",
    "descriptionEn": "Premium fitness center chain",
    "descriptionAr": "سلسلة مراكز لياقة بدنية متميزة"
}
```

### Create Location

**Request:**
```http
POST /api/locations
Content-Type: application/json

{
    "clubId": "660e8400-e29b-41d4-a716-446655440001",
    "nameEn": "PowerFit Riyadh Central",
    "nameAr": "باور فت الرياض سنترال",
    "streetEn": "King Fahd Road",
    "streetAr": "طريق الملك فهد",
    "cityEn": "Riyadh",
    "cityAr": "الرياض",
    "districtEn": "Al Olaya",
    "districtAr": "العليا",
    "postalCode": "12211",
    "countryCode": "SA",
    "phone": "+966112345678",
    "email": "riyadh@powerfit.com"
}
```

---

## Zatca Integration

The organization entity includes fields required for Zatca (Saudi Tax Authority) e-invoicing compliance:

| Field | Description | Format |
|-------|-------------|--------|
| vatRegistrationNumber | VAT number | 15 digits (3XXXXXXXXXX00003) |
| commercialRegistrationNumber | CR number | Ministry of Commerce issued |
| zatcaAddress | Business address | Full localized address |

**Note:** These fields are optional. They become required when Zatca e-invoicing integration is enabled.

---

## File Structure

```
organization/
├── domain/
│   ├── model/
│   │   ├── OrganizationEnums.kt      # Status and type enums
│   │   ├── ZatcaInfo.kt              # Zatca compliance embeddable
│   │   ├── Organization.kt           # Organization entity
│   │   ├── Club.kt                   # Club entity
│   │   └── Location.kt               # Location entity
│   └── ports/
│       ├── OrganizationRepository.kt # Organization port
│       ├── ClubRepository.kt         # Club port
│       └── LocationRepository.kt     # Location port
├── infrastructure/
│   └── persistence/
│       ├── JpaOrganizationRepository.kt
│       ├── JpaClubRepository.kt
│       └── JpaLocationRepository.kt
├── application/
│   ├── commands/
│   │   └── OrganizationCommands.kt   # Command objects
│   └── services/
│       ├── OrganizationService.kt
│       ├── ClubService.kt
│       └── LocationService.kt
└── api/
    ├── OrganizationDto.kt            # DTOs
    ├── OrganizationController.kt
    ├── ClubController.kt
    └── LocationController.kt
```

---

## Database Migration

**File:** `V2__create_organization_tables.sql`

Creates:
- `organizations` table
- `clubs` table with FK to organizations
- `locations` table with FK to clubs
- Indexes on foreign keys and status columns

---

## Usage Examples

### Setting Up Organization Context

```kotlin
// In TenantInterceptor or manually
TenantContext.setCurrentOrganization(OrganizationId.fromString("org-uuid"))
TenantContext.setCurrentTenant(TenantId.fromString("club-uuid"))

// For super-tenant (organization-level) queries
TenantContext.enableSuperTenantMode()
```

### Creating Entities Programmatically

```kotlin
// Create organization
val org = organizationService.createOrganization(
    CreateOrganizationCommand(
        name = LocalizedText("My Gym", "صالتي الرياضية"),
        organizationType = OrganizationType.LLC
    )
)

// Create club under organization
val club = clubService.createClub(
    CreateClubCommand(
        organizationId = org.id,
        name = LocalizedText("Club One", "النادي الأول")
    )
)

// Create location under club
val location = locationService.createLocation(
    CreateLocationCommand(
        clubId = club.id,
        name = LocalizedText("Main Branch", "الفرع الرئيسي"),
        address = LocalizedAddress(
            city = LocalizedText("Riyadh", "الرياض")
        )
    )
)
```