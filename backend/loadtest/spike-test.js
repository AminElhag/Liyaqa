/**
 * k6 Spike Test - Sudden Traffic Burst
 *
 * This script simulates sudden spikes in traffic to test system behavior
 * under extreme, unexpected load conditions.
 *
 * Test progression:
 * 1. Baseline: 10 users (1 min)
 * 2. SPIKE: Instantly jump to 200 users (2 min)
 * 3. Recovery: Drop back to 10 users (2 min)
 * 4. SPIKE: Jump to 300 users (1 min)
 * 5. Recovery: Drop to 10 users (2 min)
 *
 * Goals:
 * - Test auto-scaling response time
 * - Identify resource bottlenecks
 * - Verify graceful degradation
 * - Check recovery time
 *
 * Usage:
 *   k6 run spike-test.js
 *   k6 run --env BASE_URL=https://api.liyaqa.com spike-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TENANT_ID = __ENV.TENANT_ID || 'test-tenant';

// Custom metrics
const spikeErrorRate = new Rate('spike_errors');
const recoveryTime = new Trend('recovery_time_ms');
const requestDrops = new Counter('request_drops');

export const options = {
  stages: [
    // Baseline
    { duration: '1m', target: 10 },     // Normal load

    // First spike
    { duration: '0s', target: 200 },    // Instant spike!
    { duration: '2m', target: 200 },    // Stay at spike

    // Recovery
    { duration: '10s', target: 10 },    // Fast ramp down
    { duration: '2m', target: 10 },     // Observe recovery

    // Second spike (higher)
    { duration: '0s', target: 300 },    // Even bigger spike!
    { duration: '1m', target: 300 },    // Short burst

    // Final recovery
    { duration: '10s', target: 10 },    // Fast ramp down
    { duration: '2m', target: 10 },     // Final recovery
  ],

  thresholds: {
    // Very lenient thresholds - we expect some failures during spikes
    'http_req_duration': ['p(95)<3000'],  // 95% under 3s (degraded but functional)
    'http_req_failed': ['rate<0.15'],     // 15% error rate acceptable during spikes
    'spike_errors': ['rate<0.20'],        // 20% custom error rate acceptable
  },

  tags: {
    test_type: 'spike',
  },
};

// Track test phase
let currentPhase = 'baseline';
let phaseStartTime = Date.now();

export default function () {
  // Detect phase changes based on VU count
  const vus = __VU;
  if (vus <= 20 && currentPhase !== 'baseline') {
    currentPhase = 'recovery';
    phaseStartTime = Date.now();
  } else if (vus >= 150 && currentPhase !== 'spike') {
    currentPhase = 'spike';
    phaseStartTime = Date.now();
  }

  const startTime = Date.now();

  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`, {
    tags: { phase: currentPhase },
  });

  const responseTime = Date.now() - startTime;

  const success = check(healthRes, {
    'status is 200': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 5000,
  });

  spikeErrorRate.add(!success);

  // Track recovery metrics
  if (currentPhase === 'recovery') {
    recoveryTime.add(responseTime);
  }

  // Track dropped requests
  if (healthRes.status === 0 || healthRes.status >= 500) {
    requestDrops.add(1);
  }

  // Attempt login during spike (higher probability of failure)
  if (Math.random() < 0.3) {  // 30% of requests try to login
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: 'admin@test.com',
      password: 'Test123!@#',
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': TENANT_ID,
      },
      tags: { phase: currentPhase, operation: 'login' },
    });

    if (loginRes.status === 200) {
      const token = loginRes.json('accessToken');

      // Make a quick API call
      http.get(`${BASE_URL}/api/members?page=0&size=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Id': TENANT_ID,
        },
        tags: { phase: currentPhase, operation: 'list-members' },
      });
    }
  }

  // Minimal think time during spikes
  if (currentPhase === 'spike') {
    sleep(0.1);  // Very short sleep during spike
  } else {
    sleep(1);    // Normal sleep during baseline/recovery
  }
}

export function handleSummary(data) {
  return {
    'stdout': '\n' + generateSpikeSummary(data),
    'spike-test-results.json': JSON.stringify(data, null, 2),
  };
}

function generateSpikeSummary(data) {
  const lines = [];
  lines.push('═══════════════════════════════════════════');
  lines.push('  Spike Test Summary');
  lines.push('═══════════════════════════════════════════');
  lines.push('');

  // Overall metrics
  lines.push(`Total Requests: ${data.metrics.http_reqs?.values.count || 0}`);
  lines.push(`Error Rate: ${((data.metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2)}%`);
  lines.push(`Dropped Requests: ${data.metrics.request_drops?.values.count || 0}`);
  lines.push('');

  // Response times
  lines.push('Response Times:');
  lines.push(`  Average: ${data.metrics.http_req_duration?.values.avg.toFixed(2) || 0}ms`);
  lines.push(`  Median:  ${data.metrics.http_req_duration?.values.med.toFixed(2) || 0}ms`);
  lines.push(`  95th:    ${data.metrics.http_req_duration?.values['p(95)'].toFixed(2) || 0}ms`);
  lines.push(`  99th:    ${data.metrics.http_req_duration?.values['p(99)'].toFixed(2) || 0}ms`);
  lines.push(`  Max:     ${data.metrics.http_req_duration?.values.max.toFixed(2) || 0}ms`);
  lines.push('');

  // Recovery analysis
  if (data.metrics.recovery_time_ms) {
    lines.push('Recovery Metrics:');
    lines.push(`  Avg Recovery Time: ${data.metrics.recovery_time_ms.values.avg.toFixed(2)}ms`);
    lines.push(`  Max Recovery Time: ${data.metrics.recovery_time_ms.values.max.toFixed(2)}ms`);
    lines.push('');
  }

  // Assessment
  const errorRate = (data.metrics.http_req_failed?.values.rate || 0) * 100;
  const p95 = data.metrics.http_req_duration?.values['p(95)'] || 0;
  const droppedRequests = data.metrics.request_drops?.values.count || 0;

  lines.push('Assessment:');

  if (errorRate < 5 && p95 < 1000 && droppedRequests < 10) {
    lines.push('  ✓ EXCELLENT - System handled spikes gracefully');
    lines.push('    - Low error rate during spikes');
    lines.push('    - Fast recovery to normal operation');
    lines.push('    - Minimal request drops');
  } else if (errorRate < 10 && p95 < 2000 && droppedRequests < 50) {
    lines.push('  ⚠ GOOD - System survived spikes with degradation');
    lines.push('    - Some errors during peak load');
    lines.push('    - Response times degraded but acceptable');
    lines.push('    - System recovered successfully');
  } else if (errorRate < 20 && p95 < 5000) {
    lines.push('  ⚠ NEEDS IMPROVEMENT - Significant degradation during spikes');
    lines.push('    - High error rate during peaks');
    lines.push('    - Slow response times');
    lines.push('    - Consider auto-scaling or rate limiting');
  } else {
    lines.push('  ❌ CRITICAL - System struggled with spikes');
    lines.push('    - Very high error rate');
    lines.push('    - Many dropped requests');
    lines.push('    - Auto-scaling or capacity increase required');
  }

  lines.push('');

  // Recommendations
  lines.push('Recommendations:');
  if (errorRate > 10) {
    lines.push('  • Implement auto-scaling to handle traffic spikes');
    lines.push('  • Add request queuing with circuit breakers');
    lines.push('  • Consider CDN for static content');
  }
  if (p95 > 2000) {
    lines.push('  • Optimize database connection pooling');
    lines.push('  • Add caching layer for frequently accessed data');
    lines.push('  • Review slow queries and add indexes');
  }
  if (droppedRequests > 20) {
    lines.push('  • Increase server capacity or instance count');
    lines.push('  • Implement graceful degradation strategies');
    lines.push('  • Add health check endpoints for load balancers');
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════');
  return lines.join('\n');
}
