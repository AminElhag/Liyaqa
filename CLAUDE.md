# Liyaqa Development Guide

## Demo Environment

For running the demo environment with Docker, see **[DEMO_ENVIRONMENT.md](./DEMO_ENVIRONMENT.md)**

**Quick Login:**
- URL: http://localhost:3000/en/login (or port 3003)
- Email: `admin@demo.com`
- Password: `Test1234`
- Tenant ID: `22222222-2222-2222-2222-222222222222`

---

## Language Requirements
**All code must support Arabic and English.** Use `LocalizedText` for user-facing text:
```kotlin
@Embedded
@AttributeOverrides(
    AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
    AttributeOverride(name = "ar", column = Column(name = "name_ar"))
)
var name: LocalizedText
```

---

## Architecture Overview

**Tech Stack:** Spring Boot 4.0.1 | Kotlin 2.2 | PostgreSQL + Flyway | DDD + Hexagonal

**Backend Structure:** `src/main/kotlin/com/liyaqa/`
- `config/` - Spring configurations, security, rate limiting
- `shared/` - Value objects, base entities, cross-cutting concerns
- `auth/` - JWT authentication, users, roles
- `organization/` - Organization → Club → Location hierarchy
- `membership/` - Members, plans, subscriptions
- `attendance/` - Check-in/check-out, QR codes
- `billing/` - Invoices, payments, PDF generation
- `scheduling/` - Classes, sessions, bookings
- `notification/` - Email, SMS, preferences, scheduled jobs

Each module follows: `domain/model`, `domain/ports`, `infrastructure/persistence`, `application/services`, `api/`

### Multi-Tenancy Model
```
Organization (super-tenant)
├── Club A (tenant_id) ──── Data isolated per club
│   ├── Location A-X
│   └── Location A-Y
└── Club B (tenant_id)
    └── Location B-1
```

| Base Class | Use Case | tenant_id | organization_id |
|------------|----------|-----------|-----------------|
| `OrganizationLevelEntity` | Top-level (Organization) | No | No |
| `BaseEntity` | Standard tenant-scoped | Yes | No |
| `OrganizationAwareEntity` | Cross-club queries | Yes | Yes |

**Headers:** `X-Tenant-ID` (Club UUID), `X-Organization-ID`, `X-Super-Tenant: true`

---

## Coding Patterns

### Entity with Tenant Filter
```kotlin
@Entity @Table(name = "my_entities")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MyEntity(
    id: UUID = UUID.randomUUID(),
    @Embedded var name: LocalizedText,
    @Enumerated(EnumType.STRING) var status: MyStatus = MyStatus.ACTIVE
) : BaseEntity(id)
```

### Repository Pattern (Port + Adapter)
```kotlin
// Port (domain/ports)
interface MyEntityRepository {
    fun save(entity: MyEntity): MyEntity
    fun findById(id: UUID): Optional<MyEntity>
}

// Adapter (infrastructure/persistence)
@Repository
class JpaMyEntityRepository(private val springData: SpringDataMyEntityRepository) : MyEntityRepository {
    override fun save(entity: MyEntity) = springData.save(entity)
    override fun findById(id: UUID) = springData.findById(id)
}
```

### Service + Controller
```kotlin
@Service @Transactional
class MyEntityService(private val repository: MyEntityRepository) {
    fun create(command: CreateCommand) = repository.save(MyEntity(name = command.name))
    @Transactional(readOnly = true)
    fun getById(id: UUID) = repository.findById(id).orElseThrow { NoSuchElementException("Not found: $id") }
}

@RestController @RequestMapping("/api/my-entities")
class MyEntityController(private val service: MyEntityService) {
    @PostMapping
    fun create(@Valid @RequestBody req: CreateRequest) = ResponseEntity.status(HttpStatus.CREATED).body(Response.from(service.create(req.toCommand())))
}
```

---

## Git Workflow

**Remote:** https://github.com/AminElhag/Liyaqa.git | **Main:** `main`

| Branch Type | Pattern | Commit Types |
|-------------|---------|--------------|
| Feature | `features/{name}` | `Add`, `Update`, `Fix`, `Remove`, `Refactor`, `Docs` |
| Bug fix | `fixes/{name}` | |
| Hotfix | `hotfixes/{name}` | |

---

## Testing Guidelines

- Use `@SpringBootTest @ActiveProfiles("test") @Transactional`
- H2 database, SMS/email disabled in test profile
- `passwordEncoder.encode()` returns nullable - add `!!`
- Use `"test.${UUID.randomUUID()}@example.com"` for unique emails
- Set tenant in `@BeforeEach`: `TenantContext.setCurrentTenant(TenantId(testTenantId))`
- Clear in `@AfterEach`: `TenantContext.clear()`
- **Run tests:** `./gradlew test` (250+ tests)

---

## Implemented Modules

