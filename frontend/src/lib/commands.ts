import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  Receipt,
  ClipboardCheck,
  Settings,
  BarChart3,
  Bell,
  Activity,
  Tag,
  Snowflake,
  Dumbbell,
  UserCheck,
  Package,
  Tags,
  ShoppingBag,
  ShoppingCart,
  UserCog,
  Building,
  Briefcase,
  UsersRound,
  UserPlus,
  Target,
  Shuffle,
  FileText,
  Lock,
  Shield,
  CheckSquare,
  XCircle,
  Megaphone,
  Gift,
  Building2,
  TrendingUp,
  Search,
  Plus,
  type LucideIcon,
} from "lucide-react";

export type CommandCategory =
  | "pages"
  | "members"
  | "actions"
  | "settings"
  | "recent";

export interface Command {
  id: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  category: CommandCategory;
  icon: LucideIcon;
  href?: string;
  action?: () => void;
  keywords: string[];
  keywordsAr: string[];
  shortcut?: string;
}

// All navigation pages as commands
export const pageCommands: Command[] = [
  // Overview
  {
    id: "dashboard",
    title: "Dashboard",
    titleAr: "لوحة التحكم",
    category: "pages",
    icon: LayoutDashboard,
    href: "/dashboard",
    keywords: ["home", "overview", "main", "dashboard"],
    keywordsAr: ["الرئيسية", "نظرة عامة", "لوحة"],
  },

  // Members & CRM
  {
    id: "members",
    title: "Members",
    titleAr: "الأعضاء",
    category: "pages",
    icon: Users,
    href: "/members",
    keywords: ["members", "customers", "users", "people"],
    keywordsAr: ["أعضاء", "عملاء", "مستخدمين"],
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    titleAr: "الاشتراكات",
    category: "pages",
    icon: CreditCard,
    href: "/subscriptions",
    keywords: ["subscriptions", "plans", "billing", "payments"],
    keywordsAr: ["اشتراكات", "خطط", "فواتير", "مدفوعات"],
  },
  {
    id: "freeze-packages",
    title: "Freeze Packages",
    titleAr: "تجميد العضوية",
    category: "pages",
    icon: Snowflake,
    href: "/freeze-packages",
    keywords: ["freeze", "pause", "hold", "suspend"],
    keywordsAr: ["تجميد", "إيقاف", "تعليق"],
  },
  {
    id: "leads",
    title: "Leads & Pipeline",
    titleAr: "العملاء المحتملين",
    category: "pages",
    icon: UserPlus,
    href: "/leads",
    keywords: ["leads", "prospects", "pipeline", "sales", "crm"],
    keywordsAr: ["عملاء محتملين", "مبيعات", "فرص"],
  },
  {
    id: "tasks",
    title: "Tasks",
    titleAr: "المهام",
    category: "pages",
    icon: CheckSquare,
    href: "/tasks",
    keywords: ["tasks", "todo", "followup", "actions"],
    keywordsAr: ["مهام", "متابعة", "إجراءات"],
  },
  {
    id: "cancellations",
    title: "Cancellations",
    titleAr: "الإلغاءات",
    category: "pages",
    icon: XCircle,
    href: "/cancellations",
    keywords: ["cancellation", "cancel", "terminate", "end"],
    keywordsAr: ["إلغاء", "إنهاء", "فسخ"],
  },
  {
    id: "contracts",
    title: "Contracts",
    titleAr: "العقود",
    category: "pages",
    icon: FileText,
    href: "/contracts",
    keywords: ["contracts", "agreements", "documents", "sign"],
    keywordsAr: ["عقود", "اتفاقيات", "توقيع"],
  },

  // Operations
  {
    id: "classes",
    title: "Classes & Schedule",
    titleAr: "الحصص والجدول",
    category: "pages",
    icon: Calendar,
    href: "/classes",
    keywords: ["classes", "schedule", "timetable", "sessions"],
    keywordsAr: ["حصص", "جدول", "جلسات"],
  },
  {
    id: "trainers",
    title: "Trainers",
    titleAr: "المدربين",
    category: "pages",
    icon: Dumbbell,
    href: "/trainers",
    keywords: ["trainers", "coaches", "instructors", "staff"],
    keywordsAr: ["مدربين", "مدرسين"],
  },
  {
    id: "pt-sessions",
    title: "PT Sessions",
    titleAr: "جلسات التدريب الشخصي",
    category: "pages",
    icon: UserCheck,
    href: "/pt-sessions",
    keywords: ["personal training", "pt", "one on one", "sessions"],
    keywordsAr: ["تدريب شخصي", "جلسات خاصة"],
  },
  {
    id: "attendance",
    title: "Attendance",
    titleAr: "الحضور",
    category: "pages",
    icon: ClipboardCheck,
    href: "/attendance",
    keywords: ["attendance", "check-in", "checkin", "present"],
    keywordsAr: ["حضور", "تسجيل دخول"],
  },
  {
    id: "facilities",
    title: "Facilities",
    titleAr: "المرافق",
    category: "pages",
    icon: Building2,
    href: "/facilities",
    keywords: ["facilities", "rooms", "courts", "equipment"],
    keywordsAr: ["مرافق", "غرف", "ملاعب"],
  },

  // Sales & Commerce
  {
    id: "pos",
    title: "Point of Sale",
    titleAr: "نقطة البيع",
    category: "pages",
    icon: ShoppingCart,
    href: "/pos",
    keywords: ["pos", "sale", "checkout", "register"],
    keywordsAr: ["بيع", "دفع", "كاشير"],
  },
  {
    id: "invoices",
    title: "Invoices",
    titleAr: "الفواتير",
    category: "pages",
    icon: Receipt,
    href: "/invoices",
    keywords: ["invoices", "bills", "receipts", "payments"],
    keywordsAr: ["فواتير", "إيصالات", "مدفوعات"],
  },
  {
    id: "products",
    title: "Products",
    titleAr: "المنتجات",
    category: "pages",
    icon: Package,
    href: "/products",
    keywords: ["products", "items", "merchandise", "inventory"],
    keywordsAr: ["منتجات", "بضائع", "مخزون"],
  },
  {
    id: "campaigns",
    title: "Marketing Campaigns",
    titleAr: "الحملات التسويقية",
    category: "pages",
    icon: Megaphone,
    href: "/marketing/campaigns",
    keywords: ["marketing", "campaigns", "promotions", "ads"],
    keywordsAr: ["تسويق", "حملات", "عروض"],
  },
  {
    id: "loyalty",
    title: "Loyalty Program",
    titleAr: "برنامج الولاء",
    category: "pages",
    icon: Gift,
    href: "/loyalty",
    keywords: ["loyalty", "rewards", "points", "tiers"],
    keywordsAr: ["ولاء", "مكافآت", "نقاط"],
  },

  // Analytics
  {
    id: "analytics",
    title: "Analytics",
    titleAr: "التحليلات",
    category: "pages",
    icon: TrendingUp,
    href: "/analytics",
    keywords: ["analytics", "insights", "data", "metrics"],
    keywordsAr: ["تحليلات", "إحصائيات", "بيانات"],
  },
  {
    id: "reports",
    title: "Reports",
    titleAr: "التقارير",
    category: "pages",
    icon: BarChart3,
    href: "/reports",
    keywords: ["reports", "export", "download", "summary"],
    keywordsAr: ["تقارير", "تصدير", "ملخص"],
  },

  // Team
  {
    id: "employees",
    title: "Employees",
    titleAr: "الموظفين",
    category: "pages",
    icon: UserCog,
    href: "/employees",
    keywords: ["employees", "staff", "team", "workers"],
    keywordsAr: ["موظفين", "فريق", "عاملين"],
  },
  {
    id: "departments",
    title: "Departments",
    titleAr: "الأقسام",
    category: "pages",
    icon: Building,
    href: "/departments",
    keywords: ["departments", "divisions", "teams"],
    keywordsAr: ["أقسام", "إدارات"],
  },

  // Settings
  {
    id: "plans",
    title: "Membership Plans",
    titleAr: "خطط العضوية",
    category: "settings",
    icon: Tag,
    href: "/plans",
    keywords: ["plans", "pricing", "membership", "tiers"],
    keywordsAr: ["خطط", "أسعار", "عضوية"],
  },
  {
    id: "agreements",
    title: "Agreements & Terms",
    titleAr: "الاتفاقيات والشروط",
    category: "settings",
    icon: FileText,
    href: "/settings/agreements",
    keywords: ["agreements", "terms", "conditions", "policy"],
    keywordsAr: ["اتفاقيات", "شروط", "سياسة"],
  },
  {
    id: "access-control",
    title: "Access Control",
    titleAr: "التحكم في الوصول",
    category: "settings",
    icon: Lock,
    href: "/settings/access-control",
    keywords: ["access", "permissions", "roles", "security"],
    keywordsAr: ["صلاحيات", "أدوار", "أمان"],
  },
  {
    id: "compliance",
    title: "Compliance",
    titleAr: "الامتثال",
    category: "settings",
    icon: Shield,
    href: "/settings/compliance",
    keywords: ["compliance", "regulations", "legal", "audit"],
    keywordsAr: ["امتثال", "لوائح", "قانوني"],
  },
  {
    id: "notifications",
    title: "Notifications",
    titleAr: "الإشعارات",
    category: "settings",
    icon: Bell,
    href: "/manage-notifications",
    keywords: ["notifications", "alerts", "messages", "email"],
    keywordsAr: ["إشعارات", "تنبيهات", "رسائل"],
  },
];

