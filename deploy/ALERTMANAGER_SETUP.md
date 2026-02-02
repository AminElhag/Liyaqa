# Alertmanager Setup Guide

This guide walks you through setting up Alertmanager with Slack, email, and PagerDuty integrations for the Liyaqa platform.

## Prerequisites

- Docker and Docker Compose installed
- Slack workspace with admin access
- Email server (SMTP) credentials
- (Optional) PagerDuty account for critical alerts

## Step 1: Create Slack Webhooks

### 1.1 Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App"
3. Choose "From scratch"
4. App Name: "Liyaqa Alerts"
5. Select your workspace
6. Click "Create App"

### 1.2 Enable Incoming Webhooks

1. In your app settings, click "Incoming Webhooks"
2. Toggle "Activate Incoming Webhooks" to ON
3. Click "Add New Webhook to Workspace"
4. Select channel: `#liyaqa-alerts` (general alerts)
5. Click "Allow"
6. Copy the Webhook URL (starts with `https://hooks.slack.com/services/...`)
7. Repeat steps 3-6 for `#liyaqa-critical` channel

### 1.3 Create Additional Channels

Create these Slack channels:
- `#liyaqa-alerts` - General alerts (warnings)
- `#liyaqa-critical` - Critical alerts requiring immediate action
- `#liyaqa-business-alerts` - Business metric alerts
- `#liyaqa-database` - Database-specific alerts
- `#liyaqa-infrastructure` - Infrastructure alerts
- `#liyaqa-security` - Security alerts

### 1.4 Configure Channel Webhooks

For each channel, create a webhook:
1. Go to your Slack app settings
2. Click "Incoming Webhooks"
3. Click "Add New Webhook to Workspace"
4. Select the channel
5. Copy the webhook URL

## Step 2: Configure Email (SMTP)

### Option A: SendGrid

1. Create SendGrid account: https://signup.sendgrid.com/
2. Create API Key:
   - Settings > API Keys > Create API Key
   - Name: "Liyaqa Alertmanager"
   - Permissions: "Mail Send" (Full Access)
   - Copy the API key

3. SMTP Settings:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: <your-api-key>
   ```

### Option B: Gmail

1. Enable 2-factor authentication on your Google account
2. Create App Password:
   - Google Account > Security > 2-Step Verification > App passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Liyaqa Alertmanager"
   - Copy the 16-character password

3. SMTP Settings:
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: <app-password>
   ```

### Option C: AWS SES

1. Verify your domain in AWS SES
2. Create SMTP credentials in SES console
3. SMTP Settings:
   ```
   Host: email-smtp.<region>.amazonaws.com
   Port: 587
   Username: <smtp-username>
   Password: <smtp-password>
   ```

## Step 3: Configure PagerDuty (Optional)

### 3.1 Create PagerDuty Service

1. Go to https://app.pagerduty.com
2. Services > Service Directory > + New Service
3. Name: "Liyaqa Critical Alerts"
4. Escalation Policy: Select or create one
5. Integrations: "Events API V2"
6. Click "Create Service"

### 3.2 Get Integration Key

1. Open your new service
2. Go to "Integrations" tab
3. Copy the "Integration Key"

## Step 4: Create Environment File

Create `/deploy/.env.alerting`:

```bash
# ===========================================
# Slack Configuration
# ===========================================
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CRITICAL_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/CRITICAL/WEBHOOK

# ===========================================
# Email Configuration (SendGrid example)
# ===========================================
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key-here
SMTP_FROM=alerts@liyaqa.com

# ===========================================
# PagerDuty Configuration (Optional)
# ===========================================
PAGERDUTY_SERVICE_KEY=your-pagerduty-integration-key-here

# ===========================================
# Environment
# ===========================================
ENVIRONMENT=production
```

**Security Note:** Never commit this file to git! Add to `.gitignore`:

```bash
echo "/deploy/.env.alerting" >> .gitignore
```

## Step 5: Update Docker Compose

The `docker-compose.monitoring.yml` already includes Alertmanager configuration. Ensure the environment file is loaded:

