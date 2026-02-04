import type { LocalizedText } from "./api";

/**
 * Permission response from the backend.
 */
export interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  nameEn: string;
  nameAr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
}

/**
 * Permissions grouped by module.
 */
export interface ModulePermissions {
  module: string;
  permissions: Permission[];
}

/**
 * Response with permissions grouped by module.
 */
export interface PermissionsByModuleResponse {
  modules: ModulePermissions[];
}

/**
 * User permissions response.
 */
export interface UserPermissionsResponse {
  userId: string;
  permissions: Permission[];
  permissionCodes: string[];
}

/**
 * Request to grant permissions to a user.
 */
export interface GrantPermissionsRequest {
  permissionCodes: string[];
}

/**
 * Request to revoke permissions from a user.
 */
export interface RevokePermissionsRequest {
  permissionCodes: string[];
}

/**
 * Request to set all permissions for a user.
 */
export interface SetPermissionsRequest {
  permissionCodes: string[];
}

/**
 * Permission codes organized by module.
 */
export const PERMISSION_MODULES = [
  "members",
  "subscriptions",
  "invoices",
  "attendance",
  "classes",
  "sessions",
  "bookings",
  "users",
  "employees",
  "departments",
  "job_titles",
  "organizations",
  "clubs",
  "locations",
  "plans",
  "reports",
  "dashboard",
  "settings",
  "trainers",
  "shop",
  "orders",
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

/**
 * All permission codes.
 */
export type PermissionCode =
  // Members
  | "members_view"
  | "members_create"
  | "members_update"
  | "members_delete"
  | "members_export"
  // Subscriptions
  | "subscriptions_view"
  | "subscriptions_create"
  | "subscriptions_update"
  | "subscriptions_cancel"
  | "subscriptions_freeze"
  // Invoices
  | "invoices_view"
  | "invoices_create"
  | "invoices_update"
  | "invoices_delete"
  | "invoices_issue"
  | "invoices_pay"
  | "invoices_export"
  // Attendance
  | "attendance_view"
  | "attendance_checkin"
  | "attendance_checkout"
  | "attendance_export"
  // Classes
  | "classes_view"
  | "classes_create"
  | "classes_update"
  | "classes_delete"
  // Sessions
  | "sessions_view"
  | "sessions_create"
  | "sessions_update"
  | "sessions_cancel"
  // Bookings
  | "bookings_view"
  | "bookings_create"
  | "bookings_cancel"
  | "bookings_checkin"
  // Users
  | "users_view"
  | "users_create"
  | "users_update"
  | "users_delete"
  | "users_permissions"
  // Employees
  | "employees_view"
  | "employees_create"
  | "employees_update"
  | "employees_delete"
  // Departments
  | "departments_view"
  | "departments_create"
  | "departments_update"
  | "departments_delete"
  // Job Titles
  | "job_titles_view"
  | "job_titles_create"
  | "job_titles_update"
  | "job_titles_delete"
  // Organizations
  | "organizations_view"
  | "organizations_update"
  // Clubs
  | "clubs_view"
  | "clubs_create"
  | "clubs_update"
  | "clubs_delete"
  // Locations
  | "locations_view"
  | "locations_create"
  | "locations_update"
  | "locations_delete"
  // Plans
  | "plans_view"
  | "plans_create"
  | "plans_update"
  | "plans_delete"
  // Reports
  | "reports_view"
  | "reports_export"
  // Dashboard
  | "dashboard_view"
  // Settings
  | "settings_view"
  | "settings_update"
  // Trainers
  | "trainers_view"
  | "trainers_create"
  | "trainers_update"
  | "trainers_delete"
  // Shop
  | "shop_view"
  | "shop_create"
  | "shop_update"
  | "shop_delete"
  // Orders
  | "orders_view"
  | "orders_create"
  | "orders_update"
  | "orders_cancel";

/**
 * Helper to get localized permission name.
 */
export function getLocalizedPermissionName(
  permission: Permission,
  locale: string
): string {
  return locale === "ar" && permission.nameAr
    ? permission.nameAr
    : permission.nameEn;
}

/**
 * Helper to get localized permission description.
 */
export function getLocalizedPermissionDescription(
  permission: Permission,
  locale: string
): string | null {
  return locale === "ar" && permission.descriptionAr
    ? permission.descriptionAr
    : permission.descriptionEn;
}

/**
 * Module display names for UI.
 */
export const MODULE_NAMES: Record<PermissionModule, { en: string; ar: string }> = {
  members: { en: "Members", ar: "الأعضاء" },
  subscriptions: { en: "Subscriptions", ar: "الاشتراكات" },
  invoices: { en: "Invoices", ar: "الفواتير" },
  attendance: { en: "Attendance", ar: "الحضور" },
  classes: { en: "Classes", ar: "الفصول" },
  sessions: { en: "Sessions", ar: "الجلسات" },
  bookings: { en: "Bookings", ar: "الحجوزات" },
  users: { en: "Users", ar: "المستخدمين" },
  employees: { en: "Employees", ar: "الموظفين" },
  departments: { en: "Departments", ar: "الأقسام" },
  job_titles: { en: "Job Titles", ar: "المسميات الوظيفية" },
  organizations: { en: "Organizations", ar: "المنظمات" },
  clubs: { en: "Clubs", ar: "الأندية" },
  locations: { en: "Locations", ar: "المواقع" },
  plans: { en: "Membership Plans", ar: "خطط العضوية" },
  reports: { en: "Reports", ar: "التقارير" },
  dashboard: { en: "Dashboard", ar: "لوحة القيادة" },
  settings: { en: "Settings", ar: "الإعدادات" },
  trainers: { en: "Trainers", ar: "المدربين" },
  shop: { en: "Shop", ar: "المتجر" },
  orders: { en: "Orders", ar: "الطلبات" },
};
