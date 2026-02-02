-- V110__notification_templates.sql
-- Create notification templates table and seed initial bilingual templates

-- =====================================================================
-- Create notification_templates table
-- =====================================================================

CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(200),
    name_ar VARCHAR(200),
    category VARCHAR(50) NOT NULL,
    subject_en TEXT NOT NULL,
    subject_ar TEXT NOT NULL,
    body_en TEXT NOT NULL,
    body_ar TEXT NOT NULL,
    sms_en TEXT,
    sms_ar TEXT,
    variables JSONB,
    example_data JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_notification_templates_code ON notification_templates(code);
CREATE INDEX idx_notification_templates_category ON notification_templates(category);
CREATE INDEX idx_notification_templates_is_active ON notification_templates(is_active);

-- =====================================================================
-- BILLING TEMPLATES
-- =====================================================================

-- Invoice Generated
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'INVOICE_GENERATED',
    'Invoice Generated',
    'فاتورة جديدة',
    'BILLING',
    'Invoice #{{invoiceNumber}} - {{amount}} {{currency}}',
    'فاتورة رقم {{invoiceNumber}} - {{amount}} {{currency}}',
    'Dear {{memberName}},

Your invoice #{{invoiceNumber}} has been generated for your {{subscriptionName}} subscription.

Amount Due: {{formatCurrency amount locale=locale}} {{currency}}
Due Date: {{formatDate dueDate pattern="MMMM dd, yyyy" locale=locale}}

You can view and pay your invoice online through your member portal.

Thank you for being a valued member!',
    'عزيزي {{memberName}}،

تم إنشاء فاتورتك رقم {{invoiceNumber}} لاشتراكك في {{subscriptionName}}.

المبلغ المستحق: {{formatCurrency amount locale=locale}} {{currency}}
تاريخ الاستحقاق: {{formatDate dueDate pattern="dd MMMM yyyy" locale=locale}}

يمكنك عرض ودفع فاتورتك عبر الإنترنت من خلال بوابة الأعضاء.

شكراً لكونك عضواً مميزاً!',
    'Invoice #{{invoiceNumber}} generated. Amount: {{amount}} {{currency}}. Due: {{formatDate dueDate pattern="MMM dd"}}',
    'فاتورة رقم {{invoiceNumber}}. المبلغ: {{amount}} {{currency}}. الاستحقاق: {{formatDate dueDate pattern="dd MMM"}}',
    '["memberName", "invoiceNumber", "amount", "currency", "dueDate", "subscriptionName", "locale"]'
);

-- Payment Received
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'PAYMENT_RECEIVED',
    'Payment Received - Thank You!',
    'تم استلام الدفع - شكراً!',
    'PAYMENT',
    'Payment Received for Invoice #{{invoiceNumber}}',
    'تم استلام الدفع للفاتورة رقم {{invoiceNumber}}',
    'Dear {{memberName}},

Thank you for your payment!

Payment Details:
- Invoice: #{{invoiceNumber}}
- Amount: {{formatCurrency amount locale=locale}} {{currency}}
- Payment Date: {{formatDate paymentDate pattern="MMMM dd, yyyy" locale=locale}}
- Payment Method: {{paymentMethod}}

Your membership is now active and up to date.

Thank you for being a valued member!',
    'عزيزي {{memberName}}،

شكراً لك على دفعتك!

تفاصيل الدفع:
- الفاتورة: رقم {{invoiceNumber}}
- المبلغ: {{formatCurrency amount locale=locale}} {{currency}}
- تاريخ الدفع: {{formatDate paymentDate pattern="dd MMMM yyyy" locale=locale}}
- طريقة الدفع: {{paymentMethod}}

عضويتك الآن نشطة ومحدثة.

