# Liyaqa Member App - Manual Testing Plan

## Overview

This document provides a comprehensive manual testing plan for the Liyaqa Member mobile app (Android & iOS). Tests are organized by feature area with detailed test cases, expected results, and priority levels.

---

## Prerequisites

### Test Environment Setup

1. **Backend Server**
   ```bash
   # Start backend locally
   cd backend && ./gradlew bootRun
   # Or use Docker
   docker compose up -d
   ```

2. **Test Accounts**
   | Role | Email | Password | Tenant ID |
   |------|-------|----------|-----------|
   | Member | `member@demo.com` | `Test1234` | `22222222-2222-2222-2222-222222222222` |
   | Admin | `admin@demo.com` | `Test1234` | `22222222-2222-2222-2222-222222222222` |

3. **Test Devices**
   - Android: Physical device or emulator (API 26+)
   - iOS: Physical device or simulator (iOS 15+)

4. **Network Conditions**
   - WiFi (stable connection)
   - Mobile data (4G/5G)
   - Airplane mode (offline testing)
   - Slow network (for loading state testing)

---

## Test Case Categories

| Priority | Description |
|----------|-------------|
| P0 | Critical - App cannot function without this |
| P1 | High - Core functionality |
| P2 | Medium - Important but not blocking |
| P3 | Low - Nice to have, edge cases |

---

## 1. Authentication Module

### 1.1 Login Flow

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| AUTH-001 | Successful login | 1. Open app<br>2. Enter valid email<br>3. Enter valid password<br>4. Enter tenant ID<br>5. Tap Login | Navigate to Home screen, user data loaded | P0 |
| AUTH-002 | Invalid email format | 1. Enter invalid email (e.g., "test")<br>2. Tap Login | Show validation error "Invalid email format" | P1 |
| AUTH-003 | Wrong password | 1. Enter valid email<br>2. Enter wrong password<br>3. Tap Login | Show error "Invalid credentials" | P1 |
| AUTH-004 | Wrong tenant ID | 1. Enter valid credentials<br>2. Enter invalid tenant ID<br>3. Tap Login | Show error "Invalid tenant" | P1 |
| AUTH-005 | Empty fields | 1. Leave all fields empty<br>2. Tap Login | Show validation errors for all fields | P1 |
| AUTH-006 | Password visibility toggle | 1. Enter password<br>2. Tap eye icon | Password becomes visible/hidden | P2 |
| AUTH-007 | Remember credentials | 1. Login successfully<br>2. Close app<br>3. Reopen app | User remains logged in | P1 |
| AUTH-008 | Network error during login | 1. Turn off network<br>2. Attempt login | Show network error message | P1 |

### 1.2 Logout Flow

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| AUTH-009 | Successful logout | 1. Go to Profile<br>2. Tap Logout<br>3. Confirm logout | Navigate to Login screen, tokens cleared | P0 |
| AUTH-010 | Logout clears data | 1. Logout<br>2. Check stored data | All user data and tokens removed | P1 |

### 1.3 Token Management

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| AUTH-011 | Token refresh | 1. Wait for token expiry<br>2. Make API call | Token refreshed automatically, request succeeds | P1 |
| AUTH-012 | Expired refresh token | 1. Let refresh token expire<br>2. Make API call | Redirect to login screen | P1 |

---

## 2. Dashboard/Home Screen

### 2.1 Dashboard Loading

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DASH-001 | Initial load | 1. Login<br>2. Observe Home screen | All dashboard sections load correctly | P0 |
| DASH-002 | Pull to refresh | 1. Pull down on Home screen | Loading indicator shows, data refreshes | P1 |
| DASH-003 | Loading state | 1. Observe during data fetch | Skeleton/shimmer loading state visible | P2 |
| DASH-004 | Error state | 1. Simulate API error | Error message with retry button | P1 |

### 2.2 Member Info Section

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DASH-005 | Display member name | 1. View Home screen | Member first name in greeting | P1 |
| DASH-006 | Display avatar | 1. View top bar | Avatar with initials or image | P2 |

