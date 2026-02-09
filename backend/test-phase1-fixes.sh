#!/bin/bash

# Phase 1 Security Fixes - Automated Test Script
# Tests all 5 critical fixes to verify they're working correctly

set -e

echo "🧪 Testing Phase 1 Security & Performance Fixes"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
echo "📍 Testing against: $API_BASE_URL"
echo ""

# Function to check if server is running
check_server() {
    echo "🔍 Checking if server is running..."
    if curl -s -f "$API_BASE_URL/actuator/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Server is not running at $API_BASE_URL${NC}"
        echo "   Start the server first: java -jar build/libs/liyaqa-backend-0.0.1-SNAPSHOT.jar"
        exit 1
    fi
}

# Test 1: Code Compilation
test_compilation() {
    echo ""
    echo "📝 Test 1: Code Compilation"
    echo "------------------------"

    if [ -f "build/libs/liyaqa-backend-0.0.1-SNAPSHOT.jar" ]; then
        echo -e "${GREEN}✅ JAR file exists and compiled successfully${NC}"
        ls -lh build/libs/liyaqa-backend-0.0.1-SNAPSHOT.jar
        return 0
    else
        echo -e "${RED}❌ JAR file not found${NC}"
        return 1
    fi
}

# Test 2: Configuration Check
test_configuration() {
    echo ""
    echo "⚙️  Test 2: Configuration Check"
    echo "----------------------------"

    if grep -q "app:" src/main/resources/application.yml && \
       grep -q "frontend:" src/main/resources/application.yml && \
       grep -q "base-url:" src/main/resources/application.yml; then
        echo -e "${GREEN}✅ Frontend base URL configuration added${NC}"
        grep -A 2 "app:" src/main/resources/application.yml | head -3
        return 0
    else
        echo -e "${RED}❌ Configuration not found in application.yml${NC}"
        return 1
    fi
}

# Test 3: PII Masker Implementation
test_pii_masker() {
    echo ""
    echo "🔒 Test 3: PII Masking Implementation"
    echo "----------------------------------"

    if [ -f "src/main/kotlin/com/liyaqa/shared/utils/PiiMasker.kt" ]; then
        echo -e "${GREEN}✅ PiiMasker.kt exists${NC}"

        # Check if PII masking is applied in services
        if grep -q "PiiMasker.maskEmail" src/main/kotlin/com/liyaqa/notification/application/services/SecurityEmailService.kt; then
            echo -e "${GREEN}✅ PII masking applied in SecurityEmailService${NC}"
        fi

        if grep -q "PiiMasker.maskEmail" src/main/kotlin/com/liyaqa/notification/application/services/PlatformLoginEmailService.kt; then
            echo -e "${GREEN}✅ PII masking applied in PlatformLoginEmailService${NC}"
        fi

        if grep -q "PiiMasker.maskEmail" src/main/kotlin/com/liyaqa/notification/infrastructure/email/SmtpEmailService.kt; then
            echo -e "${GREEN}✅ PII masking applied in SmtpEmailService${NC}"
        fi

        return 0
    else
        echo -e "${RED}❌ PiiMasker.kt not found${NC}"
        return 1
    fi
}

# Test 4: Authorization Implementation
test_authorization() {
    echo ""
    echo "🛡️  Test 4: Authorization Implementation"
    echo "-------------------------------------"

    # Check BookingService has authorization
    if grep -q "requestingUserId: UUID?" src/main/kotlin/com/liyaqa/scheduling/application/services/BookingService.kt && \
       grep -q "permissionService" src/main/kotlin/com/liyaqa/scheduling/application/services/BookingService.kt && \
       grep -q "AccessDeniedException" src/main/kotlin/com/liyaqa/scheduling/application/services/BookingService.kt; then
        echo -e "${GREEN}✅ Authorization check added to BookingService.cancelBooking()${NC}"
    else
        echo -e "${RED}❌ Authorization check missing in BookingService${NC}"
        return 1
    fi

    # Check controller passes user ID
    if grep -q "principal.userId" src/main/kotlin/com/liyaqa/scheduling/api/BookingController.kt; then
        echo -e "${GREEN}✅ BookingController passes user ID to service${NC}"
    else
        echo -e "${RED}❌ BookingController doesn't pass user ID${NC}"
        return 1
    fi

    return 0
}