شكراً لكونك عضواً مميزاً!',
    'Payment of {{amount}} {{currency}} received for invoice #{{invoiceNumber}}. Thank you!',
    'تم استلام دفعة {{amount}} {{currency}} للفاتورة رقم {{invoiceNumber}}. شكراً!',
    '["memberName", "invoiceNumber", "amount", "currency", "paymentDate", "paymentMethod", "locale"]'
);

-- Payment Failed
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'PAYMENT_FAILED',
    'Payment Failed - Action Required',
    'فشل الدفع - مطلوب إجراء',
    'PAYMENT',
    'Payment Failed for Invoice #{{invoiceNumber}}',
    'فشل الدفع للفاتورة رقم {{invoiceNumber}}',
    'Dear {{memberName}},

We were unable to process your payment for invoice #{{invoiceNumber}}.

Amount: {{formatCurrency amount locale=locale}} {{currency}}
Reason: {{failureReason}}

Please update your payment method or pay manually through your member portal to avoid service interruption.

If you need assistance, please contact our support team.',
    'عزيزي {{memberName}}،

لم نتمكن من معالجة دفعتك للفاتورة رقم {{invoiceNumber}}.

المبلغ: {{formatCurrency amount locale=locale}} {{currency}}
السبب: {{failureReason}}

يرجى تحديث طريقة الدفع أو الدفع يدوياً من خلال بوابة الأعضاء لتجنب انقطاع الخدمة.

إذا كنت بحاجة إلى مساعدة، يرجى الاتصال بفريق الدعم لدينا.',
    'Payment failed for invoice #{{invoiceNumber}}. Please update your payment method.',
    'فشل الدفع للفاتورة رقم {{invoiceNumber}}. يرجى تحديث طريقة الدفع.',
    '["memberName", "invoiceNumber", "amount", "currency", "failureReason", "locale"]'
);

-- Payment Retry Attempt
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'PAYMENT_RETRY',
    'Payment Reminder',
    'تذكير بالدفع',
    'PAYMENT',
    '{{#if (eq retryAttempt 5)}}FINAL NOTICE{{else}}Payment Reminder{{/if}} - Invoice #{{invoiceNumber}}',
    '{{#if (eq retryAttempt 5)}}إشعار نهائي{{else}}تذكير بالدفع{{/if}} - فاتورة رقم {{invoiceNumber}}',
    'Dear {{memberName}},

