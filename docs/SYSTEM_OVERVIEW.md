# Liyaqa System Overview

## Executive Summary

**Liyaqa** is a comprehensive, enterprise-grade Gym & Fitness Club Management SaaS platform specifically designed for the Saudi Arabian and GCC markets. Built with modern technology and domain-driven design principles, Liyaqa provides a complete solution for managing gym operations, member engagement, sales, marketing, and compliance.

### Key Differentiators

- **Saudi Arabia Native**: Built-in support for STC Pay, SADAD, Tamara, Mada, ZATCA e-invoicing, prayer times, Hijri calendar, and gender-based access control
- **Modern Technology Stack**: Spring Boot 4, Kotlin, Next.js 15, React 19, PostgreSQL, Kotlin Multiplatform for mobile
- **Multi-Tenant B2B Platform**: Support for platform-level client management, white-label deployments, and organization hierarchies
- **Comprehensive Feature Set**: 31 domain modules, 189+ domain models, 97+ API controllers, 245+ frontend pages
- **Bilingual Support**: Full English/Arabic support with RTL layouts
- **Multi-Channel Communication**: Email, SMS, WhatsApp, and push notifications

---

## System Statistics

| Metric | Value |
|--------|-------|
| **Domain Modules** | 32 |
| **Domain Models** | 189+ |
| **API Controllers** | 97+ |
| **Frontend Pages** | 245+ |
| **Database Migrations** | 73+ |
| **Payment Integrations** | 4 (PayTabs, STC Pay, SADAD, Tamara) |
| **Communication Channels** | 4 (Email, SMS, WhatsApp, Push) |
| **Equipment Integrations** | 4 (TechnoGym, Precor, Life Fitness, Milon) |
| **Wearable Integrations** | 6 (Fitbit, Garmin, Apple Watch, Strava, etc.) |

---

## Target Markets

### Primary Market: Saudi Arabia
- Full ZATCA e-invoicing compliance
- Prayer time integration (Umm Al-Qura calendar)
- Gender-based access control
- Hijri calendar support
- Saudi payment methods (STC Pay, SADAD, Mada)
- WhatsApp Business integration (95%+ penetration)

### Secondary Markets: GCC Region
- Bahrain, Kuwait, Oman, Qatar, UAE
- Bilingual support (English/Arabic)
- Cultural compliance features
- Regional payment integrations

---

## Architecture Overview

### Architecture Principles
- **Domain-Driven Design (DDD)**: 31 bounded contexts organized as independent modules
- **Multi-Tenancy**: Two-level isolation (Organization → Clubs)
- **Event-Driven**: Webhook system for third-party integrations
- **RESTful APIs**: 97+ controllers with OpenAPI documentation
- **Microservices-Ready**: Modular design supports future decomposition

### Technology Stack

#### Backend
- **Framework**: Spring Boot 4.0.1
- **Language**: Kotlin 2.2.0 (JVM 21)
- **Database**: PostgreSQL (with Flyway migrations)
- **Security**: Spring Security with JWT authentication
- **Caching**: Caffeine
- **Job Scheduling**: ShedLock for distributed locking
- **PDF Generation**: OpenPDF
- **QR Codes**: ZXing
- **Prayer Times**: Batoulapps Adhan library
- **Push Notifications**: Firebase Admin SDK
- **API Docs**: SpringDoc OpenAPI 3

#### Frontend (Web)
- **Framework**: Next.js 15.1.0 (App Router)
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5.7.3
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: Zustand, TanStack Query
- **Internationalization**: next-intl
- **Charts**: Recharts
- **HTTP Client**: ky

#### Mobile Apps (Member & Staff)
- **Framework**: Kotlin Multiplatform (KMP)
- **UI**: Compose Multiplatform (Material 3)
- **HTTP Client**: Ktor
- **Local Storage**: SQLDelight
- **Async**: Kotlin Coroutines
- **Push Notifications**: FCM (Firebase Cloud Messaging)
- **Platforms**: iOS and Android from shared codebase

#### Database
- **Primary**: PostgreSQL
- **Migrations**: Flyway (73+ migrations)
- **Connection Pool**: HikariCP
- **ORM**: Spring Data JPA with Hibernate

---

## User Types

### 1. Members
- Access via web portal or mobile app
- Self-service features (booking, payments, profile)
- View subscriptions, invoices, and attendance
- Fitness tracking with wearable integration
- Referral program participation

