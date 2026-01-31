# Incident Response Guide

## 1. Incident Classification

### Severity Levels

#### SEV-1: Critical

**Definition:** Complete service outage or critical functionality unavailable affecting all or most users.

**Examples:**
- Production application completely down
- Database unavailable or corrupted
- Security breach or data leak
- Payment processing completely broken
- Authentication system down (nobody can login)

**Response Requirements:**
- **Response Time:** Immediate (15 minutes)
- **Communication:** All stakeholders, status page updated every 30 minutes
- **War Room:** Required (Slack channel + video call)
- **Escalation:** Automatic to Backend Lead and CTO
- **Post-Mortem:** Required within 48 hours

#### SEV-2: High

**Definition:** Degraded performance or critical feature unavailable affecting significant portion of users (>50%).

**Examples:**
- High error rate (>5%) on critical endpoints
- Severe performance degradation (response times >3s)
- Critical feature unavailable (class booking, check-in)
- Data integrity issue (no data loss)
- Payment processing intermittent failures

**Response Requirements:**
- **Response Time:** 1 hour
- **Communication:** Leadership and affected teams, hourly updates
- **War Room:** Recommended for extended incidents
- **Escalation:** After 2 hours if unresolved
- **Post-Mortem:** Required

#### SEV-3: Medium

**Definition:** Minor performance degradation or non-critical feature unavailable affecting limited users.

**Examples:**
- Moderate error rate (2-5%) on non-critical endpoints
- Non-critical feature unavailable (reports, analytics)
- Intermittent errors affecting <20% of users
- Email/SMS notifications delayed
- Performance degradation on specific features

**Response Requirements:**
- **Response Time:** 4 hours
- **Communication:** Internal teams only
- **War Room:** Not required
- **Escalation:** Not required unless becomes SEV-2
- **Post-Mortem:** Optional (recommended for repeat incidents)

#### SEV-4: Low

**Definition:** Minor bugs, cosmetic issues, or warnings with no user impact.

**Examples:**
- Cosmetic UI issues
- Minor bugs with workarounds
- Performance warnings (not affecting users)
- Low-priority feature requests
- Documentation errors

**Response Requirements:**
- **Response Time:** Next business day
- **Communication:** Bug tracking system only
- **War Room:** Not required
- **Escalation:** Not required
- **Post-Mortem:** Not required

---

## 2. Incident Response Workflow

### Phase 1: Detection & Triage (0-15 min)

#### Step 1.1: Incident Detected

**Detection Methods:**
- Alert fired in Prometheus/Alertmanager
- User report via support email/chat
- Proactive monitoring review
- Failed health check
- Third-party monitoring alert

**Automated Alerts:**
- Slack notification in #liyaqa-alerts or #liyaqa-critical
- Email to on-call engineer
- PagerDuty page (for SEV-1)

#### Step 1.2: Initial Assessment

**On-call engineer verifies:**

1. **Confirm Incident is Real**
   ```bash
   # Verify health check
   curl https://api.liyaqa.com/api/health

   # Check service status
   docker compose ps

   # Check recent logs
   docker logs liyaqa-backend --tail 100
   ```

2. **Determine Severity**
   - How many users affected? (all, >50%, <20%, specific user)
   - What functionality is impacted? (critical vs non-critical)
   - Is data at risk? (loss, corruption, breach)
   - Is revenue affected? (payment processing down)

3. **Check Affected Components**
   ```bash
   # Application health
   curl http://localhost:8080/actuator/health

   # Database connectivity
   docker exec liyaqa-postgres pg_isready

   # Check metrics
   open http://localhost:3001  # Grafana
   ```

4. **Estimate User Impact**
   - Check active user count in metrics
   - Review error rate percentage
   - Check user reports/complaints

#### Step 1.3: Declare Incident

**For SEV-1 and SEV-2 incidents, immediately:**

1. **Create Incident in Slack**
   ```
   /incident create Production API Returning 500 Errors
   ```

   Or manually create channel: `#incident-2026-01-31-api-errors`

2. **Assign Incident Commander**
   - On-call engineer becomes IC by default
   - IC coordinates response, makes decisions
   - IC owns timeline and communication

3. **Create Incident Document**
   - Copy incident template: https://docs.google.com/document/d/[template-id]
   - Rename: "Incident YYYY-MM-DD: [Brief Title]"
   - Share link in incident Slack channel
   - Start documenting timeline

4. **Update Status Page** (SEV-1/SEV-2 only)
   ```
   Status: Investigating

   We are currently experiencing issues with [service/feature].
   Our team is investigating and will provide updates every [30 min / 1 hour].
   ```

