-- V24: Make member name columns flexible (either English OR Arabic required)
-- This allows members to have names in only one language instead of requiring English

-- Make first_name_en and last_name_en nullable
ALTER TABLE members ALTER COLUMN first_name_en DROP NOT NULL;
ALTER TABLE members ALTER COLUMN last_name_en DROP NOT NULL;

-- Add check constraints to ensure at least one language is provided for each name
-- firstName: either first_name_en OR first_name_ar must be non-empty
ALTER TABLE members ADD CONSTRAINT chk_member_first_name_required
    CHECK (
        (first_name_en IS NOT NULL AND first_name_en != '') OR
        (first_name_ar IS NOT NULL AND first_name_ar != '')
    );

-- lastName: either last_name_en OR last_name_ar must be non-empty
ALTER TABLE members ADD CONSTRAINT chk_member_last_name_required
    CHECK (
        (last_name_en IS NOT NULL AND last_name_en != '') OR
        (last_name_ar IS NOT NULL AND last_name_ar != '')
    );
