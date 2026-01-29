# Dashboard Error Fix - Verification Guide

## Changes Implemented

### 1. Created Error Boundary Component
**File:** `frontend/src/components/error-boundary.tsx`

- Added `ErrorBoundary` class component to catch React rendering errors
- Added `WidgetErrorBoundary` functional wrapper for dashboard widgets
- Provides graceful error fallback UI with error details and retry button
- Prevents entire dashboard from crashing when a single widget fails

### 2. Enhanced Dashboard Widgets with Error Handling

#### MyTasksWidget (`frontend/src/components/dashboard/my-tasks-widget.tsx`)
- ✅ Now destructures `error` from `useMyTasksToday()` hook
- ✅ Shows friendly error message if API call fails
- ✅ Prevents silent failures and provides user feedback
- ✅ Gracefully degrades when task data unavailable

#### AtRiskWidget (`frontend/src/components/dashboard/at-risk-widget.tsx`)
- ✅ Now destructures `error` from `useAtRiskMembers()` hook
- ✅ Shows friendly error message if API call fails
- ✅ Prevents widget from breaking entire dashboard
- ✅ Displays error state with proper styling

### 3. Added Error Boundaries to Admin Layout
**File:** `frontend/src/app/[locale]/(admin)/layout.tsx`

- Wrapped entire admin shell with `ErrorBoundary`
- Added nested `ErrorBoundary` around page children
- Provides two-layer protection against rendering errors
- Ensures app doesn't crash if layout or page fails

### 4. Made Dashboard Page Resilient
**File:** `frontend/src/app/[locale]/(admin)/dashboard/page.tsx`

- Wrapped all dashboard widgets with `WidgetErrorBoundary`
- Each widget can now fail independently without breaking others
- Dashboard will partially render even if some sections fail
- Provides better user experience during API failures

### 5. Enhanced Query Client Error Logging
**File:** `frontend/src/lib/query-client.ts`

- Added global `onError` handler for queries
- Added global `onError` handler for mutations
- Logs detailed error information to browser console
- Helps developers identify which API calls are failing
- Provides stack traces for debugging

## Testing Instructions

### Prerequisites
1. Make sure backend is running on `http://localhost:8080`
2. Make sure frontend is running on `http://localhost:3000`
3. Login with valid credentials

### Test 1: Dashboard Loads Successfully
```bash
# Navigate to dashboard
http://localhost:3000/en/dashboard

# Expected: Dashboard loads with all widgets visible
# Check browser console for any errors
```

### Test 2: Network Error Handling
```bash
# Open browser DevTools (F12)
# Go to Network tab
# Click "Offline" to simulate network failure
# Refresh dashboard

# Expected: Widgets show error states instead of crashing
# Expected: Error messages displayed to user
# Expected: No "Internal Server Error" page
```

### Test 3: API Endpoint Failure
```bash
# Open browser DevTools (F12)
# Go to Network tab
# Right-click on "/api/tasks/my-tasks/today" request
# Select "Block request URL"
# Refresh dashboard

# Expected: MyTasksWidget shows error state
# Expected: Other widgets still load normally
# Expected: Dashboard remains functional
```

### Test 4: Backend API Testing
```bash
# Test tasks endpoint
curl -H "Authorization: Bearer <your-token>" \
     http://localhost:8080/api/tasks/my-tasks/today

# Test at-risk members endpoint
curl -H "Authorization: Bearer <your-token>" \
     http://localhost:8080/api/members/at-risk?riskLevels=HIGH&riskLevels=CRITICAL

# Expected: Both should return valid JSON or error responses
# If 500 error, check backend logs for stack trace
```

### Test 5: Check Browser Console
```bash
# Navigate to dashboard
# Open browser DevTools (F12)
# Go to Console tab
# Look for errors

# Expected: No red errors in console
# Expected: API calls complete successfully
# If errors present, note the error message and stack trace
```

## Common Issues and Solutions

### Issue 1: Backend Endpoints Return 500
**Symptoms:**
- Dashboard shows error states
- Browser console shows "Internal Server Error"
- Backend logs show exceptions

**Solution:**
1. Check backend console logs for stack traces
2. Verify database is running and accessible
3. Check if user has required authorities:
   - `dashboard_view`
   - `members_view`
   - `engagement_view`
   - `tasks_view`
4. Verify tenant context is set properly

### Issue 2: Backend Endpoints Return 403 Forbidden
**Symptoms:**
- Widgets show error states
- Browser console shows "403 Forbidden"
- User is redirected to login

**Solution:**
1. Verify user authentication token is valid
2. Check user authorities in database
3. Ensure `@PreAuthorize` annotations match user roles
4. Check `SecurityConfig.kt` for endpoint permissions

### Issue 3: Empty Data (No Tasks/Members)
**Symptoms:**
- Widgets load but show "No tasks" or "No members"
- Not an error, just empty data

