# Prometheus Alerting Guide

This guide covers the alerting rules configured for the Liyaqa platform.

## Overview

We have **50+ alert rules** organized into **9 categories**:

1. **Application Alerts** - API errors, performance, availability
2. **JVM Alerts** - Memory, garbage collection
3. **Database Alerts** - Connection pools, query performance
4. **Business Alerts** - Bookings, payments, check-ins
5. **Infrastructure Alerts** - CPU, memory, disk
6. **SSL Alerts** - Certificate expiration
7. **Logging Alerts** - Error log rates
8. **Dependency Alerts** - Email, SMS, payment gateway

## Alert Severity Levels

### Critical (Requires Immediate Action)
- **Severity:** `critical`
- **Response Time:** 5-15 minutes
- **Notification:** PagerDuty + Slack #liyaqa-critical
- **On-call:** Yes

Examples:
- Service down
- High error rate (>5%)
- Database connection pool exhausted
- Payment failures
- Instance down

### Warning (Requires Attention)
- **Severity:** `warning`
- **Response Time:** 30-60 minutes
- **Notification:** Slack #liyaqa-alerts
- **On-call:** No (escalate if not resolved)

Examples:
- Moderate error rate (>1%)
- High memory usage (>75%)
- Slow API responses
- High cancellation rate

## Alert Categories

### 1. Application Alerts

#### HighErrorRate
- **Threshold:** >5% error rate
- **Duration:** 5 minutes
- **Severity:** Critical
- **Action:**
  1. Check application logs for stack traces
  2. Review recent deployments
  3. Check database connectivity
  4. Review external service status

#### SlowAPIResponseTime
- **Threshold:** p95 >2 seconds
- **Duration:** 5 minutes
- **Severity:** Warning
- **Action:**
  1. Check database query performance
  2. Review application logs for slow operations
  3. Check external API response times
  4. Consider scaling if high traffic

#### ServiceDown
- **Threshold:** Service unreachable
- **Duration:** 1 minute
- **Severity:** Critical
- **Action:**
  1. Check container status: `docker ps`
  2. Check service logs: `docker logs liyaqa-backend`
  3. Restart service if crashed
  4. Check health endpoint
  5. Page on-call if auto-recovery fails

### 2. JVM Alerts

#### HighHeapMemoryUsage
- **Threshold:** >90% heap used
- **Duration:** 5 minutes
- **Severity:** Critical
- **Action:**
  1. Check for memory leaks
  2. Analyze heap dump: `jmap -dump:live,format=b,file=heap.bin <pid>`
  3. Review recent code changes
  4. Consider increasing heap size
  5. Restart if OOM imminent

#### FrequentGarbageCollection
- **Threshold:** >10 GC/second
- **Duration:** 5 minutes
- **Severity:** Warning
- **Action:**
  1. Monitor GC logs
  2. Check for memory pressure
  3. Review object creation patterns
  4. Consider heap tuning

### 3. Database Alerts

#### DatabaseConnectionPoolCritical
- **Threshold:** >95% connections in use
- **Duration:** 1 minute
- **Severity:** Critical
- **Action:**
  1. Check active connections: `SELECT * FROM pg_stat_activity;`
  2. Kill long-running queries if necessary
  3. Review connection leak issues
  4. Consider increasing pool size
  5. Check for slow queries

#### SlowDatabaseQueries
- **Threshold:** p95 >1 second
- **Duration:** 5 minutes
- **Severity:** Warning
- **Action:**
  1. Check pg_stat_statements for slow queries
  2. Review recent migrations
  3. Check for missing indexes
  4. Analyze query plans: `EXPLAIN ANALYZE`

#### PostgreSQLDown
- **Threshold:** Database unreachable
- **Duration:** 1 minute
- **Severity:** Critical
- **Action:**
  1. Check PostgreSQL status: `docker ps | grep postgres`
  2. Check disk space on database volume
  3. Review PostgreSQL logs
  4. Restore from backup if corrupted
  5. Page DBA immediately

### 4. Business Alerts

