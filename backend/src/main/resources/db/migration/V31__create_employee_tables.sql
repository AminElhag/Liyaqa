-- Create departments table
-- Organizational departments for employee categorization
CREATE TABLE departments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    parent_department_id UUID,
    manager_employee_id UUID,  -- FK added after employees table
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_departments_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT fk_departments_parent FOREIGN KEY (parent_department_id) REFERENCES departments(id)
);

-- Create job_titles table
-- Job positions with associated system roles
CREATE TABLE job_titles (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    department_id UUID,
    default_role VARCHAR(50) NOT NULL DEFAULT 'STAFF',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_job_titles_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT fk_job_titles_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Create employees table (OrganizationAwareEntity pattern)
-- General staff (non-trainer) employees
CREATE TABLE employees (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,

    -- Basic Info (bilingual)
    first_name_en VARCHAR(100),
    first_name_ar VARCHAR(100),
    last_name_en VARCHAR(100),
    last_name_ar VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),

    -- Contact
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Address
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),

    -- Employment
    department_id UUID,
    job_title_id UUID,
    employment_type VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME',
    hire_date DATE NOT NULL,
    termination_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',

    -- Certifications (JSON array)
    certifications TEXT,

    -- Emergency Contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),

    -- Compensation
    salary_amount DECIMAL(12, 2),
    salary_currency VARCHAR(3) DEFAULT 'SAR',
    salary_frequency VARCHAR(50),

    -- Profile
    profile_image_url VARCHAR(500),
    notes_en TEXT,
    notes_ar TEXT,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_employees_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT fk_employees_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT fk_employees_job_title FOREIGN KEY (job_title_id) REFERENCES job_titles(id),
    CONSTRAINT uq_employees_user_org UNIQUE (user_id, organization_id)
);

-- Add manager FK to departments now that employees table exists
ALTER TABLE departments ADD CONSTRAINT fk_departments_manager
    FOREIGN KEY (manager_employee_id) REFERENCES employees(id);

-- Create employee_location_assignments table
-- Employees can be assigned to multiple locations
CREATE TABLE employee_location_assignments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    location_id UUID NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_ela_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_ela_location FOREIGN KEY (location_id) REFERENCES locations(id),
    CONSTRAINT fk_ela_tenant FOREIGN KEY (tenant_id) REFERENCES clubs(id),
    CONSTRAINT uq_employee_location UNIQUE (employee_id, location_id)
);

-- Indexes for departments
CREATE INDEX idx_departments_tenant ON departments(tenant_id);
CREATE INDEX idx_departments_parent ON departments(parent_department_id);
CREATE INDEX idx_departments_status ON departments(status);
CREATE INDEX idx_departments_manager ON departments(manager_employee_id);

-- Indexes for job_titles
CREATE INDEX idx_job_titles_tenant ON job_titles(tenant_id);
CREATE INDEX idx_job_titles_department ON job_titles(department_id);
CREATE INDEX idx_job_titles_active ON job_titles(is_active);
CREATE INDEX idx_job_titles_role ON job_titles(default_role);

-- Indexes for employees
CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_employees_organization ON employees(organization_id);
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_job_title ON employees(job_title_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_employment_type ON employees(employment_type);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);
CREATE INDEX idx_employees_name_en ON employees(first_name_en, last_name_en);
CREATE INDEX idx_employees_email ON employees(email);

-- Indexes for employee_location_assignments
CREATE INDEX idx_ela_employee ON employee_location_assignments(employee_id);
CREATE INDEX idx_ela_location ON employee_location_assignments(location_id);
CREATE INDEX idx_ela_status ON employee_location_assignments(status);
CREATE INDEX idx_ela_is_primary ON employee_location_assignments(is_primary);

-- Comments for documentation
COMMENT ON TABLE departments IS 'Organizational departments for employee categorization';
COMMENT ON TABLE job_titles IS 'Job positions with associated system roles';
COMMENT ON TABLE employees IS 'General staff (non-trainer) employees';
COMMENT ON TABLE employee_location_assignments IS 'Many-to-many association between employees and locations';

COMMENT ON COLUMN departments.status IS 'ACTIVE or INACTIVE';
COMMENT ON COLUMN departments.parent_department_id IS 'Self-referencing FK for department hierarchy';
COMMENT ON COLUMN departments.manager_employee_id IS 'Employee who manages this department';

COMMENT ON COLUMN job_titles.default_role IS 'System role assigned to users with this job title (STAFF, CLUB_ADMIN, etc.)';
COMMENT ON COLUMN job_titles.department_id IS 'Optional department this job title belongs to';

COMMENT ON COLUMN employees.employment_type IS 'FULL_TIME, PART_TIME, CONTRACT, INTERN, or SEASONAL';
COMMENT ON COLUMN employees.status IS 'ACTIVE, INACTIVE, ON_LEAVE, PROBATION, or TERMINATED';
COMMENT ON COLUMN employees.certifications IS 'JSON array: [{"name": "...", "issuedBy": "...", "issuedAt": "...", "expiresAt": "..."}]';
COMMENT ON COLUMN employees.salary_frequency IS 'HOURLY, DAILY, WEEKLY, BI_WEEKLY, MONTHLY, or ANNUALLY';
