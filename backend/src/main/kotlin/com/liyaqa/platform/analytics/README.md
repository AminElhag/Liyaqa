# Platform Analytics Module

**Package:** `com.liyaqa.platform.analytics`

## Purpose

Provides KPI tracking, reporting, and business intelligence for the Liyaqa platform. Aggregates data across all tenants to give platform operators visibility into business performance.

## Responsibilities

- Platform-level KPI dashboard (MRR, ARR, churn rate, LTV)
- Tenant growth and adoption metrics
- Revenue analytics and forecasting
- Cohort analysis and retention tracking
- Feature usage analytics across tenants
- Custom report generation and export
- Scheduled report delivery
- Benchmark data across tenant segments

## Sub-packages

| Package | Purpose |
|---------|---------|
| `controller/` | REST API endpoints for analytics dashboards and reports |
| `service/` | Business logic for KPI calculation, aggregation, reporting |
| `repository/` | Data access layer for metrics, reports persistence |
| `model/` | Domain entities (KpiSnapshot, Report, MetricDefinition, etc.) |
| `dto/` | Request/response DTOs for analytics API |
| `exception/` | Analytics-specific exceptions |

## Related Modules

- `platform.subscription` — revenue and billing data
- `platform.tenant` — tenant growth metrics
- `platform.monitoring` — operational metrics
- `reporting` — shared reporting infrastructure
