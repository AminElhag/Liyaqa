# Liyaqa Platform Dashboard — Frontend

## Overview

Build a world-class Platform Dashboard frontend for Liyaqa, a multi-tenant SaaS platform for sports facility management targeting the Saudi Arabian market. The platform dashboard is the B2B "god view" used by the Liyaqa internal team to manage all facilities, subscriptions, support, and operations.

**Tech Stack:** React 18 + TypeScript · Vite · TailwindCSS v4 · Shadcn/UI (new-york style) · Framer Motion · TanStack React Query + React Table · React Router v6 · Zustand · Recharts · React Hook Form + Zod · i18next (AR/EN) · Lucide React · @dnd-kit (drag-and-drop)

**Design Direction:** Premium enterprise SaaS — Linear meets Stripe Dashboard. Deep navy (#0A1628) primary, warm amber (#F59E0B) accent. Arabic-first with full RTL. Dark/light mode. No generic AI aesthetics.

**API Base URL:** `http://localhost:8080/api/v1/platform`

## Quality Gates

These commands must pass for every user story:

- `npm run typecheck` — TypeScript type checking
- `npm run lint` — ESLint linting
- `npm run build` — Production build succeeds with no errors

For UI stories, also include:

- Verify in browser that the component renders correctly
- Verify RTL layout when switching to Arabic
- Verify dark mode renders correctly

## User Stories

---

### US-001: Scaffold Vite + React + TypeScript project

**As a** developer
**I want** a properly scaffolded project with all dependencies installed
**So that** I have a working foundation to build on

#### Acceptance Criteria

- [ ] Vite + React 18 + TypeScript project created at project root
- [ ] All dependencies installed: tailwindcss @tailwindcss/vite, framer-motion, @tanstack/react-query, @tanstack/react-table, react-router-dom@6, zustand, recharts, react-hook-form, @hookform/resolvers, zod, i18next, react-i18next, lucide-react, date-fns, axios, clsx, tailwind-merge, @dnd-kit/core, @dnd-kit/sortable
- [ ] Shadcn/UI initialized with "new-york" style, slate base color, CSS variables enabled
- [ ] Path alias `@` mapped to `src/` in tsconfig and vite config
- [ ] TailwindCSS v4 configured with @tailwindcss/vite plugin
- [ ] `.env` file with `VITE_API_BASE_URL=http://localhost:8080/api/v1/platform`
- [ ] `npm run build` completes without errors

---

### US-002: Create project folder structure

**As a** developer
**I want** a well-organized folder structure
**So that** all feature modules have a clear home

#### Acceptance Criteria

- [ ] Folder structure created under `src/`:
  - `api/` (client.ts, endpoints/, types/)
  - `assets/fonts/`
  - `components/` (ui/, layout/, data/, feedback/, forms/)
  - `features/` (auth/, deals/, tenants/, subscriptions/, tickets/, access/, monitoring/, communication/, analytics/, config/, content/, compliance/)
  - `hooks/`, `i18n/` (en/, ar/), `lib/`, `stores/`, `styles/`, `types/`
- [ ] Each feature folder has sub-folders: pages/, components/, hooks/
- [ ] Index barrel files created for components/ui, components/layout, components/data, components/feedback, components/forms
- [ ] Typecheck passes

---

### US-003: Design system — CSS variables, fonts, and theme

**As a** developer
**I want** a comprehensive design token system with CSS variables
**So that** all components use consistent colors, fonts, spacing, and shadows

#### Acceptance Criteria

- [ ] `src/styles/theme.css` created with full CSS variable set for light mode:
  - Background: bg-primary (#FAFBFC), bg-secondary (#F1F3F5), bg-tertiary (#FFFFFF), bg-elevated (#FFFFFF), bg-inverse (#0A1628)
  - Text: text-primary (#0A1628), text-secondary (#4A5568), text-tertiary (#8B95A5), text-inverse (#FFFFFF), text-accent (#F59E0B)
  - Brand: brand-primary (#0A1628), brand-accent (#F59E0B), brand-accent-hover (#D97706), brand-accent-subtle (#FEF3C7)
  - Status: success (#10B981), warning (#F59E0B), error (#EF4444), info (#3B82F6)
  - Shadows (sm, md, lg, glow), border-radius (sm 6px, md 8px, lg 12px, xl 16px), spacing scale (8px base)
  - Transitions: fast 150ms, base 250ms, slow 400ms, spring 500ms (all cubic-bezier)
- [ ] Dark mode variables in `[data-theme="dark"]` selector with dark navy palette
- [ ] RTL selector `[dir="rtl"]` sets font-family to Arabic font
- [ ] Google Fonts loaded: Plus Jakarta Sans (400,500,600,700), IBM Plex Sans Arabic (400,500,600,700), JetBrains Mono (400,500)
- [ ] Tailwind theme extended to reference CSS variables
- [ ] Typecheck passes

---

### US-004: Theme provider with dark mode and direction support

**As a** user
**I want** to toggle between dark/light mode and Arabic/English
**So that** I can use the dashboard in my preferred language and appearance

#### Acceptance Criteria

- [ ] `ThemeProvider` component created that wraps the app
- [ ] Dark/light mode toggle sets `data-theme` attribute on `<html>` and persists to localStorage
- [ ] `DirectionProvider` sets `dir="rtl"` or `dir="ltr"` on `<html>` synced with i18n language
- [ ] i18next configured with `en` and `ar` namespaces, language detection from localStorage
- [ ] Basic translation files created: `src/i18n/en/common.json` and `src/i18n/ar/common.json` with keys for navigation, common labels, and status names
- [ ] `useTheme()` and `useDirection()` hooks exported
- [ ] Typecheck passes

---

### US-005: Framer Motion animation presets

**As a** developer
**I want** reusable animation presets
**So that** all pages and components use consistent, direction-aware motion

#### Acceptance Criteria

- [ ] `src/lib/motion.ts` created with Framer Motion variant objects:
  - `fadeIn`, `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`
  - `scaleIn` (for cards, from 0.95 to 1)
  - `slideIn` (for panels)
  - `staggerContainer` + `staggerItem` (50ms delay between children)
  - `pageTransition` (200ms fade-in-up for route changes)
- [ ] All presets respect `prefers-reduced-motion` media query
- [ ] Direction-aware: `fadeInLeft` mirrors to `fadeInRight` in RTL (accepts `dir` parameter)
- [ ] Typecheck passes

---

### US-006: Axios API client with auth interceptors

**As a** developer
**I want** a configured Axios instance with JWT interceptors
**So that** all API calls are authenticated and errors handled consistently

#### Acceptance Criteria

- [ ] `src/api/client.ts` exports configured Axios instance:
  - Base URL from `VITE_API_BASE_URL` environment variable
  - Request interceptor: attaches `Authorization: Bearer <token>` from Zustand auth store
  - Response interceptor: 401 → redirect to `/login`, 403 → toast "Permission denied", network error → toast "Connection lost"
  - Accept-Language header set from i18n current language
- [ ] `src/stores/authStore.ts` Zustand store with: token, user, login(), logout(), isAuthenticated computed
- [ ] Typecheck passes

---

### US-007: React Router setup with all routes and code splitting

**As a** developer
**I want** all routes defined with lazy-loaded pages
**So that** navigation works and bundles are code-split

#### Acceptance Criteria

- [ ] `App.tsx` sets up React Router with nested routes inside `AppShell` layout
- [ ] All routes defined with `React.lazy` + `Suspense`:
  - `/login`, `/dashboard`, `/deals`, `/tenants`, `/tenants/:id`, `/tenants/:id/onboarding`
  - `/subscriptions`, `/subscriptions/plans`, `/billing/invoices`
  - `/tickets`, `/tickets/:id`
  - `/monitoring/health`, `/monitoring/audit`, `/monitoring/system`
  - `/announcements`, `/notifications`
  - `/settings/team`, `/settings/api-keys`, `/settings/config`, `/settings/feature-flags`, `/settings/templates`
  - `/compliance`, `/knowledge-base`, `/analytics`, `/design-system`
- [ ] Each route renders a placeholder page component with the page title text
- [ ] Protected route wrapper redirects to `/login` if not authenticated
- [ ] Typecheck passes

---

### US-008: Sidebar navigation component

**As a** platform user
**I want** a collapsible sidebar with grouped navigation links
**So that** I can navigate between all dashboard sections

#### Acceptance Criteria

- [ ] `src/components/layout/Sidebar.tsx` renders navigation grouped by sections:
  - OVERVIEW: Dashboard
  - SALES: Deal Pipeline
  - TENANTS: All Facilities, Onboarding
  - BILLING: Subscriptions, Plans & Pricing, Invoices
  - SUPPORT: Tickets, Knowledge Base
  - MONITORING: Facility Health, Audit Logs, System Status
  - COMMUNICATION: Announcements, Notifications
  - SETTINGS: Team, API Keys, Configuration, Feature Flags, Compliance
- [ ] Each nav item has a Lucide icon + label
- [ ] Active item: amber left border (right in RTL) + subtle amber bg tint
- [ ] Hover: smooth background transition (150ms)
- [ ] Section headers: uppercase, 11px, muted text, generous top margin
- [ ] Collapse/expand toggle: 260px expanded, 72px collapsed with icons-only + tooltips
- [ ] Collapse state persisted to localStorage
- [ ] Smooth collapse/expand animation with Framer Motion (250ms)
- [ ] Bottom section: user avatar + name + role badge, theme toggle, language toggle (AR/EN)
- [ ] Liyaqa logo at top
- [ ] Mobile (<768px): sidebar hidden, slide-over drawer triggered by hamburger button
- [ ] Full RTL support: sidebar on right, borders flip
- [ ] Verify in browser: navigation works, collapse animates, RTL flips correctly
- [ ] Typecheck passes

---

### US-009: Header with breadcrumbs and global search trigger

**As a** platform user
**I want** a header bar with breadcrumbs and quick access actions
**So that** I know where I am and can quickly navigate

#### Acceptance Criteria

- [ ] `src/components/layout/Header.tsx` fixed at top of main content area
- [ ] Breadcrumb trail auto-generated from current React Router route, with Arabic translations for each crumb
- [ ] Dynamic segments (e.g., tenant ID) resolve to entity name when available
- [ ] Global search trigger button: "Search... ⌘K" opens Command Palette
- [ ] Notification bell icon with unread count badge (animated pulse on new notifications)
- [ ] User menu dropdown: profile, preferences, logout
- [ ] Typecheck passes
- [ ] Verify in browser: breadcrumbs update on navigation

---

### US-010: Command Palette overlay (Cmd+K)

**As a** power user
**I want** a command palette with fuzzy search
**So that** I can quickly navigate to any page or action

#### Acceptance Criteria

- [ ] `src/components/layout/CommandPalette.tsx` opens on `Cmd+K` (or `Ctrl+K`)
- [ ] Full-screen overlay with frosted glass backdrop and centered search modal
- [ ] Fuzzy search across: navigation pages (with icons), recent tenants, recent tickets, quick actions
- [ ] Results grouped by category with section headers
- [ ] Keyboard navigation: arrow keys, Enter to select, Esc to close
- [ ] Framer Motion entrance: backdrop fade + modal scale-in (250ms)
- [ ] Selecting a result navigates and closes the palette
- [ ] Typecheck passes
- [ ] Verify in browser: Cmd+K opens, type to filter, arrow keys navigate, Enter selects

---

### US-011: AppShell layout with page transitions

**As a** user
**I want** smooth page transitions when navigating
**So that** the app feels polished and responsive

#### Acceptance Criteria

- [ ] `src/components/layout/AppShell.tsx` composes: Sidebar (left, or right in RTL) + main content area (Header + page content)
- [ ] `<Outlet />` wrapped in Framer Motion `AnimatePresence` for page transitions
- [ ] Page enter: 200ms fade-in from bottom (translateY 8px → 0)
- [ ] Page exit: 100ms fade-out
- [ ] `document.title` updates on route change
- [ ] Typecheck passes
- [ ] Verify in browser: sidebar + header visible, page content transitions on navigation

---

### US-012: StatCard and KPIGrid components

**As a** user
**I want** metric cards that show KPIs with trend indicators
**So that** I can quickly understand key numbers

#### Acceptance Criteria

- [ ] `src/components/data/StatCard.tsx` — Props: label, value, change (%), trend (up/down/neutral), icon, loading
  - Large bold value (24px), small muted label above (12px)
  - Trend arrow: green ↑ or red ↓ with percentage, neutral = gray dash
  - Hover: lift shadow (translateY -2px) + shadow increase
  - Loading: skeleton pulse animation matching card dimensions
  - Entrance animation: fadeInUp with configurable stagger delay prop
- [ ] `src/components/data/KPIGrid.tsx` — Props: items[], loading, columns (default 4)
  - Responsive grid: 4 cols desktop, 2 tablet, 1 mobile
  - Staggered entrance: each card 50ms delay
- [ ] Both support dark mode and RTL
- [ ] Typecheck passes
- [ ] Verify in browser: cards render with mock data, animation plays, skeleton shows on loading=true

---

### US-013: DataTable component with TanStack Table

**As a** user
**I want** a full-featured data table with sorting, search, pagination, and selection
**So that** I can efficiently browse and manage entity lists

#### Acceptance Criteria

- [ ] `src/components/data/DataTable.tsx` wraps TanStack Table. Props: columns, data, loading, pagination config, onRowClick, searchable, selectable, emptyState component
  - Column sorting: click header toggles asc/desc, arrow indicator shown
  - Built-in search bar with debounce (300ms) and clear button
  - Row selection with checkboxes; selecting rows shows bulk actions toolbar sliding in from bottom
  - Pagination footer: "Showing 1-10 of 234" + prev/next buttons + page size dropdown (10/25/50)
  - Loading: shimmer skeleton rows matching column structure
  - Empty state: centered with icon, title, description, action button
  - Row hover: subtle background change
  - Sticky header on vertical scroll
  - Custom cell renderers support (for status badges, avatars, action menus)
- [ ] Mobile (<768px): horizontal scroll with frozen first column
- [ ] RTL: text alignment respects direction
- [ ] Typecheck passes
- [ ] Verify in browser: render with mock data, sort columns, search, paginate, select rows

---

### US-014: StatusBadge, EmptyState, LoadingSkeleton, ConfirmDialog components

**As a** developer
**I want** shared feedback components
**So that** status display, empty states, loading, and confirmations are consistent everywhere

#### Acceptance Criteria

- [ ] `StatusBadge.tsx` — Props: status (string), variant (dot/pill/outline), size (sm/md)
  - Color map: ACTIVE=green, SUSPENDED=amber, DEACTIVATED=red, TRIAL=blue, PROVISIONING=purple (with pulse), ARCHIVED=gray
  - Dot variant: small colored circle + text; Pill variant: colored bg + white text; Outline: colored border + text
- [ ] `EmptyState.tsx` — Props: icon, title, description, action (button config)
  - Centered layout, 64px muted icon, descriptive text, optional CTA button, fade-in animation
- [ ] `LoadingSkeleton.tsx` — Props: variant (text/card/table/chart), rows, columns
  - Smooth shimmer gradient sweep animation
- [ ] `ConfirmDialog.tsx` — Props: title, description, confirmText, confirmVariant (danger/default), onConfirm, onCancel
  - Framer Motion: backdrop fade + modal scale-in
  - Danger variant: red confirm button
  - Focus trap + Esc to close
- [ ] All components support dark mode and RTL
- [ ] Typecheck passes

---

### US-015: Chart wrapper components with Recharts

**As a** user
**I want** beautiful, themed chart components
**So that** data visualizations are consistent and readable

#### Acceptance Criteria

- [ ] `src/components/data/Chart.tsx` exports: AreaChartCard, BarChartCard, PieChartCard
  - AreaChartCard: gradient fill under curve, smooth curves, responsive container
  - BarChartCard: rounded corner bars (radius 4px), hover highlights active bar
  - PieChartCard: donut style with center label, animated segment entrance
  - All use theme CSS variable colors
  - Custom tooltip component: frosted glass card style with formatted values
  - Loading state: skeleton chart placeholder
  - Responsive: auto-resize with ResponsiveContainer
- [ ] Dark mode: chart colors adapt, grid lines use muted dark colors, tooltip bg inverts
- [ ] Typecheck passes
- [ ] Verify in browser: render each chart type with sample data

---

### US-016: Form components — SearchInput, DateRangePicker, FilterBar

**As a** user
**I want** polished form components for filtering and searching
**So that** I can efficiently find and filter data

#### Acceptance Criteria

- [ ] `SearchInput.tsx` — Props: placeholder, value, onChange, onClear, loading, debounceMs (default 300)
  - Search icon left, clear X button right (positions flip in RTL)
  - Loading spinner replaces search icon when loading=true
  - Built-in debounce
- [ ] `DateRangePicker.tsx` — Props: value (start/end dates), onChange, presets
  - Calendar popup with range selection (click start → click end)
  - Preset buttons: Today, Last 7 days, Last 30 days, This month, This quarter, Custom
  - Display formatted range as text in trigger button
- [ ] `FilterBar.tsx` — Props: filters (array of {key, label, options}), activeFilters, onChange
  - Horizontal row of dropdown filter buttons
  - Active filters shown as removable chip badges below
  - "Clear all" link when any filter is active
  - Filter count badge on each dropdown
- [ ] All support RTL and dark mode
- [ ] Typecheck passes

---

### US-017: Timeline component for activity logs

**As a** user
**I want** a vertical timeline component
**So that** I can see chronological activity for tenants, tickets, and audit logs

#### Acceptance Criteria

- [ ] `src/components/data/Timeline.tsx` — Props: items[] ({timestamp, icon, title, description, type})
  - Left: timestamp (small, muted), Right: content card with icon, title, description
  - Connecting vertical line between items (1px, muted color)
  - Different icon colors per event type (create=green, update=blue, delete=red, access=amber)
  - Items animate in with stagger (fadeInUp, 50ms delay each)
- [ ] RTL: timeline stays vertical, text alignment flips
- [ ] Dark mode: line and card colors adapt
- [ ] Typecheck passes

---

### US-018: Toast notification system

**As a** user
**I want** toast notifications for success, error, warning, and info messages
**So that** I get feedback on my actions

#### Acceptance Criteria

- [ ] Toast system built with Framer Motion and Zustand store
  - Variants: success (green border), error (red), warning (amber), info (blue)
  - Position: bottom-right (bottom-left in RTL)
  - Stack vertically, auto-dismiss after 5 seconds
  - Hover pauses auto-dismiss timer
  - Dismiss X button on each toast
  - Entrance: slide from right + fade with spring (slide from left in RTL)
  - Max 5 visible toasts, oldest dismissed when exceeded
- [ ] `useToast()` hook exported: toast.success(msg), toast.error(msg), toast.warning(msg), toast.info(msg)
- [ ] Typecheck passes
- [ ] Verify in browser: trigger each toast type, verify auto-dismiss, verify stacking

---

### US-019: Kanban deal pipeline page

**As an** account manager
**I want** a drag-and-drop Kanban board for the deal pipeline
**So that** I can track and move deals through sales stages

#### Acceptance Criteria

- [ ] Page at `/deals` renders Kanban board with columns for each stage: LEAD, CONTACTED, DEMO_SCHEDULED, DEMO_DONE, PROPOSAL_SENT, NEGOTIATION, WON, LOST
- [ ] Column headers show: stage name + deal count + total value formatted as SAR
- [ ] Horizontal scroll when columns exceed viewport width
- [ ] Deal cards show: facility name (bold), contact name (small), value in amber, source badge, assigned avatar, days-in-stage indicator
- [ ] Drag-and-drop with @dnd-kit: dragging card lifts with shadow + slight rotation; drop zone column highlights with dashed border
- [ ] Dropping card calls PUT /deals/{id}/stage with optimistic update; revert on error with shake animation
- [ ] View toggle button: Kanban (default) / Table (DataTable with all deal fields)
- [ ] "New Deal" amber button opens right slide-over panel with form (facilityName, contactName, contactEmail, contactPhone, source select, estimatedValue, expectedCloseDate, notes) using React Hook Form + Zod
- [ ] 4 StatCards above board: Total Deals, Pipeline Value (SAR), Conversion Rate (%), Avg Cycle Time (days)
- [ ] Typecheck passes
- [ ] Verify in browser: cards drag between columns, new deal form submits, metrics display

---

### US-020: Tenant list page

**As a** platform admin
**I want** a paginated, filterable list of all facilities
**So that** I can find and manage any tenant

#### Acceptance Criteria

- [ ] Page at `/tenants` renders:
  - KPI row (4 StatCards): Total Facilities, Active, Trial, Suspended
  - DataTable with columns: Facility Name (+ Arabic name below in muted), Status (StatusBadge), Plan (pill), Members count, Region/City, Onboarding Progress (mini progress bar "5/7"), Last Admin Login (relative time), Actions (3-dot menu: View, Impersonate, Suspend, Edit)
  - Filters via FilterBar: status, plan, region
  - Search by facility name
  - Row click navigates to `/tenants/:id`
  - Empty state when no results
- [ ] Typecheck passes
- [ ] Verify in browser: table renders, filters work, row click navigates

---

### US-021: Tenant detail page with tabs

**As a** platform admin
**I want** a detailed view of a single facility with organized tabs
**So that** I can see all information about a tenant in one place

#### Acceptance Criteria

- [ ] Page at `/tenants/:id` renders:
  - Header: facility name (large) + Arabic name + status badge
  - Quick stats row: Members | Staff | Branches | Plan | MRR
  - Action buttons: Impersonate, Edit, Suspend/Activate, Export Data
  - Breadcrumb: Facilities > [Facility Name]
- [ ] 6 horizontal pill-style tabs with amber bottom border on active:
  - OVERVIEW: 2-column — facility info card (name, CR, VAT, contact, address) + subscription card (plan, billing cycle, next billing); recent activity Timeline below
  - ONBOARDING: stepper checklist with icons, completed=green check, current=amber pulse dot, action button per step, progress percentage
  - BILLING: DataTable of invoices (number, date, amount, status badge, ZATCA status) + payment history
  - SUPPORT: DataTable of tickets for this tenant + "Create Ticket" button
  - ACTIVITY: full audit log Timeline filterable by action type
  - SETTINGS: feature flag toggle switches per feature, API keys section, danger zone (Suspend, Deactivate, Archive with ConfirmDialog)
- [ ] Tab content transitions with subtle fade (150ms)
- [ ] Typecheck passes
- [ ] Verify in browser: all tabs render content, tab switching animates

---

### US-022: Onboarding wizard for new facilities

**As an** account manager
**I want** a guided step-by-step wizard to onboard new facilities
**So that** provisioning is easy and nothing is missed

#### Acceptance Criteria

- [ ] Page at `/tenants/:id/onboarding` renders a 5-step wizard:
  - Step 1 FACILITY DETAILS: name, nameAr, subdomain (live preview "x.liyaqa.com"), crNumber, vatNumber, address, city, region
  - Step 2 ADMIN ACCOUNT: admin name, email, phone, temp password with auto-generate button
  - Step 3 SUBSCRIPTION PLAN: 3 plan comparison cards side-by-side (highlighted selection), billing cycle toggle Monthly/Annual with savings badge
  - Step 4 INITIAL CONFIG: default language, timezone, currency, business type, operating hours
  - Step 5 REVIEW & LAUNCH: summary cards of all entered data + "Launch Facility" button with rocket icon
- [ ] Horizontal step indicator: numbered circles + connecting lines; completed=green check, current=amber ring pulse, clickable to go back
- [ ] Form validation per step before allowing next; React Hook Form + Zod
- [ ] Bottom nav: "Back" ghost button + "Continue" amber button
- [ ] Launch success: confetti burst animation (2 seconds) + success overlay "🎉 [Name] is Live!" with "View Facility" and "Back to Pipeline" buttons
- [ ] Progress saves to backend per step
- [ ] Typecheck passes
- [ ] Verify in browser: complete all 5 steps, confetti fires on launch

---

### US-023: Subscription plan management page

**As a** platform admin
**I want** to view and manage subscription plans with feature comparison
**So that** I can configure what each plan tier offers

#### Acceptance Criteria

- [ ] Page at `/subscriptions/plans` renders:
  - 4 plan cards side-by-side: FREE_TRIAL (gray bg), STARTER (white), PROFESSIONAL (amber gradient border + "Recommended" badge), ENTERPRISE (dark navy bg with light text)
  - Each card: plan name + Arabic name, monthly price (large) + annual price (small with savings badge), key limits (members, staff, branches, storage), feature checklist (green checks / muted X), "Edit Plan" ghost button, active tenant count badge
  - "Create Plan" button opens slide-over form
  - Feature comparison matrix below cards: left column = feature names by category, columns = plans, cells = check/dash, sticky left column on scroll
- [ ] Typecheck passes
- [ ] Verify in browser: cards render, comparison matrix scrolls correctly

---

### US-024: Subscription dashboard with revenue metrics

**As a** platform admin
**I want** a subscription overview with revenue trends and active subscriptions
**So that** I can track billing health

#### Acceptance Criteria

- [ ] Page at `/subscriptions` renders:
  - KPI row: MRR (SAR), ARR (SAR), Avg Revenue/Tenant, Active Subscriptions
  - Revenue trend area chart (last 12 months, gradient fill)
  - Subscription distribution pie chart (donut, by plan)
  - Alert bars at top: expiring trials (amber), overdue payments (red), upcoming renewals (blue) — each clickable
  - DataTable: Tenant, Plan, Status badge, Billing Cycle, Next Billing Date, MRR, Actions (Change Plan, Cancel, Renew)
- [ ] "Change Plan" opens modal: current plan on left, target plan options on right, proration calculator text, effective date selector, confirm button
- [ ] Typecheck passes
- [ ] Verify in browser: charts render, alert bars display, change plan modal opens

---

### US-025: Invoice list page with mark-paid flow

**As a** billing admin
**I want** to view all invoices and mark them as paid
**So that** I can track payment status across all tenants

#### Acceptance Criteria

- [ ] Page at `/billing/invoices` renders:
  - KPI row: Total Outstanding (SAR), Overdue Amount (SAR), Paid This Month, ZATCA Compliance %
  - FilterBar: status, tenant, dateRange, ZATCA status
  - DataTable: Invoice # (monospace), Tenant, Amount (SAR, right-aligned), VAT, Total, Status badge (DRAFT=gray, ISSUED=blue, PAID=green, OVERDUE=red with subtle red left border), ZATCA Status badge, Issue Date, Due Date, Actions (View, Mark Paid, Download PDF, Retry ZATCA)
- [ ] "Mark Paid" opens sub-modal: payment method dropdown (Bank Transfer/Cash/Other), reference number input, date picker; confirm → updates status → success toast
- [ ] Click row opens slide-over invoice detail: header info, from/to addresses, line items table, subtotal + VAT (15%) + total, payment history, ZATCA status + hash
- [ ] Typecheck passes
- [ ] Verify in browser: table renders, filters work, mark-paid flow completes

---

### US-026: Split-panel ticket management page

**As a** support agent
**I want** a split-panel ticket view with message thread
**So that** I can manage tickets efficiently without switching pages

#### Acceptance Criteria

- [ ] Page at `/tickets` renders split-panel layout:
  - Left panel (40%): ticket list with search + filter presets ("My Tickets", "Unassigned", "SLA Breached", "All Open")
  - Right panel (60%): selected ticket detail
  - Resizable divider between panels
- [ ] Ticket list cards: ticket number (monospace), subject (bold, truncated), tenant name (small), priority colored left border (CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=gray), status badge, assignee avatar, time ago or SLA countdown in red, unread blue dot; selected row highlighted
- [ ] Ticket detail panel header: ticket # + subject + status; meta bar with inline-editable dropdowns for priority, status, category, assignee
- [ ] SLA indicator: "Response due in 2h 15m" countdown or "⚠️ SLA BREACHED" red pulsing text
- [ ] Message thread: chat bubbles — customer=left, agent=right (swap in RTL); internal notes highlighted with amber border + "🔒 Internal Note" label; each message shows sender avatar, name, timestamp, content
- [ ] Reply area: basic rich text editor, toggle "Reply"/"Internal Note" (note shows amber styling), "Insert Canned Response" dropdown, attach button, amber Send button, Cmd+Enter shortcut
- [ ] Action buttons: Assign to Me, Escalate, Change Priority, Close/Reopen
- [ ] Mobile (<1024px): full-width list, clicking opens detail as separate page
- [ ] Typecheck passes
- [ ] Verify in browser: select ticket, messages render, reply sends, SLA shows

---

### US-027: Ticket analytics dashboard

**As a** support lead
**I want** analytics on ticket performance
**So that** I can monitor team productivity and SLA compliance

#### Acceptance Criteria

- [ ] Tab or sub-route under `/tickets` with analytics:
  - Agent performance DataTable: name, open tickets, avg resolution time, satisfaction score (star rating display)
  - Tickets by category donut chart
  - Tickets over time area chart (daily/weekly/monthly toggle) with SLA breach overlay
  - SLA compliance circular gauge: green >90%, amber >70%, red <70%, animated fill on load
- [ ] Typecheck passes
- [ ] Verify in browser: all charts render with sample data

---

### US-028: Impersonation flow with safety bar

**As a** support agent
**I want** to safely impersonate a facility admin's view
**So that** I can debug issues while being clearly in read-only mode

#### Acceptance Criteria

- [ ] "Impersonate" button (on tenant detail/list) opens confirmation modal:
  - Text: "You are about to view [Facility Name]'s dashboard as their admin"
  - Purpose textarea (required)
  - Warning: "This session is read-only and fully audited"
  - "Start Session" + "Cancel" buttons
- [ ] On confirm → POST /access/impersonate → loading "Establishing secure session..." → success redirect
- [ ] `ImpersonationBar.tsx`: FIXED bar at VERY TOP of viewport (above sidebar/header)
  - Amber/warning gradient background, white text
  - "👁️ Viewing as [Facility Name] — Read-only · Expires in 28:42" with live countdown
  - "End Session" button on right
  - Bar is impossible to miss — high z-index, 48px height
- [ ] During impersonation: all mutation buttons (edit, delete, create) disabled with tooltip "Read-only in impersonation mode"
- [ ] End session → POST /access/impersonate/end → redirect back with success toast
- [ ] Typecheck passes
- [ ] Verify in browser: bar renders, countdown ticks, buttons disabled

---

### US-029: Team management and API key management pages

**As a** platform admin
**I want** to manage team members and tenant API keys
**So that** I can control access and integrations

#### Acceptance Criteria

- [ ] Team page at `/settings/team`:
  - "Invite Team Member" button → modal with name, email, role select
  - DataTable: Name, Email, Role badge, Status (Active/Deactivated), Last Login, Actions (Change Role, Reset Password, Deactivate)
  - Current user row highlighted with "You" badge
  - Role hover shows description tooltip
- [ ] API Keys page at `/settings/api-keys`:
  - "Generate Key" button → select tenant → modal shows FULL key in monospace large font ONCE
  - "Copy to Clipboard" button with checkmark success feedback
  - Warning: "This key will only be shown once"
  - Checkbox "I've saved this key" required before closing modal
  - DataTable: Name, Tenant, Prefix (monospace), Permissions, Created, Last Used, Status, Actions (Revoke, Rotate)
  - Revoke: danger ConfirmDialog
- [ ] Typecheck passes
- [ ] Verify in browser: invite flow works, key shows once, copy works

---

### US-030: Audit log viewer page

**As a** platform admin
**I want** a searchable, filterable audit log viewer
**So that** I can track all platform actions for accountability

#### Acceptance Criteria

- [ ] Page at `/monitoring/audit` renders:
  - Filters (horizontal): Actor, Action Type, Resource Type, Tenant, Date Range
  - Mini bar chart at top showing action frequency over time (last 24h/7d/30d toggle); hovering a bar filters the list
  - Timeline view (default): each entry is a row with timestamp (monospace), actor avatar + name, action colored badge (green=create, blue=update, red=delete, amber=access), auto-generated description sentence, expand arrow → shows JSON details
  - Infinite scroll (load more on bottom)
  - "Auto-refresh" toggle: new entries slide in from top
  - View toggle: Timeline / Table (DataTable with all columns, export button)
  - CSV export with current filters
- [ ] Typecheck passes
- [ ] Verify in browser: log entries render, filters work, infinite scroll loads, expand shows details

---

### US-031: Facility health dashboard

**As a** platform admin
**I want** to see health scores for all facilities
**So that** I can proactively identify at-risk tenants

#### Acceptance Criteria

- [ ] Page at `/monitoring/health` renders:
  - Health distribution: pie chart by tier (Excellent >80, Good >60, At Risk >40, Critical <40), average health score (large colored number)
  - View toggle: card grid (default) / table
  - Health cards: facility name + plan badge, large health score (0-100) with circular progress ring colored by tier, mini sparklines (member trend, login frequency), status indicators (✅ Recent login, ⚠️ Overdue invoice, 🎫 Open tickets), hover shows score breakdown
  - "At Risk" section (collapsible, expanded default): facilities with score <40, each shows risk factors as text, quick action buttons: "Create Ticket", "Send Notification", "Contact"
  - Sort by: health score, member count, last activity; Filter by: health tier, plan, region
- [ ] Typecheck passes
- [ ] Verify in browser: health rings animate, at-risk section shows flagged tenants

---

### US-032: System status page

**As a** platform admin
**I want** to see system health at a glance
**So that** I know if any infrastructure components are degraded

#### Acceptance Criteria

- [ ] Page at `/monitoring/system` renders:
  - System health banner: "All Systems Operational" (green) or degraded state messages
  - Component grid cards: API Server (status + response time + uptime %), Database (connections + response time), Cache/Redis (hit rate + memory), Background Jobs (running + failed + queued), Storage (used/total progress bar)
  - Each component: green/amber/red status dot + label
  - Active maintenance banner if any maintenance window is active
- [ ] Typecheck passes
- [ ] Verify in browser: status cards render with colored dots

---

### US-033: Announcements management page with editor

**As a** communication manager
**I want** to create and publish announcements with a live preview editor
**So that** I can broadcast important information to facility admins

#### Acceptance Criteria

- [ ] Page at `/announcements` renders:
  - KPIs: Total Published, Scheduled, Avg Read Rate
  - "New Announcement" button → navigates to editor page
  - Card list (not table): type icon + colored left border (MAINTENANCE=amber, FEATURE_LAUNCH=green, URGENT=red), title + Arabic title, audience badge, status badge, published date, read count, pinned indicator, actions (Edit, Duplicate, Archive)
- [ ] Announcement editor (full page `/announcements/new` or `/announcements/:id/edit`):
  - Left (60%): title input + Arabic title input + rich text content (EN) + rich text content (AR) + type selector + audience targeting (All/Specific Plans/Specific Tenants multi-select) + schedule toggle (Now/Schedule with datetime picker) + pin toggle + expiry date
  - Right (40%): live preview panel — shows how announcement looks, language toggle (EN/AR), desktop/mobile toggle (device frame mock), updates in real-time as content changes
- [ ] Typecheck passes
- [ ] Verify in browser: create announcement, see live preview update, publish

---

### US-034: Main platform dashboard page

**As a** platform admin
**I want** a comprehensive KPI dashboard as the landing page
**So that** I can see the state of the entire platform at a glance

#### Acceptance Criteria

- [ ] Page at `/dashboard` renders scrollable sections:
  - SECTION 1: "Good [morning/afternoon], [Name]" greeting + quick action cards (horizontal scroll): "New Deal", "Active Tickets (N)", "Expiring Trials (N)", "SLA Breaches (N)" — each navigates to relevant page
  - SECTION 2: KPIGrid (4 columns): Total Facilities (with trend), Active Members, MRR (SAR), Ticket Resolution Rate — staggered fadeInUp entrance
  - SECTION 3 (2-column): Revenue Trend area chart (12 months, MRR/ARR toggle) + Tenant Growth bar chart (stacked new vs churned, net growth line)
  - SECTION 4 (3-column): Tenants by Plan donut + Revenue by Plan donut + Geographic Distribution horizontal bar chart
  - SECTION 5 (2-column): Recent Deals table (last 5, "View Pipeline →" link) + Recent Tickets table (last 5, "View All →" link)
  - SECTION 6: Health alert cards for: at-risk facilities, overdue invoices, SLA breaches, expiring subscriptions — each with icon, count, description, "View →" link; red/amber themed
- [ ] All charts load with skeleton first, then animate in (fade + grow)
- [ ] Refresh button in header re-fetches all data
- [ ] Responsive: sections stack on mobile
- [ ] Typecheck passes
- [ ] Verify in browser: all sections render, charts animate, quick actions navigate

---

### US-035: Analytics deep dive page

**As a** platform admin
**I want** detailed analytics on churn, feature adoption, and benchmarks
**So that** I can make data-driven decisions about the platform

#### Acceptance Criteria

- [ ] Page at `/analytics` (or tab within dashboard) renders:
  - Churn Analysis section: churn rate cards (30d, 90d, YTD), at-risk tenant list, churn by plan bar chart, churn reasons pie chart
  - Feature Adoption section: horizontal bar chart of features by adoption rate, trend over time line chart
  - Comparative Benchmarks section: stats cards (avg members/facility, median, avg revenue, avg staff count, top features, avg login frequency)
  - "Export Report" button (PDF/CSV toggle dropdown)
- [ ] Typecheck passes
- [ ] Verify in browser: all chart sections render with sample data

---

### US-036: Configuration page with inline editing

**As a** platform admin
**I want** to view and edit global settings inline
**So that** I can configure the platform without separate forms

#### Acceptance Criteria

- [ ] Page at `/settings/config` renders:
  - Settings grouped by category (BILLING, SECURITY, LOCALIZATION, NOTIFICATIONS, SYSTEM, COMPLIANCE) in accordion sections
  - Each section: header with icon + description, expandable
  - Settings within: key-value rows; click value to edit inline; type-specific editors (toggle for boolean, number input, text input, JSON editor)
  - "Last updated by [name] on [date]" hint per setting
  - Unsaved changes: floating "Save All" button appears at bottom
- [ ] Maintenance Mode section:
  - Active maintenance: amber banner with countdown
  - "Schedule Maintenance" button → modal (title AR/EN, description AR/EN, start/end datetime)
  - Upcoming maintenance list with cancel buttons
- [ ] Typecheck passes
- [ ] Verify in browser: edit a setting inline, save, maintenance modal works

---

### US-037: Feature flag matrix page

**As a** platform admin
**I want** a visual matrix to toggle feature flags per tenant
**So that** I can control feature access across all facilities

#### Acceptance Criteria

- [ ] Page at `/settings/feature-flags` renders a matrix:
  - Rows: tenants (with plan badge) — searchable/filterable
  - Columns: feature flags grouped by category
  - Cells: toggle switches (green=enabled, gray=disabled)
  - Override highlighting: cells overriding plan default have amber border (enabled override) or red border (disabled override)
  - Hover cell tooltip: "Overridden — plan default is [enabled/disabled]"
  - Sticky first column (tenant names) and header row (feature names)
- [ ] Bulk actions: "Enable for all on [Plan]", "Reset overrides for [Tenant]"
- [ ] Gradual rollout: select feature → "Rollout" button → percentage slider showing affected tenants
- [ ] Typecheck passes
- [ ] Verify in browser: toggles work, overrides highlighted, sticky headers on scroll

---

### US-038: Knowledge base page with search

**As a** platform admin
**I want** a searchable knowledge base with category filtering
**So that** facility admins can find help articles

#### Acceptance Criteria

- [ ] Page at `/knowledge-base` renders:
  - Left sidebar: category list (GETTING_STARTED, BILLING, FEATURES, TROUBLESHOOTING, API, FAQ, BEST_PRACTICES) with article counts; click filters list
  - Main content: article card list (title, 2-line preview, category badge, status badge, view count, helpful/not-helpful ratio)
  - Search bar: instant search with highlighted matches in results
  - Sort: newest, popular, most helpful
  - "New Article" button → full-page markdown editor with split view (edit left / preview right), tabs for EN/AR content, metadata sidebar (slug auto-gen, publish date, stats), "Preview as Facility Admin" button
- [ ] Typecheck passes
- [ ] Verify in browser: search filters articles, category sidebar works, editor renders preview

---

### US-039: Compliance dashboard with ZATCA gauge

**As a** compliance officer
**I want** contract tracking and ZATCA compliance monitoring
**So that** I can ensure regulatory compliance

#### Acceptance Criteria

- [ ] Page at `/compliance` renders 3 tabs: Contracts | ZATCA | Data Requests
  - Contracts tab: KPIs (Active, Expiring 30d amber, Expired red, Pending Signature), DataTable (contract #, tenant, type badge, status badge, start/end dates, auto-renew toggle icon, actions), expiring rows highlighted
  - ZATCA tab: large animated circular compliance gauge (>95%=green, 80-95%=amber, <80%=red), stats row (Submitted, Accepted, Rejected, Pending), issues DataTable (tenant, rejected count, pending count, last issue, "Retry" button per invoice), ZATCA activity area chart
  - Data Requests tab: pending requests list (tenant, date, type, status), approve/deny actions with confirmation, approved requests show download link + expiry
- [ ] Typecheck passes
- [ ] Verify in browser: ZATCA gauge animates on load, tabs switch, contract highlighting works

---

### US-040: Notification center dropdown

**As a** platform user
**I want** a notification center accessible from the header
**So that** I can see recent notifications without leaving my current page

#### Acceptance Criteria

- [ ] Clicking bell icon in Header opens dropdown panel (right-aligned, left in RTL)
- [ ] Notification list: icon + title + description + relative time + read/unread state (unread = bold + blue dot)
- [ ] Click notification: navigate to relevant page + mark read via API
- [ ] "Mark All Read" button at top
- [ ] Grouped by: Today, Earlier This Week, Older
- [ ] Empty state: "You're all caught up! 🎉"
- [ ] Badge on bell icon: unread count (max "99+"), spring bounce animation on new arrival
- [ ] Panel animates in: scale + fade from top-right (top-left in RTL)
- [ ] Typecheck passes
- [ ] Verify in browser: bell opens panel, notifications display grouped, marking read works

---

### US-041: Responsive design pass for all pages

**As a** user on tablet or mobile
**I want** the dashboard to be fully usable on smaller screens
**So that** I can manage the platform from any device

#### Acceptance Criteria

- [ ] Test and fix all pages at 4 breakpoints: 1440px (wide), 1024px (desktop), 768px (tablet), 375px (mobile)
- [ ] Sidebar: ≥1024px full, 768-1024px collapsed icons-only, <768px hidden with hamburger drawer
- [ ] KPI grids: 4→2→1 columns across breakpoints
- [ ] DataTables: <768px switch to card layout or show expand-on-click row detail for hidden columns
- [ ] Split panels (tickets): <1024px full-width list, click opens separate detail page
- [ ] Charts: stack vertically on mobile, use ResponsiveContainer
- [ ] Forms: multi-column → single column on mobile
- [ ] Slide-over panels: full-screen on mobile
- [ ] Typecheck passes
- [ ] Verify in browser at each breakpoint: no overflow, no cut-off content, all interactions work

---

### US-042: RTL polish pass for all pages

**As an** Arabic-speaking user
**I want** perfect RTL layout on every page
**So that** the dashboard feels native in Arabic

#### Acceptance Criteria

- [ ] Switch to Arabic and verify EVERY page:
  - Sidebar flips to right side; active border on right
  - All text alignment uses logical properties (start/end, not left/right)
  - Direction-implying icons (arrows, chevrons) flip
  - Charts: axis labels render correctly in Arabic
  - Numbers stay as Western Arabic numerals (1,2,3) — standard for Saudi business software
  - Currency: "SAR" prefix in EN, "ر.س" suffix in AR
  - Tables: action buttons move to left side in RTL
  - Breadcrumb separator direction flips
  - Slide-over panels open from left in RTL
  - Search icon position flips
  - Notification panel opens from left in RTL
  - All Framer Motion directional animations mirror (fadeInLeft ↔ fadeInRight)
- [ ] No text overflow or cut-off in Arabic (Arabic text tends to be wider)
- [ ] Mixed content (Arabic + English like "خطة PROFESSIONAL") renders correctly
- [ ] Typecheck passes
- [ ] Verify in browser: full walkthrough in Arabic mode

---

### US-043: Accessibility and performance pass

**As a** user with accessibility needs
**I want** the dashboard to be keyboard-navigable and screen-reader friendly
**So that** I can use it regardless of ability

#### Acceptance Criteria

- [ ] Keyboard navigation: logical tab order on all pages; sidebar arrow keys + Enter; DataTable arrow keys between rows; modals have focus trap + Esc close; focus returns to trigger on modal close
- [ ] Custom focus ring: 2px amber outline with 2px offset, focus-visible only (not on mouse click)
- [ ] Screen reader: all icons/images have aria-label; status badges have aria-label="Status: Active"; charts provide sr-only text summary; loading states use aria-live="polite"
- [ ] Color contrast: all text meets WCAG AA (4.5:1 normal, 3:1 large) in both light and dark mode
- [ ] Status indicators use both color AND icon/shape (not color-only)
- [ ] All Framer Motion animations check prefers-reduced-motion and disable if set
- [ ] Performance: React.lazy on all feature routes verified; React Query staleTime configured (dashboard 5min, lists 2min, detail 1min, config 10min); long lists (audit logs) virtualized with @tanstack/react-virtual; search inputs debounced 300ms
- [ ] `npm run build` produces no chunks >250KB
- [ ] Typecheck passes

---

### US-044: Global error handling and loading states review

**As a** user
**I want** consistent error handling and loading feedback across the app
**So that** I always know the state of operations

#### Acceptance Criteria

- [ ] Every page with data loading has appropriate LoadingSkeleton matching content shape
- [ ] Every API error shows toast with user-friendly message (localized AR/EN, not raw error)
- [ ] 401 responses redirect to /login with "Session expired" toast
- [ ] 403 responses show "You don't have permission" toast
- [ ] Network disconnect shows persistent top banner: "Connection lost. Retrying..." with countdown
- [ ] Every list page has EmptyState with contextual message and action button
- [ ] Every failed API call shows retry button
- [ ] No layout shift when loading completes (skeletons match content dimensions)
- [ ] Typecheck passes
- [ ] Verify in browser: disconnect network to see banner, trigger errors to see toasts

---

### US-045: Design system showcase page

**As a** developer
**I want** a living design system page
**So that** I can reference all components, tokens, and patterns in one place

#### Acceptance Criteria

- [ ] Page at `/design-system` renders:
  - Color palette: all CSS variable colors displayed as swatches with names and hex values (light + dark)
  - Typography: font families with sample text in both English and Arabic, all sizes
  - Spacing: visual scale of spacing tokens
  - Components showcase: StatCard (with mock data, loading state), KPIGrid, DataTable (with sorting/pagination demo), StatusBadge (all variants and statuses), EmptyState, LoadingSkeleton (all variants), ConfirmDialog (trigger button), SearchInput, DateRangePicker, FilterBar, Timeline (with sample events), Toast triggers (all types), Chart examples (area, bar, pie)
  - Animation showcase: buttons that trigger each motion preset
- [ ] Page is only accessible in development (hidden from sidebar in production)
- [ ] Typecheck passes
- [ ] Verify in browser: all components render correctly, interactive demos work
