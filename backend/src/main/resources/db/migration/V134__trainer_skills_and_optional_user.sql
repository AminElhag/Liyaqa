-- V134: Trainer skills junction table + make user_id optional on trainers

-- 1. Make user_id nullable on trainers
ALTER TABLE trainers ALTER COLUMN user_id DROP NOT NULL;

-- 2. Drop existing unique constraint on (user_id, organization_id) if it exists
DO $$
BEGIN
    -- Find and drop any unique constraint involving user_id and organization_id
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'trainers'::regclass
          AND contype = 'u'
          AND array_length(conkey, 1) = 2
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE trainers DROP CONSTRAINT ' || conname
            FROM pg_constraint
            WHERE conrelid = 'trainers'::regclass
              AND contype = 'u'
              AND array_length(conkey, 1) = 2
            LIMIT 1
        );
    END IF;
END $$;

-- 3. Add partial unique constraint: only enforce uniqueness when user_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS uq_trainers_user_org_partial
    ON trainers (user_id, organization_id)
    WHERE user_id IS NOT NULL;

-- 4. Create trainer_skills junction table
CREATE TABLE IF NOT EXISTS trainer_skills (
    id          UUID PRIMARY KEY,
    tenant_id   UUID NOT NULL REFERENCES clubs(id),
    trainer_id  UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES class_categories(id) ON DELETE CASCADE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version     BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_trainer_category UNIQUE (trainer_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_trainer_skills_trainer_id ON trainer_skills(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_skills_category_id ON trainer_skills(category_id);
CREATE INDEX IF NOT EXISTS idx_trainer_skills_tenant_id ON trainer_skills(tenant_id);
