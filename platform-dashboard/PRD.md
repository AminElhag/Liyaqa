# Liyaqa Platform Dashboard — Product Requirements Document

## 1. Product Vision

The Platform Dashboard is the **B2B "god view"** for Liyaqa's internal operations team. It provides complete visibility and control over all tenant organizations (fitness clubs), their subscriptions, billing, support, and health — replacing the legacy Next.js implementation with a standalone Vite + React application connected to the existing Spring Boot backend.

### Target Users
- **Platform Super Admins** — Full system access, revenue visibility, user management
- **Platform Admins** — Day-to-day operations, client management, configuration
- **Account Managers** — Sales pipeline, client onboarding, subscription management
- **Support Leads** — Ticket management, client support overview, escalation
- **Support Agents** — Ticket handling, client inquiry support
- **Platform Viewers** — Read-only dashboard access

### Key Goals
1. **Single source of truth** for all platform operations
2. **Real-time data** from the Spring Boot backend via REST API
3. **Production-ready** standalone deployment (separate from the consumer-facing app)
4. **Bilingual** (English + Arabic) with full RTL support
5. **Role-based access** with 6 platform roles and ~50 granular permissions

---

## 2. Design System

### 2.1 Color Palette — Sunset Coral + MD3

**Primary: Sunset Coral `#FF6B4A` (HSL 11 100% 64%)**

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--primary` | `11 100% 64%` | `11 100% 64%` |
| `--primary-foreground` | `0 0% 100%` | `0 0% 100%` |
| `--background` | `0 0% 100%` | `224 71% 4%` |
| `--foreground` | `222.2 84% 4.9%` | `210 40% 98%` |
| `--card` | `0 0% 100%` | `224 71% 6%` |
| `--muted` | `210 40% 96.1%` | `224 30% 15%` |
| `--border` | `214.3 31.8% 91.4%` | `224 30% 15%` |
| `--ring` | `11 100% 64%` | `11 100% 64%` |
| `--destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` |

**Brand Scale:**
| Level | Hex | Usage |
|-------|-----|-------|
| 50 | `#fff4f1` | Tinted backgrounds |
| 100 | `#ffe5e0` | Hover states |
| 200 | `#ffccc2` | Light accents |
| 300 | `#ffb3a3` | Badges |
| 400 | `#ff9a82` | Icons |
| 500 | `#FF6B4A` | **Primary actions** |
| 600 | `#E85D3A` | Hover on primary |
| 700 | `#d14f2d` | Active state |
| 800 | `#a33e23` | Dark accents |
| 900 | `#7a2e19` | Text on light bg |

**Semantic Colors:**
| Token | Value | Usage |
|-------|-------|-------|
| Success | `#22c55e` | Active, healthy, completed |
| Warning | `#f59e0b` | Expiring, at-risk, pending |
| Danger | `#ef4444` | Failed, overdue, critical |
| Info | `#3b82f6` | Informational, links |

**Platform Metric Accent Colors:**
| Metric | HSL | Usage |
|--------|-----|-------|
| Clients | `217 91% 60%` | Client-related stats |
| Revenue | `160 84% 39%` | Revenue/financial stats |
| Deals | `38 92% 50%` | Sales pipeline stats |
| Health | `263 70% 50%` | Health score stats |
| Subscriptions | `189 94% 43%` | Subscription stats |

### 2.2 MD3 Surface System

Material Design 3 elevation via surface tinting:

| Surface Level | Light (HSL) | Dark (HSL) |
|---------------|-------------|------------|
| Surface | `0 0% 98%` | `224 71% 6%` |
| Surface Dim | `0 0% 94%` | `224 71% 4%` |
| Surface Bright | `0 0% 100%` | `224 30% 14%` |
| Container Lowest | `0 0% 100%` | `224 71% 3%` |
| Container Low | `0 0% 97%` | `224 71% 5%` |
| Container | `0 0% 95%` | `224 71% 7%` |
| Container High | `0 0% 93%` | `224 71% 9%` |
| Container Highest | `0 0% 91%` | `224 71% 11%` |

### 2.3 MD3 Elevation Shadows

| Level | Shadow |
|-------|--------|
| md3-1 | `0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)` |
| md3-2 | `0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)` |
| md3-3 | `0px 1px 3px rgba(0,0,0,0.3), 0px 4px 8px 3px rgba(0,0,0,0.15)` |
| md3-4 | `0px 2px 3px rgba(0,0,0,0.3), 0px 6px 10px 4px rgba(0,0,0,0.15)` |
| md3-5 | `0px 4px 4px rgba(0,0,0,0.3), 0px 8px 12px 6px rgba(0,0,0,0.15)` |