| Module | Endpoints | Key Features |
|--------|-----------|--------------|
| **Auth** | `/api/auth/*`, `/api/users/*` | JWT + refresh tokens, roles (SUPER_ADMIN, CLUB_ADMIN, STAFF, MEMBER), password reset |
| **Organization** | `/api/organizations`, `/api/clubs`, `/api/locations` | CRUD with status transitions (PENDING → ACTIVE → SUSPENDED → CLOSED), Zatca fields |
| **Membership** | `/api/members/*`, `/api/membership-plans/*`, `/api/subscriptions/*` | Search/filter, subscription lifecycle (freeze/unfreeze/cancel/renew), bulk ops |
| **Attendance** | `/api/members/{id}/check-in`, `/api/attendance/*` | Check-in methods (MANUAL, QR_CODE, CARD, BIOMETRIC), auto-deduct, bulk ops |
| **Billing** | `/api/invoices/*`, `/api/payments/*` | Invoice lifecycle (DRAFT → ISSUED → PAID/OVERDUE), 15% VAT, bilingual PDF, PayTabs |
| **Scheduling** | `/api/classes/*`, `/api/sessions/*`, `/api/bookings/*` | Recurring schedules, waitlist, no-show processing, bulk ops |
| **Notification** | `/api/notifications/*` | EMAIL, SMS, PUSH, IN_APP channels, member preferences, deduplication |
| **Dashboard** | `/api/dashboard/*` | Summary stats, today's attendance, expiring subscriptions |
| **Export** | `/api/exports/*` | CSV export (members, invoices, attendance), bilingual headers, max 10K rows |
| **Mobile** | `/api/mobile/*`, `/api/me/*`, `/api/qr/*` | Lite DTOs (55-65% smaller), self-service, QR check-in |
| **Files** | `/api/files/*` | Upload/download, categories (MEMBER_PROFILE, INVOICE_RECEIPT, etc.), owner verification |

---

## Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `processExpiredSubscriptions` | Daily 1 AM | Expire past-due subscriptions |
| `processOverdueInvoices` | Daily 2 AM | Mark invoices as overdue |
| `autoCheckoutAttendance` | Daily midnight | Auto-checkout all members |
| `cleanupExpiredTokens` | Daily 3 AM | Remove expired reset tokens |
| `processPendingNotifications` | Every 5 min | Send due notifications |
| `sendSubscriptionExpiring*` | Daily 9 AM | 7/3/1 day expiry reminders |
| `sendClassReminder*` | Hourly/15 min | 24h/1h class reminders |
| `processNoShows` | Every 30 min | Mark no-shows |

All jobs use `@SchedulerLock` (ShedLock) for distributed locking.

---

## Rate Limiting

| Tier | Requests/Min | Applies To |
|------|--------------|------------|
| AUTH_LOGIN | 5 | `/api/auth/login` |
| AUTH_REGISTER | 3 | `/api/auth/register` |
| RESOURCE_INTENSIVE | 10 | PDF, exports |
| WRITE | 30 | POST, PUT, DELETE |
| READ | 100 | GET |

**Role multipliers:** SUPER_ADMIN (3x), CLUB_ADMIN (2x), STAFF (1.5x), MEMBER (1x)

---

## Configuration

### Core Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | JWT signing key (32+ chars) | Dev key |
| `DATABASE_URL` | PostgreSQL JDBC URL | H2 |
| `CORS_ALLOWED_ORIGINS` | Allowed origins | localhost:3000 |

### Feature Toggles
| Variable | Description | Required When |
|----------|-------------|---------------|
| `EMAIL_ENABLED`, `SMTP_HOST/PORT/USERNAME/PASSWORD` | SMTP email | Email enabled |
| `SMS_ENABLED`, `TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM_NUMBER` | Twilio SMS | SMS enabled |
| `PAYTABS_PROFILE_ID`, `PAYTABS_SERVER_KEY`, `PAYTABS_CALLBACK_URL` | PayTabs payments | Payments |
| `ZATCA_ENABLED`, `ZATCA_SELLER_NAME`, `ZATCA_VAT_NUMBER` | E-invoicing QR | Zatca enabled |
| `DEFAULT_VAT_RATE` | VAT percentage | Optional (15.00) |
| `UPLOAD_DIR`, `MAX_FILE_SIZE` | File storage | Optional |
| `HSTS_ENABLED` | Security header | Production |

**Production Validation:** `ProductionConfigValidator` fails fast if required variables are missing.

---

## Database Migrations

Location: `src/main/resources/db/migration/V{n}__{description}.sql`

| V# | Content |
|----|---------|
| V2 | Organizations, clubs, locations |
| V3 | Users, refresh tokens |
| V4 | Members, plans, subscriptions |
| V5 | Attendance records |
| V6 | Invoices, line items, sequences |
| V7 | Password reset tokens |
| V8 | Classes, schedules, sessions, bookings |
| V9 | Notifications, preferences |
| V10 | Performance indexes |
| V11 | Audit logs |
| V12 | Fix notification body to TEXT, soft delete columns |
| V13 | ShedLock table |
| V14 | File metadata table |
| V15 | Rate limits table |

---

## Key Value Objects

| Object | Location | Purpose |
|--------|----------|---------|
| `LocalizedText` | `shared/domain/ValueObjects.kt` | Bilingual text (en/ar) |
| `Money` | `shared/domain/ValueObjects.kt` | Currency amounts |
| `Email`, `PhoneNumber` | `shared/domain/ValueObjects.kt` | Validated contact info |
| `TenantId`, `OrganizationId` | `shared/domain/TenantContext.kt` | Context identifiers |

---

## Important Rules

1. **Always use LocalizedText** for user-facing strings
2. **Always add tenant filter** to tenant-scoped entities
3. **Always create migrations** for schema changes
4. **Keep domain logic in entities**, services orchestrate
5. **Never expose tokens** in API responses
6. **Bilingual error messages** (EN + AR) in GlobalExceptionHandler
7. **Cross-tenant validation** - only SUPER_ADMIN can access other tenants

