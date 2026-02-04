"use client";

import { useLocale } from "next-intl";
import {
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@liyaqa/shared/components/ui/tooltip";
import type { Lead, LeadActivityType } from "@liyaqa/shared/types/lead";

interface LeadQuickActionsProps {
  lead: Lead;
  onLogActivity: (type: LeadActivityType) => void;
  onScheduleTour?: () => void;
  onOpenLogDialog: () => void;
  isLoading?: boolean;
}

export function LeadQuickActions({
  lead,
  onLogActivity,
  onScheduleTour,
  onOpenLogDialog,
  isLoading,
}: LeadQuickActionsProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const quickActions = [
    {
      type: "CALL" as LeadActivityType,
      icon: Phone,
      label: isArabic ? "تسجيل مكالمة" : "Log Call",
      onClick: () => onLogActivity("CALL"),
      href: lead.phone ? `tel:${lead.phone}` : undefined,
    },
    {
      type: "EMAIL" as LeadActivityType,
      icon: Mail,
      label: isArabic ? "تسجيل بريد" : "Log Email",
      onClick: () => onLogActivity("EMAIL"),
      href: `mailto:${lead.email}`,
    },
    {
      type: "WHATSAPP" as LeadActivityType,
      icon: MessageCircle,
      label: isArabic ? "تسجيل واتساب" : "Log WhatsApp",
      onClick: () => onLogActivity("WHATSAPP"),
      href: lead.phone ? `https://wa.me/${lead.phone.replace(/\D/g, "")}` : undefined,
    },
  ];

  const showScheduleTour = lead.status === "CONTACTED" && onScheduleTour;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {quickActions.map((action) => (
          <Tooltip key={action.type}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (action.href) {
                    window.open(action.href, "_blank");
                  }
                  action.onClick();
                }}
                disabled={isLoading || (action.type === "CALL" && !lead.phone) || (action.type === "WHATSAPP" && !lead.phone)}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <action.icon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{action.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {showScheduleTour && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onScheduleTour}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isArabic ? "جدولة جولة" : "Schedule Tour"}</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="icon"
              onClick={onOpenLogDialog}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isArabic ? "تسجيل نشاط جديد" : "Log New Activity"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
