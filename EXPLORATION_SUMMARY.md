# Liyaqa Backend Exploration - Complete Summary

## Overview

I have completed a comprehensive exploration of the liyaqa-backend project and created two detailed architecture guides for your reference.

## Files Created

1. **LIYAQA_BACKEND_ARCHITECTURE_OVERVIEW.md** (1,255 lines, 40 KB)
   - Complete architectural analysis of the backend
   - Project structure with detailed explanations
   - Architecture patterns and design decisions
   - Security model and authentication layers
   - Database patterns and migrations
   - Configuration and environment setup
   - API architecture and patterns
   - Technology stack details
   - Development workflow and git practices

2. **FRONTEND_ARCHITECTURE_PATTERNS.md** (845 lines, 22 KB)
   - How to replicate backend patterns in frontend
   - Feature-based organization structure
   - Type safety patterns mirroring backend
   - API layer implementation
   - State management with Zustand
   - Custom hooks for business logic
   - Permission system and guards
   - Multi-tenancy support
   - Error handling strategies
   - Form validation patterns

## Key Findings

### Backend Architecture Overview

**Technology Stack:**
- Language: Kotlin (modern, null-safe)
- Framework: Spring Boot 3.5.7
- JDK: 21
- Build Tool: Gradle Kotlin DSL
- Database: PostgreSQL with Liquibase migrations
- Cache/Session: Redis
- Security: JWT + Spring Security with fine-grained RBAC

**Architecture Style:**
- **Feature-Based Organization** (NOT Layer-Based) - Critical difference
- Multi-tenancy with Row-Level Isolation (DISCRIMINATOR strategy)
- Domain-Driven Design with rich domain models
- Comprehensive audit logging (async batch processing)
- Enterprise-grade security with zero-trust approach

### Project Structure (Core Modules)

```
backend/
├── core/                  # Foundation (BaseEntity, TenantContext, configs)
├── internal/              # Internal control plane (Liyaqa team)
│   ├── employee/         # Internal employee management + RBAC
│   ├── tenant/           # Customer organization management
│   ├── facility/         # Sport facility management (internal)
│   ├── auth/             # Internal authentication
│   ├── audit/            # Comprehensive audit logging
│   └── shared/           # Cross-cutting concerns
├── facility/             # Tenant-facing features
│   ├── employee/         # Facility staff (separate from internal)
│   ├── booking/          # Court/facility booking system
│   ├── membership/       # Member + plan management
│   ├── trainer/          # Personal trainer booking system
│   └── auth/             # Member authentication
├── api/                  # Public API (external integrations)
├── payment/              # Payment processing (Stripe)
└── shared/               # Cross-tenant features (notifications, analytics)
```

### Critical Architecture Patterns

1. **Feature-Based Organization**
   - Each feature contains: domain, data, service, controller, dto
   - Self-contained modules
   - Easier to understand, onboard, and extract

2. **DTO Mapping with Companion Objects**
   - DTOs know how to create themselves
   - Type-safe, testable, chainable
   - Extension functions for convenience

3. **Service Layer with Comprehensive Audit**
   - Single responsibility per method
   - All state changes audited (immutable audit trail)
   - Error handling with custom exceptions
   - Transactional by default

4. **Rich Repository Queries**
   - JPQL for readability
   - Security-aware queries
   - Pagination support built-in
   - Named parameters for SQL injection prevention

5. **Method-Level Security**
   - @RequirePermission annotation
   - @CurrentEmployee for injecting authenticated user
   - Proper HTTP status codes
   - Pagination with sensible defaults

6. **Multi-Tenancy Architecture**
   - All entities extend BaseEntity (includes tenantId)
   - TenantContext for thread-local tenant isolation
   - Discriminator strategy (can evolve to schema-per-tenant)

7. **Async Audit Service**
   - Batch writes for performance (1000-5000 logs/sec)
   - Graceful degradation to sync if queue fills
   - At-least-once delivery guarantee
   - Queue capacity enforcement

### Security Implementation

**Three Authentication Layers:**

1. **Internal Team (JWT-Based)**
   - JwtAuthenticationFilter → SecurityConfig → JwtTokenProvider
   - Employee entity with permission groups
   - 40+ fine-grained permissions
   - Account lockout after 5 failed attempts
   - 30-minute lockout duration

2. **Facility Employees (Separate)**
   - FacilityAuthenticationService
   - FacilityPermission enum
   - Scoped to their facility

3. **Public API (Bearer Token)**
   - ApiKeyAuthenticationFilter
   - BCrypt hashed API keys
   - Scope-based permissions
   - Rate limiting per key
   - TEST vs LIVE environments

**Permission Model:**
- 40+ permissions in Permission enum
- Group-based assignment (Super Admin, Support Agent, etc.)
- Permission checks at service layer (not just controllers)
- Auditlogging of unauthorized access attempts

### Database Patterns

**Liquibase Migrations:**
- All schema changes through migrations
- UUID primary keys auto-generated
- Indexes on tenant_id, foreign keys, frequently queried columns
- Version column for optimistic locking

**Entity Conventions:**
- All extend BaseEntity
- LAZY loading by default (prevents N+1)
- Enums stored as strings
- Soft delete support for some entities
- Timestamp management with Spring Data

### Configuration

**Environment Variables:**
- Database (PostgreSQL): DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD
- Redis: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- JWT: JWT_SECRET (min 64 chars in production)
- Email: MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD
- Stripe: STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET
- Application: SPRING_PROFILES_ACTIVE, APP_BASE_URL, SESSION_TIMEOUT_HOURS
- Audit: AUDIT_CORE_POOL_SIZE, AUDIT_MAX_POOL_SIZE, AUDIT_BATCH_SIZE

### Recent Features (PRs #16, #17)

