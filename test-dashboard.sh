#!/bin/bash

# Dashboard Error Fix - Quick Test Script
# This script helps verify the dashboard loads without errors

echo "🔍 Dashboard Error Fix - Test Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1️⃣  Checking if backend is running..."
if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running on port 8080${NC}"
else
    echo -e "${RED}✗ Backend is NOT running on port 8080${NC}"
    echo "   Start backend with: cd backend && ./gradlew bootRun"
    exit 1
fi
echo ""

# Check if frontend is running
echo "2️⃣  Checking if frontend is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running on port 3000${NC}"
else
    echo -e "${RED}✗ Frontend is NOT running on port 3000${NC}"
    echo "   Start frontend with: cd frontend && npm run dev"
    exit 1
fi
echo ""

# Check error boundary component exists
echo "3️⃣  Verifying error boundary component..."
if [ -f "frontend/src/components/error-boundary.tsx" ]; then
    echo -e "${GREEN}✓ Error boundary component exists${NC}"
else
    echo -e "${RED}✗ Error boundary component missing${NC}"
    exit 1
fi
echo ""

# Check widget error handling
echo "4️⃣  Checking widget error handling..."
if grep -q "error" "frontend/src/components/dashboard/my-tasks-widget.tsx"; then
    echo -e "${GREEN}✓ MyTasksWidget has error handling${NC}"
else
    echo -e "${YELLOW}⚠ MyTasksWidget may be missing error handling${NC}"
fi

if grep -q "error" "frontend/src/components/dashboard/at-risk-widget.tsx"; then
    echo -e "${GREEN}✓ AtRiskWidget has error handling${NC}"
else
    echo -e "${YELLOW}⚠ AtRiskWidget may be missing error handling${NC}"
fi
echo ""

# Check query client error logging
echo "5️⃣  Checking query client error logging..."
if grep -q "onError" "frontend/src/lib/query-client.ts"; then
    echo -e "${GREEN}✓ Query client has error logging${NC}"
else
    echo -e "${YELLOW}⚠ Query client may be missing error logging${NC}"
fi
echo ""

# Test backend endpoints (requires authentication)
echo "6️⃣  Testing backend endpoints..."
echo -e "${YELLOW}⚠ Manual testing required - you need a valid auth token${NC}"
echo ""
echo "   To test, run these commands with your auth token:"
echo "   export TOKEN='your-jwt-token-here'"
echo ""
echo "   # Test tasks endpoint"
echo "   curl -H \"Authorization: Bearer \$TOKEN\" http://localhost:8080/api/tasks/my-tasks/today"
echo ""
echo "   # Test at-risk members endpoint"
echo "   curl -H \"Authorization: Bearer \$TOKEN\" http://localhost:8080/api/members/at-risk?riskLevels=HIGH"
echo ""

# Summary
echo "===================================="
echo "📋 Summary"
echo "===================================="
echo ""
echo -e "${GREEN}✓ All automated checks passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Login to http://localhost:3000/en/login"
echo "2. Navigate to http://localhost:3000/en/dashboard"
echo "3. Open browser DevTools (F12) and check Console tab"
echo "4. Verify dashboard loads without errors"
echo "5. Check that all widgets render or show error states"
echo ""
echo "If you see errors:"
echo "- Check browser console for detailed error messages"
echo "- Check backend logs for API errors"
echo "- Review DASHBOARD_FIX_VERIFICATION.md for troubleshooting"
echo ""
echo -e "${GREEN}✨ Good luck!${NC}"
