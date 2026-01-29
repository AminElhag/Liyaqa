# Liyaqa Product Requirements Document

## Executive Summary

Liyaqa is a comprehensive Gym & Fitness Club Management SaaS Platform designed specifically for the Saudi Arabian market. This PRD outlines the feature roadmap based on competitive analysis against Perfect Gym and other market leaders, prioritized by business impact and implementation complexity.

---

## Competitive Analysis Summary

### Liyaqa vs Perfect Gym

| Dimension | Liyaqa | Perfect Gym |
|-----------|--------|-------------|
| **Target Market** | Saudi Arabia / GCC | Global (52+ countries) |
| **Pricing** | TBD | EUR 129/month + onboarding |
| **Tech Stack** | Spring Boot 4/Kotlin + Next.js 15 | Legacy stack |
| **Architecture** | Modern multi-tenant SaaS | Cloud-based |

### Where Liyaqa Wins (Competitive Advantages)

| Feature | Business Value |
|---------|----------------|
| **Saudi Payment Integrations** (STC Pay, SADAD, Tamara, Mada) | 70%+ smartphone wallet penetration |
| **ZATCA E-Invoicing Compliance** | Legal requirement in Saudi Arabia |
| **Prayer Time Integration** (Umm Al-Qura calendar) | Cultural compliance, required in many Saudi gyms |
| **Gender-Based Access Control** | Saudi regulatory requirement |
| **Hijri Calendar Support** | Saudi official calendar |
| **Full Arabic/RTL Support** | Native Arabic experience |
| **WhatsApp Business Integration** | 95%+ WhatsApp usage in Saudi |
| **Multi-tenant B2B Platform** | Platform business model support |

### Feature Gaps (What Perfect Gym Has That We Need)

| Category | Gap | Impact |
|----------|-----|--------|
| **Mobile** | No native member/staff apps | High - Member engagement |
| **Sales** | No CRM or lead management | High - Sales conversion |
| **Marketing** | No automation or campaigns | High - Retention |
| **Analytics** | No ML-powered insights | Medium-High |
| **Self-Service** | Limited member portal | Medium-High |
| **Integrations** | No webhooks for partners | Medium |
| **Hardware** | No turnstile/biometric support | Medium |

---

## Feature Roadmap

### Tier 1: Critical Features (Next 6 Months)

#### 1. Member Mobile App (Kotlin Multiplatform)
**Priority:** P0 | **Effort:** 3-4 months | **ROI:** 9.5/10

**Description:**
Native mobile application for gym members to manage their fitness journey on-the-go.

**Core Features:**
- [x] Class booking with real-time availability
- [x] QR code for gym check-in
- [x] Class schedule view with calendar integration
- [x] Push notifications for bookings, reminders, promotions
- [x] Payment for memberships and packages
- [x] View membership status and expiry
- [x] Profile management
- [x] Trainer availability and PT booking
- [x] Attendance history
- [x] Prayer time display (Umm Al-Qura)

**Bonus Features Implemented:**
- [x] Invoice management (view, filter, pay)
- [x] Wallet/balance management with transaction history
- [x] Dashboard/home screen with member summary
- [x] Deep link navigation from push notifications
- [x] Bilingual support (English/Arabic)
- [x] RTL layout support

**Technical Requirements:**
- Kotlin Multiplatform (KMP) with Compose Multiplatform for cross-platform (iOS/Android)
- Shared business logic in Kotlin common module
- Native UI with Compose Multiplatform (Material 3)
- Integration with existing REST API via Ktor client
- FCM/APNs for push notifications
- Arabic/English with RTL support (Compose handles RTL natively)
- Offline capability using SQLDelight for local storage
- Kotlin Coroutines for async operations

**Success Metrics:**
- 50% member app adoption within 6 months
- 30% reduction in reception workload
- 20% increase in class booking rates

---

#### 2. CRM & Lead Management
**Priority:** P0 | **Effort:** 2-3 months | **ROI:** 9/10

**Description:**
Complete sales pipeline management for converting prospects into members.

**Core Features:**
- [x] Lead capture forms (embeddable, standalone)
- [x] Lead pipeline with customizable stages (New > Contacted > Tour Scheduled > Trial > Negotiation > Won/Lost)
- [x] Lead scoring based on engagement (backend + frontend rules management)
- [x] Lead assignment rules (round-robin, location-based, source-based) (backend + frontend rules management)
- [x] Activity logging (calls, emails, meetings, notes)
- [x] Follow-up task scheduling with reminders
- [x] Lead source tracking (referral, walk-in, social, ads)
- [x] Campaign attribution for marketing ROI
- [x] Convert lead to member workflow
- [x] Sales dashboard with conversion metrics
- [x] Lost lead reasons tracking

**Technical Requirements:**
- New Lead entity with full lifecycle
- Integration with existing Member creation
- Email integration for activity tracking
- Notification service integration for reminders

