# Liyaqa Feature Reference

**Complete Feature Documentation for Liyaqa Gym Management Platform**

---

## Table of Contents

### Part 1: Frontend Features by User Role
- [1. Member Portal Features](#1-member-portal-features)
- [2. Admin Portal Features](#2-admin-portal-features)
- [3. Platform Admin Portal Features](#3-platform-admin-portal-features)
- [4. Kiosk Interface](#4-kiosk-interface)
- [5. Authentication Pages](#5-authentication-pages)
- [6. Public Pages](#6-public-pages)

### Part 2: Backend Features by Domain Module
- [7. Backend Domain Modules](#7-backend-domain-modules)
- [8. Mobile Applications](#8-mobile-applications)
- [9. System-Wide Features](#9-system-wide-features)

---

# Part 1: Frontend Features by User Role

## 1. Member Portal Features

The Member Portal provides self-service functionality for gym members via web browser or mobile app.

**Access**: `{client-slug}.liyaqa.com/member` or via mobile app

### 1.1 Dashboard & Home

**Route**: `/member` (home page)

**Features**:
- Quick action cards for common tasks
- Current subscription status with progress indicators
- Upcoming class bookings
- Wallet balance display
- Recent activity feed
- Notifications and alerts

**Key Metrics Displayed**:
- Days remaining on subscription
- Classes remaining this month
- Loyalty points balance
- Freeze days available

---

### 1.2 Subscription Management

**Route**: `/member/subscriptions`

**Features**:
- View active subscription with detailed plan information
- Display subscription progress bar (time remaining)
- Subscription stats dashboard:
  - Classes remaining
  - Guest passes available
  - Freeze days balance
  - Auto-renew status
- View membership contract with cooling-off period tracking
- Plan change/upgrade/downgrade dialog
- Freeze subscription capability
- Cancel subscription workflow
- View subscription history

**Actions**:
- **Change Plan**: Upgrade or downgrade membership with proration calculation
- **Freeze Subscription**: Request temporary pause with day selection
- **Cancel Subscription**: Submit cancellation request with reason
- **View Contract**: Read and download membership contract PDF
- **Enable/Disable Auto-Renewal**: Toggle automatic subscription renewal

**Key Components**:
- Plan comparison dialog
- Cancellation workflow with exit survey
- Freeze request form with calendar picker
- Contract viewer with digital signature

**Localization**: Full Arabic/English support with RTL layout

---

### 1.3 Profile Management

**Route**: `/member/profile`

**Features**:
- Edit personal information:
  - First name and last name (bilingual)
  - Phone number
  - Date of birth
  - Email (read-only, verification required to change)
- Manage emergency contact information
- View membership status badge
- Display member ID and QR code
- Address information management
- Profile photo upload

**Validation**:
- Phone number format validation
- Age restriction checks
- Required field enforcement

**Security**:
- Password-protected profile changes
- Email verification for sensitive updates
- Two-factor authentication toggle

---

### 1.4 Class Booking

**Routes**:
- `/member/bookings` - View bookings
- `/member/bookings/new` - Book new class

**Features**:
- Browse upcoming classes with 7-day rolling window
- Filter classes by:
  - Date
  - Class type (Yoga, HIIT, Spinning, etc.)
  - Trainer
  - Location
  - Time of day
- View class details:
  - Trainer name and photo
  - Class description
  - Duration
  - Location/studio
  - Available spots vs. capacity
  - Difficulty level
- Book classes with real-time availability
- Cancel upcoming bookings
- View booking history
- Waitlist for full classes

**Booking Management**:
- **Upcoming Bookings Tab**: See all confirmed future bookings
- **Past Bookings Tab**: View attendance history
- **Cancellation**: Cancel with configurable cancellation window
- **Booking Confirmation**: Bottom-sheet confirmation with class details

**Key Features**:
- Real-time spot availability
- Automatic waitlist promotion
- Booking reminders (24h, 1h before)
- Late cancellation penalties
- No-show tracking

**Localization**: Date/time formatting per locale, full Arabic/English support

---

### 1.5 Personal Training (PT) Sessions

**Route**: `/member/pt-sessions`

**Features**:
- View upcoming PT sessions
- Display session details:
  - Trainer name and specialization
  - Session date and time
  - Session duration
  - Location
  - Session status
- Cancel PT sessions with refund policy display
- Book new PT sessions
- View trainer availability calendar
- Purchase PT packages

**Session Statuses**:
- **Requested**: Awaiting trainer confirmation
- **Confirmed**: Session confirmed by trainer
- **In Progress**: Currently ongoing
- **Completed**: Session finished
- **Cancelled**: Cancelled by member or trainer
- **No Show**: Member didn't attend

**Actions**:
- Request new PT session with preferred time
- Cancel session (with cancellation fee if applicable)
- Rate completed session
- View trainer profile and reviews

---

### 1.6 Payments & Invoices

**Route**: `/member/payments`

**Features**:
- **Invoices Tab**:
  - View all invoices with status badges
  - Filter by status (Pending, Paid, Overdue, Cancelled)
  - Display invoice details:
    - Invoice number and date
    - Line items with descriptions
    - Subtotal, tax, and total
    - Payment due date
    - Payment status
  - Pay pending invoices online
  - Download invoice PDF
  - View payment history per invoice

- **Wallet Tab**:
  - Display wallet balance
  - View transaction history
  - Top-up wallet with credit
  - Filter transactions by type

**Invoice Statuses**:
- Draft
- Issued
- Paid
- Partially Paid
- Overdue
- Cancelled

**Payment Features**:
- Multiple payment methods (card, STC Pay, SADAD, Tamara)
- Save payment methods for future use
- Automatic payment for subscriptions
- Payment receipts via email
- ZATCA-compliant e-invoices (Saudi Arabia)

**Currency**: SAR (Saudi Riyal) with proper formatting

---

### 1.7 Membership Freeze

**Route**: `/member/freeze`

**Features**:
- Display freeze balance dashboard:
  - Total freeze days allocated
  - Used freeze days
  - Available freeze days
- Submit freeze request form:
  - Select start date
  - Select number of days to freeze
  - Provide reason (optional)
- View active freezes with:
  - Freeze start and end dates
  - Days remaining
  - Cancel freeze option
- View freeze history
- Handle "no active subscription" state gracefully

**Freeze Rules**:
- Minimum freeze duration (typically 7 days)
- Maximum freeze duration (per terms)
- Notice period for freeze activation
- Auto-resume after freeze period

**Notifications**:
- Freeze approval/rejection
- Freeze start reminder
- Freeze ending reminder
- Auto-resume notification

---

### 1.8 Referral Program

**Route**: `/member/referrals`

**Features**:
- Display referral statistics:
  - Total referrals sent
  - Successful conversions
  - Link clicks
  - Conversion rate percentage
- Unique referral link sharing:
  - Copy link button
  - Share via WhatsApp, email, SMS
  - QR code generation
- View rewards earned from referrals
- Referral history table with:
  - Referred member name
  - Referral date
  - Conversion status
  - Reward status
- Referral leaderboard (top referrers)

**Reward Tracking**:
- Pending rewards
- Approved rewards
- Rewards credited to wallet
- Total earnings from referrals

**Gamification**:
- Referral badges (Bronze, Silver, Gold, Platinum)
- Milestone rewards
- Social sharing incentives

---

### 1.9 Fitness Activity Dashboard

**Route**: `/member/fitness`

**Features**:
- Today's Activity Progress:
  - Steps (with goal)
  - Calories burned
  - Active minutes
  - Distance covered
- Activity Statistics (7/30/90 day periods):
  - Average daily steps
  - Total calories burned
  - Total active hours
  - Average sleep duration
- Recent Workouts List:
  - Workout type
  - Duration
  - Calories burned
  - Date and time
- Period selector (Last 7, 30, 90 days)
- Progress charts and visualizations
- Activity trends over time

**Data Sources**:
- Connected wearables
- Manual workout logs
- Gym equipment synced workouts
- Class attendance

---

### 1.10 Wearable Device Management

**Route**: `/member/wearables`

**Features**:
- Browse available wearable platforms:
  - OAuth-based (Fitbit, Google Fit, Strava)
  - SDK-based (Apple Health, Samsung Health)
- Connect new wearable devices:
  - OAuth authentication flow
  - Permission consent
  - Token storage
- View connected devices with:
  - Platform name and logo
  - Connection date
  - Last sync timestamp
  - Sync status (Success, Failed, Pending)
  - Token expiration status
- Manual sync trigger button
- Disconnect device with confirmation
- Token refresh for expired connections

**Supported Platforms**:
- Fitbit
- Google Fit
- Apple Health
- Garmin Connect
- Strava
- Oura Ring
- WHOOP

**Sync Features**:
- Automatic daily sync (background job)
- Manual sync on-demand
- Sync status notifications
- Conflict resolution for duplicate data

---

### 1.11 Agreements & Contracts

**Route**: `/member/agreements`

**Features**:
- View pending mandatory agreements requiring signature
- Display signed agreements with completion date
- Agreement signing interface with:
  - Full agreement text display
  - Digital signature pad
  - Consent checkboxes
  - Date and timestamp
- Download signed agreement PDF
- Track cooling-off period (Saudi 7-day requirement)
- Success confirmation after signing

**Agreement Types**:
- Membership agreement
- Terms and conditions
- Privacy policy
- Health waiver
- Photo consent
- Direct debit authorization

**Compliance**:
- Saudi cooling-off period tracking
- Signature validity verification
- Agreement version management
- Audit trail for all agreements

---

### 1.12 Settings & Preferences

**Route**: `/member/settings`

**Features**:
- **Security Settings**:
  - Change password with validation
  - Password strength indicator
  - Two-factor authentication setup
  - Active sessions management
  - Login history

- **Notification Preferences**:
  - Toggle notification channels:
    - Email
    - SMS
    - Push notifications
    - WhatsApp
  - Configure notification types:
    - Booking reminders
    - Subscription alerts
    - Payment notifications
    - Class cancellations
    - Marketing communications
    - Invoice reminders

- **Language & Locale**:
  - Select interface language (English/Arabic)
  - Date format preference
  - Number format preference
  - Currency display

- **Privacy Settings**:
  - Profile visibility
  - Activity sharing
  - Leaderboard participation
  - Marketing consent

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- Password confirmation match

---

### 1.13 Additional Member Features

#### QR Code for Check-In
**Route**: `/member/qr`
- Display member QR code for gym access
- Offline-capable QR code generation
- Auto-refresh for security
- Alternative member ID display

#### Notification Center
**Route**: `/member/notifications`
- View all notifications
- Mark as read/unread
- Filter by type
- Clear all notifications

#### Payment Methods
**Route**: `/member/payment-methods`
- Manage saved payment methods
- Add new card/payment method
- Set default payment method
- Delete payment methods
- PCI-compliant card display (masked)

---

## 2. Admin Portal Features

The Admin Portal provides comprehensive gym management tools for staff and administrators.

**Access**: `{client-slug}.liyaqa.com` (after login)

### 2.1 Admin Dashboard

**Route**: `/` (after admin login)

**Features**:
- **Hero Statistics Cards**:
  - Total active members (with trend)
  - Monthly revenue (with YoY comparison)
  - Today's attendance count
  - Current facility occupancy
  - New leads this week
  - Pending payments

- **Revenue Trend Chart**:
  - Last 30 days revenue visualization
  - Comparison with previous period
  - Forecast for next 30 days

- **Activity Timeline**:
  - Recent member signups
  - Class bookings
  - Payments received
  - Support tickets
  - Staff actions

- **Quick Actions**:
  - Add new member
  - Create invoice
  - Manual check-in
  - View reports
  - Schedule class

- **Alerts & Notifications**:
  - Low attendance alerts
  - Payment failures
  - Subscription expirations
  - Equipment maintenance due
  - Staff scheduling conflicts

**Filters**:
- Date range selector
- Location/club filter
- Comparison period toggle

---

### 2.2 Member Management

**Routes**:
- `/members` - Member list
- `/members/new` - Add new member
- `/members/[id]` - Member detail view
- `/members/[id]/edit` - Edit member

**Features**:
- **Member List**:
  - Search by name, email, phone, member ID
  - Filter by:
    - Status (Active, Frozen, Expired, Cancelled)
    - Membership plan
    - Join date range
    - Location
    - Activity level
  - Sort by name, join date, expiry date
  - Bulk actions (export, send message, assign tags)
  - Pagination with configurable page size
  - Quick action buttons (edit, view, check-in)

- **Member Detail View**:
  - Personal information
  - Current subscription with timeline
  - Attendance history
  - Booking history
  - Payment history and invoices
  - Wallet balance and transactions
  - Referrals made
  - Loyalty points
  - Notes and activity log
  - Health metrics
  - Connected wearables
  - Family/corporate account membership

- **Member Actions**:
  - Edit member information
  - Create new subscription
  - Freeze/unfreeze membership
  - Process cancellation
  - Manually check-in
  - Add payment
  - Send notification
  - Add internal note
  - View full audit trail

- **Create Member Account Dialog**:
  - Account creation form
  - Temporary password generation
  - Welcome email toggle
  - Send credentials option

- **Reset Password Dialog**:
  - Password reset for member accounts
  - Send reset link via email/SMS
  - Generate temporary password

**Bulk Operations**:
- Bulk import from CSV/Excel
- Bulk status updates
- Bulk messaging
- Bulk tag assignment
- Bulk export

**Member Statistics**:
- Total members by status
- Member acquisition trend
- Member retention rate
- Average member lifetime value
- Churn rate

---

### 2.3 Subscription & Plan Management

**Routes**:
- `/subscriptions` - Active subscriptions
- `/subscriptions/new` - Create subscription
- `/plans` - Membership plans
- `/plans/new` - Create new plan

**Subscription Features**:
- View all active subscriptions with filters
- Display subscription details:
  - Member name
  - Plan details
  - Start and end dates
  - Payment status
  - Auto-renewal status
- Renew expiring subscriptions
- Process subscription changes
- Handle plan upgrades/downgrades with proration
- Manage freeze requests
- Process cancellations

**Membership Plan Management**:
- Create and edit membership plans
- Configure plan details:
  - Plan name (English/Arabic)
  - Billing cycle (monthly, quarterly, annual)
  - Price and currency
  - Access hours (24/7, peak, off-peak)
  - Included classes per month
  - Guest passes
  - Freeze days allocation
  - Commitment period
  - Early termination fee
- Set plan visibility (active/inactive)
- Assign plans to specific locations
- Configure plan-specific benefits
- Plan usage analytics

---

### 2.4 Class & Training Management

**Routes**:
- `/classes` - Class list
- `/classes/new` - Create class
- `/schedules` - Class schedules
- `/sessions` - Individual sessions

**Class Management Features**:
- **Class Catalog**:
  - Create class types (Yoga, Spinning, HIIT, Boxing, etc.)
  - Set class descriptions and categories
  - Upload class images
  - Define difficulty levels
  - Set capacity limits

- **Class Scheduling**:
  - Create recurring class schedules (daily, weekly, monthly)
  - Set class times and duration
  - Assign trainers to classes
  - Assign rooms/studios
  - Set capacity and waitlist limits
  - Define booking window (how far in advance)
  - Configure cancellation policies

- **Session Management**:
  - View individual class sessions
  - Mark attendance for sessions
  - Cancel sessions with notification
  - Reschedule sessions
  - View booking list per session
  - Manage waitlists

- **Trainer Assignment**:
  - Assign primary and substitute trainers
  - View trainer availability
  - Manage trainer schedules
  - Track trainer workload

**Gender-Specific Scheduling** (Saudi Arabia):
- Configure gender-separated time slots
- Ladies-only classes
- Men-only classes
- Mixed classes
- Automatic access control integration

**Analytics**:
- Class attendance rates
- Popular classes report
- Trainer performance metrics
- Capacity utilization
- No-show rates
- Booking trends

---

### 2.5 Attendance & Check-In

**Routes**:
- `/attendance` - Attendance dashboard
- `/attendance/check-in` - Manual check-in

**Features**:
- **Manual Check-In**:
  - Search member by name, phone, ID, QR code
  - Verify membership status
  - Record check-in timestamp
  - Display member photo for verification
  - Check-out recording
  - Visitor/guest check-in

- **Attendance Dashboard**:
  - Current occupancy count
  - Today's check-ins list
  - Check-in timeline
  - Average duration per visit
  - Peak hours analysis
  - Attendance by membership type

- **Attendance Reports**:
  - Daily/weekly/monthly attendance reports
  - Member attendance frequency
  - No-show tracking
  - Class attendance rates
  - Facility occupancy over time

**Integration**:
- Access control hardware integration
- Biometric device sync
- RFID card reader support
- QR code scanner integration
- Mobile app check-in sync

---

### 2.6 Bookings Management

**Route**: `/bookings`

**Features**:
- View all class bookings across schedule
- Filter by date, class, member, status
- Calendar view of bookings
- Manage waitlists
- Process cancellations and no-shows
- Override capacity limits (admin privilege)
- Booking analytics and reports

**Waitlist Management**:
- View waitlist per class
- Auto-promote when spots available
- Manual waitlist promotion
- Waitlist notification settings

---

### 2.7 Shop & POS

**Routes**:
- `/shop` - Product catalog
- `/shop/products/new` - Add product
- `/shop/orders` - Order history
- `/shop/pos` - Point of sale

**Features**:
- **Product Catalog Management**:
  - Create and edit products
  - Upload product images
  - Set pricing and inventory
  - Product categories
  - Product variants (size, color)
  - Stock tracking with alerts

- **Point of Sale (POS)**:
  - Quick product search
  - Shopping cart interface
  - Apply discounts and vouchers
  - Multiple payment methods
  - Receipt printing
  - Cash drawer integration
  - Barcode scanning support

- **Order Management**:
  - View order history
  - Order fulfillment tracking
  - Refund processing
  - Order status updates
  - Customer communication

- **Inventory Management**:
  - Stock level monitoring
  - Low stock alerts
  - Stock adjustment
  - Inventory reports
  - Supplier management

---

### 2.8 Invoicing & Payments

**Routes**:
- `/invoices` - Invoice list
- `/invoices/new` - Create invoice
- `/invoices/[id]` - Invoice detail
- `/payments` - Payment transactions

**Invoice Management**:
- Create manual invoices
- Automatic subscription invoices
- Line item management
- Tax calculation (VAT/GST)
- Apply discounts
- Invoice templates
- Send invoice via email/WhatsApp
- Download invoice PDF
- ZATCA-compliant e-invoice generation (Saudi Arabia)

**Payment Processing**:
- Record manual payments (cash, check)
- Process card payments
- STC Pay integration
- SADAD bank transfers
- Tamara BNPL payments
- Payment reconciliation
- Refund processing
- Payment receipt generation

**Financial Reports**:
- Revenue reports by period
- Outstanding invoices
- Payment collection efficiency
- Revenue by product/service
- Revenue by location
- Tax reports

---

### 2.9 CRM & Lead Management

**Routes**:
- `/leads` - Lead pipeline
- `/leads/new` - Add lead
- `/leads/[id]` - Lead detail
- `/leads/forms` - Lead capture forms
- `/leads/forms/[id]` - Edit form

**Lead Management**:
- **Lead Pipeline View**:
  - Kanban board with stages (New → Contacted → Tour → Trial → Negotiation → Won/Lost)
  - Drag-and-drop to move leads between stages
  - Lead cards with key information
  - Filter and search leads
  - Lead assignment to sales reps

- **Lead Detail View**:
  - Contact information
  - Lead source and campaign
  - Lead score (automated)
  - Activity timeline
  - Scheduled follow-ups
  - Notes and communication history
  - Convert to member action

- **Lead Activities**:
  - Log calls, emails, meetings
  - Schedule follow-up tasks
  - Send email from CRM
  - Record tour dates
  - Track trial usage

- **Lead Capture Forms**:
  - Create custom lead capture forms
  - Embeddable forms for website
  - Form builder with drag-and-drop
  - Form analytics (views, submissions)
  - Auto-assignment rules
  - Email notifications on submission

**Lead Scoring**:
- Configure scoring rules
- Automatic score calculation
- Score-based lead prioritization
- Hot/warm/cold lead classification

**Lead Assignment**:
- Manual assignment
- Round-robin auto-assignment
- Location-based assignment
- Source-based assignment
- Workload balancing

**Sales Analytics**:
- Conversion rates by stage
- Average time in each stage
- Lead source effectiveness
- Sales rep performance
- Win/loss analysis

---

### 2.10 Marketing & Campaigns

**Routes**:
- `/marketing/campaigns` - Campaign list
- `/marketing/campaigns/new` - Create campaign
- `/marketing/campaigns/[id]` - Campaign detail
- `/marketing/campaigns/[id]/analytics` - Campaign analytics
- `/marketing/segments` - Member segments
- `/marketing/segments/new` - Create segment

**Campaign Management**:
- **Campaign Types**:
  - One-time broadcast
  - Drip campaigns (multi-step sequences)
  - Triggered campaigns (event-based)
  - A/B test campaigns

- **Campaign Creation**:
  - Campaign name and goal
  - Select target segment
  - Choose channels (Email, SMS, WhatsApp, Push)
  - Design message content
  - Schedule send time
  - Set campaign duration
  - Configure success metrics

- **Multi-Step Campaigns**:
  - Welcome series
  - Onboarding sequences
  - Re-engagement campaigns
  - Win-back campaigns
  - Birthday campaigns

- **Message Editor**:
  - Rich text email editor
  - SMS character counter
  - WhatsApp template selector
  - Push notification composer
  - Variable insertion ({{firstName}}, etc.)
  - Preview across devices

**Segment Management**:
- **Segmentation Criteria**:
  - Demographics (age, gender, location)
  - Membership status and plan
  - Activity level (visits per month)
  - Engagement score
  - Churn risk level
  - Payment status
  - Class preferences
  - Referral participation

- **Segment Types**:
  - Static segments (snapshot)
  - Dynamic segments (auto-updating)
  - Segment combinations (AND/OR logic)

**Campaign Analytics**:
- Sent, delivered, opened, clicked metrics
- Conversion tracking
- Revenue attribution
- A/B test winner identification
- Unsubscribe rates
- Best send time analysis

**Automation Triggers**:
- Member joined
- Subscription expiring
- No visit in X days
- Payment failed
- Birthday
- Referral made
- Class canceled

---

### 2.11 Reports & Analytics

**Route**: `/reports`

**Available Reports**:

**Member Reports**:
- Active members trend
- New member acquisitions
- Member retention cohorts
- Churn analysis with reasons
- Member lifetime value (LTV)
- Member demographics
- Member activity levels
- Freeze and cancellation trends

**Financial Reports**:
- Revenue by period (daily, weekly, monthly)
- Revenue by plan/product
- Revenue by location
- Outstanding payments
- Payment collection rate
- Revenue forecast
- Budget vs. actual
- Profit & loss

**Attendance Reports**:
- Daily/weekly/monthly attendance
- Peak hours analysis
- Capacity utilization
- Check-in trends
- Member visit frequency
- Average visit duration

**Class Reports**:
- Class attendance rates
- Popular classes ranking
- Class capacity utilization
- No-show rates by class
- Booking lead time analysis
- Waitlist statistics

**Sales Reports**:
- Lead conversion funnel
- Sales by representative
- Lead source effectiveness
- Deal pipeline value
- Average deal size
- Sales cycle length

**Marketing Reports**:
- Campaign performance
- Channel effectiveness (email vs. SMS)
- Segmentation analysis
- ROI by campaign
- Subscriber growth
- Engagement metrics

**Trainer Reports**:
- Trainer utilization
- Classes taught per trainer
- Trainer ratings
- PT session revenue per trainer

**Equipment Reports**:
- Equipment usage frequency
- Maintenance schedule
- Equipment downtime
- Popular equipment

**Report Features**:
- Date range selection
- Location filtering
- Export to PDF/Excel/CSV
- Scheduled report delivery
- Custom dashboard widgets
- Comparison periods
- Drill-down capabilities

---

### 2.12 Organization Management

**Routes**:
- `/organizations` - Organization list
- `/organizations/new` - Create organization
- `/organizations/[id]` - Organization detail
- `/organizations/[id]/edit` - Edit organization

**Features**:
- Create and manage fitness club organizations
- Organization details:
  - Name (English/Arabic)
  - Contact information (email, phone, website)
  - Legal information
  - Tax ID (ZATCA for Saudi Arabia)
  - Logo and branding
- Status management:
  - Pending
  - Active
  - Suspended
  - Closed
- Multi-location support
- Organization hierarchy
- Settings and configuration per organization

**Club Management**:
- Add clubs/locations under organization
- Configure club-specific settings
- Operating hours per club
- Capacity limits
- Gender-policy configuration
- Club-level branding

---

### 2.13 Settings & Configuration

**Routes**:
- `/settings` - Settings hub
- `/settings/branding` - Branding settings
- `/settings/agreements` - Agreement templates
- `/settings/membership-categories` - Membership categories
- `/settings/pricing-tiers` - Pricing tiers
- `/settings/referral` - Referral program config
- `/settings/loyalty` - Loyalty program config
- `/settings/scoring-rules` - Lead scoring rules
- `/settings/access-control` - Access control zones
- `/settings/compliance` - Compliance settings

**Branding Settings**:
- Upload logo and favicon
- Set primary and secondary colors
- Configure email template branding
- Mobile app white-labeling
- Custom domain configuration

**Agreement Templates**:
- Create membership agreement templates
- Configure mandatory agreements
- Set cooling-off periods
- Version management
- Digital signature settings

**Membership Categories**:
- Define membership categories
- Set category-specific benefits
- Access restrictions per category
- Category pricing rules

**Pricing Tiers**:
- Create tiered pricing structures
- Early bird pricing
- Family discounts
- Corporate pricing
- Seasonal pricing

**Referral Program Configuration**:
- Set referral rewards
- Configure reward rules
- Design referral landing page
- Set referral limits

**Loyalty Program Configuration**:
- Points earning rules
- Tier definitions (Bronze, Silver, Gold, Platinum)
- Tier benefits
- Points expiration policy
- Redemption catalog

**Access Control**:
- Define access zones
- Configure time-based access rules
- Set gender-based access policies
- Biometric enrollment settings
- RFID card management

---

### 2.14 Compliance & Security Settings

**Routes**:
- `/settings/compliance/frameworks` - Compliance frameworks
- `/settings/compliance/frameworks/[code]` - Framework details
- `/settings/compliance/policies` - Security policies
- `/settings/compliance/policies/[id]` - Policy detail
- `/settings/compliance/risks` - Risk assessments
- `/settings/compliance/risks/[id]` - Risk detail
- `/settings/compliance/data-protection` - Data protection
- `/settings/compliance/security-events` - Security event logs

**Compliance Framework Management**:
- Track compliance with frameworks:
  - ISO 27001
  - SOC 2
  - PCI DSS
  - PDPL (Saudi Personal Data Protection Law)
  - OWASP Top 10
  - NIST Cybersecurity Framework
- View compliance requirements per framework
- Track control implementations
- Upload compliance evidence
- Generate compliance reports

**Security Policy Management**:
- Create and manage security policies
- Policy acknowledgement tracking
- Policy version control
- Scheduled policy reviews
- Employee policy training

**Risk Management**:
- Identify and document security risks
- Risk assessment (DPIA)
- Risk mitigation plans
- Risk scoring and prioritization
- Risk monitoring

**Data Protection**:
- Consent management (GDPR/PDPA)
- Data subject access requests (DSAR)
- Right to be forgotten handling
- Data retention policies
- Data breach incident management
- Audit logs and trails

**Security Events**:
- Security event logging
- Anomaly detection
- Incident response tracking
- Security metrics dashboard

---

### 2.15 User & Permission Management

**Routes**:
- `/settings/users` - User list
- `/settings/users/new` - Create user
- `/settings/roles` - Role management
- `/settings/permissions` - Permission configuration

**User Management**:
- Create staff and admin user accounts
- Assign roles and permissions
- Multi-location user assignments
- User activity monitoring
- Account suspension and reactivation
- Password reset for users

**Role-Based Access Control (RBAC)**:
- Predefined roles:
  - Super Admin
  - Club Admin
  - Manager
  - Receptionist
  - Trainer
  - Sales Representative
- Create custom roles
- Permission assignment per role

**Permission Granularity**:
- Module-level permissions
- Action-level permissions (Read, Create, Update, Delete)
- Data-level restrictions (own location only, etc.)

---

### 2.16 Support & Help

**Routes**:
- `/support` - Support center
- `/support/tickets` - Support tickets

**Features**:
- Internal support ticket system
- Knowledge base articles
- Video tutorials
- Live chat with platform support
- Feature request submission
- Bug reporting

---

## 3. Platform Admin Portal Features

The Platform Admin Portal is for managing the B2B SaaS platform, client organizations, billing, and support.

**Access**: `app.liyaqa.com` or `platform.liyaqa.com`

### 3.1 Platform Dashboard

**Route**: `/platform-dashboard`

**Role-Based Views**:

**Platform Admin View**:
- **Hero Stats**:
  - Total clients (Active, Trial, Churned)
  - Monthly Recurring Revenue (MRR)
  - Average client health score
  - Active support tickets

- **Revenue Metrics**:
  - MRR trend chart (last 12 months)
  - Churn rate
  - Revenue per client
  - Expansion revenue

- **Deal Pipeline**:
  - Deals by stage
  - Pipeline value
  - Expected close dates
  - Win probability

- **Client Health Overview**:
  - Clients by health score (Healthy, Monitor, At-Risk, Critical)
  - Churn risk alerts
  - Usage warnings

- **Top Clients Widget**:
  - Highest revenue clients
  - Most active clients
  - Newest clients

**Sales Representative View**:
- Deal pipeline (assigned deals)
- Lead conversion metrics
- Revenue target progress
- Recent deal activity
- Task list and reminders

**Support Team View**:
- Open tickets by priority
- Ticket response time metrics
- Client satisfaction scores
- Platform health indicators
- Recent client activity

**Features**:
- Date range filtering
- Auto-refresh toggle (5-minute intervals)
- Manual refresh button
- Drill-down to detailed views

---

### 3.2 Client Management

**Routes**:
- `/clients` - Client list
- `/clients/new` - Onboard new client
- `/clients/[id]` - Client detail
- `/clients/[id]/edit` - Edit client
- `/clients/[id]/health` - Client health detail

**Client List Features**:
- Search clients by name or email (debounced search)
- Filter by status:
  - Pending (onboarding)
  - Active
  - Trial
  - Suspended
  - Churned
- Display client statistics:
  - Total clients
  - Active clients
  - Pending onboarding
  - Suspended clients
- Pagination with configurable page size
- Quick actions per client:
  - Edit details
  - View health score
  - Suspend/activate
  - Impersonate (for support)
  - Generate usage report

**Client Detail View**:
- **Overview Tab**:
  - Client information (name, contact, website)
  - Subscription details
  - Current plan and features
  - Billing status
  - Health score visualization
  - Quick stats (members, locations, revenue)

- **Members Tab**:
  - Total members across all clubs
  - Member growth trend
  - Active vs. inactive members
  - Member engagement metrics

- **Locations Tab**:
  - List of clubs/locations
  - Location-specific metrics
  - Operating status per location

- **Usage Tab**:
  - Feature usage statistics
  - API call volume
  - Storage consumption
  - Bandwidth usage
  - Usage against plan limits

- **Billing Tab**:
  - Current subscription
  - Invoice history
  - Payment methods
  - Payment history
  - Outstanding balance

- **Support Tab**:
  - Open tickets
  - Ticket history
  - Average resolution time
  - Satisfaction ratings

- **Activity Tab**:
  - Recent login activity
  - Feature usage timeline
  - Configuration changes
  - Audit trail

**Client Actions**:
- Activate/suspend client
- Upgrade/downgrade plan
- Send notification
- Schedule check-in call
- Assign customer success manager (CSM)
- Generate health report
- Impersonate for support

---

### 3.3 Client Onboarding

**Route**: `/clients/new`

**Features**:
- **Client Onboarding Wizard**:
  - Step 1: Basic Information
    - Company name (English/Arabic)
    - Contact person details
    - Email and phone
    - Country and timezone

  - Step 2: Organization Setup
    - Number of locations
    - Expected member count
    - Industry segment (boutique, chain, corporate)

  - Step 3: Plan Selection
    - Choose subscription plan
    - Configure features
    - Add-ons selection
    - Custom pricing (if applicable)

  - Step 4: Billing Setup
    - Billing contact
    - Payment method
    - Billing cycle preference
    - Trial period (if applicable)

  - Step 5: Configuration
    - Subdomain selection
    - Initial admin account
    - Branding preferences
    - Integration requirements

  - Step 6: Review & Launch
    - Review all settings
    - Terms acceptance
    - Launch client environment

**Post-Onboarding**:
- Welcome email to client
- Onboarding checklist creation
- Schedule kickoff call
- Assign CSM
- Enable monitoring

---

### 3.4 Client Plans Management

**Routes**:
- `/client-plans` - Plans list
- `/client-plans/new` - Create plan
- `/client-plans/[id]` - Plan details
- `/client-plans/[id]/edit` - Edit plan

**Features**:
- **Plan List View**:
  - Display all subscription plans with status
  - Filter by active/inactive status
  - Plan statistics:
    - Total plans
    - Active plans
    - Inactive plans
    - Average plan price
  - Quick actions (edit, activate/deactivate, delete)
  - Pagination

- **Create/Edit Plan**:
  - Plan name and description
  - Billing cycle (monthly, quarterly, annual)
  - Pricing in SAR
  - Trial period configuration
  - Feature limits:
    - Maximum members
    - Maximum locations
    - Maximum staff users
    - Storage limit (GB)
    - API rate limit
  - Feature flags:
    - Mobile app access
    - Advanced reporting
    - API access
    - White-label branding
    - Equipment integrations
    - Wearable integrations
    - CRM module
    - Marketing automation
    - Custom domain
    - Priority support
  - Visibility (public/private)
  - Recommended badge

**Plan Analytics**:
- Clients per plan
- Revenue per plan
- Most popular features
- Feature adoption rates

---

### 3.5 Client Health Monitoring

**Route**: `/health`

**Features**:
- **Health Overview Dashboard**:
  - Summary cards:
    - Total clients monitored
    - Healthy clients (score 70-100)
    - Clients to monitor (score 50-69)
    - At-risk clients (score 30-49)
    - Critical clients (score 0-29)

- **Health Score Table**:
  - Client name and logo
  - Overall health score (0-100)
  - Score breakdown:
    - Usage score (% of expected activity)
    - Engagement score (feature adoption)
    - Payment score (on-time payments)
    - Support score (ticket resolution)
  - Trend indicator (improving, stable, declining)
  - Risk level badge with color coding
  - Last checked timestamp

- **Filters**:
  - Filter by risk level
  - Filter by trend
  - Search by client name
  - Sort by score

- **Bulk Actions**:
  - Select multiple clients
  - Send check-in emails
  - Assign to CSM
  - Schedule interventions

**Health Score Calculation**:
- Usage metrics (40%): Login frequency, feature usage, member activity
- Engagement (30%): Feature adoption, integration usage, support interactions
- Payment (20%): On-time payments, payment method validity, outstanding balance
- Support (10%): Ticket volume, resolution time, satisfaction

**Client Health Detail Page**:
- Historical health score trend chart
- Detailed metric breakdown
- Recommended actions
- Intervention history
- Success playbooks
- Next steps

---

### 3.6 Alerts & Notifications

**Route**: `/alerts`

**Features**:
- **Alert Center**:
  - Active alerts list
  - Alert categories:
    - Usage limits approaching
    - Payment failures
    - Low engagement
    - Support issues
    - Churn risk
    - Security concerns
    - Technical issues
  - Alert severity (Info, Warning, Critical)
  - Alert status (New, Acknowledged, Resolved)
  - Affected clients

- **Alert Actions**:
  - Acknowledge alert
  - Assign to team member
  - Create support ticket
  - Send notification to client
  - Run playbook
  - Snooze alert
  - Resolve with notes

- **Alert Playbooks**:
  - Predefined response workflows
  - Automated remediation steps
  - Escalation procedures
  - Documentation links

**Alert Types**:
- Usage limit at 80% threshold
- Usage limit exceeded
- Payment method expiring
- Payment declined
- No login in 7 days
- Low member activity
- High churn rate
- Support ticket SLA breach
- System downtime
- Security event

---

### 3.7 Dunning Management

**Route**: `/dunning`

**Features**:
- **Dunning Dashboard**:
  - Clients in dunning (payment recovery)
  - Total amount at risk
  - Recovery success rate
  - Dunning sequence status

- **Dunning Sequences**:
  - Automatic retry schedule
  - Email reminders (Day 1, 3, 7, 14, 30)
  - SMS notifications
  - Escalation to manual recovery
  - Service suspension warnings
  - Grace period management

- **Payment Recovery**:
  - View clients with failed payments
  - Payment attempt history
  - Manual payment processing
  - Payment method update requests
  - Invoice resend
  - Payment plan negotiation

- **Dunning Analytics**:
  - Recovery rate by stage
  - Average recovery time
  - Revenue recovered
  - Involuntary churn prevented

---

### 3.8 Support Ticket Management

**Routes**:
- `/support` - Support center
- `/support/new` - Create ticket
- `/support/[id]` - Ticket detail

**Features**:
- **Ticket List**:
  - Filter by status (Open, In Progress, Waiting on Customer, Resolved, Closed)
  - Filter by priority (Low, Medium, High, Urgent)
  - Filter by category (Technical, Billing, Feature Request, Bug Report)
  - Search tickets
  - Sort by created date, updated date, priority

- **Ticket Creation**:
  - Select client
  - Ticket subject and description
  - Priority selection
  - Category selection
  - File attachments
  - Assign to support rep
  - Link related tickets

- **Ticket Detail**:
  - Ticket timeline with all messages
  - Internal notes (not visible to client)
  - Client responses
  - Status updates
  - Priority changes
  - Assignment history
  - Resolution time tracking
  - SLA compliance indicator

- **Ticket Actions**:
  - Reply to client
  - Add internal note
  - Change status
  - Update priority
  - Reassign ticket
  - Merge tickets
  - Create follow-up tasks
  - Close ticket

**SLA Tracking**:
- First response time SLA
- Resolution time SLA
- SLA breach alerts
- SLA reports

---

### 3.9 Deals & Sales Pipeline

**Routes**:
- `/deals` - Deal pipeline
- `/deals/new` - Create deal
- `/deals/[id]` - Deal detail
- `/deals/[id]/convert` - Convert to client

**Features**:
- **Deal Pipeline (Kanban View)**:
  - Stages: Qualification → Demo → Proposal → Negotiation → Closed Won/Lost
  - Drag-and-drop deals between stages
  - Deal value per stage
  - Expected close dates
  - Win probability

- **Deal Creation**:
  - Company information
  - Contact details
  - Deal value
  - Expected close date
  - Deal source
  - Assigned sales rep
  - Notes

- **Deal Detail**:
  - Deal information
  - Contact details
  - Activity timeline
  - Scheduled activities
  - Documents (proposals, contracts)
  - Competitor information
  - Win/loss reasons
  - Conversion to client

**Sales Activities**:
- Log calls and meetings
- Send proposals
- Schedule demos
- Track email opens
- Document sharing
- Contract negotiation notes

---

### 3.10 Platform Users Management

**Routes**:
- `/platform-users` - User list
- `/platform-users/new` - Create user
- `/platform-users/[id]` - User detail

**Features**:
- Manage internal platform team members
- Roles:
  - Platform Admin
  - Sales Representative
  - Support Agent
  - Finance/Billing
  - Developer/Technical
- User permissions management
- Activity tracking
- Login history
- Performance metrics (for sales/support)

---

### 3.11 Platform Billing & Invoicing

**Routes**:
- `/client-invoices` - Client invoice list
- `/client-invoices/new` - Create invoice
- `/client-invoices/[id]` - Invoice detail

**Features**:
- Automatic invoice generation for subscriptions
- Manual invoice creation
- Usage-based billing (overages)
- Prorated charges for plan changes
- Invoice templates
- Payment processing
- Revenue recognition
- Refund processing

---

### 3.12 View Client Details

**Route**: `/view-clubs/[id]`

**Features**:
- Inspect individual gym/club within a client organization
- View club-specific metrics:
  - Member count
  - Revenue
  - Attendance
  - Class utilization
- Access support and monitoring tools
- Impersonate for troubleshooting

---

## 4. Kiosk Interface

Self-service touchscreen interface for in-gym operations.

**Access**: `kiosk.liyaqa.com` or `{client-slug}.liyaqa.com/kiosk`

### 4.1 Kiosk Welcome Screen

**Route**: `/kiosk`

**Features**:
- Large touch-friendly interface
- Language toggle (English/Arabic)
- Device name display
- Identification method selection:
  - **Scan QR Code**: Member scans QR from mobile app
  - **Enter Phone Number**: Numeric keypad
  - **Tap Member Card**: RFID/NFC card reader
  - **Enter Member ID**: Alphanumeric keypad
- Idle timeout with automatic reset
- Help button for staff assistance

**Design**:
- High contrast colors
- Large touch targets (minimum 44x44 pt)
- Clear iconography
- Accessibility features

---

### 4.2 Member Check-In

**Route**: `/kiosk/check-in`

**Check-In Flow**:
1. **Member Identification**: Capture member info via selected method
2. **Member Verification**: Display member photo and name for confirmation
3. **Membership Validation**: Check membership status (active, expired, frozen)
4. **Check-In Confirmation**: Record check-in timestamp
5. **Success Screen**: Show success message with welcome greeting
6. **Return to Home**: Automatic timeout back to welcome screen

**States**:
- **Idle**: Awaiting check-in confirmation
- **Processing**: Validating membership and recording check-in
- **Success**: Check-in successful with confirmation
- **Error**: Display error (expired membership, access denied) with retry

**Features**:
- Display member information (name, photo, membership type)
- Show membership expiration date
- Display access hours if restricted
- Optional receipt printing
- Show remaining classes/visits if applicable
- Contactless check-in support

**Error Handling**:
- Membership expired → Direct to staff
- Membership frozen → Show unfreeze date
- Access denied (time restrictions) → Show allowed hours
- Outstanding payment → Direct to reception
- Member not found → Retry or register

---

### 4.3 Class Booking at Kiosk

**Route**: `/kiosk/classes`

**Features**:
- Browse available classes for today and next 7 days
- Date navigation with large buttons (previous/next day)
- Display class cards with:
  - Class name and type
  - Instructor name
  - Start time and duration
  - Available spots (capacity)
  - Location/studio
  - Difficulty level
  - Availability status (Available, Few spots, Full)
- Large touch-friendly class selection
- Booking confirmation dialog
- Success confirmation with booking details
- Automatic return to home

**Booking Flow**:
1. Select date
2. Browse classes for selected date
3. Tap class to view details
4. Confirm booking
5. Process booking
6. Show success with booking details
7. Optional: Print booking confirmation
8. Return to home

---

### 4.4 Kiosk Home Menu

**Route**: `/kiosk/home`

**Features** (after member identification):
- Large action buttons:
  - **Check-In to Gym**: Record gym entry
  - **Book a Class**: Browse and book classes
  - **View Schedule**: See today's class schedule
  - **Make a Payment**: Process payment for services
  - **Purchase Membership**: Buy new membership
  - **Sign Agreement**: Digital waiver signing
  - **Print Receipt**: Receipt from previous transaction
- Member info display (name, photo, membership status)
- Logout button
- Help button

---

### 4.5 Payment Processing

**Route**: `/kiosk/payment`

**Features**:
- View outstanding invoices
- Select payment method:
  - Card reader (integrated)
  - Cash (requires staff)
  - STC Pay QR code
  - SADAD reference number
- Payment amount display
- Process payment
- Receipt printing
- Email receipt option

---

### 4.6 Membership Purchase

**Route**: `/kiosk/membership`

**Features**:
- Browse available membership plans
- Plan comparison
- Plan details (price, benefits, duration)
- Select plan
- Personal information capture (if new member)
- Payment processing
- Agreement signing
- Member card issuance
- Welcome materials

---

### 4.7 Agreement Signing

**Route**: `/kiosk/agreement`

**Features**:
- Display agreement text
- Scroll through full agreement
- Digital signature pad
- Consent checkboxes
- Timestamp and date
- Save signed agreement
- Print copy option
- Email copy to member

---

### 4.8 Receipt Printing

**Route**: `/kiosk/receipt`

**Features**:
- Display transaction summary
- Print receipt button
- Email receipt option
- Reprint previous receipt
- Receipt includes:
  - Transaction details
  - Date and time
  - Amount and payment method
  - ZATCA-compliant format (Saudi Arabia)
  - QR code for verification

---

## 5. Authentication Pages

### 5.1 Staff Login

**Route**: `/login`

**Features**:
- Email and password login form
- Subdomain-based tenant detection (auto-fill organization)
- Manual tenant ID entry if no subdomain
- Password visibility toggle
- "Remember me" checkbox
- "Forgot password" link
- Link to member login
- Role validation (only SUPER_ADMIN, CLUB_ADMIN, STAFF allowed)
- Redirect to appropriate dashboard based on role

**Security**:
- Rate limiting (prevent brute force)
- Account lockout after failed attempts
- Session management
- Audit logging

---

### 5.2 Member Login

**Route**: `/member/login`

**Features**:
- Email/phone and password login
- Magic link (passwordless) option
- "Remember me" checkbox
- "Forgot password" link
- Link to staff login
- Mobile app deep linking
- Social login options (optional)

---

### 5.3 Registration

**Route**: `/register`

**Features**:
- Account creation form:
  - Email
  - Password with strength indicator
  - Confirm password
  - First name and last name
  - Phone number
  - Organization selection (if applicable)
- Terms and conditions acceptance
- Privacy policy acceptance
- Email verification
- Redirect to dashboard after signup

---

### 5.4 Forgot Password

**Route**: `/forgot-password`

**Features**:
- Email entry form
- Send password reset link via email
- Link expiration (24 hours)
- Success confirmation
- Return to login link

---

### 5.5 Reset Password

**Route**: `/reset-password`

**Features**:
- Token validation from email link
- New password entry
- Confirm password
- Password strength requirements
- Success confirmation
- Redirect to login

---

## 6. Public Pages

### 6.1 Landing Page

**Route**: `/` (public, not authenticated)

**Features**:
- **Hero Section**:
  - Value proposition headline
  - Subheading with key benefits
  - Call-to-action buttons (Start Free Trial, Request Demo, View Pricing)
  - Hero image/video

- **Trust Bar**:
  - Client logos
  - "Trusted by X gyms across Saudi Arabia"
  - Statistics (members served, locations, etc.)

- **Saudi-Specific Features Section**:
  - ZATCA e-invoicing compliance
  - STC Pay and SADAD integration
  - Prayer time integration
  - Gender-based access control
  - Hijri calendar support
  - WhatsApp Business integration

- **Platform Features Showcase**:
  - Member management
  - Class scheduling
  - Payment processing
  - CRM and sales
  - Marketing automation
  - Mobile apps
  - Reporting and analytics
  - Access control integration

- **How It Works**:
  - Step 1: Sign up
  - Step 2: Configure your gym
  - Step 3: Invite members
  - Step 4: Grow your business

- **Statistics Section**:
  - Members managed on platform
  - Gyms using Liyaqa
  - Classes booked per month
  - Countries served

- **Customer Testimonials**:
  - Quotes from gym owners
  - Photos and names
  - Gym names and locations

- **Pricing Preview**:
  - Three pricing tiers overview
  - "See full pricing" CTA

- **Final CTA Section**:
  - "Ready to transform your gym?"
  - Sign up button
  - Demo request button
  - Contact information

**Localization**: Full Arabic/English with RTL support

---

### 6.2 Pricing Page

**Route**: `/pricing`

**Features**:
- Three-tier pricing display:
  - **Starter**: For small gyms (1-2 locations)
  - **Growth**: For growing chains (3-10 locations)
  - **Enterprise**: For large operations (10+ locations)
- Feature comparison table
- Add-on pricing
- FAQ section
- Free trial CTA
- Contact sales button

---

### 6.3 Sign Up Page

**Route**: `/signup`

**Features**:
- Public signup form for gym owners
- Company information:
  - Gym/company name
  - Contact name
  - Email
  - Phone
  - Country
  - Number of locations
  - Expected members
- Password creation
- Plan selection
- Terms acceptance
- Create account and start trial

---

# Part 2: Backend Features by Domain Module

## 7. Backend Domain Modules

The Liyaqa backend is organized into 31 domain modules following Domain-Driven Design (DDD) principles and hexagonal architecture.

### 7.1 Membership Module

**Package**: `com.liyaqa.membership`

**Domain Models** (24):
- Member
- MembershipPlan
- Subscription
- MembershipContract
- ContractPricingTier
- MembershipCategory
- Address
- Agreement
- MemberAgreement
- CancellationRequest
- ExitSurvey
- RetentionOffer
- PlanChangeHistory
- ScheduledPlanChange
- FreezeHistory
- FreezePackage
- MemberFreezeBalance
- MemberWallet
- WalletTransaction
- MemberHealth
- DiscountType
- SubscriptionStatus
- ContractEnums
- WalletEnums

**Key Features**:

**Member Lifecycle Management**:
- Complete CRUD operations for members
- Member registration with validation
- Profile management (personal info, contact, emergency contact)
- Member status tracking (Active, Frozen, Expired, Cancelled)
- Member search and filtering
- Bulk member operations (import, export, messaging)
- Member tagging and categorization
- Member merge and deduplication

**Membership Plans**:
- Flexible plan definitions with bilingual names
- Multiple billing cycles (daily, weekly, monthly, quarterly, annual)
- Access hours configuration (24/7, peak hours, off-peak)
- Class inclusions per plan
- Guest pass allocations
- Freeze days allocation
- Commitment period and early termination fees
- Plan-specific benefits and restrictions
- Location-specific plans
- Plan visibility and availability

**Subscription Management**:
- Create subscriptions for members
- Subscription renewal (manual and automatic)
- Subscription cancellation workflow
- Proration calculations for mid-cycle changes
- Subscription status tracking
- Trial period handling
- Grace period management
- Subscription history tracking

**Membership Contracts**:
- Legal contract generation with terms
- Commitment period enforcement
- Early termination fee calculation
- Cooling-off period (Saudi Arabia 7-day requirement)
- Contract version management
- Digital signature support
- Contract renewal workflow
- Contract cancellation with penalties

**Plan Changes**:
- Upgrade/downgrade functionality
- Proration calculation for plan changes
- Scheduled future plan changes
- Plan change history tracking
- Change approval workflow
- Refund calculation for downgrades

**Membership Freezes**:
- Freeze request submission
- Freeze approval workflow
- Freeze balance tracking (allocated vs. used)
- Freeze history
- Automatic resume after freeze period
- Freeze notifications
- Freeze packages (7-day, 30-day, 90-day)

**Cancellation Workflow**:
- Cancellation request submission
- Exit survey collection
- Retention offer presentation
- Cancellation processing
- Refund calculation
- Cancellation reason tracking
- Win-back campaign triggers

**Member Wallet**:
- Prepaid balance management
- Wallet top-up
- Wallet transactions (credit, debit, adjustment)
- Transaction history
- Wallet expiration policies
- Wallet transfer between members
- Wallet refunds

**Health & Screening**:
- Health questionnaire
- Medical conditions tracking
- Emergency contact information
- Health waivers and consent
- BMI and body metrics
- Health goal tracking

**Agreements**:
- Multiple agreement types (terms, waiver, photo consent)
- Mandatory agreement enforcement
- Digital signature capture
- Agreement versioning
- Agreement status tracking (pending, signed)
- Agreement expiration

**Discount System**:
- Percentage discounts
- Fixed amount discounts
- Free trial offers
- Family discounts
- Corporate discounts
- Early bird pricing
- Seasonal promotions

---

### 7.2 Platform Module (B2B SaaS)

**Package**: `com.liyaqa.platform`

**Domain Models** (17):
- ClientPlan
- ClientSubscription
- ClientInvoice
- ClientInvoiceLineItem
- ClientInvoiceSequence
- ClientHealthScore
- ClientUsage
- ClientNote
- Deal
- PlatformUser
- PlatformUserActivity
- SupportTicket
- TicketMessage
- PlatformAlert
- OnboardingProgress
- DunningSequence
- PlatformEnums

**Key Features**:

**Client Plan Management**:
- Tiered subscription plans (Starter, Growth, Enterprise)
- Feature flags per plan:
  - Mobile app access
  - Advanced reporting
  - API access
  - White-label branding
  - Equipment integrations
  - CRM module
  - Marketing automation
  - Custom domain
  - Priority support
- Usage limits per plan:
  - Max members
  - Max locations
  - Max staff users
  - Storage limit (GB)
  - API rate limit
- Trial period configuration
- Custom pricing for enterprise
- Plan visibility (public/private)

**Client Subscription Management**:
- Create subscriptions for client organizations
- Billing cycle management
- Automatic renewal
- Usage-based billing (overages)
- Plan upgrades/downgrades
- Subscription analytics
- Revenue recognition

**Client Invoicing**:
- Automatic invoice generation
- Manual invoice creation
- Line item management
- Tax calculation
- Invoice numbering with sequence
- Invoice status tracking (Draft, Issued, Paid, Overdue, Cancelled)
- Invoice templates
- Payment processing
- Refunds and credits
- Invoice delivery (email, portal)

**Client Health Scoring**:
- Multi-dimensional health score (0-100):
  - Usage score (40%): Login frequency, feature usage
  - Engagement score (30%): Feature adoption, integrations
  - Payment score (20%): On-time payments, valid payment method
  - Support score (10%): Ticket volume, resolution time
- Health score history and trends
- Risk level classification (Healthy, Monitor, At-Risk, Critical)
- Automated alerts for health changes
- Intervention recommendations
- Success playbooks

**Usage Tracking**:
- Member count tracking
- Location count tracking
- Feature usage metrics
- API call volume
- Storage consumption
- Bandwidth usage
- Usage vs. plan limit monitoring
- Overage calculation
- Usage trends and forecasting

**Client Notes**:
- Internal notes about clients
- Note categories (sales, support, billing, technical)
- Note author tracking
- Note timestamps
- Search and filter notes

**Deals & Sales Pipeline**:
- Deal creation and tracking
- Deal stages (Qualification → Demo → Proposal → Negotiation → Closed)
- Deal value and expected close date
- Deal probability
- Deal owner assignment
- Activity logging on deals
- Deal conversion to client
- Win/loss analysis
- Competitor tracking

**Platform Users**:
- Internal team member management
- Roles (Platform Admin, Sales Rep, Support Agent, Finance, Developer)
- User activity tracking
- Permission management
- Performance metrics
- Login history

**Support Ticket System**:
- Ticket creation and assignment
- Ticket status tracking (Open, In Progress, Waiting, Resolved, Closed)
- Priority levels (Low, Medium, High, Urgent)
- Category assignment (Technical, Billing, Feature Request, Bug)
- Ticket messages and timeline
- Internal notes (not visible to client)
- SLA tracking (first response, resolution time)
- Ticket escalation
- Ticket satisfaction ratings

**Platform Alerts**:
- Alert generation for key events:
  - Usage limit warnings
  - Payment failures
  - Low engagement
  - Churn risk
  - Security events
- Alert severity (Info, Warning, Critical)
- Alert assignment
- Alert acknowledgement
- Alert resolution tracking
- Alert playbooks

**Client Onboarding**:
- Onboarding progress tracking
- Checklist management
- Onboarding steps:
  - Account setup
  - Initial configuration
  - Data import
  - Integration setup
  - Staff training
  - Go-live
- Onboarding timeline
- Kickoff call scheduling
- CSM assignment

**Dunning Management**:
- Failed payment tracking
- Automatic retry schedule
- Dunning sequence emails (Day 1, 3, 7, 14, 30)
- Payment recovery tracking
- Grace period management
- Service suspension warnings
- Manual recovery workflows
- Recovery success metrics

**Dashboard & Reporting**:
- Platform-level KPI dashboard
- Role-based dashboard views
- Revenue metrics (MRR, ARR, churn)
- Client health overview
- Support ticket metrics
- Deal pipeline visualization
- Custom widgets
- Export capabilities

---

### 7.3 Billing Module

**Package**: `com.liyaqa.billing`

**Domain Models** (5):
- Invoice
- InvoiceLineItem
- InvoiceSequence
- SavedPaymentMethod
- BillingEnums

**Key Features**:

**Invoice Management**:
- Invoice creation for subscriptions, services, products
- Line item support with descriptions
- Subtotal, tax, and total calculation
- Automatic invoice numbering
- Invoice status workflow (Draft → Issued → Paid)
- Partial payment support
- Overdue invoice tracking
- Invoice templates per organization
- Bilingual invoice support (English/Arabic)
- ZATCA-compliant e-invoice generation (Saudi Arabia)
- PDF invoice generation
- Invoice delivery (email, WhatsApp, portal)

**Payment Processing**:
- Multiple payment gateway integrations:
  - PayTabs (card payments)
  - STC Pay (digital wallet)
  - SADAD (bank transfer)
  - Tamara (BNPL - Buy Now Pay Later)
- Payment method tokenization (PCI compliance)
- One-time payments
- Recurring subscription payments
- Automatic payment retry
- Payment failure handling
- Refund processing
- Payment receipt generation

**Saved Payment Methods**:
- Securely store payment methods (tokenized)
- Card display (masked for security)
- Default payment method per member
- Payment method expiration tracking
- Payment method verification
- Payment method deletion

**Tax Calculation**:
- VAT/GST calculation
- Tax rate configuration per jurisdiction
- Tax-exempt handling
- Tax reporting

**Payment Reconciliation**:
- Match payments to invoices
- Bank reconciliation
- Payment dispute handling
- Chargeback management

---

### 7.4 CRM Module

**Package**: `com.liyaqa.crm`

**Domain Models** (6):
- Lead
- LeadActivity
- LeadCaptureForm
- LeadAssignmentRule
- LeadScoringRule
- LeadEnums

**Key Features**:

**Lead Management**:
- Lead capture from multiple sources (web form, walk-in, referral, social, ads)
- Lead profile with contact information
- Lead status tracking (New, Contacted, Qualified, Converted, Lost)
- Lead pipeline stages (New → Contacted → Tour → Trial → Negotiation → Won/Lost)
- Lead ownership and assignment
- Lead source attribution
- Campaign tracking
- Lead notes and comments
- Convert lead to member workflow
- Lost lead reason tracking

**Lead Activities**:
- Activity logging (calls, emails, meetings, tours)
- Activity timeline view
- Scheduled follow-up tasks
- Task reminders and notifications
- Email integration for activity tracking
- Call notes and recordings
- Meeting scheduling

**Lead Scoring**:
- Automatic lead scoring based on rules
- Scoring criteria:
  - Demographic fit
  - Engagement level
  - Visit frequency
  - Response time
  - Email opens and clicks
  - Form submissions
- Hot/warm/cold classification
- Score-based lead prioritization
- Score history and changes

**Lead Assignment**:
- Manual assignment to sales reps
- Automatic assignment rules:
  - Round-robin distribution
  - Location-based assignment
  - Source-based assignment
  - Workload balancing
  - Skill-based routing
- Assignment notifications
- Reassignment workflow

**Lead Capture Forms**:
- Custom form builder (drag-and-drop)
- Form fields configuration
- Form embedding (website, landing page)
- Standalone form pages
- Form branding and styling
- Multi-step forms
- Form validation
- Auto-response emails
- Form analytics (views, submissions, conversion rate)

**Sales Pipeline**:
- Visual pipeline (Kanban board)
- Drag-and-drop to move stages
- Pipeline value calculation
- Expected close date tracking
- Win probability per stage
- Pipeline velocity metrics
- Bottleneck identification

**CRM Analytics**:
- Lead source effectiveness
- Conversion rates by stage
- Average time in each stage
- Sales rep performance
- Win/loss analysis
- Revenue attribution
- ROI by campaign

---

### 7.5 Marketing Module

**Package**: `com.liyaqa.marketing`

**Domain Models** (8):
- Campaign
- CampaignStep
- CampaignEnrollment
- Segment
- SegmentMember
- MessageLog
- TrackingPixel
- MarketingEnums

**Key Features**:

**Campaign Management**:
- Create marketing campaigns
- Campaign types:
  - One-time broadcast
  - Drip campaigns (multi-step)
  - Triggered campaigns (event-based)
  - A/B test campaigns
- Multi-channel support (Email, SMS, WhatsApp, Push)
- Campaign scheduling
- Campaign budget and cost tracking
- Campaign goals and KPIs
- Campaign templates

**Multi-Step Campaigns**:
- Drip sequence builder
- Step delays (hours, days, weeks)
- Conditional branching
- Step-level analytics
- Welcome series
- Onboarding sequences
- Re-engagement campaigns
- Win-back campaigns
- Birthday campaigns
- Subscription renewal reminders

**Member Segmentation**:
- Create member segments for targeting
- Segmentation criteria:
  - Demographics (age, gender, location)
  - Membership type and status
  - Activity level (visits per month)
  - Engagement score
  - Churn risk level
  - Payment status
  - Class preferences
  - Referral participation
  - Join date
  - Subscription expiry date
- Static segments (snapshot in time)
- Dynamic segments (auto-updating based on criteria)
- Segment combinations (AND/OR logic)
- Segment size estimation
- Segment exclusions

**Message Creation**:
- Rich text email editor
- SMS message composer with character counter
- WhatsApp message templates
- Push notification composer
- Variable insertion ({{firstName}}, {{planName}}, etc.)
- Message preview across devices
- Message personalization
- Emoji support

**Campaign Execution**:
- Send immediately or schedule
- Time zone-based delivery
- Send time optimization
- Throttling and rate limiting
- Delivery status tracking
- Bounce handling
- Unsubscribe handling

**A/B Testing**:
- Create test variants (A vs. B)
- Test parameters (subject line, content, send time, sender)
- Traffic split (50/50, 70/30, etc.)
- Winner selection criteria (open rate, click rate, conversion)
- Automatic winner selection
- Test duration configuration

**Campaign Analytics**:
- Sent, delivered, opened, clicked metrics
- Open rate, click rate, conversion rate
- Revenue attribution
- Unsubscribe rate
- Bounce rate (hard and soft)
- Spam complaint rate
- Time-based analytics (by hour, day, week)
- Comparison between campaigns
- ROI calculation

**Tracking & Attribution**:
- Tracking pixel for email opens
- UTM parameter tracking for clicks
- Conversion tracking
- Multi-touch attribution
- Campaign revenue attribution

**Marketing Automation Triggers**:
- Member joined
- Subscription expiring (30, 7, 1 day before)
- Subscription expired
- No visit in X days (14, 30 days)
- Payment failed
- Birthday
- Referral made
- Class canceled
- Attendance milestone
- Freeze requested

---

### 7.6 Loyalty Module

**Package**: `com.liyaqa.loyalty`

**Domain Models** (4):
- LoyaltyConfig
- MemberPoints
- PointsTransaction
- LoyaltyEnums

**Key Features**:

**Loyalty Program Configuration**:
- Points earning rules:
  - Points per gym visit
  - Points per class attended
  - Points per purchase (SAR spent)
  - Points for referrals
  - Bonus points for milestones
- Points expiration policy
- Tier definitions (Bronze, Silver, Gold, Platinum)
- Tier thresholds
- Tier benefits

**Points Management**:
- Member points balance tracking
- Points earning
- Points redemption
- Points adjustment (manual credit/debit)
- Points transfer between members
- Points expiration
- Points history and transactions

**Tier System**:
- Automatic tier calculation based on points
- Tier upgrade/downgrade
- Tier-specific benefits:
  - Discount percentage
  - Priority booking
  - Guest passes
  - Free classes
  - Exclusive classes
  - Free merchandise
- Tier anniversary rewards
- Tier expiration and renewal

**Rewards Catalog**:
- Define redeemable rewards
- Reward types:
  - Free class pass
  - Discount on subscription
  - Free merchandise
  - Personal training session
  - Guest passes
  - Facility booking credit
- Reward point cost
- Reward availability and stock
- Reward expiration

**Points Redemption**:
- Browse rewards catalog
- Redeem points for rewards
- Redemption history
- Reward fulfillment tracking
- Redemption notifications

**Gamification**:
- Achievement badges
- Leaderboards (top point earners)
- Challenges and contests
- Milestone rewards
- Streak tracking (consecutive visits)

**Loyalty Analytics**:
- Points issued vs. redeemed
- Redemption rate
- Popular rewards
- Tier distribution
- Member engagement via loyalty

---

### 7.7 Scheduling Module

**Package**: `com.liyaqa.scheduling`

**Domain Models** (5):
- GymClass
- ClassSchedule
- ClassSession
- ClassBooking
- SchedulingEnums

**Key Features**:

**Class Catalog**:
- Create class types (Yoga, Spinning, HIIT, Boxing, Pilates, Zumba, etc.)
- Class descriptions and benefits
- Class difficulty levels (Beginner, Intermediate, Advanced)
- Class categories (Cardio, Strength, Flexibility, Mind-Body)
- Class duration
- Class images
- Equipment requirements
- Class capacity

**Class Scheduling**:
- Create recurring schedules:
  - Daily (every day)
  - Weekly (specific days of week)
  - Monthly (specific date each month)
  - Custom recurrence pattern
- Schedule start and end dates
- Session time and duration
- Assign trainer (primary and substitute)
- Assign room/studio/location
- Set capacity limits
- Configure booking window (how far in advance members can book)
- Cancellation policy (hours before class)
- Waitlist configuration

**Class Session Management**:
- Individual session instances from schedules
- Session status (Scheduled, In Progress, Completed, Cancelled)
- Session check-in and attendance tracking
- Last-minute session cancellation with notifications
- Session rescheduling
- Substitute trainer assignment
- Session notes and announcements

**Class Booking**:
- Member class booking
- Real-time capacity checking
- Booking confirmation
- Booking cancellation by member (with policy enforcement)
- Late cancellation penalties
- No-show tracking
- Automatic waitlist management
- Booking history per member

**Waitlist Management**:
- Automatic waitlist when class is full
- Waitlist position tracking
- Auto-promotion when spot becomes available
- Waitlist notifications
- Waitlist expiration
- Manual waitlist management

**Gender-Specific Scheduling** (Saudi Arabia):
- Ladies-only classes
- Men-only classes
- Mixed classes
- Gender-based scheduling rules
- Access control integration

**Class Analytics**:
- Class attendance rates
- Popular classes ranking
- Capacity utilization
- No-show rates per class
- Booking lead time analysis
- Peak booking times
- Trainer performance by class

**Notifications**:
- Booking confirmation
- Class reminder (24h, 1h before)
- Class cancellation notification
- Waitlist promotion notification
- Instructor change notification

---

### 7.8 Trainer Module

**Package**: `com.liyaqa.trainer`

**Domain Models** (4):
- Trainer
- TrainerClubAssignment
- PersonalTrainingSession
- TrainerEnums

**Key Features**:

**Trainer Management**:
- Trainer profiles with bio
- Trainer photos and certifications
- Specializations (Yoga, Weight Training, Nutrition, etc.)
- Years of experience
- Languages spoken
- Trainer ratings and reviews
- Trainer availability schedule
- Trainer status (Active, On Leave, Inactive)

**Trainer-Location Assignment**:
- Assign trainers to specific clubs/locations
- Multi-location trainer support
- Assignment dates (start/end)
- Primary location designation

**Personal Training (PT) Sessions**:
- PT session booking by members
- Session request workflow:
  - Member requests session with preferred date/time
  - Trainer confirms or suggests alternative
  - Session confirmed
- Session types (individual, semi-private, group)
- Session duration (30, 60, 90 minutes)
- Session pricing
- PT packages (5-session, 10-session, monthly)
- Session location (gym, outdoor, online)

**PT Session Management**:
- View scheduled sessions
- Session status tracking:
  - Requested
  - Confirmed
  - In Progress
  - Completed
  - Cancelled
  - No Show
- Session notes and workout plans
- Session cancellation with policies
- Session rescheduling
- Session attendance tracking

**Trainer Availability**:
- Set availability schedule
- Block time off
- Recurring availability patterns
- Override for specific dates
- Maximum sessions per day limit

**Trainer Analytics**:
- Sessions conducted
- Revenue generated
- Client retention rate
- Average rating
- Utilization rate
- No-show rate
- Cancellation rate

---

### 7.9 Equipment Module

**Package**: `com.liyaqa.equipment`

**Domain Models** (7):
- EquipmentProvider
- EquipmentProviderConfig
- EquipmentUnit
- EquipmentSyncJob
- EquipmentWorkout
- MemberEquipmentProfile
- EquipmentEnums

**Key Features**:

**Equipment Catalog**:
- Equipment inventory (treadmills, bikes, ellipticals, weight machines, etc.)
- Equipment manufacturer and model
- Equipment location within facility
- Equipment status (Available, In Use, Under Maintenance, Out of Order)
- Equipment serial numbers
- Purchase date and warranty info
- Maintenance schedule

**Equipment Provider Integration**:
- Integration with equipment manufacturers:
  - TechnoGym
  - Precor
  - Life Fitness
  - Milon
- OAuth token management for equipment APIs
- Provider configuration (API keys, endpoints)
- Equipment unit registration

**Workout Data Sync**:
- Automatic sync of workout data from connected equipment
- Workout metrics:
  - Duration
  - Distance
  - Calories burned
  - Heart rate
  - Resistance level
  - Speed
  - Incline
- Member identification via RFID, NFC, or login
- Workout history per member
- Equipment usage analytics

**Equipment Maintenance**:
- Maintenance schedule tracking
- Preventive maintenance reminders
- Maintenance logs
- Downtime tracking
- Repair history
- Maintenance cost tracking

**Member Equipment Profiles**:
- Save member preferences per equipment
- Workout programs
- Resistance settings
- Custom configurations

**Equipment Analytics**:
- Equipment usage frequency
- Popular equipment
- Utilization rates
- Downtime analysis
- Maintenance costs
- Equipment ROI

---

### 7.10 Facilities Module

**Package**: `com.liyaqa.facilities`

**Domain Models** (5):
- Facility
- FacilitySlot
- FacilityBooking
- FacilityOperatingHours
- FacilityEnums

**Key Features**:

**Facility Management**:
- Define bookable facilities:
  - Tennis courts
  - Swimming pools
  - Saunas
  - Steam rooms
  - Squash courts
  - Basketball courts
  - Private studios
  - Massage rooms
- Facility capacity
- Facility location
- Facility images
- Facility amenities

**Operating Hours**:
- Set operating hours per facility
- Day-specific hours
- Seasonal hours
- Holiday closures
- Maintenance blocking

**Time Slot Configuration**:
- Define bookable time slots
- Slot duration (30 min, 1 hour, etc.)
- Slot pricing (if applicable)
- Slot capacity (for group facilities)
- Slot availability rules

**Facility Booking**:
- Member booking of facilities
- Booking calendar view
- Real-time availability checking
- Booking confirmation
- Booking cancellation with policy
- Recurring bookings (weekly, monthly)
- Group bookings
- Waitlist for full slots

**Booking Management**:
- View all facility bookings
- Filter by date, facility, member
- Cancel bookings
- Override capacity (admin privilege)
- Booking notifications
- No-show tracking

**Pricing**:
- Free facilities (included in membership)
- Pay-per-use facilities
- Pricing by time slot
- Member vs. non-member pricing
- Package deals (10 bookings for X price)

**Facility Analytics**:
- Booking rates per facility
- Peak usage times
- Revenue from facility bookings
- Utilization rates
- Member preferences

---

### 7.11 Access Control Module

**Package**: `com.liyaqa.accesscontrol`

**Domain Models** (8):
- AccessDevice
- AccessZone
- MemberAccessCard
- BiometricEnrollment
- AccessLog
- AccessTimeRule
- ZoneOccupancy
- AccessControlEnums

**Key Features**:

**Access Device Management**:
- Register access control devices:
  - Turnstiles
  - Speed gates
  - Door readers
  - Biometric scanners
- Device location assignment
- Device status monitoring
- Device configuration

**Access Zones**:
- Define access zones within facility:
  - General gym area
  - Ladies-only section
  - Men-only section
  - VIP area
  - Pool area
  - Class studios
- Zone capacity limits
- Real-time occupancy tracking
- Zone-level access permissions

**Member Access Cards**:
- Issue RFID/NFC access cards to members
- Card activation and deactivation
- Lost card reporting and replacement
- Card types (permanent, temporary, guest)
- Card validity period
- Card status tracking

**Biometric Enrollment**:
- Fingerprint enrollment
- Facial recognition enrollment
- Biometric template storage (hashed)
- Biometric verification at access points
- Biometric data privacy compliance

**Access Permissions**:
- Membership-based access (plan determines zones)
- Time-based access rules (peak hours, off-peak)
- Day-based access rules (weekends only, etc.)
- Gender-based access rules (Saudi Arabia)
- Temporary access grants
- Access revocation

**Access Logging**:
- Log all access attempts (successful and denied)
- Entry and exit timestamps
- Access point location
- Member identification
- Access denial reasons
- Audit trail for compliance

**Time-Based Access Rules**:
- Configure access hours per membership plan
- Peak hours restrictions
- Off-peak access
- 24/7 access for premium plans
- Holiday access rules

**Real-Time Occupancy**:
- Track current occupancy per zone
- Display occupancy on member app
- Capacity alerts
- Occupancy trends and analytics

**Integration with Physical Hardware**:
- API integration with turnstile manufacturers (Gunnebo, Boon Edam)
- Biometric device integration (Suprema)
- Real-time status monitoring
- Remote device management

---

### 7.12 Attendance Module

**Package**: `com.liyaqa.attendance`

**Domain Models** (2):
- AttendanceRecord
- AttendanceEnums

**Key Features**:

**Attendance Tracking**:
- Record member check-ins
- Record check-outs
- Calculate visit duration
- Track check-in method (QR code, RFID, manual, biometric)
- Check-in location (entrance, kiosk, reception)
- Timestamp and date

**Check-In Methods**:
- QR code scan from mobile app
- RFID/NFC card tap
- Biometric verification (fingerprint, face)
- Manual check-in by staff
- Phone number entry

**Attendance Validation**:
- Verify active membership
- Check access permissions
- Validate access hours
- Check outstanding payments
- Prevent duplicate check-ins

**Class Attendance**:
- Mark attendance for class sessions
- Late arrival tracking
- No-show tracking
- Attendance percentage per member

**Attendance Analytics**:
- Daily/weekly/monthly attendance reports
- Member visit frequency
- Average visit duration
- Peak hours identification
- Capacity utilization
- Attendance trends
- Member engagement metrics

**Notifications**:
- Check-in confirmation notification
- Unusual activity alerts (check-in at odd hours)

---

### 7.13 Referral Module

**Package**: `com.liyaqa.referral`

**Domain Models** (5):
- ReferralCode
- Referral
- ReferralConfig
- ReferralReward
- ReferralEnums

**Key Features**:

**Referral Program Configuration**:
- Configure reward rules:
  - Reward for referrer
  - Reward for referred (new member)
  - Reward type (discount, free days, wallet credit, free class)
  - Reward amount
- Minimum commitment for reward eligibility
- Reward expiration
- Maximum referrals per member
- Referral tracking period

**Referral Code Management**:
- Generate unique referral codes per member
- Vanity codes (custom codes)
- Code validity period
- Code usage limits
- Multi-use vs. single-use codes

**Referral Tracking**:
- Track referral link clicks
- Track referral signups
- Track referral conversions (signup → paid member)
- Attribution tracking (which referrer brought which member)
- Referral source tracking

**Referral Rewards**:
- Automatic reward distribution on conversion
- Reward approval workflow
- Reward redemption
- Reward expiration
- Reward history per member

**Referral Leaderboard**:
- Top referrers ranking
- Leaderboard time period (monthly, quarterly, all-time)
- Display on member portal
- Gamification badges

**Referral Analytics**:
- Total referrals sent
- Conversion rate (clicks → signups → paid members)
- Revenue from referrals
- Member acquisition cost via referrals vs. other channels
- ROI of referral program
- Top-performing referrers

**Referral Landing Page**:
- Custom landing page for referred visitors
- Display referrer's name and message
- Signup form with pre-filled referral code
- Special offer display

---

### 7.14 Compliance Module

**Package**: `com.liyaqa.compliance`

**Domain Models** (19):
- ComplianceFramework
- ComplianceRequirement
- ControlImplementation
- ComplianceEvidence
- ComplianceReport
- OrganizationComplianceStatus
- SecurityPolicy
- PolicyAcknowledgement
- IdentifiedRisk
- RiskAssessment
- ConsentRecord
- DataSubjectRequest
- DataDeletionLog
- DataRetentionRule
- DataProcessingActivity
- DataBreach
- EncryptionKey
- SecurityEvent
- ComplianceEnums

**Key Features**:

**Compliance Frameworks**:
- Support for multiple frameworks:
  - ISO 27001 (Information Security)
  - SOC 2 (Security and Availability)
  - PCI DSS (Payment Card Industry)
  - PDPL (Saudi Personal Data Protection Law)
  - GDPR (European data protection)
  - OWASP Top 10 (Application security)
  - NIST Cybersecurity Framework
- Framework requirements catalog
- Control mapping
- Implementation status tracking
- Evidence collection and storage
- Compliance gap analysis

**Security Policies**:
- Create and manage security policies:
  - Information security policy
  - Access control policy
  - Password policy
  - Data retention policy
  - Incident response policy
  - Acceptable use policy
  - BYOD policy
- Policy versioning
- Policy approval workflow
- Policy distribution
- Policy acknowledgement tracking
- Policy review schedule

**Risk Management**:
- Risk identification and assessment
- Risk scoring (likelihood × impact)
- Risk categorization (security, operational, financial, compliance)
- Risk mitigation plans
- Risk owner assignment
- Risk monitoring
- Residual risk tracking
- Data Protection Impact Assessment (DPIA)

**Consent Management** (GDPR/PDPA):
- Collect and store member consent
- Consent types:
  - Data processing
  - Marketing communications
  - Photo/video usage
  - Data sharing with third parties
- Consent withdrawal mechanism
- Consent audit trail
- Consent expiration and renewal

**Data Subject Rights** (GDPR/PDPA):
- Data subject access requests (DSAR)
  - Member can request copy of their data
  - Generate data export in machine-readable format
  - Deliver within required timeframe (30 days)
- Right to be forgotten
  - Member requests data deletion
  - Anonymize or delete data as per retention policy
  - Log deletion for audit
- Right to rectification
  - Member corrects inaccurate data
- Right to data portability
  - Export data in standard format (JSON, CSV)

**Data Retention**:
- Define data retention rules per data type
- Automatic data deletion after retention period
- Legal hold for data under litigation
- Retention exceptions
- Deletion logs for audit

**Data Processing Activities**:
- Record of Processing Activities (RoPA) per GDPR
- Document purpose of data processing
- Data categories processed
- Data subjects
- Recipients of data
- International transfers
- Security measures

**Data Breach Management**:
- Incident logging
- Breach severity assessment
- Notification workflow (within 72 hours for GDPR)
- Affected individuals notification
- Authority notification (e.g., Saudi SDAIA)
- Remediation tracking
- Post-incident review

**Encryption Key Management**:
- Encryption key generation
- Key rotation schedule
- Key storage (HSM or secure vault)
- Key access control
- Key expiration and archival

**Security Event Logging**:
- Log security-relevant events:
  - Failed login attempts
  - Privilege escalation
  - Data access
  - Configuration changes
  - System errors
- Event severity classification
- SIEM integration
- Anomaly detection
- Incident response triggers

**Compliance Reporting**:
- Generate compliance reports per framework
- Control effectiveness reporting
- Gap analysis reports
- Executive summary dashboards
- Audit evidence packages
- Scheduled compliance reviews

---

### 7.15 Churn Prediction Module

**Package**: `com.liyaqa.churn`

**Domain Models** (6):
- MemberChurnPrediction
- ChurnModel
- MemberFeatureSnapshot
- ChurnIntervention
- InterventionTemplate
- ChurnEnums

**Key Features**:

**Churn Risk Scoring**:
- Machine learning-based churn prediction
- Churn risk score (0-100) per member
- Risk level classification:
  - Low Risk (0-25): Engaged and stable
  - Medium Risk (26-50): Some warning signs
  - High Risk (51-75): Significant churn risk
  - Critical Risk (76-100): Imminent churn
- Churn prediction refresh (daily, weekly)

**Feature Engineering**:
- Member feature snapshot for ML model:
  - Attendance frequency (visits per month)
  - Days since last visit
  - Class booking rate
  - Cancellation rate
  - Payment issues
  - Support ticket count
  - App engagement (logins, feature usage)
  - Subscription tenure
  - Plan type and price
  - Referral activity
  - Social engagement
- Feature snapshot storage for model training

**Churn Model**:
- ML model training on historical data
- Model version management
- Model accuracy tracking
- Model retraining schedule
- Feature importance analysis
- A/B testing of models

**At-Risk Member Identification**:
- List of at-risk members with scores
- Prioritization by risk level and member value (LTV)
- Risk factor explanation (what's driving the churn risk)
- Recommended interventions

**Churn Interventions**:
- Create intervention campaigns for at-risk segments
- Intervention types:
  - Personalized email from manager
  - Special retention offer (discount, free month)
  - Check-in call from staff
  - Free personal training session
  - VIP experience
  - Feedback survey
- Intervention timing (immediate, scheduled)
- Intervention effectiveness tracking

**Intervention Templates**:
- Pre-built intervention templates:
  - "We miss you" re-engagement
  - Win-back offer
  - Fitness goal check-in
  - Membership freeze option
  - Plan downgrade offer
- Template personalization
- Template A/B testing

**Churn Outcome Tracking**:
- Track actual churn outcomes
- Compare predictions vs. actual churn
- Intervention success rate
- Saved members (prevented churn)
- Churn reasons (survey data)
- False positive/negative analysis

**Churn Analytics**:
- Churn rate over time
- Churn by cohort (join month)
- Churn by plan type
- Churn by location
- Churn reasons distribution
- Churn recovery rate
- Lifetime value of saved members

---

### 7.16 Organization Module

**Package**: `com.liyaqa.organization`

**Domain Models** (7):
- Organization
- Club
- Location
- GenderPolicy
- GenderSchedule
- ZatcaInfo
- OrganizationEnums

**Key Features**:

**Organization Management**:
- Multi-organization support (platform multi-tenancy)
- Organization profile:
  - Name (English/Arabic)
  - Logo and branding
  - Contact information
  - Legal entity details
  - Tax ID / Commercial Registration
  - Billing address
- Organization status (Pending, Active, Suspended, Closed)
- Organization settings and configuration
- Organization-level permissions

**Club Management**:
- Multiple clubs per organization
- Club profile:
  - Name (English/Arabic)
  - Club code (unique identifier)
  - Address and location
  - Contact information
  - Operating hours
  - Capacity
  - Images/photos
- Club status (Active, Under Construction, Temporarily Closed, Closed)
- Club-level settings override organization defaults

**Location Management** (Physical Branches):
- Multiple locations per club
- Location details:
  - Address with GPS coordinates
  - Time zone
  - Operating hours
  - Parking information
  - Public transport access
- Location-specific capacity and facilities

**Gender-Based Policies** (Saudi Arabia Compliance):
- Configure gender-separated access:
  - Ladies-only sections
  - Men-only sections
  - Mixed areas
  - Time-based gender separation
- Gender-specific class schedules:
  - Ladies-only classes
  - Men-only classes
  - Mixed classes
- Gender policy enforcement via access control

**ZATCA Integration** (Saudi Tax Authority):
- ZATCA info configuration:
  - VAT registration number
  - Company name (Arabic)
  - Commercial registration
  - Business sector
- E-invoicing compliance:
  - Generate ZATCA-compliant invoices
  - QR code generation for invoice verification
  - Tax summary reporting
  - Phase 1 and Phase 2 compliance

**Organization Hierarchy**:
```
Platform (Liyaqa)
└── Organization (e.g., "FitLife Saudi")
    ├── Club 1 (Riyadh North)
    │   ├── Location 1-1 (Main Branch)
    │   └── Location 1-2 (Annex)
    └── Club 2 (Jeddah)
        └── Location 2-1
```

**Multi-Tenancy**:
- Data isolation per organization
- Tenant context management
- Subdomain-based routing
- Cross-tenant analytics for platform admin

---

### 7.17 Accounts Module

**Package**: `com.liyaqa.accounts`

**Domain Models** (5):
- FamilyGroup
- FamilyGroupMember
- CorporateAccount
- CorporateMember
- AccountEnums

**Key Features**:

**Family Membership**:
- Create family groups
- Primary member designation (account holder)
- Add family members (spouse, children)
- Family group size limits
- Family pricing (discount for multiple members)
- Shared benefits:
  - Guest passes shared among family
  - Family class bookings
- Single billing for family
- Individual member tracking within family

**Corporate Accounts**:
- Create corporate account for companies
- Corporate profile:
  - Company name
  - Business registration
  - Contact person
  - Billing contact
- Corporate contract terms:
  - Number of seats
  - Seat pricing
  - Contract duration
  - Payment terms
- Employee verification workflow
- Bulk member enrollment

**Corporate Member Management**:
- Link employees to corporate account
- Employee eligibility verification
- Employee activation/deactivation
- Employee usage tracking
- Corporate billing (company pays, not individual)
- Corporate discounts

**Corporate Reporting**:
- Corporate usage reports:
  - Active employees
  - Visit frequency
  - Popular classes
  - Facility usage
- Invoice breakdowns
- ROI reporting for corporate wellness programs

---

### 7.18 Employee Module

**Package**: `com.liyaqa.employee`

**Domain Models** (5):
- Employee
- Department
- JobTitle
- EmployeeLocationAssignment
- EmployeeEnums

**Key Features**:

**Employee Management**:
- Employee directory
- Employee profile:
  - Personal information
  - Contact details
  - Emergency contact
  - Employee ID
  - Photo
- Employment details:
  - Hire date
  - Employment type (Full-time, Part-time, Contract)
  - Employment status (Active, On Leave, Terminated)
  - Probation period
  - Contract end date
- Job title and department assignment
- Reporting structure (manager)
- Salary information (if applicable)

**Department Management**:
- Create and manage departments:
  - Management
  - Sales
  - Operations
  - Training
  - Finance
  - Marketing
- Department hierarchy
- Department head assignment

**Job Title Management**:
- Define job titles:
  - Manager
  - Assistant Manager
  - Receptionist
  - Trainer
  - Sales Representative
  - Cleaner
  - Maintenance
- Job description
- Responsibilities
- Required qualifications

**Employee Location Assignment**:
- Assign employees to locations/clubs
- Multi-location assignments
- Primary location designation
- Assignment dates (start/end)

**Employee Performance**:
- Performance reviews
- Goal setting
- Training and certifications
- Attendance tracking

---

### 7.19 Authentication & Authorization Module

**Package**: `com.liyaqa.auth`

**Domain Models** (4):
- User
- RefreshToken
- PasswordResetToken
- AuthEnums

**Key Features**:

**User Management**:
- User account creation
- Username/email and password
- User status (Active, Inactive, Locked, Pending)
- Multi-role support
- User profile information

**Role-Based Access Control (RBAC)**:
- Predefined roles:
  - SUPER_ADMIN: Platform-level admin
  - PLATFORM_ADMIN: Platform features access
  - CLUB_ADMIN: Full access to club operations
  - MANAGER: Operations management
  - STAFF: Reception and basic operations
  - TRAINER: Trainer-specific access
  - SALES_REP: CRM and sales access
  - MEMBER: Member self-service access
- Custom role creation
- Role permissions management

**Authentication**:
- Password-based authentication
- JWT token generation
- Refresh token mechanism
- Token expiration and renewal
- Magic link authentication (passwordless for members)
- Two-factor authentication (2FA)
- Single Sign-On (SSO) support (future)

**Password Management**:
- Password hashing (BCrypt)
- Password strength requirements
- Password reset workflow:
  - Request reset via email
  - Time-limited reset token (24 hours)
  - Reset password
- Password history (prevent reuse)
- Password expiration policy

**Session Management**:
- Active session tracking
- Multi-device login support
- Session timeout (idle and absolute)
- Logout functionality
- "Logout all devices" option

**Security Features**:
- Rate limiting (prevent brute force)
- Account lockout after failed attempts
- Login history and audit trail
- IP address tracking
- Device fingerprinting
- Suspicious activity alerts

---

### 7.20 Notification Module

**Package**: `com.liyaqa.notification`

**Domain Models** (4):
- Notification
- NotificationPreference
- DeviceToken
- NotificationEnums

**Key Features**:

**Multi-Channel Notifications**:
- **Email**: SMTP integration, HTML templates
- **SMS**: Twilio integration, character optimization
- **WhatsApp**: WhatsApp Business API, rich media
- **Push Notifications**: Firebase Cloud Messaging (FCM), Apple Push Notification Service (APNs)

**Notification Types**:
- Transactional:
  - Booking confirmation
  - Payment receipt
  - Check-in confirmation
  - Invoice generated
  - Password reset
- Reminders:
  - Class reminder (24h, 1h before)
  - Payment due reminder
  - Subscription expiring
  - Freeze ending soon
- Marketing:
  - Promotional campaigns
  - New classes announcement
  - Special offers
  - Referral invitations
- System:
  - Maintenance notifications
  - Service updates
  - Policy changes

**Notification Preferences**:
- Member control over notification channels
- Per-notification-type preferences
- Quiet hours (do not disturb)
- Frequency caps (max per day)
- Unsubscribe from marketing

**Device Token Management**:
- Register device tokens for push notifications
- Token per device (mobile app)
- Token validation
- Token refresh
- Remove invalid tokens

**Notification Delivery**:
- Queue-based delivery
- Retry logic for failed deliveries
- Delivery status tracking (Sent, Delivered, Failed, Opened, Clicked)
- Bounce handling
- Delivery logs

**Templates**:
- Template management system
- Variable substitution ({{firstName}}, {{className}}, etc.)
- Bilingual templates (English/Arabic)
- Template versioning
- Template preview

**Notification Analytics**:
- Delivery rates
- Open rates (email, push)
- Click rates
- Unsubscribe rates
- Channel effectiveness

---

### 7.21 Reporting Module

**Package**: `com.liyaqa.reporting`

**Domain Models** (3):
- ReportHistory
- ScheduledReport
- ReportingEnums

**Key Features**:

**Report Catalog**:
- **Member Reports**:
  - Active members trend
  - New member acquisitions
  - Member retention analysis
  - Churn report with reasons
  - Member lifetime value (LTV)
  - Member demographics
  - Member engagement scores
- **Financial Reports**:
  - Revenue by period
  - Revenue by plan/service
  - Revenue by location
  - Outstanding invoices
  - Payment collection efficiency
  - Revenue forecast
  - Budget vs. actual
- **Attendance Reports**:
  - Daily/weekly/monthly attendance
  - Peak hours analysis
  - Member visit frequency
  - Average visit duration
- **Class Reports**:
  - Class attendance rates
  - Popular classes ranking
  - Class utilization
  - No-show rates
  - Booking trends
- **Sales Reports**:
  - Lead conversion funnel
  - Sales by representative
  - Lead source effectiveness
  - Deal pipeline value
- **Marketing Reports**:
  - Campaign performance
  - Channel effectiveness
  - ROI by campaign
  - Segmentation analysis

**Report Generation**:
- On-demand report generation
- Date range selection
- Filter criteria
- Drill-down capabilities
- Comparison periods

**Report Formats**:
- PDF with branding
- Excel spreadsheet
- CSV export
- JSON (API access)
- Interactive dashboard

**Scheduled Reports**:
- Automate report generation
- Schedule frequency (daily, weekly, monthly)
- Email delivery to recipients
- Report distribution lists

**Report History**:
- Archive of generated reports
- Regenerate historical reports
- Report download from history

**Custom Dashboards**:
- Widget-based dashboard builder
- Drag-and-drop widgets
- Widget types (chart, metric, table)
- Save custom dashboard layouts
- Share dashboards with team

---

### 7.22 Forecasting Module

**Package**: `com.liyaqa.forecasting`

**Domain Models** (6):
- Forecast
- ForecastModel
- ForecastScenario
- SeasonalityPattern
- Budget
- ForecastingEnums

**Key Features**:

**Revenue Forecasting**:
- AI/ML-powered revenue predictions
- Forecast periods (30/60/90/180/365 days)
- Historical data analysis
- Trend identification
- Seasonality adjustment
- Forecast confidence intervals

**Membership Forecasting**:
- Predict future member count
- New member acquisition forecast
- Churn forecast
- Net member growth prediction

**Seasonality Analysis**:
- Identify seasonal patterns:
  - Weekly patterns (Mon-Fri vs. weekend)
  - Monthly patterns (New Year, summer, etc.)
  - Quarterly patterns
  - Holiday effects (Ramadan, Eid, etc.)
  - Special events
- Seasonality factor calculation
- Seasonal adjustment of forecasts

**Forecast Models**:
- Time series models (ARIMA, Prophet)
- Machine learning models (regression, neural networks)
- Ensemble models (combine multiple models)
- Model training on historical data
- Model evaluation and accuracy tracking
- Model versioning

**Scenario Planning**:
- Create "what-if" scenarios:
  - What if we increase prices by 10%?
  - What if we add a new location?
  - What if churn increases by 5%?
  - What if we launch a new marketing campaign?
- Scenario comparison
- Sensitivity analysis
- Best-case and worst-case scenarios

**Budget Management**:
- Create budgets for revenue and expenses
- Budget by category (membership, classes, shop, etc.)
- Budget by period (monthly, quarterly, annual)
- Budget vs. actual tracking
- Variance analysis
- Budget alerts

**Forecasting Analytics**:
- Forecast accuracy tracking (actual vs. predicted)
- Mean Absolute Percentage Error (MAPE)
- Forecast bias detection
- Model performance over time

---

### 7.23 Kiosk Module

**Package**: `com.liyaqa.kiosk`

**Domain Models** (4):
- KioskDevice
- KioskSession
- KioskTransaction
- KioskEnums

**Key Features**:

**Kiosk Device Management**:
- Register kiosk devices
- Device identification (device ID, name)
- Device location within facility
- Device type (check-in, payment, full-service)
- Device status monitoring (Online, Offline, Maintenance)
- Remote device configuration
- Device software version tracking

**Kiosk Session Management**:
- User session on kiosk
- Session timeout (idle timeout)
- Session ID tracking
- Member identification on session start
- Automatic session cleanup
- Session history

**Kiosk Transactions**:
- Transaction types:
  - Check-in
  - Class booking
  - Payment processing
  - Membership purchase
  - Agreement signing
- Transaction logging
- Transaction status tracking
- Receipt generation and printing
- Transaction audit trail

**Kiosk Configuration**:
- Language options (English/Arabic)
- Idle timeout duration
- Screen saver
- Touch calibration
- Printer settings
- Payment terminal integration
- Access control hardware integration

**Kiosk Monitoring**:
- Real-time status dashboard
- Uptime tracking
- Transaction volume per kiosk
- Error logs
- Maintenance alerts
- Usage analytics

---

### 7.24 Wearables Integration Module

**Package**: `com.liyaqa.wearables`

**Domain Models** (6):
- WearablePlatform
- MemberWearableConnection
- WearableSyncJob
- WearableDailyActivity
- WearableWorkout
- WearableEnums

**Key Features**:

**Supported Wearable Platforms**:
- Fitbit
- Garmin Connect
- Apple Health (via HealthKit)
- Google Fit
- Strava
- Oura Ring
- WHOOP
- Samsung Health

**Wearable Connection**:
- OAuth authentication flow for wearables
- Member connects wearable account
- Store access tokens (encrypted)
- Token refresh mechanism
- Disconnect wearable

**Data Synchronization**:
- Automatic background sync (daily)
- Manual sync trigger
- Sync status tracking (Success, Failed, Pending)
- Sync history and logs
- Conflict resolution (duplicate data)

**Daily Activity Data**:
- Steps
- Distance
- Calories burned
- Active minutes
- Floors climbed
- Heart rate (average, resting, max)
- Sleep duration and quality
- VO2 max

**Workout Data**:
- Workout type (running, cycling, swimming, strength training, etc.)
- Start time and duration
- Distance
- Calories burned
- Average heart rate
- Max heart rate
- Pace/speed
- Elevation gain
- GPS route (if available)

**Activity Analytics**:
- Daily activity trends
- Weekly and monthly summaries
- Goal progress tracking
- Comparison with gym attendance
- Activity-based loyalty points
- Leaderboards (optional, with privacy controls)

**Privacy & Consent**:
- Member consent for data collection
- Data usage transparency
- Option to disconnect and delete data
- Privacy settings (share on leaderboard, etc.)

---

### 7.25 Voucher Module

**Package**: `com.liyaqa.voucher`

**Domain Models** (3):
- Voucher
- VoucherUsage
- VoucherEnums

**Key Features**:

**Voucher Creation**:
- Generate voucher/coupon codes
- Voucher code formats:
  - Random code (AUTO-GENERATED)
  - Custom code (NEWYEAR2024)
  - Prefix-based (SUMMER-XXXX)
- Single-use vs. multi-use vouchers
- Voucher quantity (number of codes to generate)

**Discount Types**:
- Percentage discount (e.g., 20% off)
- Fixed amount discount (e.g., 100 SAR off)
- Free trial period (e.g., 7 days free)
- Buy-one-get-one (BOGO)
- Free upgrade (e.g., upgrade to premium for free)

**Voucher Configuration**:
- Discount value
- Validity period (start and end dates)
- Usage limit:
  - Total uses (e.g., first 100 uses)
  - Per member uses (e.g., 1 use per member)
- Applicable products/services:
  - Specific membership plans
  - All plans
  - Specific products in shop
  - Personal training packages
- Restrictions:
  - First-time members only
  - Existing members only
  - Specific locations
  - Minimum purchase amount
- Stackable (can be combined with other discounts)

**Voucher Redemption**:
- Apply voucher code at checkout
- Validate voucher:
  - Check validity period
  - Check usage limits
  - Check applicability
  - Check member eligibility
- Calculate discount
- Record voucher usage
- Update remaining uses

**Voucher Usage Tracking**:
- Redemption count
- Redemption history (who, when, what)
- Revenue with voucher
- Discount amount given
- Voucher performance metrics

**Gift Cards**:
- Prepaid gift card functionality
- Gift card balance
- Gift card redemption
- Gift card transfer

**Voucher Analytics**:
- Most popular vouchers
- Conversion rate (codes distributed vs. used)
- Revenue per voucher campaign
- Average discount per redemption
- ROI of voucher campaigns

---

### 7.26 Shop Module

**Package**: `com.liyaqa.shop`

**Domain Models** (7):
- Product
- ProductCategory
- StockPricing
- BundleItem
- Order
- OrderItem
- ShopEnums

**Key Features**:

**Product Catalog**:
- Product management (create, edit, delete)
- Product details:
  - Name (English/Arabic)
  - Description
  - SKU
  - Barcode
  - Images (multiple)
  - Category
  - Tags
- Product variants (size, color, etc.)
- Product pricing
- Product visibility (active/inactive)

**Product Categories**:
- Category hierarchy (parent/child)
- Category images
- Category descriptions
- Category SEO (if public-facing)

**Inventory Management**:
- Stock tracking per product
- Stock levels (in stock, low stock, out of stock)
- Reorder point alerts
- Stock adjustments (manual increase/decrease)
- Stock history and audit trail
- Multi-location stock (if applicable)

**Pricing**:
- Base price
- Sale price with start/end dates
- Tiered pricing (bulk discounts)
- Member vs. non-member pricing
- Tax-inclusive or exclusive pricing

**Product Bundles**:
- Create product bundles (e.g., starter kit)
- Bundle pricing (discount for bundle)
- Bundle components

**Order Management**:
- Create orders (manual or via POS)
- Order details:
  - Order number
  - Order date
  - Customer (member or guest)
  - Order items (products and quantities)
  - Subtotal, tax, discount, total
  - Payment method
  - Payment status
- Order status tracking:
  - Pending
  - Processing
  - Completed
  - Cancelled
  - Refunded
- Order fulfillment
- Order history per member

**Point of Sale (POS)**:
- Touch-friendly POS interface
- Product search and barcode scanning
- Shopping cart
- Apply discounts and vouchers
- Multiple payment methods
- Cash drawer management
- Receipt printing
- Email receipt option

**Shop Analytics**:
- Top-selling products
- Revenue by product/category
- Inventory turnover
- Low stock alerts
- Sales trends

---

### 7.27 Branding Module

**Package**: `com.liyaqa.branding`

**Domain Models** (1):
- BrandingConfig

**Key Features**:

**White-Label Branding**:
- Upload custom logo
- Upload favicon
- Set primary brand color (hex code)
- Set secondary brand color
- Set accent color
- Font selection (from predefined set)

**Email Branding**:
- Email header with logo
- Email footer customization
- Email color scheme
- Email signature

**Mobile App Branding**:
- App name
- App icon
- App splash screen
- App color scheme
- App store listing customization

**Web Portal Branding**:
- Portal logo
- Portal color scheme
- Custom domain support
- Subdomain configuration

**Document Branding**:
- Invoice templates with logo
- Agreement templates with logo
- Receipt templates
- Report headers/footers

---

### 7.28 Webhook Module

**Package**: `com.liyaqa.webhook`

**Domain Models** (3):
- Webhook
- WebhookDelivery
- WebhookEnums

**Key Features**:

**Webhook Registration**:
- Register webhook endpoints
- Webhook URL (HTTPS required)
- Webhook secret for signature verification
- Event subscriptions (select events to receive)
- Active/inactive status

**Event Types**:
- Member events:
  - member.created
  - member.updated
  - member.deleted
- Subscription events:
  - subscription.created
  - subscription.renewed
  - subscription.expired
  - subscription.cancelled
- Payment events:
  - payment.completed
  - payment.failed
  - payment.refunded
- Attendance events:
  - attendance.checkin
  - attendance.checkout
- Booking events:
  - booking.created
  - booking.cancelled
  - booking.completed
- Invoice events:
  - invoice.created
  - invoice.paid
  - invoice.overdue

**Webhook Delivery**:
- Async event publishing
- HTTP POST to webhook URL
- JSON payload with event data
- HMAC signature for verification
- Retry logic with exponential backoff:
  - Retry 1: Immediate
  - Retry 2: 5 minutes
  - Retry 3: 30 minutes
  - Retry 4: 2 hours
  - Retry 5: 8 hours
  - Retry 6: 24 hours
- Delivery status tracking (Success, Failed, Retrying)
- Delivery logs

**Webhook Testing**:
- Send test event to webhook
- Webhook endpoint validation
- Signature verification test
- Response inspection

**Webhook Security**:
- HMAC-SHA256 signature
- Signature verification on receiver side
- HTTPS enforcement
- IP whitelisting (optional)
- Rate limiting per webhook

**Webhook Management**:
- List all webhooks
- Edit webhook URL or events
- Deactivate webhook
- Delete webhook
- View delivery history
- Retry failed deliveries

**Webhook Analytics**:
- Total deliveries
- Success rate
- Failure rate
- Average response time
- Events by type

---

### 7.29 Shared/Common Module

**Package**: `com.liyaqa.shared`

**Domain Models** (6):
- Permission
- UserPermission
- PrayerTime
- HijriDate
- FileMetadata
- RateLimitEntry

**Key Features**:

**Permission System**:
- Granular permission definitions
- Permission categories (read, write, delete, admin)
- Permission assignment to roles
- Permission checking middleware
- Permission audit trail

**Prayer Time Calculation**:
- Calculate prayer times based on location (GPS coordinates)
- Use Umm Al-Qura calendar method (Saudi Arabia standard)
- Prayer times:
  - Fajr (dawn)
  - Sunrise (Shuruq)
  - Dhuhr (noon)
  - Asr (afternoon)
  - Maghrib (sunset)
  - Isha (night)
- Display prayer times on member app and admin dashboard
- Prayer time notifications (optional)
- Adjust for Daylight Saving Time

**Islamic Calendar (Hijri)**:
- Convert Gregorian dates to Hijri dates
- Display Hijri dates alongside Gregorian
- Hijri date formatting
- Support for Islamic holidays and events

**File Management**:
- File upload (documents, images, videos)
- File storage (local filesystem or cloud storage)
- File metadata tracking:
  - Filename
  - Size
  - MIME type
  - Upload date
  - Uploaded by
  - Associated entity (member, organization, etc.)
- File access control
- File download and streaming
- File deletion

**Rate Limiting**:
- API rate limiting to prevent abuse
- Rate limit by IP address
- Rate limit by user account
- Configurable limits (requests per minute/hour)
- Rate limit headers in API response
- Rate limit exceeded error handling

**QR Code Generation**:
- Generate QR codes for:
  - Member check-in
  - Event tickets
  - Payment links
  - Referral links
  - Invoice verification (ZATCA)
- QR code encoding options
- QR code image formats (PNG, SVG)

**Audit Logging**:
- Log all significant actions:
  - Create, update, delete operations
  - Permission changes
  - Login/logout
  - Payment transactions
  - Configuration changes
- Audit log includes:
  - User who performed action
  - Timestamp
  - Action type
  - Entity affected
  - Old and new values
  - IP address
- Audit log search and filtering
- Audit log retention policy

**Bulk Operations**:
- Bulk import from CSV/Excel
- Bulk export to CSV/Excel
- Bulk update operations
- Bulk delete with confirmation
- Background job processing for large operations
- Progress tracking for bulk operations

**Calendar Integration**:
- Export events to iCalendar format
- Sync with Google Calendar, Outlook
- Calendar feed for member schedules

---

## 8. Mobile Applications

### 8.1 Member Mobile App

**Technology**: Kotlin Multiplatform (KMP) with Compose Multiplatform

**Platforms**: iOS and Android from shared codebase

**Key Features**:

**Dashboard**:
- Member summary (name, membership plan, expiry date)
- Quick action buttons
- Upcoming bookings
- Wallet balance
- Recent activity

**QR Code Check-In**:
- Display QR code for gym access
- Offline QR code generation
- Auto-refresh for security
- Fallback member ID display

**Class Booking**:
- Browse upcoming classes
- Filter by date, type, trainer, location
- View class details and capacity
- Book classes with confirmation
- Cancel bookings
- View booking history
- Waitlist support

**Personal Training**:
- Browse trainers and specializations
- Request PT sessions
- View upcoming and past sessions
- Cancel sessions

**Subscriptions**:
- View active subscription details
- Subscription progress and stats
- Freeze subscription
- Request plan change
- View contract

**Payments & Invoices**:
- View pending and paid invoices
- Pay invoices within app
- Save payment methods
- View payment history
- Wallet balance and top-up

**Profile Management**:
- Edit personal information
- Update emergency contact
- Change password
- Notification preferences

**Fitness Tracking**:
- View daily activity (steps, calories, active minutes)
- Connect wearable devices
- View workout history
- Activity trends and stats

**Referrals**:
- Share referral link
- View referral history
- Track rewards

**Agreements**:
- View and sign agreements
- Download signed agreements

**Push Notifications**:
- Class reminders
- Booking confirmations
- Payment reminders
- Subscription expiry alerts
- Promotional offers
- Deep linking to relevant screens

**Offline Capabilities**:
- View cached data when offline
- Offline QR code for check-in
- Sync when back online

**Localization**:
- English and Arabic support
- RTL layout for Arabic
- Date and number formatting per locale

---

### 8.2 Staff Mobile App

**Technology**: Kotlin Multiplatform (KMP) with Compose Multiplatform

**Platforms**: iOS and Android

**Key Features**:

**Dashboard**:
- Today's schedule (classes, PT sessions)
- Quick stats
- Notifications and alerts

**Class Management**:
- View assigned classes
- Mark attendance for class participants
- Add session notes
- Cancel or reschedule classes
- View class roster

**PT Session Management**:
- View upcoming PT sessions
- Confirm or reschedule sessions
- Record session notes
- Track client progress

**Member Check-In**:
- Quick member check-in via search
- QR code scanning
- Member lookup

**Member Profiles**:
- View member details
- View member notes
- Add member notes
- Contact member

**Notifications**:
- Class assignment notifications
- PT session reminders
- Schedule changes
- Important alerts

---

## 9. System-Wide Features

### 9.1 Multi-Tenancy

**Two-Level Hierarchy**:
- Platform → Organization → Clubs

**Data Isolation**:
- Database-level isolation with `organization_id` and `club_id`
- Application-level tenant context
- API-level tenant validation

**Subdomain Routing**:
- `{client-slug}.liyaqa.com` for client admin
- `platform.liyaqa.com` for platform admin

**Tenant Detection**:
- Subdomain-based auto-detection
- Header-based (`X-Organization-Id`, `X-Club-Id`)
- JWT token claims

---

### 9.2 Internationalization (i18n)

**Supported Languages**:
- English (default)
- Arabic

**Features**:
- UI text translation
- Date formatting per locale
- Number formatting per locale
- Currency formatting
- RTL layout support for Arabic
- Language switcher
- User preference persistence

---

### 9.3 Security Features

**Authentication**:
- JWT-based authentication
- Refresh tokens
- Password hashing (BCrypt)
- Multi-factor authentication (2FA)
- Magic link (passwordless) for members

**Authorization**:
- Role-based access control (RBAC)
- Permission-based authorization
- Resource-level permissions
- API endpoint protection

**Data Security**:
- Encryption at rest (database encryption)
- Encryption in transit (HTTPS/TLS)
- PCI compliance for payment data
- Tokenization of sensitive data
- Secure session management

**Audit & Compliance**:
- Comprehensive audit logging
- Access logs
- Change tracking
- Compliance with GDPR, PDPA, PCI DSS

---

### 9.4 Integration Capabilities

**Payment Gateways**:
- PayTabs
- STC Pay
- SADAD
- Tamara

**Communication**:
- Email (SMTP)
- SMS (Twilio)
- WhatsApp Business API
- Push notifications (Firebase)

**Compliance**:
- ZATCA e-invoicing (Saudi Arabia)

**Equipment Providers**:
- TechnoGym
- Precor
- Life Fitness
- Milon

**Wearable Platforms**:
- Fitbit
- Garmin
- Apple Health
- Google Fit
- Strava
- Oura

**Webhooks**:
- Event-driven integrations
- Custom webhook endpoints
- Partner integrations

---

### 9.5 Performance & Scalability

**Caching**:
- Caffeine in-memory cache
- API response caching
- Database query caching

**Database Optimization**:
- Indexed queries
- Connection pooling (HikariCP)
- Query optimization
- Pagination for large datasets

**Background Jobs**:
- Scheduled jobs (Spring Scheduler)
- Distributed job locking (ShedLock)
- Async processing
- Job monitoring

**API Optimization**:
- Rate limiting
- Response compression
- Lazy loading
- Partial responses

---

### 9.6 Monitoring & Operations

**Health Checks**:
- Spring Boot Actuator endpoints
- Database connectivity checks
- External service health checks

**Logging**:
- Structured logging
- Log levels (DEBUG, INFO, WARN, ERROR)
- Log aggregation
- Error tracking

**Metrics**:
- Request metrics
- Response times
- Error rates
- Business metrics (signups, revenue, etc.)

**Alerting**:
- System alerts
- Business alerts
- Error notifications
- Performance degradation alerts

---

## Summary

Liyaqa is a comprehensive gym management platform with:
- **245+ frontend pages** across member, admin, platform, kiosk, and public interfaces
- **31 backend domain modules** with 189+ domain models
- **97+ API controllers** providing RESTful endpoints
- **Multi-tenant architecture** supporting B2B SaaS model
- **Native Saudi Arabia features** (ZATCA, STC Pay, prayer times, gender policies)
- **Mobile apps** for members and staff (Kotlin Multiplatform)
- **Complete member lifecycle** management (signup → active → retention → churn)
- **Advanced features** including CRM, marketing automation, churn prediction, loyalty, compliance
- **Multiple integrations** (payments, communications, equipment, wearables)
- **Bilingual support** (English/Arabic with RTL)

This feature documentation provides a complete reference for all capabilities of the Liyaqa platform.

---

*Last Updated: January 2026*
*Version: 1.0*