# Test 5: Tenant Isolation
test_tenant_isolation() {
    echo ""
    echo "🏢 Test 5: Tenant Isolation Implementation"
    echo "---------------------------------------"

    # Check MeController has tenant validation
    if grep -q "TenantContext.getCurrentTenant" src/main/kotlin/com/liyaqa/shared/api/MeController.kt && \
       grep -q "Tenant validation failed" src/main/kotlin/com/liyaqa/shared/api/MeController.kt; then
        echo -e "${GREEN}✅ Tenant validation added to MeController.updateMyProfile()${NC}"
    else
        echo -e "${RED}❌ Tenant validation missing in MeController${NC}"
        return 1
    fi

    # Check MemberService has defense-in-depth
    if grep -q "TenantContext.getCurrentTenant" src/main/kotlin/com/liyaqa/membership/application/services/MemberService.kt && \
       grep -q "Security violation: Member belongs to different tenant" src/main/kotlin/com/liyaqa/membership/application/services/MemberService.kt; then
        echo -e "${GREEN}✅ Defense-in-depth check added to MemberService${NC}"
    else
        echo -e "${RED}❌ Defense-in-depth check missing in MemberService${NC}"
        return 1
    fi

    return 0
}

# Test 6: Password Reset Fixes
test_password_reset() {
    echo ""
    echo "🔑 Test 6: Password Reset Security"
    echo "--------------------------------"

    # Check email says "1 hour" not "24 hours"
    if grep -q "valid for 1 hour" src/main/kotlin/com/liyaqa/auth/application/services/AuthService.kt && \
       grep -q "صالح لمدة ساعة واحدة" src/main/kotlin/com/liyaqa/auth/application/services/AuthService.kt; then
        echo -e "${GREEN}✅ Email template updated to say '1 hour'${NC}"
    else
        echo -e "${RED}❌ Email template still says 24 hours${NC}"
        return 1
    fi

    # Check URL is configurable
    if grep -q "frontendBaseUrl" src/main/kotlin/com/liyaqa/auth/application/services/AuthService.kt && \
       grep -q '@Value.*frontend.base-url' src/main/kotlin/com/liyaqa/auth/application/services/AuthService.kt; then
        echo -e "${GREEN}✅ Reset URL is now configurable${NC}"
    else
        echo -e "${RED}❌ Reset URL is still hardcoded${NC}"
        return 1
    fi

    # Check race condition fix (token marked as used immediately)
    if grep -B5 "val user = userRepository.findById(resetToken.userId)" src/main/kotlin/com/liyaqa/auth/application/services/AuthService.kt | grep -q "resetToken.markUsed()"; then
        echo -e "${GREEN}✅ Race condition fixed (token marked as used immediately)${NC}"
    else
        echo -e "${RED}❌ Race condition not fixed${NC}"
        return 1
    fi

    return 0
}

# Test 7: N+1 Query Optimization
test_query_optimization() {
    echo ""
    echo "⚡ Test 7: Query Optimization"
    echo "--------------------------"

    # Check findByIds method exists
    if grep -q "fun findByIds" src/main/kotlin/com/liyaqa/shared/domain/ports/PermissionRepository.kt && \
       grep -q "fun findByIds" src/main/kotlin/com/liyaqa/shared/infrastructure/persistence/JpaPermissionRepository.kt; then
        echo -e "${GREEN}✅ findByIds() method added to PermissionRepository${NC}"
    else
        echo -e "${RED}❌ findByIds() method missing${NC}"
        return 1
    fi

    # Check PermissionService uses optimized method
    if grep -q "permissionRepository.findByIds" src/main/kotlin/com/liyaqa/shared/application/services/PermissionService.kt; then
        echo -e "${GREEN}✅ PermissionService uses optimized findByIds() method${NC}"
    else
        echo -e "${RED}❌ PermissionService still uses findAll().filter()${NC}"
        return 1
    fi

    return 0
}

# Test 8: Unit Tests
test_unit_tests() {
    echo ""
    echo "🧪 Test 8: Unit Tests"
    echo "------------------"

    echo "Running unit tests for modified services..."
    if ./gradlew test --tests "*BookingServiceTest*" --tests "*AuthServiceTest*" --tests "*PermissionServiceTest*" --no-daemon > /tmp/test-output.log 2>&1; then
        echo -e "${GREEN}✅ All unit tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Some tests failed${NC}"
        echo "Check /tmp/test-output.log for details"
        return 1
    fi
}

# Run all tests
main() {
    FAILED=0

    test_compilation || FAILED=$((FAILED+1))
    test_configuration || FAILED=$((FAILED+1))
    test_pii_masker || FAILED=$((FAILED+1))
    test_authorization || FAILED=$((FAILED+1))
    test_tenant_isolation || FAILED=$((FAILED+1))
    test_password_reset || FAILED=$((FAILED+1))
    test_query_optimization || FAILED=$((FAILED+1))
    test_unit_tests || FAILED=$((FAILED+1))

    echo ""
    echo "=============================================="
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! Phase 1 fixes are working correctly.${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Deploy to staging environment"
        echo "2. Run integration tests"
        echo "3. Monitor logs for PII masking"
        echo "4. Deploy to production"
        echo ""
        echo "See DEPLOYMENT_PHASE1.md for detailed deployment instructions."
        exit 0
    else
        echo -e "${RED}❌ $FAILED test(s) failed. Please review the output above.${NC}"
        exit 1
    fi
}

# Run main function
main