**Success Metrics:**
- 25% improvement in lead-to-member conversion
- 50% reduction in lead response time
- Full visibility into sales pipeline

---

#### 3. Marketing Automation (Basic)
**Priority:** P0 | **Effort:** 2 months | **ROI:** 8.5/10

**Description:**
Automated communication workflows to improve member engagement and retention.

**Core Features:**
- [x] Welcome email sequence (Day 1, Day 3, Day 7)
- [x] Membership expiry reminders (30 days, 7 days, 1 day)
- [x] Win-back campaigns for expired members (7 days, 30 days, 90 days after expiry)
- [x] Birthday automated messages
- [x] Inactivity alerts (no visit in 14 days, 30 days)
- [x] Class reminder notifications (24h, 1h before)
- [x] Payment failure follow-ups
- [x] Member segmentation by activity, plan, status
- [x] A/B testing for message effectiveness
- [x] Campaign analytics (open rates, click rates)

**Technical Requirements:**
- Workflow engine for triggered campaigns
- Scheduled job enhancement
- Template system with variable substitution
- Multi-channel delivery (Email, SMS, WhatsApp, Push)

**Success Metrics:**
- 15% improvement in member retention
- 40% open rate on automated emails
- Reduced manual outreach by 60%

---

#### 4. Member Self-Service Portal
**Priority:** P0 | **Effort:** 2 months | **ROI:** 8.5/10

**Description:**
Web-based portal for members to manage their membership independently.

**Core Features:**
- [x] Secure member login (magic link or password)
- [x] View active membership and benefits
- [x] Class booking and cancellation
- [x] Booking history and upcoming schedule
- [x] PT session booking
- [x] Invoice viewing and payment
- [x] Payment method management
- [x] Profile and password update
- [x] Freeze request submission
- [x] Document signing (agreements, waivers)
- [x] Referral link generation

**Technical Requirements:**
- Separate Next.js app or route group
- Member authentication (not staff auth)
- Integration with payment gateways
- Mobile-responsive design

**Success Metrics:**
- 30% reduction in front desk workload
- 60% of members using self-service
- 20% increase in online renewals

---

#### 5. Webhook System
**Priority:** P0 | **Effort:** 2-3 weeks | **ROI:** 8/10

**Description:**
Event-driven webhook infrastructure for third-party integrations.

**Core Features:**
- [x] Webhook registration endpoint
- [x] Event types: member.created, member.updated, subscription.created, subscription.expired, subscription.renewed, payment.completed, payment.failed, attendance.checkin, attendance.checkout, booking.created, booking.cancelled, invoice.created, invoice.paid
- [x] Webhook delivery with retry logic (exponential backoff)
- [x] Webhook signature verification (HMAC)
- [x] Webhook logs and debugging UI
- [x] Webhook testing (send test event)
- [x] Rate limiting per webhook

**Technical Requirements:**
- Async event publishing (Spring Events or Kafka)
- Webhook entity with endpoint, secret, events
- Delivery queue with retry logic
- Signature generation for verification

**Success Metrics:**
- Enable 5+ partner integrations
- 99.9% webhook delivery rate
- Partner ecosystem growth

---

### Tier 2: Important Features (6-12 Months)

#### 6. Referral Program Automation
**Priority:** P1 | **Effort:** 3-4 weeks | **ROI:** 7.5/10

**Description:**
Automated referral tracking and reward system.

**Core Features:**
- [x] Unique referral links per member
- [x] Referral tracking (clicks, signups, conversions)
- [x] Configurable reward rules (free days, discount, wallet credit)
- [x] Automatic reward distribution
- [x] Referral leaderboard
- [x] Member referral dashboard
- [x] Referral program analytics

**Success Metrics:**
- 20% reduction in member acquisition cost
- 10% of new members from referrals

---

#### 7. Voucher & Promo Code System
**Priority:** P1 | **Effort:** 2-3 weeks | **ROI:** 7.5/10

**Description:**
Flexible promotional code system for marketing campaigns.

**Core Features:**
- [x] Create single-use and multi-use codes
- [x] Discount types: percentage, fixed amount, free trial
- [x] Usage limits (total uses, per member)
- [x] Expiration dates
- [x] Applicable products/plans restrictions
- [x] First-time member only option
- [x] Gift card functionality (prepaid value)
- [x] Voucher usage tracking and analytics

**Success Metrics:**
- Marketing campaign flexibility
- Track promotion ROI

---

#### 8. Enhanced Reporting Suite ✅
**Priority:** P1 | **Effort:** 1-2 months | **ROI:** 7/10

**Description:**
Comprehensive reporting and analytics dashboard.

