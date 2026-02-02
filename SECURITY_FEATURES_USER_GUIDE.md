# Security Features User Guide

**Platform**: Liyaqa Gym Management System
**Version**: 1.0
**Date**: 2026-02-01

---

## 📖 Welcome to Enhanced Security!

Your Liyaqa account now includes enterprise-grade security features to protect your data and privacy. This guide explains each security feature and how to use them effectively.

---

## Table of Contents

1. [Strong Passwords](#strong-passwords)
2. [Two-Factor Authentication (MFA)](#two-factor-authentication-mfa)
3. [Session Management](#session-management)
4. [Security Alerts](#security-alerts)
5. [Login History](#login-history)
6. [IP-Based Security](#ip-based-security)
7. [OAuth/Social Login](#oauthsocial-login)
8. [Best Practices](#best-practices)
9. [FAQ](#faq)

---

## Strong Passwords

### What Changed?

Passwords now must meet these requirements:
- **Minimum length**: 8 characters (12+ recommended)
- **Complexity**: Must include:
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)
  - At least 1 number (0-9)
  - At least 1 special character (!@#$%^&*)
- **No common passwords**: System blocks frequently used passwords
- **Password history**: Cannot reuse your last 5 passwords

### How to Create a Strong Password

✅ **Good Examples:**
- `MyGym2024!Fit`
- `Tr@in$mart2024`
- `Healthy&Strong99`

❌ **Weak Examples:**
- `password123` (too common)
- `12345678` (no letters)
- `abcdefgh` (no numbers/special chars)

### Changing Your Password

1. Log in to your account
2. Go to **Settings** > **Security**
3. Click **Change Password**
4. Enter current password
5. Enter new password (must meet requirements)
6. Confirm new password
7. Click **Update Password**

**Note**: All your other devices will remain logged in. If you suspect unauthorized access, use "Log out all devices" option.

---

## Two-Factor Authentication (MFA)

### What is MFA?

Two-Factor Authentication adds an extra layer of security by requiring both:
1. **Something you know**: Your password
2. **Something you have**: Your phone (authenticator app)

Even if someone steals your password, they cannot access your account without the second factor.

### Setting Up MFA

**Step 1: Enable MFA**
1. Go to **Settings** > **Security** > **Two-Factor Authentication**
2. Click **Enable MFA**

**Step 2: Install Authenticator App**

Download one of these apps on your phone:
- Google Authenticator (iOS/Android)
- Microsoft Authenticator (iOS/Android)
- Authy (iOS/Android)
- 1Password (iOS/Android)

**Step 3: Scan QR Code**
1. Open your authenticator app
2. Tap "+" or "Add Account"
3. Scan the QR code shown on screen
4. Your app will show a 6-digit code

**Step 4: Verify Setup**
1. Enter the 6-digit code from your app
2. Click **Verify and Enable**

**Step 5: Save Backup Codes**
1. Download and print your 10 backup codes
2. Store them in a safe place
3. Each code works only once

### Logging In with MFA

1. Enter your email and password
2. Click **Sign In**
3. You'll see a prompt for MFA code
4. Open your authenticator app
5. Enter the 6-digit code (updates every 30 seconds)
6. Click **Verify**

**Tip**: You have 30 seconds to enter the code. If it expires, wait for the next code.

### Using Backup Codes

If you lose your phone or can't access your authenticator app:

1. Click **Use Backup Code** on the MFA screen
2. Enter one of your 10 backup codes
3. Click **Verify**

**Important**:
- Each backup code works only once
- Keep backup codes in a safe place
- You can regenerate codes anytime in settings

### Disabling MFA

1. Go to **Settings** > **Security** > **Two-Factor Authentication**
2. Click **Disable MFA**
3. Enter your password to confirm
4. Click **Disable**

**Warning**: Disabling MFA makes your account less secure. Only disable if absolutely necessary.

---

## Session Management

### What is a Session?

A session represents your login from a specific device and location. You can be logged in on multiple devices simultaneously (maximum 5).

### Viewing Your Sessions

1. Go to **Settings** > **Security** > **Active Sessions**
2. You'll see a list of all devices where you're logged in

Each session shows:
- **Device**: Browser and operating system
- **Location**: City and country
- **IP Address**: Network address
- **Last Active**: When you last used this session
- **This Device**: Badge showing your current session

### Managing Sessions

**Revoke a Specific Session:**
1. Find the session you want to close
2. Click **Revoke** button
3. Confirm the action
4. That device will be immediately logged out

**Revoke All Other Sessions:**
1. Click **Revoke All Other Devices**
2. Confirm the action
3. All sessions except your current one will be closed

**Use Cases:**
- You forgot to log out on a public computer
- You lost a device
- You suspect unauthorized access
- You want to ensure only your current device has access

### Session Limits

- **Maximum sessions**: 5 devices simultaneously
- **Automatic removal**: When you reach the limit, your oldest session is automatically closed
- **Session duration**: Sessions expire after 7 days of inactivity
- **Absolute timeout**: All sessions expire after 24 hours (you'll need to log in again)

---

## Security Alerts

### What are Security Alerts?

The system automatically monitors for suspicious activity and alerts you when something unusual is detected.

### Types of Alerts

**1. Impossible Travel**
- **What it detects**: Logins from two distant locations within a short time
- **Example**: You log in from New York, then Tokyo 30 minutes later (impossible to travel that fast)
- **Severity**: CRITICAL

**2. New Device**
- **What it detects**: Login from a device you've never used before
- **Severity**: MEDIUM

**3. New Location**
- **What it detects**: Login from a country or city you've never logged in from
- **Severity**: LOW to MEDIUM

**4. Unusual Login Time**
- **What it detects**: Login at a time you normally don't use the system
- **Example**: You usually log in during 9am-5pm, but there's a login at 3am
- **Severity**: LOW

**5. Brute Force Attack**
- **What it detects**: Multiple failed login attempts from the same IP address
- **Severity**: HIGH to CRITICAL

**6. Multiple Sessions**
- **What it detects**: Too many concurrent sessions from different locations
- **Severity**: MEDIUM

### Viewing Security Alerts

1. Go to **Security** > **Alerts**
2. You'll see all recent alerts
3. Unread alerts are highlighted
4. Red dot indicator shows number of unread alerts

### Responding to Alerts

**If the activity was YOU:**
1. Click on the alert
2. Click **Yes, This Was Me**
3. Alert is marked as acknowledged

**If the activity was NOT you:**
1. Click on the alert
2. Click **No, This Wasn't Me**
3. Immediately:
   - Change your password
   - Enable MFA (if not already enabled)
   - Revoke all sessions
   - Review your account for unauthorized changes

**Bulk Actions:**
- Click **Acknowledge All** to mark all alerts as read if you recognize all activity

### Alert Notifications

You'll receive email notifications for:
- CRITICAL severity alerts
- Multiple failed login attempts
- Account lockouts
- New device logins (if configured)

---

## Login History

### Viewing Login History

1. Go to **Security** > **Login History**
2. View complete history of all login attempts

### What Information is Tracked?

For each login attempt, you'll see:
- **Date and Time**: When the login occurred
- **Status**: Success, Failed, or Locked
- **Location**: City and country (estimated from IP)
- **IP Address**: Network address used
- **Device**: Browser and operating system
- **Outcome**: Whether login was successful

### Why This is Useful

- **Detect unauthorized access**: See if someone else is trying to access your account
- **Track your own activity**: Review where and when you've logged in
- **Security audit**: Maintain a record for compliance purposes

### Export Login History

1. Go to **Security** > **Login History**
2. Click **Export**
3. Choose format: CSV or PDF
4. Download the file

---

## IP-Based Security

### What is IP Binding?

IP Binding is an optional security feature that ties your session to the network (IP address) where you logged in. If someone steals your login tokens, they cannot use them from a different network.

### When to Enable IP Binding

✅ **Enable IP Binding if you:**
- Always log in from the same location (home or office)
- Have a static IP address
- Want maximum security
- Access sensitive or financial data

❌ **Don't enable IP Binding if you:**
- Use mobile data (cellular IP changes frequently)
- Use a VPN (IP changes when VPN reconnects)
- Travel frequently
- Have dynamic IP from your ISP

### How to Enable IP Binding

1. Go to **Settings** > **Security** > **Security Preferences**
2. Toggle **IP Binding** to ON
3. Click **Save**

### What Happens When Enabled?

**Normal Use:**
- You log in from IP 192.168.1.100
- All your activity works normally from this IP
- Token refresh works as expected

**If IP Changes:**
- You try to use the app from a different IP
- Token refresh will fail
- You'll need to log in again from the new location

**Error Message:**
> "IP address validation failed. Your session may have been compromised. Please log in again from your original location."

### Troubleshooting IP Binding

**Problem**: Keep getting logged out
**Solution**: Your IP is changing. Disable IP Binding.

**Problem**: Can't log in after enabling
**Solution**:
1. Clear browser cache
2. Log out completely
3. Log in again
4. IP Binding will track the new IP

---

## OAuth/Social Login

### What is OAuth Login?

OAuth allows you to log in using your existing accounts from trusted providers like Google or Microsoft, without creating a new password.

### Benefits

✅ **Convenience**: One less password to remember
✅ **Security**: Leverage Google/Microsoft's security features
✅ **Speed**: Faster login process
✅ **MFA**: Inherit MFA from your provider

### Available Providers

- **Google**: @gmail.com accounts
- **Microsoft**: @outlook.com, @hotmail.com, Office 365 accounts
- **GitHub**: Developer accounts
- **Okta**: Enterprise SSO (if configured by your organization)

### Setting Up OAuth Login

**For New Users:**
1. On the registration page, click **Sign up with Google** (or other provider)
2. Authorize Liyaqa to access your basic profile
3. Your account is created automatically
4. No password needed

**For Existing Users (Linking):**
1. Log in with your password
2. Go to **Settings** > **Connected Accounts**
3. Click **Connect Google Account** (or other provider)
4. Authorize the connection
5. Now you can log in with either method

### Logging In with OAuth

1. On the login page, click **Sign in with Google** (or other provider)
2. Select your account (if multiple)
3. You're logged in immediately

### Managing OAuth Connections

**View Connected Accounts:**
1. Go to **Settings** > **Connected Accounts**
2. See which OAuth providers are linked

**Disconnect an Account:**
1. Click **Disconnect** next to the provider
2. Confirm the action
3. You can no longer log in with that provider

**Important**: If you disconnect all OAuth providers and don't have a password set, you'll be locked out. Always ensure you have at least one login method.

### OAuth Security

- OAuth tokens are encrypted and stored securely
- You can revoke access anytime from your provider's settings
- Each provider has its own security features (MFA, etc.)
- We only access basic profile information (name, email)

---

## Best Practices

### Password Management

1. **Use a Password Manager**:
   - 1Password, LastPass, Bitwarden
   - Generate and store strong passwords
   - Sync across devices

2. **Never Share Your Password**:
   - Don't email it
   - Don't write it down
   - Don't tell anyone (not even support staff)

3. **Use Unique Passwords**:
   - Different password for each service
   - If one is compromised, others are safe

### Account Security

1. **Enable MFA**:
   - Adds critical extra layer
   - Prevents 99.9% of automated attacks
   - Required for admin accounts

2. **Review Sessions Regularly**:
   - Check active sessions weekly
   - Revoke unknown sessions
   - Log out when done

3. **Monitor Security Alerts**:
   - Check alerts when you see notifications
   - Investigate anything suspicious
   - Act quickly on critical alerts

### Device Security

1. **Keep Devices Updated**:
   - Update operating system
   - Update web browser
   - Install security patches

2. **Use Secure Networks**:
   - Avoid public Wi-Fi for sensitive operations
   - Use VPN on untrusted networks
   - Prefer cellular data over public Wi-Fi

3. **Physical Security**:
   - Lock your device when away
   - Use device passcode/biometrics
   - Don't leave devices unattended

### What to Do if Compromised

**If you suspect your account is compromised:**

1. **Immediate Actions**:
   - Change your password immediately
   - Enable MFA if not already enabled
   - Revoke all sessions
   - Check login history for unauthorized access

2. **Review Account**:
   - Check profile for unauthorized changes
   - Review security alerts
   - Check connected OAuth accounts
   - Verify email and phone number haven't been changed

3. **Notify Support**:
   - Contact support team
   - Report suspicious activity
   - Request security audit

4. **Follow Up**:
   - Monitor account for next few days
   - Review credit card statements
   - Enable all security features

---

## FAQ

### General Questions

**Q: Why do I need to use MFA?**
A: MFA adds an extra layer of security. Even if someone gets your password, they cannot access your account without the second factor (your phone).

**Q: Can I use SMS for MFA instead of an app?**
A: Currently, we only support authenticator apps for security reasons. SMS can be intercepted and is less secure.

**Q: What happens if I lose my phone?**
A: Use one of your backup codes to log in. Then disable and re-enable MFA with a new device.

### Sessions

**Q: Why was I logged out?**
A: Possible reasons:
- Your session expired (7 days inactivity or 24 hours absolute)
- You logged in on too many devices (max 5)
- Someone revoked your session remotely
- Your password was changed
- IP Binding is enabled and your IP changed

**Q: Can I increase the number of concurrent sessions?**
A: The limit is set to 5 for security reasons and cannot be increased.

**Q: Why does my session expire after 24 hours?**
A: This is an absolute timeout security feature. It forces periodic re-authentication to ensure your account stays secure.

### Security Alerts

**Q: I received an "impossible travel" alert but I haven't traveled.**
A: This could mean:
- Someone accessed your account from another location (investigate immediately)
- You're using a VPN that shows different locations
- Your IP address is being geo-located incorrectly

**Q: How do I stop getting security alerts?**
A: Security alerts cannot be disabled as they're critical for account security. However, you can:
- Acknowledge alerts to mark them as read
- Use consistent devices and locations to reduce alerts
- Enable IP Binding if you always use the same network

### IP Binding

**Q: Should I enable IP Binding?**
A: Enable if you:
- Always use the same network
- Have a static IP
- Want maximum security

Don't enable if you:
- Use mobile data
- Use VPN
- Travel frequently
- Have dynamic IP

**Q: I enabled IP Binding and now I can't access my account from my phone.**
A: Your phone's cellular IP is different from your home IP. Disable IP Binding or always use Wi-Fi at home.

### Passwords

**Q: Why can't I reuse my old password?**
A: We track your last 5 passwords to prevent password reuse. This protects against password compromise.

**Q: What if I forget my password?**
A: Click "Forgot Password" on the login page and follow the reset process.

**Q: How often should I change my password?**
A: Change your password:
- Every 90 days (recommended)
- Immediately if you suspect compromise
- After using a public/shared computer

### OAuth/Social Login

**Q: Is OAuth login secure?**
A: Yes, OAuth is very secure and often more secure than passwords because:
- You leverage Google/Microsoft's security
- No password to be compromised
- Providers have advanced security features
- We never see your provider password

**Q: Can I use both OAuth and password?**
A: Yes! You can link an OAuth account and still have a password. Use whichever is more convenient.

**Q: What data does Liyaqa access from my Google account?**
A: We only access:
- Your name
- Your email address
- Your profile picture (optional)

We never access your Gmail, Drive, or other Google services.

---

## Getting Help

### Support Contacts

**Technical Support:**
- Email: support@liyaqa.com
- Phone: +1-800-LIYAQA-1
- Hours: 24/7

**Security Issues:**
- Email: security@liyaqa.com
- Phone: +1-800-LIYAQA-1 (press 2 for security)
- Emergency: Available 24/7

### Additional Resources

- **Knowledge Base**: https://help.liyaqa.com
- **Video Tutorials**: https://liyaqa.com/tutorials
- **Security Blog**: https://blog.liyaqa.com/security
- **Community Forum**: https://community.liyaqa.com

### Reporting Security Issues

If you discover a security vulnerability:

1. **Do Not** post it publicly
2. Email security@liyaqa.com with:
   - Description of the issue
   - Steps to reproduce
   - Your contact information
3. We'll respond within 24 hours
4. We offer rewards for valid security reports

---

## Stay Secure! 🔒

Remember: Security is a shared responsibility. We provide the tools, but you need to use them effectively. Enable MFA, use strong passwords, monitor your sessions, and stay vigilant.

**Your account security = Our success**

---

**Last Updated**: 2026-02-01
**Version**: 1.0
**Feedback**: security-docs@liyaqa.com
