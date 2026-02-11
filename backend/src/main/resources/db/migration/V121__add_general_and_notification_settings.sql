-- Add GENERAL to the category check constraint
ALTER TABLE global_settings DROP CONSTRAINT IF EXISTS global_settings_category_check;
ALTER TABLE global_settings ADD CONSTRAINT global_settings_category_check
    CHECK (category::text = ANY (ARRAY['BILLING','SECURITY','LOCALIZATION','NOTIFICATIONS','SYSTEM','COMPLIANCE','GENERAL']::text[]));

-- Add GENERAL, NOTIFICATIONS, and extra SECURITY/BILLING settings for the config page
INSERT INTO global_settings (id, created_at, updated_at, version, key, value, value_type, category, description, description_ar, is_editable) VALUES
    -- GENERAL
    (gen_random_uuid(), now(), now(), 0, 'platform.name', 'Liyaqa', 'STRING', 'GENERAL', 'Display name for the platform', 'اسم العرض للمنصة', true),
    (gen_random_uuid(), now(), now(), 0, 'platform.max_tenants', '500', 'NUMBER', 'GENERAL', 'Maximum number of allowed tenants', 'الحد الأقصى لعدد المستأجرين المسموح بهم', true),
    (gen_random_uuid(), now(), now(), 0, 'platform.trial_days', '14', 'NUMBER', 'GENERAL', 'Default free trial duration for new tenants (days)', 'مدة التجربة المجانية الافتراضية للمستأجرين الجدد (أيام)', true),
    (gen_random_uuid(), now(), now(), 0, 'platform.maintenance_mode', 'false', 'BOOLEAN', 'GENERAL', 'Enable platform-wide maintenance mode', 'تفعيل وضع الصيانة لكامل المنصة', true),

    -- NOTIFICATIONS
    (gen_random_uuid(), now(), now(), 0, 'notify.email_enabled', 'true', 'BOOLEAN', 'NOTIFICATIONS', 'Send email notifications to platform admins', 'إرسال إشعارات البريد الإلكتروني لمديري المنصة', true),
    (gen_random_uuid(), now(), now(), 0, 'notify.slack_webhook', '', 'STRING', 'NOTIFICATIONS', 'Webhook URL for Slack alerts', 'رابط Webhook لتنبيهات Slack', true),
    (gen_random_uuid(), now(), now(), 0, 'notify.digest_hour', '8', 'NUMBER', 'NOTIFICATIONS', 'Hour of day for daily digest email (UTC, 0-23)', 'ساعة إرسال الملخص اليومي (UTC، 0-23)', true),
    (gen_random_uuid(), now(), now(), 0, 'notify.sms_enabled', 'false', 'BOOLEAN', 'NOTIFICATIONS', 'Send SMS for critical alerts', 'إرسال رسائل نصية للتنبيهات الحرجة', true),

    -- SECURITY (new)
    (gen_random_uuid(), now(), now(), 0, 'security.mfa_required', 'false', 'BOOLEAN', 'SECURITY', 'Require multi-factor authentication for all platform users', 'طلب المصادقة الثنائية لجميع مستخدمي المنصة', true),
    (gen_random_uuid(), now(), now(), 0, 'security.ip_whitelist', '', 'STRING', 'SECURITY', 'Comma-separated list of allowed IPs (empty = all)', 'قائمة عناوين IP المسموح بها مفصولة بفواصل (فارغ = الكل)', true),

    -- BILLING (new)
    (gen_random_uuid(), now(), now(), 0, 'billing.auto_invoice', 'true', 'BOOLEAN', 'BILLING', 'Automatically generate invoices at billing cycle end', 'إنشاء الفواتير تلقائيا في نهاية دورة الفوترة', true)

ON CONFLICT (key) DO NOTHING;