**Additional Reports:**
- [x] Churn report (cancelled members, reasons)
- [x] Revenue by plan, location, time period
- [x] Class utilization and attendance trends
- [x] Peak hours analysis
- [x] Trainer performance metrics
- [x] Payment collection efficiency
- [x] Member lifetime value (LTV)
- [x] Member acquisition funnel
- [x] Retention cohort analysis
- [x] Sales team performance
- [x] Comparison across locations/clubs

**Dashboard Enhancements:**
- [x] Customizable dashboard widgets
- [x] Saved report filters
- [x] Scheduled report delivery (email)
- [x] Export to PDF with branding

**Success Metrics:**
- 30+ actionable reports
- Daily usage by management

---

#### 9. Family & Corporate Accounts ✅
**Priority:** P1 | **Effort:** 1 month | **ROI:** 7/10

**Description:**
Support for family memberships and corporate B2B accounts.

**Family Features:**
- [x] Family group entity linking members
- [x] Primary/secondary member designation
- [x] Family discount application
- [x] Shared benefits (guest passes)
- [x] Family billing (single invoice)

**Corporate Features:**
- [x] Corporate account entity
- [x] Bulk member import for corporate
- [x] Corporate billing (invoice to company)
- [x] Corporate discounts
- [x] Employee verification workflow
- [x] Corporate usage reports

**Success Metrics:**
- Corporate sales channel enabled
- Family membership uptake

---

#### 10. Zone & Facility Booking ✅
**Priority:** P1 | **Effort:** 1 month | **ROI:** 6.5/10

**Description:**
Booking system for specific areas, equipment, and facilities.

**Core Features:**
- [x] Zone/facility definitions (tennis court, swimming pool, sauna, studio)
- [x] Time slot configuration
- [x] Capacity per zone
- [x] Zone booking by members
- [x] Zone booking calendar view
- [x] Membership-based access restrictions
- [x] Zone booking fees
- [x] Maintenance blocking

**Success Metrics:**
- Revenue from facility rentals
- Better resource utilization

---

#### 11. Loyalty Points System ✅
**Priority:** P1 | **Effort:** 1 month | **ROI:** 6.5/10

**Description:**
Points-based rewards program for member engagement.

**Core Features:**
- [x] Points earning rules (check-in, class attendance, purchase, referral)
- [x] Points balance per member
- [x] Points history and transactions
- [x] Rewards catalog (free class, discount, merchandise)
- [x] Points redemption workflow
- [x] Points expiration policy
- [x] Tier system (Bronze, Silver, Gold, Platinum)
- [x] Tier-based benefits

**Success Metrics:**
- 10% retention improvement
- Higher engagement frequency

---

#### 12. Staff Mobile App ✅
**Priority:** P1 | **Effort:** 2 months | **ROI:** 6.5/10

**Description:**
Mobile app for staff and trainers to manage operations.

**Core Features:**
- [x] Staff check-in for attendance
- [x] View assigned classes and PT sessions
- [x] Mark class attendance
- [x] View member profiles and notes
- [x] Add member notes
- [x] Quick member check-in
- [x] Trainer schedule management
- [x] Task notifications
- [x] Push notifications for assignments

**Technical Requirements:**
- Kotlin Multiplatform with Compose Multiplatform (same stack as member app)
- Shared modules with member app where applicable
- Staff-specific UI components

**Success Metrics:**
- Trainer adoption
- Operational efficiency

---

### Tier 3: Nice to Have (12-24 Months)

#### 13. Churn Prediction (Machine Learning) ✅
**Priority:** P2 | **Effort:** 2-3 months | **ROI:** 6/10

**Description:**
ML-powered identification of at-risk members.

**Core Features:**
- [x] Churn risk scoring (0-100)
- [x] At-risk member list with reasons
- [x] Intervention recommendations
- [x] Automated campaigns for at-risk segments
- [x] Model training on historical data
- [x] Prediction accuracy monitoring

**Technical Requirements:**
- Data pipeline for ML features
- Model training infrastructure (Python/scikit-learn)
- Integration with automation engine

---

#### 14. Access Control Hardware Integration ✅
**Priority:** P2 | **Effort:** 2-3 months | **ROI:** 5.5/10

**Description:**
Integration with physical access control hardware.

**Core Features:**
- [x] Turnstile/speed gate API integration
- [x] RFID card management
- [x] Biometric enrollment (fingerprint, face)
- [x] Access denied reason logging
- [x] Time-based access rules
- [x] Zone-based access rules
- [x] Real-time occupancy tracking
- [x] Partner hardware certification

**Hardware Partners to Target:**
- Gunnebo
- Boon Edam
- Suprema (biometrics)

---

#### 15. Self-Service Kiosk Mode ✅
**Priority:** P2 | **Effort:** 1 month | **ROI:** 5.5/10

**Description:**
Kiosk interface for in-gym self-service.

**Core Features:**
- [x] Touch-friendly UI
- [x] Member check-in via card/QR/phone
- [x] Class booking
- [x] Membership purchase
- [x] Payment processing
- [x] E-signature for agreements
- [x] Receipt printing
- [x] Idle timeout and reset