{{#if (eq retryAttempt 5)}}
This is our FINAL ATTEMPT to process your payment for invoice #{{invoiceNumber}}.
{{else}}
We are retrying payment for your invoice #{{invoiceNumber}} (Attempt {{retryAttempt}}/5).
{{/if}}

Amount: {{formatCurrency amount locale=locale}} {{currency}}
Days Overdue: {{daysOverdue}}

{{#if (eq retryAttempt 5)}}
Your subscription will be suspended in 7 days if payment is not received. Please pay now to avoid service interruption.
{{else}}
Please update your payment method or pay manually to avoid further retry attempts.
{{/if}}

View Invoice: {{invoiceUrl}}',
    'عزيزي {{memberName}}،

{{#if (eq retryAttempt 5)}}
هذه هي محاولتنا النهائية لمعالجة دفعتك للفاتورة رقم {{invoiceNumber}}.
{{else}}
نحن نعيد محاولة الدفع لفاتورتك رقم {{invoiceNumber}} (المحاولة {{retryAttempt}}/5).
{{/if}}

المبلغ: {{formatCurrency amount locale=locale}} {{currency}}
أيام التأخير: {{daysOverdue}}

{{#if (eq retryAttempt 5)}}
سيتم تعليق اشتراكك خلال 7 أيام إذا لم يتم استلام الدفع. يرجى الدفع الآن لتجنب انقطاع الخدمة.
{{else}}
يرجى تحديث طريقة الدفع أو الدفع يدوياً لتجنب محاولات إعادة أخرى.
{{/if}}

عرض الفاتورة: {{invoiceUrl}}',
    '{{#if (eq retryAttempt 5)}}FINAL NOTICE{{else}}Retry {{retryAttempt}}/5{{/if}}: Invoice #{{invoiceNumber}} - {{amount}} {{currency}} overdue. Pay now.',
    '{{#if (eq retryAttempt 5)}}إشعار نهائي{{else}}محاولة {{retryAttempt}}/5{{/if}}: فاتورة {{invoiceNumber}} - {{amount}} {{currency}} متأخرة. ادفع الآن.',
    '["memberName", "invoiceNumber", "amount", "currency", "retryAttempt", "daysOverdue", "invoiceUrl", "locale"]'
);

-- =====================================================================
-- MEMBERSHIP TEMPLATES
-- =====================================================================

-- Subscription Activated
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'SUBSCRIPTION_ACTIVATED',
    'Subscription Activated - Welcome!',
    'تم تفعيل الاشتراك - مرحباً!',
    'MEMBERSHIP',
    'Welcome to {{subscriptionName}}!',
    'مرحباً بك في {{subscriptionName}}!',
    'Dear {{memberName}},

Congratulations! Your {{subscriptionName}} subscription is now active.

Subscription Details:
- Start Date: {{formatDate startDate pattern="MMMM dd, yyyy" locale=locale}}
- Next Billing: {{formatDate nextBillingDate pattern="MMMM dd, yyyy" locale=locale}}
- Monthly Amount: {{formatCurrency amount locale=locale}} {{currency}}

You now have full access to all our facilities and classes. We look forward to helping you achieve your fitness goals!

Visit your member portal to book your first class.',
    'عزيزي {{memberName}}،

تهانينا! اشتراكك في {{subscriptionName}} الآن نشط.

تفاصيل الاشتراك:
- تاريخ البدء: {{formatDate startDate pattern="dd MMMM yyyy" locale=locale}}
- الدفع القادم: {{formatDate nextBillingDate pattern="dd MMMM yyyy" locale=locale}}
- المبلغ الشهري: {{formatCurrency amount locale=locale}} {{currency}}

لديك الآن وصول كامل إلى جميع مرافقنا وحصصنا. نتطلع إلى مساعدتك في تحقيق أهدافك الصحية!

قم بزيارة بوابة الأعضاء لحجز حصتك الأولى.',
    'Welcome! Your {{subscriptionName}} subscription is now active. Start Date: {{formatDate startDate pattern="MMM dd"}}',
    'مرحباً! اشتراكك في {{subscriptionName}} الآن نشط. تاريخ البدء: {{formatDate startDate pattern="dd MMM"}}',
    '["memberName", "subscriptionName", "startDate", "nextBillingDate", "amount", "currency", "locale"]'
);

-- Subscription Frozen
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'SUBSCRIPTION_FROZEN',
    'Subscription Frozen',
    'تم تجميد الاشتراك',
    'MEMBERSHIP',
    'Your Subscription Has Been Frozen',
    'تم تجميد اشتراكك',
    'Dear {{memberName}},

Your subscription has been frozen as requested.

Freeze Details:
- Start Date: {{formatDate freezeStartDate pattern="MMMM dd, yyyy" locale=locale}}
- End Date: {{formatDate freezeEndDate pattern="MMMM dd, yyyy" locale=locale}}
- Duration: {{freezeDuration}} days
- New Billing Date: {{formatDate newBillingDate pattern="MMMM dd, yyyy" locale=locale}}

During the freeze period, you will not have access to the facility. Your membership will automatically resume on the end date.

Thank you for understanding!',
    'عزيزي {{memberName}}،

تم تجميد اشتراكك كما طلبت.

تفاصيل التجميد:
- تاريخ البدء: {{formatDate freezeStartDate pattern="dd MMMM yyyy" locale=locale}}
- تاريخ الانتهاء: {{formatDate freezeEndDate pattern="dd MMMM yyyy" locale=locale}}
- المدة: {{freezeDuration}} يوم
- تاريخ الدفع الجديد: {{formatDate newBillingDate pattern="dd MMMM yyyy" locale=locale}}

خلال فترة التجميد، لن يكون لديك وصول إلى المنشأة. سيستأنف اشتراكك تلقائياً في تاريخ الانتهاء.

شكراً لتفهمك!',
    'Your subscription is frozen from {{formatDate freezeStartDate pattern="MMM dd"}} to {{formatDate freezeEndDate pattern="MMM dd"}}.',
    'تم تجميد اشتراكك من {{formatDate freezeStartDate pattern="dd MMM"}} إلى {{formatDate freezeEndDate pattern="dd MMM"}}.',
    '["memberName", "freezeStartDate", "freezeEndDate", "freezeDuration", "newBillingDate", "locale"]'
);

-- Subscription Suspended (Non-payment)
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'SUBSCRIPTION_SUSPENDED',
    'Subscription Suspended - Payment Required',
    'تم تعليق الاشتراك - مطلوب دفع',
    'MEMBERSHIP',
    'URGENT: Subscription Suspended',
    'عاجل: تم تعليق الاشتراك',
    'Dear {{memberName}},

Your subscription has been suspended due to unpaid invoice #{{invoiceNumber}}.

Amount Due: {{formatCurrency amount locale=locale}} {{currency}}
Days Overdue: {{daysOverdue}}

Your access to the facility has been temporarily suspended. To reactivate your membership, please pay the outstanding amount immediately.

Pay Now: {{paymentUrl}}

If you have questions, please contact our support team.',
    'عزيزي {{memberName}}،

تم تعليق اشتراكك بسبب الفاتورة غير المدفوعة رقم {{invoiceNumber}}.

المبلغ المستحق: {{formatCurrency amount locale=locale}} {{currency}}
أيام التأخير: {{daysOverdue}}

تم تعليق وصولك إلى المنشأة مؤقتاً. لإعادة تفعيل عضويتك، يرجى دفع المبلغ المستحق فوراً.

ادفع الآن: {{paymentUrl}}

إذا كان لديك أسئلة، يرجى الاتصال بفريق الدعم لدينا.',
    'URGENT: Subscription suspended. Pay {{amount}} {{currency}} to reactivate: {{paymentUrl}}',
    'عاجل: تم تعليق الاشتراك. ادفع {{amount}} {{currency}} لإعادة التفعيل: {{paymentUrl}}',
    '["memberName", "invoiceNumber", "amount", "currency", "daysOverdue", "paymentUrl", "locale"]'
);

-- Subscription Reactivated
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'SUBSCRIPTION_REACTIVATED',
    'Subscription Reactivated - Welcome Back!',
    'تم إعادة تفعيل الاشتراك - مرحباً بعودتك!',
    'MEMBERSHIP',
    'Welcome Back! Subscription Reactivated',
    'مرحباً بعودتك! تم إعادة تفعيل الاشتراك',
    'Dear {{memberName}},

Great news! Your subscription has been reactivated.

Thank you for your payment of {{formatCurrency amount locale=locale}} {{currency}}. You now have full access to all facilities and classes.

Next Billing Date: {{formatDate nextBillingDate pattern="MMMM dd, yyyy" locale=locale}}

We''re excited to have you back! Visit your member portal to book your next class.

See you at the gym!',
    'عزيزي {{memberName}}،

أخبار رائعة! تم إعادة تفعيل اشتراكك.

شكراً لك على دفعك {{formatCurrency amount locale=locale}} {{currency}}. لديك الآن وصول كامل إلى جميع المرافق والحصص.

تاريخ الدفع القادم: {{formatDate nextBillingDate pattern="dd MMMM yyyy" locale=locale}}

نحن متحمسون لعودتك! قم بزيارة بوابة الأعضاء لحجز حصتك القادمة.

نراك في الجيم!',
    'Welcome back! Your subscription is reactivated. Next billing: {{formatDate nextBillingDate pattern="MMM dd"}}',
    'مرحباً بعودتك! تم إعادة تفعيل اشتراكك. الدفع القادم: {{formatDate nextBillingDate pattern="dd MMM"}}',
    '["memberName", "amount", "currency", "nextBillingDate", "locale"]'
);

-- =====================================================================
-- BOOKING TEMPLATES
-- =====================================================================

-- Class Booked
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'CLASS_BOOKED',
    'Class Booking Confirmed',
    'تم تأكيد حجز الحصة',
    'BOOKING',
    'Class Booked: {{className}}',
    'تم حجز الحصة: {{className}}',
    'Dear {{memberName}},

Your class booking has been confirmed!

Class Details:
- Class: {{className}}
- Instructor: {{instructorName}}
- Date: {{formatDate classDate pattern="EEEE, MMMM dd, yyyy" locale=locale}}
- Time: {{classTime}}
- Duration: {{duration}} minutes
- Location: {{location}}

We look forward to seeing you!

Note: Please arrive 10 minutes early for check-in.',
    'عزيزي {{memberName}}،

تم تأكيد حجز حصتك!

تفاصيل الحصة:
- الحصة: {{className}}
- المدرب: {{instructorName}}
- التاريخ: {{formatDate classDate pattern="EEEE، dd MMMM yyyy" locale=locale}}
- الوقت: {{classTime}}
- المدة: {{duration}} دقيقة
- الموقع: {{location}}

نتطلع لرؤيتك!

ملاحظة: يرجى الحضور قبل 10 دقائق لتسجيل الدخول.',
    'Class booked: {{className}} on {{formatDate classDate pattern="MMM dd"}} at {{classTime}}',
    'تم حجز الحصة: {{className}} في {{formatDate classDate pattern="dd MMM"}} الساعة {{classTime}}',
    '["memberName", "className", "instructorName", "classDate", "classTime", "duration", "location", "locale"]'
);

-- Class Reminder (24 hours before)
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'CLASS_REMINDER_24H',
    'Class Reminder - Tomorrow',
    'تذكير بالحصة - غداً',
    'BOOKING',
    'Reminder: {{className}} Tomorrow',
    'تذكير: {{className}} غداً',
    'Dear {{memberName}},

This is a reminder that you have a class tomorrow:

{{className}} with {{instructorName}}
Tomorrow, {{formatDate classDate pattern="MMMM dd" locale=locale}} at {{classTime}}
Location: {{location}}

We look forward to seeing you!

Can''t make it? Cancel your booking through the member portal.',
    'عزيزي {{memberName}}،

هذا تذكير بأن لديك حصة غداً:

{{className}} مع {{instructorName}}
غداً، {{formatDate classDate pattern="dd MMMM" locale=locale}} الساعة {{classTime}}
الموقع: {{location}}

نتطلع لرؤيتك!

لا يمكنك الحضور؟ قم بإلغاء حجزك من خلال بوابة الأعضاء.',
    'Reminder: {{className}} tomorrow at {{classTime}}. Location: {{location}}',
    'تذكير: {{className}} غداً الساعة {{classTime}}. الموقع: {{location}}',
    '["memberName", "className", "instructorName", "classDate", "classTime", "location", "locale"]'
);

-- Class Cancelled
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'CLASS_CANCELLED',
    'Class Cancelled',
    'تم إلغاء الحصة',
    'BOOKING',
    'Class Cancelled: {{className}}',
    'تم إلغاء الحصة: {{className}}',
    'Dear {{memberName}},

We regret to inform you that the following class has been cancelled:

{{className}} with {{instructorName}}
{{formatDate classDate pattern="EEEE, MMMM dd, yyyy" locale=locale}} at {{classTime}}

Reason: {{cancellationReason}}

We apologize for any inconvenience. Please book another class through your member portal.

Thank you for your understanding!',
    'عزيزي {{memberName}}،

يؤسفنا إبلاغك بأنه تم إلغاء الحصة التالية:

{{className}} مع {{instructorName}}
{{formatDate classDate pattern="EEEE، dd MMMM yyyy" locale=locale}} الساعة {{classTime}}

السبب: {{cancellationReason}}

نعتذر عن أي إزعاج. يرجى حجز حصة أخرى من خلال بوابة الأعضاء.

شكراً لتفهمك!',
    'Class cancelled: {{className}} on {{formatDate classDate pattern="MMM dd"}}. Reason: {{cancellationReason}}',
    'تم إلغاء الحصة: {{className}} في {{formatDate classDate pattern="dd MMM"}}. السبب: {{cancellationReason}}',
    '["memberName", "className", "instructorName", "classDate", "classTime", "cancellationReason", "locale"]'
);