### 2. Gym Admins
- Full operational control within their organization
- Member management (CRUD, subscriptions, attendance)
- Class and trainer scheduling
- CRM and lead management
- Marketing campaigns
- Financial operations (invoicing, payments, reporting)
- Shop/POS management
- Settings and configuration

### 3. Platform Admins (B2B)
- Manage client organizations (gyms/clubs)
- Platform-level billing and subscriptions
- Client health monitoring and alerts
- Dunning and payment recovery
- Support ticket management
- Onboarding new clients
- Usage analytics and limits

### 4. Kiosk (Self-Service)
- Touchscreen interface for in-gym operations
- Member check-in (QR, RFID, phone)
- Class booking
- Membership purchase
- Payment processing
- Agreement signing

---

## Key Capabilities

### Member Management
- Complete member lifecycle (onboarding, active, frozen, expired, cancelled)
- Subscription plans with flexible pricing
- Membership contracts with terms and conditions
- Freeze and cancellation workflows
- Family and corporate accounts
- Document signing and storage

### Operations
- Class scheduling and booking
- Personal training sessions
- Attendance tracking (check-in/check-out)
- Facility and zone booking (tennis courts, pools, studios)
- Equipment tracking and maintenance
- Access control integration

### Sales & Marketing
- Lead capture and CRM
- Sales pipeline management
- Marketing automation campaigns
- Email, SMS, WhatsApp, and push notifications
- Referral program with rewards
- Voucher and promo code system
- A/B testing for campaigns

### Financial
- Flexible billing cycles
- Multiple payment gateways
- Subscription management
- Invoicing with ZATCA compliance
- Payment collection and reconciliation
- Wallet and credit system
- Revenue forecasting

### Retention & Engagement
- Loyalty points system with tiers
- Churn prediction (ML-powered)
- At-risk member identification
- Automated retention campaigns
- Member activity tracking
- Fitness goal tracking

### Reporting & Analytics
- Revenue reports (by plan, location, period)
- Member retention and churn analysis
- Class utilization and attendance
- Trainer performance metrics
- Sales team performance
- Custom dashboard widgets
- Scheduled report delivery

### Integrations
- Payment gateways (PayTabs, STC Pay, SADAD, Tamara)
- Communication (Email, SMS, WhatsApp, Firebase)
- Compliance (ZATCA e-invoicing)
- Equipment (TechnoGym, Precor, Life Fitness, Milon)
- Wearables (Fitbit, Garmin, Apple Watch, Strava, Oura, WHOOP)
- Webhook system for custom integrations

### Compliance & Security
- ZATCA e-invoicing for Saudi Arabia
- Data security and audit logging
- Role-based access control (RBAC)
- Multi-factor authentication
- Privacy compliance (data retention, consent)
- Security framework adherence

### Platform Features (B2B)
- Multi-tenant architecture with data isolation
- Client organization management
- White-label branding support
- Platform-level billing and plans
- Client health scoring
- Usage tracking and limits
- Dunning sequences for failed payments
- Onboarding workflow management
- Support ticket system
- Alert and notification center

---

## Domain Modules

Liyaqa is organized into 32 domain modules, each responsible for a specific business capability:

| Module | Description | Models | Key Features |
|--------|-------------|--------|--------------|
| **Membership** | Core member lifecycle | 24 | Members, plans, subscriptions, contracts, cancellations |
| **Platform** | B2B client management | 17 | Client orgs, plans, billing, health scores, alerts |
| **Billing** | Payment processing | 5 | Transactions, payment methods, gateways |
| **CRM** | Lead and sales pipeline | 6 | Leads, pipeline, scoring, assignment |
| **Marketing** | Campaign automation | 8 | Campaigns, segments, A/B testing, enrollment |
| **Loyalty** | Points and rewards | 4 | Points, tiers, rewards, redemptions |
| **Scheduling** | Class management | 5 | Classes, schedules, bookings, waitlists |
| **Trainer** | PT management | 4 | Trainers, sessions, availability, packages |
| **Equipment** | Equipment tracking | 7 | Equipment, maintenance, provider sync |
| **Facilities** | Facility booking | 5 | Facilities, bookings, zones, schedules |
| **Access Control** | Physical access | 8 | Devices, zones, logs, time rules |
| **Attendance** | Check-in tracking | 2 | Check-ins, check-outs, real-time status |
| **Referral** | Referral program | 5 | Links, tracking, rewards, leaderboard |
| **Compliance** | Regulatory compliance | 19 | Frameworks, controls, audits, certifications |
| **Churn** | Retention analytics | 6 | Risk scoring, predictions, interventions |
| **Organization** | Club hierarchy | 7 | Organizations, clubs, locations, settings |
| **Accounts** | Corporate/family groups | 5 | Family groups, corporate accounts |
| **Employee** | Staff management | 5 | Employees, roles, schedules, performance |
| **Auth** | Authentication | 4 | Users, roles, permissions, sessions |
| **Notification** | Multi-channel messaging | 4 | Templates, delivery, preferences |
| **Reporting** | Analytics | 3 | Reports, dashboards, exports |
| **Forecasting** | Revenue forecasting | 6 | Predictions, scenarios, budgets |
| **Kiosk** | Self-service terminals | 4 | Devices, sessions, transactions |
| **Wearables** | Device integration | 6 | Connections, activities, workouts |
| **Voucher** | Discount codes | 3 | Codes, usage, tracking |
| **Shop** | E-commerce | 7 | Products, inventory, orders, POS |
| **Branding** | White-label | 1 | Themes, logos, customization |
| **Webhook** | Event webhooks | 3 | Endpoints, events, delivery |
| **Staff Mobile** | Mobile APIs | 0 | Staff-specific endpoints |
| **Shared** | Cross-cutting | - | Utils, exceptions, multi-tenancy |