---

#### 16. Sales Forecasting ✅
**Priority:** P2 | **Effort:** 1-2 months | **ROI:** 5/10

**Description:**
AI-powered revenue and membership predictions.

**Core Features:**
- [x] Revenue forecast (30/60/90 days)
- [x] Membership count predictions
- [x] Seasonality analysis (weekly, monthly, quarterly, Ramadan, holidays)
- [x] What-if scenario modeling
- [x] Budget vs actual tracking

---

#### 17. Equipment Integration ✅
**Priority:** P2 | **Effort:** 2-3 months | **ROI:** 4/10

**Description:**
Integration with gym equipment for workout tracking.

**Target Equipment:**
- TechnoGym
- Precor
- Life Fitness
- Milon

**Core Features:**
- [x] Member workout sync
- [x] Cardio session tracking
- [x] Strength training logs
- [x] Equipment usage analytics
- [x] Provider configuration management
- [x] OAuth token management for equipment APIs
- [x] Equipment unit registration and status tracking

---

#### 18. Wearable Integration ✅
**Priority:** P2 | **Effort:** 1-2 months | **ROI:** 4/10

**Description:**
Sync with popular fitness wearables.

**Target Devices:**
- Fitbit
- Garmin
- WHOOP
- Oura Ring
- Apple Watch (HealthKit)
- Google Fit

**Core Features:**
- [x] OAuth connection flow
- [x] Activity data sync
- [x] Step count and calories
- [x] Heart rate data
- [x] Sleep tracking
- [x] Progress dashboard in app
- [x] Mobile app integration (HealthKit/Google Fit SDK)
- [x] Daily activity aggregation
- [x] Workout sync from wearables

---

#### 19. White-Label Mobile Apps ✅
**Priority:** P2 | **Effort:** 3-4 months | **ROI:** 4/10

**Description:**
Customizable branded mobile apps for enterprise clients.

**Core Features:**
- [x] Custom colors (primary, secondary, accent with dark mode variants)
- [x] Custom logo support (light/dark mode)
- [x] Custom app name (English/Arabic)
- [x] Feature toggles per tenant (classes, facilities, loyalty, wearables, payments)
- [x] Admin settings page with live preview
- [x] Dynamic theming via tenant branding API

**Technical Implementation:**
- Backend: BrandingConfig entity with V60 migration, REST API endpoints
- Frontend: Settings > Branding admin page with color pickers and phone preview
- Mobile: DynamicLiyaqaTheme composable with BrandingTheme data class
- API: Public /api/mobile/branding endpoint for mobile apps
- Extends TenantInfo with branding fields for seamless integration

---

#### 20. Security & Compliance Management ✅
**Priority:** P2 | **Effort:** 3-6 months | **ROI:** 3.5/10

**Description:**
Comprehensive compliance management dashboard and tools for enterprise security certifications.

**Compliance Frameworks:**
- [x] ISO 27001 (Information Security) - Control tracking and evidence management
- [x] SOC 2 Type II - Trust service criteria monitoring
- [x] PCI DSS (Payment Card Industry) - Payment security compliance
- [x] PDPL Compliance (Saudi Privacy Law) - Full Saudi data protection support

**Core Features:**
- [x] Compliance dashboard with framework scores and alerts
- [x] Framework control tracking with status management (NOT_STARTED → IN_PROGRESS → IMPLEMENTED)
- [x] Evidence management with file upload and verification
- [x] Risk assessment module with 5x5 likelihood/impact matrix
- [x] Policy management with workflow (DRAFT → REVIEW → APPROVED → PUBLISHED)
- [x] Security events log with severity filtering

**PDPL Data Protection Features:**
- [x] Processing activities register (Article 7)
- [x] Consent management with withdrawal tracking
- [x] Data Subject Request (DSR) workflow with 30-day deadline tracking (Articles 15-23, 26)
- [x] Breach register with 72-hour SDAIA notification tracking (Article 29)
- [x] Cross-border transfer documentation

**Technical Implementation:**
- Backend: Compliance domain with full hexagonal architecture
- Frontend: 14 pages, 6 UI components, 7 column files
- Database: V61-V62 migrations with framework seeding
- Bilingual: Full English/Arabic support throughout

**Success Metrics:**
- Enterprise customer readiness
- Regulatory compliance automation
- Audit trail for all compliance activities

---

#### 21. Agreement Management UI ✅
**Priority:** P2 | **Effort:** 1-2 weeks | **ROI:** 5/10

**Description:**
Administrative UI for creating and managing membership agreements, liability waivers, and consent forms across both Club Admin and Platform Admin dashboards.

