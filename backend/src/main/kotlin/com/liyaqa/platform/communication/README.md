# Platform Communication Module

**Package:** `com.liyaqa.platform.communication`

## Purpose

Manages platform-to-tenant communications including announcements, system notifications, and broadcast messaging. Enables Liyaqa operators to communicate with all or selected tenants.

## Responsibilities

- Platform-wide announcements and maintenance notices
- Targeted notifications to specific tenants or tenant groups
- In-app notification center for platform dashboard
- Email broadcast campaigns to tenant admins
- Scheduled announcement publishing
- Communication templates and personalization
- Read/delivery tracking for announcements
- Notification preferences management

## Sub-packages

| Package | Purpose |
|---------|---------|
| `controller/` | REST API endpoints for announcements and notifications |
| `service/` | Business logic for communication delivery and scheduling |
| `repository/` | Data access layer for announcements, notifications persistence |
| `model/` | Domain entities (Announcement, PlatformNotification, Broadcast, etc.) |
| `dto/` | Request/response DTOs for communication API |
| `exception/` | Communication-specific exceptions |

## Related Modules

- `platform.tenant` — target tenants for communications
- `platform.support` — ticket update notifications
- `notification` — shared notification infrastructure (email, push, SMS)
