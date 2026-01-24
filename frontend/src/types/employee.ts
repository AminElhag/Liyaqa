import type { UUID, LocalizedText, ListQueryParams } from "./api";

// ==================== ENUMS ====================

/**
 * Employee status
 */
export type EmployeeStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "ON_LEAVE"
  | "PROBATION"
  | "TERMINATED";

/**
 * Employment type
 */
export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERN"
  | "SEASONAL";

/**
 * Salary frequency
 */
export type SalaryFrequency =
  | "HOURLY"
  | "DAILY"
  | "WEEKLY"
  | "BI_WEEKLY"
  | "MONTHLY"
  | "ANNUALLY";

/**
 * Department status
 */
export type DepartmentStatus = "ACTIVE" | "INACTIVE";

/**
 * Assignment status
 */
export type AssignmentStatus = "ACTIVE" | "INACTIVE";

/**
 * Gender
 */
export type Gender = "MALE" | "FEMALE";

/**
 * System role
 */
export type Role =
  | "SUPER_ADMIN"
  | "PLATFORM_ADMIN"
  | "SALES_REP"
  | "SUPPORT_REP"
  | "CLUB_ADMIN"
  | "STAFF"
  | "TRAINER"
  | "MEMBER";

// ==================== INPUT TYPES ====================

export interface LocalizedTextInput {
  en: string;
  ar?: string | null;
}

