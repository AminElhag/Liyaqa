# 🎨 Liyaqa Platform Dashboard — Frontend Ralph Loop AI Coding Automation

## Overview

This is the **Frontend Ralph Loop** companion to the Backend Ralph Loop. It builds a world-class Platform Dashboard UI with exceptional UI/UX quality. Each phase maps 1:1 to the backend phases, consuming the APIs built there.

**Tech Stack:** React 18 + TypeScript · Vite · TailwindCSS v4 · Shadcn/UI · Framer Motion · React Query (TanStack) · React Router v6 · Zustand · Recharts · React Hook Form + Zod · i18next (AR/EN)

**Design Philosophy:** Enterprise SaaS with a premium, editorial feel. Think: Linear meets Stripe Dashboard — clean data density, purposeful motion, bilingual-first (RTL Arabic / LTR English).

---

## How to Use This Document

1. Open Claude Code in your Liyaqa frontend project root
2. Copy each **`PROMPT`** block into Claude Code **one at a time**
3. Each prompt builds on the previous — follow the order strictly
4. **`✅ CHECKPOINT`** — visually verify in browser before proceeding
5. Each phase produces working, navigable screens

---

## PHASE 0: Foundation — Design System & Project Setup

### Prompt 0.1 — Project Scaffolding

```
Create a new React + TypeScript + Vite project for the Liyaqa Platform Dashboard.

Setup:
1. Initialize with: npm create vite@latest liyaqa-platform-dashboard -- --template react-ts
2. Install dependencies:
   - tailwindcss @tailwindcss/vite (v4)
   - @shadcn/ui (latest) — init with "new-york" style, slate base color, CSS variables: yes
   - framer-motion
   - @tanstack/react-query @tanstack/react-table
   - react-router-dom@6
   - zustand
   - recharts
   - react-hook-form @hookform/resolvers zod
   - i18next react-i18next
   - lucide-react
   - date-fns
   - axios
   - clsx tailwind-merge
   - @dnd-kit/core @dnd-kit/sortable (for Kanban board)

3. Project structure:
src/
├── api/              # API client, interceptors, endpoint definitions
│   ├── client.ts     # Axios instance with auth interceptors
│   ├── endpoints/    # One file per backend module
│   └── types/        # API request/response types (mirror backend DTOs)
├── assets/           # Static assets, fonts, images
│   └── fonts/        
├── components/       # Shared components
│   ├── ui/           # Shadcn components (auto-generated)
│   ├── layout/       # Shell, Sidebar, Header, Breadcrumbs
│   ├── data/         # DataTable, StatCard, KPICard, Charts
│   ├── feedback/     # Toast, AlertDialog, EmptyState, LoadingSkeleton
│   └── forms/        # FormField, SearchInput, DateRangePicker, FileUpload
├── features/         # Feature modules (1:1 with backend)
│   ├── auth/         
│   ├── deals/        
│   ├── tenants/      
│   ├── subscriptions/
│   ├── tickets/      
│   ├── access/       
│   ├── monitoring/   
│   ├── communication/
│   ├── analytics/    
│   ├── config/       
│   ├── content/      
│   └── compliance/   
├── hooks/            # Custom hooks (useDebounce, useMediaQuery, etc.)
├── i18n/             # Translation files
│   ├── en/           
│   └── ar/           
├── lib/              # Utilities (cn, formatters, validators)
├── stores/           # Zustand stores
├── styles/           # Global CSS, theme variables
├── types/            # Shared TypeScript types
└── App.tsx           # Router + providers

4. Configure path aliases: @ → src/
5. Setup TailwindCSS v4 with @tailwindcss/vite plugin
6. Create a .env file with VITE_API_BASE_URL=http://localhost:8080/api/v1/platform
```

### Prompt 0.2 — Design System & Theme

```
Create the Liyaqa Platform Dashboard design system. This is the foundation for EVERYTHING that follows.

DESIGN DIRECTION:
- Premium enterprise SaaS — sophisticated but not cold
- Color: Deep navy (#0A1628) as primary dark, warm amber (#F59E0B) as accent, clean whites
- Inspired by: Linear's density + Stripe's clarity + Vercel's dark mode elegance
- Arabic-first: full RTL support, Arabic typography must look as polished as English

1. Create src/styles/theme.css with CSS variables:

:root {
  /* Core palette */
  --color-bg-primary: #FAFBFC;
  --color-bg-secondary: #F1F3F5;
  --color-bg-tertiary: #FFFFFF;
  --color-bg-elevated: #FFFFFF;
  --color-bg-inverse: #0A1628;
  
  /* Text */
  --color-text-primary: #0A1628;
  --color-text-secondary: #4A5568;
  --color-text-tertiary: #8B95A5;
  --color-text-inverse: #FFFFFF;
  --color-text-accent: #F59E0B;
  
  /* Brand */
  --color-brand-primary: #0A1628;
  --color-brand-accent: #F59E0B;
  --color-brand-accent-hover: #D97706;
  --color-brand-accent-subtle: #FEF3C7;
  
  /* Status colors */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(10, 22, 40, 0.04);
  --shadow-md: 0 4px 12px rgba(10, 22, 40, 0.06);
  --shadow-lg: 0 8px 24px rgba(10, 22, 40, 0.08);
  --shadow-glow: 0 0 20px rgba(245, 158, 11, 0.15);
  
  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* Spacing scale (8px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  
  /* Typography */
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-arabic: 'IBM Plex Sans Arabic', 'Plus Jakarta Sans', sans-serif;
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Dark mode variant */
[data-theme="dark"] {
  --color-bg-primary: #0A1628;
  --color-bg-secondary: #111D2E;
  --color-bg-tertiary: #162236;
  --color-bg-elevated: #1A2942;
  --color-bg-inverse: #FAFBFC;
  --color-text-primary: #E8ECF1;
  --color-text-secondary: #8B95A5;
  --color-text-tertiary: #5A6578;
  --color-text-inverse: #0A1628;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.25);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* RTL support */
[dir="rtl"] {
  font-family: var(--font-arabic);
}

2. Load fonts from Google Fonts: Plus Jakarta Sans (400,500,600,700), IBM Plex Sans Arabic (400,500,600,700), JetBrains Mono (400,500)

3. Create tailwind theme extension to map these CSS variables

4. Customize Shadcn components to match the design system:
   - Override button styles: primary = navy with amber hover glow, secondary = outlined
   - Cards: subtle border, no heavy shadows, 12px radius
   - Inputs: 40px height, subtle focus ring with amber
   - Badges: pill-shaped, pastel backgrounds with saturated text

5. Create motion presets in src/lib/motion.ts:
   - fadeIn, fadeInUp, fadeInDown, fadeInLeft, fadeInRight
   - scaleIn (for cards), slideIn (for panels)
   - staggerContainer + staggerItem (for lists)
   - pageTransition (for route changes)
   - All presets should respect prefers-reduced-motion

6. Create a ThemeProvider with dark/light mode toggle + persist to localStorage
7. Create a DirectionProvider for RTL/LTR toggle synced with i18n language

Build a /design-system route that shows ALL tokens, colors, typography, components in a living style guide.
```

### Prompt 0.3 — Layout Shell & Navigation

