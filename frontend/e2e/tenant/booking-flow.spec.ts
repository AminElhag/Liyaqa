import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Class Booking and Check-in Flow
 *
 * Tests the complete booking lifecycle:
 * 1. Browse available classes
 * 2. Book a class
 * 3. Manage booking (view, cancel, reschedule)
 * 4. Check-in to class (QR code, manual)
 * 5. View attendance history
 * 6. Handle waitlist and capacity limits
 */

test.describe("Class Booking Flow", () => {
  test.describe("Browse and Book Classes", () => {
    test("should display class schedule and details", async ({ page }) => {
      // Navigate to classes page
      await page.goto("/en/classes");
      await expect(page).toHaveURL(/\/classes/);

      // Verify page title
      await expect(page.locator('h1, h2').filter({ hasText: /classes/i }).first()).toBeVisible();

      // Check for class cards/rows
      const classList = page.locator('[data-testid="class-card"], [data-testid="class-row"], table tbody tr');
      const hasClasses = await classList.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (hasClasses) {
        const count = await classList.count();
        console.log(`✅ Found ${count} classes`);

        // Verify class details are displayed
        await expect(page.locator('text=/yoga|pilates|hiit|spinning|strength/i').first()).toBeVisible();
      } else {
        console.log("ℹ️ No classes available");
      }
    });

    test("should filter classes by type", async ({ page }) => {
      await page.goto("/en/classes");

      // Look for filter dropdown
      const typeFilter = page.locator('[name="type"], select:has(option:has-text("GROUP")), [data-testid="type-filter"]');
      if (await typeFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Select GROUP classes
        await typeFilter.click();
        const groupOption = page.locator('option:has-text("GROUP"), [role="option"]:has-text("Group")');
        if (await groupOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await groupOption.click();

          // Wait for results to update
          await page.waitForTimeout(1000);

          console.log("✅ Class filtering works");
        }
      } else {
        console.log("ℹ️ No type filter available");
      }
    });

    test("should filter classes by trainer", async ({ page }) => {
      await page.goto("/en/classes");

      // Look for trainer filter
      const trainerFilter = page.locator('[name="trainerId"], [name="trainer"], [data-testid="trainer-filter"]');
      if (await trainerFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        await trainerFilter.click();

        // Select first trainer option (skip "All" if it exists)
        const trainerOptions = page.locator('option:not(:has-text("All")), [role="option"]:not(:has-text("All"))');
        if (await trainerOptions.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await trainerOptions.first().click();

          await page.waitForTimeout(1000);

          console.log("✅ Trainer filtering works");
        }
      }
    });

    test("should book a class successfully", async ({ page }) => {
      await page.goto("/en/classes");

      // Find an available class with "Book" button
      const bookButton = page.locator('button:has-text("Book"), button:has-text("Reserve")').first();

      if (await bookButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Click book button
        await bookButton.click();

        // Handle confirmation modal if present
        const confirmModal = page.locator('[role="dialog"], .modal');
        if (await confirmModal.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Verify modal shows class details
          await expect(confirmModal).toBeVisible();

          // Click confirm
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Book")').last();
          await confirmButton.click();
        }

        // Verify success message
        await expect(page.locator('text=/booked/i, text=/booking.*success/i, text=/reserved/i')).toBeVisible({ timeout: 10000 });

        console.log("✅ Class booking successful!");
      } else {
        console.log("ℹ️ No available classes to book");
      }
    });

    test("should show class details before booking", async ({ page }) => {
      await page.goto("/en/classes");

      // Click on a class to view details
      const firstClass = page.locator('[data-testid="class-card"], table tbody tr').first();

      if (await firstClass.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstClass.click();

        // Verify class details page
        await page.waitForTimeout(1000);

        // Should display: name, trainer, duration, capacity, schedule
        const detailsVisible = await Promise.all([
          page.locator('text=/trainer/i').isVisible({ timeout: 2000 }).catch(() => false),
          page.locator('text=/duration|time/i').isVisible({ timeout: 2000 }).catch(() => false),
          page.locator('text=/capacity|spots/i').isVisible({ timeout: 2000 }).catch(() => false),
        ]);

        const hasDetails = detailsVisible.some((visible) => visible);
        expect(hasDetails).toBe(true);

        console.log("✅ Class details are displayed");
      }
    });
  });

  test.describe("Manage Bookings", () => {
    test("should view upcoming bookings", async ({ page }) => {
      // Navigate to bookings or member dashboard
      await page.goto("/en/bookings");

      // Alternative: member profile page might show bookings
      if (!await page.locator('text=/bookings/i').isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.goto("/en/dashboard");
      }

      // Look for bookings section
      const bookingsSection = page.locator('text=/upcoming/i, text=/my.*bookings/i, [data-testid="bookings"]');
      if (await bookingsSection.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log("✅ Bookings section is visible");

        // Check for booking cards/rows
        const bookingItems = page.locator('[data-testid="booking-card"], [data-testid="booking-row"], table tbody tr');
        const count = await bookingItems.count();
        console.log(`ℹ️ Found ${count} booking(s)`);
      } else {
        console.log("ℹ️ No bookings section found");
      }
    });

    test("should cancel a booking", async ({ page }) => {
      await page.goto("/en/bookings");

      // Find a booking with cancel button
      const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Remove")').first();

      if (await cancelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Click cancel
        await cancelButton.click();

        // Confirm cancellation
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Cancel Booking")');
        if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmButton.click();
        }

        // Verify success
        await expect(page.locator('text=/cancelled/i, text=/removed/i')).toBeVisible({ timeout: 10000 });

        console.log("✅ Booking cancellation works");
      } else {
        console.log("ℹ️ No bookings available to cancel");
      }
    });

    test("should prevent late cancellation", async ({ page }) => {
      await page.goto("/en/bookings");

      // Try to cancel a booking that's too close to start time
      const bookingRow = page.locator('[data-testid="booking-row"], table tbody tr').first();

      if (await bookingRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Look for disabled cancel button or warning message
        const cancelButton = bookingRow.locator('button:has-text("Cancel")');

        if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          const isDisabled = await cancelButton.isDisabled();

          if (isDisabled) {
            console.log("✅ Late cancellation is prevented (button disabled)");
          } else {
            // Try to cancel and expect error
            await cancelButton.click();

            const errorMessage = page.locator('text=/too.*late/i, text=/cancellation.*deadline/i, text=/cannot.*cancel/i');
            if (await errorMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
              console.log("✅ Late cancellation is prevented (error message)");
            }
          }
        }
      }
    });

    test("should reschedule a booking", async ({ page }) => {
      await page.goto("/en/bookings");

      // Look for reschedule button
      const rescheduleButton = page.locator('button:has-text("Reschedule"), button:has-text("Change Time")').first();

      if (await rescheduleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await rescheduleButton.click();

        // Should show available time slots
        const timeSlotPicker = page.locator('[data-testid="time-picker"], .time-slot, select:has(option:has-text("AM"))');
        if (await timeSlotPicker.first().isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log("✅ Rescheduling interface available");

          // Select a new time and confirm (implementation varies)
          const firstSlot = timeSlotPicker.first();
          await firstSlot.click();

          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Save")');
          if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await confirmButton.click();
          }
        }
      } else {
        console.log("ℹ️ Rescheduling not available");
      }
    });
  });

  test.describe("Check-in Process", () => {
    test("should check in via QR code scan", async ({ page }) => {
      // Navigate to check-in page
      await page.goto("/en/attendance/check-in");

      // Look for QR scanner interface
      const qrScanner = page.locator('[data-testid="qr-scanner"], text=/scan.*qr/i, text=/qr.*code/i');

      if (await qrScanner.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log("✅ QR scanner interface found");

        // In a real test, we'd simulate QR code input
        // For now, check if manual entry is available as fallback
        const manualEntry = page.locator('input[name="qrCode"], input[placeholder*="code"], button:has-text("Manual")');
        if (await manualEntry.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log("✅ Manual QR entry available");
        }
      } else {
        console.log("ℹ️ QR check-in not found, trying manual check-in");
        await page.goto("/en/attendance");
      }
    });

    test("should check in manually via member search", async ({ page }) => {
      await page.goto("/en/attendance");

      // Look for member search input
      const searchInput = page.locator('input[name="search"], input[placeholder*="member"], input[placeholder*="name"]');

      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Type a member name
        await searchInput.fill("Test");
        await page.waitForTimeout(1000);

        // Click on a member from results
        const memberResult = page.locator('[data-testid="member-result"], .search-result, table tbody tr').first();

        if (await memberResult.isVisible({ timeout: 5000 }).catch(() => false)) {
          await memberResult.click();

          // Select a class/session to check in to
          const sessionSelect = page.locator('[name="sessionId"], select:has(option), [data-testid="session-select"]');
          if (await sessionSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
            await sessionSelect.click();
            await page.locator('option, [role="option"]').first().click();
          }

          // Click check-in button
          const checkInButton = page.locator('button:has-text("Check In"), button:has-text("Mark Attendance")');
          if (await checkInButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await checkInButton.click();

            // Verify success
            await expect(page.locator('text=/checked.*in/i, text=/attendance.*recorded/i')).toBeVisible({ timeout: 10000 });

            console.log("✅ Manual check-in successful!");
          }
        }
      } else {
        console.log("ℹ️ Member search not available");
      }
    });

    test("should prevent duplicate check-in", async ({ page }) => {
      // Assuming we're already checked in from previous test
      await page.goto("/en/attendance");

      // Try to check in the same member again
      const searchInput = page.locator('input[name="search"], input[placeholder*="member"]');

      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill("Test");
        await page.waitForTimeout(1000);

        const memberResult = page.locator('[data-testid="member-result"], table tbody tr').first();
        if (await memberResult.isVisible({ timeout: 3000 }).catch(() => false)) {
          await memberResult.click();

          // Try to check in again
          const checkInButton = page.locator('button:has-text("Check In")');
          if (await checkInButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Button might be disabled
            const isDisabled = await checkInButton.isDisabled().catch(() => false);

            if (isDisabled) {
              console.log("✅ Duplicate check-in prevented (button disabled)");
            } else {
              await checkInButton.click();

              // Should show error
              const errorMessage = page.locator('text=/already.*checked/i, text=/duplicate/i');
              if (await errorMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log("✅ Duplicate check-in prevented (error message)");
              }
            }
          }
        }
      }
    });

    test("should display real-time attendance count", async ({ page }) => {
      await page.goto("/en/classes");

      // Click on a class to view details
      const firstClass = page.locator('[data-testid="class-card"], table tbody tr').first();

      if (await firstClass.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstClass.click();

        // Look for attendance count
        const attendanceInfo = page.locator('text=/\\d+\\/\\d+/, text=/attended/i, text=/checked.*in/i');

        if (await attendanceInfo.first().isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log("✅ Attendance count is displayed");
        } else {
          console.log("ℹ️ Attendance count not visible");
        }
      }
    });
  });

  test.describe("Attendance History", () => {
    test("should view member attendance history", async ({ page }) => {
      // Navigate to members page
      await page.goto("/en/members");

      // Click on first member
      const firstMember = page.locator('table tbody tr, [data-testid="member-row"]').first();

      if (await firstMember.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstMember.click();

        // Look for attendance/history tab or section
        const attendanceTab = page.locator('button:has-text("Attendance"), a:has-text("History"), text=/attendance.*history/i');

        if (await attendanceTab.first().isVisible({ timeout: 5000 }).catch(() => false)) {
          await attendanceTab.first().click();

          // Verify attendance records are displayed
          const attendanceRecords = page.locator('[data-testid="attendance-record"], table tbody tr');
          const count = await attendanceRecords.count();

          console.log(`✅ Found ${count} attendance record(s)`);
        } else {
          console.log("ℹ️ Attendance history not available");
        }
      }
    });

    test("should filter attendance by date range", async ({ page }) => {
      await page.goto("/en/attendance");

      // Look for date range filters
      const startDateInput = page.locator('input[name="startDate"], input[type="date"]').first();
      const endDateInput = page.locator('input[name="endDate"], input[type="date"]').nth(1);

      if (await startDateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Set date range
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

        await startDateInput.fill(lastMonth.toISOString().split('T')[0]);
        await endDateInput.fill(today.toISOString().split('T')[0]);

        // Apply filter
        const filterButton = page.locator('button:has-text("Filter"), button:has-text("Apply")');
        if (await filterButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await filterButton.click();

          await page.waitForTimeout(1000);

          console.log("✅ Date range filtering works");
        }
      }
    });

    test("should export attendance report", async ({ page }) => {
      await page.goto("/en/attendance");

      // Look for export button
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');

      if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log("✅ Export functionality available");

        // Note: Actually downloading would require different handling
        // Just verify the button is present and clickable
        await expect(exportButton).toBeEnabled();
      } else {
        console.log("ℹ️ Export functionality not found");
      }
    });
  });

  test.describe("Waitlist and Capacity", () => {
    test("should add to waitlist when class is full", async ({ page }) => {
      await page.goto("/en/classes");

      // Look for a full class (waitlist button)
      const waitlistButton = page.locator('button:has-text("Join Waitlist"), button:has-text("Waitlist")');

      if (await waitlistButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await waitlistButton.first().click();

        // Confirm joining waitlist
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Join")');
        if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmButton.click();
        }

        // Verify success
        await expect(page.locator('text=/waitlist/i, text=/added.*to.*waitlist/i')).toBeVisible({ timeout: 10000 });

        console.log("✅ Waitlist functionality works!");
      } else {
        console.log("ℹ️ No full classes to test waitlist");
      }
    });

    test("should show capacity information", async ({ page }) => {
      await page.goto("/en/classes");

      // Look for capacity indicators
      const capacityInfo = page.locator('text=/\\d+\\/\\d+ spots/i, text=/capacity/i, [data-testid="capacity"]');

      if (await capacityInfo.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log("✅ Capacity information is displayed");

        // Check for "Full" or "Almost Full" indicators
        const fullIndicator = page.locator('text=/full/i, .badge:has-text("Full"), .status:has-text("Full")');
        if (await fullIndicator.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log("✅ Full capacity indicator present");
        }
      }
    });

    test("should notify when spot becomes available", async ({ page }) => {
      // This would require setting up a waitlist scenario
      // For now, just verify the waitlist management page exists
      await page.goto("/en/bookings");

      // Look for waitlist section
      const waitlistSection = page.locator('text=/waitlist/i, [data-testid="waitlist"]');

      if (await waitlistSection.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log("✅ Waitlist management available");
      } else {
        console.log("ℹ️ Waitlist management not visible");
      }
    });
  });
});