### Phase 2: Investigation & Mitigation (15 min - 4 hours)

#### Step 2.1: Assemble Response Team

**Incident Commander (IC):**
- Coordinates overall response
- Makes final decisions
- Manages communication
- Ensures timeline documented

**Technical Lead:**
- Drives technical investigation
- Proposes mitigation strategies
- Implements fixes
- Verifies resolution

**Communications Lead** (SEV-1/SEV-2):
- Manages external communication
- Updates status page
- Notifies stakeholders
- Sends progress updates

**Support Team** (based on severity and duration):
- **SEV-1:** Backend engineer, DevOps, Frontend engineer (if needed), DBA
- **SEV-2:** Backend engineer, DevOps
- **SEV-3:** On-call engineer only

**How to Assemble:**
```
# In incident Slack channel
@backend-lead We have a SEV-1 incident. Need backend support immediately.
@devops-lead Database appears to be the issue. Need DevOps support.

# Start video call
/zoom or /meet
Post link in channel: "War room: [zoom link]"
```

#### Step 2.2: Investigate

**Systematic Investigation Steps:**

1. **Check Recent Changes**
   ```bash
   # Recent deployments
   git log --oneline -10

   # Check deployment time
   docker inspect liyaqa-backend | grep Created

   # If recent deployment, consider rollback first
   ```

2. **Review Monitoring Dashboards**
   - Grafana: Application Metrics dashboard
   - Check error rate, response time, throughput
   - Look for anomalies (sudden spikes, drops)

3. **Analyze Logs**
   ```bash
   # Recent errors
   docker logs liyaqa-backend | grep ERROR | tail -50

   # Specific error pattern
   docker logs liyaqa-backend | grep "NullPointerException" | tail -20

   # Via Loki (in Grafana)
   # Query: {app="liyaqa-backend"} |= "ERROR"
   ```

4. **Check Database**
   ```bash
   # Database connectivity
   docker exec liyaqa-postgres pg_isready

   # Active connections
   docker exec liyaqa-postgres psql -U liyaqa -c \
     "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='liyaqa';"

   # Long-running queries
   docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
     "SELECT pid, now() - query_start AS duration, query
      FROM pg_stat_activity
      WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
      ORDER BY duration DESC LIMIT 5;"
   ```

5. **Check External Dependencies**
   - Payment gateway status
   - SMTP server availability
   - Third-party API status
   - DNS resolution

6. **Review Distributed Traces** (if available)
   - Open Zipkin: http://localhost:9411
   - Search for slow or failed requests
   - Identify bottlenecks in trace spans

#### Step 2.3: Mitigate

**Mitigation Options (choose based on situation):**

**Option A: Quick Fix / Workaround**
```bash
# Example: Increase resource limits
# Edit docker-compose.yml
# Restart service
docker compose up -d backend
```

**Option B: Rollback Recent Deployment**
```bash
# See DEPLOYMENT_GUIDE.md for rollback procedures

# Quick rollback via blue-green swap
ssh prod.liyaqa.com
/opt/liyaqa/deploy/switch-to-blue.sh

# Verify rollback
curl https://api.liyaqa.com/api/health
```

**Option C: Scale Resources**
```bash
# If resource exhaustion (CPU, memory, connections)

# Increase database connection pool
# Edit application.yml, restart

# Add more backend instances (if load balancer configured)
docker compose up -d --scale backend=3
```

**Option D: Enable Maintenance Mode**
```bash
# If mitigation will take time and service is broken anyway

# Update status page
# Display maintenance page to users
# Work on fix without user impact
```

**Option E: Isolate Affected Component**
```bash
# If specific feature is broken, disable it

# Use feature flag to disable
export BOOKING_ENABLED=false
docker compose restart backend

# Or redirect traffic away from broken service
```

#### Step 2.4: Monitor Mitigation

**After applying mitigation:**

1. **Verify Mitigation Effective**
   ```bash
   # Health check
   curl https://api.liyaqa.com/api/health

   # Check error rate (should decrease)
   # Prometheus query: rate(http_server_requests_total{status=~"5.."}[5m])
   ```

2. **Monitor Key Metrics** (for 5-10 minutes)
   - Error rate: Should drop to <1%
   - Response time: Should return to normal (<500ms p95)
   - Throughput: Should return to normal levels

3. **Watch for Side Effects**
   - New errors introduced?
   - Different service degraded?
   - Database load increased?

4. **User Reports**
   - Check support channels for reports
   - Test critical user flows manually

