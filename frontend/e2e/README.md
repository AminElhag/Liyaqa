# E2E Test Suite - Liyaqa Platform

This directory contains end-to-end tests for the Liyaqa gym management platform using Playwright.

## Test Structure

```
e2e/
├── platform/           # Platform-level tests (admin portal)
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   ├── clients.spec.ts
│   ├── deals.spec.ts
│   └── ...
├── tenant/            # Tenant-level tests (gym operations)
│   ├── member-journey.spec.ts     # Complete member lifecycle
│   ├── booking-flow.spec.ts       # Class booking & check-in
│   └── payment-flow.spec.ts       # Payment & subscriptions
├── pages/             # Page object models
│   ├── login.page.ts
│   ├── dashboard.page.ts
│   └── ...
└── fixtures/          # Test data and utilities
    └── auth.ts
```

## Test Files

### Tenant Tests (Critical Business Flows)

#### 1. **member-journey.spec.ts** - Complete Member Lifecycle

Tests the full journey from lead to active member:

- ✅ Lead creation and management
- ✅ Lead activity logging (calls, emails, tours)
- ✅ Lead to member conversion
- ✅ Member profile verification
- ✅ Class booking by member
- ✅ Member dashboard and history
- ✅ Referral tracking
- ✅ Membership renewal and re-engagement
- ✅ Edge cases (duplicates, validation)

**Test Scenarios:**
- Complete journey (lead → conversion → booking → attendance)
- Lead rejection workflow
- Activity timeline display
- Referral journey
- Member re-engagement
- Duplicate prevention
- Form validation

#### 2. **booking-flow.spec.ts** - Class Booking and Check-in

Tests the complete booking lifecycle:

- ✅ Browse and filter classes
- ✅ Class detail viewing
- ✅ Booking creation
- ✅ Booking management (view, cancel, reschedule)
- ✅ Check-in via QR code
- ✅ Manual check-in
- ✅ Attendance history
- ✅ Waitlist management
- ✅ Capacity limits

**Test Scenarios:**
- Display class schedule with filters
- Book a class successfully
- Cancel booking (with late cancellation prevention)
- Reschedule booking
- QR code check-in
- Manual check-in via search
- Duplicate check-in prevention
- Real-time attendance count
- View attendance history
- Join waitlist when class is full
- Capacity information display

#### 3. **payment-flow.spec.ts** - Payment and Subscriptions

Tests payment processing and subscription management:

- ✅ Membership plan selection
- ✅ Payment processing (card)
- ✅ Payment method management
- ✅ Invoice viewing and downloading
- ✅ Payment history
- ✅ Subscription management
- ✅ Subscription upgrades/downgrades
- ✅ Cancellation and reactivation
- ✅ Refund requests
- ✅ Account credits

**Test Scenarios:**
- Display membership plans
- Complete payment with card
- Payment form validation
- Add/remove payment methods
- Set default payment method
- View and download invoices
- Filter payment history
- Upgrade subscription
- Cancel and reactivate subscription
- Request refund
- Apply account credits
- Handle payment failures
- Expired card validation

### Platform Tests

Platform-level administrative tests covering:
- Authentication and authorization
- Client management
- Deal pipeline
- Theme and settings
- Support tickets
- Subscription management

## Running Tests

### Prerequisites

```bash
cd frontend
npm ci
npx playwright install --with-deps
```

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Specific Test File

```bash
# Member journey tests
npx playwright test e2e/tenant/member-journey.spec.ts

# Booking flow tests
npx playwright test e2e/tenant/booking-flow.spec.ts

# Payment flow tests
npx playwright test e2e/tenant/payment-flow.spec.ts
```

### Run Tests by Browser

```bash
# Chrome only
npm run test:e2e:chromium

# Firefox only
npm run test:e2e:firefox

# Mobile viewport
npm run test:e2e:mobile
```

### Interactive Mode

```bash
# UI mode (recommended for development)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Headed mode (see browser)
npm run test:e2e:headed
```

### View Test Reports

```bash
npm run test:e2e:report
```

## CI/CD Integration

E2E tests run automatically in GitHub Actions on:
- Push to `main`, `features/**`, `fixes/**` branches
- Pull requests to `main`

The CI pipeline:
1. Builds backend and frontend
2. Runs unit tests
3. Starts backend in test mode
4. Starts frontend dev server
5. Runs E2E tests on Chromium and Firefox
6. Uploads Playwright report as artifact
7. Stops services

### CI Configuration

See `.github/workflows/ci.yml` for the E2E test job configuration.

**Timeouts:**
- Test timeout: 30 seconds per test
- Expect timeout: 5 seconds per assertion
- Job timeout: 30 minutes total

**Retries:**
- CI: 2 retries on failure
- Local: No retries

## Configuration

### Playwright Config

See `playwright.config.ts` for full configuration.

**Key settings:**
- **Base URL:** `http://localhost:3000` (configurable via `BASE_URL` env var)
- **Browsers:** Chromium, Firefox, Mobile Chrome
- **Parallel execution:** Yes (1 worker in CI, unlimited locally)
- **Trace:** On first retry
- **Screenshots:** Only on failure
- **Videos:** Retain on failure

### Environment Variables

Create `.env.test` in frontend directory:

```env
BASE_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080
```

## Writing New Tests

### Best Practices

1. **Use Page Object Model:** Create reusable page objects in `e2e/pages/`

2. **Use Test Data Fixtures:** Store test data in `e2e/fixtures/`

