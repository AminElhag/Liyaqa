#!/bin/bash
################################################################################
# Prometheus Alert Rules Validation Script
#
# This script validates Prometheus alert rules for syntax errors and best
# practices before deployment.
#
# Usage:
#   ./validate-alerts.sh [alerts.yml]
#
# Requirements:
#   - promtool (from Prometheus)
#
# Exit codes:
#   0 - All validations passed
#   1 - Validation failed
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default alert file
ALERT_FILE="${1:-alerts.yml}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Prometheus Alert Rules Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Change to script directory
cd "$SCRIPT_DIR"

################################################################################
# Check if promtool is installed
################################################################################
if ! command -v promtool &> /dev/null; then
    echo -e "${RED}✗ Error: promtool is not installed${NC}"
    echo ""
    echo "Install promtool:"
    echo "  macOS:   brew install prometheus"
    echo "  Linux:   apt-get install prometheus  # or download from prometheus.io"
    echo "  Docker:  docker run --rm -v \$(pwd):/config prom/prometheus promtool check rules /config/alerts.yml"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ promtool found:${NC} $(promtool --version | head -1)"
echo ""

################################################################################
# Check if alert file exists
################################################################################
if [ ! -f "$ALERT_FILE" ]; then
    echo -e "${RED}✗ Error: Alert file not found: $ALERT_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Alert file found:${NC} $ALERT_FILE"
echo ""

################################################################################
# Validate YAML syntax
################################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Step 1: YAML Syntax Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if promtool check rules "$ALERT_FILE"; then
    echo ""
    echo -e "${GREEN}✓ YAML syntax is valid${NC}"
else
    echo ""
    echo -e "${RED}✗ YAML syntax validation failed${NC}"
    exit 1
fi

echo ""

################################################################################
# Count alerts
################################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Step 2: Alert Statistics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Count groups
GROUP_COUNT=$(grep -c "^  - name:" "$ALERT_FILE" || true)
echo "Alert groups: $GROUP_COUNT"

# Count total alerts
ALERT_COUNT=$(grep -c "^      - alert:" "$ALERT_FILE" || true)
echo "Total alerts: $ALERT_COUNT"

# Count by severity
CRITICAL_COUNT=$(grep -A 5 "^      - alert:" "$ALERT_FILE" | grep "severity: critical" | wc -l | tr -d ' ')
WARNING_COUNT=$(grep -A 5 "^      - alert:" "$ALERT_FILE" | grep "severity: warning" | wc -l | tr -d ' ')

echo "  - Critical: $CRITICAL_COUNT"
echo "  - Warning: $WARNING_COUNT"

echo ""

################################################################################
# Validate alert best practices
################################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Step 3: Best Practices Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

VALIDATION_PASSED=true

# Extract alert names
ALERT_NAMES=$(grep "^      - alert:" "$ALERT_FILE" | awk '{print $3}')

for ALERT_NAME in $ALERT_NAMES; do
    echo "Validating: $ALERT_NAME"

    # Extract alert block
    ALERT_BLOCK=$(awk "/alert: $ALERT_NAME/,/^      - alert:|^  - name:/" "$ALERT_FILE")

    # Check 1: Has 'for' duration
    if ! echo "$ALERT_BLOCK" | grep -q "for:"; then
        echo -e "  ${YELLOW}⚠ Warning: No 'for' duration specified${NC}"
    fi

    # Check 2: Has severity label
    if ! echo "$ALERT_BLOCK" | grep -q "severity:"; then
        echo -e "  ${RED}✗ Error: No severity label${NC}"
        VALIDATION_PASSED=false
    fi

    # Check 3: Has summary annotation
    if ! echo "$ALERT_BLOCK" | grep -q "summary:"; then
        echo -e "  ${YELLOW}⚠ Warning: No summary annotation${NC}"
    fi

    # Check 4: Has description annotation
    if ! echo "$ALERT_BLOCK" | grep -q "description:"; then
        echo -e "  ${YELLOW}⚠ Warning: No description annotation${NC}"
    fi

    # Check 5: Critical alerts have runbook
    if echo "$ALERT_BLOCK" | grep -q "severity: critical"; then
        if ! echo "$ALERT_BLOCK" | grep -q "runbook:"; then
            echo -e "  ${YELLOW}⚠ Warning: Critical alert missing runbook link${NC}"
        fi
    fi

    echo ""
done

if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}✓ Best practices validation passed${NC}"
else
    echo -e "${RED}✗ Best practices validation failed${NC}"
    exit 1
fi

echo ""

################################################################################
# Validate PromQL expressions
################################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Step 4: PromQL Expression Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Note: This requires a running Prometheus instance
# Skip if Prometheus is not running

if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo "Testing PromQL expressions against Prometheus..."
    echo ""

    PROMQL_PASSED=true

    for ALERT_NAME in $ALERT_NAMES; do
        # Extract expression (this is simplified - actual implementation would be more robust)
        EXPR=$(awk "/alert: $ALERT_NAME/,/^      - alert:|^  - name:/" "$ALERT_FILE" | grep "expr:" -A 5 | grep -v "expr:" | grep -v "for:" | sed 's/^[[:space:]]*//' | tr -d '\n')

        if [ -n "$EXPR" ]; then
            echo -n "Testing $ALERT_NAME... "

            # Validate expression syntax via Prometheus API
            ENCODED_EXPR=$(echo "$EXPR" | jq -sRr @uri)
            RESPONSE=$(curl -s "http://localhost:9090/api/v1/query?query=$ENCODED_EXPR" | jq -r '.status')

            if [ "$RESPONSE" = "success" ]; then
                echo -e "${GREEN}✓${NC}"
            else
                echo -e "${RED}✗ Invalid PromQL${NC}"
                PROMQL_PASSED=false
            fi
        fi
    done

    echo ""

    if [ "$PROMQL_PASSED" = true ]; then
        echo -e "${GREEN}✓ PromQL validation passed${NC}"
    else
        echo -e "${RED}✗ PromQL validation failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Skipping PromQL validation: Prometheus not running${NC}"
    echo "  Start Prometheus to enable PromQL validation:"
    echo "  docker-compose -f docker-compose.monitoring.yml up -d prometheus"
fi

echo ""

################################################################################
# Summary
################################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✓ All validations passed!${NC}"
echo ""
echo "Alert file is ready for deployment:"
echo "  1. Commit changes to version control"
echo "  2. Deploy to staging for testing"
echo "  3. Trigger test alerts to verify routing"
echo "  4. Deploy to production"
echo ""
echo "Reload Prometheus configuration:"
echo "  curl -X POST http://localhost:9090/-/reload"
echo ""
echo "  OR"
echo ""
echo "  docker-compose -f docker-compose.monitoring.yml restart prometheus"
echo ""

exit 0
