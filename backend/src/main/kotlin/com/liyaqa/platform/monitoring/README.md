# Platform Monitoring Module

**Package:** `com.liyaqa.platform.monitoring`

## Purpose

Provides health monitoring, audit logging, and operational visibility for the Liyaqa platform. Enables platform operators to monitor tenant health, track system events, and investigate issues.

## Responsibilities

- Tenant health score calculation and tracking
- System health checks and uptime monitoring
- Audit log collection and querying
- Platform event logging (login, config changes, impersonation)
- Error rate and performance monitoring per tenant
- Alert rules and notification triggers
- Log aggregation and search
- Resource usage tracking (storage, API calls, users)

## Sub-packages

| Package | Purpose |
|---------|---------|
| `controller/` | REST API endpoints for monitoring dashboards and audit logs |
| `service/` | Business logic for health scoring, alerting, audit queries |
| `repository/` | Data access layer for audit logs, health metrics persistence |
| `model/` | Domain entities (AuditLog, HealthScore, Alert, SystemEvent, etc.) |
| `dto/` | Request/response DTOs for monitoring API |
| `exception/` | Monitoring-specific exceptions |

## Related Modules

- `platform.tenant` — per-tenant health monitoring
- `platform.access` — audit trail for access events
- `platform.analytics` — operational metrics feed into analytics
- `shared.infrastructure.audit` — shared audit infrastructure
