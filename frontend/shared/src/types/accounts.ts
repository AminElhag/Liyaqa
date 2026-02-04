// Family Group Types
export type FamilyBillingType = 'INDIVIDUAL' | 'PRIMARY_PAYS_ALL' | 'SPLIT';
export type FamilyRelationship = 'PRIMARY' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'OTHER';
export type FamilyMemberStatus = 'ACTIVE' | 'INACTIVE';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

export interface FamilyGroupMember {
  id: string;
  memberId: string;
  relationship: FamilyRelationship;
  joinedAt: string;
  status: FamilyMemberStatus;
}

export interface FamilyGroup {
  id: string;
  name: string;
  primaryMemberId: string;
  maxMembers: number;
  discountPercentage: number;
  billingType: FamilyBillingType;
  status: AccountStatus;
  notes?: string;
  members: FamilyGroupMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FamilyGroupSummary {
  id: string;
  name: string;
  primaryMemberId: string;
  memberCount: number;
  maxMembers: number;
  discountPercentage: number;
  billingType?: FamilyBillingType;
  status: AccountStatus;
  createdAt?: string;
}

export interface CreateFamilyGroupRequest {
  name: string;
  primaryMemberId: string;
  maxMembers?: number;
  discountPercentage?: number;
  billingType?: FamilyBillingType;
  notes?: string;
}

export interface UpdateFamilyGroupRequest {
  name?: string;
  maxMembers?: number;
  discountPercentage?: number;
  billingType?: FamilyBillingType;
  notes?: string;
}

export interface AddFamilyMemberRequest {
  memberId: string;
  relationship: FamilyRelationship;
}

// Corporate Account Types
export type CorporateBillingType = 'INVOICE' | 'PREPAID' | 'MONTHLY';
export type CorporateMemberStatus = 'ACTIVE' | 'INACTIVE';

export interface CorporateMember {
  id: string;
  memberId: string;
  employeeId?: string;
  department?: string;
  position?: string;
  joinedAt: string;
  status: CorporateMemberStatus;
}

export interface CorporateAccount {
  id: string;
  companyName: string;
  companyNameAr?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  crNumber?: string;
  vatNumber?: string;
  address?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  maxMembers?: number;
  discountPercentage: number;
  billingType: CorporateBillingType;
  paymentTermsDays: number;
  status: AccountStatus;
  notes?: string;
  members: CorporateMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CorporateAccountSummary {
  id: string;
  companyName: string;
  companyNameAr?: string;
  memberCount: number;
  maxMembers?: number;
  discountPercentage: number;
  contractEndDate?: string;
  status: AccountStatus;
  createdAt?: string;
}

export interface CreateCorporateAccountRequest {
  companyName: string;
  companyNameAr?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  crNumber?: string;
  vatNumber?: string;
  address?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  maxMembers?: number;
  discountPercentage?: number;
  billingType?: CorporateBillingType;
  paymentTermsDays?: number;
  notes?: string;
}

export interface UpdateCorporateAccountRequest {
  companyName?: string;
  companyNameAr?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  crNumber?: string;
  vatNumber?: string;
  address?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  maxMembers?: number;
  discountPercentage?: number;
  billingType?: CorporateBillingType;
  paymentTermsDays?: number;
  notes?: string;
}

export interface AddCorporateMemberRequest {
  memberId: string;
  employeeId?: string;
  department?: string;
  position?: string;
}
