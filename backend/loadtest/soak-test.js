/**
 * k6 Soak Test - Long-Duration Stability Test
 *
 * This script runs a sustained load over an extended period to identify
 * issues that only appear over time:
 * - Memory leaks
 * - Database connection leaks
 * - Disk space exhaustion
 * - Performance degradation over time
 * - Resource exhaustion
 *
 * Test progression:
 * 1. Ramp up to 50 users (5 min)
 * 2. Maintain 50 users (4 hours)
 * 3. Ramp down to 0 (5 min)
 *
 * For quick testing, use SHORT_SOAK=true:
 *   k6 run --env SHORT_SOAK=true soak-test.js  # 30 minutes instead of 4 hours
 *
 * Usage:
 *   k6 run soak-test.js                                    # Full 4-hour test
 *   k6 run --env SHORT_SOAK=true soak-test.js             # 30-minute test
 *   k6 run --env BASE_URL=https://api.liyaqa.com soak-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TENANT_ID = __ENV.TENANT_ID || 'test-tenant';
const SHORT_SOAK = __ENV.SHORT_SOAK === 'true';

// Test duration
const SOAK_DURATION = SHORT_SOAK ? '30m' : '4h';

// Custom metrics
const errorRate = new Rate('errors');
const memoryLeakIndicator = new Trend('response_time_trend');
const connectionErrors = new Counter('connection_errors');
const degradationScore = new Gauge('performance_degradation');

// Track baseline metrics
let baselineResponseTime = 0;
let iterationCount = 0;
const responseTimes = [];

export const options = {
  stages: [
    { duration: '5m', target: 50 },       // Ramp up
    { duration: SOAK_DURATION, target: 50 }, // Sustained load
    { duration: '5m', target: 0 },        // Ramp down
  ],

  thresholds: {
    // Stricter thresholds than load test - looking for degradation
    'http_req_duration': ['p(95)<800'],   // 95% under 800ms
    'http_req_failed': ['rate<0.02'],     // 2% error rate
    'errors': ['rate<0.02'],
    'connection_errors': ['count<100'],   // Max 100 connection errors over 4 hours
    'performance_degradation': ['value<1.5'], // Max 50% degradation from baseline
  },

  tags: {
    test_type: 'soak',
  },
};

// Test data - varied operations
const operations = [
  { name: 'health', weight: 5 },
  { name: 'login', weight: 10 },
  { name: 'list-members', weight: 25 },
  { name: 'member-details', weight: 15 },
  { name: 'list-classes', weight: 20 },
  { name: 'list-leads', weight: 15 },
  { name: 'create-lead', weight: 5 },
  { name: 'list-bookings', weight: 5 },
];

function selectOperation() {
  const totalWeight = operations.reduce((sum, op) => sum + op.weight, 0);
  let random = Math.random() * totalWeight;

  for (const op of operations) {
    random -= op.weight;
    if (random <= 0) {
      return op.name;
    }
  }
  return operations[0].name;
}

export default function () {
  iterationCount++;

  const operation = selectOperation();
  const startTime = Date.now();

  let success = false;
  let token = null;

  switch (operation) {
    case 'health':
      success = performHealthCheck();
      break;

    case 'login':
      token = performLogin();
      success = token !== null;
      break;

    case 'list-members':
      token = getCachedToken() || performLogin();
      if (token) success = listMembers(token);
      break;

    case 'member-details':
      token = getCachedToken() || performLogin();
      if (token) success = getMemberDetails(token);
      break;

    case 'list-classes':
      token = getCachedToken() || performLogin();
      if (token) success = listClasses(token);
      break;

    case 'list-leads':
      token = getCachedToken() || performLogin();
      if (token) success = listLeads(token);
      break;

    case 'create-lead':
      token = getCachedToken() || performLogin();
      if (token) success = createLead(token);
      break;

    case 'list-bookings':
      token = getCachedToken() || performLogin();
      if (token) success = listBookings(token);
      break;
  }

  const responseTime = Date.now() - startTime;
  responseTimes.push(responseTime);

  // Track metrics
  errorRate.add(!success);
  memoryLeakIndicator.add(responseTime);

  // Calculate performance degradation every 100 iterations
  if (iterationCount === 100) {
    baselineResponseTime = average(responseTimes.slice(-100));
  } else if (iterationCount > 100 && iterationCount % 100 === 0) {
    const currentAvg = average(responseTimes.slice(-100));
    const degradation = currentAvg / baselineResponseTime;
    degradationScore.add(degradation);

    // Log degradation if significant
    if (degradation > 1.2) {
      console.warn(`Performance degradation detected: ${(degradation * 100 - 100).toFixed(1)}% slower than baseline`);
    }
  }

  // Variable think time (1-5 seconds)
  sleep(Math.random() * 4 + 1);
}

// ============================================================================
// Operation Functions
// ============================================================================

function performHealthCheck() {
  const res = http.get(`${BASE_URL}/api/health`, {
    tags: { operation: 'health' },
  });

  return check(res, {
    'health check OK': (r) => r.status === 200,
  });
}

function performLogin() {
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'admin@test.com',
    password: 'Test123!@#',
  }), {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID,
    },
    tags: { operation: 'login' },
  });

  const success = check(res, {
    'login successful': (r) => r.status === 200,
    'has access token': (r) => r.json('accessToken') !== undefined,
  });

  if (success) {
    const token = res.json('accessToken');
    __VU.cachedToken = token;
    __VU.tokenExpiry = Date.now() + 3600000; // 1 hour
    return token;
  }

  if (res.status === 0) {
    connectionErrors.add(1);
  }

  return null;
}

function getCachedToken() {
  if (__VU.cachedToken && __VU.tokenExpiry > Date.now()) {
    return __VU.cachedToken;
  }
  return null;
}

function listMembers(token) {
  const res = http.get(`${BASE_URL}/api/members?page=0&size=20`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-Id': TENANT_ID,
    },
    tags: { operation: 'list-members' },
  });

  return check(res, {
    'members listed': (r) => r.status === 200,
    'has content': (r) => r.json('content') !== undefined,
  });
}

function getMemberDetails(token) {
  // Get a random member ID (in real scenario, would use actual IDs)
  const memberId = 1 + Math.floor(Math.random() * 100);

  const res = http.get(`${BASE_URL}/api/members/${memberId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-Id': TENANT_ID,
    },
    tags: { operation: 'member-details' },
  });

  return check(res, {
    'member retrieved or 404': (r) => [200, 404].includes(r.status),
  });
}

function listClasses(token) {
  const res = http.get(`${BASE_URL}/api/classes?page=0&size=20`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-Id': TENANT_ID,
    },
    tags: { operation: 'list-classes' },
  });

  return check(res, {
    'classes listed': (r) => r.status === 200,
  });
}

function listLeads(token) {
  const res = http.get(`${BASE_URL}/api/leads?page=0&size=20`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-Id': TENANT_ID,
    },
    tags: { operation: 'list-leads' },
  });

  return check(res, {
    'leads listed': (r) => r.status === 200,
  });
}

function createLead(token) {
  const timestamp = Date.now();
  const res = http.post(`${BASE_URL}/api/leads`, JSON.stringify({
    name: `Soak Test Lead ${timestamp}`,
    email: `soak-${timestamp}@test.com`,
    phone: `+96650${Math.floor(Math.random() * 10000000)}`,
    source: 'WALK_IN',
    priority: 'MEDIUM',
  }), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID,
    },
    tags: { operation: 'create-lead' },
  });

  return check(res, {
    'lead created': (r) => [200, 201].includes(r.status),
  });
}

function listBookings(token) {
  const res = http.get(`${BASE_URL}/api/bookings/my-bookings`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-Id': TENANT_ID,
    },
    tags: { operation: 'list-bookings' },
  });

  return check(res, {
    'bookings listed': (r) => r.status === 200,
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

// ============================================================================
// Lifecycle Hooks
// ============================================================================

export function setup() {
  const testDuration = SHORT_SOAK ? '30 minutes' : '4 hours';
  console.log('═══════════════════════════════════════════');
  console.log('  Starting Soak Test');
  console.log('═══════════════════════════════════════════');
  console.log(`Duration: ${testDuration}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Tenant ID: ${TENANT_ID}`);
  console.log('');
  console.log('This test will:');
  console.log('  • Maintain 50 concurrent users');
  console.log('  • Perform realistic operations');
  console.log('  • Monitor for memory leaks');
  console.log('  • Track performance degradation');
  console.log('');

  // Verify backend is accessible
  const healthRes = http.get(`${BASE_URL}/api/health`);
  if (healthRes.status !== 200) {
    throw new Error(`Backend not accessible: ${healthRes.status}`);
  }

  console.log('✓ Backend is accessible');
  console.log('');
  return {};
}

export function teardown(data) {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  Soak test completed!');
  console.log('═══════════════════════════════════════════');
}

// ============================================================================
// Summary Handler
// ============================================================================

export function handleSummary(data) {
  return {
    'stdout': '\n' + generateSoakSummary(data),
    'soak-test-results.json': JSON.stringify(data, null, 2),
  };
}

function generateSoakSummary(data) {
  const lines = [];
  lines.push('═══════════════════════════════════════════');
  lines.push('  Soak Test Summary');
  lines.push('═══════════════════════════════════════════');
  lines.push('');

  // Duration
  const duration = data.state.testRunDurationMs / 1000 / 60;
  lines.push(`Test Duration: ${duration.toFixed(1)} minutes`);
  lines.push('');

  // Request metrics
  lines.push(`Total Requests: ${data.metrics.http_reqs?.values.count || 0}`);
  lines.push(`Request Rate: ${data.metrics.http_reqs?.values.rate.toFixed(2) || 0}/s`);
  lines.push(`Error Rate: ${((data.metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2)}%`);
  lines.push(`Connection Errors: ${data.metrics.connection_errors?.values.count || 0}`);
  lines.push('');

  // Response times
  lines.push('Response Times:');
  lines.push(`  Average: ${data.metrics.http_req_duration?.values.avg.toFixed(2) || 0}ms`);
  lines.push(`  Median:  ${data.metrics.http_req_duration?.values.med.toFixed(2) || 0}ms`);
  lines.push(`  95th:    ${data.metrics.http_req_duration?.values['p(95)'].toFixed(2) || 0}ms`);
  lines.push(`  99th:    ${data.metrics.http_req_duration?.values['p(99)'].toFixed(2) || 0}ms`);
  lines.push(`  Max:     ${data.metrics.http_req_duration?.values.max.toFixed(2) || 0}ms`);
  lines.push('');

  // Degradation analysis
  const degradation = data.metrics.performance_degradation?.values.value || 1;
  lines.push('Performance Degradation Analysis:');
  if (degradation < 1.1) {
    lines.push('  ✓ EXCELLENT - No significant degradation detected');
    lines.push(`    Performance remained stable (${((degradation - 1) * 100).toFixed(1)}% variance)`);
  } else if (degradation < 1.3) {
    lines.push('  ⚠ GOOD - Minor degradation detected');
    lines.push(`    Performance degraded by ${((degradation - 1) * 100).toFixed(1)}%`);
    lines.push('    Consider investigating for potential memory leaks');
  } else if (degradation < 1.5) {
    lines.push('  ⚠ WARNING - Noticeable degradation detected');
    lines.push(`    Performance degraded by ${((degradation - 1) * 100).toFixed(1)}%`);
    lines.push('    Likely memory leak or resource exhaustion');
  } else {
    lines.push('  ❌ CRITICAL - Severe degradation detected');
    lines.push(`    Performance degraded by ${((degradation - 1) * 100).toFixed(1)}%`);
    lines.push('    System not suitable for long-running production use');
  }
  lines.push('');

  // Stability assessment
  lines.push('Stability Assessment:');
  const errorRate = (data.metrics.http_req_failed?.values.rate || 0) * 100;
  const p95 = data.metrics.http_req_duration?.values['p(95)'] || 0;
  const connErrors = data.metrics.connection_errors?.values.count || 0;

  const issues = [];
  if (errorRate > 2) issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
  if (p95 > 800) issues.push(`Slow p95 response: ${p95.toFixed(0)}ms`);
  if (connErrors > 100) issues.push(`Connection errors: ${connErrors}`);
  if (degradation > 1.3) issues.push(`Performance degradation: ${((degradation - 1) * 100).toFixed(1)}%`);

  if (issues.length === 0) {
    lines.push('  ✓ System is stable for long-running production use');
    lines.push('  ✓ No memory leaks detected');
    lines.push('  ✓ Performance remained consistent');
  } else {
    lines.push('  ⚠ Issues detected:');
    issues.forEach(issue => lines.push(`    • ${issue}`));
  }

  lines.push('');

  // Recommendations
  if (issues.length > 0) {
    lines.push('Recommendations:');
    if (degradation > 1.2) {
      lines.push('  • Check for memory leaks (heap dumps, profiling)');
      lines.push('  • Monitor JVM garbage collection patterns');
      lines.push('  • Review database connection pool usage');
    }
    if (connErrors > 50) {
      lines.push('  • Increase connection pool size');
      lines.push('  • Check for connection leak issues');
      lines.push('  • Review firewall/network timeouts');
    }
    if (p95 > 800) {
      lines.push('  • Optimize slow database queries');
      lines.push('  • Add caching for frequently accessed data');
      lines.push('  • Consider read replicas for database');
    }
    if (errorRate > 2) {
      lines.push('  • Investigate error logs for patterns');
      lines.push('  • Check resource limits (CPU, memory, disk)');
      lines.push('  • Review application error handling');
    }
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════');
  return lines.join('\n');
}