### 2.3 Subscription Card

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DASH-007 | Active subscription | 1. View subscription card | Plan name, status badge (green), days remaining | P0 |
| DASH-008 | Expiring subscription | 1. Have subscription expiring in <7 days | Warning indicator, days remaining highlighted | P1 |
| DASH-009 | Expired subscription | 1. Have expired subscription | Status badge (red), "Expired" label | P1 |
| DASH-010 | Frozen subscription | 1. Have frozen subscription | Status badge (blue), "Frozen until" date | P1 |
| DASH-011 | No subscription | 1. Member without subscription | "No active subscription" message | P1 |
| DASH-012 | Classes remaining | 1. Have class-based plan | Classes remaining counter visible | P1 |
| DASH-013 | Days remaining progress | 1. View subscription card | Progress bar showing days remaining | P2 |

### 2.4 Stats Section

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DASH-014 | Total visits | 1. View stats grid | Total visits count displayed | P1 |
| DASH-015 | This month visits | 1. View stats grid | Current month visits count | P1 |
| DASH-016 | Days remaining | 1. View stats grid | Days remaining in subscription | P1 |
| DASH-017 | Classes remaining | 1. View stats grid | Classes remaining (if applicable) | P1 |

### 2.5 Upcoming Classes Section

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DASH-018 | List upcoming classes | 1. Have booked classes<br>2. View section | List of upcoming bookings with date/time | P1 |
| DASH-019 | Empty state | 1. No booked classes | "No upcoming classes" message | P2 |
| DASH-020 | Tap class card | 1. Tap on upcoming class | Navigate to booking details | P2 |
| DASH-021 | Class time display | 1. View class card | Correct date and time format | P2 |

### 2.6 Pending Invoices Alert

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DASH-022 | Pending invoices | 1. Have unpaid invoices | Alert card with count and total amount | P1 |
| DASH-023 | Overdue invoices | 1. Have overdue invoices | Red warning indicator | P1 |
| DASH-024 | No pending invoices | 1. All invoices paid | Section hidden or "All paid" message | P2 |
| DASH-025 | Tap invoice alert | 1. Tap pending invoices card | Navigate to Invoices tab | P2 |

### 2.7 Quick QR Card

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DASH-026 | Quick QR display | 1. View QR card on home | Mini QR preview or "Tap to show" | P2 |
| DASH-027 | Tap Quick QR | 1. Tap QR card | Navigate to QR tab | P1 |

---

## 3. QR Code Screen

### 3.1 QR Code Display

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| QR-001 | QR code loads | 1. Navigate to QR tab | QR code displayed in white container | P0 |
| QR-002 | Member name shown | 1. View QR screen | Member name below QR code | P1 |
| QR-003 | Expiry countdown | 1. View QR screen | "Valid until" with countdown timer | P1 |
| QR-004 | Countdown updates | 1. Watch countdown | Timer updates every second | P2 |
| QR-005 | QR code scannable | 1. Scan QR with another device | QR contains valid check-in token | P0 |

### 3.2 QR Refresh

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| QR-006 | Manual refresh | 1. Tap refresh button | New QR code generated | P1 |
| QR-007 | Auto-refresh before expiry | 1. Wait for QR near expiry | QR refreshes automatically (~5 min before) | P1 |
| QR-008 | Expired QR | 1. Let QR expire | Show "Expired" message with refresh button | P1 |

### 3.3 QR Screen States

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| QR-009 | Loading state | 1. Observe during QR fetch | Loading indicator visible | P2 |
| QR-010 | Error state | 1. Simulate API error | Error message with retry button | P1 |
| QR-011 | Offline mode | 1. Turn off network<br>2. View QR tab | Cached QR shown (if available) or error | P2 |

### 3.4 Screen Appearance

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| QR-012 | Gradient background | 1. View QR screen | Blue gradient background | P3 |
| QR-013 | Instructions visible | 1. View QR screen | Check-in instructions displayed | P2 |

---

## 4. Bookings/Classes Screen