### Phase 3: Resolution & Recovery (varies)

#### Step 3.1: Implement Permanent Fix

**If mitigation was temporary (e.g., rollback):**

1. **Develop Code Fix**
   ```bash
   # Create hotfix branch
   git checkout -b hotfix/fix-api-errors

   # Implement fix
   # Add test to prevent regression

   # Push and create PR
   git push origin hotfix/fix-api-errors
   ```

2. **Test in Staging**
   - Deploy fix to staging
   - Run smoke tests
   - Perform manual testing
   - Run load tests if performance issue

3. **Deploy to Production**
   - Follow deployment guide
   - Monitor closely during deployment
   - Be ready to rollback if issues

4. **Verify Resolution**
   ```bash
   # Run smoke tests
   /opt/liyaqa/backend/scripts/smoke-test.sh https://api.liyaqa.com

   # Check metrics for 30 minutes
   # No errors, normal response times, stable throughput
   ```

#### Step 3.2: Restore Service

1. **Bring All Systems Online**
   - Disable maintenance mode (if enabled)
   - Re-enable feature flags (if disabled)
   - Restore normal traffic routing

2. **Verify Functionality**
   ```bash
   # Test critical user flows
   - Admin login
   - Member login
   - View member list
   - Create booking
   - Process payment
   - Check-in
   ```

3. **Monitor for Stability** (1-2 hours)
   - Watch error rate
   - Watch response times
   - Watch throughput
   - Review logs for new errors

4. **Clear Alerts**
   - Ensure all alerts auto-resolved
   - Manually resolve if needed
   - Check Alertmanager for silences

#### Step 3.3: Communicate Resolution

**Internal Communication:**
```
# In incident Slack channel

✅ INCIDENT RESOLVED - [Timestamp]

**Issue:** [Brief description]
**Root Cause:** [Brief explanation]
**Resolution:** [What we did]
**Impact:** [Duration, users affected, data loss if any]

**Timeline:**
- 14:00: Incident detected (alert fired)
- 14:15: Root cause identified (database connection pool exhausted)
- 14:20: Mitigation applied (increased pool size, restarted backend)
- 14:30: Service restored, monitoring
- 14:45: Confirmed stable, incident resolved

**Follow-up:**
- Post-incident review scheduled: [Date/Time]
- Action items to be created

Thank you to the response team: @backend-engineer @devops-engineer
```

**External Communication** (SEV-1/SEV-2):
```
# Status page update

✅ RESOLVED

The issue affecting [service/feature] has been resolved.

Root Cause: [Brief non-technical explanation]
Impact: The service was unavailable for approximately [X] minutes.

We apologize for the inconvenience. All services are now operating normally.

A full post-mortem will be published within 48 hours.
```

**Stakeholder Email** (SEV-1):
```
Subject: [RESOLVED] Production Incident - [Date]

Dear Team,

The production incident reported at [time] has been resolved.

Summary:
- Issue: [Description]
- Duration: [X] hours
- User Impact: [All users / X% of users]
- Root Cause: [Technical summary]
- Resolution: [What we did]

Follow-up Actions:
- Post-incident review: [Date/Time]
- Preventive measures: [Brief list]

Full post-mortem will be shared by [date].

Thank you for your patience.

[Incident Commander Name]
```

### Phase 4: Post-Incident Review (within 48 hours)

#### Step 4.1: Schedule Review Meeting

**Timing:** Within 48 hours of incident resolution

**Duration:** 1 hour

**Required Attendees:**
- Incident Commander
- All response team members
- Backend Lead (for technical incidents)
- DevOps Lead
- CTO (for SEV-1 incidents)

**Optional Attendees:**
- Frontend Lead (if frontend involved)
- Product Manager (for user-impacting incidents)
- Support Lead

**Agenda:** (send in advance)
1. Incident timeline (10 min)
2. What went well (10 min)
3. What could be improved (20 min)
4. Root cause analysis (10 min)
5. Action items (10 min)

#### Step 4.2: Review Meeting

**Ground Rules:**
- Blameless post-mortem
- Focus on process, not people
- Assume good intentions
- Learn and improve

**Discussion Points:**

1. **Timeline of Events**
   - Walk through incident doc timeline
   - Clarify any gaps or questions
   - Identify decision points

2. **What Went Well**
   - Quick detection (if true)
   - Effective communication (if true)
   - Fast mitigation (if true)
   - Good teamwork

3. **What Could Be Improved**
   - Detection delays?
   - Communication gaps?
   - Documentation missing?
   - Tools inadequate?
   - Unclear escalation?

