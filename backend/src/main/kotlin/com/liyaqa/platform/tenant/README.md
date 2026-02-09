# Platform Tenant Module

**Package:** `com.liyaqa.platform.tenant`

## Purpose

Manages the full tenant (client/club) lifecycle within the Liyaqa SaaS platform. Handles provisioning, onboarding, suspension, reactivation, and offboarding of tenant organizations.

## Responsibilities

- Tenant provisioning and onboarding workflows
- Tenant status management (active, suspended, trial, churned)
- Tenant configuration and customization settings
- Database/schema provisioning per tenant
- Tenant metadata and branding
- Onboarding checklist and progress tracking
- Tenant deactivation and data retention policies

## Sub-packages

| Package | Purpose |
|---------|---------|
| `controller/` | REST API endpoints for tenant management |
| `service/` | Business logic for tenant lifecycle operations |
| `repository/` | Data access layer for tenant persistence |
| `model/` | Domain entities (Tenant, TenantStatus, etc.) |
| `dto/` | Request/response DTOs for API communication |
| `exception/` | Tenant-specific exceptions |

## Related Modules

- `platform.subscription` — billing tied to tenant lifecycle
- `platform.access` — tenant-scoped RBAC
- `platform.monitoring` — tenant health metrics
