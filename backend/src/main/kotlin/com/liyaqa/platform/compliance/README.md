# Platform Compliance Module

**Package:** `com.liyaqa.platform.compliance`

## Purpose

Manages regulatory compliance, contract management, and ZATCA (Saudi tax authority) monitoring for the Liyaqa platform. Ensures all tenants operate within Saudi Arabian legal and regulatory requirements.

## Responsibilities

- Client contract management and digital signing
- Contract renewal tracking and expiration alerts
- ZATCA e-invoicing compliance monitoring
- VAT registration and reporting
- Regulatory audit trail and documentation
- Compliance status dashboard per tenant
- Saudi labor law compliance tracking (for fitness industry)
- Data residency and privacy compliance (Saudi PDPL)
- Commercial registration (CR) verification

## Sub-packages

| Package | Purpose |
|---------|---------|
| `controller/` | REST API endpoints for compliance dashboards and contracts |
| `service/` | Business logic for compliance checks, ZATCA integration |
| `repository/` | Data access layer for contracts, compliance records persistence |
| `model/` | Domain entities (Contract, ComplianceCheck, ZatcaRecord, etc.) |
| `dto/` | Request/response DTOs for compliance API |
| `exception/` | Compliance-specific exceptions (ZatcaValidationException, etc.) |

## Related Modules

- `platform.subscription` — ZATCA-compliant invoicing
- `platform.tenant` — tenant compliance status
- `platform.monitoring` — compliance alert monitoring
- `compliance` — facility-level compliance module