### 4.1 Bookings List

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| BOOK-001 | Upcoming tab | 1. Navigate to Classes tab<br>2. Select "Upcoming" | List of future bookings | P0 |
| BOOK-002 | Past tab | 1. Select "Past" tab | List of completed/past bookings | P1 |
| BOOK-003 | Empty upcoming | 1. No future bookings | Empty state with "Book a Class" button | P2 |
| BOOK-004 | Empty past | 1. No past bookings | Empty state message | P3 |
| BOOK-005 | Pull to refresh | 1. Pull down on list | Data refreshes | P1 |
| BOOK-006 | Pagination | 1. Have >10 bookings<br>2. Scroll to bottom | More bookings load | P2 |

### 4.2 Booking Card Display

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| BOOK-007 | Class name | 1. View booking card | Class name in current language | P1 |
| BOOK-008 | Date and time | 1. View booking card | Formatted date and time | P1 |
| BOOK-009 | Status badge | 1. View booking card | Correct status (Confirmed, Waitlisted, etc.) | P1 |
| BOOK-010 | Location info | 1. View booking card | Location name displayed | P2 |
| BOOK-011 | Trainer info | 1. View booking card | Trainer name displayed | P3 |

### 4.3 Cancel Booking

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| BOOK-012 | Cancel button visible | 1. View confirmed booking | Cancel button shown | P1 |
| BOOK-013 | Cancel confirmation | 1. Tap Cancel<br>2. View dialog | Confirmation dialog appears | P1 |
| BOOK-014 | Confirm cancel | 1. Tap Confirm in dialog | Booking cancelled, removed from list | P0 |
| BOOK-015 | Cancel cancelled | 1. Tap Cancel in dialog | Dialog closes, booking unchanged | P2 |
| BOOK-016 | Cancel past booking | 1. View past booking | Cancel button not visible | P2 |
| BOOK-017 | Cancel error | 1. Simulate cancel error | Error message shown | P2 |

### 4.4 Book New Class

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| BOOK-018 | Open booking screen | 1. Tap "Book a Class" button | New booking screen opens | P0 |
| BOOK-019 | Date selector | 1. View date chips | Next 7-14 days shown as selectable chips | P1 |
| BOOK-020 | Select date | 1. Tap date chip | Sessions for that date displayed | P1 |
| BOOK-021 | Available sessions | 1. View sessions list | Sessions with time, class name, spots | P1 |
| BOOK-022 | Spots remaining | 1. View session card | "X spots remaining" displayed | P1 |
| BOOK-023 | Full session | 1. View full session | "Full" badge, Join Waitlist button | P1 |
| BOOK-024 | Book session | 1. Tap "Book Now" | Confirmation dialog appears | P0 |
| BOOK-025 | Confirm booking | 1. Confirm booking | Success message, added to upcoming | P0 |
| BOOK-026 | Join waitlist | 1. Tap "Join Waitlist" on full session | Added to waitlist | P1 |
| BOOK-027 | Already booked | 1. View already booked session | "Booked" badge, no book button | P1 |
| BOOK-028 | Filter by class | 1. Use class filter dropdown | Sessions filtered by class type | P2 |
| BOOK-029 | Filter by location | 1. Use location filter | Sessions filtered by location | P2 |

---

## 5. Invoices Screen

### 5.1 Invoices List

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| INV-001 | All invoices | 1. Navigate to Invoices tab | List of all invoices | P0 |
| INV-002 | Filter pending | 1. Select "Pending" filter | Only pending invoices shown | P1 |
| INV-003 | Filter paid | 1. Select "Paid" filter | Only paid invoices shown | P1 |
| INV-004 | Filter overdue | 1. Select "Overdue" filter | Only overdue invoices shown | P1 |
| INV-005 | Empty state | 1. No invoices | Empty state message | P2 |
| INV-006 | Pull to refresh | 1. Pull down on list | Data refreshes | P1 |
| INV-007 | Pagination | 1. Have many invoices<br>2. Scroll | More invoices load | P2 |

### 5.2 Invoice Card Display

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| INV-008 | Invoice number | 1. View invoice card | Invoice number displayed | P1 |
| INV-009 | Total amount | 1. View invoice card | Amount with currency | P1 |
| INV-010 | Status badge | 1. View invoice card | Correct status badge color | P1 |
| INV-011 | Due date | 1. View invoice card | Due date displayed | P1 |
| INV-012 | Overdue indicator | 1. View overdue invoice | Red indicator/text | P1 |

