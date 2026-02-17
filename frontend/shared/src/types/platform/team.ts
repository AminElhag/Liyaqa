/**
 * Platform user role type (matches backend PlatformRole)
 */
export type PlatformRole =
  | "PLATFORM_SUPER_ADMIN"
  | "PLATFORM_ADMIN"
  | "ACCOUNT_MANAGER"
  | "SUPPORT_LEAD"
  | "SUPPORT_AGENT"
  | "PLATFORM_VIEWER";

/**
 * Invite team member request
 */
export interface InviteTeamMemberRequest {
  email: string;
  role: PlatformRole;
  displayNameEn?: string;
  displayNameAr?: string;
}

/**
 * Change role request
 */
export interface ChangeRoleRequest {
  newRole: PlatformRole;
}

/**
 * Platform role config for display
 */
export const PLATFORM_ROLE_CONFIG: Record<
  PlatformRole,
  { labelEn: string; labelAr: string; descriptionEn: string; descriptionAr: string }
> = {
  PLATFORM_SUPER_ADMIN: {
    labelEn: "Super Admin",
    labelAr: "مدير أعلى",
    descriptionEn: "Full access including system configuration",
    descriptionAr: "وصول كامل بما في ذلك إعدادات النظام",
  },
  PLATFORM_ADMIN: {
    labelEn: "Admin",
    labelAr: "مدير",
    descriptionEn: "Full operational access",
    descriptionAr: "وصول تشغيلي كامل",
  },
  ACCOUNT_MANAGER: {
    labelEn: "Account Manager",
    labelAr: "مدير حسابات",
    descriptionEn: "Client, deal, and subscription management",
    descriptionAr: "إدارة العملاء والصفقات والاشتراكات",
  },
  SUPPORT_LEAD: {
    labelEn: "Support Lead",
    labelAr: "قائد الدعم",
    descriptionEn: "Support tickets and escalations",
    descriptionAr: "تذاكر الدعم والتصعيدات",
  },
  SUPPORT_AGENT: {
    labelEn: "Support Agent",
    labelAr: "وكيل دعم",
    descriptionEn: "Assigned tickets only",
    descriptionAr: "التذاكر المعينة فقط",
  },
  PLATFORM_VIEWER: {
    labelEn: "Viewer",
    labelAr: "مشاهد",
    descriptionEn: "Read-only access",
    descriptionAr: "وصول للقراءة فقط",
  },
};