### 2.4 MD3 Corner Shapes

| Token | Radius | Usage |
|-------|--------|-------|
| md3-xs | 4px | Chips, small elements |
| md3-sm | 8px | Buttons, inputs |
| md3-md | 12px | Cards |
| md3-lg | 16px | Dialogs, FABs |
| md3-xl | 28px | Large containers |
| md3-full | 9999px | Pill shapes |

### 2.5 Typography

| Context | Font Family |
|---------|-------------|
| English (LTR) | Plus Jakarta Sans |
| Arabic (RTL) | Cairo |
| Display stats | Space Grotesk (EN) / Cairo (AR) |
| Code/mono | JetBrains Mono |

**MD3 Type Scale:** Display (L/M/S), Headline (L/M/S), Title (L/M/S), Body (L/M/S), Label (L/M/S)

### 2.6 Gradients

| Name | Value | Usage |
|------|-------|-------|
| Primary | `linear-gradient(135deg, #FF6B4A 0%, #E85D3A 100%)` | CTAs, hero stats |
| Platform | `linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)` | Admin indicators |
| Success | `linear-gradient(135deg, #22c55e 0%, #16a34a 100%)` | Positive metrics |
| Warning | `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)` | Attention metrics |
| Danger | `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)` | Critical metrics |
| Info | `linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)` | Neutral metrics |

### 2.7 Animation & Motion

- **Library:** Framer Motion for all component animations
- **Reduced motion:** All animations respect `prefers-reduced-motion: reduce`
- **RTL-aware:** Framer Motion `x` values flip sign in RTL mode
- **MD3 easing:** `cubic-bezier(0.2, 0, 0, 1)` for emphasized motion
- **Durations:** Fast 150ms, Base 200ms, Slow 300ms, Spring 500ms

### 2.8 Accessibility (WCAG AA)

- Focus-visible indicators on all interactive elements (2px solid primary, 2px offset)
- Skip navigation link
- Screen reader utilities (`.sr-only`, `aria-live` regions)
- Minimum 48px touch targets (MD3 spec)
- High contrast mode support
- Proper ARIA roles on all widgets (tabs, menus, dialogs, tables)
- Disabled states at 50% opacity with `pointer-events: none`
- Form error states with `aria-invalid`

---

## 3. Architecture

### 3.1 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Build | Vite | 7.x |
| UI | React | 18.x |
| Language | TypeScript | 5.9 (strict) |
| Styling | TailwindCSS v4 | 4.x (`@tailwindcss/vite` plugin) |
| Components | Shadcn/UI | Latest (new-york style) |
| Routing | React Router | 6.x |
| State (server) | TanStack React Query | 5.x |
| State (client) | Zustand | 5.x |
| Tables | TanStack React Table | 8.x |
| Forms | React Hook Form + Zod | 7.x + 4.x |
| HTTP | Axios | 1.x |
| Charts | Recharts | 3.x |
| i18n | i18next + react-i18next | 25.x + 16.x |
| Icons | Lucide React | Latest |
| Animation | Framer Motion | 12.x |
| Drag & Drop | @dnd-kit | 6.x (core) + 10.x (sortable) |
| Date | date-fns | 4.x |

### 3.2 Project Structure

```
platform-dashboard/
├── public/
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios instance with interceptors
│   │   └── endpoints/             # 14 API module files
│   ├── components/
│   │   ├── ui/                    # Shadcn/UI primitives
│   │   ├── layout/                # AppShell, Sidebar, Header, etc.
│   │   ├── data/                  # StatCard, DataTable, Chart, etc.
│   │   ├── feedback/              # Toast, EmptyState, ErrorBoundary, etc.
│   │   ├── forms/                 # SearchInput, DateRangePicker, FilterBar
│   │   └── platform/              # Ported platform-specific components
│   ├── features/
│   │   ├── auth/                  # Login page
│   │   ├── dashboard/             # Main dashboard
│   │   ├── deals/                 # Deal pipeline (Kanban + table)
│   │   ├── clients/               # Client management
│   │   ├── subscriptions/         # Subscriptions + plans
│   │   ├── invoices/              # Invoice management
│   │   ├── support/               # Support tickets
│   │   ├── health/                # Client health monitoring
│   │   ├── alerts/                # Platform alerts
│   │   ├── dunning/               # Payment dunning
│   │   ├── onboarding/            # Client onboarding
│   │   ├── platform-users/        # Team management
│   │   ├── clubs/                 # Club detail views
│   │   ├── monitoring/            # Audit logs, system status
│   │   └── analytics/             # Advanced analytics
│   ├── hooks/                     # 18 React Query hook files
│   ├── stores/                    # Zustand stores
│   ├── types/                     # 16+ TypeScript type modules
│   ├── i18n/                      # i18next config + locale files
│   ├── lib/                       # Utilities (cn, motion helpers)
│   ├── styles/                    # theme.css
│   ├── App.tsx                    # Route definitions
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Tailwind + Shadcn CSS
├── PRD.md                         # This file
├── prd.json                       # Trackable user stories
├── .env                           # VITE_API_BASE_URL
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── components.json                # Shadcn configuration
└── eslint.config.js
```

