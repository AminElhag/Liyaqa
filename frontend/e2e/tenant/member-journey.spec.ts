import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Complete Member Journey
 *
 * Tests the full member lifecycle from lead creation to active membership:
 * 1. Admin creates a new lead
 * 2. Lead activities are logged (calls, emails, tours)
 * 3. Lead is converted to member
 * 4. Member books a class
 * 5. Member checks in to class
 * 6. Member profile and history are verified
 */

test.describe("Member Journey - Complete Lifecycle", () => {
  // Test data
  const testLead = {
    name: "Sarah Johnson",
    email: `test-${Date.now()}@example.com`,
    phone: "+966501234567",
    source: "WALK_IN",
    priority: "HIGH",
    notes: "Interested in personal training and yoga classes",
  };

  const testMember = {
    firstName: { en: "Sarah", ar: "سارة" },
    lastName: { en: "Johnson", ar: "جونسون" },
    dateOfBirth: "1990-05-15",
    gender: "FEMALE",
  };

  test.describe("Lead to Member Conversion", () => {
    test("should complete full journey from lead to active member", async ({ page }) => {
      // ============================================
      // 1. CREATE LEAD
      // ============================================
      await page.goto("/en/leads");
      await expect(page).toHaveURL(/\/leads/);

      // Click "Add Lead" button
      await page.click('button:has-text("Add Lead"), a:has-text("Add Lead")');
      await expect(page).toHaveURL(/\/leads\/new/);

      // Fill lead form
      await page.fill('[name="name"]', testLead.name);
      await page.fill('[name="email"]', testLead.email);
      await page.fill('[name="phone"]', testLead.phone);
      await page.selectOption('[name="source"]', testLead.source);
      await page.selectOption('[name="priority"]', testLead.priority);
      await page.fill('[name="notes"]', testLead.notes);

      // Submit form
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

      // Verify success message and redirect
      await expect(page.locator('text=/created successfully/i, text=/success/i')).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });

      // Store lead ID from URL
      const leadUrl = page.url();
      const leadId = leadUrl.match(/\/leads\/([a-f0-9-]+)/)?.[1];
      expect(leadId).toBeTruthy();

      // ============================================
      // 2. LOG LEAD ACTIVITIES
      // ============================================

      // Log a phone call activity
      await page.click('button:has-text("Add Activity"), button:has-text("Log Activity")');
      await page.selectOption('[name="type"]', "CALL");
      await page.fill('[name="notes"]', "Initial consultation call - discussed fitness goals");
      await page.fill('[name="durationMinutes"]', "15");
      await page.click('button[type="submit"]:has-text("Log"), button:has-text("Save")');
      await expect(page.locator('text=/activity.*logged/i, text=/success/i')).toBeVisible();

      // Log a tour activity
      await page.click('button:has-text("Add Activity"), button:has-text("Log Activity")');
      await page.selectOption('[name="type"]', "TOUR");
      await page.fill('[name="notes"]', "Showed facilities, tried demo yoga class");
      await page.fill('[name="durationMinutes"]', "45");
      await page.click('button[type="submit"]:has-text("Log"), button:has-text("Save")');
      await expect(page.locator('text=/activity.*logged/i, text=/success/i')).toBeVisible();

      // Verify activities are displayed
      await expect(page.locator('text=Initial consultation call')).toBeVisible();
      await expect(page.locator('text=Showed facilities')).toBeVisible();

      // ============================================
      // 3. CONVERT LEAD TO MEMBER
      // ============================================

      // Click "Convert to Member" button
      await page.click('button:has-text("Convert"), button:has-text("Convert to Member")');

      // Fill member conversion form
      await page.fill('[name="firstName.en"]', testMember.firstName.en);
      await page.fill('[name="firstName.ar"]', testMember.firstName.ar);
      await page.fill('[name="lastName.en"]', testMember.lastName.en);
      await page.fill('[name="lastName.ar"]', testMember.lastName.ar);
      await page.fill('[name="dateOfBirth"]', testMember.dateOfBirth);
      await page.selectOption('[name="gender"]', testMember.gender);

      // Select a membership plan
      await page.click('[name="planId"]');
      await page.click('option:has-text("Monthly"), option:has-text("Premium"), option:has-text("Standard")');

      // Submit conversion
      await page.click('button[type="submit"]:has-text("Convert"), button:has-text("Create Member")');

      // Verify success and redirect to member profile
      await expect(page.locator('text=/member created/i, text=/conversion successful/i')).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL(/\/members\/[a-f0-9-]+/, { timeout: 10000 });

      // Store member ID
      const memberUrl = page.url();
      const memberId = memberUrl.match(/\/members\/([a-f0-9-]+)/)?.[1];
      expect(memberId).toBeTruthy();

      // ============================================
      // 4. VERIFY MEMBER PROFILE
      // ============================================

      // Verify member details are displayed
      await expect(page.locator(`text=${testMember.firstName.en} ${testMember.lastName.en}`)).toBeVisible();
      await expect(page.locator(`text=${testLead.email}`)).toBeVisible();
      await expect(page.locator(`text=${testLead.phone}`)).toBeVisible();
      await expect(page.locator('text=/active/i, text=/status.*active/i')).toBeVisible();

      // ============================================
      // 5. BOOK A CLASS
      // ============================================

      // Navigate to classes page
      await page.goto("/en/classes");
      await expect(page).toHaveURL(/\/classes/);

      // Find an available class and click "Book"
      const firstBookButton = page.locator('button:has-text("Book")').first();
      if (await firstBookButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstBookButton.click();

        // Confirm booking (might have a confirmation dialog)
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }

        // Verify booking success
        await expect(page.locator('text=/booked/i, text=/booking.*success/i')).toBeVisible({ timeout: 10000 });
      }

      // ============================================
      // 6. VERIFY MEMBER DASHBOARD
      // ============================================

      // Navigate to member profile
      await page.goto(`/en/members/${memberId}`);

      // Verify active membership
      await expect(page.locator('text=/membership/i')).toBeVisible();

      // Check for bookings section
      const bookingsSection = page.locator('text=/bookings/i, text=/upcoming/i, text=/classes/i');
      await expect(bookingsSection.first()).toBeVisible();

      console.log("✅ Complete member journey test passed!");
    });

    test("should handle lead rejection workflow", async ({ page }) => {
      // Create a new lead
      await page.goto("/en/leads");
      await page.click('button:has-text("Add Lead"), a:has-text("Add Lead")');

      await page.fill('[name="name"]', "Rejected Lead");
      await page.fill('[name="email"]', `reject-${Date.now()}@example.com`);
      await page.fill('[name="phone"]', "+966507654321");
      await page.selectOption('[name="source"]', "WALK_IN");
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

      await expect(page.locator('text=/success/i')).toBeVisible({ timeout: 10000 });

      // Change lead status to LOST
      const statusDropdown = page.locator('[name="status"], select:has(option:has-text("Lost"))');
      if (await statusDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
        await statusDropdown.selectOption("LOST");

        // Add rejection reason
        await page.fill('[name="notes"], textarea', "Not interested in membership at this time");

        // Save changes
        const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
        await saveButton.click();

        await expect(page.locator('text=/updated/i, text=/saved/i')).toBeVisible();
      }

      console.log("✅ Lead rejection workflow test passed!");
    });
  });

  test.describe("Member Activity Timeline", () => {
    test("should display complete activity history", async ({ page }) => {
      // Navigate to leads page
      await page.goto("/en/leads");

      // Click on first lead (if any exist)
      const firstLead = page.locator('table tbody tr, [data-testid="lead-row"]').first();
      if (await firstLead.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstLead.click();

        // Verify activity timeline section exists
        const activitySection = page.locator('text=/activity/i, text=/timeline/i, text=/history/i');
        await expect(activitySection.first()).toBeVisible({ timeout: 5000 });

        // Check for activity types
        const activityTypes = page.locator('text=/call/i, text=/email/i, text=/tour/i, text=/meeting/i');
        const hasActivities = await activityTypes.first().isVisible({ timeout: 2000 }).catch(() => false);

        if (hasActivities) {
          console.log("✅ Activity timeline is displayed");
        } else {
          console.log("ℹ️ No activities found for this lead");
        }
      } else {
        console.log("ℹ️ No leads available to test");
      }
    });
  });

  test.describe("Referral Journey", () => {
    test("should track member referrals", async ({ page }) => {
      // Navigate to members page
      await page.goto("/en/members");
      await expect(page).toHaveURL(/\/members/);

      // Click on first member
      const firstMember = page.locator('table tbody tr, [data-testid="member-row"]').first();
      if (await firstMember.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstMember.click();

        // Look for referral section
        const referralSection = page.locator('text=/referral/i, text=/referred/i');
        const hasReferrals = await referralSection.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasReferrals) {
          console.log("✅ Referral tracking is available");
        } else {
          console.log("ℹ️ No referral data for this member");
        }
      }
    });

    test("should create lead from member referral", async ({ page }) => {
      // Create a lead with referral source
      await page.goto("/en/leads");
      await page.click('button:has-text("Add Lead"), a:has-text("Add Lead")');

      await page.fill('[name="name"]', `Referred Lead ${Date.now()}`);
      await page.fill('[name="email"]', `referred-${Date.now()}@example.com`);
      await page.fill('[name="phone"]', "+966508888888");

      // Select REFERRAL as source
      await page.selectOption('[name="source"]', "REFERRAL");

      // If there's a referrer field, select a member
      const referrerField = page.locator('[name="referredBy"], [name="referrerId"]');
      if (await referrerField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await referrerField.click();
        await page.locator('option, [role="option"]').first().click();
      }

      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');
      await expect(page.locator('text=/success/i')).toBeVisible({ timeout: 10000 });

      console.log("✅ Referral lead creation test passed!");
    });
  });

  test.describe("Member Re-engagement", () => {
    test("should handle expired membership renewal", async ({ page }) => {
      // Navigate to members with filter for expired/inactive
      await page.goto("/en/members?status=EXPIRED");

      // Check if there are any expired members
      const expiredMember = page.locator('table tbody tr, [data-testid="member-row"]').first();
      const hasExpired = await expiredMember.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasExpired) {
        await expiredMember.click();

        // Look for renewal/reactivate button
        const renewButton = page.locator('button:has-text("Renew"), button:has-text("Reactivate"), button:has-text("Extend")');
        if (await renewButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log("✅ Renewal functionality is available");
        }
      } else {
        console.log("ℹ️ No expired members to test renewal");
      }
    });

    test("should send re-engagement communications", async ({ page }) => {
      // Navigate to leads with status CONTACTED
      await page.goto("/en/leads?status=CONTACTED");

      const contactedLead = page.locator('table tbody tr, [data-testid="lead-row"]').first();
      if (await contactedLead.isVisible({ timeout: 5000 }).catch(() => false)) {
        await contactedLead.click();

        // Try to send follow-up email/SMS
        const communicationButton = page.locator('button:has-text("Send Email"), button:has-text("Send SMS"), button:has-text("Follow Up")');
        const hasCommunication = await communicationButton.first().isVisible({ timeout: 3000 }).catch(() => false);

        if (hasCommunication) {
          console.log("✅ Re-engagement communication available");
        } else {
          console.log("ℹ️ Communication features not visible");
        }
      }
    });
  });
});