#### HighPaymentFailureRate
- **Threshold:** >10% payment failures
- **Duration:** 10 minutes
- **Severity:** Critical
- **Action:**
  1. Check payment gateway status
  2. Review payment gateway logs
  3. Test payment flow manually
  4. Contact payment provider if widespread
  5. Notify business stakeholders

#### NoRecentBookings
- **Threshold:** 0 bookings in 1 hour (business hours)
- **Duration:** 1 hour
- **Severity:** Warning
- **Action:**
  1. Check if booking system is functional
  2. Test booking flow
  3. Review recent code changes
  4. Check for UI/UX issues
  5. Notify product team

#### HighBookingCancellationRate
- **Threshold:** >20% cancellation rate
- **Duration:** 30 minutes
- **Severity:** Warning
- **Action:**
  1. Review cancellation reasons (if tracked)
  2. Check for class quality issues
  3. Notify operations team
  4. Consider investigating specific classes/trainers

### 5. Infrastructure Alerts

#### CriticalCPUUsage
- **Threshold:** >95% CPU usage
- **Duration:** 3 minutes
- **Severity:** Critical
- **Action:**
  1. Identify CPU-intensive processes: `top`
  2. Check for runaway processes
  3. Review application performance
  4. Scale horizontally if sustained load
  5. Consider vertical scaling

#### CriticalDiskUsage
- **Threshold:** <10% free space
- **Duration:** 2 minutes
- **Severity:** Critical
- **Action:**
  1. Clean up old logs: `find /var/log -type f -mtime +7 -delete`
  2. Clean Docker images: `docker system prune -a`
  3. Archive old database backups
  4. Expand disk if necessary
  5. Set up automated cleanup

#### InstanceDown
- **Threshold:** Instance unreachable
- **Duration:** 1 minute
- **Severity:** Critical
- **Action:**
  1. Check instance status in cloud console
  2. Attempt to restart instance
  3. Check network connectivity
  4. Review system logs
  5. Escalate to infrastructure team

### 6. SSL Alerts

#### SSLCertificateExpiringVerySoon
- **Threshold:** <7 days until expiry
- **Duration:** 1 hour
- **Severity:** Critical
- **Action:**
  1. Renew SSL certificate immediately
  2. Update certificate in load balancer/CDN
  3. Test HTTPS connectivity
  4. Document renewal process
  5. Set up auto-renewal if not already

### 7. Logging Alerts

#### CriticalLogErrorRate
- **Threshold:** >10 errors/second
- **Duration:** 2 minutes
- **Severity:** Critical
- **Action:**
  1. Check application logs for error patterns
  2. Identify root cause
  3. Deploy fix if critical bug
  4. Increase log retention if investigating
  5. Notify development team

### 8. Dependency Alerts

#### EmailServiceDown
- **Threshold:** >50% email failures
- **Duration:** 5 minutes
- **Severity:** Critical
- **Action:**
  1. Check SMTP server status
  2. Verify credentials and configuration
  3. Test email sending manually
  4. Switch to backup provider if available
  5. Notify users if prolonged outage

#### PaymentGatewayErrors
- **Threshold:** >0.1 errors/second
- **Duration:** 3 minutes
- **Severity:** Critical
- **Action:**
  1. Check payment gateway status page
  2. Review error messages
  3. Test payment flow
  4. Contact gateway support
  5. Notify business team

## Alert Routing

Alerts are routed based on severity and team:

```yaml
# Critical alerts
severity: critical
→ Slack: #liyaqa-critical
→ PagerDuty: On-call engineer
→ Email: team-leads@liyaqa.com

# Warning alerts
severity: warning
→ Slack: #liyaqa-alerts
→ Email: engineering@liyaqa.com (grouped)

# Business alerts
category: business
→ Slack: #liyaqa-business-alerts
→ Email: product@liyaqa.com
```

## Testing Alerts

### Validate Alert Rules

```bash
# Check alert rules syntax
promtool check rules deploy/prometheus/alerts.yml

# Test specific alert query
promtool query instant http://localhost:9090 \
  'rate(http_server_requests_seconds_count{status=~"5.."}[5m]) / rate(http_server_requests_seconds_count[5m])'
```

### Trigger Test Alerts