// Quick actions that can be performed
export const actionCommands: Command[] = [
  {
    id: "action-new-member",
    title: "Add New Member",
    titleAr: "إضافة عضو جديد",
    description: "Create a new member profile",
    descriptionAr: "إنشاء ملف عضو جديد",
    category: "actions",
    icon: UserPlus,
    href: "/members/new",
    keywords: ["add", "new", "create", "member", "register"],
    keywordsAr: ["إضافة", "جديد", "إنشاء", "عضو", "تسجيل"],
    shortcut: "N",
  },
  {
    id: "action-new-lead",
    title: "Add New Lead",
    titleAr: "إضافة عميل محتمل",
    description: "Create a new sales lead",
    descriptionAr: "إنشاء عميل محتمل جديد",
    category: "actions",
    icon: Plus,
    href: "/leads/new",
    keywords: ["add", "new", "lead", "prospect", "sales"],
    keywordsAr: ["إضافة", "جديد", "عميل", "محتمل"],
  },
  {
    id: "action-quick-checkin",
    title: "Quick Check-in",
    titleAr: "تسجيل دخول سريع",
    description: "Check in a member by phone or ID",
    descriptionAr: "تسجيل دخول عضو برقم الهاتف أو المعرف",
    category: "actions",
    icon: ClipboardCheck,
    href: "/attendance?action=checkin",
    keywords: ["checkin", "check-in", "arrive", "enter"],
    keywordsAr: ["تسجيل", "دخول", "وصول"],
    shortcut: "C",
  },
  {
    id: "action-new-invoice",
    title: "Create Invoice",
    titleAr: "إنشاء فاتورة",
    description: "Generate a new invoice",
    descriptionAr: "إنشاء فاتورة جديدة",
    category: "actions",
    icon: Receipt,
    href: "/invoices/new",
    keywords: ["invoice", "bill", "charge", "payment"],
    keywordsAr: ["فاتورة", "دفع", "حساب"],
  },
  {
    id: "action-search-member",
    title: "Search Members",
    titleAr: "البحث عن الأعضاء",
    description: "Find a member by name, phone, or email",
    descriptionAr: "البحث عن عضو بالاسم أو الهاتف أو البريد",
    category: "actions",
    icon: Search,
    href: "/members?focus=search",
    keywords: ["search", "find", "lookup", "member"],
    keywordsAr: ["بحث", "إيجاد", "عضو"],
    shortcut: "S",
  },
  {
    id: "action-new-class",
    title: "Schedule Class",
    titleAr: "جدولة حصة",
    description: "Add a new class to the schedule",
    descriptionAr: "إضافة حصة جديدة للجدول",
    category: "actions",
    icon: Calendar,
    href: "/classes/new",
    keywords: ["class", "schedule", "session", "add"],
    keywordsAr: ["حصة", "جدول", "جلسة"],
  },
  {
    id: "action-export",
    title: "Export Data",
    titleAr: "تصدير البيانات",
    description: "Export reports and data",
    descriptionAr: "تصدير التقارير والبيانات",
    category: "actions",
    icon: BarChart3,
    href: "/reports?action=export",
    keywords: ["export", "download", "csv", "excel", "report"],
    keywordsAr: ["تصدير", "تحميل", "تقرير"],
    shortcut: "E",
  },
];