```
Build the main application shell — the layout that wraps every page.

Design reference: Linear app sidebar + Stripe dashboard header.

Components to create:

1. src/components/layout/AppShell.tsx
   - Full-height layout: Sidebar (left/right based on direction) + Main content area
   - Sidebar width: 260px expanded, 72px collapsed
   - Smooth collapse/expand animation with Framer Motion
   - Persist sidebar state in localStorage
   - On mobile (<768px): sidebar becomes a slide-over drawer

2. src/components/layout/Sidebar.tsx
   Navigation structure:
   
   OVERVIEW
   ├── Dashboard (home icon)
   
   SALES
   ├── Deal Pipeline (kanban icon)
   
   TENANTS
   ├── All Facilities (building icon)
   ├── Onboarding (clipboard-check icon)
   
   BILLING
   ├── Subscriptions (credit-card icon)
   ├── Plans & Pricing (layers icon)
   ├── Invoices (receipt icon)
   
   SUPPORT
   ├── Tickets (message-circle icon)
   ├── Knowledge Base (book-open icon)
   
   MONITORING
   ├── Facility Health (activity icon)
   ├── Audit Logs (scroll icon)
   ├── System Status (server icon)
   
   COMMUNICATION
   ├── Announcements (megaphone icon)
   ├── Notifications (bell icon)
   
   SETTINGS
   ├── Team (users icon)
   ├── API Keys (key icon)
   ├── Configuration (settings icon)
   ├── Feature Flags (toggle-left icon)
   ├── Compliance (shield icon)
   
   Design details:
   - Active item: amber left border (right border in RTL), subtle amber bg tint
   - Hover: smooth bg transition
   - Section headers: uppercase, tiny, muted text with generous top margin
   - Collapsed state: show only icons with tooltips
   - Bottom of sidebar: user avatar + name + role, theme toggle, language toggle
   - Liyaqa logo at top with Arabic calligraphy variant

3. src/components/layout/Header.tsx
   - Breadcrumb trail (auto-generated from route)
   - Global search (Cmd+K) — opens a Command Palette overlay
   - Notification bell with unread badge (animated pulse)
   - Quick actions dropdown
   - Current user menu (profile, preferences, logout)

4. src/components/layout/CommandPalette.tsx
   - Full-screen overlay with search input
   - Fuzzy search across: navigation pages, recent tenants, recent tickets, actions
   - Keyboard navigation (arrow keys, enter to select, esc to close)
   - Grouped results with icons
   - Animate: scale + fade in (Framer Motion)
   - Design: centered modal with frosted glass backdrop

5. src/components/layout/Breadcrumbs.tsx
   - Auto-derive from React Router nested routes
   - Support dynamic segments (e.g., tenant name instead of ID)
   - Arabic translation for each crumb

6. Page transition wrapper:
   - Wrap <Outlet /> with Framer Motion AnimatePresence
   - Pages fade in from bottom (subtle, 200ms)
   - Exit: fade out (100ms)

Routing setup in App.tsx:
   - /dashboard → Overview
   - /deals → Deal Pipeline
   - /tenants → Tenant List
   - /tenants/:id → Tenant Detail
   - /tenants/:id/onboarding → Onboarding Wizard
   - /subscriptions → Subscription Management
   - /subscriptions/plans → Plan Management
   - /billing/invoices → Invoice List
   - /tickets → Ticket List
   - /tickets/:id → Ticket Detail
   - /monitoring/health → Facility Health
   - /monitoring/audit → Audit Logs
   - /monitoring/system → System Status
   - /announcements → Announcements
   - /settings/team → Team Management
   - /settings/api-keys → API Keys
   - /settings/config → Configuration
   - /settings/feature-flags → Feature Flag Matrix
   - /compliance → Compliance Dashboard
   - /analytics → Analytics (alias to /dashboard)
   - /knowledge-base → Knowledge Base
   - /design-system → Design System (dev only)

All routes should show placeholder pages with the page title for now.
Use React.lazy + Suspense for code-splitting every feature route.
```

### Prompt 0.4 — Shared Components Library

```
Build the shared component library that all feature pages will use. These must be POLISHED — they are the building blocks of the entire dashboard.

1. src/components/data/StatCard.tsx
   A metric card used on dashboards. Props: label, value, change (%), trend (up/down), icon, loading.
   - Large bold value, small muted label above
   - Trend indicator: green up arrow or red down arrow with percentage
   - Subtle hover: lift shadow + slight scale
   - Loading state: Skeleton pulse animation
   - Entrance animation: fade in + slide up with stagger delay prop
   - Design: clean white card, thin border, 12px radius

2. src/components/data/KPIGrid.tsx
   Responsive grid of StatCards. 4 columns on desktop, 2 on tablet, 1 on mobile.
   - Staggered entrance animation (each card 50ms delay)
   - Props: items[], loading, columns

3. src/components/data/DataTable.tsx (wraps TanStack Table)
   Full-featured data table. Props: columns, data, loading, pagination, onRowClick, searchable, filters, selectable, emptyState.
   - Column sorting (click header, arrow indicator)
   - Built-in search bar (debounced, 300ms)
   - Filter chips below search (removable)
   - Row selection with checkboxes (bulk actions toolbar slides in from bottom)
   - Pagination: "Showing 1-10 of 234" + prev/next + page size selector
   - Loading state: shimmer skeleton rows
   - Empty state: centered illustration + message + action button
   - Row hover: subtle bg change
   - Sticky header on scroll
   - Responsive: horizontal scroll on mobile with frozen first column
   - Support for custom cell renderers (status badges, avatars, actions menu)

4. src/components/data/StatusBadge.tsx
   Colored badge for entity statuses. Props: status, variant (dot/pill/outline), size.
   - Each status maps to a color: ACTIVE=green, SUSPENDED=amber, DEACTIVATED=red, etc.
   - Dot variant: small colored circle + text
   - Pill variant: colored background + white text
   - Subtle pulse animation for "live" statuses (e.g., PROVISIONING)

5. src/components/data/Chart.tsx (wraps Recharts)
   Reusable chart components:
   - AreaChart: gradient fill, smooth curves, custom tooltip
   - BarChart: rounded corners on bars, hover highlight
   - PieChart: donut style, center label, animated segments
   - Custom tooltip: frosted glass card with formatted values
   - All charts use theme colors from CSS variables
   - Loading state: skeleton
   - Responsive container that auto-resizes

6. src/components/feedback/EmptyState.tsx
   Props: icon, title, description, action (button).
   - Centered layout, muted icon (64px), descriptive text
   - Optional CTA button
   - Subtle fade-in animation

7. src/components/feedback/LoadingSkeleton.tsx
   Configurable skeleton. Props: variant (text/card/table/chart), rows, columns.
   - Smooth shimmer animation (gradient sweep)
   - Match exact dimensions of the content it replaces

8. src/components/feedback/ConfirmDialog.tsx
   Reusable confirmation modal. Props: title, description, confirmText, confirmVariant (danger/default), onConfirm, onCancel.
   - Animate: backdrop fade + modal scale-in
   - Danger variant: red confirm button
   - Focus trap + esc to close

9. src/components/forms/SearchInput.tsx
   Props: placeholder, value, onChange, onClear, loading.
   - Search icon left, clear X button right
   - Loading spinner when searching
   - Debounce built-in (configurable delay)

10. src/components/forms/DateRangePicker.tsx
    Props: value, onChange, presets.
    - Calendar popup with range selection
    - Preset buttons: Today, Last 7 days, Last 30 days, This month, This quarter, Custom
    - Display selected range as formatted text

11. src/components/forms/FilterBar.tsx
    Props: filters (array of filter configs), activeFilters, onChange.
    - Horizontal row of dropdown filters
    - Active filters shown as removable chips
    - "Clear all" button when any filter active
    - Filter count badge

12. src/components/data/Timeline.tsx
    Vertical timeline for activity logs. Props: items[].
    - Left: timestamp, Right: content card
    - Connecting line between items
    - Different icons per event type
    - Animate items in on scroll

All components must:
- Support both RTL and LTR
- Use CSS variables for theming (dark/light)
- Have TypeScript props with JSDoc comments
- Use Framer Motion for animations (respect prefers-reduced-motion)
- Be accessible (ARIA labels, keyboard navigation, focus management)

Create a showcase page at /design-system that renders every component with sample data.
```

