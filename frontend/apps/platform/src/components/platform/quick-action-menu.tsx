"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Send,
  Phone,
  Mail,
  FileText,
  Users,
  TrendingUp,
  CreditCard,
  Eye,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { cn } from "@liyaqa/shared/utils";

/**
 * Quick action types
 */
export type QuickActionType =
  | "VIEW_DETAILS"
  | "SEND_EMAIL"
  | "SEND_SMS"
  | "SCHEDULE_CALL"
  | "CREATE_NOTE"
  | "CREATE_TICKET"
  | "ASSIGN_CSM"
  | "SHOW_UPGRADE_OPTIONS"
  | "SEND_PAYMENT_LINK"
  | "RETRY_PAYMENT"
  | "SEND_REMINDER"
  | "VIEW_HEALTH";

/**
 * Action configuration
 */
interface ActionConfig {
  type: QuickActionType;
  labelEn: string;
  labelAr: string;
  icon: React.ReactNode;
  variant?: "default" | "destructive";
  group?: "communication" | "management" | "payment" | "navigation";
}

/**
 * Available actions by context
 */
const ACTION_CONFIG: Record<QuickActionType, ActionConfig> = {
  VIEW_DETAILS: {
    type: "VIEW_DETAILS",
    labelEn: "View Details",
    labelAr: "عرض التفاصيل",
    icon: <Eye className="h-4 w-4" />,
    group: "navigation",
  },
  SEND_EMAIL: {
    type: "SEND_EMAIL",
    labelEn: "Send Email",
    labelAr: "إرسال بريد إلكتروني",
    icon: <Mail className="h-4 w-4" />,
    group: "communication",
  },
  SEND_SMS: {
    type: "SEND_SMS",
    labelEn: "Send SMS",
    labelAr: "إرسال رسالة نصية",
    icon: <MessageSquare className="h-4 w-4" />,
    group: "communication",
  },
  SCHEDULE_CALL: {
    type: "SCHEDULE_CALL",
    labelEn: "Schedule Call",
    labelAr: "جدولة مكالمة",
    icon: <Phone className="h-4 w-4" />,
    group: "communication",
  },
  CREATE_NOTE: {
    type: "CREATE_NOTE",
    labelEn: "Add Note",
    labelAr: "إضافة ملاحظة",
    icon: <FileText className="h-4 w-4" />,
    group: "management",
  },
  CREATE_TICKET: {
    type: "CREATE_TICKET",
    labelEn: "Create Ticket",
    labelAr: "إنشاء تذكرة",
    icon: <AlertTriangle className="h-4 w-4" />,
    group: "management",
  },
  ASSIGN_CSM: {
    type: "ASSIGN_CSM",
    labelEn: "Assign CSM",
    labelAr: "تعيين مدير نجاح",
    icon: <Users className="h-4 w-4" />,
    group: "management",
  },
  SHOW_UPGRADE_OPTIONS: {
    type: "SHOW_UPGRADE_OPTIONS",
    labelEn: "Upgrade Options",
    labelAr: "خيارات الترقية",
    icon: <TrendingUp className="h-4 w-4" />,
    group: "management",
  },
  SEND_PAYMENT_LINK: {
    type: "SEND_PAYMENT_LINK",
    labelEn: "Send Payment Link",
    labelAr: "إرسال رابط الدفع",
    icon: <CreditCard className="h-4 w-4" />,
    group: "payment",
  },
  RETRY_PAYMENT: {
    type: "RETRY_PAYMENT",
    labelEn: "Retry Payment",
    labelAr: "إعادة محاولة الدفع",
    icon: <RefreshCw className="h-4 w-4" />,
    group: "payment",
  },
  SEND_REMINDER: {
    type: "SEND_REMINDER",
    labelEn: "Send Reminder",
    labelAr: "إرسال تذكير",
    icon: <Send className="h-4 w-4" />,
    group: "communication",
  },
  VIEW_HEALTH: {
    type: "VIEW_HEALTH",
    labelEn: "View Health",
    labelAr: "عرض الصحة",
    icon: <Calendar className="h-4 w-4" />,
    group: "navigation",
  },
};

/**
 * Context type for determining available actions
 */
export type ActionContext =
  | "client"
  | "onboarding"
  | "at_risk"
  | "dunning"
  | "trial"
  | "support";

/**
 * Actions by context
 */
