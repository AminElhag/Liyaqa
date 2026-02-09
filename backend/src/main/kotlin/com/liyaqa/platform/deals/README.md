# Platform Deals Module

**Package:** `com.liyaqa.platform.deals`

## Purpose

Manages the CRM and sales deal pipeline for the Liyaqa platform. Tracks prospective tenant acquisition from lead to closed deal, supporting the sales team workflow.

## Responsibilities

- Deal/opportunity pipeline management
- Pipeline stage tracking (Lead → Qualified → Proposal → Negotiation → Closed)
- Contact and company information management
- Deal value and revenue forecasting
- Sales activity logging (calls, emails, meetings)
- Win/loss analysis and conversion metrics
- Deal assignment to sales team members
- Automated follow-up reminders
- Integration with tenant onboarding (deal → tenant conversion)

## Sub-packages

| Package | Purpose |
|---------|---------|
| `controller/` | REST API endpoints for deal pipeline management |
| `service/` | Business logic for deal lifecycle and pipeline operations |
| `repository/` | Data access layer for deals, contacts persistence |
| `model/` | Domain entities (Deal, Contact, PipelineStage, Activity, etc.) |
| `dto/` | Request/response DTOs for deals API |
| `exception/` | Deals-specific exceptions |

## Related Modules

- `platform.tenant` — deal-to-tenant conversion
- `platform.analytics` — sales funnel KPIs
- `platform.communication` — sales outreach
- `crm` — facility-level CRM module
