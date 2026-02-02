#!/bin/bash
################################################################################
# Prometheus Configuration Reload Script
#
# This script safely reloads Prometheus configuration without downtime.
# It validates the configuration before reloading.
#
# Usage:
#   ./reload-config.sh
#
# Exit codes:
#   0 - Reload successful
#   1 - Validation failed or reload error
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Prometheus Configuration Reload"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

################################################################################
# Step 1: Validate configuration files
################################################################################
echo "Step 1: Validating configuration files..."
echo ""

cd "$SCRIPT_DIR"

# Validate prometheus.yml
if [ -f "../prometheus.yml" ]; then
    echo -n "  Validating prometheus.yml... "
    if promtool check config ../prometheus.yml > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        echo ""
        promtool check config ../prometheus.yml
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Warning: prometheus.yml not found${NC}"
fi

# Validate alert rules
if [ -f "alerts.yml" ]; then
    echo -n "  Validating alerts.yml... "
    if promtool check rules alerts.yml > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        echo ""
        promtool check rules alerts.yml
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Warning: alerts.yml not found${NC}"
fi

echo ""
echo -e "${GREEN}✓ Configuration validation passed${NC}"
echo ""

################################################################################
# Step 2: Check Prometheus health
################################################################################
echo "Step 2: Checking Prometheus health..."
echo ""

if ! curl -sf "$PROMETHEUS_URL/-/healthy" > /dev/null; then
    echo -e "${RED}✗ Prometheus is not healthy or not reachable${NC}"
    echo "  URL: $PROMETHEUS_URL"
    echo ""
    echo "Make sure Prometheus is running:"
    echo "  docker-compose -f docker-compose.monitoring.yml ps prometheus"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Prometheus is healthy${NC}"
echo ""

################################################################################
# Step 3: Reload configuration
################################################################################
echo "Step 3: Reloading Prometheus configuration..."
echo ""

# Trigger reload via API
RELOAD_RESPONSE=$(curl -sf -X POST "$PROMETHEUS_URL/-/reload" -w "\n%{http_code}" | tail -n 1)

if [ "$RELOAD_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Configuration reloaded successfully${NC}"
else
    echo -e "${RED}✗ Reload failed with HTTP status: $RELOAD_RESPONSE${NC}"
    exit 1
fi

echo ""

################################################################################
# Step 4: Verify reload
################################################################################
echo "Step 4: Verifying reload..."
echo ""

# Wait a moment for reload to complete
sleep 2

# Check health again
if curl -sf "$PROMETHEUS_URL/-/healthy" > /dev/null; then
    echo -e "${GREEN}✓ Prometheus is still healthy after reload${NC}"
else
    echo -e "${RED}✗ Prometheus health check failed after reload${NC}"
    exit 1
fi

# Check if alerts are loaded
ALERTS_COUNT=$(curl -sf "$PROMETHEUS_URL/api/v1/rules" | jq -r '.data.groups[].rules[] | select(.type=="alerting") | .name' | wc -l | tr -d ' ')

if [ "$ALERTS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Alert rules loaded:${NC} $ALERTS_COUNT alerts"
else
    echo -e "${YELLOW}⚠ Warning: No alert rules found${NC}"
fi

echo ""

################################################################################
# Summary
################################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Reload Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✓ Configuration reloaded successfully!${NC}"
echo ""
echo "Next steps:"
echo "  - View alerts: $PROMETHEUS_URL/alerts"
echo "  - View rules: $PROMETHEUS_URL/rules"
echo "  - View targets: $PROMETHEUS_URL/targets"
echo ""
echo "Monitor for issues:"
echo "  - Check Prometheus logs: docker logs liyaqa-prometheus"
echo "  - Watch for firing alerts: $PROMETHEUS_URL/alerts?search=alertstate%3Dfiring"
echo ""

exit 0