### 5.3 Invoice Summary Cards

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| INV-013 | Total due card | 1. View invoices screen | Total amount due displayed | P1 |
| INV-014 | Pending count | 1. View invoices screen | Number of pending invoices | P2 |
| INV-015 | Overdue count | 1. View invoices screen | Number of overdue invoices | P2 |

### 5.4 Invoice Detail

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| INV-016 | View detail | 1. Tap invoice card | Invoice detail screen opens | P0 |
| INV-017 | Line items | 1. View detail screen | List of line items with descriptions | P1 |
| INV-018 | Subtotal | 1. View detail screen | Subtotal amount | P1 |
| INV-019 | VAT amount | 1. View detail screen | VAT (15%) amount | P1 |
| INV-020 | Total | 1. View detail screen | Total amount | P1 |
| INV-021 | Issue date | 1. View detail screen | Issue date displayed | P2 |
| INV-022 | Due date | 1. View detail screen | Due date displayed | P1 |

### 5.5 Invoice Actions

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| INV-023 | Pay Now button | 1. View pending invoice detail | "Pay Now" button visible | P0 |
| INV-024 | Pay Now hidden | 1. View paid invoice detail | "Pay Now" button not visible | P1 |
| INV-025 | Download PDF | 1. Tap "Download PDF" | PDF downloads/opens | P1 |
| INV-026 | PDF download error | 1. Simulate download error | Error message shown | P2 |

### 5.6 Payment Flow

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| INV-027 | Initiate payment | 1. Tap "Pay Now" | Payment screen/WebView opens | P0 |
| INV-028 | Payment loading | 1. Observe payment initiation | Loading indicator shown | P2 |
| INV-029 | Payment success | 1. Complete payment successfully | Success screen, invoice marked paid | P0 |
| INV-030 | Payment failed | 1. Fail payment | Error screen with retry option | P1 |
| INV-031 | Payment cancelled | 1. Cancel payment | Return to invoice detail | P1 |
| INV-032 | Return from payment | 1. Complete payment flow | Navigate back to invoices | P1 |

---

## 6. Profile Screen

### 6.1 Profile Display

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PROF-001 | Profile loads | 1. Navigate to Profile tab | Profile information displayed | P0 |
| PROF-002 | Avatar display | 1. View profile | Avatar with initials or image | P2 |
| PROF-003 | Name display | 1. View profile | Full name displayed | P1 |
| PROF-004 | Email display | 1. View profile | Email address displayed | P1 |
| PROF-005 | Phone display | 1. View profile | Phone number displayed | P2 |
| PROF-006 | DOB display | 1. View profile | Date of birth displayed | P3 |

### 6.2 Personal Info Section

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PROF-007 | Personal info card | 1. View profile | Personal info section visible | P1 |
| PROF-008 | Address info | 1. View profile | Address displayed (if set) | P2 |
| PROF-009 | Emergency contact | 1. View profile | Emergency contact displayed (if set) | P2 |

### 6.3 Subscription Info

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PROF-010 | Active subscription | 1. View profile | Current subscription details | P1 |
| PROF-011 | Subscription status | 1. View profile | Status badge displayed | P1 |
| PROF-012 | Days remaining | 1. View profile | Days remaining in subscription | P2 |

### 6.4 Edit Profile

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PROF-013 | Open edit | 1. Tap "Edit Profile" | Edit profile screen opens | P0 |
| PROF-014 | Pre-filled fields | 1. View edit screen | All fields pre-filled with current data | P1 |
| PROF-015 | Edit first name | 1. Change first name<br>2. Save | Name updated successfully | P1 |
| PROF-016 | Edit last name | 1. Change last name<br>2. Save | Name updated successfully | P1 |
| PROF-017 | Edit phone | 1. Change phone<br>2. Save | Phone updated successfully | P1 |
| PROF-018 | Invalid phone | 1. Enter invalid phone<br>2. Save | Validation error shown | P2 |
| PROF-019 | Edit DOB | 1. Change date of birth<br>2. Save | DOB updated successfully | P2 |
| PROF-020 | Edit address | 1. Change address fields<br>2. Save | Address updated successfully | P2 |
| PROF-021 | Edit emergency contact | 1. Change emergency contact<br>2. Save | Contact updated successfully | P2 |
| PROF-022 | Save loading | 1. Tap Save | Loading indicator during save | P2 |
| PROF-023 | Save success | 1. Save changes | Success message, navigate back | P1 |
| PROF-024 | Save error | 1. Simulate save error | Error message shown | P1 |
| PROF-025 | Cancel edit | 1. Tap Back without saving | Changes discarded, navigate back | P2 |
| PROF-026 | Email not editable | 1. View email field | Email field is read-only | P1 |

