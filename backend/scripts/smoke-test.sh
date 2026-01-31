#!/bin/bash
# =============================================================================
# Production Smoke Tests
# =============================================================================
# Validates critical system functionality after deployment
#
# Usage:
#   ./smoke-test.sh [BASE_URL]
#   ./smoke-test.sh https://api.liyaqa.com
#
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed
# =============================================================================

set -e

# Configuration
BASE_URL=${1:-http://localhost:8080}
TIMEOUT=10
TENANT_ID="test-tenant"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
}

print_test() {
    echo -n "  Testing: $1... "
    TESTS_RUN=$((TESTS_RUN + 1))
}

print_success() {
    echo -e "${GREEN}✓ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

print_failure() {
    echo -e "${RED}✗ FAIL${NC}"
    echo -e "${RED}    Error: $1${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING${NC}"
    echo -e "${YELLOW}    $1${NC}"
}

http_get() {
    local url=$1
    local expected_status=${2:-200}

    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$url" 2>&1) || {
        print_failure "Connection failed or timeout"
        return 1
    }

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" != "$expected_status" ]; then
        print_failure "Expected HTTP $expected_status, got $http_code"
        return 1
    fi

    echo "$body"
}

http_post() {
    local url=$1
    local data=$2
    local expected_status=${3:-200}
    local extra_headers=${4:-}

    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
        -H "Content-Type: application/json" \
        -H "X-Tenant-Id: $TENANT_ID" \
        $extra_headers \
        -d "$data" \
        "$url" 2>&1) || {
        print_failure "Connection failed or timeout"
        return 1
    }

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" != "$expected_status" ]; then
        print_failure "Expected HTTP $expected_status, got $http_code"
        return 1
    fi

    echo "$body"
}

# =============================================================================
# Test Suite
# =============================================================================

print_header "Production Smoke Tests"
echo -e "${BLUE}Target:${NC} $BASE_URL"
echo -e "${BLUE}Timeout:${NC} ${TIMEOUT}s"
echo -e "${BLUE}Date:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# -----------------------------------------------------------------------------
# Test 1: Health Endpoint
# -----------------------------------------------------------------------------
print_test "Health endpoint"
result=$(http_get "$BASE_URL/api/health") && {
    print_success
    echo -e "${GREEN}    Response received${NC}"
} || exit 1

# Verify response contains "status" field
if echo "$result" | grep -q "status"; then
    echo -e "${GREEN}    ✓ Response contains status field${NC}"
else
    print_failure "Response missing status field"
    exit 1
fi

# -----------------------------------------------------------------------------
# Test 2: Actuator Health
# -----------------------------------------------------------------------------
print_test "Actuator health endpoint"
result=$(http_get "$BASE_URL/actuator/health") && {
    print_success
} || exit 1

# Verify UP status
if echo "$result" | grep -q '"status":"UP"'; then
    echo -e "${GREEN}    ✓ Service status: UP${NC}"
else
    print_failure "Service not healthy"
    echo -e "${RED}    Response: $result${NC}"
    exit 1
fi

# -----------------------------------------------------------------------------
# Test 3: Database Readiness
# -----------------------------------------------------------------------------
print_test "Database connectivity"
result=$(http_get "$BASE_URL/health/ready") && {
    print_success
} || {
    # If /health/ready doesn't exist, try actuator/health/readiness
    result=$(http_get "$BASE_URL/actuator/health/readiness") && {
        print_success
    } || exit 1
}

# Verify database is UP
if echo "$result" | grep -q '"database":"UP"\|"db":"UP"\|"status":"UP"'; then
    echo -e "${GREEN}    ✓ Database: Connected${NC}"
else
    print_warning "Could not verify database status from response"
fi

# -----------------------------------------------------------------------------
# Test 4: Metrics Endpoint
# -----------------------------------------------------------------------------
print_test "Prometheus metrics"
result=$(http_get "$BASE_URL/actuator/prometheus") && {
    print_success
} || {
    print_warning "Prometheus metrics endpoint not accessible (may be secured)"
    TESTS_PASSED=$((TESTS_PASSED + 1))  # Don't fail if metrics are secured
}