**PR #16: Public API v1**
- External integration platform with API keys
- Scoped permissions (facilities:read, bookings:write, etc.)
- Rate limiting and usage tracking
- BCrypt hashed keys (only shown once)
- TEST and LIVE environments

**PR #17: Personal Trainer Booking System**
- Trainer profiles with certifications and pricing
- Availability management (recurring + one-time blocks)
- Trainer booking lifecycle with status tracking
- Review system (1-5 stars with multiple dimensions)
- Conflict detection to prevent double-booking
- Dynamic pricing based on duration

## Frontend Pattern Recommendations

The FRONTEND_ARCHITECTURE_PATTERNS.md document provides detailed guidance on:

1. **Feature-Based Directory Structure**
   ```
   features/
   ├── employees/
   │   ├── api/
   │   ├── components/
   │   ├── hooks/
   │   ├── store/
   │   ├── types/
   │   └── utils/
   ```

2. **Type Safety**
   - Mirror backend domain models exactly
   - Permission enum matching backend
   - DTO validation with Zod

3. **State Management (Zustand)**
   - Feature slices with immer middleware
   - Loading, error, and data states
   - Async actions for API calls

4. **Custom Hooks**
   - Business logic in hooks
   - Permission checking in hooks
   - UI-agnostic hooks

5. **Permission Guards**
   - React components checking permissions
   - Declarative permission checks
   - Fallback UI support

6. **Multi-Tenancy**
   - Zustand tenant store
   - useTenant hook for tenant context
   - Tenant ID included in API calls

7. **Error Handling**
   - Custom error classes
   - API error mapping
   - Consistent error handling

8. **Form Validation**
   - Zod schemas mirroring backend
   - React Hook Form integration
   - Client-side validation

## Critical Rules to Follow

When developing in/with this backend, ALWAYS:

1. **Maintain Feature-Based Structure**
   - Each feature owns its domain, service, controller, dto
   - Don't reorganize into layers

2. **Check Permissions in Service Layer**
   - Not just controllers
   - Use @RequirePermission annotation
   - Audit unauthorized access

3. **Preserve Multi-Tenancy**
   - All entities extend BaseEntity
   - Always consider tenant isolation
   - Use TenantContext for thread-local access

4. **Only Use Liquibase for Schema Changes**
   - Create XML changeset files
   - Reference in db.changelog-master.xml
   - Run ./gradlew update to apply

5. **Use LAZY Loading by Default**
   - Prevents N+1 query problems
   - Only use EAGER when necessary
   - Explicit about intent

6. **Audit All State Changes**
   - EVERY creation, update, delete
   - Use AuditService for consistency
   - Compliance requirement, not optional

7. **Never Commit Directly to Main**
   - Always create feature branches
   - Use conventional commits
   - Include tests with changes
   - Clean, comprehensive PRs

## Git Information

**Repository Structure:**
- .git directory present (git initialized)
- .gitignore configured (excludes .env, build artifacts, IDE files)
- .gitattributes configured
- Working directory: /Users/waraiotoko/Liyaqa/liyaqa-backend

**Recent Commits:**
- Regular development activity
- CLAUDE.md for AI-assisted development
- Multiple documentation files (README.md, FACILITY_MANAGEMENT.md, etc.)

## Build & Development

**Build Tool:** Gradle Kotlin DSL
- `./gradlew build` - Build and compile
- `./gradlew bootRun` - Run application
- `./gradlew test` - Run tests
- `./gradlew update` - Apply Liquibase migrations

**Local Development Setup:**
```bash
docker-compose up -d          # PostgreSQL + Redis
./gradlew update              # Apply migrations
./gradlew bootRun             # Start backend
# API available at http://localhost:8080
```

**Ports:**
- Backend: 8080
- PostgreSQL: 5434 (not standard 5432)
- Redis: 6379

## Performance Characteristics

- **API Response Time:** P95 < 200ms
- **Audit Throughput:** 1000-5000 logs/second
- **Database Connections:** 10 max, 5 min idle
- **Redis Pool:** 8 max active, 2 min idle
- **Session Timeout:** 8 hours (configurable)

## Next Steps for Frontend

1. Create feature-based directory structure mirroring backend
2. Generate TypeScript types from backend API (consider OpenAPI)
3. Implement permission system matching backend
4. Set up Zustand stores with feature slices
5. Build shared components (PermissionGuard, Layout, etc.)
6. Implement authentication flow
7. Add API layer with proper error handling
8. Create custom hooks for each feature
9. Test multi-tenancy support
10. Document API integration patterns

## Questions Answered

The documentation answers these key questions:

1. **How is the project organized?** - Feature-based, not layer-based
2. **What are the key architectural patterns?** - Domain-driven design with rich models
3. **How is security implemented?** - JWT + Spring Security with fine-grained RBAC
4. **How is multi-tenancy handled?** - Row-level isolation with TenantContext
5. **How is audit logging implemented?** - Async batch processing with immutable trail
6. **What's the database strategy?** - PostgreSQL with Liquibase migrations
7. **How should the frontend be structured?** - Mirror backend patterns with React idioms
8. **What permission system exists?** - 40+ permissions with group-based assignment
9. **How are DTOs mapped?** - Companion objects in Kotlin, factory functions in TypeScript
10. **What git workflow is used?** - Feature branches with conventional commits

## Comprehensive Documentation Location

Both files are available at:
- `/Users/waraiotoko/Liyaqa/LIYAQA_BACKEND_ARCHITECTURE_OVERVIEW.md` (40 KB)
- `/Users/waraiotoko/Liyaqa/FRONTEND_ARCHITECTURE_PATTERNS.md` (22 KB)

Use these as your reference when building the frontend application and implementing features that interact with the backend.