> ✅ **CHECKPOINT 0:** App runs. Sidebar navigates between placeholder pages. Design system page shows all components. Dark mode toggles. Arabic/English switches with RTL. All animations smooth.

---

## PHASE 1: Deal Pipeline & Tenant Management UI

### Prompt 1.1 — Kanban Deal Pipeline

```
Build the Deal Pipeline page at /deals under src/features/deals/.

This is a KANBAN board — the centerpiece of the sales workflow. Make it feel as good as Linear or Notion boards.

API integration (create api hooks):
- src/api/endpoints/deals.ts — all deal endpoints
- src/features/deals/hooks/useDeals.ts — React Query hooks

Page: src/features/deals/pages/DealPipelinePage.tsx

Layout:
- Top bar: "Deal Pipeline" title + "New Deal" button (amber, prominent) + view toggle (Kanban / Table)
- Kanban view (default):
  - Horizontal scrollable columns, one per DealStage
  - Column headers: stage name + deal count + total value (SAR)
  - Cards inside columns, draggable between columns (@dnd-kit)
  - Column backgrounds: alternating very subtle tints
  
- Table view (toggle):
  - Use DataTable component with all deal fields
  - Row click opens deal detail

Kanban Card (src/features/deals/components/DealCard.tsx):
- Compact card (don't make it too tall):
  - Facility name (bold, primary)
  - Contact name (small, secondary)
  - Value: "SAR 25,000" (amber accent text)
  - Source badge (small pill)
  - Assigned avatar (small circle, bottom right)
  - Days in stage indicator (subtle, e.g., "3d")
- Hover: subtle lift + shadow
- Dragging: card lifts higher, slight rotation, drop shadow expands
- Drop zone: column highlights with dashed border when dragging over it

Drag & Drop:
- Use @dnd-kit/core + @dnd-kit/sortable
- Dropping a card to a new column = PUT /deals/{id}/stage API call
- Optimistic update: move card immediately, revert on error
- Success: subtle green flash on card
- Error: card snaps back with shake animation + toast error

New Deal Modal (src/features/deals/components/DealFormModal.tsx):
- Slide-in panel from right (not a centered modal)
- Form fields: facilityName, contactName, contactEmail, contactPhone, source (select), estimatedValue, expectedCloseDate, notes
- Use React Hook Form + Zod validation
- Required fields marked with amber asterisk
- Submit: loading state on button → success toast → panel closes → board updates

Pipeline Metrics Bar (above the board):
- 4 StatCards in a row:
  - Total Deals (count)
  - Pipeline Value (sum SAR, formatted)
  - Conversion Rate (%)
  - Avg. Cycle Time (days)
- Data from GET /deals/metrics

Column collapse: click column header to collapse/expand (saves space).
Filtering: filter by assignedTo, source, dateRange (affects both views).

Make the drag interaction FEEL premium — smooth spring animations, clear visual feedback.
```

### Prompt 1.2 — Tenant List & Detail Pages

```
Build Tenant Management pages under src/features/tenants/.

API: src/api/endpoints/tenants.ts + React Query hooks

PAGE 1: Tenant List (/tenants)
src/features/tenants/pages/TenantListPage.tsx

- Top bar: "Facilities" title + "Add Facility" button + search + filters
- KPI row (4 StatCards):
  - Total Facilities, Active, Trial, Suspended
- DataTable with columns:
  - Facility Name (+ Arabic name below in muted text)
  - Status (StatusBadge)
  - Plan (pill badge)
  - Members (count)
  - Region/City
  - Onboarding Progress (mini progress bar, e.g., "5/7")
  - Last Admin Login (relative time: "2 hours ago")
  - Actions (3-dot menu: View, Impersonate, Suspend, Edit)
- Filters: status, plan, region, dateRange
- Row click → navigate to /tenants/:id
- Empty state when no results

PAGE 2: Tenant Detail (/tenants/:id)
src/features/tenants/pages/TenantDetailPage.tsx

This is a DENSE information page. Use a tab layout to organize.

Header section (always visible):
- Facility name (large) + Arabic name + status badge
- Quick stats row: Members | Staff | Branches | Plan | MRR
- Action buttons: Impersonate, Edit, Suspend/Activate (contextual), Export Data
- Breadcrumb: Facilities > [Facility Name]

Tabs:
1. OVERVIEW
   - 2-column layout
   - Left: Facility info card (name, CR, VAT, contact, address, region)
   - Right: Subscription card (plan, billing cycle, next billing, auto-renew toggle)
   - Below: Recent activity timeline (last 10 events from audit log)
   
2. ONBOARDING
   - Stepper/checklist visualization
   - Each step: icon + title + status (complete/pending/in-progress)
   - Completed steps: green checkmark with strikethrough
   - Current step: highlighted with pulse dot
   - Action button per step to mark complete
   - Overall progress percentage at top
   
3. BILLING
   - Invoice list (DataTable: number, date, amount, status, ZATCA status)
   - Payment history
   - Revenue chart (monthly bar chart)
   
4. SUPPORT
   - Ticket list for this tenant (DataTable: number, subject, priority, status, assignee)
   - Quick "Create Ticket" button
   
5. ACTIVITY
   - Full audit log timeline for this tenant
   - Filterable by action type
   
6. SETTINGS
   - Feature flag overrides (toggle switches per feature)
   - API keys for this tenant
   - Danger zone: Suspend, Deactivate, Archive (with confirmation dialogs)

Tab navigation should be horizontal pills, not traditional tabs. Active tab has amber bottom border. Content transitions with subtle fade.

Create a reusable TenantQuickView component — a compact card/popover that shows tenant summary on hover over any tenant name link throughout the app.
```

### Prompt 1.3 — Facility Onboarding Wizard