4. **Root Cause Analysis**
   - What was the technical root cause?
   - What were the contributing factors?
   - What were the systemic issues?
   - Why did monitoring/alerting not catch it?

5. **Action Items**
   - What specific changes will prevent recurrence?
   - What monitoring/alerts should be added?
   - What documentation should be updated?
   - What technical debt should be addressed?

#### Step 4.3: Document Learnings

**Update Incident Document with:**

1. **Final Incident Report** (see template below)
2. **Action Items with Owners and Due Dates**
3. **Lessons Learned**
4. **Process Improvements**

**Publish Report:**
- Share in Slack (#liyaqa-incidents)
- Send to stakeholders (email)
- File in incident archive
- Update runbooks if needed

---

## 3. Communication Templates

### 3.1 Initial Incident Notification (SEV-1/2)

#### Slack Message (Internal)

```
🚨 INCIDENT DECLARED - SEV-[X]

**Incident ID:** INC-2026-01-31-001
**Title:** [Brief description]
**Severity:** SEV-[X]
**Impact:** [User-facing impact - e.g., "All users unable to login"]
**Status:** Investigating
**Incident Commander:** @[name]
**Incident Doc:** [Google Doc link]
**War Room:** [Zoom/Meet link]

Updates every [30 min for SEV-1 / 1 hour for SEV-2]

cc: @backend-lead @devops-lead @cto
```

#### Status Page Update (External)

```
🟡 Investigating

We are currently experiencing [issue description].

Impact: [Brief user-facing impact]
Status: Our team is investigating
Updates: We will provide updates every [30 min / 1 hour]
ETA: [If known, otherwise "Investigating"]

Last updated: [Timestamp]
```

#### Email to Stakeholders (SEV-1 only)

```
Subject: [SEV-1] Production Incident - [Brief Title]

A critical incident is in progress.

Incident: [Brief description]
Impact: [User impact]
Status: Investigating
ETA: [Unknown / Estimated time]

War room: [Link]
Updates: Every 30 minutes

Will send next update at [Time].

[Incident Commander Name]
```

### 3.2 Progress Update

#### Every 30 min (SEV-1) or 1 hour (SEV-2)

**Slack Update:**
```
UPDATE - [HH:MM] - [+XX minutes since start]

**Progress:**
✓ Root cause identified: [Brief description]
✓ Mitigation in progress: [What we're doing]

**Current Status:** [Investigating / Mitigating / Testing fix]

**Next Steps:**
1. [Specific next action]
2. [Backup plan if that fails]

**ETA:** [Updated estimate or "Still investigating"]

**Impact:** [Any change in user impact]
```

**Status Page Update:**
```
🟠 Identified

We have identified the issue affecting [service/feature].

Root Cause: [Brief non-technical explanation]
Status: [Implementing fix / Testing fix]
ETA: [Estimated time if known]

We apologize for the inconvenience and are working to resolve this as quickly as possible.

Last updated: [Timestamp]
Next update: [Timestamp]
```

### 3.3 Resolution Notification

**Slack Message:**
```
✅ INCIDENT RESOLVED - [Total Duration]

**Issue:** [Description]
**Root Cause:** [Brief technical explanation]
**Resolution:** [What we did to fix it]
**Impact:**
- Duration: [X hours Y minutes]
- Users affected: [All / XX% / Specific user group]
- Data loss: [None / Description if any]

**Timeline:**
- [HH:MM]: Incident detected
- [HH:MM]: Root cause identified
- [HH:MM]: Fix deployed
- [HH:MM]: Service restored
- [HH:MM]: Confirmed stable

**Follow-up:**
Post-incident review scheduled for [Date/Time]

**Thanks to:** @engineer1 @engineer2 @engineer3 for quick response!

Incident doc: [Link]
```

**Status Page:**
```
✅ RESOLVED

The issue affecting [service/feature] has been resolved.

Summary: [Brief description of issue and fix]
Duration: [Total downtime]
Impact: [Brief impact summary]

All services are now operating normally. We apologize for any inconvenience.

A detailed post-mortem will be published within 48 hours.

Resolved at: [Timestamp]
```

**Email to Stakeholders:**
```
Subject: [RESOLVED] Production Incident - [Brief Title]

The incident has been resolved.

Summary:
- Start time: [Timestamp]
- End time: [Timestamp]
- Duration: [X hours Y minutes]
- Root cause: [Brief explanation]
- Resolution: [What we did]
- User impact: [Description]
- Data loss: [None / Description]

Preventive Measures:
- [Action 1]
- [Action 2]

Post-Incident Review:
Scheduled for [Date/Time]. Full report will be shared by [Date].

Thank you for your patience and understanding.

[Incident Commander Name]
```

---

## 4. Escalation Procedures

### When to Escalate

#### Escalate to Backend Lead if:
- Incident unresolved after 1 hour
- Code-level changes needed
- Multiple services/components affected
- Database or architecture issue
- Need additional engineering resources

**How to Escalate:**
```
# In incident Slack channel
@backend-lead We need backend engineering support.

Issue: [Brief summary]
Current status: [What we've tried]
Need: [Specific help needed]
```

#### Escalate to CTO if:
- SEV-1 incident unresolved after 2 hours
- Potential data loss or corruption
- Security breach suspected
- Decision needed on extended outage vs risky fix
- Need to communicate with customers/partners

**How to Escalate:**
```
# Direct message or phone call
@cto Critical incident requires your attention.

Incident: [Brief summary]
Duration: [Time since start]
Impact: [User/business impact]
Status: [Current situation]
Decision needed: [What decision is required]

Incident doc: [Link]
War room: [Link]
```

#### Escalate to CEO if:
- Major security breach with data leak
- Legal implications (regulatory, compliance)
- Press involvement or public attention
- Customer threatening to leave over incident
- Requires business decision (not technical)

**How to Escalate:**
- CTO escalates to CEO (not IC directly)
- Phone call for immediate attention
- Include brief summary and business impact

### Escalation Contact Methods

**Preferred Order:**

1. **Slack** (Primary)
   - @mention person in incident channel
   - Direct message if urgent
   - Check if they're online/available

2. **Phone** (SEV-1 only if Slack unreachable)
   - Use on-call rotation phone number
   - Emergency contact list (secure location)
   - Leave voicemail if no answer

3. **Email** (Not for urgent issues)
   - Use for post-incident only
   - incidents@liyaqa.com
   - Not monitored 24/7

### Escalation Contacts

| Role | Slack | Escalation Level | Response Time |
|------|-------|------------------|---------------|
| **DevOps On-Call** | @devops-oncall | Level 1 (first responder) | 15 min |
| **Backend Lead** | @backend-lead | Level 2 (after 1 hour) | 30 min |
| **DevOps Lead** | @devops-lead | Level 2 (infrastructure) | 30 min |
| **CTO** | @cto | Level 3 (after 2 hours, SEV-1) | 1 hour |
| **CEO** | @ceo | Level 4 (security/legal/business) | As needed |

---

## 5. War Room Setup

### For SEV-1 Incidents (Required)

**Virtual War Room Components:**

1. **Slack Channel**
   ```
   # Create dedicated channel
   /incident create [Title]

   # Or manually
   Create channel: #incident-2026-01-31-[short-description]

   # Pin important info
   - Incident doc link
   - War room video link
   - Latest status
   ```

2. **Video Call**
   ```
   # Start Zoom or Google Meet
   # Post link in Slack channel
   "War room is live: [link]"

   # Keep call open for duration of incident
   # Team members can join/leave as needed
   ```

3. **Shared Incident Document**
   ```
   # Copy template
   Google Doc: "Incident Template"

   # Rename
   "Incident 2026-01-31: [Brief Title]"

   # Share with team (edit access)
   ```

### War Room Roles

#### Incident Commander (IC)
**Responsibilities:**
- Overall coordination
- Final decision authority
- Owns timeline
- Manages communication
- Declares incident resolved

**Best Practices:**
- Stay calm and focused
- Make clear decisions
- Delegate tasks
- Keep timeline updated
- Communicate regularly

#### Technical Lead (TL)
**Responsibilities:**
- Drives technical investigation
- Proposes solutions
- Implements fixes
- Technical decisions

**Best Practices:**
- Focus on mitigation first, root cause later
- Communicate findings clearly
- Ask for help when needed
- Document technical details

#### Scribe
**Responsibilities:**
- Documents timeline in incident doc
- Records decisions made
- Notes action items
- Captures important details

**Best Practices:**
- Timestamp every entry
- Record who said what
- Note decisions and rationale
- Keep running timeline

#### Communications Lead
**Responsibilities:**
- External communication
- Status page updates
- Stakeholder emails
- Social media (if applicable)

**Best Practices:**
- Use approved templates
- Clear, non-technical language
- Regular updates (stick to schedule)
- Coordinate with IC

### War Room Ground Rules

1. **Stay in War Room Until Resolved**
   - Core team stays on video call
   - Support team available on Slack
   - Breaks are OK (communicate)

2. **IC Has Final Authority**
   - IC makes final decisions
   - Discuss options, but IC decides
   - Respectful disagreement OK

3. **Use Threads for Side Discussions**
   - Main channel for important updates
   - Use threads for detailed technical discussions
   - Keeps main channel clean

4. **Document Everything**
   - Scribe captures timeline
   - TL documents technical findings
   - Decisions documented with rationale

5. **Focus on Mitigation First**
   - Stop the bleeding first
   - Deep root cause analysis later
   - Temporary fixes are OK

6. **Regular Status Updates**
   - IC provides update every 30 min (SEV-1) or 1 hour (SEV-2)
   - Even if "no progress" - say so
   - Use templates for consistency

---

## 6. Post-Incident Review Template

**Document Title:** Incident [ID] - [Date] - Post-Incident Review

### 1. Incident Summary

| Field | Value |
|-------|-------|
| **Incident ID** | INC-2026-01-31-001 |
| **Date** | 2026-01-31 |
| **Start Time** | 14:00 KSA |
| **End Time** | 16:45 KSA |
| **Duration** | 2 hours 45 minutes |
| **Severity** | SEV-1 |
| **Impact** | All users unable to access application |
| **Incident Commander** | [Name] |
| **Response Team** | [Names] |

**Brief Description:**
[1-2 sentences describing the incident]

**Root Cause:**
[1-2 sentences describing the root cause]

### 2. Timeline

| Time (KSA) | Event | Action Taken | Owner |
|------------|-------|--------------|-------|
| 14:00 | Alert fired: HighErrorRate | Investigation started | DevOps |
| 14:05 | Service health check failing | Checked logs, saw database errors | DevOps |
| 14:10 | Identified: Database connection pool exhausted | Declared SEV-1 incident | DevOps IC |
| 14:15 | War room assembled | Technical investigation | Backend |
| 14:20 | Root cause confirmed: Recent migration locked table | Decided to kill long-running query | Backend |
| 14:25 | Killed blocking query | Database connections freed | DevOps |
| 14:30 | Service health restored | Monitoring for stability | All |
| 14:45 | Metrics normal for 15 minutes | Declared incident resolved | IC |
| ... | ... | ... | ... |

### 3. User Impact

**Affected Users:**
- All users (100%)
- Approximately [X] active users at time of incident

**Impact:**
- Unable to login to application
- Unable to access any features
- Booking confirmations delayed

**Data Loss:**
- None

**Revenue Impact:**
- Estimated [X] transactions lost
- Estimated revenue impact: [Amount]

**Customer Communication:**
- Status page updated at 14:10, 14:40, 15:10, 15:45
- Email sent to users at 15:00 and 17:00 (resolution)
- [X] support tickets received

### 4. What Went Well

**Detection:**
- ✅ Alert fired immediately (within 1 minute of issue)
- ✅ On-call engineer responded within 5 minutes
- ✅ Clear alert message helped quick triage

**Response:**
- ✅ Incident declared quickly (10 minutes)
- ✅ War room assembled efficiently
- ✅ Good communication in Slack channel
- ✅ Team worked well together

**Mitigation:**
- ✅ Root cause identified quickly (15 minutes)
- ✅ Effective mitigation (kill blocking query)
- ✅ Service restored within SLA (< 4 hours)

**Communication:**
- ✅ Status page updated regularly
- ✅ Clear stakeholder communication
- ✅ Templates worked well

### 5. What Could Be Improved

**Detection:**
- ❌ No alert for long-running database queries
- ❌ Migration monitoring insufficient
- ❌ Could have detected earlier with better metrics

**Response:**
- ❌ Took 10 minutes to declare incident (should be immediate for SEV-1)
- ❌ War room setup took 5 minutes (should have template)
- ❌ Unclear who should be scribe initially

**Mitigation:**
- ❌ No documented procedure for killing long-running queries
- ❌ Database access initially unclear (who has access)
- ❌ Could have rolled back migration faster

**Communication:**
- ❌ First status update delayed (should be at T+10 min)
- ❌ Stakeholder list not readily available
- ❌ No pre-written templates for this scenario

**Prevention:**
- ❌ Migration should have had timeout
- ❌ Migration testing in staging insufficient
- ❌ No circuit breaker for database operations

### 6. Root Cause Analysis

**Immediate Cause:**
[What directly caused the incident]

Example: Database migration V105 acquired an exclusive lock on the `members` table and held it for 15+ minutes due to a full table scan.

**Contributing Factors:**
[What made the problem worse or allowed it to happen]

Example:
1. Migration did not use `CONCURRENTLY` for index creation
2. No timeout configured for migrations
3. Migration not tested with production data volume
4. No alerting for long-running database queries

**Root Cause:**
[Underlying systemic issue]

Example: Insufficient migration testing process. Migrations are tested in staging with small datasets (1000 rows) but production has 500K+ rows, causing performance characteristics to differ significantly.

**Why Did Monitoring Not Catch It:**
[Why alerts didn't fire earlier]

Example: No alerting configured for long-running database queries or table locks. Only had alerting on application error rate, which fired after connection pool exhausted.

### 7. Action Items

| # | Action | Owner | Due Date | Priority | Status |
|---|--------|-------|----------|----------|--------|
| 1 | Add alert for queries running >5 minutes | DevOps | 2026-02-05 | High | Open |
| 2 | Add alert for database table locks | DevOps | 2026-02-05 | High | Open |
| 3 | Document procedure for killing queries | DBA | 2026-02-07 | High | Open |
| 4 | Update migration testing to use production-sized dataset | Backend | 2026-02-10 | High | Open |
| 5 | Add migration timeout (30 minutes max) | Backend | 2026-02-07 | High | Open |
| 6 | Review all pending migrations for similar issues | Backend | 2026-02-10 | Medium | Open |
| 7 | Update incident templates to include scribe role | DevOps | 2026-02-05 | Medium | Open |
| 8 | Create migration checklist (includes CONCURRENTLY) | Backend | 2026-02-07 | Medium | Open |
| 9 | Add circuit breaker for database operations | Backend | 2026-02-28 | Low | Open |
| 10 | Document database access procedures | DevOps | 2026-02-07 | Low | Open |

### 8. Prevention

**What Changes Will Prevent Recurrence:**
1. All migrations must be tested with production-sized datasets
2. All index creations must use `CONCURRENTLY`
3. All migrations must have explicit timeouts
4. Alert on long-running queries and table locks

**What Monitoring/Alerts Should Be Added:**
1. Alert: Database query duration >5 minutes
2. Alert: Table lock held >2 minutes
3. Dashboard: Database lock monitoring

**What Documentation Should Be Updated:**
1. Migration development guide
2. Database operations runbook
3. Incident response templates

**What Technical Debt Should Be Addressed:**
1. Implement database connection circuit breaker
2. Add migration validation in CI (check for CONCURRENTLY)
3. Improve staging environment to better match production

### 9. Lessons Learned

**Technical Lessons:**
- Always use `CONCURRENTLY` for index creation on large tables
- Test migrations with production-sized data
- Monitor database locks and long-running queries

**Process Lessons:**
- Declare incidents immediately (don't wait)
- Have clear roles (IC, TL, Scribe, Comms Lead)
- Templates speed up communication

**Cultural Lessons:**
- Team responded quickly and professionally
- Good collaboration across teams
- Blameless culture enabled open discussion

### 10. Follow-Up

**Post-Mortem Published:** [Date]
**Shared With:** Engineering team, leadership, stakeholders
**Action Items Tracked In:** Jira/GitHub Issues
**Next Review:** [Date] (verify action items complete)

---

**Document Owner:** [Incident Commander Name]
**Last Updated:** [Date]

---

## 7. Incident Metrics

### Metrics to Track

**MTTD (Mean Time to Detect):**
- Time from incident start to alert/detection
- **Goal:** <5 minutes
- **Measured:** Alert timestamp - actual incident start time

**MTTA (Mean Time to Acknowledge):**
- Time from detection to response started
- **Goal:** <15 minutes (SEV-1), <1 hour (SEV-2)
- **Measured:** Response start - alert timestamp

**MTTM (Mean Time to Mitigate):**
- Time from response start to mitigation applied
- **Goal:** <1 hour (SEV-1), <4 hours (SEV-2)
- **Measured:** Mitigation time - response start

**MTTR (Mean Time to Resolve):**
- Total time from detection to resolution
- **Goal:** <4 hours (SEV-1), <8 hours (SEV-2)
- **Measured:** Resolution time - detection time

### Monthly Review

**Track and Review:**
- Total incidents by severity (SEV-1, SEV-2, SEV-3, SEV-4)
- Average MTTR by severity
- Repeat incidents (same root cause)
- Action item completion rate
- Top 3 incident causes

**Example Monthly Report:**

| Metric | This Month | Last Month | Target |
|--------|------------|------------|--------|
| **Total Incidents** | 12 | 15 | <10 |
| SEV-1 | 1 | 2 | 0 |
| SEV-2 | 3 | 5 | <2 |
| SEV-3 | 6 | 6 | <5 |
| SEV-4 | 2 | 2 | N/A |
| **Avg MTTR (SEV-1)** | 2.5h | 3h | <4h |
| **Avg MTTR (SEV-2)** | 4h | 6h | <8h |
| **Repeat Incidents** | 1 | 2 | 0 |
| **Action Items Completed** | 85% | 75% | >90% |

**Top Incident Causes:**
1. Database performance (3 incidents)
2. External API timeouts (2 incidents)
3. Deployment issues (2 incidents)

**Trends:**
- ✅ Improvement: Incident count down 20%
- ✅ Improvement: MTTR improving
- ❌ Concern: Database incidents increasing
- ⚠️ Watch: Action item completion below target

**Recommendations:**
1. Focus on database performance optimization
2. Improve external API monitoring
3. Enhance deployment validation

---

## 8. Tools & Resources

### Incident Management Tools

| Tool | Purpose | URL |
|------|---------|-----|
| **Slack** | Primary communication | https://liyaqa.slack.com |
| **Google Docs** | Incident documentation | [Template link] |
| **GitHub Issues** | Action item tracking | https://github.com/your-org/liyaqa/issues |
| **PagerDuty** | On-call rotation, paging | [If configured] |

### Monitoring & Debugging

| Tool | Purpose | URL |
|------|---------|-----|
| **Grafana** | Metrics dashboards | http://localhost:3001 |
| **Prometheus** | Metrics queries | http://localhost:9090 |
| **Loki** | Log aggregation | http://localhost:3100 |
| **Zipkin** | Distributed tracing | http://localhost:9411 |
| **Alertmanager** | Alert management | http://localhost:9093 |

### Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| **Production Runbook** | Operational procedures | `/docs/PRODUCTION_RUNBOOK.md` |
| **Deployment Guide** | Deployment procedures | `/docs/DEPLOYMENT_GUIDE.md` |
| **Architecture Docs** | System architecture | `/docs/ARCHITECTURE.md` |
| **API Reference** | API documentation | `/docs/API_REFERENCE.md` |

### Contact Information

**Primary Contacts:**
- On-call DevOps: @devops-oncall (Slack)
- Backend Lead: @backend-lead (Slack)
- DevOps Lead: @devops-lead (Slack)
- CTO: @cto (Slack, Phone for SEV-1)

**Channels:**
- #liyaqa-alerts - Automated alerts
- #liyaqa-critical - SEV-1 incidents only
- #liyaqa-incidents - Incident discussions
- #incident-[date]-[topic] - Dedicated incident channels

---

**Last Updated:** 2026-01-31
**Maintained By:** DevOps Team
**Review Frequency:** Quarterly
**Next Review:** 2026-04-30

**Document Version:** 1.0

---

**Appendix A: Incident Checklist**

### SEV-1 Incident Checklist

**Detection & Triage (0-15 min):**
- [ ] Verify incident is real
- [ ] Determine severity (SEV-1)
- [ ] Identify affected components
- [ ] Estimate user impact

**Declare Incident:**
- [ ] Create Slack incident channel
- [ ] Assign Incident Commander
- [ ] Create incident document
- [ ] Update status page
- [ ] Notify stakeholders

**Assemble Team:**
- [ ] Page on-call engineer
- [ ] Request backend support
- [ ] Request DevOps support
- [ ] Start war room (video call)
- [ ] Assign roles (IC, TL, Scribe, Comms)

**Investigate:**
- [ ] Check recent deployments
- [ ] Review monitoring dashboards
- [ ] Analyze logs
- [ ] Check database
- [ ] Check external dependencies

**Mitigate:**
- [ ] Apply quick fix OR
- [ ] Rollback deployment OR
- [ ] Scale resources OR
- [ ] Enable maintenance mode
- [ ] Monitor mitigation effectiveness

**Communicate (Every 30 min):**
- [ ] Update status page
- [ ] Update Slack
- [ ] Email stakeholders (if extended)

**Resolve:**
- [ ] Implement permanent fix
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Verify resolution
- [ ] Monitor for 1 hour

**Close:**
- [ ] Update status page (resolved)
- [ ] Send resolution notification
- [ ] Thank response team
- [ ] Schedule post-incident review

**Post-Mortem (Within 48h):**
- [ ] Complete incident document
- [ ] Conduct review meeting
- [ ] Create action items
- [ ] Publish report
- [ ] Update documentation

---

**Change Log:**

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-31 | 1.0 | Initial incident response guide | DevOps Team |
