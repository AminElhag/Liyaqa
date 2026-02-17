"use client";

import { useLocale } from "next-intl";
import { RefreshCw, Package, Ticket, Clock } from "lucide-react";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { cn } from "@liyaqa/shared/utils";
import type { MembershipPlanType } from "@liyaqa/shared/types/member";

interface PlanTypeOption {
  type: MembershipPlanType;
  icon: typeof RefreshCw;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

const PLAN_TYPES: PlanTypeOption[] = [
  {
    type: "RECURRING",
    icon: RefreshCw,
    labelEn: "Recurring",
    labelAr: "متكرر",
    descriptionEn: "Standard membership with auto-renewal (monthly, quarterly, yearly)",
    descriptionAr: "عضوية قياسية مع تجديد تلقائي (شهري، ربع سنوي، سنوي)",
  },
  {
    type: "CLASS_PACK",
    icon: Package,
    labelEn: "Class Pack",
    labelAr: "باقة حصص",
    descriptionEn: "Pre-purchased sessions, no renewal. E.g. \"10-Class Pack\"",
    descriptionAr: "حصص مدفوعة مسبقاً، بدون تجديد. مثال: \"باقة 10 حصص\"",
  },
  {
    type: "DAY_PASS",
    icon: Ticket,
    labelEn: "Day Pass",
    labelAr: "تذكرة يومية",
    descriptionEn: "Single-visit access, no commitment",
    descriptionAr: "زيارة واحدة، بدون التزام",
  },
  {
    type: "TRIAL",
    icon: Clock,
    labelEn: "Trial",
    labelAr: "تجربة",
    descriptionEn: "Time-limited trial (7-14 days), converts to recurring",
    descriptionAr: "تجربة محدودة المدة (7-14 يوم)، تتحول إلى متكرر",
  },
];

interface PlanTypeSelectorProps {
  onSelect: (type: MembershipPlanType) => void;
}

export function PlanTypeSelector({ onSelect }: PlanTypeSelectorProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">
          {isAr ? "اختر نوع الباقة" : "Choose Plan Type"}
        </h2>
        <p className="text-muted-foreground mt-1">
          {isAr
            ? "حدد نوع باقة العضوية التي تريد إنشاءها"
            : "Select the type of membership plan you want to create"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLAN_TYPES.map(({ type, icon: Icon, labelEn, labelAr, descriptionEn, descriptionAr }) => (
          <Card
            key={type}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
              "group"
            )}
            onClick={() => onSelect(type)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">
                    {isAr ? labelAr : labelEn}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isAr ? descriptionAr : descriptionEn}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