```
Build a guided onboarding wizard at /tenants/:id/onboarding.

This is used when converting a won deal into a new tenant. Make it feel GUIDED and CELEBRATORY.

src/features/tenants/pages/OnboardingWizardPage.tsx

Steps:
1. FACILITY DETAILS
   - Form: name, nameAr, subdomain, crNumber, vatNumber, address, city, region
   - Live subdomain preview: "facilityname.liyaqa.com"
   - CR/VAT validation (Saudi format)
   
2. ADMIN ACCOUNT
   - Form: admin name, email, phone, temporary password (auto-generate button)
   - "This person will receive the welcome email"
   
3. SUBSCRIPTION PLAN
   - Plan comparison cards (3 side-by-side, current selection highlighted)
   - Feature comparison matrix below
   - Billing cycle toggle: Monthly / Annual (show savings badge "Save 20%")
   
4. INITIAL CONFIGURATION
   - Default language (AR/EN)
   - Timezone
   - Currency (default SAR)
   - Business type (Gym, Studio, Pool, Multi-sport, Other)
   - Operating hours
   
5. REVIEW & LAUNCH
   - Summary of all entered data in a clean card layout
   - "Everything looks good?" confirmation
   - "Launch Facility" button (prominent, amber, with rocket icon)

Wizard UI:
- Top: horizontal step indicator with numbered circles + connecting lines
- Completed steps: green filled circles with checkmarks
- Current step: amber ring with pulse animation
- Steps are clickable to go back (but can't skip ahead)
- Bottom: "Back" and "Continue" buttons (Continue = amber, Back = ghost)
- Form validation on each step before allowing next

Launch animation:
When "Launch Facility" is clicked and succeeds:
- Confetti animation (subtle, short burst — 2 seconds)
- Success overlay: "🎉 [Facility Name] is Live!" with large text
- "View Facility" and "Back to Pipeline" buttons
- The overlay fades in with scale animation

Progress auto-saves to backend (PUT /tenants/{id}/onboarding/{step}).
```

> ✅ **CHECKPOINT 1:** Kanban board has smooth drag-and-drop. Tenant list loads with pagination. Tenant detail shows all tabs. Onboarding wizard completes end-to-end with confetti. All RTL-compatible.

---

## PHASE 2: Subscription & Billing UI

### Prompt 2.1 — Plan Management & Comparison

```
Build subscription management under src/features/subscriptions/.

PAGE 1: Plan Management (/subscriptions/plans)
src/features/subscriptions/pages/PlanManagementPage.tsx

- Visual plan cards (not a table) — 4 cards side by side:
  - FREE TRIAL: light gray bg
  - STARTER: white bg
  - PROFESSIONAL: subtle amber gradient border (recommended badge)
  - ENTERPRISE: dark navy bg with light text
  
- Each card shows:
  - Plan name (Arabic below)
  - Monthly price (large) + annual price (small, with savings badge)
  - Key limits: members, staff, branches, storage
  - Feature checklist (checkmarks in green, X in muted for unavailable)
  - "Edit Plan" button (ghost)
  - Active tenant count badge at bottom

- "Create Plan" button opens slide-over panel with form
- Plan edit: same slide-over panel, pre-filled
- Feature comparison matrix below cards:
  - Left column: feature names grouped by category
  - Columns: each plan
  - Cells: checkmark or dash
  - Sticky left column, horizontal scroll if needed

PAGE 2: Subscription Dashboard (/subscriptions)
src/features/subscriptions/pages/SubscriptionDashboardPage.tsx

- KPI row:
  - MRR (SAR), ARR (SAR), Avg Revenue/Tenant, Active Subscriptions
- Revenue trend chart (area chart, last 12 months)
- Subscription distribution pie chart (by plan)

- DataTable: Active Subscriptions
  - Columns: Tenant, Plan, Status (badge), Billing Cycle, Next Billing, MRR, Actions
  - Quick actions: Change Plan, Cancel, Renew

- Alerts section at top (if any):
  - Expiring trials (amber alert bar, clickable)
  - Overdue payments (red alert bar)
  - Upcoming renewals (blue info bar)

Change Plan Modal:
- Current plan shown on left, available plans on right
- Proration calculator: "Upgrading from Starter to Professional. Prorated charge: SAR X"
- Effective date selector: Immediately / End of current period
- Confirm button with amount shown
```

### Prompt 2.2 — Invoice Management

```
Build invoice management at /billing/invoices under src/features/subscriptions/.

PAGE: Invoice List (/billing/invoices)
src/features/subscriptions/pages/InvoiceListPage.tsx

- KPI row:
  - Total Outstanding (SAR), Overdue Amount (SAR), Paid This Month, ZATCA Compliance %
- Filters: status, tenant, dateRange, ZATCA status
- DataTable:
  - Columns: Invoice # (monospace font), Tenant, Amount (SAR, right-aligned), VAT, Total, Status (badge), ZATCA Status (badge), Issue Date, Due Date, Actions
  - Status colors: DRAFT=gray, ISSUED=blue, PAID=green, OVERDUE=red (row has subtle red left border), CANCELLED=muted
  - Actions: View, Mark Paid, Download PDF, Retry ZATCA

Invoice Detail Modal (slide-over):
- Invoice header: number, date, status badge
- From: Liyaqa platform info
- To: Tenant billing info
- Line items table
- Subtotal, VAT (15%), Total
- Payment history
- ZATCA submission status + hash
- Actions at bottom: Mark Paid, Send Reminder, Download

"Mark Paid" flow:
- Opens sub-modal: payment method (Bank Transfer / Cash / Other), reference number, date
- Confirm → updates status → success toast

Design the invoice data to look like a REAL invoice preview — clean, professional, with Liyaqa branding.
```

> ✅ **CHECKPOINT 2:** Plan cards render beautifully with comparison matrix. Subscription dashboard shows revenue charts. Invoice list with filtering works. Mark-paid flow completes. RTL numbers right-aligned correctly.

---

## PHASE 3: Ticketing System UI

### Prompt 3.1 — Ticket Management Interface

```
Build the ticketing system under src/features/tickets/.

PAGE 1: Ticket List (/tickets)
src/features/tickets/pages/TicketListPage.tsx

Layout: Split-panel view (like email clients — Superhuman/Gmail inspired)
- Left panel (40% width): ticket list
- Right panel (60% width): selected ticket detail
- Resizable divider between panels

Left Panel — Ticket List:
- Top: search + filter buttons (status, priority, category, assignee, tenant)
- Filter presets: "My Tickets", "Unassigned", "SLA Breached", "All Open"
- Ticket cards (compact):
  - Ticket number (monospace, small)
  - Subject (bold, truncated)
  - Tenant name (small, muted)
  - Priority indicator (colored left border: CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=gray)
  - Status badge (small)
  - Assignee avatar (tiny circle)
  - Time: "2h ago" or SLA countdown in red if breaching
  - Unread indicator: blue dot
- Selected ticket: highlighted row
- Click to load detail in right panel

Right Panel — Ticket Detail:
- Header: ticket number + subject + status
- Meta bar: priority select, status select, category select, assignee select (all inline-editable dropdowns)
- SLA indicator: "Response due in 2h 15m" or "⚠️ SLA BREACHED" (red, pulsing)
- Tenant info: compact card (name, plan, link to tenant detail)

Message thread:
- Chat-style messages (bubbles)
- Customer messages: left-aligned, light bg
- Agent messages: right-aligned (left in RTL), slightly different bg
- Internal notes: highlighted with amber left border + "🔒 Internal Note" label + dashed border
- Each message: sender name, avatar, timestamp, content
- Rich text content support
- Attachment thumbnails

Reply area (bottom):
- Rich text editor (basic: bold, italic, lists, links)
- Toggle: "Reply" / "Internal Note" (note shows amber styling)
- "Insert Canned Response" dropdown
- "Attach File" button
- Send button (amber)
- Keyboard shortcut: Cmd+Enter to send

Ticket Actions Bar:
- Assign to Me
- Escalate
- Change Priority
- Close / Reopen
- Merge (select another ticket to merge into)

Status transitions should show visual feedback:
- Resolving: green flash + confetti (tiny, subtle)
- Escalating: amber warning pulse
- SLA breach: shake animation on the timer

PAGE 2: Ticket Analytics (/tickets/analytics route or tab)
- Agent performance table (name, open tickets, avg resolution, satisfaction score with stars)
- Tickets by category (donut chart)
- Tickets over time (area chart, with SLA breach overlay)
- SLA compliance gauge (circular progress: green >90%, amber >70%, red <70%)
```