export interface AddressInput {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface CertificationInput {
  name: string;
  issuedBy?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
}

// ==================== RESPONSE TYPES ====================

export interface AddressResponse {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  formatted: string;
}

export interface EmergencyContact {
  name?: string | null;
  phone?: string | null;
  relationship?: string | null;
}

export interface CertificationResponse {
  name: string;
  issuedBy?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  isExpiring: boolean;
  isExpired: boolean;
}

export interface EmployeeLocationAssignment {
  id: UUID;
  employeeId: UUID;
  locationId: UUID;
  locationName?: LocalizedText | null;
  isPrimary: boolean;
  status: string;
  createdAt: string;
}

// ==================== EMPLOYEE ====================

export interface Employee {
  id: UUID;
  userId: UUID;
  organizationId: UUID;
  firstName: LocalizedText;
  lastName: LocalizedText;
  fullName: LocalizedText;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  email?: string | null;
  phone?: string | null;
  address?: AddressResponse | null;
  departmentId?: UUID | null;
  departmentName?: LocalizedText | null;
  jobTitleId?: UUID | null;
  jobTitleName?: LocalizedText | null;
  employmentType: EmploymentType;
  hireDate: string;
  terminationDate?: string | null;
  status: EmployeeStatus;
  certifications: CertificationResponse[];
  emergencyContact?: EmergencyContact | null;
  salaryAmount?: number | null;
  salaryCurrency?: string | null;
  salaryFrequency?: SalaryFrequency | null;
  profileImageUrl?: string | null;
  notes?: LocalizedText | null;
  assignedLocations?: EmployeeLocationAssignment[] | null;
  yearsOfService: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSummary {
  id: UUID;
  userId: UUID;
  firstName: LocalizedText;
  lastName: LocalizedText;
  fullName: LocalizedText;
  email?: string | null;
  departmentId?: UUID | null;
  departmentName?: LocalizedText | null;
  jobTitleId?: UUID | null;
  jobTitleName?: LocalizedText | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  profileImageUrl?: string | null;
  hireDate: string;
  createdAt: string;
}

export interface CreateEmployeeRequest {
  userId: UUID;
  organizationId: UUID;
  firstName: LocalizedTextInput;
  lastName: LocalizedTextInput;
  hireDate: string;
  employmentType?: EmploymentType;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  address?: AddressInput | null;
  departmentId?: UUID | null;
  jobTitleId?: UUID | null;
  certifications?: CertificationInput[] | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  salaryAmount?: number | null;
  salaryCurrency?: string | null;
  salaryFrequency?: SalaryFrequency | null;
  profileImageUrl?: string | null;
  notes?: LocalizedTextInput | null;
  assignedLocationIds?: UUID[] | null;
  primaryLocationId?: UUID | null;
}

export interface UpdateEmployeeRequest {
  firstName?: LocalizedTextInput | null;
  lastName?: LocalizedTextInput | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  email?: string | null;
  phone?: string | null;
  address?: AddressInput | null;
  departmentId?: UUID | null;
  jobTitleId?: UUID | null;
  employmentType?: EmploymentType | null;
  certifications?: CertificationInput[] | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  salaryAmount?: number | null;
  salaryCurrency?: string | null;
  salaryFrequency?: SalaryFrequency | null;
  profileImageUrl?: string | null;
  notes?: LocalizedTextInput | null;
}

export interface AssignLocationRequest {
  locationId: UUID;
  isPrimary?: boolean;
}

export interface EmployeeQueryParams extends ListQueryParams {
  search?: string;
  status?: EmployeeStatus;
  departmentId?: UUID;
  jobTitleId?: UUID;
  employmentType?: EmploymentType;
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  onLeave: number;
  probation: number;
  terminated: number;
}

export interface ExpiringCertification {
  employeeId: UUID;
  employeeName: LocalizedText;
  certificationName: string;
  expiresAt: string;
  daysUntilExpiry: number;
}

// ==================== DEPARTMENT ====================

export interface Department {
  id: UUID;
  name: LocalizedText;
  description?: LocalizedText | null;
  parentDepartmentId?: UUID | null;
  managerEmployeeId?: UUID | null;
  status: DepartmentStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentSummary {
  id: UUID;
  name: LocalizedText;
  status: DepartmentStatus;
  parentDepartmentId?: UUID | null;
  hasChildren: boolean;
  employeeCount: number;
}

export interface DepartmentTreeNode {
  id: UUID;
  name: LocalizedText;
  description?: LocalizedText | null;
  status: DepartmentStatus;
  managerEmployeeId?: UUID | null;
  employeeCount: number;
  children: DepartmentTreeNode[];
}

export interface CreateDepartmentRequest {
  name: LocalizedTextInput;
  description?: LocalizedTextInput | null;
  parentDepartmentId?: UUID | null;
  sortOrder?: number;
}

export interface UpdateDepartmentRequest {
  name?: LocalizedTextInput | null;
  description?: LocalizedTextInput | null;
  parentDepartmentId?: UUID | null;
  sortOrder?: number | null;
}

export interface SetManagerRequest {
  employeeId?: UUID | null;
}

export type DepartmentQueryParams = ListQueryParams;

export interface DepartmentStats {
  total: number;
  active: number;
  inactive: number;
}

// ==================== JOB TITLE ====================

export interface JobTitle {
  id: UUID;
  name: LocalizedText;
  description?: LocalizedText | null;
  departmentId?: UUID | null;
  departmentName?: LocalizedText | null;
  defaultRole: Role;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobTitleSummary {
  id: UUID;
  name: LocalizedText;
  departmentId?: UUID | null;
  departmentName?: LocalizedText | null;
  defaultRole: Role;
  isActive: boolean;
}

export interface CreateJobTitleRequest {
  name: LocalizedTextInput;
  description?: LocalizedTextInput | null;
  departmentId?: UUID | null;
  defaultRole?: Role;
  sortOrder?: number;
}

export interface UpdateJobTitleRequest {
  name?: LocalizedTextInput | null;
  description?: LocalizedTextInput | null;
  departmentId?: UUID | null;
  defaultRole?: Role | null;
  sortOrder?: number | null;
}

export interface JobTitleQueryParams extends ListQueryParams {
  departmentId?: UUID;
  activeOnly?: boolean;
}

export interface JobTitleStats {
  total: number;
  active: number;
  inactive: number;
}
