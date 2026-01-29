# Liyaqa Platform Admin Guide

**Guide for Platform Administrators (B2B SaaS)**

---

## Welcome, Platform Admin!

This guide is for managing the Liyaqa platform, client organizations, and B2B operations.

---

## Access

**Platform Portal**: `platform.liyaqa.com` or `app.liyaqa.com`
**Role**: Platform Admin, Sales Rep, or Support Agent

---

## Platform Dashboard

**Role-Based Views**:
- **Platform Admin**: Full platform metrics, client health, revenue, alerts
- **Sales Rep**: Deal pipeline, leads, revenue targets
- **Support**: Open tickets, response time, client satisfaction

**Key Metrics**:
- Total clients (Active, Trial, Churned)
- Monthly Recurring Revenue (MRR)
- Client health scores
- Support ticket stats

---

## Client Management

### Onboard New Client
1. **Clients** > **New Client**
2. Onboarding wizard:
   - **Step 1**: Basic info (name, email, phone, country)
   - **Step 2**: Organization setup (locations, expected members)
   - **Step 3**: Plan selection (Starter, Growth, Enterprise)
   - **Step 4**: Billing setup (payment method, billing contact)
   - **Step 5**: Configuration (subdomain, branding, features)
   - **Step 6**: Review & Launch
3. Client environment created automatically
4. Admin user receives welcome email

### View Client List
- **Clients** page shows all organizations
- **Search**: By name or email
- **Filter**: By status (Pending, Active, Trial, Suspended, Churned)
- **Stats**: Total clients, active, pending, suspended

### Client Detail View

**Tabs**:
- **Overview**: Basic info, subscription, health score, quick stats
- **Members**: Total members, growth trend, engagement
- **Locations**: List of clubs/locations, status
- **Usage**: Feature usage, API calls, storage, bandwidth
- **Billing**: Current plan, invoice history, payment methods
- **Support**: Open tickets, ticket history, satisfaction ratings
- **Activity**: Recent logins, configuration changes, audit trail

**Actions**:
- Activate/Suspend client
- Upgrade/Downgrade plan
- Send notification
- Schedule check-in call
- Assign CSM (Customer Success Manager)
- Generate health report
- Impersonate (for support troubleshooting)

---

## Client Plans Management

### View Plans
- **Plans** page lists all subscription plans
- Filter by active/inactive
- See stats: Total plans, active, average price

### Create Plan
1. **Plans** > **New Plan**
2. Enter:
   - Name and description
   - Billing cycle (monthly, quarterly, annual)
   - Price in SAR
   - Trial period (days)
3. Set feature limits:
   - Max members
   - Max locations
   - Max staff users
   - Storage limit (GB)
   - API rate limit
4. Configure feature flags:
   - Mobile app access
   - Advanced reporting
   - API access
   - White-label branding
   - Equipment integrations
   - CRM module
   - Marketing automation
5. Set visibility (public/private)
6. Save plan

### Edit Plan
- Update pricing, limits, or features
- Version management for plan changes
- Existing clients not affected unless upgraded

---

## Client Health Monitoring

### Health Overview Dashboard
- **Health** page shows all clients with health scores
- Summary cards:
  - Healthy (70-100)
  - Monitor (50-69)
  - At-Risk (30-49)
  - Critical (0-29)

### Health Score Components
1. **Usage Score** (40%): Login frequency, feature usage, member activity
2. **Engagement Score** (30%): Feature adoption, integration usage
3. **Payment Score** (20%): On-time payments, payment method validity
4. **Support Score** (10%): Ticket volume, resolution time, satisfaction

### Health Actions
- **Filter**: By risk level, trend
- **Bulk Select**: Send check-ins, assign CSM
- **View Detail**: Click client for detailed health page
  - Health trend chart
  - Metric breakdown
  - Recommended actions
  - Intervention history

---

## Alerts & Notifications

### Alert Center
**Alerts** page shows active alerts by category:
- Usage limits approaching/exceeded
- Payment failures
- Low engagement
- Support issues
- Churn risk
- Security concerns

### Alert Actions
- Acknowledge alert
- Assign to team member
- Create support ticket
- Send notification to client
- Run playbook
- Snooze alert
- Resolve with notes