---

## Build & Deploy

```bash
docker compose up -d          # Local dev
./gradlew test                # Run tests (250+)
./gradlew bootRun             # Run backend (port 8080)
docker build -t liyaqa-backend:local ./backend
```

**API Docs:** `/swagger-ui.html` | `/api-docs`

**CI/CD:** GitHub Actions - `ci.yml` (build/test), `deploy-staging.yml`, `deploy-production.yml`

---

## Known Issues

1. **Spring Boot 4 TestRestTemplate:** Not working. Use service-level testing.
2. **PasswordEncoder.encode():** Returns nullable. Add `!!` assertion.

---

## Frontend Development

**Status:** MVP Ready | **All API Compatibility Fixes COMPLETE**

### Progress
- [x] Phase 0: Design prototypes (14 HTML files in `frontend/prototype/`)
- [x] Phase 1: Foundation (Next.js 15, Tailwind, i18n, auth stores)
- [x] Phase 2: Admin Core (Dashboard, Members CRUD, Subscriptions)
- [x] Phase 3: Admin Operations (Attendance, Classes, Sessions, Bookings, Invoices)
- [x] Phase 4: Member Portal (Home, Bookings, Invoices, Profile, QR, Notifications)
- [x] Phase 5: Advanced (ALL STEPS COMPLETE)

### MVP Compatibility Status (Updated 2026-01-09)

**ALL API COMPATIBILITY ISSUES FIXED.** Type-check passes successfully.

#### All Fixed Issues
| Issue | Status | Location |
|-------|--------|----------|
| `api/me/profile` → `api/me` | ✅ FIXED | `lib/api/me.ts:160` |
| `PUT` → `PATCH api/me` | ✅ FIXED | `lib/api/me.ts:169` |
| `api/me/dashboard` → `api/mobile/home` | ✅ FIXED | `lib/api/me.ts:176` |
| `api/qr/generate` → `api/qr/me` | ✅ FIXED | `lib/api/me.ts:187` |
| `api/me/bookings` → `/upcoming` or `/past` | ✅ FIXED | `lib/api/me.ts:209` |
| `api/me/bookings/{id}/cancel` | ✅ FIXED | `lib/api/me.ts:264` |
| `/api/reports/*` backend | ✅ EXISTS | `ReportController.kt` |
| `api/dashboard/today-attendance` → `/attendance/today` | ✅ FIXED | `lib/api/dashboard.ts:69` |
| `api/dashboard/expiring-subscriptions` → `/subscriptions/expiring?daysAhead=` | ✅ FIXED | `lib/api/dashboard.ts:79` |
| `api/dashboard/pending-invoices` → `/invoices/pending` | ✅ FIXED | `lib/api/dashboard.ts:87` |
| `POST api/subscriptions` → `POST /api/members/{memberId}/subscriptions` | ✅ FIXED | `lib/api/subscriptions.ts:73` |
| `POST api/invoices/from-subscription/{id}` → `POST /api/subscriptions/{id}/invoice` | ✅ FIXED | `lib/api/invoices.ts:135` |
| `GET/PUT api/notifications/preferences` → with memberId | ✅ FIXED | `lib/api/me.ts:349,361` |
| `GET api/me/invoices/{id}` → uses `/api/invoices/{id}` | ✅ FIXED | `lib/api/me.ts:297` |
| `GET api/me/invoices/{id}/pdf` → uses `/api/invoices/{id}/pdf` | ✅ FIXED | `lib/api/me.ts:305` |
| `api/locations/{id}/activate/deactivate` → `reopen/temporarily-close` | ✅ FIXED | `lib/api/locations.ts:79,86` |

#### Report Types Alignment (Verified)

Frontend `types/report.ts` aligns with Backend `ReportController.kt` DTOs.

### Phase 5 Completed Steps

| Step | Status | Description |
|------|--------|-------------|
| 1. Payment Integration | ✅ COMPLETE | PayTabs flow, payment/complete pages |
| 2. Organization Management | ✅ COMPLETE | CRUD, status transitions |
| 3. Club Management | ✅ COMPLETE | CRUD with org selector |
| 4. Location Management | ✅ COMPLETE | CRUD with club selector |
| 5. Member Self-Service | ✅ COMPLETE | Profile, QR, bookings, invoices, notifications |
| 6. Membership Plans Admin | ✅ COMPLETE | plan-form.tsx, plans API |
| 7. User Management | ✅ COMPLETE | users.ts, user pages |
| 8. Fix Dashboard API Paths | ✅ COMPLETE | 3 endpoint path fixes |
| 9. Fix Subscription Create | ✅ COMPLETE | memberId in path vs body |
| 10. Type-check Verification | ✅ COMPLETE | `npm run type-check` passes |

### Frontend Structure
```
frontend/src/
├── lib/api/           # API modules (members, subscriptions, invoices, etc.)
├── queries/           # TanStack Query hooks (use-members, use-invoices, etc.)
├── types/             # TypeScript types (member, billing, scheduling, etc.)
├── stores/            # Zustand stores (auth-store, tenant-store, ui-store)
├── components/
│   ├── ui/            # Radix-based components (button, input, data-table, etc.)
│   ├── forms/         # Form components (member-form, class-form, etc.)
│   └── layouts/       # Shell layouts (admin-shell, member-shell)
└── app/[locale]/
    ├── (auth)/        # Login, register, forgot-password
    ├── (admin)/       # Dashboard, members, subscriptions, classes, invoices, etc.
    └── (member)/      # Home, my-bookings, my-invoices, profile, qr-code, etc.
```