### 6.5 Change Password

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PROF-027 | Open change password | 1. Tap "Change Password" | Change password screen opens | P0 |
| PROF-028 | Current password | 1. Enter current password | Field accepts input | P1 |
| PROF-029 | New password | 1. Enter new password | Field accepts input | P1 |
| PROF-030 | Confirm password | 1. Enter confirmation | Field accepts input | P1 |
| PROF-031 | Password mismatch | 1. Enter different confirmation<br>2. Submit | "Passwords don't match" error | P1 |
| PROF-032 | Weak password | 1. Enter weak password<br>2. Submit | "Password too weak" error | P1 |
| PROF-033 | Wrong current password | 1. Enter wrong current password<br>2. Submit | "Incorrect password" error | P1 |
| PROF-034 | Successful change | 1. Enter all valid<br>2. Submit | Success message | P0 |
| PROF-035 | Password strength indicator | 1. Type new password | Strength indicator updates | P3 |
| PROF-036 | Password requirements | 1. View screen | Requirements checklist shown | P2 |

### 6.6 Profile Actions

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PROF-037 | Notification settings | 1. Tap "Notification Settings" | Settings screen opens | P2 |
| PROF-038 | Subscription history | 1. Tap "Subscription History" | History screen opens | P3 |
| PROF-039 | Attendance history | 1. Tap "Attendance History" | History screen opens | P3 |
| PROF-040 | Logout button | 1. View profile | Logout button visible at bottom | P1 |

---

## 7. Notifications

### 7.1 Notification List

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| NOTIF-001 | View notifications | 1. Tap notification bell | Notifications list opens | P1 |
| NOTIF-002 | All notifications | 1. Select "All" toggle | All notifications shown | P1 |
| NOTIF-003 | Unread only | 1. Select "Unread" toggle | Only unread notifications | P1 |
| NOTIF-004 | Empty state | 1. No notifications | Empty state message | P2 |
| NOTIF-005 | Unread count badge | 1. Have unread notifications | Badge on bell icon shows count | P1 |

### 7.2 Notification Card

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| NOTIF-006 | Subject display | 1. View notification | Subject text displayed | P1 |
| NOTIF-007 | Body preview | 1. View notification | Body text preview | P2 |
| NOTIF-008 | Time display | 1. View notification | Relative time (e.g., "2 hours ago") | P2 |
| NOTIF-009 | Unread indicator | 1. View unread notification | Visual indicator (dot/highlight) | P1 |
| NOTIF-010 | Type icon | 1. View notification | Icon based on notification type | P3 |

### 7.3 Notification Actions

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| NOTIF-011 | Tap to expand | 1. Tap notification | Full body text shown | P2 |
| NOTIF-012 | Mark as read | 1. Tap unread notification | Marked as read | P1 |
| NOTIF-013 | Mark all read | 1. Tap "Mark All as Read" | All notifications marked read | P2 |
| NOTIF-014 | Mark all read empty | 1. No unread<br>2. Tap Mark All | Button disabled or no action | P3 |

### 7.4 Notification Settings

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| NOTIF-015 | Open settings | 1. Tap settings icon | Notification settings screen | P2 |
| NOTIF-016 | Toggle email | 1. Toggle email notifications | Setting saved | P2 |
| NOTIF-017 | Toggle SMS | 1. Toggle SMS notifications | Setting saved | P2 |
| NOTIF-018 | Toggle push | 1. Toggle push notifications | Setting saved | P2 |
| NOTIF-019 | Type preferences | 1. Toggle notification types | Settings saved | P3 |
| NOTIF-020 | Language preference | 1. Change preferred language | Setting saved | P3 |