### Alert Playbooks
Predefined response workflows for common alerts with automated steps and escalation procedures.

---

## Dunning Management

### Dunning Dashboard
- **Dunning** page shows clients in payment recovery
- Total amount at risk
- Recovery success rate

### Dunning Sequence
Automatic retries and reminders:
- Day 1, 3, 7, 14, 30 after payment failure
- Email and SMS reminders
- Escalation to manual recovery
- Service suspension warnings

### Actions
- View clients with failed payments
- Manual payment processing
- Update payment methods
- Payment plan negotiation

---

## Support Ticket Management

### View Tickets
- **Support** page lists all tickets
- Filter by: Status, Priority, Category
- Sort by: Created date, Updated date

### Create Ticket
1. **Support** > **New Ticket**
2. Select client
3. Enter subject and description
4. Set priority (Low, Medium, High, Urgent)
5. Select category (Technical, Billing, Feature Request, Bug)
6. Attach files
7. Assign to support rep
8. Create ticket

### Manage Ticket
- **Reply**: Add public response (visible to client)
- **Internal Note**: Add private note (staff only)
- **Status**: Update status (Open, In Progress, Waiting, Resolved, Closed)
- **Priority**: Change priority level
- **Reassign**: Change assignee
- **Merge**: Combine related tickets

### SLA Tracking
- First response time SLA
- Resolution time SLA
- SLA breach alerts

---

## Sales & Deal Pipeline

### Deals (Kanban View)
**Pipeline Stages**:
1. Qualification
2. Demo
3. Proposal
4. Negotiation
5. Closed Won
6. Closed Lost

**Actions**:
- Drag and drop deals between stages
- View deal value per stage
- Track expected close dates
- Monitor win probability

### Create Deal
1. **Deals** > **New Deal**
2. Enter company info and contact details
3. Set deal value
4. Select expected close date
5. Choose deal source
6. Assign sales rep
7. Add notes
8. Save deal

### Convert Deal to Client
1. Open won deal
2. Click **Convert to Client**
3. Follow client onboarding wizard
4. Deal marked as converted

---

## Platform Users Management

### Add Platform User
1. **Platform Users** > **Add User**
2. Enter user details
3. Assign role:
   - Platform Admin
   - Sales Representative
   - Support Agent
   - Finance/Billing
4. Set permissions
5. Send invitation email

### Roles & Permissions
- **Platform Admin**: Full access to all features
- **Sales Rep**: Deal management, client creation, limited support
- **Support Agent**: Ticket management, client support, view-only access
- **Finance**: Billing, invoices, payment management

---

## Platform Billing

### Client Invoices
- **Invoices** page lists all client invoices
- Create manual invoices for overages or custom services
- Track payment status
- Process refunds

### Revenue Reports
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Churn rate
- Revenue by plan
- Expansion revenue

---

## Configuration

### Platform Settings
- Platform name and branding
- Default client plan
- Trial period defaults
- Onboarding configuration
- Email templates

### Feature Flags
Enable/disable features platform-wide or per client:
- Mobile apps
- Advanced reporting
- Equipment integrations
- Wearable integrations

---

## Reports & Analytics

### Platform Reports
- Client acquisition funnel
- Retention cohorts
- Revenue trends
- Feature adoption
- Support metrics
- Health score distribution

### Export Data
- Export to Excel/CSV
- Schedule automated reports
- Dashboard snapshots

---

## Best Practices

### Client Success
- Proactive health monitoring
- Regular check-in calls
- Onboarding support
- Training and resources
- Feature adoption coaching

### Retention Strategies
- Identify at-risk clients early
- Offer retention incentives
- Address support issues quickly
- Collect feedback and act on it

### Scaling Operations
- Automate repetitive tasks
- Use playbooks for common scenarios
- Monitor platform metrics
- Optimize onboarding process

---

## Support

**Technical Support**: support@liyaqa.com
**Documentation**: docs.liyaqa.com
**Training**: Monthly platform admin webinars

---

*Power the fitness industry with Liyaqa!*

---

*Last Updated: January 2026*
*Version: 1.0*