-- =====================================================================
-- SECURITY TEMPLATES
-- =====================================================================

-- Password Reset Request
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'PASSWORD_RESET_REQUEST',
    'Password Reset Request',
    'طلب إعادة تعيين كلمة المرور',
    'SECURITY',
    'Reset Your Password',
    'إعادة تعيين كلمة المرور',
    'Dear {{memberName}},

We received a request to reset your password.

Click the link below to reset your password:
{{resetUrl}}

This link will expire in 1 hour.

If you didn''t request this, please ignore this email and your password will remain unchanged.

For security reasons, we recommend using a strong, unique password.',
    'عزيزي {{memberName}}،

تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.

انقر على الرابط أدناه لإعادة تعيين كلمة المرور:
{{resetUrl}}

ستنتهي صلاحية هذا الرابط خلال ساعة واحدة.

إذا لم تطلب ذلك، يرجى تجاهل هذا البريد الإلكتروني وستبقى كلمة المرور الخاصة بك دون تغيير.

لأسباب أمنية، نوصي باستخدام كلمة مرور قوية وفريدة.',
    'Password reset requested. Link expires in 1 hour: {{resetUrl}}',
    'تم طلب إعادة تعيين كلمة المرور. الرابط ينتهي خلال ساعة: {{resetUrl}}',
    '["memberName", "resetUrl", "locale"]'
);

