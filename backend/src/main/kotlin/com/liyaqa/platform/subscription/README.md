# Platform Subscription Module

**Package:** `com.liyaqa.platform.subscription`

## Purpose

Manages billing, subscription plans, invoicing, and payment processing for the Liyaqa SaaS platform. Handles the commercial relationship between Liyaqa and its tenant clients.

## Responsibilities

- Subscription plan definitions and pricing tiers
- Client subscription lifecycle (trial → active → renewal → cancellation)
- Invoice generation and payment tracking
- Dunning management (failed payment retries)
- Usage-based billing calculations
- Plan upgrades, downgrades, and proration
- Revenue reporting and MRR/ARR tracking
- ZATCA-compliant e-invoicing (Saudi Arabia)

## Sub-packages

| Package | Purpose |
|---------|---------|
| `controller/` | REST API endpoints for billing and subscriptions |
| `service/` | Business logic for billing operations |
| `repository/` | Data access layer for subscription/invoice persistence |
| `model/` | Domain entities (Subscription, Plan, Invoice, Payment, etc.) |
| `dto/` | Request/response DTOs for billing API |
| `exception/` | Billing-specific exceptions (PaymentFailedException, etc.) |

## Related Modules

- `platform.tenant` — subscriptions are tied to tenants
- `platform.compliance` — ZATCA invoice compliance
- `platform.analytics` — revenue KPIs
