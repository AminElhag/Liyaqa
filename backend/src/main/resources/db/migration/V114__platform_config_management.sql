-- Platform Configuration Management
-- Global settings and maintenance windows

CREATE TABLE global_settings (
    id UUID PRIMARY KEY,
    key VARCHAR(200) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    value_type VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    description_ar TEXT,
    is_editable BOOLEAN DEFAULT true,
    updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_global_settings_key ON global_settings(key);
CREATE INDEX idx_global_settings_category ON global_settings(category);

CREATE TABLE maintenance_windows (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    title VARCHAR(500) NOT NULL,
    title_ar VARCHAR(500),
    description TEXT,
    description_ar TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_maintenance_windows_active ON maintenance_windows(is_active) WHERE is_active = true;
CREATE INDEX idx_maintenance_windows_time ON maintenance_windows(start_at, end_at);
CREATE INDEX idx_maintenance_windows_tenant ON maintenance_windows(tenant_id);

-- Seed global settings
INSERT INTO global_settings (id, key, value, value_type, category, description, description_ar, is_editable) VALUES
    (gen_random_uuid(), 'billing.vat_rate', '15', 'NUMBER', 'BILLING', 'VAT rate percentage', 'نسبة ضريبة القيمة المضافة', true),
    (gen_random_uuid(), 'billing.default_currency', 'SAR', 'STRING', 'BILLING', 'Default currency code', 'رمز العملة الافتراضي', true),
    (gen_random_uuid(), 'billing.invoice_prefix', 'LYQ', 'STRING', 'BILLING', 'Invoice number prefix', 'بادئة رقم الفاتورة', true),
    (gen_random_uuid(), 'security.max_login_attempts', '5', 'NUMBER', 'SECURITY', 'Maximum failed login attempts before lockout', 'الحد الأقصى لمحاولات تسجيل الدخول الفاشلة', true),
    (gen_random_uuid(), 'security.session_timeout_minutes', '30', 'NUMBER', 'SECURITY', 'Session timeout in minutes', 'مهلة الجلسة بالدقائق', true),
    (gen_random_uuid(), 'security.impersonation_timeout_minutes', '30', 'NUMBER', 'SECURITY', 'Impersonation session timeout in minutes', 'مهلة جلسة انتحال الهوية بالدقائق', true),
    (gen_random_uuid(), 'localization.default_language', 'ar', 'STRING', 'LOCALIZATION', 'Default platform language', 'اللغة الافتراضية للمنصة', true),
    (gen_random_uuid(), 'localization.supported_languages', '["ar","en"]', 'JSON', 'LOCALIZATION', 'Supported languages list', 'قائمة اللغات المدعومة', false),
    (gen_random_uuid(), 'compliance.data_retention_days', '90', 'NUMBER', 'COMPLIANCE', 'Data retention period in days', 'فترة الاحتفاظ بالبيانات بالأيام', true),
    (gen_random_uuid(), 'compliance.zatca_enabled', 'true', 'BOOLEAN', 'COMPLIANCE', 'ZATCA e-invoicing enabled', 'تفعيل الفوترة الإلكترونية (زاتكا)', true);