---

## Multi-Tenancy Model

### Two-Level Hierarchy

```
Platform (Liyaqa)
├── Organization A (e.g., "FitLife Saudi")
│   ├── Club 1 (Riyadh - North)
│   ├── Club 2 (Riyadh - East)
│   └── Club 3 (Jeddah)
├── Organization B (e.g., "GymZone")
│   ├── Club 1 (Dammam)
│   └── Club 2 (Khobar)
└── Organization C (e.g., "PowerGym")
    └── Club 1 (Mecca)
```

### Tenant Isolation
- **Database Level**: `organization_id` and `club_id` on most tables
- **Application Level**: TenantContext with request-scoped tenant info
- **API Level**: `X-Organization-Id` and `X-Club-Id` headers (optional, auto-detected from subdomain)
- **Data Access**: JPA filters ensure tenant isolation

### Subdomain Routing
- **Platform Admin**: `app.liyaqa.com` or `platform.liyaqa.com`
- **Client Admin**: `{client-slug}.liyaqa.com` (e.g., `fitlife.liyaqa.com`)
- **Member Portal**: `{client-slug}.liyaqa.com/member`
- **Kiosk**: `kiosk.liyaqa.com` or `{client-slug}.liyaqa.com/kiosk`

---

## Authentication & Security

### Authentication Methods
- **JWT Token-Based**: For web and API access
- **Magic Link**: Passwordless login for members
- **Password**: Traditional username/password
- **QR Code**: Mobile app check-in
- **RFID**: Physical access cards

### Security Features
- Role-based access control (RBAC)
- Permission-based authorization
- Multi-factor authentication (MFA)
- Password policies and rotation
- Session management
- Audit logging
- Data encryption at rest and in transit
- CORS and CSRF protection

---

## Communication Channels

### Email
- SMTP integration
- Transactional emails (invoices, receipts)
- Marketing campaigns
- Template engine with variables

### SMS
- Twilio integration
- OTP verification
- Appointment reminders
- Payment notifications

### WhatsApp
- WhatsApp Business API
- Rich message templates
- Media support (images, PDFs)
- 95%+ penetration in Saudi Arabia

### Push Notifications
- Firebase Cloud Messaging (FCM)
- Apple Push Notification Service (APNs)
- Real-time alerts
- Deep linking to app screens

---

## Payment Processing

### Supported Gateways
1. **PayTabs**: Primary card processor
2. **STC Pay**: Digital wallet (Saudi)
3. **SADAD**: Bank transfer system (Saudi)
4. **Tamara**: Buy-now-pay-later (BNPL)

### Payment Features
- One-time payments
- Recurring subscriptions
- Partial payments
- Refunds and cancellations
- Payment method tokenization
- PCI compliance
- Receipt generation
- ZATCA-compliant e-invoices

---

## Deployment Architecture

### Environments
- **Development**: Local development with H2/PostgreSQL
- **Staging**: Pre-production testing environment
- **Production**: Multi-region deployment (Saudi Arabia primary)

### Infrastructure Components
- **Application Server**: Spring Boot embedded Tomcat
- **Database**: PostgreSQL (managed service recommended)
- **File Storage**: Local filesystem or S3-compatible storage
- **Caching**: Caffeine (in-memory)
- **Background Jobs**: Spring Scheduler with ShedLock
- **Monitoring**: Spring Boot Actuator endpoints

