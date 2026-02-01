/**
 * k6 Stress Test - Find Breaking Point
 *
 * This script gradually increases load beyond normal capacity to find
 * the system's breaking point and observe degradation behavior.
 *
 * Test progression:
 * 1. Ramp up from 0 to 100 users (2 min)
 * 2. Stay at 100 users (3 min)
 * 3. Ramp up to 200 users (2 min)
 * 4. Stay at 200 users (3 min)
 * 5. Ramp up to 300 users (2 min)
 * 6. Stay at 300 users (3 min)
 * 7. Ramp down to 0 (2 min)
 *
 * Usage:
 *   k6 run stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TENANT_ID = __ENV.TENANT_ID || 'test-tenant';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp to 100
    { duration: '3m', target: 100 },   // Stay at 100
    { duration: '2m', target: 200 },   // Ramp to 200
    { duration: '3m', target: 200 },   // Stay at 200
    { duration: '2m', target: 300 },   // Ramp to 300
    { duration: '3m', target: 300 },   // Stay at 300 (stress point)
    { duration: '2m', target: 0 },     // Ramp down
  ],

  thresholds: {
    // More lenient thresholds for stress test
    'http_req_duration': ['p(95)<2000'],  // 95% under 2s
    'http_req_failed': ['rate<0.05'],     // 5% error rate acceptable
    'errors': ['rate<0.05'],
  },

  tags: {
    test_type: 'stress',
  },
};

export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);

  const success = check(healthRes, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!success);
  responseTime.add(healthRes.timings.duration);

  // Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'admin@test.com',
    password: 'Test123!@#',
  }), {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID,
    },
  });

  if (loginRes.status === 200) {
    const token = loginRes.json('accessToken');

    // Make API calls
    http.get(`${BASE_URL}/api/members?page=0&size=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Id': TENANT_ID,
      },
    });

    http.get(`${BASE_URL}/api/classes?page=0&size=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Id': TENANT_ID,
      },
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': '\n' + generateStressSummary(data),
    'stress-test-results.json': JSON.stringify(data, null, 2),
  };
}

function generateStressSummary(data) {
  const lines = [];
  lines.push('═══════════════════════════════════════════');
  lines.push('  Stress Test Summary');
  lines.push('═══════════════════════════════════════════');
  lines.push('');
  lines.push(`Total Requests: ${data.metrics.http_reqs?.values.count || 0}`);
  lines.push(`Error Rate: ${((data.metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2)}%`);
  lines.push(`Avg Response: ${data.metrics.http_req_duration?.values.avg.toFixed(2) || 0}ms`);
  lines.push(`95th Percentile: ${data.metrics.http_req_duration?.values['p(95)'].toFixed(2) || 0}ms`);
  lines.push(`Max Response: ${data.metrics.http_req_duration?.values.max.toFixed(2) || 0}ms`);
  lines.push('');

  // Breaking point analysis
  const errorRate = (data.metrics.http_req_failed?.values.rate || 0) * 100;
  if (errorRate > 5) {
    lines.push('⚠️  BREAKING POINT REACHED');
    lines.push(`   Error rate exceeded 5% (${errorRate.toFixed(2)}%)`);
  } else {
    lines.push('✓  System handled stress well');
    lines.push(`   Error rate: ${errorRate.toFixed(2)}%`);
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════');
  return lines.join('\n');
}