**Core Features:**
- [x] Agreement template CRUD (create, read, update, delete)
- [x] Bilingual content support (English/Arabic titles and content)
- [x] Agreement types: LIABILITY_WAIVER, TERMS_CONDITIONS, HEALTH_DISCLOSURE, PRIVACY_POLICY, PHOTO_CONSENT, MARKETING_CONSENT, RULES_REGULATIONS, CUSTOM
- [x] Mandatory flag for required agreements during registration
- [x] Health questions flag for agreements requiring health disclosure
- [x] Version control with automatic increment on content changes
- [x] Activate/deactivate workflow
- [x] Effective date scheduling
- [x] Sort order for display sequence

**Club Admin Dashboard:**
- [x] Settings > Agreements list page with DataTable
- [x] Create new agreement page with form
- [x] View/Edit agreement detail page
- [x] Type-based color badges for quick identification
- [x] Activate/deactivate actions with toast feedback

**Platform Admin Dashboard:**
- [x] Agreements tab in Club Details page (view-clubs/[id])
- [x] Modal dialog for create/edit within tab
- [x] Cross-tenant agreement management for platform admins
- [x] Platform-specific API endpoints for club-scoped operations

**Technical Implementation:**
- Backend: PlatformAgreementController and PlatformAgreementService for cross-tenant access
- Frontend: agreement-columns.tsx, agreement-form.tsx, ClubAgreementsTab, AgreementFormDialog
- Extends existing AgreementController API for club admin usage
- Full bilingual support with RTL-aware layouts

**Success Metrics:**
- Streamlined agreement creation workflow
- Consistent agreement management across platform and club admin views
- Reduced time to publish new agreements

---

#### 22. Platform Operations & Client Success ✅
**Priority:** P1 | **Effort:** 2-3 months | **ROI:** 8/10

**Description:**
Complete B2B platform operations suite for managing client lifecycle from trial to expansion. Follows Ahmed's journey narrative - from discovering Liyaqa to becoming a successful multi-location gym owner.

**Onboarding & Trial Management:**
- [x] Self-service signup flow with plan recommendation
- [x] Public pricing page with Starter/Professional/Enterprise tiers
- [x] Gamified onboarding checklist with points system (13 steps, 165 max points)
- [x] Progress tracking with phase indicators (Getting Started → Core Setup → Operations → Complete)
- [x] Feature unlocking based on progress (Marketing at 60pts, Reports at 90pts, API at 100%)
- [x] Trial timeline automation (welcome → check-ins → reminders → conversion)
- [x] Trial-to-paid conversion with special offers

**Client Health Scoring:**
- [x] Automated health score calculation (0-100)
- [x] Weighted components: Usage (40%), Engagement (25%), Payment (20%), Support (15%)
- [x] Risk levels: LOW (80-100), MEDIUM (60-79), HIGH (40-59), CRITICAL (0-39)
- [x] Health trend tracking (IMPROVING, STABLE, DECLINING)
- [x] Detailed metrics: admin logins, member growth, check-ins, payment success rate

**Proactive Alerts:**
- [x] Usage limit warnings (80%, 90%, 95% thresholds)
- [x] Churn risk alerts (health score < 50)
- [x] Trial ending notifications
- [x] Payment failure alerts
- [x] Inactivity warnings
- [x] Milestone achievements (onboarding, member count)
- [x] Alert severity levels (INFO, WARNING, CRITICAL, SUCCESS)
- [x] Acknowledge and resolve workflow

**Usage Limit Enforcement:**
- [x] Real-time usage tracking (members, staff, clubs, API calls)
- [x] Soft limits with warnings at 80%, 90%, 95%
- [x] Hard limit enforcement at 100% (block new creations)
- [x] Grace period management (7 days to upgrade)
- [x] Usage status dashboard component

**Smart Dunning (Payment Recovery):**
- [x] Configurable dunning sequences with notification steps
- [x] Multi-channel outreach (Email, SMS, WhatsApp, Push, Phone)
- [x] Automatic retry scheduling with exponential backoff
- [x] Escalation to CSM for high-value clients
- [x] Suspension and deactivation timeline
- [x] Payment recovery tracking and analytics

**Self-Service Support Portal:**
- [x] Client-facing support center (tickets, help, contact)
- [x] Ticket creation with category selection
- [x] Ticket status tracking (OPEN, IN_PROGRESS, WAITING_ON_CLIENT, RESOLVED, CLOSED)
- [x] Knowledge base with popular articles
- [x] Multiple contact methods (email, phone, live chat)
- [x] Full bilingual support (English/Arabic)

**Technical Implementation:**
- Backend: 5 domain models (OnboardingProgress, ClientHealthScore, ClientUsage, PlatformAlert, DunningSequence)
- Backend: 5 application services, 5 repositories with JPA implementations
- Database: V64-V68 migrations for all new tables
- Frontend: Public layout, pricing page, signup wizard
- Frontend: 4 dashboard components (health-overview, alert-center, usage-warnings, onboarding-checklist)
- Frontend: Client support portal with tabs (tickets, help center, contact)