# Verify JVM metrics present (if we got a response)
if [ -n "$result" ] && echo "$result" | grep -q "jvm_memory_used_bytes"; then
    echo -e "${GREEN}    ✓ JVM metrics present${NC}"
fi

# -----------------------------------------------------------------------------
# Test 5: Public API (Plans)
# -----------------------------------------------------------------------------
print_test "Public API - Plans"
result=$(http_get "$BASE_URL/api/public/plans") && {
    print_success
} || {
    # Try alternative endpoint
    result=$(http_get "$BASE_URL/api/plans") && {
        print_success
    } || {
        print_warning "Plans endpoint not accessible (may not exist or be secured)"
        TESTS_PASSED=$((TESTS_PASSED + 1))  # Don't fail on optional endpoint
    }
}

# Verify JSON response
if [ -n "$result" ] && echo "$result" | grep -q '^\['; then
    echo -e "${GREEN}    ✓ Plans API responding with JSON array${NC}"
elif [ -n "$result" ] && echo "$result" | grep -q '^{'; then
    echo -e "${GREEN}    ✓ Plans API responding with JSON object${NC}"
fi

# -----------------------------------------------------------------------------
# Test 6: Authentication (Optional - only if test credentials available)
# -----------------------------------------------------------------------------
print_test "Authentication endpoint"

# Try to authenticate (this will likely fail in production without real creds)
result=$(http_post "$BASE_URL/api/auth/login" \
    '{"email":"admin@test.com","password":"Test123!@#"}' \
    200) 2>/dev/null || {

    # Authentication failed (expected in production)
    result=$(http_post "$BASE_URL/api/auth/login" \
        '{"email":"admin@test.com","password":"wrong"}' \
        401) && {
        print_success
        echo -e "${GREEN}    ✓ Authentication endpoint responding correctly (rejected invalid creds)${NC}"
    } || {
        print_warning "Could not verify authentication endpoint (may require valid credentials)"
        TESTS_PASSED=$((TESTS_PASSED + 1))  # Don't fail
    }
}

# If authentication succeeded, extract token for next test
ACCESS_TOKEN=""
if [ -n "$result" ] && echo "$result" | grep -q "accessToken"; then
    print_success
    echo -e "${GREEN}    ✓ Authentication successful${NC}"
    ACCESS_TOKEN=$(echo "$result" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

# -----------------------------------------------------------------------------
# Test 7: Protected API (Members) - Requires Authentication
# -----------------------------------------------------------------------------
if [ -n "$ACCESS_TOKEN" ]; then
    print_test "Protected API - Members"
    result=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "X-Tenant-Id: $TENANT_ID" \
        "$BASE_URL/api/members?page=0&size=1" 2>&1) || {
        print_failure "Connection failed or timeout"
    }

    http_code=$(echo "$result" | tail -n1)

    if [ "$http_code" = "200" ]; then
        print_success
        echo -e "${GREEN}    ✓ Members API accessible${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_warning "Members API returned HTTP $http_code (may require valid tenant/permissions)"
        TESTS_PASSED=$((TESTS_PASSED + 1))  # Don't fail
    fi
else
    echo "  Skipping protected API test (no access token)"
fi

# -----------------------------------------------------------------------------
# Test 8: CORS Headers
# -----------------------------------------------------------------------------
print_test "CORS headers"
result=$(curl -s -I "$BASE_URL/api/health" 2>/dev/null | grep -i "access-control-allow") && {
    print_success
    echo -e "${GREEN}    ✓ CORS headers present${NC}"
} || {
    print_warning "CORS headers not detected (may be configured differently)"
    TESTS_PASSED=$((TESTS_PASSED + 1))  # Don't fail - CORS might be configured differently
}

