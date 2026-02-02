# User Security Guide | دليل أمان المستخدم
**Liyaqa Platform Security Documentation**

> **Last Updated:** February 1, 2026
> **Version:** 1.0
> **Audience:** End Users, Members, Trainers

---

## Table of Contents | جدول المحتويات

1. [Introduction](#introduction)
2. [Multi-Factor Authentication (MFA)](#multi-factor-authentication-mfa)
3. [Managing Active Sessions](#managing-active-sessions)
4. [OAuth Account Linking](#oauth-account-linking)
5. [Understanding Security Alerts](#understanding-security-alerts)
6. [Responding to Suspicious Activity](#responding-to-suspicious-activity)
7. [IP Binding](#ip-binding)
8. [Password Security Best Practices](#password-security-best-practices)
9. [Viewing Login History](#viewing-login-history)
10. [Frequently Asked Questions](#frequently-asked-questions)

---

## Introduction

### English
Welcome to the Liyaqa Platform Security Guide. This document will help you understand and use the security features available to protect your account. Your account security is our top priority, and we provide multiple layers of protection to keep your data safe.

### العربية
مرحباً بك في دليل أمان منصة ليقة. سيساعدك هذا المستند على فهم واستخدام ميزات الأمان المتاحة لحماية حسابك. أمان حسابك هو أولويتنا القصوى، ونوفر طبقات متعددة من الحماية للحفاظ على بياناتك آمنة.

---

## Multi-Factor Authentication (MFA)

### English: Multi-Factor Authentication (MFA) | العربية: المصادقة متعددة العوامل

MFA adds an extra layer of security to your account by requiring a second verification step when logging in. Even if someone knows your password, they won't be able to access your account without the second factor.

المصادقة متعددة العوامل تضيف طبقة أمان إضافية لحسابك من خلال طلب خطوة تحقق ثانية عند تسجيل الدخول. حتى إذا علم شخص ما كلمة مرورك، فلن يتمكن من الوصول إلى حسابك بدون العامل الثاني.

### Step 1: Setting Up MFA | الخطوة 1: إعداد المصادقة متعددة العوامل

#### English Instructions:

1. **Navigate to Security Settings**
   - Log in to your Liyaqa account
   - Click on your profile icon in the top-right corner
   - Select "Security Settings" or navigate to `/security/mfa`

2. **Initiate MFA Setup**
   - Click the "Enable Two-Factor Authentication" button
   - The system will generate a QR code and a secret key

3. **Install an Authenticator App** (if you haven't already)
   - Download one of these apps on your mobile device:
     - **Google Authenticator** (iOS/Android)
     - **Microsoft Authenticator** (iOS/Android)
     - **Authy** (iOS/Android)
     - **1Password** (iOS/Android)

4. **Scan the QR Code**
   - Open your authenticator app
   - Select "Add Account" or the "+" button
   - Scan the QR code displayed on screen
   - Alternatively, manually enter the secret key if scanning doesn't work

5. **Save Your Backup Codes**
   - **CRITICAL:** The system will display 8 backup codes
   - **Save these codes** in a secure location (password manager, encrypted file, or printed copy in a safe)
   - Each backup code can only be used once
   - These codes allow you to access your account if you lose your phone

6. **Verify the Setup**
   - Enter the 6-digit code from your authenticator app
   - Click "Verify and Enable MFA"
   - You'll see a confirmation message: "MFA enabled successfully"

#### العربية (التعليمات العربية):

1. **انتقل إلى إعدادات الأمان**
   - سجل الدخول إلى حساب ليقة الخاص بك
   - انقر على أيقونة ملفك الشخصي في الزاوية العلوية اليمنى
   - حدد "إعدادات الأمان" أو انتقل إلى `/security/mfa`

2. **ابدأ إعداد المصادقة متعددة العوامل**
   - انقر على زر "تفعيل المصادقة الثنائية"
   - سينشئ النظام رمز QR ومفتاح سري

3. **قم بتثبيت تطبيق المصادقة** (إذا لم يكن لديك واحد)
   - قم بتنزيل أحد هذه التطبيقات على جهازك المحمول:
     - **Google Authenticator**
     - **Microsoft Authenticator**
     - **Authy**
     - **1Password**

4. **امسح رمز QR**
   - افتح تطبيق المصادقة الخاص بك
   - حدد "إضافة حساب" أو زر "+"
   - امسح رمز QR المعروض على الشاشة
   - أو أدخل المفتاح السري يدوياً إذا لم يعمل المسح

5. **احفظ رموز النسخ الاحتياطي**
   - **هام جداً:** سيعرض النظام 8 رموز احتياطية
   - **احفظ هذه الرموز** في مكان آمن (مدير كلمات المرور، ملف مشفر، أو نسخة مطبوعة في مكان آمن)
   - كل رمز احتياطي يمكن استخدامه مرة واحدة فقط
   - تسمح لك هذه الرموز بالوصول إلى حسابك إذا فقدت هاتفك

6. **تحقق من الإعداد**
   - أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة
   - انقر على "التحقق وتفعيل المصادقة متعددة العوامل"
   - سترى رسالة تأكيد: "تم تفعيل المصادقة متعددة العوامل بنجاح"

### Step 2: Using MFA to Login | الخطوة 2: استخدام المصادقة متعددة العوامل لتسجيل الدخول

#### English Instructions:

1. Enter your email and password as usual
2. After successful password verification, you'll be prompted for an MFA code
3. Open your authenticator app and find your Liyaqa account
4. Enter the current 6-digit code (codes refresh every 30 seconds)
5. Click "Verify" to complete login

**Using a Backup Code:**
- If you don't have access to your authenticator app, click "Use backup code"
- Enter one of your saved backup codes
- **Remember:** Each backup code can only be used once

#### العربية (التعليمات العربية):

1. أدخل بريدك الإلكتروني وكلمة المرور كالمعتاد
2. بعد التحقق من كلمة المرور بنجاح، سيُطلب منك إدخال رمز المصادقة متعددة العوامل
3. افتح تطبيق المصادقة الخاص بك وابحث عن حساب ليقة
4. أدخل الرمز الحالي المكون من 6 أرقام (تتجدد الرموز كل 30 ثانية)
5. انقر على "تحقق" لإكمال تسجيل الدخول

**استخدام رمز احتياطي:**
- إذا لم يكن لديك وصول إلى تطبيق المصادقة، انقر على "استخدام رمز احتياطي"
- أدخل أحد رموز النسخ الاحتياطي المحفوظة
- **تذكر:** كل رمز احتياطي يمكن استخدامه مرة واحدة فقط

### Step 3: Managing Your MFA Settings | الخطوة 3: إدارة إعدادات المصادقة متعددة العوامل

#### Regenerating Backup Codes | إعادة إنشاء رموز النسخ الاحتياطي

**English:**
- Navigate to Security Settings > MFA
- Click "Regenerate Backup Codes"
- **Important:** This will invalidate all previous backup codes
- Save the new codes in a secure location

**العربية:**
- انتقل إلى إعدادات الأمان > المصادقة متعددة العوامل
- انقر على "إعادة إنشاء رموز النسخ الاحتياطي"
- **هام:** سيؤدي هذا إلى إبطال جميع رموز النسخ الاحتياطي السابقة
- احفظ الرموز الجديدة في مكان آمن

#### Disabling MFA | تعطيل المصادقة متعددة العوامل

**English:**
- Navigate to Security Settings > MFA
- Click "Disable Two-Factor Authentication"
- Enter your password to confirm
- **Warning:** This will make your account less secure

**العربية:**
- انتقل إلى إعدادات الأمان > المصادقة متعددة العوامل
- انقر على "تعطيل المصادقة الثنائية"
- أدخل كلمة مرورك للتأكيد
- **تحذير:** سيجعل هذا حسابك أقل أماناً

---

## Managing Active Sessions

### English: Managing Active Sessions | العربية: إدارة الجلسات النشطة

Sessions represent your active logins across different devices and browsers. The Liyaqa platform allows you to view and manage all your active sessions for enhanced security.

الجلسات تمثل عمليات تسجيل الدخول النشطة عبر الأجهزة والمتصفحات المختلفة. تتيح لك منصة ليقة عرض وإدارة جميع جلساتك النشطة لتحسين الأمان.

### Viewing Your Sessions | عرض جلساتك

**English Instructions:**

1. Navigate to Security Settings > Active Sessions (`/security/sessions`)
2. You'll see a list of all currently active sessions with:
   - **Device Name:** Browser and device type (e.g., "Chrome on MacBook Pro")
   - **Location:** City and country (if available)
   - **IP Address:** The IP address used for login
   - **Last Active:** When this session was last used
   - **Created:** When you logged in on this device

**العربية (التعليمات العربية):**

1. انتقل إلى إعدادات الأمان > الجلسات النشطة (`/security/sessions`)
2. سترى قائمة بجميع الجلسات النشطة حالياً مع:
   - **اسم الجهاز:** المتصفح ونوع الجهاز (مثل "Chrome على MacBook Pro")
   - **الموقع:** المدينة والدولة (إن وجد)
   - **عنوان IP:** عنوان IP المستخدم لتسجيل الدخول
   - **آخر نشاط:** آخر مرة تم استخدام هذه الجلسة
   - **تم الإنشاء:** متى قمت بتسجيل الدخول على هذا الجهاز

### Revoking a Session (Remote Logout) | إلغاء جلسة (تسجيل الخروج عن بُعد)

**English Instructions:**

If you see a session you don't recognize:

1. Locate the suspicious session in the Active Sessions list
2. Click the "Revoke" or "Logout" button next to that session
3. Confirm the action
4. That device will be immediately logged out

**Logout All Other Devices:**
- Click "Logout All Other Devices" button at the top
- This will keep your current session active but revoke all others
- Useful if you suspect unauthorized access

**العربية (التعليمات العربية):**

إذا رأيت جلسة لا تتعرف عليها:

1. حدد موقع الجلسة المشبوهة في قائمة الجلسات النشطة
2. انقر على زر "إلغاء" أو "تسجيل الخروج" بجوار تلك الجلسة
3. أكد الإجراء
4. سيتم تسجيل خروج ذلك الجهاز على الفور

**تسجيل الخروج من جميع الأجهزة الأخرى:**
- انقر على زر "تسجيل الخروج من جميع الأجهزة الأخرى" في الأعلى
- سيبقي هذا جلستك الحالية نشطة ولكن سيلغي جميع الجلسات الأخرى
- مفيد إذا كنت تشك في وصول غير مصرح به

### Session Limits | حدود الجلسات

**English:**
- Maximum of 5 concurrent sessions allowed per account
- When you login on a 6th device, the oldest session will be automatically terminated
- This prevents unlimited session creation

**العربية:**
- الحد الأقصى 5 جلسات متزامنة مسموح بها لكل حساب
- عند تسجيل الدخول على جهاز سادس، سيتم إنهاء الجلسة الأقدم تلقائياً
- يمنع هذا إنشاء جلسات غير محدودة

---

## OAuth Account Linking

### English: OAuth Account Linking | العربية: ربط حسابات OAuth

OAuth allows you to login to Liyaqa using your existing accounts from trusted providers like Google, Microsoft, or GitHub. This provides convenience and security.

يسمح لك OAuth بتسجيل الدخول إلى ليقة باستخدام حساباتك الحالية من مزودين موثوقين مثل Google أو Microsoft أو GitHub. يوفر هذا الراحة والأمان.

### Available OAuth Providers | مزودو OAuth المتاحون

- **Google** - Login with your Gmail/Google account
- **Microsoft** - Login with your Outlook/Microsoft account
- **GitHub** - Login with your GitHub account (for developers)

### How to Link an OAuth Account | كيفية ربط حساب OAuth

**English Instructions:**

#### First-Time OAuth Login:

1. On the login page, click one of the OAuth provider buttons:
   - "Sign in with Google"
   - "Sign in with Microsoft"
   - "Sign in with GitHub"

2. You'll be redirected to the provider's login page
   - If already logged in to that provider, you may skip the login step
   - You'll see a permission request asking to share basic info (name, email)

3. Click "Allow" or "Accept" to grant permission

4. You'll be redirected back to Liyaqa and automatically logged in

5. **First Time Only:** If your email doesn't match an existing Liyaqa account:
   - A new account will be created automatically (if auto-provisioning is enabled)
   - OR you'll be prompted to complete registration

#### Linking OAuth to Existing Account:

1. Log in to your Liyaqa account with email/password
2. Navigate to Security Settings > Connected Accounts
3. Click "Connect" next to the OAuth provider you want to link
4. Complete the authorization flow
5. Your OAuth account is now linked - you can use either login method

**العربية (التعليمات العربية):**

#### تسجيل الدخول لأول مرة عبر OAuth:

1. في صفحة تسجيل الدخول، انقر على أحد أزرار مزود OAuth:
   - "تسجيل الدخول بواسطة Google"
   - "تسجيل الدخول بواسطة Microsoft"
   - "تسجيل الدخول بواسطة GitHub"

2. ستتم إعادة توجيهك إلى صفحة تسجيل الدخول الخاصة بالمزود
   - إذا كنت مسجلاً دخولك بالفعل إلى ذلك المزود، فقد تتخطى خطوة تسجيل الدخول
   - سترى طلب إذن يطلب مشاركة المعلومات الأساسية (الاسم، البريد الإلكتروني)

3. انقر على "السماح" أو "قبول" لمنح الإذن

4. ستتم إعادة توجيهك إلى ليقة وسيتم تسجيل دخولك تلقائياً

5. **المرة الأولى فقط:** إذا كان بريدك الإلكتروني لا يتطابق مع حساب ليقة موجود:
   - سيتم إنشاء حساب جديد تلقائياً (إذا كان التوفير التلقائي مفعلاً)
   - أو سيُطلب منك إكمال التسجيل

#### ربط OAuth بحساب موجود:

1. سجل الدخول إلى حساب ليقة الخاص بك بالبريد الإلكتروني/كلمة المرور
2. انتقل إلى إعدادات الأمان > الحسابات المتصلة
3. انقر على "ربط" بجوار مزود OAuth الذي تريد ربطه
4. أكمل عملية التفويض
5. حساب OAuth الخاص بك مرتبط الآن - يمكنك استخدام أي من طريقتي تسجيل الدخول

### Security Considerations | اعتبارات الأمان

**English:**
- OAuth is secure - Liyaqa never sees your Google/Microsoft/GitHub password
- We only receive basic information (name, email) with your permission
- You can revoke Liyaqa's access from your OAuth provider's security settings at any time
- If you unlink an OAuth provider, you can still login with email/password

**العربية:**
- OAuth آمن - لا ترى ليقة أبداً كلمة مرور Google/Microsoft/GitHub الخاصة بك
- نتلقى فقط معلومات أساسية (الاسم، البريد الإلكتروني) بإذنك
- يمكنك إلغاء وصول ليقة من إعدادات الأمان لمزود OAuth في أي وقت
- إذا قمت بإلغاء ربط مزود OAuth، لا يزال بإمكانك تسجيل الدخول بالبريد الإلكتروني/كلمة المرور

---

## Understanding Security Alerts

### English: Understanding Security Alerts | العربية: فهم تنبيهات الأمان

Liyaqa's security system monitors your account for suspicious activity and sends alerts when anomalies are detected. Understanding these alerts helps you protect your account.

يراقب نظام أمان ليقة حسابك بحثاً عن نشاط مشبوه ويرسل تنبيهات عند اكتشاف شذوذات. فهم هذه التنبيهات يساعدك على حماية حسابك.

### Types of Security Alerts | أنواع تنبيهات الأمان

#### 1. Impossible Travel | السفر المستحيل
**Severity: CRITICAL (حرج)**

**English:**
- **What it means:** You logged in from two distant locations within a very short time frame (e.g., New York to London in 1 hour)
- **Why it's triggered:** Physically impossible to travel that distance in that time
- **What to do:** This usually indicates account compromise - change your password immediately

**العربية:**
- **ما يعنيه:** قمت بتسجيل الدخول من موقعين بعيدين خلال إطار زمني قصير جداً (مثل نيويورك إلى لندن في ساعة واحدة)
- **لماذا يتم تفعيله:** من المستحيل جسدياً السفر تلك المسافة في ذلك الوقت
- **ماذا تفعل:** يشير هذا عادة إلى اختراق الحساب - قم بتغيير كلمة المرور فوراً

#### 2. New Device | جهاز جديد
**Severity: MEDIUM (متوسط)**

**English:**
- **What it means:** You logged in from a device or browser you haven't used before
- **Why it's triggered:** First login from a new device fingerprint
- **What to do:** If it was you on a new device, acknowledge the alert. If not, change your password

**العربية:**
- **ما يعنيه:** قمت بتسجيل الدخول من جهاز أو متصفح لم تستخدمه من قبل
- **لماذا يتم تفعيله:** أول تسجيل دخول من بصمة جهاز جديدة
- **ماذا تفعل:** إذا كنت أنت على جهاز جديد، أقر بالتنبيه. إذا لم يكن كذلك، قم بتغيير كلمة المرور

#### 3. New Location | موقع جديد
**Severity: MEDIUM (متوسط)**

**English:**
- **What it means:** You logged in from a city or country you haven't logged in from before
- **Why it's triggered:** First login from a new geographic location
- **What to do:** If you're traveling or moved, this is normal - acknowledge it. Otherwise, investigate

**العربية:**
- **ما يعنيه:** قمت بتسجيل الدخول من مدينة أو دولة لم تسجل الدخول منها من قبل
- **لماذا يتم تفعيله:** أول تسجيل دخول من موقع جغرافي جديد
- **ماذا تفعل:** إذا كنت مسافراً أو انتقلت، هذا طبيعي - أقر به. خلاف ذلك، قم بالتحقيق

#### 4. Brute Force Attack | هجوم القوة الغاشمة
**Severity: HIGH (عالي)**

**English:**
- **What it means:** Multiple failed login attempts detected from the same IP address
- **Why it's triggered:** 10+ failed attempts within 5 minutes
- **What to do:** Your account may be under attack. Enable MFA if you haven't already

**العربية:**
- **ما يعنيه:** تم اكتشاف محاولات تسجيل دخول فاشلة متعددة من نفس عنوان IP
- **لماذا يتم تفعيله:** 10+ محاولات فاشلة خلال 5 دقائق
- **ماذا تفعل:** قد يكون حسابك تحت الهجوم. قم بتفعيل المصادقة متعددة العوامل إذا لم تكن قد فعلتها بالفعل

#### 5. Unusual Time Login | تسجيل دخول في وقت غير معتاد
**Severity: LOW (منخفض)**

**English:**
- **What it means:** You logged in at a time significantly different from your normal pattern
- **Why it's triggered:** Login hour is 2+ standard deviations from your average (requires 10+ historical logins)
- **What to do:** If you have a different schedule today, this is normal. Otherwise, verify it was you

**العربية:**
- **ما يعنيه:** قمت بتسجيل الدخول في وقت مختلف بشكل كبير عن نمطك المعتاد
- **لماذا يتم تفعيله:** ساعة تسجيل الدخول تبعد 2+ انحراف معياري عن متوسطك (يتطلب 10+ عمليات تسجيل دخول تاريخية)
- **ماذا تفعل:** إذا كان لديك جدول مختلف اليوم، هذا طبيعي. خلاف ذلك، تحقق من أنه كان أنت

### Viewing Security Alerts | عرض تنبيهات الأمان

**English Instructions:**

1. Navigate to Security Settings > Security Alerts (`/security/alerts`)
2. You'll see alerts categorized by severity with color coding:
   - **Red:** Critical severity - immediate action required
   - **Orange:** High severity - investigate soon
   - **Yellow:** Medium severity - review when possible
   - **Blue:** Low severity - informational

3. Each alert shows:
   - Alert type and severity
   - Details about what triggered it
   - When it occurred
   - Related login information (IP, location, device)

**العربية (التعليمات العربية):**

1. انتقل إلى إعدادات الأمان > تنبيهات الأمان (`/security/alerts`)
2. سترى التنبيهات مصنفة حسب الخطورة مع ترميز لوني:
   - **أحمر:** خطورة حرجة - مطلوب إجراء فوري
   - **برتقالي:** خطورة عالية - تحقق قريباً
   - **أصفر:** خطورة متوسطة - راجع عندما يكون ذلك ممكناً
   - **أزرق:** خطورة منخفضة - معلوماتي

3. يعرض كل تنبيه:
   - نوع التنبيه والخطورة
   - تفاصيل حول ما أدى إلى تفعيله
   - متى حدث
   - معلومات تسجيل الدخول ذات الصلة (IP، الموقع، الجهاز)

---

## Responding to Suspicious Activity

### English: What to Do If You See Suspicious Activity | العربية: ماذا تفعل إذا رأيت نشاطاً مشبوهاً

If you receive a security alert or notice something unusual, follow these steps immediately.

إذا تلقيت تنبيه أمان أو لاحظت شيئاً غير عادي، اتبع هذه الخطوات فوراً.

### Immediate Actions | الإجراءات الفورية

**English:**

1. **Review the Alert Details**
   - Check the IP address, location, device, and time
   - Determine if it was you or someone else

2. **If It Was You:**
   - Click "Acknowledge" or "This Was Me" on the alert
   - The alert will be marked as resolved
   - No further action needed

3. **If It Wasn't You (Unauthorized Access):**
   - **DO NOT PANIC** - follow these steps carefully
   - Immediately change your password (Security Settings > Change Password)
   - Revoke all active sessions except your current one (Security Settings > Active Sessions > "Logout All Other Devices")
   - Enable MFA if not already enabled (Security Settings > MFA)
   - Review your login history for other suspicious attempts
   - Check your account for any unauthorized changes

4. **Report the Incident**
   - Contact Liyaqa support immediately
   - Provide the alert ID and details
   - We'll investigate and help secure your account

**العربية:**

1. **راجع تفاصيل التنبيه**
   - تحقق من عنوان IP، الموقع، الجهاز، والوقت
   - حدد ما إذا كان ذلك أنت أو شخص آخر

2. **إذا كان ذلك أنت:**
   - انقر على "أقر" أو "كان هذا أنا" على التنبيه
   - سيتم وضع علامة على التنبيه كمحلول
   - لا حاجة لإجراء إضافي

3. **إذا لم يكن ذلك أنت (وصول غير مصرح به):**
   - **لا تقلق** - اتبع هذه الخطوات بعناية
   - قم بتغيير كلمة المرور على الفور (إعدادات الأمان > تغيير كلمة المرور)
   - ألغِ جميع الجلسات النشطة باستثناء جلستك الحالية (إعدادات الأمان > الجلسات النشطة > "تسجيل الخروج من جميع الأجهزة الأخرى")
   - قم بتفعيل المصادقة متعددة العوامل إذا لم تكن مفعلة بالفعل (إعدادات الأمان > المصادقة متعددة العوامل)
   - راجع سجل تسجيل الدخول الخاص بك بحثاً عن محاولات مشبوهة أخرى
   - تحقق من حسابك بحثاً عن أي تغييرات غير مصرح بها

4. **أبلغ عن الحادثة**
   - اتصل بدعم ليقة على الفور
   - قدم معرف التنبيه والتفاصيل
   - سنحقق ونساعد في تأمين حسابك

### Account Lockout Notification | إشعار قفل الحساب

**English:**

If you enter an incorrect password 5 times, your account will be temporarily locked for 15 minutes. You'll receive an email notification with:

- The time of lockout
- IP address of the failed attempts
- Device information
- Number of failed attempts

**What to do:**
- Wait 15 minutes for the automatic unlock
- OR contact support if you need immediate access
- Review the login attempts to ensure they were from you
- If suspicious, change your password after unlocking

**العربية:**

إذا قمت بإدخال كلمة مرور غير صحيحة 5 مرات، سيتم قفل حسابك مؤقتاً لمدة 15 دقيقة. ستتلقى إشعار بريد إلكتروني يحتوي على:

- وقت القفل
- عنوان IP للمحاولات الفاشلة
- معلومات الجهاز
- عدد المحاولات الفاشلة

**ماذا تفعل:**
- انتظر 15 دقيقة لفتح القفل التلقائي
- أو اتصل بالدعم إذا كنت بحاجة إلى وصول فوري
- راجع محاولات تسجيل الدخول للتأكد من أنها كانت منك
- إذا كانت مشبوهة، قم بتغيير كلمة المرور بعد فتح القفل

---

## IP Binding

### English: IP Binding for Enhanced Security | العربية: ربط IP لتحسين الأمان

IP Binding is an advanced security feature that ties your session to your IP address. This prevents session hijacking even if your access token is compromised.

ربط IP هو ميزة أمان متقدمة تربط جلستك بعنوان IP الخاص بك. يمنع هذا اختطاف الجلسة حتى لو تم اختراق رمز الوصول الخاص بك.

### How IP Binding Works | كيف يعمل ربط IP

**English:**

When IP Binding is enabled:
- Your access token is tied to the IP address you used during login
- If someone tries to use your token from a different IP address, the request will be rejected
- You'll need to login again if your IP address changes (e.g., switching networks)

**Benefits:**
- Protects against token theft and replay attacks
- Prevents session hijacking via XSS or man-in-the-middle attacks
- Additional security layer for sensitive accounts

**Drawbacks:**
- You'll be logged out if your IP changes (e.g., mobile switching between WiFi and cellular)
- Less convenient for users with dynamic IP addresses
- May require frequent re-authentication

**العربية:**

عند تفعيل ربط IP:
- يتم ربط رمز الوصول الخاص بك بعنوان IP الذي استخدمته أثناء تسجيل الدخول
- إذا حاول شخص ما استخدام رمزك من عنوان IP مختلف، سيتم رفض الطلب
- ستحتاج إلى تسجيل الدخول مرة أخرى إذا تغير عنوان IP الخاص بك (مثل تبديل الشبكات)

**الفوائد:**
- الحماية من سرقة الرموز وهجمات الإعادة
- منع اختطاف الجلسة عبر XSS أو هجمات الوسيط
- طبقة أمان إضافية للحسابات الحساسة

**العيوب:**
- سيتم تسجيل خروجك إذا تغير IP الخاص بك (مثل الهاتف المحمول الذي يتبدل بين WiFi والبيانات الخلوية)
- أقل راحة للمستخدمين الذين لديهم عناوين IP ديناميكية
- قد يتطلب إعادة مصادقة متكررة

### Enabling/Disabling IP Binding | تفعيل/تعطيل ربط IP

**English Instructions:**

1. Navigate to Security Settings > Security Preferences (`/security/preferences`)
2. Find the "IP Binding" section
3. Toggle the switch to enable or disable
4. Click "Save Changes"
5. You'll be logged out and need to login again for the change to take effect

**Recommended For:**
- Platform administrators and staff
- Users handling sensitive data
- Accounts with financial or payment information
- Users on stable networks (office, home)

**Not Recommended For:**
- Mobile users who frequently switch networks
- Users with dynamic IP addresses
- Travelers using public WiFi

**العربية (التعليمات العربية):**

1. انتقل إلى إعدادات الأمان > تفضيلات الأمان (`/security/preferences`)
2. ابحث عن قسم "ربط IP"
3. بدّل المفتاح لتفعيل أو تعطيل
4. انقر على "حفظ التغييرات"
5. سيتم تسجيل خروجك وستحتاج إلى تسجيل الدخول مرة أخرى ليصبح التغيير ساري المفعول

**موصى به لـ:**
- مسؤولي المنصة والموظفين
- المستخدمين الذين يتعاملون مع بيانات حساسة
- الحسابات التي تحتوي على معلومات مالية أو دفع
- المستخدمين على شبكات مستقرة (المكتب، المنزل)

**غير موصى به لـ:**
- مستخدمي الهاتف المحمول الذين يبدلون الشبكات بشكل متكرر
- المستخدمين الذين لديهم عناوين IP ديناميكية
- المسافرين الذين يستخدمون WiFi عام

---

## Password Security Best Practices

### English: Creating Strong Passwords | العربية: إنشاء كلمات مرور قوية

Password strength is your first line of defense. Liyaqa enforces password policies to ensure your account is protected.

قوة كلمة المرور هي خط دفاعك الأول. تفرض ليقة سياسات كلمة المرور لضمان حماية حسابك.

### Password Requirements | متطلبات كلمة المرور

#### For Regular Users | للمستخدمين العاديين

**English:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)
- Cannot be a common password (e.g., "password123")
- Cannot be one of your last 5 passwords

**العربية:**
- الحد الأدنى 8 أحرف
- حرف واحد كبير على الأقل (A-Z)
- حرف واحد صغير على الأقل (a-z)
- رقم واحد على الأقل (0-9)
- حرف خاص واحد على الأقل (!@#$%^&*)
- لا يمكن أن تكون كلمة مرور شائعة (مثل "password123")
- لا يمكن أن تكون واحدة من آخر 5 كلمات مرور

#### For Platform Users (Admins/Staff) | لمستخدمي المنصة (المسؤولين/الموظفين)

**English:**
- Minimum 12 characters (more secure)
- All requirements above
- Recommended to use a password manager
- Change password every 90 days (recommended)

**العربية:**
- الحد الأدنى 12 حرفاً (أكثر أماناً)
- جميع المتطلبات أعلاه
- موصى باستخدام مدير كلمات المرور
- تغيير كلمة المرور كل 90 يوماً (موصى به)

### Password Strength Indicator | مؤشر قوة كلمة المرور

**English:**

When creating or changing your password, you'll see a real-time strength indicator with color-coded feedback:

- **Very Weak (Red, 0-20%):** Do not use this password
- **Weak (Orange, 21-40%):** Not recommended
- **Fair (Yellow, 41-60%):** Acceptable but could be stronger
- **Strong (Light Green, 61-80%):** Good password
- **Very Strong (Dark Green, 81-100%):** Excellent password

Tips for creating strong passwords:
- Use a passphrase: "MyDog$Loves2Run!" is stronger than "Mdog@2"
- Mix character types: uppercase, lowercase, numbers, symbols
- Avoid personal information: no birthdays, names, or common words
- Use a password manager to generate random passwords
- Never reuse passwords across different services

**العربية:**

عند إنشاء أو تغيير كلمة المرور، سترى مؤشر قوة في الوقت الفعلي مع تعليقات ملونة:

- **ضعيفة جداً (أحمر، 0-20%):** لا تستخدم هذه كلمة المرور
- **ضعيفة (برتقالي، 21-40%):** غير موصى بها
- **مقبولة (أصفر، 41-60%):** مقبولة ولكن يمكن أن تكون أقوى
- **قوية (أخضر فاتح، 61-80%):** كلمة مرور جيدة
- **قوية جداً (أخضر داكن، 81-100%):** كلمة مرور ممتازة

نصائح لإنشاء كلمات مرور قوية:
- استخدم عبارة مرور: "كلبي$يحب2الجري!" أقوى من "كلب@2"
- امزج أنواع الأحرف: كبيرة، صغيرة، أرقام، رموز
- تجنب المعلومات الشخصية: لا تستخدم تواريخ الميلاد، الأسماء، أو الكلمات الشائعة
- استخدم مدير كلمات المرور لإنشاء كلمات مرور عشوائية
- لا تعيد استخدام كلمات المرور عبر خدمات مختلفة

### Changing Your Password | تغيير كلمة المرور

**English Instructions:**

1. Navigate to Security Settings > Change Password (`/security/change-password`)
2. Enter your current password
3. Enter your new password (must meet requirements)
4. Confirm your new password
5. Click "Change Password"
6. You'll remain logged in, but all other sessions will be terminated for security

**العربية (التعليمات العربية):**

1. انتقل إلى إعدادات الأمان > تغيير كلمة المرور (`/security/change-password`)
2. أدخل كلمة مرورك الحالية
3. أدخل كلمة مرورك الجديدة (يجب أن تلبي المتطلبات)
4. أكد كلمة مرورك الجديدة
5. انقر على "تغيير كلمة المرور"
6. ستبقى مسجلاً دخولك، ولكن سيتم إنهاء جميع الجلسات الأخرى للأمان

---

## Viewing Login History

### English: Login History | العربية: سجل تسجيل الدخول

The login history feature provides complete transparency into all login attempts on your account, helping you identify suspicious activity.

توفر ميزة سجل تسجيل الدخول شفافية كاملة في جميع محاولات تسجيل الدخول على حسابك، مما يساعدك على تحديد النشاط المشبوه.

### Accessing Login History | الوصول إلى سجل تسجيل الدخول

**English Instructions:**

1. Navigate to Security Settings > Login History (`/security/login-history`)
2. You'll see two tabs:
   - **All Attempts:** Complete history of all login attempts
   - **Suspicious Only:** Filtered view of flagged attempts

**العربية (التعليمات العربية):**

1. انتقل إلى إعدادات الأمان > سجل تسجيل الدخول (`/security/login-history`)
2. سترى علامتي تبويب:
   - **جميع المحاولات:** سجل كامل لجميع محاولات تسجيل الدخول
   - **المشبوهة فقط:** عرض مفلتر للمحاولات المميزة

### Understanding Login History Data | فهم بيانات سجل تسجيل الدخول

**English:**

Each login attempt shows:

**Date & Time**
- When the login attempt occurred
- Displayed in your local timezone

**Device Information**
- Browser name and version (e.g., "Chrome 120")
- Operating system (e.g., "macOS", "Windows 11", "iOS 17")
- Device type (Desktop or Mobile icon)

**Location**
- City and country (if detectable)
- Determined from IP address geolocation

**IP Address**
- The public IP address used for the attempt
- Helps identify unauthorized access from different networks

**Status**
- **SUCCESS:** Login was successful
- **FAILED:** Wrong password or email
- **LOCKED:** Account was locked due to too many failures
- **MFA_REQUIRED:** Password correct, awaiting MFA code
- **MFA_SUCCESS:** MFA verified, login complete
- **MFA_FAILED:** MFA code was incorrect

**Suspicious Flag**
- Red warning icon if flagged by anomaly detection
- Reasons include: impossible travel, new device, brute force, etc.

**العربية:**

تعرض كل محاولة تسجيل دخول:

**التاريخ والوقت**
- متى حدثت محاولة تسجيل الدخول
- معروضة في منطقتك الزمنية المحلية

**معلومات الجهاز**
- اسم المتصفح والإصدار (مثل "Chrome 120")
- نظام التشغيل (مثل "macOS"، "Windows 11"، "iOS 17")
- نوع الجهاز (أيقونة سطح المكتب أو الهاتف المحمول)

**الموقع**
- المدينة والدولة (إن كان قابلاً للكشف)
- محدد من موقع IP الجغرافي

**عنوان IP**
- عنوان IP العام المستخدم للمحاولة
- يساعد في تحديد الوصول غير المصرح به من شبكات مختلفة

**الحالة**
- **نجاح:** تم تسجيل الدخول بنجاح
- **فشل:** كلمة مرور أو بريد إلكتروني خاطئ
- **مقفل:** تم قفل الحساب بسبب كثرة الفشل
- **MFA مطلوب:** كلمة المرور صحيحة، في انتظار رمز MFA
- **MFA نجاح:** تم التحقق من MFA، اكتمل تسجيل الدخول
- **MFA فشل:** رمز MFA كان غير صحيح

**علامة مشبوهة**
- أيقونة تحذير حمراء إذا تم وضع علامة عليها بواسطة كشف الشذوذ
- الأسباب تشمل: السفر المستحيل، جهاز جديد، القوة الغاشمة، إلخ.

### Login Statistics | إحصائيات تسجيل الدخول

**English:**

At the top of the login history page, you'll see statistics for the last 30 days:

- **Successful Logins:** Number of successful login attempts
- **Failed Attempts:** Number of failed login attempts (incorrect password/email)
- **Suspicious Attempts:** Number of logins flagged as suspicious
- **Unique Devices:** Number of different devices you've used

**العربية:**

في أعلى صفحة سجل تسجيل الدخول، سترى إحصائيات آخر 30 يوماً:

- **عمليات تسجيل الدخول الناجحة:** عدد محاولات تسجيل الدخول الناجحة
- **المحاولات الفاشلة:** عدد محاولات تسجيل الدخول الفاشلة (كلمة مرور/بريد إلكتروني غير صحيح)
- **المحاولات المشبوهة:** عدد عمليات تسجيل الدخول المميزة كمشبوهة
- **الأجهزة الفريدة:** عدد الأجهزة المختلفة التي استخدمتها

### Acknowledging Suspicious Logins | الإقرار بعمليات تسجيل الدخول المشبوهة

**English Instructions:**

If you see a login attempt marked as suspicious:

1. Review the details carefully (time, location, device, IP)
2. If it was you:
   - Click "This Was Me" or "Acknowledge" button
   - The suspicious flag will be removed
   - The security alert will be marked as resolved
3. If it wasn't you:
   - Click "Not Me" or "Report"
   - Follow the incident response steps outlined earlier
   - Contact support immediately

**العربية (التعليمات العربية):**

إذا رأيت محاولة تسجيل دخول موسومة كمشبوهة:

1. راجع التفاصيل بعناية (الوقت، الموقع، الجهاز، IP)
2. إذا كانت أنت:
   - انقر على زر "كان هذا أنا" أو "أقر"
   - ستتم إزالة العلامة المشبوهة
   - سيتم وضع علامة على تنبيه الأمان كمحلول
3. إذا لم يكن أنت:
   - انقر على "ليس أنا" أو "أبلغ"
   - اتبع خطوات الاستجابة للحوادث الموضحة سابقاً
   - اتصل بالدعم فوراً

---

## Frequently Asked Questions

### English: FAQ | العربية: الأسئلة الشائعة

#### Q1: I lost my phone with the authenticator app. How do I login?
**A:** Use one of your saved backup codes. Each code works once. After logging in, regenerate new backup codes immediately.

#### س1: فقدت هاتفي مع تطبيق المصادقة. كيف أسجل الدخول؟
**ج:** استخدم أحد رموز النسخ الاحتياطي المحفوظة. كل رمز يعمل مرة واحدة. بعد تسجيل الدخول، أعد إنشاء رموز احتياطية جديدة فوراً.

---

#### Q2: I used all my backup codes. What now?
**A:** Contact Liyaqa support with proof of identity. We'll help you regain access and reset your MFA.

#### س2: استخدمت جميع رموز النسخ الاحتياطي. ماذا الآن؟
**ج:** اتصل بدعم ليقة مع إثبات الهوية. سنساعدك على استعادة الوصول وإعادة تعيين المصادقة متعددة العوامل.

---

#### Q3: Why am I getting logged out frequently on my phone?
**A:** If you have IP Binding enabled, your IP changes when switching between WiFi and cellular data. Disable IP Binding for mobile devices.

#### س3: لماذا يتم تسجيل خروجي بشكل متكرر على هاتفي؟
**ج:** إذا كان لديك ربط IP مفعل، يتغير IP عند التبديل بين WiFi والبيانات الخلوية. قم بتعطيل ربط IP للأجهزة المحمولة.

---

#### Q4: Can I use the same password across different accounts?
**A:** No, never reuse passwords. Each service should have a unique password. Use a password manager to keep track.

#### س4: هل يمكنني استخدام نفس كلمة المرور عبر حسابات مختلفة؟
**ج:** لا، لا تعيد استخدام كلمات المرور أبداً. يجب أن يكون لكل خدمة كلمة مرور فريدة. استخدم مدير كلمات المرور للمتابعة.

---

#### Q5: How long is my session active before I need to login again?
**A:** Sessions expire after 24 hours of inactivity, or 7 days maximum (absolute timeout). Access tokens expire after 15 minutes but are refreshed automatically.

#### س5: كم من الوقت تكون جلستي نشطة قبل أن أحتاج إلى تسجيل الدخول مرة أخرى؟
**ج:** تنتهي الجلسات بعد 24 ساعة من عدم النشاط، أو 7 أيام كحد أقصى (مهلة مطلقة). تنتهي رموز الوصول بعد 15 دقيقة ولكن يتم تجديدها تلقائياً.

---

#### Q6: What's the difference between revoking a session and logging out?
**A:** Logout ends your current session only. Revoking a session logs out a specific device remotely. "Logout All Other Devices" keeps your current session but ends all others.

#### س6: ما الفرق بين إلغاء جلسة وتسجيل الخروج؟
**ج:** تسجيل الخروج ينهي جلستك الحالية فقط. إلغاء جلسة يسجل خروج جهاز محدد عن بُعد. "تسجيل الخروج من جميع الأجهزة الأخرى" يبقي جلستك الحالية ولكن ينهي جميع الجلسات الأخرى.

---

#### Q7: Why do I see "Unusual Time" alerts when I login at night?
**A:** The system learns your typical login patterns. If you usually login during business hours, late-night logins trigger alerts. Acknowledge them if they're legitimate.

#### س7: لماذا أرى تنبيهات "وقت غير معتاد" عندما أسجل الدخول في الليل؟
**ج:** يتعلم النظام أنماط تسجيل الدخول النموذجية الخاصة بك. إذا كنت عادة تسجل الدخول خلال ساعات العمل، فإن عمليات تسجيل الدخول في وقت متأخر من الليل تؤدي إلى تنبيهات. أقر بها إذا كانت مشروعة.

---

#### Q8: Can I link multiple OAuth providers to one account?
**A:** Currently, you can link one OAuth provider per account. You can switch providers but not have multiple simultaneously.

#### س8: هل يمكنني ربط عدة مزودي OAuth بحساب واحد؟
**ج:** حالياً، يمكنك ربط مزود OAuth واحد لكل حساب. يمكنك تبديل المزودين ولكن ليس وجود عدة في وقت واحد.

---

## Support & Contact | الدعم والتواصل

### English
If you need help with any security features or suspect a security issue:

- **Email:** security@liyaqa.com
- **Emergency Hotline:** Available in your account dashboard
- **Support Portal:** https://support.liyaqa.com
- **Response Time:** Critical security issues within 1 hour

### العربية
إذا كنت بحاجة إلى مساعدة في أي ميزات أمان أو تشك في مشكلة أمان:

- **البريد الإلكتروني:** security@liyaqa.com
- **خط الطوارئ:** متاح في لوحة تحكم حسابك
- **بوابة الدعم:** https://support.liyaqa.com
- **وقت الاستجابة:** مشكلات الأمان الحرجة خلال ساعة واحدة

---

**Document Version:** 1.0
**Last Updated:** February 1, 2026
**Next Review:** May 1, 2026

© 2026 Liyaqa. All rights reserved. This document is confidential and intended for authorized users only.