**Success Metrics:**
- Trial-to-paid conversion rate > 40%
- Failed payment recovery > 80%
- Average onboarding time < 7 days
- Client health score average > 75

---

#### 23. Platform Dashboard Redesign ✅
**Priority:** P1 | **Effort:** 4-5 weeks | **ROI:** 8.5/10

**Description:**
Complete redesign of the Platform Dashboard to create a comprehensive client lifecycle management experience. When Liyaqa's internal team opens the dashboard, they immediately understand where each client is in their journey, who needs attention, and what action to take next. Follows Ahmed's journey narrative from gym discovery to successful multi-location expansion.

**Client Lifecycle Funnel:**
- [x] Visual funnel showing client distribution across stages
- [x] Five lifecycle stages: Trial → Onboarding → Active → At-Risk → Churned
- [x] Color-coded stage indicators (blue, amber, green, red, gray)
- [x] Click-through navigation to filtered client list
- [x] Real-time stage counts with trend indicators

**Onboarding Monitor:**
- [x] Dashboard panel showing clients currently in onboarding
- [x] Progress bars with percentage completion per client
- [x] Days since start with stalled indicators (>7 days no activity)
- [x] Quick actions: Send Reminder, Schedule Call
- [x] Phase indicators (Getting Started, Core Setup, Operations)

**Health Overview Component:**
- [x] Health score distribution visualization (bar chart)
- [x] Risk level breakdown: Healthy, Monitor, At-Risk, Critical
- [x] At-risk client quick list with scores and trends
- [x] Click-through to detailed health dashboard
- [x] Average health score display

**Alert Center:**
- [x] Unified alert hub on dashboard
- [x] Severity-based filtering (Critical, Warning, Info, Success)
- [x] Unacknowledged alert badge counter
- [x] Quick acknowledge and resolve actions
- [x] Alert type icons and color coding
- [x] Relative time display for alert age

**Alert Playbook Dialog:**
- [x] Recommended actions per alert type
- [x] 9 alert types with tailored playbooks
- [x] Severity indicator and impact description
- [x] Primary and secondary action buttons
- [x] Step-by-step resolution guidance

**Dunning Status Widget:**
- [x] Active payment recovery sequences display
- [x] Timeline progress visualization per sequence
- [x] Days since failure with severity coloring
- [x] Quick actions: Retry Payment, Send Link, Escalate
- [x] Recovery rate and revenue at risk statistics
- [x] Escalated sequence highlighting

**Health Trend Chart:**
- [x] Line chart showing health score history
- [x] 30/60/90 day view toggles
- [x] Component breakdown (Usage, Engagement, Payment, Support)
- [x] Trend indicators and annotations
- [x] Recharts implementation with responsive design

**Quick Action Menu:**
- [x] Reusable dropdown for context-aware actions
- [x] 6 context types: client, onboarding, at_risk, dunning, trial, support
- [x] Grouped action categories with icons
- [x] Confirmation dialogs for destructive actions

**New Pages:**
- [x] `/platform/health` - Full-page health management
- [x] `/platform/alerts` - Alert management with bulk operations
- [x] `/platform/dunning` - Dunning dashboard with recovery metrics
- [x] `/clients/[id]/health` - Client health detail with history

**Role-Based Dashboard Enhancements:**
- [x] Admin Dashboard: Lifecycle funnel, onboarding monitor, health overview, alert center, dunning widget
- [x] Sales Dashboard: Trial follow-up cards, conversion funnel, upsell opportunities
- [x] Support Dashboard: Alert center integration, at-risk client list, dunning sequences

**Backend API Endpoints:**
- [x] `/api/platform/onboarding` - Onboarding management (statistics, active, stalled)
- [x] `/api/platform/health` - Health scores (overview, at-risk, declining, history)
- [x] `/api/platform/alerts` - Alert management (CRUD, acknowledge, resolve, bulk)
- [x] `/api/platform/dunning` - Dunning operations (active, retry, escalate, recover)

**Technical Implementation:**
- Frontend: 6 new dashboard components with Framer Motion animations
- Frontend: 4 new pages with comprehensive filtering and actions
- Frontend: 4 API function files, 4 query hook files
- Frontend: 3 type definition files for TypeScript safety
- Backend: 4 new API controllers with full REST endpoints
- Full RTL support with Arabic translations

**Success Metrics:**
- Trial-to-paid conversion rate > 40%
- Average onboarding completion time < 7 days
- Failed payment recovery rate > 80%
- At-risk client identification time < 48 hours
- CSM response to critical alerts < 4 hours

---

## Implementation Roadmap