### Key Patterns

**TanStack Query:**
```typescript
export const memberKeys = {
  all: ["members"] as const,
  list: (params) => [...memberKeys.all, "list", params] as const,
};
export function useMembers(params) {
  return useQuery({ queryKey: memberKeys.list(params), queryFn: () => getMembers(params) });
}
```

**API Client:** `src/lib/api/client.ts` auto-injects Authorization, X-Tenant-ID, X-Organization-ID headers.

**Route Naming:** Member routes use `/my-bookings`, `/my-invoices` to avoid conflict with admin routes.

### Commands
```bash
cd frontend && npm run dev        # http://localhost:3000/en/login
cd frontend && npm run type-check # Verify types
```

### Design Reference
HTML prototypes in `frontend/prototype/` (admin-dashboard.html, admin-members.html, etc.)

---

## MVP Frontend Compatibility (COMPLETE)

All API compatibility fixes have been applied and verified with `npm run type-check`.

### MVP Checklist (All Complete)

```
[x] Fix api/me/profile → api/me
[x] Fix PUT → PATCH for profile update
[x] Fix api/qr/generate → api/qr/me
[x] Fix api/me/bookings endpoints
[x] Fix api/me/dashboard → api/mobile/home
[x] ReportController exists in backend
[x] Fix dashboard/today-attendance path
[x] Fix dashboard/expiring-subscriptions path + param
[x] Fix dashboard/pending-invoices path
[x] Fix subscription creation path (memberId in URL)
[x] Fix invoice from subscription path
[x] Fix notification preferences endpoints (add memberId)
[x] Fix location status actions (reopen/temporarily-close)
[x] Fix member invoice endpoints (use general invoice API)
[x] Run npm run type-check ✓
```

### Backend Features NOT Exposed in Frontend (Post-MVP)

| Backend Endpoint | Feature | Priority |
|-----------------|---------|----------|
| `/api/notifications/*` (admin) | Admin notification management | Low |
| `/api/files/*` | File upload/management UI | Medium |
| `/api/mobile/*` | Mobile-optimized endpoints (used internally) | Low |
| `/api/qr/session/{id}` | Session QR for trainers | Low |
| `/api/qr/self-check-in` | Self check-in with location QR | Low |
| Bulk operations endpoints | Bulk member/subscription/invoice actions | Medium |

### Frontend Features with Full Backend Support

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Auth (login/register/logout) | ✓ | ✓ | ✅ READY |
| Organization CRUD | ✓ | ✓ | ✅ READY |
| Club CRUD | ✓ | ✓ | ✅ READY |
| Location CRUD | ✓ | ✓ | ✅ READY |
| Members CRUD | ✓ | ✓ | ✅ READY |
| Plans CRUD | ✓ | ✓ | ✅ READY |
| Users CRUD | ✓ | ✓ | ✅ READY |
| Subscriptions | ✓ | ✓ | ✅ READY |
| Classes/Sessions | ✓ | ✓ | ✅ READY |
| Bookings | ✓ | ✓ | ✅ READY |
| Attendance | ✓ | ✓ | ✅ READY |
| Invoices | ✓ | ✓ | ✅ READY |
| Payments (PayTabs) | ✓ | ✓ | ✅ READY |
| Dashboard | ✓ | ✓ | ✅ READY |
| CSV Exports | ✓ | ✓ | ✅ READY |
| Member Profile | ✓ | ✓ | ✅ READY |
| Member Bookings | ✓ | ✓ | ✅ READY |
| Member Notifications | ✓ | ✓ | ✅ READY |
| Member QR Code | ✓ | ✓ | ✅ READY |
| Reports/Analytics | ✓ | ✓ | ✅ READY |

---

## Platform Admin Development (B2B Internal App)

**Status:** Phase 9 Platform Users IN PROGRESS | **Updated: 2026-01-10**

The Platform Admin is an internal B2B dashboard for Liyaqa platform team (PLATFORM_ADMIN, SALES_REP, SUPPORT_REP roles) to manage organizations/clients subscribing to the SaaS product.

