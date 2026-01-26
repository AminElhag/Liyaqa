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

#### 19. White-Label Mobile Apps
**Priority:** P2 | **Effort:** 3-4 months | **ROI:** 4/10

**Description:**
Customizable branded mobile apps for enterprise clients.

**Core Features:**
- [ ] White-label app builder
- [ ] Custom logo and colors
- [ ] Custom app name
- [ ] App store publication support
- [ ] Per-client customization
- [ ] Feature toggles per client

**Technical Requirements:**
- Build on Kotlin Multiplatform member app codebase
- Flavor/build variant system for white-labeling
- Theming via Compose Material 3 dynamic colors

---

#### 20. Security Certifications
**Priority:** P2 | **Effort:** 3-6 months | **ROI:** 3.5/10

**Description:**
Enterprise security compliance certifications.

**Certifications:**
- [ ] ISO 27001 (Information Security)
- [ ] SOC 2 Type II
- [ ] PCI DSS (Payment Card Industry)
- [ ] PDPL Compliance (Saudi Privacy Law)

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

Q2-Q4 2027: Enterprise & Compliance (UPCOMING)
+--------------------------------------------------+
| Q2: White-Label Mobile Apps                      |
| Q3: Security Certifications (ISO 27001, SOC 2)   |
| Q4: PCI DSS & PDPL Compliance                    |
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

*Last Updated: January 26, 2026*
*Version: 3.0*