-- Password Changed
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'PASSWORD_CHANGED',
    'Password Changed Successfully',
    'تم تغيير كلمة المرور بنجاح',
    'SECURITY',
    'Your Password Has Been Changed',
    'تم تغيير كلمة المرور الخاصة بك',
    'Dear {{memberName}},

Your password has been successfully changed.

Change Time: {{formatDate changeTime pattern="MMMM dd, yyyy HH:mm" locale=locale}}
IP Address: {{ipAddress}}
Location: {{location}}

If you didn''t make this change, please contact our support team immediately.

For your security, we recommend:
- Using a unique password
- Enabling two-factor authentication
- Never sharing your password',
    'عزيزي {{memberName}}،

تم تغيير كلمة المرور الخاصة بك بنجاح.

وقت التغيير: {{formatDate changeTime pattern="dd MMMM yyyy HH:mm" locale=locale}}
عنوان IP: {{ipAddress}}
الموقع: {{location}}

إذا لم تقم بهذا التغيير، يرجى الاتصال بفريق الدعم لدينا فوراً.

لأمانك، نوصي بـ:
- استخدام كلمة مرور فريدة
- تفعيل المصادقة الثنائية
- عدم مشاركة كلمة المرور أبداً',
    'Your password was changed at {{formatDate changeTime pattern="MMM dd HH:mm"}}. Contact support if this wasn''t you.',
    'تم تغيير كلمة المرور في {{formatDate changeTime pattern="dd MMM HH:mm"}}. اتصل بالدعم إذا لم تكن أنت.',
    '["memberName", "changeTime", "ipAddress", "location", "locale"]'
);