> ✅ **CHECKPOINT 3:** Split-panel ticket view works. Messages render correctly (customer/agent/internal). Canned responses load. SLA countdown displays. Analytics charts render. RTL message alignment correct.

---

## PHASE 4: Access Management & Impersonation UI

### Prompt 4.1 — Impersonation & Team Management

```
Build access management under src/features/access/.

IMPERSONATION FLOW:
When a platform user clicks "Impersonate" on a tenant:

1. Confirmation modal:
   - "You are about to view [Facility Name]'s dashboard as their admin"
   - Purpose field (required textarea): "Why are you impersonating?"
   - Warning: "This session is read-only and fully audited"
   - "Start Session" button + "Cancel"

2. On confirm → POST /access/impersonate
   - Loading state: "Establishing secure session..."
   - Success: redirect to /impersonation-active

3. Impersonation Active Bar:
   src/components/layout/ImpersonationBar.tsx
   - FIXED bar at the TOP of the viewport (above everything, even the sidebar)
   - Design: amber/warning gradient background, white text
   - Content: "👁️ Viewing as [Facility Name] — Read-only mode · Session expires in 28:42"
   - Countdown timer (live, updates every second)
   - "End Session" button (right side)
   - This bar must be IMPOSSIBLE to miss — it's a safety feature

4. During impersonation:
   - All mutation buttons (edit, delete, create) should be DISABLED with tooltip "Read-only in impersonation mode"
   - Visual indicator on every page: subtle watermark or overlay

5. End session → POST /access/impersonate/end → redirect back to platform dashboard with success toast

TEAM MANAGEMENT PAGE (/settings/team):
src/features/access/pages/TeamManagementPage.tsx

- "Invite Team Member" button (opens modal with: name, email, role select)
- DataTable:
  - Columns: Name, Email, Role (badge), Status (Active/Deactivated), Last Login, Actions
  - Actions: Change Role, Reset Password, Deactivate
  - Current user row highlighted with "You" badge
- Role descriptions tooltip on hover

API KEY MANAGEMENT PAGE (/settings/api-keys):
src/features/access/pages/ApiKeyManagementPage.tsx

- Grouped by tenant
- "Generate Key" → select tenant → modal shows the FULL key ONCE
  - Key displayed in monospace, large font
  - "Copy to Clipboard" button with success feedback
  - Warning: "This key will only be shown once. Store it securely."
  - Modal cannot be closed without clicking "I've saved this key" checkbox
- Key list DataTable:
  - Columns: Name, Tenant, Prefix (monospace), Permissions, Created, Last Used, Status, Actions
  - Actions: Revoke, Rotate
  - Revoke: danger confirmation dialog
```

> ✅ **CHECKPOINT 4:** Impersonation flow works end-to-end. Amber bar visible and timer counts down. Read-only enforcement visible. Team CRUD works. API key shown once with copy. RTL layout correct.

---

## PHASE 5: Monitoring & Audit Logs UI

### Prompt 5.1 — Audit Logs & Facility Health

```
Build monitoring interfaces under src/features/monitoring/.

PAGE 1: Audit Logs (/monitoring/audit)
src/features/monitoring/pages/AuditLogPage.tsx

Design: Dense, scannable log viewer (inspired by Datadog/Sentry).

- Filters (horizontal): Actor, Action Type, Resource Type, Tenant, Date Range
- Timeline view (default):
  - Each log entry is a row:
    - Timestamp (monospace, fixed width)
    - Actor avatar + name
    - Action (colored badge by type: green=create, blue=update, red=delete, amber=access)
    - Description: "[Actor] [action] [resource] for [tenant]" (dynamic sentence)
    - Expand arrow → shows full details JSON
  - Infinite scroll (load more on scroll bottom)
  - New entries slide in from top if "Auto-refresh" is on (toggle)
  
- Table view (toggle):
  - DataTable with all columns, exportable
  
- Export button: CSV download with current filters applied
- Search: full-text search across log descriptions

- Visual timeline chart at top:
  - Mini bar chart showing action frequency over time (last 24h / 7d / 30d)
  - Hovering a bar filters the list to that time window

PAGE 2: Facility Health (/monitoring/health)
src/features/monitoring/pages/FacilityHealthPage.tsx

- Health Score overview:
  - Distribution: pie chart of facilities by health tier (Excellent >80, Good >60, At Risk >40, Critical <40)
  - Average health score (large number, colored by tier)

- Facility health cards (grid view, default) or table view (toggle):
  Card design:
  - Facility name + plan badge
  - Large health score (0-100) with circular progress ring (color = tier)
  - Mini sparklines: member trend (last 30d), login frequency
  - Status indicators: ✅ Recent login, ⚠️ Overdue invoice, 🎫 Open tickets
  - Hover: show full breakdown of score components

- "At Risk" section (collapsible, expanded by default):
  - Facilities with health score <40
  - Each card shows risk factors: "No admin login in 30 days", "Declining members", "Overdue invoice"
  - Quick action: "Create Ticket", "Send Notification", "Contact"

- Sort by: health score (asc/desc), member count, last activity
- Filter by: health tier, plan, region

PAGE 3: System Status (/monitoring/system)
src/features/monitoring/pages/SystemStatusPage.tsx

- System health banner: "All Systems Operational" (green) or degraded states
- Components grid:
  - API Server: status + response time + uptime %
  - Database: connections + response time
  - Cache (Redis): hit rate + memory
  - Background Jobs: running + failed + queued
  - Storage: used / total with progress bar
- Each component: green/amber/red status dot with label
- Incident history timeline (if any)
- Scheduled maintenance banner (if active)

Make the health page feel like a MISSION CONTROL dashboard — data-dense but readable.
```

> ✅ **CHECKPOINT 5:** Audit logs scroll infinitely with expandable details. Health scores render with colored rings. System status shows all components. Auto-refresh works. RTL handles monospace timestamps correctly.

---

## PHASE 6: Communication UI

### Prompt 6.1 — Announcements & Notifications