### Platform Admin Structure
```
frontend/src/
├── app/[locale]/(platform)/
│   ├── platform-login/page.tsx      # Platform-specific login
│   ├── platform-dashboard/page.tsx  # Overview with charts & stats
│   ├── deals/                       # Sales pipeline (CRM)
│   │   ├── page.tsx                 # Deal list + Kanban board
│   │   ├── new/page.tsx             # Create deal
│   │   └── [id]/
│   │       ├── page.tsx             # Deal detail
│   │       └── edit/page.tsx        # Edit deal
│   ├── clients/                     # Client/Organization management
│   │   ├── page.tsx                 # Client list with stats
│   │   ├── new/page.tsx             # Onboard new client
│   │   └── [id]/
│   │       ├── page.tsx             # Client detail (Overview, Clubs, Subscriptions tabs)
│   │       └── edit/page.tsx        # Edit client
│   └── client-subscriptions/        # Subscription management
│       ├── page.tsx                 # Subscription list with 6 stats
│       ├── new/page.tsx             # Create subscription
│       └── [id]/
│           ├── page.tsx             # Subscription detail with actions
│           └── edit/page.tsx        # Edit subscription
├── components/platform/
│   ├── summary-cards.tsx            # Dashboard KPI cards
│   ├── client-growth-chart.tsx      # Client growth visualization
│   ├── top-clients-table.tsx        # Top clients by revenue
│   ├── recent-activity-feed.tsx     # Recent platform activity
│   ├── health-indicators.tsx        # System health metrics
│   ├── revenue-chart.tsx            # Revenue trends
│   ├── deal-*.tsx                   # Deal components (7 files)
│   ├── kanban-*.tsx                 # Kanban board components
│   ├── client-*.tsx                 # Client components (4 files)
│   ├── plan-*.tsx                   # Plan components (3 files)
│   └── subscription-*.tsx           # Subscription components (3 files)
├── queries/platform/
│   ├── use-deals.ts                 # Deal query hooks
│   ├── use-platform-clients.ts      # Client query hooks
│   ├── use-client-plans.ts          # Client plan hooks
│   ├── use-client-subscriptions.ts  # Client subscription hooks
│   ├── use-client-invoices.ts       # Client invoice hooks
│   ├── use-platform-dashboard.ts    # Dashboard data hooks
│   └── use-platform-support.ts      # Support ticket hooks
├── lib/api/platform/                # 8 API client modules
└── types/platform/                  # 8 type definition files
```

### Platform Admin Phases

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1: Foundation | ✅ COMPLETE | Platform shell, login, role guards |
| Phase 2: Dashboard | ✅ COMPLETE | Summary cards, charts, activity feed |
| Phase 3: Deals (CRM) | ✅ COMPLETE | CRUD, Kanban board, pipeline stats |
| Phase 4: Deals Advanced | ✅ COMPLETE | Deal progression, win/lose flows |
| Phase 5: Client Management | ✅ COMPLETE | Client CRUD, onboarding, subscriptions |
| Phase 6: Client Plans | ✅ COMPLETE | Plan CRUD, pricing tiers, features |
| Phase 7: Client Subscriptions | ✅ COMPLETE | Subscription CRUD, status actions |
| Phase 8: Support Tickets | ✅ COMPLETE | Ticket CRUD, messages, status actions |
| **Phase 9: Platform Users** | 🔄 IN PROGRESS | Platform team user management |

### Phase 5 Completed (2026-01-10)

**Client Management Features:**
- [x] Client list page with stats cards (total, active, suspended, pending)
- [x] Client search by name/email
- [x] Client status filter dropdown
- [x] DataTable with sorting and pagination
- [x] Client onboarding form (4 tabs: Organization, Club, Admin, Subscription)
- [x] Client detail page (3 tabs: Overview, Clubs, Subscriptions)
- [x] Client edit form (Organization, Contact, Registration sections)
- [x] Activate/Suspend client actions
- [x] Bilingual support (EN/AR)

**Files Created in Phase 5:**
- `components/platform/client-status-badge.tsx`
- `components/platform/client-columns.tsx`
- `components/platform/client-onboarding-form.tsx`
- `components/platform/client-edit-form.tsx`
- `app/[locale]/(platform)/clients/page.tsx`
- `app/[locale]/(platform)/clients/new/page.tsx`
- `app/[locale]/(platform)/clients/[id]/page.tsx`
- `app/[locale]/(platform)/clients/[id]/edit/page.tsx`

### Phase 6 Completed (2026-01-10)

**Client Plans Features:**
- [x] Plan list page with stats cards (Total, Active, Inactive, Avg Price)
- [x] Status filter dropdown (All/Active/Inactive)
- [x] DataTable with sorting and pagination
- [x] Plan form with 4 card sections (Basic Info, Pricing, Limits, Features)
- [x] Annual savings calculation display
- [x] Plan detail page with feature badges
- [x] Activate/Deactivate/Delete actions
- [x] Bilingual support (EN/AR)

**Files Created in Phase 6:**
- `components/platform/plan-status-badge.tsx`
- `components/platform/plan-columns.tsx`
- `components/platform/plan-form.tsx`
- `app/[locale]/(platform)/client-plans/page.tsx`
- `app/[locale]/(platform)/client-plans/new/page.tsx`
- `app/[locale]/(platform)/client-plans/[id]/page.tsx`
- `app/[locale]/(platform)/client-plans/[id]/edit/page.tsx`

### Phase 7 Completed (2026-01-10)

**Client Subscriptions Features:**
- [x] Subscription list page with 6 stats cards (Total, Active, Trial, Suspended, Cancelled, Expired)
- [x] Status filter dropdown (All/Trial/Active/Suspended/Cancelled/Expired)
- [x] DataTable with sorting and pagination
- [x] Subscription form with 4 card sections:
  - Organization & Plan selectors (auto-fill price from plan)
  - Pricing (agreed price, discount, effective monthly display)
  - Contract Terms (duration, billing cycle, auto-renew toggle)
  - Trial & Sales (enable trial, trial days, sales rep, deal, notes EN/AR)
- [x] Subscription detail page with status-based action buttons
- [x] Status actions: Activate, Suspend, Cancel (Renew/Change Plan: placeholder toasts)
- [x] Bilingual support (EN/AR)