### Scalability
- Horizontal scaling supported (stateless API)
- Database connection pooling (HikariCP)
- Caching layer for performance
- Async job processing for long-running tasks
- Webhook delivery with retry logic

---

## Use Cases

### For Gym Owners
- Automate member onboarding and renewals
- Track attendance and facility usage
- Manage staff schedules and payroll
- Generate financial reports
- Run marketing campaigns
- Monitor business performance

### For Members
- Book classes and PT sessions on mobile
- Pay invoices and manage subscriptions
- Track fitness progress
- Receive personalized notifications
- Refer friends and earn rewards
- Access member-only content

### For Sales Teams
- Capture leads from multiple sources
- Track prospects through sales pipeline
- Schedule tours and follow-ups
- Convert leads with targeted offers
- Measure conversion rates
- Manage sales performance

### For Trainers
- View assigned classes and sessions
- Mark attendance
- Track client progress
- Communicate with members
- Manage availability

### For Platform Operators (B2B)
- Onboard new gym clients
- Monitor client health and usage
- Provide support and assistance
- Track platform revenue
- Manage billing and subscriptions
- Scale operations efficiently

---

## Success Metrics

### Operational Efficiency
- 30% reduction in administrative workload
- 60% of members using self-service
- 20% faster check-in times

### Member Engagement
- 50% member app adoption
- 20% increase in class bookings
- 10% improvement in retention

### Sales Performance
- 25% improvement in lead-to-member conversion
- 50% reduction in lead response time
- 20% reduction in member acquisition cost

### Financial
- Automated invoicing and payment collection
- 15% reduction in payment failures
- Predictable revenue forecasting

### Marketing
- 40% email open rates
- 15% improvement in campaign effectiveness
- 60% reduction in manual outreach

---

## Competitive Advantages

| Advantage | Liyaqa | Perfect Gym | Others |
|-----------|--------|-------------|--------|
| **Saudi-Native Features** | Full support (ZATCA, STC Pay, prayer times) | Limited | Minimal |
| **Modern Tech Stack** | Spring Boot 4, Next.js 15, Kotlin | Legacy | Varies |
| **Mobile Apps** | KMP (iOS + Android from one codebase) | Native separate | Varies |
| **Multi-Tenant B2B** | Built-in platform model | Enterprise only | Limited |
| **Bilingual (AR/EN)** | Native RTL support | Translation only | Varies |
| **WhatsApp Integration** | Built-in | Add-on | Rare |
| **Equipment Integration** | 4 major providers | Many providers | Varies |
| **Churn Prediction** | ML-powered | Basic reports | Rare |
| **Compliance** | ZATCA, security frameworks | General | Varies |

---

## Future Roadmap

### Short-Term (6 Months)
- Enhanced analytics with AI insights
- Additional payment integrations
- More wearable device support
- Advanced reporting features
- Mobile app enhancements

### Medium-Term (12 Months)
- Biometric access integration
- Nutrition tracking and meal plans
- Marketplace for trainer services
- Social features (member community)
- Virtual class streaming

### Long-Term (24 Months)
- AI-powered personal training recommendations
- Advanced business intelligence
- Franchise management features
- International expansion support
- Blockchain-based loyalty programs

---

## Getting Started

### For Developers
See [ARCHITECTURE.md](ARCHITECTURE.md) for technical architecture details.
See [API_REFERENCE.md](API_REFERENCE.md) for API documentation.
See [CONFIGURATION.md](CONFIGURATION.md) for setup instructions.

### For Users
See [user-guides/ADMIN_GUIDE.md](user-guides/ADMIN_GUIDE.md) for admin operations.
See [user-guides/MEMBER_GUIDE.md](user-guides/MEMBER_GUIDE.md) for member features.
See [user-guides/PLATFORM_ADMIN_GUIDE.md](user-guides/PLATFORM_ADMIN_GUIDE.md) for platform management.

### For Business
See [FEATURES.md](FEATURES.md) for comprehensive feature documentation.
See [INTEGRATIONS.md](INTEGRATIONS.md) for integration capabilities.

---

## Support & Resources

- **Technical Documentation**: See `docs/` directory
- **API Documentation**: Available at `/swagger-ui.html` when running
- **Source Code**: Organized by domain module in `backend/src/main/kotlin/com/liyaqa/`
- **Frontend**: Next.js app in `frontend/src/app/`
- **Mobile Apps**: KMP project in `liyaqa-member-app/`

---

*Last Updated: January 2026*
*Version: 1.0*
