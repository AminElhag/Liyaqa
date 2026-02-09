-- V115: Content Management - Knowledge Base Articles & Document Templates

-- =============================================
-- Knowledge Base Articles
-- =============================================
CREATE TABLE knowledge_base_articles (
    id              UUID PRIMARY KEY,
    slug            VARCHAR(200) UNIQUE NOT NULL,
    title           VARCHAR(500) NOT NULL,
    title_ar        VARCHAR(500),
    content         TEXT NOT NULL,
    content_ar      TEXT,
    category        VARCHAR(50) NOT NULL,
    tags            JSONB DEFAULT '[]',
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    view_count      BIGINT DEFAULT 0,
    helpful_count   BIGINT DEFAULT 0,
    not_helpful_count BIGINT DEFAULT 0,
    author_id       UUID NOT NULL,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ,
    version         BIGINT DEFAULT 0,
    search_vector   TSVECTOR
);

CREATE INDEX idx_kb_articles_slug ON knowledge_base_articles (slug);
CREATE INDEX idx_kb_articles_category ON knowledge_base_articles (category);
CREATE INDEX idx_kb_articles_status ON knowledge_base_articles (status);
CREATE INDEX idx_kb_articles_author_id ON knowledge_base_articles (author_id);
CREATE INDEX idx_kb_articles_view_count ON knowledge_base_articles (view_count DESC);
CREATE INDEX idx_kb_articles_search_vector ON knowledge_base_articles USING GIN (search_vector);

-- Full-text search trigger using 'simple' dictionary (works for Arabic tokenization)
CREATE OR REPLACE FUNCTION kb_articles_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.title_ar, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.content_ar, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kb_articles_search_vector_trigger
    BEFORE INSERT OR UPDATE OF title, title_ar, content, content_ar
    ON knowledge_base_articles
    FOR EACH ROW
    EXECUTE FUNCTION kb_articles_search_vector_update();

-- =============================================
-- Document Templates
-- =============================================
CREATE TABLE document_templates (
    id          UUID PRIMARY KEY,
    key         VARCHAR(200) UNIQUE NOT NULL,
    name        VARCHAR(500) NOT NULL,
    name_ar     VARCHAR(500),
    type        VARCHAR(30) NOT NULL,
    content     TEXT NOT NULL,
    content_ar  TEXT,
    variables   JSONB DEFAULT '[]',
    is_active   BOOLEAN DEFAULT true,
    version     BIGINT DEFAULT 0,
    updated_by  UUID,
    created_at  TIMESTAMPTZ,
    updated_at  TIMESTAMPTZ
);

CREATE INDEX idx_doc_templates_key ON document_templates (key);
CREATE INDEX idx_doc_templates_type ON document_templates (type);
CREATE INDEX idx_doc_templates_active ON document_templates (is_active) WHERE is_active = true;