```
Build communication features under src/features/communication/.

PAGE 1: Announcements (/announcements)
src/features/communication/pages/AnnouncementsPage.tsx

- KPIs: Total Published, Scheduled, Avg Read Rate
- "New Announcement" button → opens full-page editor

- Announcement list (card layout, NOT table):
  - Type icon + colored left border by type (MAINTENANCE=amber, FEATURE_LAUNCH=green, URGENT=red)
  - Title + Arabic title preview
  - Target audience badge
  - Status badge (DRAFT/SCHEDULED/PUBLISHED)
  - Published date + read count
  - Pinned indicator (📌)
  - Actions: Edit, Duplicate, Archive

Announcement Editor (full page: /announcements/new or /announcements/:id/edit):
- Left side (60%): Editor
  - Title input (large, bold)
  - Arabic title input
  - Rich text editor for content (English)
  - Rich text editor for content (Arabic)
  - Type selector (icon buttons)
  - Audience targeting: All / Specific Plans / Specific Tenants (searchable multi-select)
  - Schedule: Publish Now / Schedule for (date-time picker)
  - Pin toggle
  - Expiry date (optional)
  
- Right side (40%): Live preview
  - Shows how the announcement will look in the facility admin dashboard
  - Toggle between English and Arabic preview
  - Toggle between desktop and mobile preview (with device frame)
  - Preview updates in real-time as you type

PAGE 2: Notification Logs (/notifications — accessible via sidebar)
- DataTable: recipient, channel (badge: EMAIL/SMS/IN_APP), subject, status (badge), sent at, delivered at
- Filter by: channel, status, tenant, dateRange
- Stats bar: sent, delivered, failed, bounce rate
- Click row to see full notification content

PAGE 3: Notification Templates (/settings/templates — under settings)
- Card grid of templates
- Each card: template name, channel badge, last updated, variables list
- Click to edit: slide-over with template editor
  - Variable placeholders highlighted: {{facilityName}}, {{amount}}, etc.
  - Live preview panel with sample data
  - "Send Test" button (sends to your email)
```

> ✅ **CHECKPOINT 6:** Announcement editor with live preview works. Publishing flow completes. Notification logs display with filtering. Template variable preview renders. RTL editor works correctly.

---

## PHASE 7: Analytics Dashboard UI

### Prompt 7.1 — Main Platform Dashboard & Analytics

```
Build the main dashboard — this is the FIRST page users see. It must feel powerful and informative.

src/features/analytics/pages/DashboardPage.tsx (route: /dashboard)

Layout — Single scrollable page with distinct sections:

SECTION 1: Welcome + Quick Actions
- "Good [morning/afternoon], [Name]" with current date
- Quick action cards (horizontal scroll on mobile):
  - "New Deal" → /deals
  - "Active Tickets (5)" → /tickets
  - "Expiring Trials (3)" → /subscriptions?filter=expiring
  - "SLA Breaches (1)" → /tickets?filter=sla-breached
  Each card: icon, label, count badge, click navigates

SECTION 2: KPI Grid (KPIGrid component, 4 columns)
- Total Facilities (trend: +12% vs last month)
- Active Members (across all facilities)
- MRR (SAR) (trend)
- Ticket Resolution Rate (trend)
- Entrance animation: stagger fade-in-up

SECTION 3: Revenue & Growth (2-column)
- Left: Revenue Trend (area chart, last 12 months, gradient fill)
  - Hover: tooltip with exact value
  - Toggle: MRR / ARR / Total Revenue
- Right: Tenant Growth (bar chart, stacked: new vs churned)
  - Net growth line overlay

SECTION 4: Distribution Row (3 columns)
- Tenants by Plan (donut chart with legend)
- Revenue by Plan (donut chart)
- Geographic Distribution (horizontal bar chart: cities)

SECTION 5: Tables Row (2 columns)
- Left: Recent Deals (last 5, compact table: name, stage badge, value, date)
  - "View Pipeline →" link
- Right: Recent Tickets (last 5: number, subject, priority, status)
  - "View All Tickets →" link

SECTION 6: Health Alerts
- Compact alert cards for attention items:
  - Facilities at risk (health <40)
  - Overdue invoices
  - SLA breaches
  - Expiring subscriptions
- Each alert: icon, description, count, "View →" link
- Red/amber themed cards

ALL charts should:
- Load with skeleton first, then animate in
- Have a subtle entry animation (fade + grow)
- Be responsive and resize properly
- Show "No data" empty state if no data

Create a refresh button in header that re-fetches all dashboard data.
The entire page should feel like a COMMAND CENTER — dense with data but never overwhelming.
Use a consistent grid system so everything aligns perfectly.

ANALYTICS DEEP DIVE (/analytics — separate tab/page):
- Churn Analysis: churn rate cards + at-risk tenant list + churn by plan chart + churn reasons chart
- Feature Adoption: horizontal bar chart of features by adoption rate + trend over time
- Comparative Benchmarks: anonymized stats cards (avg members, avg revenue, etc.)
- Export button: generate PDF/CSV report
```

> ✅ **CHECKPOINT 7:** Dashboard loads with staggered animations. All charts render with real or mock data. KPIs show trends. Alert cards link to correct pages. Responsive on mobile. Dark mode charts readable. Arabic numbers display correctly.

---

## PHASE 8: Configuration & Content UI

### Prompt 8.1 — Settings, Feature Flags & Knowledge Base

```
Build configuration and content management pages.

PAGE 1: Configuration (/settings/config)
src/features/config/pages/ConfigurationPage.tsx

- Settings grouped by category in an accordion/section layout:
  - Each category: header with icon + description
  - Settings within: key-value rows
  - Editable inline: click value to edit, shows input + save/cancel
  - Type-specific editors: toggle for boolean, number input for numbers, text for strings, JSON editor for JSON
  - "Last updated by [name] on [date]" hint per setting
  - Unsaved changes indicator + "Save All" floating button

- Maintenance Mode section:
  - Active maintenance: amber banner with countdown
  - "Schedule Maintenance" button → modal: title (AR/EN), description (AR/EN), start/end datetime
  - Upcoming maintenance list
  - Cancel button with confirmation

PAGE 2: Feature Flags (/settings/feature-flags)
src/features/config/pages/FeatureFlagPage.tsx

MATRIX VIEW — this is the star of the page:
- Rows: Tenants (with plan badge)
- Columns: Feature flags (grouped by category)
- Cells: toggle switches (green=enabled, gray=disabled)
- Cells that match plan default: normal
- Cells that override plan default: highlighted border (amber for enabled override, red for disabled override)
- Hover cell: tooltip "Overridden — plan default is [enabled/disabled]"
- Bulk actions: "Enable for all on [Plan]", "Reset overrides for [Tenant]"

- Filter by: plan, tenant search, feature category
- Sticky first column (tenant names) and header row (feature names) on scroll

- Rollout controls:
  - Select a feature → "Gradual Rollout" → slider for percentage
  - Shows which tenants would be affected

PAGE 3: Knowledge Base (/knowledge-base)
src/features/content/pages/KnowledgeBasePage.tsx

- Layout: sidebar categories + main content area
- Category sidebar:
  - List of categories with article counts
  - Click to filter
  - "All Articles" at top
- Article list:
  - Card layout: title, preview text (2 lines), category badge, status badge, views count, helpful ratio
  - Sort by: newest, popular, most helpful
- Search bar: instant search with highlighted matches
- "New Article" → full page editor

Article Editor (/knowledge-base/new or /knowledge-base/:slug/edit):
- Markdown editor with live preview (split view)
- Tabs: English content | Arabic content
- Category selector, tags input, status selector
- Metadata sidebar: slug (auto-generated from title), publish date, view count, feedback stats
- "Preview as Facility Admin" button — shows how it looks in their help center

PAGE 4: Templates (/settings/templates)
- Card grid: template name, type badge (EMAIL/INVOICE/CONTRACT), channel, last updated
- Click → slide-over editor:
  - Template body with syntax-highlighted variable placeholders
  - Variable reference sidebar: list of available variables with descriptions
  - "Preview with Sample Data" → renders template in a preview panel
  - "Send Test Email" button (for email templates)
```