**Files Created in Phase 7:**
- `components/platform/subscription-status-badge.tsx`
- `components/platform/subscription-columns.tsx`
- `components/platform/subscription-form.tsx`
- `app/[locale]/(platform)/client-subscriptions/page.tsx`
- `app/[locale]/(platform)/client-subscriptions/new/page.tsx`
- `app/[locale]/(platform)/client-subscriptions/[id]/page.tsx`
- `app/[locale]/(platform)/client-subscriptions/[id]/edit/page.tsx`

**Type Enhancement:**
- Extended `ClientSubscriptionSummary` with optional `organizationName` and `planName` for list display

**Pending for Future:**
- Renew subscription modal (currently shows toast placeholder)
- Change plan modal (currently shows toast placeholder)

### Phase 8 Completed (2026-01-10)

**Support Tickets Features:**
- [x] Ticket list page with 6 stats cards (Total, Open, In Progress, Waiting on Client, Resolved, Closed)
- [x] Status + Priority + Search filters
- [x] DataTable with sorting and pagination
- [x] Ticket form with 4 card sections (Client, Ticket Details, Classification, Assignment)
- [x] Ticket detail page with message thread
- [x] Message thread with client/platform team differentiation
- [x] Internal notes support (yellow highlight, lock icon)
- [x] Reply form with internal note toggle
- [x] Status badges (OPEN/IN_PROGRESS/WAITING_ON_CLIENT/RESOLVED/CLOSED)
- [x] Priority badges (LOW/MEDIUM/HIGH/URGENT)
- [x] Category labels (BILLING/TECHNICAL/ACCOUNT/FEATURE_REQUEST/BUG_REPORT/GENERAL)
- [x] Assign ticket dialog
- [x] Change status dialog with resolution notes
- [x] Bilingual support (EN/AR)
- [x] Mock data fallback (backend not implemented)

**Files Created in Phase 8:**
- `types/platform/support-ticket.ts`
- `lib/api/platform/support-tickets.ts` (with mock data)
- `queries/platform/use-support-tickets.ts`
- `components/platform/ticket-status-badge.tsx`
- `components/platform/ticket-priority-badge.tsx`
- `components/platform/ticket-columns.tsx`
- `components/platform/ticket-form.tsx`
- `components/platform/ticket-messages.tsx`
- `components/platform/assign-ticket-dialog.tsx`
- `components/platform/change-status-dialog.tsx`
- `app/[locale]/(platform)/support/page.tsx`
- `app/[locale]/(platform)/support/new/page.tsx`
- `app/[locale]/(platform)/support/[id]/page.tsx`
- `app/[locale]/(platform)/support/[id]/edit/page.tsx`

**Notes:**
- API uses `USE_MOCK = true` flag - set to `false` when backend is ready
- Backend endpoints should be: `api/platform/support-tickets/*`
- Existing `support.ts` contains client impersonation types (different purpose)

### Phase 9: Platform Users - IN PROGRESS (2026-01-10)

**Files Created (6 files):**
- [x] `types/platform/platform-user.ts` - Types, enums, request/response interfaces
- [x] `lib/api/platform/platform-users.ts` - API client with mock data (USE_MOCK=true)
- [x] `queries/platform/use-platform-users.ts` - TanStack Query hooks
- [x] `components/platform/platform-user-status-badge.tsx` - ACTIVE/INACTIVE/SUSPENDED badges
- [x] `components/platform/platform-user-role-badge.tsx` - PLATFORM_ADMIN/SALES_REP/SUPPORT_REP badges with icons
- [x] `components/platform/platform-user-columns.tsx` - DataTable columns with actions

**Files Still Pending:**
- [ ] `components/platform/platform-user-form.tsx` - Create/edit user form
- [ ] `app/[locale]/(platform)/platform-users/page.tsx` - User list with stats
- [ ] `app/[locale]/(platform)/platform-users/new/page.tsx` - Create user
- [ ] `app/[locale]/(platform)/platform-users/[id]/page.tsx` - User detail
- [ ] `app/[locale]/(platform)/platform-users/[id]/edit/page.tsx` - Edit user
- [ ] Update 3 index files with exports
- [ ] Run `npm run type-check` to verify

**Implementation Notes:**
- Types: PlatformUserRole, PlatformUserStatus, PlatformUser, PlatformUserSummary, PlatformUserStats
- API: CRUD + status changes + password reset + activity log
- Status Badge Colors: ACTIVE=green, INACTIVE=slate, SUSPENDED=red
- Role Badge Colors: PLATFORM_ADMIN=purple+Shield, SALES_REP=blue+UserCog, SUPPORT_REP=teal+Headset
- Columns Actions: View, Edit, Activate/Suspend, Reset Password

**Platform User Features (when complete):**
- User list with stats (Total, Active, Inactive, by Role)
- Status and Role filters + Search
- User detail with recent activity
- Assigned tickets/deals display
- Status actions (Activate, Suspend, Reset Password)
- Role management

### Platform Admin Key Patterns

**Form Pattern (Label + register):**
```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
  defaultValues: {...}
});

<Label htmlFor="nameEn">{texts.nameEn}</Label>
<Input id="nameEn" {...register("nameEn")} />
{errors.nameEn && <p className="text-sm text-destructive">{errors.nameEn.message}</p>}
```

**Toast Pattern (useToast hook):**
```typescript
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

// Success
toast({ title: texts.successTitle, description: texts.successDesc });

// Error
toast({ title: texts.errorTitle, description: error.message, variant: "destructive" });
```

---

## Backend-Frontend Compatibility Analysis (2026-01-10)