---

## 8. Navigation & UI

### 8.1 Bottom Navigation

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| NAV-001 | Home tab | 1. Tap Home icon | Navigate to Home screen | P0 |
| NAV-002 | Classes tab | 1. Tap Classes icon | Navigate to Bookings screen | P0 |
| NAV-003 | QR tab (center) | 1. Tap QR icon | Navigate to QR screen | P0 |
| NAV-004 | Invoices tab | 1. Tap Invoices icon | Navigate to Invoices screen | P0 |
| NAV-005 | Profile tab | 1. Tap Profile icon | Navigate to Profile screen | P0 |
| NAV-006 | Active tab indicator | 1. Navigate between tabs | Active tab highlighted | P1 |
| NAV-007 | Tab labels | 1. View bottom bar | Labels visible under icons | P2 |
| NAV-008 | QR tab elevated | 1. View bottom bar | Center QR tab appears elevated/FAB style | P3 |

### 8.2 Top Bar

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| NAV-009 | Greeting text | 1. View top bar | "Hello, {name}" displayed | P2 |
| NAV-010 | Notification bell | 1. View top bar | Notification bell icon visible | P1 |
| NAV-011 | Unread badge | 1. Have unread notifications | Badge shows count on bell | P1 |
| NAV-012 | Language toggle | 1. View top bar | EN/AR toggle visible | P1 |
| NAV-013 | Avatar | 1. View top bar | User avatar displayed | P2 |

### 8.3 Language Switching

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| LANG-001 | Switch to Arabic | 1. Tap Arabic (ع) button | UI switches to Arabic | P1 |
| LANG-002 | Switch to English | 1. Tap English (EN) button | UI switches to English | P1 |
| LANG-003 | RTL layout | 1. Switch to Arabic | Layout direction changes to RTL | P1 |
| LANG-004 | LTR layout | 1. Switch to English | Layout direction changes to LTR | P1 |
| LANG-005 | Persistent language | 1. Switch language<br>2. Restart app | Language preference persisted | P1 |
| LANG-006 | API content language | 1. Switch language | API content in selected language | P1 |
| LANG-007 | Date format | 1. Switch language | Dates formatted per locale | P2 |
| LANG-008 | Currency format | 1. Switch language | Currency formatted per locale | P2 |

### 8.4 Screen Transitions

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| NAV-014 | Smooth transitions | 1. Navigate between screens | Transitions are smooth | P2 |
| NAV-015 | Back navigation | 1. Press back button | Navigate to previous screen | P1 |
| NAV-016 | Deep navigation back | 1. Navigate deep<br>2. Press back multiple times | Returns to correct screens | P2 |

---

## 9. Error Handling & Edge Cases

### 9.1 Network Errors

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ERR-001 | No internet on load | 1. Turn off internet<br>2. Open app | Network error message | P1 |
| ERR-002 | Connection lost | 1. Make API call<br>2. Disconnect mid-request | Error message, retry option | P1 |
| ERR-003 | Slow network | 1. Use slow network<br>2. Navigate | Loading states visible, no timeout crash | P2 |
| ERR-004 | Retry button | 1. Get network error<br>2. Tap Retry | Request retried | P1 |

### 9.2 Server Errors

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ERR-005 | 500 error | 1. Trigger server error | Generic error message | P1 |
| ERR-006 | 404 error | 1. Request non-existent resource | "Not found" message | P2 |
| ERR-007 | 403 error | 1. Access forbidden resource | "Access denied" message | P2 |
| ERR-008 | 401 error | 1. Use expired token | Redirect to login | P1 |

### 9.3 Validation Errors

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ERR-009 | Form validation | 1. Submit invalid form | Field-level error messages | P1 |
| ERR-010 | Backend validation | 1. Submit data rejected by backend | Error message from server | P1 |

