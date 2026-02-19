# Manual Testing Guide - Unauthenticated Redirect

## Quick Start

**Server:** http://localhost:3001 ✅ Running
**Status:** Ready for manual testing

---

## Test 1: Primary Test - Unauthenticated Access

### Steps

1. **Open incognito/private window**
   - Chrome: `Cmd+Shift+N` (Mac) or `Ctrl+Shift+N` (Windows)
   - Firefox: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
   - Safari: `Cmd+Shift+N` (Mac)

2. **Navigate to dashboard**
   ```
   http://localhost:3001/en/platform-dashboard
   ```

3. **Open DevTools** (`F12` or `Cmd+Option+I`)
   - Go to **Network** tab
   - Enable "Preserve log"

### Expected Results

✅ **Network Tab:**
```
Request 1: GET /en/platform-dashboard
Status: 307 Temporary Redirect
Location: /en/platform-login?redirect=%2Fen%2Fplatform-dashboard
```

✅ **Browser URL:**
```
http://localhost:3001/en/platform-login?redirect=%2Fen%2Fplatform-dashboard
```

✅ **Page Display:**
- Login page renders
- Email input form visible
- No auto-redirect
- No errors in console

### Screenshot Checklist

- [ ] Network tab shows 307 redirect
- [ ] URL contains `redirect` parameter
- [ ] Login form is visible
- [ ] No console errors

---

## Test 2: Authentication Flow with Redirect

### Prerequisites

- Completed Test 1
- On login page with redirect parameter

### Steps

1. **Enter email**
   - Use a valid platform user email
   - Click "Continue"

2. **Check email**
   - Get 6-digit verification code
   - Enter code in form
   - Click "Verify"

3. **Observe redirect**
   - After successful verification
   - Watch URL change

### Expected Results

✅ **After successful verification:**
```
Redirected to: http://localhost:3001/en/platform-dashboard
```

✅ **Dashboard:**
- Dashboard loads successfully
- No redirect loop
- User remains on dashboard
- Navigation works normally

### Screenshot Checklist

- [ ] Verification succeeds
- [ ] Redirected to dashboard (original requested page)
- [ ] Dashboard content visible
- [ ] No redirect loop

---

## Test 3: Direct Login Access (Authenticated)

### Prerequisites

- Completed Test 2
- Currently authenticated

### Steps

1. **Navigate to login page**
   ```
   http://localhost:3001/en/platform-login
   ```

2. **Observe auto-redirect**

### Expected Results

✅ **Behavior:**
- Login page loads briefly
- Auto-redirects to dashboard
- No redirect parameter in URL

✅ **Final URL:**
```
http://localhost:3001/en/platform-dashboard
```

### Screenshot Checklist

- [ ] Auto-redirect happens
- [ ] Dashboard loads
- [ ] No redirect parameter

---

## Test 4: Token Expiration

### Prerequisites

- Currently authenticated

### Steps

1. **Open DevTools → Application tab**
   - Navigate to **Cookies** section
   - Find `access_token` cookie

2. **Delete the cookie**
   - Right-click `access_token`
   - Select "Delete"

3. **Navigate to protected route**
   ```
   http://localhost:3001/en/platform-dashboard
   ```

### Expected Results

✅ **Redirect:**
```
Redirected to: /en/platform-login?redirect=%2Fen%2Fplatform-dashboard
```

✅ **Login Page:**
- Renders normally
- No auto-redirect
- Shows email form

### Screenshot Checklist

- [ ] Cookie deleted
- [ ] Redirect triggered
- [ ] Login page with redirect param
- [ ] No auto-redirect

---

## Test 5: Multiple Protected Routes

### Steps

Test each route in incognito window:

```
http://localhost:3001/en/platform-dashboard
http://localhost:3001/en/clients
http://localhost:3001/en/deals
http://localhost:3001/en/support
```

### Expected Results

✅ **All routes:**
- Redirect to `/platform-login?redirect=<route>`
- Show 307 in Network tab
- Login page renders
- After auth, redirect to originally requested route

### Quick Test

```bash
# Test dashboard
curl -I http://localhost:3001/en/platform-dashboard

# Test clients
curl -I http://localhost:3001/en/clients

# Test deals
curl -I http://localhost:3001/en/deals
```

**Expected output:** `HTTP/1.1 307 Temporary Redirect`

---

## DevTools Inspection

### Network Tab

**What to look for:**