// Combine all commands
export const allCommands: Command[] = [...pageCommands, ...actionCommands];

// Fuzzy search function supporting both English and Arabic
export function searchCommands(
  query: string,
  commands: Command[],
  locale: string = "en"
): Command[] {
  if (!query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const isArabic = /[\u0600-\u06FF]/.test(query);

  return commands
    .map((command) => {
      let score = 0;

      // Title match (highest priority)
      const title = isArabic ? command.titleAr : command.title;
      if (title.toLowerCase().includes(normalizedQuery)) {
        score += 100;
        if (title.toLowerCase().startsWith(normalizedQuery)) {
          score += 50;
        }
      }

      // Keywords match
      const keywords = isArabic ? command.keywordsAr : command.keywords;
      for (const keyword of keywords) {
        if (keyword.toLowerCase().includes(normalizedQuery)) {
          score += 30;
          if (keyword.toLowerCase().startsWith(normalizedQuery)) {
            score += 20;
          }
        }
      }

      // Description match
      const description = isArabic
        ? command.descriptionAr
        : command.description;
      if (description?.toLowerCase().includes(normalizedQuery)) {
        score += 10;
      }

      return { command, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ command }) => command);
}

// Get commands grouped by category
export function getGroupedCommands(
  commands: Command[]
): Record<CommandCategory, Command[]> {
  const grouped: Record<CommandCategory, Command[]> = {
    recent: [],
    actions: [],
    pages: [],
    members: [],
    settings: [],
  };

  for (const command of commands) {
    grouped[command.category].push(command);
  }

  return grouped;
}

// Category labels
export const categoryLabels: Record<
  CommandCategory,
  { en: string; ar: string }
> = {
  recent: { en: "Recent", ar: "الأخيرة" },
  actions: { en: "Quick Actions", ar: "إجراءات سريعة" },
  pages: { en: "Pages", ar: "الصفحات" },
  members: { en: "Members", ar: "الأعضاء" },
  settings: { en: "Settings", ar: "الإعدادات" },
};