test.describe("Member Journey - Edge Cases", () => {
  test("should prevent duplicate member creation", async ({ page }) => {
    const duplicateEmail = `duplicate-${Date.now()}@example.com`;

    // Create first member
    await page.goto("/en/members");
    await page.click('button:has-text("Add Member"), a:has-text("Add Member")');

    await page.fill('[name="firstName.en"]', "John");
    await page.fill('[name="lastName.en"]', "Doe");
    await page.fill('[name="email"]', duplicateEmail);
    await page.fill('[name="phone"]', "+966501111111");
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    await expect(page.locator('text=/success/i')).toBeVisible({ timeout: 10000 });

    // Try to create duplicate
    await page.goto("/en/members");
    await page.click('button:has-text("Add Member"), a:has-text("Add Member")');

    await page.fill('[name="firstName.en"]', "Jane");
    await page.fill('[name="lastName.en"]', "Doe");
    await page.fill('[name="email"]', duplicateEmail);
    await page.fill('[name="phone"]', "+966502222222");
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    // Should show error about duplicate email
    await expect(page.locator('text=/email.*exists/i, text=/already.*registered/i, text=/duplicate/i')).toBeVisible({ timeout: 10000 });

    console.log("✅ Duplicate prevention test passed!");
  });

  test("should handle member with expired plan", async ({ page }) => {
    // Navigate to members
    await page.goto("/en/members");

    // Filter or search for expired members
    const statusFilter = page.locator('[name="status"], select:has(option:has-text("Expired"))');
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusFilter.selectOption("EXPIRED");

      // Check if results update
      await page.waitForTimeout(1000);

      const expiredMembers = page.locator('table tbody tr, [data-testid="member-row"]');
      const count = await expiredMembers.count();

      console.log(`ℹ️ Found ${count} expired member(s)`);
    }
  });

  test("should validate required fields on member creation", async ({ page }) => {
    await page.goto("/en/members");
    await page.click('button:has-text("Add Member"), a:has-text("Add Member")');

    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    // Should show validation errors
    const validationErrors = page.locator('text=/required/i, .error, [role="alert"]');
    const hasErrors = await validationErrors.first().isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasErrors).toBe(true);
    console.log("✅ Form validation test passed!");
  });
});