```
Q1 2026: Foundation & Quick Wins ✅ COMPLETED
+--------------------------------------------------+
| Week 1-2:  Webhook System                    ✅  |
| Week 3-5:  Referral Program Automation       ✅  |
| Week 6-7:  Voucher & Promo Code System       ✅  |
| Week 8-12: Member Self-Service Portal MVP    ✅  |
+--------------------------------------------------+

Q2 2026: Mobile & Engagement ✅ COMPLETED
+--------------------------------------------------+
| Week 1-12: Member Mobile App (KMP)           ✅  |
|            - iOS + Android via Compose           |
|            - Shared Kotlin business logic        |
|            - Class booking, QR check-in          |
|            - Push notifications                  |
| Week 8-12: Marketing Automation (Basic)      ✅  |
|            - Welcome sequences                   |
|            - Expiry reminders                    |
+--------------------------------------------------+

Q3 2026: Sales & Analytics ✅ COMPLETED
+--------------------------------------------------+
| Week 1-8:  CRM & Lead Management             ✅  |
|            - Lead pipeline                       |
|            - Lead scoring                        |
|            - Activity tracking                   |
| Week 4-10: Enhanced Reporting Suite          ✅  |
|            - 30+ reports                         |
|            - Dashboard customization             |
| Week 8-12: Family & Corporate Accounts       ✅  |
+--------------------------------------------------+

Q4 2026: Advanced Features ✅ COMPLETED
+--------------------------------------------------+
| Week 1-4:  Zone & Facility Booking           ✅  |
| Week 4-8:  Loyalty Points System             ✅  |
| Week 8-16: Staff Mobile App                  ✅  |
+--------------------------------------------------+

Q1 2027: Intelligence & Hardware ✅ COMPLETED
+--------------------------------------------------+
| Churn Prediction (ML)                        ✅  |
| Access Control Integration                   ✅  |
| Self-Service Kiosk Mode                      ✅  |
| Sales Forecasting                            ✅  |
| Equipment Integration                        ✅  |
| Wearable Integration                         ✅  |
+--------------------------------------------------+

Q2 2027: White-Label ✅ COMPLETED
+--------------------------------------------------+
| White-Label Mobile Apps                      ✅  |
|   - Custom colors (primary/secondary/accent)     |
|   - Custom logos (light/dark mode)               |
|   - Custom app names (English/Arabic)            |
|   - Feature toggles per tenant                   |
|   - Admin branding settings with live preview    |
|   - Dynamic theming in mobile apps               |
+--------------------------------------------------+

Q3 2027: Enterprise & Compliance ✅ COMPLETED
+--------------------------------------------------+
| Security & Compliance Management             ✅  |
|   - Compliance dashboard with framework scores   |
|   - ISO 27001, SOC 2, PCI DSS control tracking   |
|   - Evidence management with verification        |
|   - Risk assessment with 5x5 matrix              |
|   - Policy workflow management                   |
|   - Security events logging                      |
|   - PDPL compliance (Articles 7, 15-23, 26, 29)  |
|   - DSR workflow with 30-day tracking            |
|   - Breach register with 72h SDAIA notification  |
|   - Full bilingual support (English/Arabic)      |
+--------------------------------------------------+
| Agreement Management UI                      ✅  |
|   - Club Admin: Settings > Agreements pages      |
|   - Platform Admin: Agreements tab in Club View  |
|   - Agreement CRUD with bilingual content        |
|   - 8 agreement types with color badges          |
|   - Version control and activate/deactivate      |
|   - Health questions and mandatory flags         |
+--------------------------------------------------+

Q4 2027: Platform Operations ✅ COMPLETED
+--------------------------------------------------+
| Platform Operations & Client Success         ✅  |
|   - Self-service signup with plan recommendation |
|   - Public pricing page (Starter/Pro/Enterprise) |
|   - Gamified onboarding checklist (13 steps)     |
|   - Feature unlocking based on progress          |
|   - Client health scoring (4 weighted factors)   |
|   - Risk levels: LOW/MEDIUM/HIGH/CRITICAL        |
|   - Proactive alerts with severity levels        |
|   - Usage limit tracking and enforcement         |
|   - Smart dunning for payment recovery           |
|   - Multi-channel notification support           |
|   - Self-service support portal                  |
|   - Full bilingual support (English/Arabic)      |
+--------------------------------------------------+

Q1 2028: Dashboard Enhancement ✅ COMPLETED
+--------------------------------------------------+
| Platform Dashboard Redesign                  ✅  |
|   - Client lifecycle funnel (5 stages)           |
|   - Onboarding monitor with stalled detection    |
|   - Health overview with at-risk highlighting    |
|   - Alert center with playbook integration       |
|   - Dunning status widget with quick actions     |
|   - Health trend chart (30/60/90 day views)      |
|   - Quick action menu (6 context types)          |
|   - 4 new pages (health, alerts, dunning, detail)|
|   - Role-based enhancements (Admin/Sales/Support)|
|   - 4 backend API controllers                    |
|   - Full RTL and Arabic support                  |
+--------------------------------------------------+
```

---

