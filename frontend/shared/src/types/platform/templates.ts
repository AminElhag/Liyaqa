import type { UUID } from "../api";

export type TemplateType = "EMAIL" | "INVOICE" | "CONTRACT" | "WELCOME_KIT" | "REPORT";

export interface DocumentTemplate {
  id: UUID;
  key: string;
  name: string;
  nameAr?: string;
  type: TemplateType;
  content: string;
  contentAr?: string;
  variables: string[];
  isActive: boolean;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCreateRequest {
  key: string;
  name: string;
  nameAr?: string;
  type: TemplateType;
  content: string;
  contentAr?: string;
  variables?: string[];
}

export interface TemplateUpdateRequest {
  name?: string;
  nameAr?: string;
  content?: string;
  contentAr?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface TemplateQueryParams {
  page?: number;
  size?: number;
  type?: TemplateType;
}
