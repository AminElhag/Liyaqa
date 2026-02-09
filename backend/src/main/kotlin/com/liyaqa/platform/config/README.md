# Platform Config Module

**Package:** `com.liyaqa.platform.config`

## Purpose

Manages feature flags, global platform settings, and tenant-level configuration overrides. Provides centralized control over platform behavior and feature rollouts.

## Responsibilities

- Global platform settings management
- Feature flag definitions and tenant-level toggles
- Gradual feature rollout (percentage-based, tenant-group-based)
- Tenant configuration overrides and defaults
- Environment-specific settings (dev, staging, production)
- Configuration change audit trail
- A/B testing configuration
- Rate limit and quota configuration per plan tier

## Sub-packages

| Package | Purpose |
|---------|---------|
| `controller/` | REST API endpoints for settings and feature flag management |
| `service/` | Business logic for configuration resolution and feature flags |
| `repository/` | Data access layer for settings, feature flags persistence |
| `model/` | Domain entities (FeatureFlag, GlobalSetting, ConfigOverride, etc.) |
| `dto/` | Request/response DTOs for config API |
| `exception/` | Config-specific exceptions |

## Related Modules

- `platform.tenant` — tenant-scoped configuration
- `platform.subscription` — plan-based feature gating
- `platform.monitoring` — config change audit logging