### 3.3 Backend Integration

**Backend:** Spring Boot 3.4.1 + Kotlin, running on `http://localhost:8080`

**API Base:** `http://localhost:8080` (env: `VITE_API_BASE_URL`)

All platform endpoints live under `/api/platform/` with `@PlatformSecured` authorization.

**Authentication Flow:**
1. POST `/api/platform/auth/send-code` with email
2. User receives OTP via email
3. POST `/api/platform/auth/verify-code` with email + code
4. Response: `{ accessToken, refreshToken, user }`
5. Token stored in memory + localStorage
6. Axios interceptor adds `Authorization: Bearer <token>` to all requests
7. On 401, attempt token refresh via POST `/api/platform/auth/refresh`
8. On refresh failure, redirect to `/login`

**CORS:** Backend `application-local.yml` must include `http://localhost:5173`

### 3.4 API Surface

18 controllers, ~120+ endpoints:

| Controller | Base Path | Endpoints |
|-----------|-----------|-----------|
| PlatformAuthController | `/api/platform/auth` | 6 (login, send-code, verify-code, refresh, me, logout) |
| PlatformDashboardController | `/api/platform/dashboard` | 16 (summary, revenue, growth, pipeline, top-clients, exports) |
| DealController | `/api/platform/deals` | 10 (CRUD, stage changes, activities, pipeline, metrics) |
| ClientController | `/api/platform/clients` | 10 (CRUD, activate/suspend, clubs, health) |
| ClientSubscriptionController | `/api/platform/subscriptions` | 15 (CRUD, activate/suspend/cancel/renew, change-plan, stats) |
| ClientPlanController | `/api/platform/plans` | 9 (CRUD, activate/deactivate) |
| ClientInvoiceController | `/api/platform/invoices` | 14 (CRUD, issue, record-payment, cancel, PDF download, stats) |
| ClientNoteController | `/api/platform/clients/{id}/notes` | 8 (CRUD, toggle-pin, categories) |
| SupportTicketController | `/api/platform/support-tickets` | 11 (CRUD, status, assign/unassign, messages, stats) |
| PlatformSupportController | `/api/platform/support` | 6 (client overview, members, subscriptions, invoices, users) |
| PlatformClubController | `/api/platform/clubs` | 15 (detail, users, employees, subscriptions, audit, locations, plans) |
| PlatformAgreementController | `/api/platform/clubs/{id}/agreements` | 7 (CRUD, activate/deactivate) |
| PlatformUserController | `/api/platform/users` | 9 (CRUD, status, reset-password, activities, stats) |
| PlatformHealthController | `/api/platform/health` | 9 (overview, at-risk, healthy, declining, history, report, recalculate) |
| PlatformAlertController | `/api/platform/alerts` | 13 (active, statistics, by-type/severity, acknowledge, resolve, bulk ops) |
| PlatformOnboardingController | `/api/platform/onboarding` | 11 (incomplete, active, stalled, by-phase, complete/uncomplete step, reminder) |
| PlatformDunningController | `/api/platform/dunning` | 16 (active, escalated, retry, payment-link, escalate, pause/resume/cancel) |
| PublicClientPlanController | `/api/public/plans` | 1 (public pricing) |

---

## 4. Feature Inventory

### 4.1 Authentication & Authorization
- Passwordless OTP login (email + code)
- Token refresh with silent retry
- Role-based route protection (6 roles)
- Permission-based UI element visibility (~50 permissions)
- Session expiry handling

### 4.2 Dashboard (Role-Specific)
- **Admin Dashboard:** Summary KPIs, revenue charts, client growth, deal pipeline, top clients, recent activity, health indicators, CSV/PDF exports
- **Sales Dashboard:** Personal deal stats, pipeline focus, conversion metrics
- **Support Dashboard:** Ticket stats, queue overview, response time metrics

