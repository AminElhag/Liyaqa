# Monitoring Stack Quick Start Guide

This guide will get you up and running with the complete Liyaqa monitoring stack in under 10 minutes.

## 🚀 Quick Start (5 Minutes)

### Step 1: Start the Monitoring Stack

```bash
cd /path/to/liyaqa

# Start all monitoring services
docker-compose -f deploy/docker-compose.monitoring.yml up -d

# Check all services are running
docker-compose -f deploy/docker-compose.monitoring.yml ps
```

You should see:
- ✅ liyaqa-prometheus (port 9090)
- ✅ liyaqa-grafana (port 3001)
- ✅ liyaqa-loki (port 3100)
- ✅ liyaqa-promtail
- ✅ liyaqa-alertmanager (port 9093)
- ✅ liyaqa-postgres-exporter (port 9187)

### Step 2: Access Grafana

1. Open your browser to: **http://localhost:3001**
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin`
3. Change password when prompted (or skip)

### Step 3: Verify Data Sources

1. Go to **Configuration** (⚙️) → **Data Sources**
2. You should see:
   - **Prometheus** (default) - ✅ Green "Working"
   - **Loki** - ✅ Green "Working"

If they're not green, click "Test" to verify connection.

### Step 4: Explore Logs

1. Click **Explore** (🧭) on the left sidebar
2. Select **Loki** from the dropdown
3. Enter a query:
   ```logql
   {service="backend"}
   ```
4. Click **Run query**
5. You should see logs from the Liyaqa backend

### Step 5: Explore Metrics

1. In **Explore**, switch to **Prometheus**
2. Enter a query:
   ```promql
   jvm_memory_used_bytes
   ```
3. Click **Run query**
4. You should see JVM memory usage graphs

**🎉 Congratulations! Your monitoring stack is running!**

---

## 📊 Accessing Services

| Service | URL | Purpose |
|---------|-----|---------|
| Grafana | http://localhost:3001 | Dashboards and visualization |
| Prometheus | http://localhost:9090 | Metrics database and queries |
| Loki | http://localhost:3100 | Log aggregation (API only) |
| Alertmanager | http://localhost:9093 | Alert routing and management |

---

## 🔍 Common Log Queries

### See All Backend Logs
```logql
{service="backend"}
```

### Show Only Errors
```logql
{service="backend", level="ERROR"}
```

### Filter by User
```logql
{service="backend", userId="123"}
```

### Filter by Tenant
```logql
{service="backend", tenantId="tenant-abc"}
```

### Search for Specific Text
```logql
{service="backend"} |= "authentication failed"
```

### Show Slow Requests
```logql
{service="backend"} |= "Slow request detected"
```

### Errors in Last Hour
```logql
{service="backend", level="ERROR"} | json | line_format "{{.timestamp}} - {{.message}}"
```

---

## 📈 Common Metric Queries

### JVM Memory Usage
```promql
jvm_memory_used_bytes{area="heap"}
```

### HTTP Request Rate (requests/sec)
```promql
rate(http_server_requests_seconds_count[5m])
```

### HTTP Request Duration (95th percentile)
```promql
histogram_quantile(0.95, http_server_requests_seconds_bucket)
```

### Error Rate
```promql
rate(http_server_requests_seconds_count{status=~"5.."}[5m])
```

### Database Connections
```promql
hikaricp_connections_active
```

### Thread Count
```promql
jvm_threads_live_threads
```

### CPU Usage (if Node Exporter installed)
```promql
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

---

## 🎨 Creating Your First Dashboard

### Method 1: Import Existing Dashboard

1. Go to **Create** (+) → **Import**
2. Enter dashboard ID:
   - Spring Boot: `12900`
   - JVM Micrometer: `4701`
   - PostgreSQL: `9628`
3. Click **Load**
4. Select **Prometheus** as the data source
5. Click **Import**

### Method 2: Create Custom Dashboard

1. Go to **Create** (+) → **Dashboard**
2. Click **Add new panel**
3. In the query editor, enter:
   ```promql
   rate(http_server_requests_seconds_count[5m])
   ```
4. Set visualization type (Graph, Stat, Gauge, etc.)
5. Click **Apply**
6. Click **Save dashboard** (💾)

---

## 🚨 Troubleshooting

### Containers Not Starting

```bash
# Check container logs
docker-compose -f deploy/docker-compose.monitoring.yml logs prometheus
docker-compose -f deploy/docker-compose.monitoring.yml logs grafana
docker-compose -f deploy/docker-compose.monitoring.yml logs loki

# Restart specific service
docker-compose -f deploy/docker-compose.monitoring.yml restart prometheus
```

### No Metrics from Backend

