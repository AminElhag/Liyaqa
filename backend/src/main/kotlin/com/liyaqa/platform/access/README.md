# Platform Access Module

**Package:** `com.liyaqa.platform.access`

## Purpose

Manages platform-level role-based access control (RBAC) and admin impersonation capabilities. Controls who can do what within the Liyaqa platform dashboard.

## Responsibilities

- Platform user roles and permissions (Super Admin, Support Agent, Sales, etc.)
- Role-based access control for platform features
- Admin impersonation of tenant accounts (for debugging/support)
- Impersonation audit logging
- API key management for platform integrations
- Session management and security policies
- Two-factor authentication enforcement

## Sub-packages

| Package | Purpose |
|---------|---------|
| `controller/` | REST API endpoints for access control and impersonation |
| `service/` | Business logic for RBAC and impersonation |
| `repository/` | Data access layer for roles, permissions persistence |
| `model/` | Domain entities (PlatformRole, Permission, ImpersonationSession, etc.) |
| `dto/` | Request/response DTOs for access management API |
| `exception/` | Access-specific exceptions (UnauthorizedImpersonationException, etc.) |

## Related Modules

- `platform.monitoring` — audit logs for access events
- `platform.tenant` — tenant-scoped impersonation
- `shared.infrastructure.security` — JWT and authentication infrastructure
