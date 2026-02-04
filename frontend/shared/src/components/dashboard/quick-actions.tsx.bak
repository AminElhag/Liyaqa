"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserPlus,
  Receipt,
  CalendarPlus,
  FileDown,
  Bell,
  ScanLine,
  Gift,
  Megaphone,
  CheckSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";

interface QuickAction {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
  shortcut?: string;
}

const ACTIONS: QuickAction[] = [
  {
    id: "check-in",
    labelEn: "Quick Check-in",
    labelAr: "تسجيل سريع",
    icon: ScanLine,
    href: "/attendance",
    color: "text-sky-600",
    bgColor: "bg-sky-500/10 hover:bg-sky-500/20",
    shortcut: "C",
  },
  {
    id: "new-member",
    labelEn: "New Member",
    labelAr: "عضو جديد",
    icon: UserPlus,
    href: "/members/new",
    color: "text-green-600",
    bgColor: "bg-green-500/10 hover:bg-green-500/20",
    shortcut: "N",
  },
  {
    id: "invoice",
    labelEn: "Create Invoice",
    labelAr: "إنشاء فاتورة",
    icon: Receipt,
    href: "/invoices/new",
    color: "text-amber-600",
    bgColor: "bg-amber-500/10 hover:bg-amber-500/20",
    shortcut: "I",
  },
  {
    id: "class",
    labelEn: "Schedule Class",
    labelAr: "جدولة حصة",
    icon: CalendarPlus,
    href: "/classes",
    color: "text-purple-600",
    bgColor: "bg-purple-500/10 hover:bg-purple-500/20",
    shortcut: "S",
  },
  {
    id: "export",
    labelEn: "Export Report",
    labelAr: "تصدير تقرير",
    icon: FileDown,
    href: "/reports",
    color: "text-rose-600",
    bgColor: "bg-rose-500/10 hover:bg-rose-500/20",
    shortcut: "E",
  },
  {
    id: "notify",
    labelEn: "Send Notification",
    labelAr: "إرسال إشعار",
    icon: Bell,
    href: "/manage-notifications",
    color: "text-teal-600",
    bgColor: "bg-teal-500/10 hover:bg-teal-500/20",
    shortcut: "M",
  },
  {
    id: "campaign",
    labelEn: "New Campaign",
    labelAr: "حملة جديدة",
    icon: Megaphone,
    href: "/marketing/campaigns/new",
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10 hover:bg-indigo-500/20",
  },
  {
    id: "loyalty",
    labelEn: "Award Points",
    labelAr: "منح نقاط",
    icon: Gift,
    href: "/loyalty",
    color: "text-pink-600",
    bgColor: "bg-pink-500/10 hover:bg-pink-500/20",
  },
  {
    id: "tasks",
    labelEn: "My Tasks",
    labelAr: "مهامي",
    icon: CheckSquare,
    href: "/tasks",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10 hover:bg-orange-500/20",
    shortcut: "T",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const, delay: 0.25 },
  },
};

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

export function QuickActions() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    title: locale === "ar" ? "إجراءات سريعة" : "Quick Actions",
  };

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader className={cn("pb-3", isRtl && "text-right")}>
          <CardTitle className="text-lg font-semibold">{texts.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ACTIONS.map((action) => (
              <QuickActionButton
                key={action.id}
                action={action}
                locale={locale}
                isRtl={isRtl}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface QuickActionButtonProps {
  action: QuickAction;
  locale: string;
  isRtl: boolean;
}

function QuickActionButton({ action, locale, isRtl }: QuickActionButtonProps) {
  const Icon = action.icon;
  const label = locale === "ar" ? action.labelAr : action.labelEn;

  return (
    <Link href={`/${locale}${action.href}`}>
      <motion.div
        variants={buttonVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 p-4 rounded-md3-md transition-colors cursor-pointer",
          "md3-state-layer min-h-touch-target",
          action.bgColor
        )}
      >
        <Icon className={cn("h-5 w-5", action.color)} />
        <span className="text-xs font-medium text-center leading-tight">{label}</span>

        {/* Keyboard shortcut hint */}
        {action.shortcut && (
          <div className={cn(
            "absolute top-1 text-[10px] font-mono text-muted-foreground/50",
            isRtl ? "left-1.5" : "right-1.5"
          )}>
            {action.shortcut}
          </div>
        )}
      </motion.div>
    </Link>
  );
}

export { ACTIONS as QUICK_ACTIONS };