```
Name: platform-dashboard
Status: 307 Temporary Redirect
Type: document
Size: (from cache)
Time: ~10ms
```

**Headers:**
```
Response Headers:
  location: /en/platform-login?redirect=%2Fen%2Fplatform-dashboard
  HTTP/1.1 307 Temporary Redirect
```

### Application Tab

**Cookies:**
```
access_token → (JWT token when authenticated)
NEXT_LOCALE → en
```

**Local Storage → auth-storage:**
```json
{
  "state": {
    "isAuthenticated": false,
    "user": null,
    "isLoading": false
  },
  "version": 0
}
```

### Console Tab

**Expected:**
- No errors
- No warnings
- Hydration completes successfully

**Not Expected:**
- Redirect loop warnings
- Token validation errors
- Middleware errors

---

## Common Issues & Solutions

### Issue: No redirect happens

**Check:**
1. Server is running: `lsof -ti:3001`
2. Middleware is working: Check Network tab
3. Route is protected: Verify in middleware.ts

**Solution:**
- Restart dev server
- Clear browser cache
- Test in fresh incognito window

---

### Issue: Redirect loop

**Check:**
1. URL has redirect parameter
2. Login page safety checks working
3. No stale auth state

**Solution:**
- Clear all cookies and localStorage
- Close and reopen incognito window
- Verify login page code (lines 58-71)

---

### Issue: Redirect parameter missing after auth

**Check:**
1. URL before authentication has redirect param
2. onCodeSubmit code (lines 116-135)
3. Console for errors

**Solution:**
- Verify redirect param in URL
- Check browser console for errors
- Re-test in clean incognito window

---

## Testing Checklist

### Automated Tests ✅ Complete

- [x] Dashboard redirect (307)
- [x] Clients redirect (307)
- [x] Deals redirect (307)
- [x] Login page accessible (200)
- [x] Redirect parameter URL encoded

### Manual Tests 🔲 Pending

- [ ] Test 1: Unauthenticated access
- [ ] Test 2: Authentication flow
- [ ] Test 3: Auto-redirect when authenticated
- [ ] Test 4: Token expiration
- [ ] Test 5: Multiple protected routes

---

## Success Criteria

### All Tests Pass When:

1. ✅ Unauthenticated users are redirected to login
2. ✅ Redirect parameter preserves original pathname
3. ✅ After auth, user sent to originally requested page
4. ✅ No redirect loops occur
5. ✅ Token expiration triggers new redirect
6. ✅ All protected routes behave consistently

---

## Quick Reference

### URLs to Test

**Protected (should redirect):**
- http://localhost:3001/en/platform-dashboard
- http://localhost:3001/en/clients
- http://localhost:3001/en/deals
- http://localhost:3001/en/support

**Public (should be accessible):**
- http://localhost:3001/en/platform-login
- http://localhost:3001/en

### Expected Redirects

```
/en/platform-dashboard → /en/platform-login?redirect=%2Fen%2Fplatform-dashboard
/en/clients           → /en/platform-login?redirect=%2Fen%2Fclients
/en/deals             → /en/platform-login?redirect=%2Fen%2Fdeals
```

### HTTP Status Codes

- **307** = Temporary Redirect (protected routes)
- **200** = OK (public routes, after auth)
- **403** = Forbidden (non-platform users)

---

## Time Estimate

- Test 1: 2 minutes
- Test 2: 3 minutes (including email code)
- Test 3: 1 minute
- Test 4: 2 minutes
- Test 5: 3 minutes

**Total:** ~11 minutes for complete manual test suite

---

## Support

### Files to Review

If tests fail, check these files:

1. **Middleware:** `frontend/apps/platform/src/middleware.ts`
   - Lines 18-50: Route patterns
   - Lines 126-180: Auth logic

2. **Login Page:** `frontend/apps/platform/src/app/[locale]/(platform)/platform-login/page.tsx`
   - Lines 58-71: Safety checks
   - Lines 116-135: Redirect handling

3. **Layout:** `frontend/apps/platform/src/app/[locale]/(platform)/layout.tsx`
   - Lines 35-46: Client-side redirect

### Documentation

- Implementation details: `UNAUTHENTICATED_REDIRECT_IMPLEMENTATION.md`
- Test results: `REDIRECT_TEST_RESULTS.md`
- This guide: `MANUAL_TESTING_GUIDE.md`

---

**Ready to test!** Start with Test 1 in an incognito window.