const CONTEXT_ACTIONS: Record<ActionContext, QuickActionType[]> = {
  client: [
    "VIEW_DETAILS",
    "SEND_EMAIL",
    "SCHEDULE_CALL",
    "CREATE_NOTE",
    "ASSIGN_CSM",
    "VIEW_HEALTH",
  ],
  onboarding: [
    "VIEW_DETAILS",
    "SEND_REMINDER",
    "SCHEDULE_CALL",
    "CREATE_NOTE",
  ],
  at_risk: [
    "VIEW_DETAILS",
    "VIEW_HEALTH",
    "SCHEDULE_CALL",
    "ASSIGN_CSM",
    "CREATE_TICKET",
    "SEND_EMAIL",
  ],
  dunning: [
    "VIEW_DETAILS",
    "SEND_PAYMENT_LINK",
    "RETRY_PAYMENT",
    "SCHEDULE_CALL",
    "ASSIGN_CSM",
  ],
  trial: [
    "VIEW_DETAILS",
    "SCHEDULE_CALL",
    "SEND_EMAIL",
    "SHOW_UPGRADE_OPTIONS",
  ],
  support: [
    "VIEW_DETAILS",
    "CREATE_TICKET",
    "SCHEDULE_CALL",
    "SEND_EMAIL",
    "ASSIGN_CSM",
  ],
};

/**
 * Props for QuickActionMenu
 */
interface QuickActionMenuProps {
  context: ActionContext;
  entityId: string;
  entityType?: string;
  customActions?: QuickActionType[];
  onAction?: (actionType: QuickActionType, entityId: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  align?: "start" | "center" | "end";
}

/**
 * QuickActionMenu Component
 * Reusable dropdown menu for quick actions based on context.
 */
export function QuickActionMenu({
  context,
  entityId,
  entityType,
  customActions,
  onAction,
  disabled,
  className,
  triggerClassName,
  align = "end",
}: QuickActionMenuProps) {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const [loadingAction, setLoadingAction] = useState<QuickActionType | null>(null);

  const texts = {
    actions: isRtl ? "الإجراءات" : "Actions",
    communication: isRtl ? "التواصل" : "Communication",
    management: isRtl ? "الإدارة" : "Management",
    payment: isRtl ? "الدفع" : "Payment",
  };

  // Get available actions
  const availableActions = customActions ?? CONTEXT_ACTIONS[context] ?? [];

  const handleAction = async (actionType: QuickActionType) => {
    // Handle navigation actions directly
    if (actionType === "VIEW_DETAILS") {
      router.push(`/${locale}/platform/clients/${entityId}`);
      return;
    }
    if (actionType === "VIEW_HEALTH") {
      router.push(`/${locale}/platform/clients/${entityId}/health`);
      return;
    }

    // Call external handler
    if (onAction) {
      setLoadingAction(actionType);
      try {
        await onAction(actionType, entityId);
      } finally {
        setLoadingAction(null);
      }
    }
  };

  // Group actions
  const groupedActions = availableActions.reduce(
    (acc, actionType) => {
      const config = ACTION_CONFIG[actionType];
      const group = config.group || "management";
      if (!acc[group]) acc[group] = [];
      acc[group].push(config);
      return acc;
    },
    {} as Record<string, ActionConfig[]>
  );

  const groupOrder = ["navigation", "communication", "management", "payment"];
  const groupLabels: Record<string, string> = {
    navigation: texts.actions,
    communication: texts.communication,
    management: texts.management,
    payment: texts.payment,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", triggerClassName)}
          disabled={disabled}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{texts.actions}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={cn("w-56", className)}
      >
        {groupOrder.map((group, groupIndex) => {
          const actions = groupedActions[group];
          if (!actions || actions.length === 0) return null;

          return (
            <div key={group}>
              {groupIndex > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className={isRtl ? "text-right" : ""}>
                {groupLabels[group]}
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {actions.map((action) => (
                  <DropdownMenuItem
                    key={action.type}
                    onClick={() => handleAction(action.type)}
                    disabled={loadingAction === action.type}
                    className={cn(
                      "cursor-pointer",
                      isRtl && "flex-row-reverse",
                      action.variant === "destructive" && "text-destructive"
                    )}
                  >
                    {loadingAction === action.type ? (
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    ) : (
                      <span className="me-2">{action.icon}</span>
                    )}
                    <span>{isRtl ? action.labelAr : action.labelEn}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default QuickActionMenu;
