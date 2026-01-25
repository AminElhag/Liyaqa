-- Lead Capture Forms Table
-- Allows clubs to create embeddable forms for capturing leads from their website

CREATE TABLE lead_capture_forms (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Form configuration (JSON)
    config JSONB NOT NULL DEFAULT '{
        "fields": [
            {"name": "firstName", "type": "text", "required": true, "label": {"en": "First Name", "ar": "الاسم الأول"}},
            {"name": "lastName", "type": "text", "required": true, "label": {"en": "Last Name", "ar": "اسم العائلة"}},
            {"name": "email", "type": "email", "required": true, "label": {"en": "Email", "ar": "البريد الإلكتروني"}},
            {"name": "phone", "type": "tel", "required": false, "label": {"en": "Phone", "ar": "رقم الهاتف"}}
        ],
        "defaultSource": "WEBSITE",
        "autoAssign": false,
        "notifyOnSubmission": true
    }'::jsonb,

    -- Styling configuration (JSON)
    styling JSONB DEFAULT '{
        "theme": "light",
        "primaryColor": "#0ea5e9",
        "borderRadius": "8px",
        "fontFamily": "system-ui"
    }'::jsonb,

    -- Success behavior
    redirect_url VARCHAR(500),
    thank_you_message_en TEXT DEFAULT 'Thank you for your interest! We will contact you soon.',
    thank_you_message_ar TEXT DEFAULT 'شكراً لاهتمامك! سنتواصل معك قريباً.',

    -- Stats
    submission_count BIGINT NOT NULL DEFAULT 0,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,

    -- Unique slug per tenant
    UNIQUE (tenant_id, slug)
);

-- Indexes
CREATE INDEX idx_lead_capture_forms_tenant ON lead_capture_forms(tenant_id);
CREATE INDEX idx_lead_capture_forms_active ON lead_capture_forms(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX idx_lead_capture_forms_slug ON lead_capture_forms(tenant_id, slug);

-- Function to update submission count
CREATE OR REPLACE FUNCTION increment_form_submission_count()
RETURNS TRIGGER AS $$
BEGIN
    -- If a lead has form_id set, increment the counter
    IF NEW.form_id IS NOT NULL THEN
        UPDATE lead_capture_forms
        SET submission_count = submission_count + 1,
            updated_at = NOW()
        WHERE id = NEW.form_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add form_id column to leads table to track which form created the lead
ALTER TABLE leads ADD COLUMN IF NOT EXISTS form_id UUID REFERENCES lead_capture_forms(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_form_id ON leads(form_id);

-- Trigger to auto-increment submission count when a lead is created with a form_id
CREATE TRIGGER trigger_increment_form_submission
AFTER INSERT ON leads
FOR EACH ROW
EXECUTE FUNCTION increment_form_submission_count();

-- Comments
COMMENT ON TABLE lead_capture_forms IS 'Embeddable lead capture forms for club websites';
COMMENT ON COLUMN lead_capture_forms.slug IS 'URL-friendly identifier for the form (unique per tenant)';
COMMENT ON COLUMN lead_capture_forms.config IS 'JSON configuration for form fields and behavior';
COMMENT ON COLUMN lead_capture_forms.styling IS 'JSON configuration for form appearance';