### 4.3 Deal Pipeline
- Kanban board with drag-and-drop stage transitions
- Table view with sorting/filtering
- Deal detail page with activity timeline
- Create/edit deal forms
- Stage advancement: Lead → Qualified → Proposal → Negotiation → Won/Lost
- Deal conversion wizard (deal → client + subscription)
- Deal reassignment between sales reps
- Deal metrics (win rate, avg size, conversion time)

### 4.4 Client Management
- Client list with pagination, search, status filters
- Client detail page (organization info, clubs, subscriptions, invoices, notes, health)
- Client onboarding wizard (organization → club → admin user → subscription)
- Client activation/suspension
- Client health monitoring (health score, trends, at-risk indicators)
- Client notes (CRUD, pin, categorize)
- Client activity log (audit trail)

### 4.5 Subscription Management
- Subscription list with filters (status, expiring, trials)
- Subscription detail with history
- Create/renew/cancel/suspend subscriptions
- Plan change (upgrade/downgrade)
- Expiration alerts

### 4.6 Plan Management
- Plan list (active/all)
- Create/edit/delete plans
- Plan activation/deactivation
- Public plan display (pricing page)

### 4.7 Invoice Management
- Invoice list with filters (status, overdue, organization)
- Invoice detail with PDF preview/download
- Create manual invoices
- Generate from subscription
- Record payments
- Issue/cancel invoices
- Invoice statistics