### 9.4 Empty States

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| ERR-011 | Empty bookings | 1. No bookings | Friendly empty state with CTA | P2 |
| ERR-012 | Empty invoices | 1. No invoices | Friendly empty state | P2 |
| ERR-013 | Empty notifications | 1. No notifications | "All caught up" message | P2 |

---

## 10. Performance & Stability

### 10.1 Performance

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PERF-001 | App startup time | 1. Cold start app | Opens within 3 seconds | P1 |
| PERF-002 | Screen load time | 1. Navigate to any screen | Loads within 2 seconds | P1 |
| PERF-003 | Scroll performance | 1. Scroll long lists | Smooth 60fps scrolling | P2 |
| PERF-004 | Memory usage | 1. Use app for 10 minutes | No significant memory growth | P2 |
| PERF-005 | Battery usage | 1. Use app actively | No excessive battery drain | P3 |

### 10.2 Stability

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| STAB-001 | Background/foreground | 1. Background app<br>2. Foreground | App resumes correctly | P1 |
| STAB-002 | Screen rotation | 1. Rotate device | UI adapts (if supported) | P3 |
| STAB-003 | Memory pressure | 1. Open many other apps<br>2. Return to app | App recovers gracefully | P2 |
| STAB-004 | Rapid navigation | 1. Navigate quickly between tabs | No crashes | P1 |
| STAB-005 | Double tap protection | 1. Double tap buttons quickly | Only one action triggered | P2 |

---

## 11. Platform-Specific Tests

### 11.1 Android Specific

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| AND-001 | Back button | 1. Press Android back button | Navigate back or exit | P1 |
| AND-002 | App switcher | 1. View in app switcher | Correct app preview | P3 |
| AND-003 | Notifications | 1. Receive push notification | Notification appears | P2 |
| AND-004 | Deep link | 1. Open app via deep link | Navigate to correct screen | P2 |
| AND-005 | Split screen | 1. Use in split screen mode | App works correctly | P3 |

### 11.2 iOS Specific

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| IOS-001 | Swipe back | 1. Swipe from left edge | Navigate back | P2 |
| IOS-002 | Safe area | 1. View on notched device | Content respects safe area | P1 |
| IOS-003 | Dynamic type | 1. Change system font size | App text scales | P3 |
| IOS-004 | Dark mode | 1. Enable system dark mode | App respects setting | P2 |
| IOS-005 | Face ID | 1. Use Face ID (if implemented) | Biometric auth works | P3 |

---

## 12. Accessibility

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| A11Y-001 | Screen reader | 1. Enable TalkBack/VoiceOver<br>2. Navigate app | All elements announced | P2 |
| A11Y-002 | Touch targets | 1. Check button sizes | Minimum 44x44dp touch targets | P2 |
| A11Y-003 | Color contrast | 1. Check text colors | Sufficient contrast ratio | P2 |
| A11Y-004 | Focus order | 1. Navigate with screen reader | Logical focus order | P3 |
| A11Y-005 | Labels | 1. Check with screen reader | All buttons/icons have labels | P2 |

---

## Test Execution Tracking

### Test Summary Template

| Module | Total | Passed | Failed | Blocked | Not Run |
|--------|-------|--------|--------|---------|---------|
| Authentication | 12 | | | | |
| Dashboard | 27 | | | | |
| QR Code | 13 | | | | |
| Bookings | 29 | | | | |
| Invoices | 32 | | | | |
| Profile | 40 | | | | |
| Notifications | 20 | | | | |
| Navigation | 16 | | | | |
| Error Handling | 13 | | | | |
| Performance | 5 | | | | |
| Platform-Specific | 10 | | | | |
| Accessibility | 5 | | | | |
| **Total** | **222** | | | | |

### Defect Template

| ID | Module | Test Case | Severity | Description | Steps to Reproduce | Expected | Actual | Status |
|----|--------|-----------|----------|-------------|-------------------|----------|--------|--------|
| | | | | | | | | |

### Severity Levels

| Level | Description |
|-------|-------------|
| Critical | App crash, data loss, security issue |
| High | Major feature broken, no workaround |
| Medium | Feature issue with workaround |
| Low | Minor UI issue, cosmetic |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Product Owner | | | |
| Dev Lead | | | |
