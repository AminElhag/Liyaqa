# Load Testing Guide

Comprehensive load testing suite for the Liyaqa platform using [k6](https://k6.io/).

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Test Types](#test-types)
- [Quick Start](#quick-start)
- [Test Descriptions](#test-descriptions)
- [Configuration](#configuration)
- [Interpreting Results](#interpreting-results)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

This directory contains four types of performance tests:

| Test | Purpose | Duration | Target Users | Use Case |
|------|---------|----------|--------------|----------|
| **Load Test** | Validate normal capacity | 16 min | 50-100 | Pre-release validation |
| **Stress Test** | Find breaking point | 19 min | 100-300 | Capacity planning |
| **Spike Test** | Test traffic bursts | 8 min | 10-300 | Auto-scaling validation |
| **Soak Test** | Find memory leaks | 30m-4h | 50 | Stability testing |

---

## Prerequisites

### 1. Install k6

**macOS:**
```bash
brew install k6
```

**Ubuntu/Debian:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```powershell
choco install k6
```

**Docker:**
```bash
docker pull grafana/k6:latest
```

### 2. Prepare Backend

Ensure your backend is running and accessible:

```bash
# Local development
cd backend
./gradlew bootRun

# Or via Docker
docker-compose up -d backend

# Verify
curl http://localhost:8080/api/health
```

### 3. Create Test Data

For realistic results, seed your database with test data:

```bash
# Create test users
cd backend
./gradlew bootRun --args='--spring.profiles.active=test-data'
```

---

## Quick Start

### Run All Tests (Sequential)

```bash
cd backend/loadtest

# 1. Load test (16 minutes)
k6 run api-load-test.js

# 2. Stress test (19 minutes)
k6 run stress-test.js

# 3. Spike test (8 minutes)
k6 run spike-test.js

# 4. Short soak test (30 minutes)
k6 run --env SHORT_SOAK=true soak-test.js
```

### Run Individual Tests

```bash
# Load test - normal capacity
k6 run api-load-test.js

# Stress test - find limits
k6 run stress-test.js

# Spike test - sudden bursts
k6 run spike-test.js

# Soak test - stability
k6 run --env SHORT_SOAK=true soak-test.js  # 30 min
k6 run soak-test.js                         # 4 hours
```

### Run Against Production

```bash
k6 run --env BASE_URL=https://api.liyaqa.com api-load-test.js
```

**⚠️ WARNING:** Always get approval before load testing production!

---

## Test Descriptions

### 1. Load Test (`api-load-test.js`)

**Purpose:** Validate system can handle expected user load with acceptable performance.

**Profile:**
```
Users:  0 ──▶ 50 users (2m) ──▶ 50 users (5m) ──▶ 100 users (2m) ──▶ 100 users (5m) ──▶ 0
Time:       [2min]          [5min]          [2min]           [5min]          [2min]
Total: 16 minutes
```

**Scenarios:**
- ✅ Authentication (login)
- ✅ Member management (list, view details)
- ✅ Class browsing (list, view active)
- ✅ Lead management (list, create)
- ✅ Booking flow (create, view my bookings)
- ✅ Health checks

**Thresholds:**
- 95% of requests < 500ms
- 99% of API requests < 1000ms
- Error rate < 1%
- Login success rate > 99%
- Booking success rate > 95%

**When to Run:**
- Before every release
- After major code changes
- Weekly in CI/CD

**Expected Results:**
- ✅ All thresholds pass
- ✅ No errors or minimal errors (<1%)
- ✅ Response times stable

---

### 2. Stress Test (`stress-test.js`)

**Purpose:** Find the system's breaking point and observe degradation behavior.

**Profile:**
```
Users:  0 ──▶ 100 (2m) ──▶ 100 (3m) ──▶ 200 (2m) ──▶ 200 (3m) ──▶ 300 (2m) ──▶ 300 (3m) ──▶ 0
Time:       [2m]        [3m]        [2m]        [3m]        [2m]        [3m]        [2m]
Total: 19 minutes
```

**Operations:**
- Health checks
- Authentication
- API calls (members, classes)

**Thresholds:**
- 95% of requests < 2000ms (lenient)
- Error rate < 5% (acceptable degradation)

**When to Run:**
- Before production launch
- After infrastructure changes
- Before major events (marketing campaigns)
- Quarterly

**Expected Results:**
- ⚠️ Some degradation at 200+ users is acceptable
- ⚠️ Error rate may increase slightly
- ❌ System should NOT crash or become unresponsive
- ✅ Should recover gracefully

**Use Results For:**
- Capacity planning
- Auto-scaling configuration
- Setting rate limits
- Infrastructure sizing

---

### 3. Spike Test (`spike-test.js`)

**Purpose:** Test system behavior during sudden traffic spikes (viral posts, marketing emails).

**Profile:**
```
Users:  10 ━━━━━ 200! ━━━━━━━ 10 ━━━━ 300! ━━━ 10
Time:   [1m]   [instant] [2m]  [2m] [instant] [1m] [2m]
Total: 8 minutes
```

**Key Metrics:**
- Response time during spike
- Error rate spike
- Recovery time to baseline
- Dropped requests

**Thresholds:**
- 95% of requests < 3000ms (degraded but functional)
- Error rate < 15% (some failures expected)

**When to Run:**
- Before production launch
- Before marketing campaigns
- After auto-scaling changes
- Monthly

**Expected Results:**
- ⚠️ Degradation during spikes is expected
- ✅ Should recover to normal within 30 seconds
- ❌ Should NOT crash or stay degraded
- ✅ Auto-scaling should trigger (if enabled)

**Use Results For:**
- Tuning auto-scaling rules
- Setting up circuit breakers
- Configuring CDN
- Rate limiting configuration

---

### 4. Soak Test (`soak-test.js`)

**Purpose:** Identify issues that only appear over extended runtime (memory leaks, connection leaks).

**Profile:**
```
Users:  0 ──▶ 50 users ━━━━━━━━━━━━━━━━━━━━━━━━━ (4 hours) ━━━━━━━━▶ 0
Time:       [5min]                                            [5min]
Total: 4 hours 10 minutes (or 30 minutes with SHORT_SOAK=true)
```

**Operations (Weighted):**
- 25% List members
- 20% List classes
- 15% List leads
- 15% Member details
- 10% Login
- 10% Create lead
- 5% List bookings
- 5% Health checks

**Metrics Tracked:**
- Response time trend over time
- Memory usage growth
- Performance degradation score
- Connection errors
- Error rate stability

**Thresholds:**
- 95% of requests < 800ms
- Error rate < 2%
- Performance degradation < 50%
- Connection errors < 100 total

**When to Run:**
- Before production launch (mandatory)
- After major refactoring
- Monthly in staging environment
- After memory-related bug fixes

**Expected Results:**
- ✅ Response times stay consistent (±10%)
- ✅ No memory leaks (flat memory usage)
- ✅ Error rate stays low and stable
- ❌ If degradation >30%, investigate memory leaks

**Use Results For:**
- Detecting memory leaks
- Validating connection pool sizing
- Ensuring long-term stability
- Production readiness validation

---

## Configuration

### Environment Variables

All tests support these environment variables:

```bash
# Backend URL
export BASE_URL="http://localhost:8080"           # Default
export BASE_URL="https://api.liyaqa.com"          # Production

# Tenant ID
export TENANT_ID="test-tenant"                     # Default
export TENANT_ID="prod-tenant-123"                 # Production

# Soak test duration
export SHORT_SOAK="true"                           # 30-minute soak test (default: 4 hours)

# Test credentials (uses admin@test.com by default)
export TEST_EMAIL="loadtest@example.com"
export TEST_PASSWORD="SecurePassword123!"
```

### Example Usage

```bash
# Test against staging
BASE_URL=https://staging.liyaqa.com \
TENANT_ID=staging-tenant \
k6 run api-load-test.js

# Quick soak test
SHORT_SOAK=true k6 run soak-test.js

# Production test (with approval!)
BASE_URL=https://api.liyaqa.com \
TENANT_ID=prod-tenant-abc \
k6 run --vus 20 --duration 5m api-load-test.js
```

---

## Interpreting Results

### k6 Output

```
     ✓ login successful
     ✓ members listed
     ✓ response time OK

     checks.........................: 99.32% ✓ 14899     ✗ 102
     data_received..................: 45 MB  56 kB/s
     data_sent......................: 12 MB  15 kB/s
     http_req_blocked...............: avg=1.2ms    min=2µs     med=5µs     max=890ms   p(90)=8µs     p(95)=12µs
     http_req_connecting............: avg=420µs    min=0s      med=0s      max=234ms   p(90)=0s      p(95)=0s
   ✓ http_req_duration..............: avg=245ms    min=12ms    med=198ms   max=2.1s    p(90)=456ms   p(95)=589ms
       { expected_response:true }...: avg=243ms    min=12ms    med=197ms   max=2.1s    p(90)=455ms   p(95)=587ms
   ✓ http_req_failed................: 0.68%  ✓ 102       ✗ 14899
     http_req_receiving.............: avg=89µs     min=15µs    med=45µs    max=12ms    p(90)=123µs   p(95)=178µs
     http_req_sending...............: avg=34µs     min=5µs     med=18µs    max=8.9ms   p(90)=45µs    p(95)=67µs
     http_req_tls_handshaking.......: avg=0s       min=0s      med=0s      max=0s      p(90)=0s      p(95)=0s
     http_req_waiting...............: avg=244ms    min=12ms    med=197ms   max=2.1s    p(90)=455ms   p(95)=588ms
     http_reqs......................: 15001  18.7/s
     iteration_duration.............: avg=2.6s     min=1.1s    med=2.4s    max=8.9s    p(90)=3.8s    p(95)=4.5s
     iterations.....................: 2500   3.1/s
     vus............................: 100    min=0       max=100
     vus_max........................: 100    min=100     max=100
```

### Key Metrics Explained

| Metric | What It Means | Good Value | Action If Bad |
|--------|---------------|------------|---------------|
| **http_req_duration (p95)** | 95% of requests complete in this time | <500ms | Optimize slow endpoints |
| **http_req_failed** | % of failed requests | <1% | Check error logs |
| **checks** | % of validation checks that passed | >95% | Review failed assertions |
| **http_reqs** | Requests per second | Depends | Increase if targeting higher load |
| **iteration_duration** | Time per user iteration | ~2-5s | Should match think time |

### Color Coding

- ✓ **Green checkmark** = Threshold passed
- ✗ **Red X** = Threshold failed
- No symbol = Informational metric

### Custom Metrics

Each test adds custom metrics:

**Load Test:**
- `login_success` - Login success rate (should be >99%)
- `api_errors` - API error rate (should be <1%)
- `booking_success` - Booking success rate (should be >95%)

**Stress Test:**
- `errors` - Total error rate
- `response_time` - Response time trend

**Spike Test:**
- `spike_errors` - Errors during spikes
- `recovery_time_ms` - Time to recover after spike
- `request_drops` - Number of dropped requests

**Soak Test:**
- `errors` - Error rate over time
- `response_time_trend` - Response time degradation
- `connection_errors` - Connection failures
- `performance_degradation` - Performance vs. baseline

---

## Results Files

All tests generate detailed reports:

### 1. Console Output
- Real-time progress
- Final summary with assessment
- Recommendations

### 2. JSON Results
- `api-load-test-results.json` - Detailed metrics
- `stress-test-results.json`
- `spike-test-results.json`
- `soak-test-results.json`

### 3. HTML Reports (Load Test Only)
- `summary.html` - Visual dashboard

### Viewing Results

```bash
# View JSON results
cat api-load-test-results.json | jq '.metrics.http_req_duration'

# Open HTML report
open summary.html  # macOS
xdg-open summary.html  # Linux
start summary.html  # Windows
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/performance-test.yml`:

```yaml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday 2 AM
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - 'backend/src/**'

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Start backend
        run: |
          cd backend
          ./gradlew bootRun --args='--spring.profiles.active=test' &
          sleep 30

      - name: Run load test
        run: k6 run backend/loadtest/api-load-test.js

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: |
            backend/loadtest/*.json
            backend/loadtest/*.html
          retention-days: 30

      - name: Fail if thresholds not met
        run: |
          if grep -q "✗" k6-output.txt; then
            echo "Performance thresholds not met!"
            exit 1
          fi
```

### Integration with Monitoring

Send results to Grafana Cloud:

```bash
k6 run --out cloud api-load-test.js
```

Or to InfluxDB:

```bash
k6 run --out influxdb=http://localhost:8086/k6 api-load-test.js
```

---

## Troubleshooting

### Issue: Connection Refused

**Symptoms:**
```
WARN[0001] Request Failed  error="Get \"http://localhost:8080/api/health\": dial tcp [::1]:8080: connect: connection refused"
```

**Solutions:**
```bash
# Check if backend is running
curl http://localhost:8080/api/health

# Start backend
cd backend && ./gradlew bootRun

# Or use Docker
docker-compose up -d backend

# Wait for startup
sleep 30
```

---

### Issue: High Error Rate

**Symptoms:**
```
http_req_failed................: 15.2%  ✗ Too high!
```

**Solutions:**
1. Check backend logs:
```bash
docker logs liyaqa-backend
```

2. Reduce load:
```bash
k6 run --vus 10 --duration 2m api-load-test.js
```

3. Check database:
```bash
docker logs liyaqa-postgres
```

4. Increase resources:
```bash
# Increase JVM heap
JAVA_OPTS="-Xmx2g" ./gradlew bootRun
```

---

### Issue: Slow Response Times

**Symptoms:**
```
http_req_duration..............: avg=2.5s  ✗ Too slow!
```

**Solutions:**
1. Enable database query logging
2. Check slow queries in PostgreSQL:
```sql
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

3. Add database indexes
4. Enable caching
5. Optimize N+1 queries

---

### Issue: Memory Leaks (Soak Test)

**Symptoms:**
```
Performance degradation detected: 45.2% slower than baseline
```

**Solutions:**
1. Take heap dump:
```bash
jmap -dump:live,format=b,file=heap.bin <PID>
```

2. Analyze with VisualVM or Eclipse MAT

3. Check for:
   - Unclosed database connections
   - Static collections growing unbounded
   - Event listeners not unregistered
   - Cache not expiring

---

## Best Practices

### 1. Test in Isolation

✅ **Do:**
```bash
# Dedicated test environment
docker-compose -f docker-compose.test.yml up -d
k6 run api-load-test.js
```

❌ **Don't:**
- Test against shared development environment
- Run multiple tests simultaneously
- Test while other developers are using the system

---

### 2. Gradual Load Increase

✅ **Do:**
```javascript
stages: [
  { duration: '2m', target: 50 },   // Gradual ramp-up
  { duration: '5m', target: 50 },   // Sustained load
]
```

❌ **Don't:**
```javascript
stages: [
  { duration: '0s', target: 1000 }, // Instant spike - unrealistic
]
```

---

### 3. Realistic Scenarios

✅ **Do:**
```javascript
// Mimic real user behavior
performLogin();
sleep(2);  // Think time
browseClasses();
sleep(3);
bookClass();
```

❌ **Don't:**
```javascript
// Unrealistic tight loop
for (let i = 0; i < 1000; i++) {
  createBooking();  // No think time, no variety
}
```

---

### 4. Monitor While Testing

✅ **Do:**
```bash
# Terminal 1: Run test
k6 run api-load-test.js

# Terminal 2: Watch metrics
watch -n 1 'docker stats --no-stream'

# Terminal 3: Watch logs
docker logs -f liyaqa-backend

# Terminal 4: Database
psql -c "SELECT * FROM pg_stat_activity;"
```

---

### 5. Clean Up Test Data

✅ **Do:**
```bash
# After tests
docker exec liyaqa-postgres psql -U liyaqa -c "DELETE FROM leads WHERE email LIKE '%@test.com';"
```

❌ **Don't:**
- Leave thousands of test records in database
- Let test data pollute metrics

---

### 6. Document Baselines

✅ **Do:**
Create `PERFORMANCE_BASELINE.md`:
```markdown
## Baseline Performance (2026-01-31)

**Environment:** 4 CPU, 8GB RAM, PostgreSQL 15

### Load Test Results
- RPS: 150/s
- p95 latency: 320ms
- Error rate: 0.2%

### Stress Test Results
- Breaking point: 250 concurrent users
- Degradation starts: 180 users
```

---

## Performance Targets

### Development Environment
- **Load Test:** Should pass with 50-100 users
- **Response Time:** p95 < 500ms
- **Error Rate:** < 1%

### Staging Environment
- **Load Test:** Should pass with 100-200 users
- **Response Time:** p95 < 400ms
- **Error Rate:** < 0.5%

### Production Environment
- **Load Test:** Should pass with expected peak load × 1.5
- **Response Time:** p95 < 300ms
- **Error Rate:** < 0.1%
- **Soak Test:** Must pass 4-hour test with <10% degradation

---

## Test Schedule

### Before Every Release
- ✅ Load test (16 min)
- ✅ Spike test (8 min)

### Before Production Launch
- ✅ Load test
- ✅ Stress test
- ✅ Spike test
- ✅ Soak test (full 4 hours)

### Weekly (CI/CD)
- ✅ Load test
- ✅ Short soak test (30 min)

### Monthly
- ✅ Full test suite
- ✅ Performance regression check
- ✅ Capacity planning review

### Quarterly
- ✅ Full stress test
- ✅ Update performance baselines
- ✅ Review and adjust targets

---

## Resources

- **k6 Documentation:** https://k6.io/docs/
- **k6 Examples:** https://k6.io/docs/examples/
- **Performance Testing Guide:** https://k6.io/docs/testing-guides/
- **API Testing:** https://k6.io/docs/testing-guides/api-load-testing/

---

## Support

For questions or issues with load testing:

1. Check k6 documentation: https://k6.io/docs/
2. Review backend logs: `docker logs liyaqa-backend`
3. Check monitoring dashboards: http://localhost:3001 (Grafana)
4. Contact DevOps team

---

**Last Updated:** 2026-01-31
**Maintainer:** DevOps Team
**k6 Version:** 0.47.0+