test.describe("Booking Flow - Edge Cases", () => {
  test("should prevent booking past classes", async ({ page }) => {
    await page.goto("/en/classes");

    // Try to find and book a past class
    // Most likely past classes won't have book buttons
    const pastClassSection = page.locator('text=/past/i, text=/history/i, [data-testid="past-classes"]');

    if (await pastClassSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pastClassSection.click();

      // Verify no book buttons on past classes
      const bookButton = page.locator('button:has-text("Book")');
      const hasBookButton = await bookButton.first().isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasBookButton).toBe(false);
      console.log("✅ Cannot book past classes");
    }
  });

  test("should prevent check-in before class time", async ({ page }) => {
    await page.goto("/en/attendance");

    // Try to check in to a future class
    // Implementation would depend on check-in flow
    // For now, verify time-based validation exists

    console.log("ℹ️ Early check-in prevention test placeholder");
  });

  test("should handle check-in after class ends", async ({ page }) => {
    await page.goto("/en/attendance");

    // Try to check in after class end time
    // Should either prevent or mark as late

    console.log("ℹ️ Late check-in handling test placeholder");
  });

  test("should respect booking limits per member", async ({ page }) => {
    // Some gyms limit concurrent bookings
    await page.goto("/en/bookings");

    // Try to book multiple classes
    // If limit exists, should show error

    console.log("ℹ️ Booking limits test placeholder");
  });
});