-- Suspicious Login Detected
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'SUSPICIOUS_LOGIN',
    'Suspicious Login Detected',
    'تم اكتشاف تسجيل دخول مشبوه',
    'SECURITY',
    'Security Alert: Unusual Login Activity',
    'تنبيه أمني: نشاط تسجيل دخول غير عادي',
    'Dear {{memberName}},

We detected a login to your account from an unusual location:

Login Time: {{formatDate loginTime pattern="MMMM dd, yyyy HH:mm" locale=locale}}
IP Address: {{ipAddress}}
Location: {{location}}
Device: {{device}}

Was this you?
- If yes, you can ignore this email.
- If no, please secure your account immediately:
  1. Change your password
  2. Enable two-factor authentication
  3. Review your recent activity

For assistance, contact our support team.',
    'عزيزي {{memberName}}،

اكتشفنا تسجيل دخول إلى حسابك من موقع غير عادي:

وقت الدخول: {{formatDate loginTime pattern="dd MMMM yyyy HH:mm" locale=locale}}
عنوان IP: {{ipAddress}}
الموقع: {{location}}
الجهاز: {{device}}

هل كان هذا أنت؟
- إذا كان نعم، يمكنك تجاهل هذا البريد الإلكتروني.
- إذا لم يكن، يرجى تأمين حسابك فوراً:
  1. غيّر كلمة المرور
  2. فعّل المصادقة الثنائية
  3. راجع نشاطك الأخير