**Check backend is exposing metrics:**
```bash
curl http://localhost:8080/actuator/prometheus
```

If this returns 404, enable actuator in `application.yml`:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
```

**Check Prometheus can reach backend:**
1. Go to http://localhost:9090
2. Click **Status** → **Targets**
3. Find `liyaqa-backend` - should show "UP"
4. If "DOWN", check network connectivity

### No Logs in Loki

**Check Promtail is running:**
```bash
docker-compose -f deploy/docker-compose.monitoring.yml ps promtail
```

**Check Promtail logs:**
```bash
docker-compose -f deploy/docker-compose.monitoring.yml logs promtail
```

**Verify logs are being written:**
```bash
# Check application log file
tail -f logs/liyaqa.log

# Check Docker container logs
docker logs liyaqa-backend-1
```

### Grafana Can't Connect to Prometheus/Loki

**Check services are on same network:**
```bash
docker network inspect liyaqa_monitoring
```

**Test connectivity from Grafana container:**
```bash
docker exec liyaqa-grafana curl http://prometheus:9090/api/v1/status/config
docker exec liyaqa-grafana curl http://loki:3100/ready
```

### Permission Denied Errors

**Fix Loki permissions:**
```bash
sudo chown -R 10001:10001 deploy/loki-data
```

**Fix Grafana permissions:**
```bash
sudo chown -R 472:472 deploy/grafana-data
```

---

## 📖 Next Steps

### 1. Create Custom Dashboards
Create dashboards for:
- API performance (requests/sec, latency, errors)
- Business metrics (bookings, memberships, revenue)
- System health (memory, CPU, disk)
- Database performance (connections, query time, cache hit rate)

### 2. Set Up Alerts (Week 3)
Configure alerts for:
- High error rate (>5%)
- Slow response time (p95 > 2s)
- Low database connection pool
- High memory usage (>90%)
- Service downtime

### 3. Integrate with Notification Channels
- Slack notifications for alerts
- Email for critical issues
- PagerDuty for on-call rotation

### 4. Add More Exporters
- **Node Exporter:** System metrics (CPU, disk, network)
- **cAdvisor:** Container metrics
- **Blackbox Exporter:** External endpoint monitoring

---

## 🔗 Useful Resources

### Official Documentation
- [Grafana Docs](https://grafana.com/docs/grafana/latest/)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Loki Docs](https://grafana.com/docs/loki/latest/)
- [LogQL Queries](https://grafana.com/docs/loki/latest/logql/)
- [PromQL Queries](https://prometheus.io/docs/prometheus/latest/querying/basics/)

### Pre-built Dashboards
- [Grafana Dashboard Library](https://grafana.com/grafana/dashboards/)
- [Spring Boot Dashboard](https://grafana.com/grafana/dashboards/12900)
- [JVM Micrometer](https://grafana.com/grafana/dashboards/4701)
- [PostgreSQL](https://grafana.com/grafana/dashboards/9628)

### Video Tutorials
- [Grafana for Beginners](https://grafana.com/docs/grafana/latest/getting-started/)
- [Prometheus Basics](https://prometheus.io/docs/tutorials/getting_started/)
- [Loki LogQL Queries](https://grafana.com/docs/loki/latest/logql/)

---

## 🎯 Monitoring Best Practices

### 1. The Four Golden Signals
Monitor these for every service:
- **Latency:** How long requests take
- **Traffic:** Request volume
- **Errors:** Error rate
- **Saturation:** Resource utilization (CPU, memory, disk)

### 2. Alert on Symptoms, Not Causes
- ❌ Bad: Alert when CPU > 80%
- ✅ Good: Alert when response time > 2s (which may be caused by high CPU)

### 3. Reduce Alert Fatigue
- Only alert on actionable issues
- Set appropriate thresholds
- Use alert grouping and deduplication
- Implement alert routing (critical vs warning)

### 4. Dashboard Design
- **One dashboard per audience** (dev, ops, business)
- **Start with overview, drill down to details**
- **Use appropriate visualizations** (graphs for time series, stats for current values)
- **Include SLO/SLA tracking**

### 5. Log Retention Strategy
- **Hot storage:** Last 7 days (fast queries)
- **Warm storage:** 8-30 days (slower queries)
- **Cold storage:** 30+ days (archive, rarely accessed)

---

## 📞 Getting Help

**Can't find what you need?**
1. Check the official documentation links above
2. Search Grafana community forum
3. Review the monitoring stack logs
4. Check this project's `/deploy/MONITORING_QUICK_START.md` (this file!)

**Found a bug?**
- Check Docker container logs
- Verify configuration files
- Test with simplified setup
- Recreate containers from scratch

---

**Version:** 1.0
**Last Updated:** 2026-01-31
**Status:** Ready for production use