### Compatibility Summary

| Category | Status | Details |
|----------|--------|---------|
| Core MVP (Admin/Member) | ✅ FULLY COMPATIBLE | All endpoints aligned |
| Platform Admin Backend | 🟡 95% COMPLETE | Missing: Platform Users, Support Tickets |
| Platform Admin Frontend | ⚠️ API PATH ISSUES | 3 path mismatches + 2 mock-only modules |

---

### CRITICAL: API Path Mismatches (Platform Module)

| Frontend Path | Backend Path | Status | Fix Location |
|---------------|--------------|--------|--------------|
| `api/platform/client-plans` | `/api/platform/plans` | ❌ MISMATCH | `frontend/src/lib/api/platform/client-plans.ts:11` |
| `api/platform/client-subscriptions` | `/api/platform/subscriptions` | ❌ MISMATCH | `frontend/src/lib/api/platform/client-subscriptions.ts:14` |
| `api/platform/client-invoices` | `/api/platform/invoices` | ❌ MISMATCH | `frontend/src/lib/api/platform/client-invoices.ts:15` |

**Fix Required:** Update `BASE_URL` in each frontend file to match backend controller paths.

---

### Backend NOT Implemented (Frontend Using Mocks)

| Module | Frontend Status | Backend Status | Mock Flag Location |
|--------|-----------------|----------------|-------------------|
| **Platform Users** | ✅ Complete (types, API, hooks, components) | ❌ NOT IMPLEMENTED | `lib/api/platform/platform-users.ts:19` `USE_MOCK = true` |
| **Support Tickets** | ✅ Complete (types, API, hooks, pages) | ❌ NOT IMPLEMENTED | `lib/api/platform/support-tickets.ts:19` `USE_MOCK = true` |

**Backend Implementation Required:**

1. **Platform Users Controller** (`/api/platform/users`)
   - CRUD operations for platform team members
   - Roles: PLATFORM_ADMIN, SALES_REP, SUPPORT_REP
   - Status: ACTIVE, INACTIVE, SUSPENDED
   - Password reset, activity log

2. **Support Tickets Controller** (`/api/platform/support-tickets`)
   - CRUD operations for support tickets
   - Status: OPEN, IN_PROGRESS, WAITING_ON_CLIENT, RESOLVED, CLOSED
   - Priority: LOW, MEDIUM, HIGH, URGENT
   - Message threading, internal notes
   - Ticket assignment

---

### Backend Controllers Summary (29 Controllers, 200+ Endpoints)

| Module | Controller | Path | Endpoints |
|--------|------------|------|-----------|
| **Auth** | AuthController | `/api/auth` | login, register, refresh, logout, change-password |
| | UserController | `/api/users` | CRUD, activate, deactivate, reset-password, change-role |
| **Organization** | OrganizationController | `/api/organizations` | CRUD, status transitions |
| | ClubController | `/api/clubs` | CRUD, status transitions |
| | LocationController | `/api/locations` | CRUD, reopen, temporarily-close |
| **Membership** | MemberController | `/api/members` | CRUD, check-in, status, bulk import |
| | MembershipPlanController | `/api/membership-plans` | CRUD, activate/deactivate |
| | SubscriptionController | `/api/subscriptions` | CRUD, freeze/unfreeze, cancel, renew |
| **Attendance** | AttendanceController | `/api/attendance` | CRUD, bulk check-in/out, today |
| **Billing** | InvoiceController | `/api/invoices` | CRUD, issue, pay, PDF, bulk |
| | PaymentController | `/api/payments` | PayTabs initiate, verify, callback |
| **Scheduling** | ClassController | `/api/classes` | Classes, schedules, sessions |
| | BookingController | `/api/bookings` | CRUD, check-in, no-show, bulk |
| **Notification** | NotificationController | `/api/notifications` | CRUD, preferences, mark-read |
| **Shared** | DashboardController | `/api/dashboard` | Summary, today-attendance, expiring |
| | MeController | `/api/me` | Profile, bookings, invoices, notifications |
| | MobileApiController | `/api/mobile` | Lite DTOs for mobile |
| | QrCheckInController | `/api/qr` | QR generation, check-in |
| | ExportController | `/api/exports` | CSV exports |
| | FileController | `/api/files` | Upload, download, categories |
| | ReportController | `/api/reports` | Revenue, attendance, members |
| **Platform** | DealController | `/api/platform` | CRM deals pipeline |
| | ClientController | `/api/platform/clients` | Client onboarding, CRUD |
| | ClientPlanController | `/api/platform/plans` | SaaS pricing plans |
| | ClientSubscriptionController | `/api/platform/subscriptions` | Client subscriptions |
| | ClientInvoiceController | `/api/platform/invoices` | B2B invoicing |
| | PlatformDashboardController | `/api/platform/dashboard` | Platform metrics |
| | PlatformSupportController | `/api/platform/support` | Impersonation, client data |

---

### Frontend API Clients Summary (30 Files, 280+ Functions)

**Core Modules (20 files):**
- `auth.ts`, `members.ts`, `subscriptions.ts`, `plans.ts`
- `invoices.ts`, `payments.ts`, `attendance.ts`
- `classes.ts`, `sessions.ts`, `bookings.ts`
- `organizations.ts`, `clubs.ts`, `locations.ts`
- `users.ts`, `dashboard.ts`, `reports.ts`, `exports.ts`, `me.ts`