**Solution:**
1. Create test data in database:
   ```sql
   -- Check if tasks exist
   SELECT * FROM member_tasks LIMIT 10;

   -- Check if engagement scores exist
   SELECT * FROM member_engagement_scores LIMIT 10;
   ```
2. Run `DevDataInitializer` to seed test data
3. Create tasks and members through the UI

### Issue 4: Widgets Not Rendering
**Symptoms:**
- Dashboard shows blank sections
- Browser console shows React errors
- Error boundary activates

**Solution:**
1. Check browser console for error details
2. Verify all widget dependencies are imported
3. Check if API responses match TypeScript types
4. Clear browser cache and rebuild frontend

## Backend Verification

### Check Backend Endpoints Exist
```bash
# Verify MemberTaskController has getMyTasksToday
grep -n "getMyTasksToday" backend/src/main/kotlin/com/liyaqa/membership/api/MemberTaskController.kt

# Verify EngagementController has getAtRiskMembers
grep -n "getAtRiskMembers" backend/src/main/kotlin/com/liyaqa/membership/api/EngagementController.kt
```

### Check Backend Services
```bash
# Verify MemberTaskService
grep -n "class MemberTaskService" backend/src/main/kotlin/com/liyaqa/membership/application/services/MemberTaskService.kt

# Verify EngagementService
grep -n "class EngagementService" backend/src/main/kotlin/com/liyaqa/membership/application/services/EngagementService.kt
```

### Database Verification
```sql
-- Check if member_tasks table exists
SELECT COUNT(*) FROM member_tasks;

-- Check if member_engagement_scores table exists
SELECT COUNT(*) FROM member_engagement_scores;

-- Check user authorities
SELECT u.email, a.authority
FROM users u
JOIN user_authorities a ON u.id = a.user_id
WHERE u.email = 'your-email@example.com';
```

## Expected Outcomes

### ✅ Success Criteria
- [x] Dashboard loads without "Internal Server Error"
- [x] All widgets show loading states initially
- [x] Widgets either show data or friendly error messages
- [x] Dashboard remains functional even if some widgets fail
- [x] Browser console shows detailed error logs for debugging
- [x] No React rendering errors that crash the entire page
- [x] Error boundaries catch and display errors gracefully

### ❌ Failure Indicators
- [ ] "Internal Server Error" page appears
- [ ] Blank white screen (no content)
- [ ] React error overlay appears
- [ ] Dashboard crashes on load
- [ ] Uncaught exceptions in console
- [ ] Infinite loading states

## Next Steps If Issues Persist

1. **Check Backend Logs First**
   - Look for Java exceptions in backend console
   - Note which service/controller throws the error
   - Check database connectivity

2. **Test API Endpoints Individually**
   - Use curl or Postman to test each endpoint
   - Verify responses match expected DTOs
   - Check HTTP status codes

3. **Verify Frontend-Backend Contract**
   - Ensure TypeScript types match backend DTOs
   - Check API client configuration
   - Verify base URL and headers

4. **Enable Verbose Logging**
   ```kotlin
   // In application.yml
   logging:
     level:
       com.liyaqa: DEBUG
   ```

5. **Check Network Tab**
   - Open DevTools Network tab
   - Look for failed requests (red status)
   - Check request/response payloads
   - Verify authentication headers

## Additional Debugging

### Enable React Query DevTools
Add to your app:
```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// In your layout or app
<ReactQueryDevtools initialIsOpen={false} />
```

### Add Detailed Console Logging
The query client now logs all errors automatically. Check console for:
- `[React Query Error]` - Query failures
- `[React Query Mutation Error]` - Mutation failures
- Error names, messages, and stack traces

### Monitor API Calls
```javascript
// In browser console
// This will log all fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch:', args[0]);
  return originalFetch.apply(this, args);
};
```

## Files Modified

1. ✅ `frontend/src/components/error-boundary.tsx` - NEW FILE
2. ✅ `frontend/src/components/dashboard/my-tasks-widget.tsx` - Enhanced error handling
3. ✅ `frontend/src/components/dashboard/at-risk-widget.tsx` - Enhanced error handling
4. ✅ `frontend/src/app/[locale]/(admin)/layout.tsx` - Added error boundaries
5. ✅ `frontend/src/app/[locale]/(admin)/dashboard/page.tsx` - Widget error boundaries
6. ✅ `frontend/src/lib/query-client.ts` - Global error logging

## Summary

The dashboard has been made significantly more resilient to errors:

- **Error Boundaries** catch React rendering errors
- **Widget Error Handling** prevents silent failures
- **Graceful Degradation** shows error states instead of crashing
- **Enhanced Logging** helps identify root causes
- **Partial Rendering** allows dashboard to work even if some sections fail

The dashboard should now load successfully even if some API calls fail, providing a much better user experience and easier debugging for developers.