3. **Use Descriptive Test Names:**
   ```typescript
   test("should complete full journey from lead to active member", async ({ page }) => {
     // Test implementation
   });
   ```

4. **Use Data Test IDs:** Prefer `data-testid` selectors over text/class selectors
   ```typescript
   await page.click('[data-testid="add-member-button"]');
   ```

5. **Wait Appropriately:**
   ```typescript
   // Good: Use explicit waits
   await expect(page.locator('text=Success')).toBeVisible({ timeout: 10000 });

   // Avoid: Fixed timeouts
   await page.waitForTimeout(5000); // Only use when necessary
   ```

6. **Handle Flaky Tests:** Use retry logic and proper waits
   ```typescript
   const element = await page.locator('button').first().isVisible({ timeout: 5000 }).catch(() => false);
   if (element) {
     await page.click('button');
   }
   ```

7. **Clean Up Test Data:** Use `test.afterEach` or database resets

8. **Group Related Tests:**
   ```typescript
   test.describe("Member Journey", () => {
     test.describe("Lead Conversion", () => {
       test("should convert lead to member", async ({ page }) => {
         // ...
       });
     });
   });
   ```

### Example Test Structure

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    // Setup: navigate to page, login, etc.
    await page.goto("/en/members");
  });

  test("should perform action successfully", async ({ page }) => {
    // Arrange: Set up test data
    const memberData = {
      name: "Test Member",
      email: "test@example.com"
    };

    // Act: Perform action
    await page.click('button:has-text("Add Member")');
    await page.fill('[name="name"]', memberData.name);
    await page.fill('[name="email"]', memberData.email);
    await page.click('button[type="submit"]');

    // Assert: Verify outcome
    await expect(page.locator('text=Member created')).toBeVisible();
  });

  test("should handle error case", async ({ page }) => {
    // Test error scenarios
  });
});
```

## Test Coverage

### Current Coverage

**Member Journey:**
- Lead creation: ✅
- Activity logging: ✅
- Lead conversion: ✅
- Member booking: ✅
- Referrals: ✅
- Re-engagement: ✅

**Booking Flow:**
- Class browsing: ✅
- Booking creation: ✅
- Booking management: ✅
- Check-in (QR & manual): ✅
- Waitlist: ✅
- Attendance history: ✅

**Payment Flow:**
- Plan selection: ✅
- Payment processing: ✅
- Payment methods: ✅
- Invoices: ✅
- Subscriptions: ✅
- Refunds: ✅

### Critical Paths Covered

1. **Happy Path:** Lead → Member → Booking → Check-in → Payment ✅
2. **Alternative Flows:** Waitlist, cancellations, rescheduling ✅
3. **Error Cases:** Validation, duplicates, failures ✅
4. **Edge Cases:** Late cancellations, capacity limits ✅

## Troubleshooting

### Tests Failing Locally

**Issue:** Services not starting
```bash
# Ensure backend is running
cd backend
./gradlew bootRun --args='--spring.profiles.active=test'

# Ensure frontend is running
cd frontend
npm run dev
```

**Issue:** Elements not found
- Check if selectors have changed
- Use Playwright Inspector: `npm run test:e2e:debug`
- Verify page is fully loaded before interactions

**Issue:** Timeout errors
- Increase timeout: `{ timeout: 30000 }`
- Check network tab for slow API calls
- Verify backend is responding

### Tests Failing in CI

**Issue:** Race conditions
- Add explicit waits: `await expect().toBeVisible()`
- Use `waitForLoadState('networkidle')`
- Increase retry count in CI

**Issue:** Authentication errors
- Verify auth state is saved: `e2e/.auth/`
- Check setup project runs successfully
- Review environment variables

### Debugging Tips

1. **Run in headed mode:** See what the browser is doing
   ```bash
   npm run test:e2e:headed
   ```

2. **Use Playwright Inspector:** Step through test execution
   ```bash
   npm run test:e2e:debug
   ```

3. **Check traces:** Download trace from failed CI runs
   ```bash
   npx playwright show-trace trace.zip
   ```

4. **Screenshots and videos:** Available in `test-results/` after failures

5. **Console logs:** Add logging to tests
   ```typescript
   console.log("Current URL:", page.url());
   console.log("Element count:", await page.locator('button').count());
   ```

## Performance

### Test Execution Time

- **Full suite:** ~10-15 minutes (all browsers, parallel)
- **Single browser:** ~5-7 minutes
- **Single test file:** ~1-3 minutes

### Optimization Tips

- Run tests in parallel (default in local)
- Use `test.describe.parallel()` for independent tests
- Skip slow tests in development: `test.skip()`
- Use `test.only()` to run specific tests
- Minimize navigation between pages

## Maintenance

### Regular Updates

- [ ] Update selectors when UI changes
- [ ] Add tests for new features
- [ ] Remove tests for deprecated features
- [ ] Update test data to match production scenarios
- [ ] Review and fix flaky tests monthly

### Test Health Metrics

Track these metrics:
- Pass rate (target: >95%)
- Flaky test rate (target: <5%)
- Average execution time (target: <15 minutes)
- Coverage of critical paths (target: 100%)

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Liyaqa Testing Guide](/backend/TESTING.md)
- [CI/CD Configuration](/.github/workflows/ci.yml)

---

**Status:** Production-ready E2E test suite
**Last Updated:** 2026-01-31
**Maintainer:** Development Team