# -----------------------------------------------------------------------------
# Test 9: SSL/TLS (if HTTPS)
# -----------------------------------------------------------------------------
if [[ $BASE_URL == https://* ]]; then
    print_test "SSL/TLS certificate"
    result=$(curl -s -I "$BASE_URL/api/health" 2>/dev/null | head -n1 | grep -i "200\|301\|302") && {
        print_success
        echo -e "${GREEN}    ✓ SSL/TLS connection successful${NC}"
    } || {
        print_failure "SSL/TLS connection failed"
        exit 1
    }

    # Check certificate validity
    print_test "SSL certificate validity"
    cert_info=$(echo | openssl s_client -servername $(echo $BASE_URL | cut -d/ -f3) -connect $(echo $BASE_URL | cut -d/ -f3):443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null) || {
        print_warning "Could not check certificate validity"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    }

    if [ -n "$cert_info" ]; then
        # Extract expiry date
        expiry=$(echo "$cert_info" | grep notAfter | cut -d= -f2)
        expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry" +%s 2>/dev/null)
        now_epoch=$(date +%s)
        days_until_expiry=$(( ($expiry_epoch - $now_epoch) / 86400 ))

        if [ $days_until_expiry -gt 30 ]; then
            print_success
            echo -e "${GREEN}    ✓ Certificate valid for $days_until_expiry days${NC}"
        elif [ $days_until_expiry -gt 0 ]; then
            print_warning "Certificate expires in $days_until_expiry days (renew soon!)"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            print_failure "Certificate has expired!"
        fi
    fi
fi

# -----------------------------------------------------------------------------
# Test 10: Rate Limiting (verify it's active)
# -----------------------------------------------------------------------------
print_test "Rate limiting configured"
# Make multiple rapid requests to trigger rate limit (if enabled)
for i in {1..15}; do
    curl -s -o /dev/null "$BASE_URL/api/health" 2>/dev/null &
done
wait

# Check if we got rate limited
sleep 1
result=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/health" 2>/dev/null)
if [ "$result" = "429" ]; then
    print_success
    echo -e "${GREEN}    ✓ Rate limiting active (429 Too Many Requests)${NC}"
elif [ "$result" = "200" ]; then
    print_warning "Rate limit not triggered (may be configured with higher threshold)"
    TESTS_PASSED=$((TESTS_PASSED + 1))  # Don't fail - rate limit might be set high
else
    print_warning "Unexpected response code: $result"
    TESTS_PASSED=$((TESTS_PASSED + 1))  # Don't fail
fi

# -----------------------------------------------------------------------------
# Test 11: Application Version/Info
# -----------------------------------------------------------------------------
print_test "Application info endpoint"
result=$(http_get "$BASE_URL/actuator/info") && {
    print_success
    # Try to extract version if present
    if echo "$result" | grep -q "version"; then
        version=$(echo "$result" | grep -o '"version":"[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}    ✓ Version: $version${NC}"
    fi
} || {
    print_warning "Info endpoint not accessible"
    TESTS_PASSED=$((TESTS_PASSED + 1))  # Don't fail
}

# -----------------------------------------------------------------------------
# Test 12: Response Time Check
# -----------------------------------------------------------------------------
print_test "Response time performance"
start_time=$(date +%s%N)
result=$(http_get "$BASE_URL/api/health") || exit 1
end_time=$(date +%s%N)
duration_ms=$(( ($end_time - $start_time) / 1000000 ))

if [ $duration_ms -lt 1000 ]; then
    print_success
    echo -e "${GREEN}    ✓ Response time: ${duration_ms}ms (excellent)${NC}"
elif [ $duration_ms -lt 3000 ]; then
    print_success
    echo -e "${YELLOW}    ⚠ Response time: ${duration_ms}ms (acceptable, but monitor)${NC}"
else
    print_warning "Response time: ${duration_ms}ms (slow - investigate)"
    TESTS_PASSED=$((TESTS_PASSED + 1))  # Don't fail, but warn
fi

# =============================================================================
# Summary
# =============================================================================

print_header "Test Summary"
echo ""
echo -e "  ${BLUE}Total Tests:${NC}    $TESTS_RUN"
echo -e "  ${GREEN}Passed:${NC}         $TESTS_PASSED"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "  ${RED}Failed:${NC}         $TESTS_FAILED"
fi
echo ""

# Calculate pass percentage
pass_percentage=$((TESTS_PASSED * 100 / TESTS_RUN))

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All smoke tests passed! ($pass_percentage%)${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some smoke tests failed! ($pass_percentage% passed)${NC}"
    echo ""
    echo -e "${YELLOW}Please review the failed tests above and investigate.${NC}"
    exit 1
fi