### 4.8 Support
- Support ticket list with filters (status, priority, assignee)
- Ticket detail with message thread
- Create/update/assign/close tickets
- Ticket statistics
- Client support overview (drill into any client's members, subscriptions, invoices)

### 4.9 Club Detail
- Club detail view (stats, info)
- Club tabs: Users, Employees, Subscriptions, Locations, Membership Plans, Audit Logs
- Club edit dialog
- Club activate/suspend
- User password reset

### 4.10 Platform Alerts
- Active alerts list with severity/type filters
- Alert statistics
- Acknowledge/resolve/dismiss actions
- Bulk operations
- Critical alert highlighting

### 4.11 Payment Dunning
- Active dunning list with status filters
- Dunning detail with timeline
- Actions: retry payment, send payment link, escalate to CSM, pause/resume/cancel
- Dunning statistics
- CSM assignment

### 4.12 Client Onboarding
- Onboarding progress tracker
- Active/stalled/by-phase views
- Step completion toggling
- Feature unlocking
- Reminder sending
- Onboarding statistics

### 4.13 Platform Health
- Health overview dashboard
- At-risk / healthy / declining client views
- Client health detail with score history
- Health report with recommendations
- Score recalculation trigger

### 4.14 Platform User Management
- User list with role/status filters
- Create/edit/delete users
- Status changes (activate/deactivate/suspend)
- Password reset
- Activity log per user
- User statistics by role/status

### 4.15 Monitoring & Audit
- Audit log viewer (per-club, filterable by action type)
- System status page

### 4.16 Configuration & Content
- Platform configuration management
- Feature flags
- Email/notification templates
- Knowledge base
- Compliance tracking

### 4.17 Communication
- Announcements management
- Notification center

---

## 5. Route Map

| Route | Page | Backend Endpoint |
|-------|------|-----------------|
| `/login` | Login (OTP) | `/api/platform/auth/*` |
| `/dashboard` | Main Dashboard | `/api/platform/dashboard/*` |
| `/deals` | Deal Pipeline (Kanban + Table) | `/api/platform/deals` |
| `/deals/new` | Create Deal | POST `/api/platform/deals` |
| `/deals/:id` | Deal Detail | `/api/platform/deals/{id}` |
| `/deals/:id/edit` | Edit Deal | PUT `/api/platform/deals/{id}` |
| `/deals/:id/convert` | Convert Deal to Client | POST `/api/platform/clients` |
| `/clients` | Client List | `/api/platform/clients` |
| `/clients/new` | Onboard New Client | POST `/api/platform/clients` |
| `/clients/:id` | Client Detail | `/api/platform/clients/{id}` |
| `/clients/:id/edit` | Edit Client | - |
| `/clients/:id/health` | Client Health Detail | `/api/platform/health/{id}` |
| `/client-subscriptions` | Subscription List | `/api/platform/subscriptions` |
| `/client-subscriptions/new` | Create Subscription | POST `/api/platform/subscriptions` |
| `/client-subscriptions/:id` | Subscription Detail | `/api/platform/subscriptions/{id}` |
| `/client-subscriptions/:id/edit` | Edit Subscription | PUT `/api/platform/subscriptions/{id}` |
| `/client-plans` | Plan List | `/api/platform/plans` |
| `/client-plans/new` | Create Plan | POST `/api/platform/plans` |
| `/client-plans/:id` | Plan Detail | `/api/platform/plans/{id}` |
| `/client-plans/:id/edit` | Edit Plan | PUT `/api/platform/plans/{id}` |
| `/client-invoices` | Invoice List | `/api/platform/invoices` |
| `/client-invoices/new` | Create Invoice | POST `/api/platform/invoices` |
| `/client-invoices/:id` | Invoice Detail | `/api/platform/invoices/{id}` |
| `/client-invoices/:id/edit` | Edit Invoice | PUT `/api/platform/invoices/{id}` |
| `/support` | Support Ticket List | `/api/platform/support-tickets` |
| `/support/new` | Create Ticket | POST `/api/platform/support-tickets` |
| `/support/:id` | Ticket Detail | `/api/platform/support-tickets/{id}` |
| `/support/:id/edit` | Edit Ticket | PUT `/api/platform/support-tickets/{id}` |
| `/health` | Health Overview | `/api/platform/health/overview` |
| `/alerts` | Active Alerts | `/api/platform/alerts` |
| `/dunning` | Payment Dunning | `/api/platform/dunning` |
| `/onboarding` | Onboarding Monitor | `/api/platform/onboarding` |
| `/platform-users` | Platform User List | `/api/platform/users` |
| `/platform-users/new` | Create User | POST `/api/platform/users` |
| `/platform-users/:id` | User Detail | `/api/platform/users/{id}` |
| `/platform-users/:id/edit` | Edit User | PUT `/api/platform/users/{id}` |
| `/clubs/:id` | Club Detail | `/api/platform/clubs/{id}` |
| `/analytics` | Advanced Analytics | `/api/platform/dashboard/*` |
| `/monitoring/audit` | Audit Log | `/api/platform/clubs/{id}/audit-logs` |
| `/monitoring/system` | System Status | - |
| `/announcements` | Announcements | - (placeholder) |
| `/notifications` | Notification Center | - (placeholder) |
| `/settings/config` | Platform Config | - (placeholder) |
| `/settings/feature-flags` | Feature Flags | - (placeholder) |
| `/settings/templates` | Templates | - (placeholder) |
| `/compliance` | Compliance | - (placeholder) |
| `/knowledge-base` | Knowledge Base | - (placeholder) |
| `/design-system` | Design System Reference | - (internal) |

---

## 6. React Query Conventions

| Data Type | staleTime | Refetch |
|-----------|-----------|---------|
| Dashboard metrics | 5 minutes | On window focus |
| List views | 2 minutes | On window focus |
| Detail views | 1 minute | On window focus |
| Configuration | 10 minutes | Manual only |
| Auth/me | 30 minutes | On demand |

**Query Key Convention:** `["platform", resource, ...params]`

Example: `["platform", "deals", { stage: "NEGOTIATION", page: 0 }]`

**Invalidation Pattern:** Mutations invalidate related list + stats queries, update detail cache optimistically where possible.

---

## 7. i18n Strategy

- **Languages:** English (en), Arabic (ar)
- **Direction:** LTR (en), RTL (ar)
- **Numerals:** Western Arabic (1, 2, 3) for both languages (Saudi business convention)
- **Date format:** `dd/MM/yyyy` (SA standard)
- **Currency:** SAR (Saudi Riyal)
- **Namespace files:** `src/i18n/{lang}/common.json` (expand as needed)
- **Usage:** All user-facing text uses `t()` from `useTranslation()`

---

## 8. Deployment & Production

### 8.1 Environment Variables

| Variable | Dev | Production |
|----------|-----|------------|
| `VITE_API_BASE_URL` | `http://localhost:8080` | `https://api.liyaqa.com` |
| `VITE_APP_ENV` | `development` | `production` |

### 8.2 Build & Quality Gates

```bash
npm run typecheck    # TypeScript strict mode
npm run lint         # ESLint
npm run build        # Production build (tsc -b && vite build)
```

### 8.3 Production Build

- Output: `dist/` directory (static files)
- Serve via nginx, Caddy, or any static file server
- SPA fallback: all routes → `index.html`
- Gzip/Brotli compression recommended
- Cache headers: `max-age=31536000` for hashed assets, `no-cache` for `index.html`

---

## 9. Working with Stories

### Workflow
1. Read `prd.json` to find the next story where `passes: false`
2. Implement the story following its acceptance criteria
3. Run quality checks (`npm run typecheck && npm run lint && npm run build`)
4. Update `prd.json`: set `passes: true` and add notes
5. Commit: `feat(US-XXX): [story title]`
6. If all stories pass, output `<promise>COMPLETE</promise>`

### Check Progress
```bash
cat prd.json | jq '.userStories[] | {id, title, passes}'
```