> ✅ **CHECKPOINT 8:** Feature flag matrix scrolls with sticky headers. Toggles update via API. Configuration inline editing saves correctly. Knowledge base search works. Article editor renders markdown preview. RTL markdown renders correctly.

---

## PHASE 9: Compliance UI

### Prompt 9.1 — Contracts & ZATCA Dashboard

```
Build compliance pages under src/features/compliance/.

PAGE: Compliance Dashboard (/compliance)
src/features/compliance/pages/ComplianceDashboardPage.tsx

Tab layout: Contracts | ZATCA | Data Requests

TAB 1: Contracts
- KPIs: Active Contracts, Expiring in 30d (amber), Expired (red), Pending Signature
- DataTable:
  - Columns: Contract #, Tenant, Type (badge), Status (badge), Start Date, End Date, Auto-Renew (toggle icon), Actions
  - Row highlight: expiring soon = amber bg, expired = red bg (subtle)
- "New Contract" → slide-over form
- Contract detail: click to expand with terms summary + document download link

TAB 2: ZATCA Compliance
- Large compliance rate gauge (circular, animated):
  - >95%: green + "Compliant" label
  - 80-95%: amber + "Needs Attention"
  - <80%: red + "Non-Compliant"
- Stats row: Submitted, Accepted, Rejected, Pending
- Issues table: tenants with rejected/pending invoices
  - Columns: Tenant, Rejected Count, Pending Count, Last Issue Date, Actions
  - Action: "View Issues" → expand to show specific invoices
  - "Retry Submission" button per invoice
- ZATCA timeline: submission activity over time (area chart)

TAB 3: Data Requests
- Pending requests list: tenant name, request date, type, status
- Actions: Approve, Deny (with reason)
- Approved requests: download link + expiry date
- Request timeline
```

> ✅ **CHECKPOINT 9:** ZATCA gauge animates on load. Contract expiry highlighting works. Data request approval flow completes. All tabs render with proper data. RTL compliant.

---

## PHASE 10: Polish, Integration & Performance

### Prompt 10.1 — Real-Time Features & Notifications

```
Add real-time features and the notification system across the entire app.

1. NOTIFICATION CENTER (Header bell icon):
   src/components/layout/NotificationCenter.tsx
   - Click bell → dropdown panel (right-aligned, or left in RTL)
   - Notification list: icon + title + description + time + read/unread state
   - Unread: bold title + blue dot
   - Click notification: navigate to relevant page + mark read
   - "Mark All Read" button
   - Group by: Today, Earlier This Week, Older
   - Empty state: "You're all caught up! 🎉"
   - Badge on bell: unread count (max "99+")
   - Badge animates with a spring bounce when new notification arrives

2. TOAST NOTIFICATIONS:
   Use a toast system (build with Framer Motion):
   - Success: green accent border
   - Error: red accent border
   - Warning: amber accent border
   - Info: blue accent border
   - Position: bottom-right (bottom-left in RTL)
   - Stacks vertically, auto-dismiss after 5 seconds
   - Hover to pause auto-dismiss
   - Dismiss button (X)
   - Slide in from right + fade (spring animation)
   
3. REAL-TIME INDICATORS:
   - Ticket page: "New ticket received" banner slides in when new ticket created
   - Dashboard: live-updating numbers (every 30 seconds, subtle fade transition on value change)
   - Audit logs: new entries slide in at top if auto-refresh enabled

4. GLOBAL ERROR HANDLING:
   - API errors → toast with error message (Arabic/English based on lang)
   - 401 → redirect to login with "Session expired" message
   - 403 → toast "You don't have permission for this action"
   - Network error → persistent banner at top: "Connection lost. Retrying..." with retry countdown
   - Offline detection: gray overlay banner when offline

5. LOADING STATES:
   Review ALL pages and ensure every data-loading state has:
   - Skeleton that matches the content shape
   - Graceful error fallback with retry button
   - Empty state with illustration and action
```

### Prompt 10.2 — Responsive Design & RTL Polish

```
Do a comprehensive responsive and RTL polish pass across the ENTIRE application.

RESPONSIVE (test at 1440px, 1024px, 768px, 375px):

1. Sidebar:
   - ≥1024px: full sidebar
   - 768-1024px: collapsed sidebar (icons only)
   - <768px: hidden, hamburger menu, slide-over drawer

2. KPI grids:
   - ≥1024px: 4 columns
   - 768-1024px: 2 columns
   - <768px: 1 column (horizontal scroll option for important dashboards)

3. DataTables:
   - ≥1024px: all columns
   - 768-1024px: hide less important columns, show in expandable row detail
   - <768px: card layout instead of table rows

4. Split panels (tickets):
   - ≥1024px: side-by-side
   - <1024px: full-width list, click opens detail as full page

5. Charts:
   - All must be responsive (use ResponsiveContainer from Recharts)
   - On mobile: stack charts vertically

6. Forms:
   - Multi-column forms → single column on mobile
   - Slide-over panels → full-screen on mobile

RTL POLISH (switch to Arabic and verify EVERY page):

1. Sidebar: flips to right side
2. All text alignment: start/end not left/right
3. Icons that imply direction (arrows, chevrons): flip or replace
4. Charts: ensure axis labels and legends render correctly in Arabic
5. Numbers: keep as Western Arabic numerals (1,2,3) not Eastern (١،٢،٣) — this is standard for Saudi business software
6. Currency: "SAR 1,234.56" in EN → "١٬٢٣٤٫٥٦ ر.س" or keep Western numerals based on user preference
7. Tables: column order doesn't need to reverse, but action buttons should be on the left in RTL
8. Breadcrumbs: separator direction flips
9. Modals/slide-overs: slide from left in RTL
10. Timeline: stays vertical, no change needed
11. Form labels: right-aligned in RTL
12. Search: magnifying glass icon position flips
13. Notification panel: opens from left in RTL

Test Arabic text for:
- Long words that might overflow
- Mixed Arabic/English content (e.g., "خطة PROFESSIONAL")
- Date formatting: use Hijri dates optionally (user setting)

Ensure ALL Framer Motion animations respect direction:
- fadeInLeft becomes fadeInRight in RTL
- slideFromRight becomes slideFromLeft in RTL
```

### Prompt 10.3 — Performance & Accessibility

