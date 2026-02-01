/**
 * k6 Load Test - API Endpoints
 *
 * This script tests the main API endpoints under realistic load conditions.
 * It simulates user behavior including authentication, browsing, and bookings.
 *
 * Test scenarios:
 * 1. Ramp up to 50 users over 2 minutes
 * 2. Stay at 50 users for 5 minutes
 * 3. Ramp up to 100 users over 2 minutes
 * 4. Stay at 100 users for 5 minutes
 * 5. Ramp down to 0 over 2 minutes
 *
 * Usage:
 *   k6 run api-load-test.js
 *   k6 run --vus 100 --duration 10m api-load-test.js
 *   k6 run --env BASE_URL=https://api.liyaqa.com api-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TENANT_ID = __ENV.TENANT_ID || 'test-tenant';

// ============================================================================
// Custom Metrics
// ============================================================================

const loginSuccessRate = new Rate('login_success');
const apiErrorRate = new Rate('api_errors');
const bookingSuccessRate = new Rate('booking_success');
const apiResponseTime = new Trend('api_response_time');
const dbQueryTime = new Trend('db_query_time');
const authFailures = new Counter('auth_failures');

// ============================================================================
// Test Configuration
// ============================================================================

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0
  ],

  thresholds: {
    // 95% of requests must complete below 500ms
    'http_req_duration': ['p(95)<500'],

    // 99% of requests must complete below 1000ms
    'http_req_duration{name:api}': ['p(99)<1000'],

    // Error rate must be below 1%
    'http_req_failed': ['rate<0.01'],

    // API error rate below 1%
    'api_errors': ['rate<0.01'],

    // Login success rate above 99%
    'login_success': ['rate>0.99'],

    // Booking success rate above 95%
    'booking_success': ['rate>0.95'],

    // Check success rate above 95%
    'checks': ['rate>0.95'],
  },

  // Test metadata
  tags: {
    test_type: 'load',
    environment: __ENV.ENVIRONMENT || 'dev',
  },

  // HTTP configuration
  noConnectionReuse: false,
  userAgent: 'k6-load-test/1.0',
};

// ============================================================================
// Test Data
// ============================================================================

const testUsers = [
  { email: 'admin@test.com', password: 'Test123!@#', role: 'ADMIN' },
  { email: 'trainer@test.com', password: 'Test123!@#', role: 'TRAINER' },
  { email: 'member@test.com', password: 'Test123!@#', role: 'MEMBER' },
];

// ============================================================================
// Helper Functions
// ============================================================================

function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function makeRequest(method, url, body = null, params = {}) {
  const defaultParams = {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID,
    },
    tags: { name: 'api' },
  };

  const mergedParams = Object.assign({}, defaultParams, params);

  let response;
  const startTime = Date.now();

  if (method === 'GET') {
    response = http.get(url, mergedParams);
  } else if (method === 'POST') {
    response = http.post(url, JSON.stringify(body), mergedParams);
  } else if (method === 'PUT') {
    response = http.put(url, JSON.stringify(body), mergedParams);
  } else if (method === 'DELETE') {
    response = http.del(url, null, mergedParams);
  }

  const duration = Date.now() - startTime;
  apiResponseTime.add(duration);

  // Track errors
  if (response.status >= 400) {
    apiErrorRate.add(1);
  } else {
    apiErrorRate.add(0);
  }

  return response;
}

function authenticate(user) {
  const loginRes = makeRequest('POST', `${BASE_URL}/api/auth/login`, {
    email: user.email,
    password: user.password,
  }, { tags: { name: 'login' } });

  const success = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has access token': (r) => r.json('accessToken') !== undefined,
  });

  loginSuccessRate.add(success);

  if (!success) {
    authFailures.add(1);
    return null;
  }

  return loginRes.json('accessToken');
}

// ============================================================================
// Test Scenarios
// ============================================================================

export default function () {
  const user = getRandomUser();

  // ========================================
  // Scenario 1: Authentication Flow
  // ========================================
  group('Authentication', () => {
    const token = authenticate(user);

    if (!token) {
      console.error(`Authentication failed for ${user.email}`);
      return;
    }

    // Store token for subsequent requests
    __VU.token = token;
  });

  sleep(1);

  // ========================================
  // Scenario 2: Member Management
  // ========================================
  if (user.role === 'ADMIN') {
    group('Member Management', () => {
      // List members
      const membersRes = makeRequest('GET', `${BASE_URL}/api/members?page=0&size=20`, null, {
        headers: {
          'Authorization': `Bearer ${__VU.token}`,
          'X-Tenant-Id': TENANT_ID,
        },
      });

      check(membersRes, {
        'members list status is 200': (r) => r.status === 200,
        'members list has content': (r) => r.json('content') !== undefined,
        'members list response time < 300ms': (r) => r.timings.duration < 300,
      });

      sleep(0.5);

      // Get member details (if any exist)
      if (membersRes.status === 200 && membersRes.json('content').length > 0) {
        const memberId = membersRes.json('content')[0].id;

        const memberRes = makeRequest('GET', `${BASE_URL}/api/members/${memberId}`, null, {
          headers: {
            'Authorization': `Bearer ${__VU.token}`,
            'X-Tenant-Id': TENANT_ID,
          },
        });

        check(memberRes, {
          'member details status is 200': (r) => r.status === 200,
          'member has id': (r) => r.json('id') !== undefined,
        });
      }
    });

    sleep(1);
  }

  // ========================================
  // Scenario 3: Class Browsing
  // ========================================
  group('Class Browsing', () => {
    // List classes
    const classesRes = makeRequest('GET', `${BASE_URL}/api/classes?page=0&size=20`, null, {
      headers: {
        'Authorization': `Bearer ${__VU.token}`,
        'X-Tenant-Id': TENANT_ID,
      },
    });

    check(classesRes, {
      'classes list status is 200': (r) => r.status === 200,
      'classes list response time < 300ms': (r) => r.timings.duration < 300,
    });

    sleep(0.5);

    // Get active classes
    const activeClassesRes = makeRequest('GET', `${BASE_URL}/api/classes/active`, null, {
      headers: {
        'Authorization': `Bearer ${__VU.token}`,
        'X-Tenant-Id': TENANT_ID,
      },
    });

    check(activeClassesRes, {
      'active classes status is 200': (r) => r.status === 200,
    });
  });

  sleep(1);

  // ========================================
  // Scenario 4: Lead Management
  // ========================================
  if (user.role === 'ADMIN') {
    group('Lead Management', () => {
      // List leads
      const leadsRes = makeRequest('GET', `${BASE_URL}/api/leads?page=0&size=20`, null, {
        headers: {
          'Authorization': `Bearer ${__VU.token}`,
          'X-Tenant-Id': TENANT_ID,
        },
      });

      check(leadsRes, {
        'leads list status is 200': (r) => r.status === 200,
        'leads list response time < 400ms': (r) => r.timings.duration < 400,
      });

      sleep(0.5);

      // Create a lead (occasionally)
      if (Math.random() < 0.2) { // 20% of the time
        const newLead = {
          name: `Test Lead ${Date.now()}`,
          email: `lead-${Date.now()}@test.com`,
          phone: '+966501234567',
          source: 'WALK_IN',
          priority: 'MEDIUM',
        };

        const createLeadRes = makeRequest('POST', `${BASE_URL}/api/leads`, newLead, {
          headers: {
            'Authorization': `Bearer ${__VU.token}`,
            'X-Tenant-Id': TENANT_ID,
          },
        });

        check(createLeadRes, {
          'lead creation status is 200 or 201': (r) => [200, 201].includes(r.status),
        });
      }
    });

    sleep(1);
  }

  // ========================================
  // Scenario 5: Booking Flow (Members)
  // ========================================
  if (user.role === 'MEMBER') {
    group('Booking Flow', () => {
      // Get available classes
      const classesRes = makeRequest('GET', `${BASE_URL}/api/classes/active`, null, {
        headers: {
          'Authorization': `Bearer ${__VU.token}`,
          'X-Tenant-Id': TENANT_ID,
        },
      });

      if (classesRes.status === 200 && classesRes.json().length > 0) {
        const classId = classesRes.json()[0].id;

        // Attempt to book (occasionally)
        if (Math.random() < 0.3) { // 30% of the time
          const bookingRes = makeRequest('POST', `${BASE_URL}/api/bookings`, {
            classId: classId,
            sessionId: `session-${Date.now()}`,
          }, {
            headers: {
              'Authorization': `Bearer ${__VU.token}`,
              'X-Tenant-Id': TENANT_ID,
            },
          });

          const success = check(bookingRes, {
            'booking status is 200 or 201 or 409': (r) => [200, 201, 409].includes(r.status),
          });

          bookingSuccessRate.add(success ? 1 : 0);
        }
      }

      sleep(0.5);

      // View my bookings
      const myBookingsRes = makeRequest('GET', `${BASE_URL}/api/bookings/my-bookings`, null, {
        headers: {
          'Authorization': `Bearer ${__VU.token}`,
          'X-Tenant-Id': TENANT_ID,
        },
      });

      check(myBookingsRes, {
        'my bookings status is 200': (r) => r.status === 200,
      });
    });

    sleep(1);
  }

  // ========================================
  // Scenario 6: Health Checks
  // ========================================
  group('Health Checks', () => {
    const healthRes = makeRequest('GET', `${BASE_URL}/api/health`, null, {
      tags: { name: 'health' },
    });

    check(healthRes, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 100ms': (r) => r.timings.duration < 100,
    });
  });

  // Think time between iterations
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}

// ============================================================================
// Lifecycle Hooks
// ============================================================================

export function setup() {
  console.log('Starting load test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Tenant ID: ${TENANT_ID}`);
  console.log('');

  // Verify backend is accessible
  const healthRes = http.get(`${BASE_URL}/api/health`);
  if (healthRes.status !== 200) {
    throw new Error(`Backend not accessible: ${healthRes.status}`);
  }

  console.log('✓ Backend is accessible');
  return {};
}

export function teardown(data) {
  console.log('');
  console.log('Load test completed!');
}

// ============================================================================
// Summary Handler
// ============================================================================

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: '  ', enableColors: true }),
    'summary.json': JSON.stringify(data),
    'summary.html': htmlReport(data),
  };
}

// Simple text summary
function textSummary(data, options) {
  const indent = options.indent || '';
  const lines = [];

  lines.push('');
  lines.push(indent + '═══════════════════════════════════════════');
  lines.push(indent + '  Load Test Summary');
  lines.push(indent + '═══════════════════════════════════════════');
  lines.push('');

  // Requests
  const requests = data.metrics.http_reqs;
  if (requests) {
    lines.push(indent + `Total Requests: ${requests.values.count}`);
    lines.push(indent + `Request Rate: ${requests.values.rate.toFixed(2)}/s`);
  }

  // Duration
  const duration = data.metrics.http_req_duration;
  if (duration) {
    lines.push('');
    lines.push(indent + 'Response Times:');
    lines.push(indent + `  Average: ${duration.values.avg.toFixed(2)}ms`);
    lines.push(indent + `  Median:  ${duration.values.med.toFixed(2)}ms`);
    lines.push(indent + `  95th:    ${duration.values['p(95)'].toFixed(2)}ms`);
    lines.push(indent + `  99th:    ${duration.values['p(99)'].toFixed(2)}ms`);
    lines.push(indent + `  Max:     ${duration.values.max.toFixed(2)}ms`);
  }

  // Error rate
  const failed = data.metrics.http_req_failed;
  if (failed) {
    const errorRate = (failed.values.rate * 100).toFixed(2);
    lines.push('');
    lines.push(indent + `Error Rate: ${errorRate}%`);
  }

  // Custom metrics
  if (data.metrics.login_success) {
    const loginRate = (data.metrics.login_success.values.rate * 100).toFixed(2);
    lines.push(indent + `Login Success Rate: ${loginRate}%`);
  }

  lines.push('');
  lines.push(indent + '═══════════════════════════════════════════');
  lines.push('');

  return lines.join('\n');
}

// Simple HTML report
function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>k6 Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
  </style>
</head>
<body>
  <h1>k6 Load Test Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>

  <h2>Summary</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Total Requests</td><td>${data.metrics.http_reqs?.values.count || 'N/A'}</td></tr>
    <tr><td>Request Rate</td><td>${data.metrics.http_reqs?.values.rate.toFixed(2) || 'N/A'}/s</td></tr>
    <tr><td>Error Rate</td><td>${((data.metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2)}%</td></tr>
    <tr><td>Average Response Time</td><td>${data.metrics.http_req_duration?.values.avg.toFixed(2) || 'N/A'}ms</td></tr>
    <tr><td>95th Percentile</td><td>${data.metrics.http_req_duration?.values['p(95)'].toFixed(2) || 'N/A'}ms</td></tr>
  </table>

  <h2>Thresholds</h2>
  <table>
    <tr><th>Threshold</th><th>Status</th></tr>
    ${Object.entries(data.root_group.checks || {}).map(([name, value]) => `
      <tr>
        <td>${name}</td>
        <td class="${value.passes === value.fails + value.passes ? 'pass' : 'fail'}">
          ${value.passes}/${value.fails + value.passes}
        </td>
      </tr>
    `).join('')}
  </table>
</body>
</html>
  `;
}
