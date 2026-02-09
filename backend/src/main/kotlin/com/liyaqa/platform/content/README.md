# Platform Content Module

**Package:** `com.liyaqa.platform.content`

## Purpose

Manages the knowledge base, document templates, and reusable content for the Liyaqa platform. Provides self-service resources for tenants and internal documentation for platform operators.

## Responsibilities

- Knowledge base articles and categories
- FAQ management
- Document templates (contracts, invoices, onboarding guides)
- Template versioning and localization (Arabic/English)
- Content search and tagging
- Article view tracking and helpfulness ratings
- Content approval workflows
- Markdown/rich text content rendering

## Sub-packages

| Package | Purpose |
|---------|---------|
| `controller/` | REST API endpoints for knowledge base and templates |
| `service/` | Business logic for content management and search |
| `repository/` | Data access layer for articles, templates persistence |
| `model/` | Domain entities (Article, Template, Category, Tag, etc.) |
| `dto/` | Request/response DTOs for content API |
| `exception/` | Content-specific exceptions |

## Related Modules

- `platform.support` — link KB articles to support tickets
- `platform.communication` — use templates for announcements
- `platform.tenant` — tenant onboarding content