للمساعدة، اتصل بفريق الدعم لدينا.',
    'Security alert: Login from {{location}} at {{formatDate loginTime pattern="MMM dd HH:mm"}}. Contact support if not you.',
    'تنبيه أمني: تسجيل دخول من {{location}} في {{formatDate loginTime pattern="dd MMM HH:mm"}}. اتصل بالدعم إذا لم تكن أنت.',
    '["memberName", "loginTime", "ipAddress", "location", "device", "locale"]'
);

-- =====================================================================
-- SYSTEM TEMPLATES
-- =====================================================================

-- Welcome Email
INSERT INTO notification_templates (id, code, name_en, name_ar, category, subject_en, subject_ar, body_en, body_ar, sms_en, sms_ar, variables) VALUES (
    gen_random_uuid(),
    'WELCOME_EMAIL',
    'Welcome to Liyaqa!',
    'مرحباً بك في لياقة!',
    'SYSTEM',
    'Welcome to Liyaqa - Let''s Get Started!',
    'مرحباً بك في لياقة - لنبدأ!',
    'Dear {{memberName}},

Welcome to Liyaqa! We''re thrilled to have you join our fitness community.

Your account has been created successfully. Here''s what you can do next:

1. Complete your profile
2. Book your first class
3. Set up your payment method
4. Download our mobile app

Access your member portal: {{portalUrl}}

If you have any questions, our support team is here to help.

Let''s achieve your fitness goals together!

Best regards,
The Liyaqa Team',
    'عزيزي {{memberName}}،

مرحباً بك في لياقة! نحن سعداء بانضمامك إلى مجتمعنا الصحي.

تم إنشاء حسابك بنجاح. إليك ما يمكنك فعله بعد ذلك:

1. أكمل ملفك الشخصي
2. احجز حصتك الأولى
3. أعدّ طريقة الدفع الخاصة بك
4. حمّل تطبيقنا على الجوال

الوصول إلى بوابة الأعضاء: {{portalUrl}}

إذا كان لديك أي أسئلة، فريق الدعم لدينا هنا للمساعدة.

لنحقق أهدافك الصحية معاً!

مع أطيب التحيات،
فريق لياقة',
    'Welcome to Liyaqa! Complete your profile and book your first class: {{portalUrl}}',
    'مرحباً بك في لياقة! أكمل ملفك الشخصي واحجز حصتك الأولى: {{portalUrl}}',
    '["memberName", "portalUrl", "locale"]'
);

-- =====================================================================
-- Update timestamps trigger (for future updates)
-- =====================================================================

CREATE OR REPLACE FUNCTION update_notification_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_notification_template_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_template_updated_at();

-- =====================================================================
-- End of migration
-- =====================================================================