```bash
# Trigger high error rate alert (development only!)
curl -X POST http://localhost:8080/actuator/test/generate-errors

# Trigger memory alert
curl -X POST http://localhost:8080/actuator/test/consume-memory

# Trigger slow API alert
curl -X POST http://localhost:8080/actuator/test/slow-endpoint
```

### Silence Alerts

```bash
# Silence specific alert during maintenance
amtool silence add alertname=HighErrorRate \
  --duration=2h \
  --comment="Maintenance window"

# View active silences
amtool silence query

# Expire a silence
amtool silence expire <silence-id>
```

## Alert Metrics

Track alert health:

```promql
# Alert firing frequency
rate(prometheus_notifications_sent_total[1h])

# Alert duration
histogram_quantile(0.95, prometheus_alert_duration_seconds_bucket)

# Alerts by severity
sum by (severity) (ALERTS{alertstate="firing"})
```

## Runbook Links

Each critical alert includes a runbook link:

- **High Error Rate:** https://docs.liyaqa.com/runbooks/high-error-rate
- **Service Down:** https://docs.liyaqa.com/runbooks/service-down
- **High Memory:** https://docs.liyaqa.com/runbooks/high-memory
- **DB Connection Pool:** https://docs.liyaqa.com/runbooks/db-connection-pool
- **Payment Failures:** https://docs.liyaqa.com/runbooks/payment-failures
- **SSL Renewal:** https://docs.liyaqa.com/runbooks/ssl-renewal

## Best Practices

### 1. Alert Tuning
- Review alert thresholds monthly
- Adjust based on actual traffic patterns
- Remove noisy alerts that don't require action
- Add new alerts for new features

### 2. Alert Fatigue Prevention
- Keep false positive rate <5%
- Use appropriate durations (don't alert on transient spikes)
- Group related alerts
- Use inhibition rules to suppress redundant alerts

### 3. On-call Best Practices
- Document all incidents and resolutions
- Update runbooks after each incident
- Conduct post-mortems for critical incidents
- Rotate on-call duty fairly

### 4. Alert Response
- Acknowledge within 5 minutes
- Provide status updates every 30 minutes
- Document actions taken
- Create follow-up tasks for root cause fixes

## Grafana Dashboards

View alert status in Grafana:

- **Alert Overview:** http://localhost:3001/d/alerts-overview
- **Alert History:** http://localhost:3001/d/alerts-history
- **Alert Response Times:** http://localhost:3001/d/alerts-sla

## Maintenance

### Adding New Alerts

1. Define alert in `alerts.yml`
2. Validate syntax: `promtool check rules alerts.yml`
3. Test in staging environment
4. Document in this guide
5. Create runbook if critical
6. Deploy to production
7. Monitor for false positives

### Updating Thresholds

1. Analyze historical data
2. Determine new threshold
3. Update `alerts.yml`
4. Test in staging
5. Document change
6. Deploy to production

### Removing Alerts

1. Silence alert for 1 week
2. Monitor impact
3. If no issues, remove from `alerts.yml`
4. Update documentation
5. Deploy to production

## Troubleshooting

### Alert Not Firing

1. Check PromQL query: `promtool query instant ...`
2. Verify metric exists: `curl http://localhost:9090/api/v1/query?query=<metric>`
3. Check alert evaluation: Prometheus > Alerts
4. Review duration and threshold
5. Check Alertmanager configuration

### Alert Not Routing

1. Check Alertmanager status: http://localhost:9093
2. Verify routing rules in `alertmanager.yml`
3. Check Slack/PagerDuty integration
4. Review Alertmanager logs
5. Test notification manually

### Too Many Alerts

1. Review alert history
2. Identify noisy alerts
3. Adjust thresholds or durations
4. Add inhibition rules
5. Silence during known maintenance

## Resources

- **Prometheus Documentation:** https://prometheus.io/docs/
- **Alerting Best Practices:** https://prometheus.io/docs/practices/alerting/
- **PromQL Guide:** https://prometheus.io/docs/prometheus/latest/querying/basics/
- **Alertmanager Configuration:** https://prometheus.io/docs/alerting/latest/configuration/

---

**Last Updated:** 2026-01-31
**Maintainer:** DevOps Team
**Review Schedule:** Monthly
