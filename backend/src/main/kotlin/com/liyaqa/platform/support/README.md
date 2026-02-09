# Platform Support Module

**Package:** `com.liyaqa.platform.support`

## Purpose

Provides a ticketing system for managing support requests from tenant clients. Enables platform operators to track, prioritize, and resolve client issues.

## Responsibilities

- Support ticket creation, assignment, and resolution
- Ticket categorization and priority management
- SLA tracking and escalation rules
- Internal notes and communication threads
- Ticket analytics (response time, resolution time, satisfaction)
- Knowledge base article linking
- Automated ticket routing based on category/priority

## Sub-packages

| Package | Purpose |
|---------|---------|
| `controller/` | REST API endpoints for support ticket operations |
| `service/` | Business logic for ticket lifecycle management |
| `repository/` | Data access layer for ticket persistence |
| `model/` | Domain entities (SupportTicket, TicketComment, TicketCategory, etc.) |
| `dto/` | Request/response DTOs for support API |
| `exception/` | Support-specific exceptions |

## Related Modules

- `platform.tenant` — tickets are tied to tenants
- `platform.communication` — notifications on ticket updates
- `platform.content` — knowledge base for self-service