```yaml
alertmanager:
  image: prom/alertmanager:v0.26.0
  env_file:
    - .env.alerting  # Load environment variables
  volumes:
    - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
  ports:
    - "9093:9093"
```

## Step 6: Deploy Alertmanager

```bash
cd deploy

# Load environment variables
export $(cat .env.alerting | xargs)

# Start Alertmanager
docker-compose -f docker-compose.monitoring.yml up -d alertmanager

# Check logs
docker logs liyaqa-alertmanager

# Verify it's running
curl http://localhost:9093/-/healthy
```

## Step 7: Test Alerts

### 7.1 Send Test Alert

```bash
# Send test alert to Alertmanager
curl -X POST http://localhost:9093/api/v1/alerts -d '[
  {
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning",
      "instance": "test-instance",
      "category": "application",
      "team": "backend"
    },
    "annotations": {
      "summary": "This is a test alert",
      "description": "Testing Alertmanager configuration"
    }
  }
]'
```

### 7.2 Verify Notifications

Check:
1. **Slack:** Message should appear in `#liyaqa-alerts`
2. **Email:** Should receive email at configured address
3. **Alertmanager UI:** http://localhost:9093 - alert should be visible

### 7.3 Test Critical Alert

```bash
curl -X POST http://localhost:9093/api/v1/alerts -d '[
  {
    "labels": {
      "alertname": "TestCriticalAlert",
      "severity": "critical",
      "instance": "test-instance",
      "category": "application",
      "team": "devops"
    },
    "annotations": {
      "summary": "This is a CRITICAL test alert",
      "description": "Testing critical alert routing",
      "runbook": "https://docs.liyaqa.com/runbooks/test"
    }
  }
]'
```

Check:
1. **Slack:** Message in `#liyaqa-critical` with @channel mention
2. **Email:** Email to team-leads@liyaqa.com and oncall@liyaqa.com
3. **PagerDuty:** Incident created (if configured)

## Step 8: Configure Alert Routing

Customize routing in `alertmanager.yml`:

```yaml
route:
  routes:
    # Add custom route for your team
    - match:
        team: frontend
      receiver: 'frontend-team'

    # Route specific alert to specific channel
    - match:
        alertname: DeploymentFailed
      receiver: 'deployment-alerts'
```

Add corresponding receivers:

```yaml
receivers:
  - name: 'frontend-team'
    slack_configs:
      - channel: '#frontend-alerts'
        ...
```

## Step 9: Set Up Silences

Silence alerts during maintenance:

```bash
# Install amtool (Alertmanager CLI)
go install github.com/prometheus/alertmanager/cmd/amtool@latest

# Configure amtool
cat > ~/.amtool.yml <<EOF
alertmanager.url: http://localhost:9093
EOF

# Create silence for 2 hours
amtool silence add \
  alertname=HighErrorRate \
  instance=backend-prod \
  --duration=2h \
  --author="DevOps Team" \
  --comment="Planned deployment"

# List active silences
amtool silence query

# Expire a silence
amtool silence expire <silence-id>
```

## Step 10: Create Custom Templates (Optional)

Create `/deploy/alertmanager-templates/slack.tmpl`:

```
{{ define "slack.title" }}
[{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}] {{ .GroupLabels.alertname }}
{{ end }}

{{ define "slack.text" }}
{{ range .Alerts }}
*Alert:* {{ .Labels.alertname }}
*Severity:* {{ .Labels.severity }}
*Instance:* {{ .Labels.instance }}
*Description:* {{ .Annotations.description }}
{{ if .Annotations.runbook }}
*Runbook:* {{ .Annotations.runbook }}
{{ end }}
{{ end }}
{{ end }}
```

Mount in Docker Compose:

```yaml
alertmanager:
  volumes:
    - ./alertmanager-templates:/etc/alertmanager/templates:ro
```

## Troubleshooting

### Alerts Not Reaching Slack

1. **Check Alertmanager logs:**
   ```bash
   docker logs liyaqa-alertmanager | grep -i slack
   ```