**Platform Modules (10 files):**
- `deals.ts`, `clients.ts`, `client-plans.ts`, `client-subscriptions.ts`
- `client-invoices.ts`, `dashboard.ts`, `support.ts`
- `support-tickets.ts` (mock), `platform-users.ts` (mock), `index.ts`

---

### Frontend Query Hooks Summary (26 Files, 340+ Hooks)

**Core Hooks (17 files):** 162+ query hooks, 180+ mutation hooks
**Platform Hooks (9 files):** All platform CRUD/status operations

---

### Type Alignment Status

| Frontend Type File | Backend DTO Alignment | Notes |
|--------------------|----------------------|-------|
| `api.ts` | ✅ ALIGNED | LocalizedText, Money, PageResponse |
| `auth.ts` | ✅ ALIGNED | Login, Register, Refresh |
| `organization.ts` | ✅ ALIGNED | Organization, Club, Location |
| `member.ts` | 🟡 MINOR ISSUE | See note below |
| `attendance.ts` | ✅ ALIGNED | CheckIn, CheckOut, BulkOps |
| `scheduling.ts` | ✅ ALIGNED | GymClass, Session, Booking |
| `billing.ts` | ✅ ALIGNED | Invoice, LineItem, Payment |
| `payment.ts` | ✅ ALIGNED | PayTabs integration |
| `report.ts` | ✅ ALIGNED | Revenue, Attendance, Member reports |
| `platform/*.ts` | ✅ ALIGNED | All platform types match backend DTOs |

**Minor Issue - Member Name Bilingualization:**
- Frontend: `member.firstName: LocalizedText`, `member.lastName: LocalizedText`
- Backend: `MemberResponse.firstName: String`, `MemberResponse.lastName: String`
- Impact: Low - names work but aren't bilingual in backend

---

### Fix Plan (Priority Order)

#### Priority 1: Fix API Path Mismatches (Quick Fix)

```bash
# Fix client-plans.ts
sed -i '' 's|api/platform/client-plans|api/platform/plans|' frontend/src/lib/api/platform/client-plans.ts

# Fix client-subscriptions.ts
sed -i '' 's|api/platform/client-subscriptions|api/platform/subscriptions|' frontend/src/lib/api/platform/client-subscriptions.ts

# Fix client-invoices.ts
sed -i '' 's|api/platform/client-invoices|api/platform/invoices|' frontend/src/lib/api/platform/client-invoices.ts
```

#### Priority 2: Implement Backend - Platform Users

Create in `backend/src/main/kotlin/com/liyaqa/platform/`:

1. **Entity:** `PlatformUser.kt` (extends OrganizationLevelEntity)
2. **Repository:** `PlatformUserRepository.kt` (port + adapter)
3. **Service:** `PlatformUserService.kt`
4. **Controller:** `PlatformUserController.kt` at `/api/platform/users`
5. **DTOs:** `PlatformUserDtos.kt`
6. **Migration:** `V17__create_platform_users_table.sql`

Endpoints needed:
```
POST   /api/platform/users              - Create
GET    /api/platform/users              - List (paginated)
GET    /api/platform/users/{id}         - Get by ID
PATCH  /api/platform/users/{id}         - Update
POST   /api/platform/users/{id}/status  - Change status
POST   /api/platform/users/{id}/reset-password - Reset password
GET    /api/platform/users/{id}/activities - Activity log
DELETE /api/platform/users/{id}         - Delete
GET    /api/platform/users/stats        - Statistics
```

#### Priority 3: Implement Backend - Support Tickets

Create in `backend/src/main/kotlin/com/liyaqa/platform/`:

1. **Entity:** `SupportTicket.kt`, `TicketMessage.kt`
2. **Repository:** `SupportTicketRepository.kt`
3. **Service:** `SupportTicketService.kt`
4. **Controller:** `SupportTicketController.kt` at `/api/platform/support-tickets`
5. **DTOs:** `SupportTicketDtos.kt`
6. **Migration:** `V18__create_support_tickets_table.sql`

Endpoints needed:
```
POST   /api/platform/support-tickets              - Create
GET    /api/platform/support-tickets              - List (paginated)
GET    /api/platform/support-tickets/{id}         - Get by ID
PUT    /api/platform/support-tickets/{id}         - Update
POST   /api/platform/support-tickets/{id}/status  - Change status
POST   /api/platform/support-tickets/{id}/assign  - Assign
GET    /api/platform/support-tickets/{id}/messages - Get messages
POST   /api/platform/support-tickets/{id}/messages - Add message
GET    /api/platform/support-tickets/stats        - Statistics
```

#### Priority 4: Frontend Mock Flag Cleanup

After backend implementation, set `USE_MOCK = false` in:
- `frontend/src/lib/api/platform/platform-users.ts:19`
- `frontend/src/lib/api/platform/support-tickets.ts:19`

---

### Verification Commands

```bash
# Frontend type-check
cd frontend && npm run type-check

# Backend build + test
cd backend && ./gradlew build

# Run full stack
docker compose up -d
```

---

## Post-MVP Features (Phase 2)

- Redis caching layer
- Two-factor authentication (2FA)
- Advanced analytics/data warehouse (ReportController full implementation)
- OAuth2/SSO integration
- Kubernetes deployment manifests
- S3 file storage option
- Admin notification management UI
- File upload UI
- Bulk operations UI
- Mobile app support (React Native)