## Completed Items (Archive)

### Backend Build Error Fixes (January 2026)

Fixed 309 compilation errors across Tier 3 modules. All error categories resolved:

| Category | Files Affected | Fix Applied |
|----------|----------------|-------------|
| BaseEntity Import Path | 9 files | Changed `com.liyaqa.shared.domain.model.BaseEntity` → `com.liyaqa.shared.domain.BaseEntity` |
| TenantContext Import | 6 files | Added correct import `com.liyaqa.shared.domain.TenantContext` |
| TenantContextHolder Usage | 2 files | Replaced with `TenantContext.getCurrentTenant().value` |
| Missing CurrentUser Class | 3 files | Created `CurrentUser.kt` with argument resolver |
| Missing CurrentUserService | 1 file | Created `CurrentUserService.kt` with security methods |
| JSON Type Mapping | 1 file | Using native Hibernate `@JdbcTypeCode(SqlTypes.JSON)` |
| Instant vs LocalDateTime | 1 file | Updated DTOs to use `Instant` types |
| Missing FamilyMemberStatus | 1 file | Added enum to `AccountEnums.kt` |
| FacilityBookingService Fields | 1 file | Fixed `memberNumber` and `slotDate` references |
| DTO Entity ID Access | 3 files | Resolved via BaseEntity inheritance |
| Missing Repository Methods | 2 files | Added `countActiveAtDate`, `countJoinedBetween`, `countChurnedBetween`, `getChurnByPlan` |

**Build Status:** ✅ `BUILD SUCCESSFUL`

---

### Test Suite Fixes (January 2026)

- [x] Fix TestDataFactory.kt: Update Club and MembershipPlan creation to use LocalizedText
- [x] Fix MembershipPlan constructor in TestDataFactory.kt
- [x] Fix AuthServiceTest.kt: Add mock for permissionService
- [x] Fix MemberServiceTest.kt: Add mocks for memberHealthService, agreementService, userRepository, passwordEncoder, permissionService
- [x] Fix SubscriptionServiceTest.kt: Fix parameter order and add missing mocks
- [x] Fix InvoiceServiceTest.kt: Add mock for clubRepository
- [x] Fix PayTabsPaymentServiceTest.kt: Add mock for orderService
- [x] Fix ClientSubscriptionServiceTest.kt: Add mock for organizationRepository
- [x] Fix ScheduledJobsTest.kt: Add mock for membershipPlanService
- [x] Fix AttendanceServiceTest.kt: Update MembershipPlan creation
- [x] Fix CheckInWorkflowIntegrationTest.kt: Update Club and MembershipPlan creation
- [x] Fix InvoicePdfIntegrationTest.kt: Update MembershipPlan creation
- [x] Fix SubscriptionFreezeIntegrationTest.kt: Update Club and MembershipPlan creation
- [x] Fix MemberControllerIntegrationTest.kt: Update all Club creations
- [x] Fix MemberRepositoryIntegrationTest.kt: Update Club creation
- [x] Fix SubscriptionRepositoryIntegrationTest.kt: Update Club and MembershipPlan creation
- [x] Fix BookingWorkflowIntegrationTest.kt: Update Club and MembershipPlan creation
- [x] Fix BookingServiceTest.kt: Update MembershipPlan creation
- [x] Fix DashboardSummaryIntegrationTest.kt: Update MembershipPlan creation
- [x] Fix ExportServiceTest.kt: Update MembershipPlan creation
- [x] Create ESLint configuration for frontend
- [x] Add frontend unit test script (Vitest)
- [x] Run ./gradlew test - All backend tests pass
- [x] Run ./gradlew build - Full backend build succeeds

---

## Appendix: Competitive Landscape

### Primary Competitor: Perfect Gym
- **Strength:** Enterprise features, ML analytics, mobile apps, global presence
- **Weakness:** Expensive, no Saudi-specific features, legacy tech
- **Pricing:** EUR 129/month + onboarding

### Other Competitors
| System | Strength | Weakness |
|--------|----------|----------|
| Mindbody | Wellness/spa focus, marketplace | Expensive, complex |
| Glofox | Modern UI, boutique focus | Limited enterprise |
| GymMaster | Affordable, access control | Dated UI, limited automation |
| ClubReady | Enterprise, franchise | US-focused, expensive |

### Liyaqa Positioning
**"The Saudi Arabia gym management system built for Saudi gyms"**
- Full ZATCA compliance (e-invoicing)
- Native Saudi payment integrations (STC Pay, SADAD, Tamara)
- Prayer time integration
- Gender-based access control
- Arabic-first with RTL support
- Modern SaaS architecture

---

*Last Updated: January 28, 2026*
*Version: 3.5 - Added Platform Dashboard Redesign (Lifecycle Funnel, Onboarding Monitor, Health Overview, Alert Center, Dunning Widget, Role-Based Enhancements)*