2. **Verify webhook URL:**
   ```bash
   # Test webhook directly
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"Test message"}' \
     $SLACK_WEBHOOK_URL
   ```

3. **Check Alertmanager UI:**
   - Go to http://localhost:9093
   - Click "Status" to see configuration
   - Check for errors

### Emails Not Sending

1. **Test SMTP connection:**
   ```bash
   telnet $SMTP_HOST $SMTP_PORT
   ```

2. **Check credentials:**
   - Verify username and password
   - Check for typos in environment variables

3. **Review logs:**
   ```bash
   docker logs liyaqa-alertmanager | grep -i smtp
   ```

### PagerDuty Not Working

1. **Verify integration key:**
   ```bash
   # Test PagerDuty Events API
   curl -X POST https://events.pagerduty.com/v2/enqueue \
     -H 'Content-Type: application/json' \
     -d '{
       "routing_key": "'"$PAGERDUTY_SERVICE_KEY"'",
       "event_action": "trigger",
       "payload": {
         "summary": "Test alert from Alertmanager",
         "severity": "critical",
         "source": "alertmanager"
       }
     }'
   ```

2. **Check service status:**
   - Go to PagerDuty service
   - Check "Integrations" tab
   - Verify integration key is correct

### Alerts Not Grouping Correctly

1. **Check group_by labels:**
   ```yaml
   route:
     group_by: ['alertname', 'severity']
   ```

2. **Adjust group_wait and group_interval:**
   ```yaml
   route:
     group_wait: 30s      # Wait before sending first alert
     group_interval: 5m   # Wait before sending updates
   ```

## Monitoring Alertmanager

### Health Check

```bash
# Health endpoint
curl http://localhost:9093/-/healthy

# Readiness endpoint
curl http://localhost:9093/-/ready
```

### Metrics

Alertmanager exposes Prometheus metrics:

```bash
curl http://localhost:9093/metrics
```

Key metrics:
- `alertmanager_notifications_total` - Total notifications sent
- `alertmanager_notifications_failed_total` - Failed notifications
- `alertmanager_alerts` - Active alerts
- `alertmanager_silences` - Active silences

### Grafana Dashboard

Import Alertmanager dashboard:
1. Go to Grafana: http://localhost:3001
2. Dashboards > Import
3. Dashboard ID: `9578` (Alertmanager dashboard)
4. Select Prometheus datasource
5. Click "Import"

## Best Practices

### 1. Alert Naming

Use clear, descriptive names:
- ✅ `HighErrorRate`
- ✅ `DatabaseConnectionPoolExhausted`
- ❌ `Error1`
- ❌ `Alert`

### 2. Severity Levels

Use only two levels:
- `critical` - Requires immediate action
- `warning` - Requires attention but not urgent

### 3. Alert Descriptions

Include:
- What's wrong
- Impact on users
- Link to runbook
- Link to dashboard

### 4. Routing Rules

- Route critical alerts to on-call
- Group related alerts
- Don't spam individual channels

### 5. Notification Frequency

- Critical: Every 30 minutes
- Warning: Every 4 hours
- Business: Every 6 hours

### 6. Silences

- Always add a comment
- Use specific matchers (avoid silencing all alerts)
- Set appropriate duration
- Document in ticket system

## Maintenance

### Weekly

- [ ] Review fired alerts
- [ ] Check for noisy alerts
- [ ] Update runbooks for recurring issues

### Monthly

- [ ] Review alert thresholds
- [ ] Update contact information
- [ ] Test notification channels
- [ ] Review and clean up silences

### Quarterly

- [ ] Conduct alert fire drill
- [ ] Review and update routing rules
- [ ] Audit notification channels
- [ ] Update documentation

## Resources

- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [PagerDuty Integration](https://www.pagerduty.com/docs/guides/prometheus-integration-guide/)
- [Alert Routing Tree Visualization](https://prometheus.io/webtools/alerting/routing-tree-editor/)

---

**Last Updated:** 2026-01-31
**Maintainer:** DevOps Team
