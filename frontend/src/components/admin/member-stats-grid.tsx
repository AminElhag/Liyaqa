"use client";

import {
  Calendar,
  Dumbbell,
  Clock,
  CheckCircle,
  XCircle,
  Infinity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Member } from "@/types/member";
import type { Subscription } from "@/types/member";

interface MemberStatsGridProps {
  member: Member;
  subscriptions: Subscription[] | undefined;
  locale: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconBgClass?: string;
  iconTextClass?: string;
  valueClass?: string;
}

function StatCard({
  icon,
  value,
  label,
  iconBgClass = "bg-primary/10",
  iconTextClass = "text-primary",
  valueClass,
}: StatCardProps) {
  return (
    <div className="group rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
            iconBgClass
          )}
        >
          <div className={iconTextClass}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className={cn("text-2xl font-bold tabular-nums truncate", valueClass)}>
            {value}
          </p>
          <p className="text-sm text-muted-foreground truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function MemberStatsGrid({
  member,
  subscriptions,
  locale,
}: MemberStatsGridProps) {
  // Ensure subscriptions is an array (defensive handling)
  const subscriptionsList = Array.isArray(subscriptions) ? subscriptions : [];

  // Get active subscription
  const activeSubscription = subscriptionsList.find(
    (sub) => sub.status === "ACTIVE" || sub.status === "FROZEN"
  );

  // Calculate days until expiry
  const daysUntilExpiry = activeSubscription
    ? Math.max(0, activeSubscription.daysRemaining)
    : null;

  // Get classes remaining
  const classesRemaining = activeSubscription?.classesRemaining;

  // Format member since date
  const memberSince = new Date(member.createdAt).toLocaleDateString(
    locale === "ar" ? "ar-SA" : "en-US",
    { month: "short", year: "numeric" }
  );

  // Determine expiry urgency color
  const getExpiryColor = (days: number | null) => {
    if (days === null) return { bg: "bg-muted", text: "text-muted-foreground" };
    if (days <= 7) return { bg: "bg-red-50", text: "text-red-600" };
    if (days <= 30) return { bg: "bg-amber-50", text: "text-amber-600" };
    return { bg: "bg-emerald-50", text: "text-emerald-600" };
  };

  const expiryColors = getExpiryColor(daysUntilExpiry);

  const texts = {
    memberSince: locale === "ar" ? "عضو منذ" : "Member Since",
    classesRemaining: locale === "ar" ? "الحصص المتبقية" : "Classes Left",
    daysRemaining: locale === "ar" ? "أيام متبقية" : "Days Left",
    status: locale === "ar" ? "الحالة" : "Status",
    unlimited: locale === "ar" ? "غير محدود" : "Unlimited",
    active: locale === "ar" ? "نشط" : "Active",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
    noSubscription: locale === "ar" ? "لا يوجد" : "None",
  };

  const isActive = member.status === "ACTIVE";

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {/* Member Since */}
      <StatCard
        icon={<Calendar className="h-6 w-6" />}
        value={memberSince}
        label={texts.memberSince}
        iconBgClass="bg-blue-50"
        iconTextClass="text-blue-600"
      />

      {/* Classes Remaining */}
      <StatCard
        icon={
          classesRemaining === undefined ? (
            <Infinity className="h-6 w-6" />
          ) : (
            <Dumbbell className="h-6 w-6" />
          )
        }
        value={
          classesRemaining === undefined
            ? texts.unlimited
            : classesRemaining ?? texts.noSubscription
        }
        label={texts.classesRemaining}
        iconBgClass="bg-violet-50"
        iconTextClass="text-violet-600"
      />

      {/* Days Until Expiry */}
      <StatCard
        icon={<Clock className="h-6 w-6" />}
        value={daysUntilExpiry ?? texts.noSubscription}
        label={texts.daysRemaining}
        iconBgClass={expiryColors.bg}
        iconTextClass={expiryColors.text}
        valueClass={daysUntilExpiry !== null ? expiryColors.text : undefined}
      />

      {/* Status */}
      <StatCard
        icon={
          isActive ? (
            <CheckCircle className="h-6 w-6" />
          ) : (
            <XCircle className="h-6 w-6" />
          )
        }
        value={isActive ? texts.active : texts.inactive}
        label={texts.status}
        iconBgClass={isActive ? "bg-emerald-50" : "bg-red-50"}
        iconTextClass={isActive ? "text-emerald-600" : "text-red-600"}
        valueClass={isActive ? "text-emerald-600" : "text-red-600"}
      />
    </div>
  );
}