```
Optimize performance and accessibility across the entire application.

PERFORMANCE:
1. Code splitting:
   - Verify ALL feature routes use React.lazy
   - Bundle analyzer: ensure no single chunk > 200KB
   
2. API optimization:
   - React Query: set staleTime appropriately
     - Dashboard KPIs: 5 minutes
     - Lists: 2 minutes
     - Detail pages: 1 minute
     - Config/settings: 10 minutes
   - Prefetch: when hovering sidebar links, prefetch the page data
   - Infinite scroll: use React Query's useInfiniteQuery for audit logs
   
3. Rendering:
   - Virtualize long lists (audit logs, notification logs) with @tanstack/react-virtual
   - Memoize expensive chart renders
   - Debounce all search inputs (300ms)
   - Throttle scroll handlers

4. Images & assets:
   - Lazy load images below the fold
   - Use SVG for all icons (lucide-react already does this)
   - Preload critical fonts

ACCESSIBILITY:
1. Keyboard navigation:
   - Tab order logical on every page
   - Sidebar: arrow keys to navigate, Enter to select
   - DataTable: arrow keys between rows, Enter to open detail
   - Modals: focus trap, Esc to close, focus returns to trigger
   - Command palette: full keyboard navigable

2. Screen reader:
   - All images/icons have aria-label
   - Status badges: aria-label="Status: Active"
   - Charts: provide accessible text summary (sr-only)
   - Loading states: aria-live="polite" announcements
   - Page titles: set document.title on route change
   
3. Color contrast:
   - Verify all text meets WCAG AA (4.5:1 for normal, 3:1 for large)
   - Status colors must not rely ONLY on color — include icons/shapes
   - Dark mode: verify contrast ratios

4. Focus indicators:
   - Custom focus ring: 2px amber outline with 2px offset
   - Never remove focus indicators
   - Focus-visible only (not on click)

5. Motion:
   - All Framer Motion animations check prefers-reduced-motion
   - Provide static alternatives when motion is reduced

Run a Lighthouse audit and fix any issues. Target: Performance >90, Accessibility >95, Best Practices >95.
```

### Prompt 10.4 — End-to-End Smoke Test & Final Polish

```
Create a comprehensive walkthrough test and apply final visual polish.

VISUAL POLISH CHECKLIST — go through EVERY page and verify:

1. Spacing consistency:
   - Page padding: 24px on all sides (32px on large screens)
   - Section spacing: 32px between major sections
   - Card padding: 20px inner
   - Table cell padding: 12px vertical, 16px horizontal

2. Typography consistency:
   - Page titles: 24px, semibold
   - Section titles: 18px, semibold
   - Card titles: 16px, semibold
   - Body text: 14px, regular
   - Small/meta text: 12px, regular, muted color
   - Monospace text (IDs, codes, keys): JetBrains Mono

3. Animation consistency:
   - Page entrance: 200ms fade-in-up
   - Card entrance: stagger 50ms each
   - Hover effects: 150ms
   - Modal entrance: 250ms scale + fade
   - Toast entrance: 300ms slide + spring

4. Empty states on EVERY list page:
   - Illustration + descriptive title + subtitle + action button
   - Appropriate per context ("No deals yet", "All tickets resolved!", etc.)

5. Loading states on EVERY page:
   - Skeletons match actual content layout
   - No layout shift when data loads

6. Error states:
   - Every API call has error handling
   - Retry button on all errors
   - Error messages are user-friendly (not raw API errors)

SMOKE TEST FLOW — walk through the app:
1. Login → Dashboard loads with KPIs and charts
2. Navigate sidebar → every link works, page transitions smooth
3. Deals → create deal, drag through pipeline
4. Tenants → view list, open detail, view tabs
5. Onboarding → complete wizard with confetti
6. Subscriptions → view plans, check comparison
7. Invoices → filter, mark paid
8. Tickets → select ticket, send reply, send internal note
9. Impersonation → start, verify bar, end
10. Audit Logs → scroll, filter, expand entries
11. Health → view scores, identify at-risk
12. Announcements → create and publish
13. Settings → toggle feature flags
14. Switch to Arabic → verify ALL pages render correctly in RTL
15. Switch to dark mode → verify ALL pages look correct
16. Resize to mobile → verify ALL pages are responsive

Fix any issues found during this walkthrough.

Then create a final route map document:
List every route, its component, required API endpoints, and status (complete/partial/todo).
```

> ✅ **FINAL CHECKPOINT:** All pages load and function. All animations smooth. Arabic RTL renders correctly on every page. Dark mode works everywhere. Mobile responsive. Lighthouse scores meet targets. No console errors.

---

## Quick Reference: Feature → Page → Route Mapping

| Feature | Page | Route | Key Components |
|---------|------|-------|---------------|
| Auth | Login | /login | LoginForm |
| Dashboard | Main Dashboard | /dashboard | KPIGrid, Charts, AlertCards |
| Deals | Pipeline | /deals | KanbanBoard, DealCard, DealForm |
| Tenants | List | /tenants | DataTable, StatusBadge |
| Tenants | Detail | /tenants/:id | Tabs, Timeline, FeatureToggles |
| Tenants | Onboarding | /tenants/:id/onboarding | Wizard, PlanComparison, Confetti |
| Subscriptions | Dashboard | /subscriptions | Charts, DataTable, PlanCards |
| Subscriptions | Plans | /subscriptions/plans | PlanCards, ComparisonMatrix |
| Billing | Invoices | /billing/invoices | DataTable, InvoicePreview |
| Tickets | Management | /tickets | SplitPanel, MessageThread, SLA |
| Tickets | Analytics | /tickets/analytics | Charts, AgentTable, Gauge |
| Access | Team | /settings/team | DataTable, InviteModal |
| Access | API Keys | /settings/api-keys | DataTable, KeyRevealModal |
| Monitoring | Audit Logs | /monitoring/audit | LogViewer, TimelineChart |
| Monitoring | Health | /monitoring/health | HealthCards, ScoreRing |
| Monitoring | System | /monitoring/system | StatusGrid, IncidentTimeline |
| Communication | Announcements | /announcements | Editor, LivePreview, CardList |
| Communication | Notifications | /notifications | DataTable, StatsBar |
| Analytics | Deep Dive | /analytics | ChurnCharts, AdoptionBars |
| Config | Settings | /settings/config | InlineEdit, Accordion |
| Config | Feature Flags | /settings/feature-flags | ToggleMatrix, RolloutSlider |
| Content | Knowledge Base | /knowledge-base | MarkdownEditor, CategorySidebar |
| Content | Templates | /settings/templates | TemplateEditor, VariablePreview |
| Compliance | Dashboard | /compliance | ContractTable, ZatcaGauge |
| Design System | Showcase | /design-system | All shared components |

---

## Design Tokens Quick Reference

| Token | Light | Dark |
|-------|-------|------|
| Background | #FAFBFC | #0A1628 |
| Surface | #FFFFFF | #162236 |
| Text Primary | #0A1628 | #E8ECF1 |
| Text Secondary | #4A5568 | #8B95A5 |
| Brand Accent | #F59E0B | #F59E0B |
| Success | #10B981 | #10B981 |
| Warning | #F59E0B | #F59E0B |
| Error | #EF4444 | #EF4444 |
| Info | #3B82F6 | #3B82F6 |

| Font | Usage |
|------|-------|
| Plus Jakarta Sans | Display + Body (English) |
| IBM Plex Sans Arabic | Body (Arabic) |
| JetBrains Mono | Code, IDs, Keys, Timestamps |

| Breakpoint | Width |
|------------|-------|
| Mobile | <768px |
| Tablet | 768-1024px |
| Desktop | 1024-1440px |
| Wide | >1440px |
