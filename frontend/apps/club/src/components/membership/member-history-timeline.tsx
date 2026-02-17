"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Plus,
  Snowflake,
  Sun,
  XCircle,
  RefreshCcw,
  Shuffle,
  CreditCard,
  Edit,
  Clock,
  User,
  UserCheck,
  Camera,
  Heart,
  Settings,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  Wallet,
  FileText,
  LogIn,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  StickyNote,
  CheckSquare,
  Upload,
  FileSignature,
  Footprints,
  Award,
  Gift,
  Eye,
  Cog,
  ChevronDown,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { useMemberActivities } from "@liyaqa/shared/queries/use-members";
import { formatDate } from "@liyaqa/shared/utils";
import type { UUID } from "@liyaqa/shared/types/api";
import type {
  MemberActivityType,
  MemberActivityCategory,
} from "@liyaqa/shared/types/member";

interface MemberHistoryTimelineProps {
  memberId: UUID;
}

const CATEGORY_TYPES: Record<MemberActivityCategory, MemberActivityType[]> = {
  membership: [
    "SUBSCRIPTION_CREATED",
    "SUBSCRIPTION_RENEWED",
    "SUBSCRIPTION_FROZEN",
    "SUBSCRIPTION_UNFROZEN",
    "SUBSCRIPTION_CANCELLED",
    "SUBSCRIPTION_EXPIRED",
    "SUBSCRIPTION_UPGRADED",
    "SUBSCRIPTION_DOWNGRADED",
    "STATUS_CHANGED",
  ],
  profile: [
    "PROFILE_UPDATED",
    "PHOTO_UPDATED",
    "HEALTH_INFO_UPDATED",
    "PREFERENCES_UPDATED",
    "PROFILE_VIEWED",
  ],
  financial: [
    "PAYMENT_RECEIVED",
    "PAYMENT_FAILED",
    "REFUND_ISSUED",
    "WALLET_CREDITED",
    "WALLET_DEBITED",
    "INVOICE_CREATED",
  ],
  access: ["CHECK_IN", "CHECK_OUT"],
  communication: ["EMAIL_SENT", "SMS_SENT", "WHATSAPP_SENT", "CALL_LOGGED"],
  staff: ["NOTE_ADDED", "TASK_CREATED", "TASK_COMPLETED", "DOCUMENT_UPLOADED"],
  system: [
    "SYSTEM_ACTION",
    "MEMBER_CREATED",
    "AGREEMENT_SIGNED",
    "CONTRACT_SIGNED",
    "CONTRACT_TERMINATED",
    "ONBOARDING_STEP_COMPLETED",
    "ONBOARDING_COMPLETED",
    "REFERRAL_MADE",
    "REFERRAL_REWARD_EARNED",
  ],
};

function getCategory(type: MemberActivityType): MemberActivityCategory {
  for (const [cat, types] of Object.entries(CATEGORY_TYPES)) {
    if (types.includes(type)) return cat as MemberActivityCategory;
  }
  return "system";
}

const categoryLabels: Record<
  MemberActivityCategory,
  { en: string; ar: string; color: string }
> = {
  membership: { en: "Membership", ar: "العضوية", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  profile: { en: "Profile", ar: "الملف الشخصي", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  financial: { en: "Financial", ar: "مالي", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  access: { en: "Access", ar: "الدخول", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  communication: { en: "Communication", ar: "التواصل", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300" },
  staff: { en: "Staff", ar: "الموظفين", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  system: { en: "System", ar: "النظام", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" },
};

const activityIcons: Record<MemberActivityType, React.ReactNode> = {
  STATUS_CHANGED: <Settings className="h-3.5 w-3.5" />,
  SUBSCRIPTION_CREATED: <Plus className="h-3.5 w-3.5" />,
  SUBSCRIPTION_RENEWED: <RefreshCcw className="h-3.5 w-3.5" />,
  SUBSCRIPTION_FROZEN: <Snowflake className="h-3.5 w-3.5" />,
  SUBSCRIPTION_UNFROZEN: <Sun className="h-3.5 w-3.5" />,
  SUBSCRIPTION_CANCELLED: <XCircle className="h-3.5 w-3.5" />,
  SUBSCRIPTION_EXPIRED: <Clock className="h-3.5 w-3.5" />,
  SUBSCRIPTION_UPGRADED: <Plus className="h-3.5 w-3.5" />,
  SUBSCRIPTION_DOWNGRADED: <ChevronDown className="h-3.5 w-3.5" />,
  PROFILE_UPDATED: <Edit className="h-3.5 w-3.5" />,
  PHOTO_UPDATED: <Camera className="h-3.5 w-3.5" />,
  HEALTH_INFO_UPDATED: <Heart className="h-3.5 w-3.5" />,
  PREFERENCES_UPDATED: <Settings className="h-3.5 w-3.5" />,
  PAYMENT_RECEIVED: <DollarSign className="h-3.5 w-3.5" />,
  PAYMENT_FAILED: <AlertTriangle className="h-3.5 w-3.5" />,
  REFUND_ISSUED: <RotateCcw className="h-3.5 w-3.5" />,
  WALLET_CREDITED: <Wallet className="h-3.5 w-3.5" />,
  WALLET_DEBITED: <Wallet className="h-3.5 w-3.5" />,
  INVOICE_CREATED: <FileText className="h-3.5 w-3.5" />,
  CHECK_IN: <LogIn className="h-3.5 w-3.5" />,
  CHECK_OUT: <LogOut className="h-3.5 w-3.5" />,
  EMAIL_SENT: <Mail className="h-3.5 w-3.5" />,
  SMS_SENT: <MessageSquare className="h-3.5 w-3.5" />,
  WHATSAPP_SENT: <MessageSquare className="h-3.5 w-3.5" />,
  CALL_LOGGED: <Phone className="h-3.5 w-3.5" />,
  NOTE_ADDED: <StickyNote className="h-3.5 w-3.5" />,
  TASK_CREATED: <CheckSquare className="h-3.5 w-3.5" />,
  TASK_COMPLETED: <CheckSquare className="h-3.5 w-3.5" />,
  DOCUMENT_UPLOADED: <Upload className="h-3.5 w-3.5" />,
  CONTRACT_SIGNED: <FileSignature className="h-3.5 w-3.5" />,
  CONTRACT_TERMINATED: <XCircle className="h-3.5 w-3.5" />,
  ONBOARDING_STEP_COMPLETED: <Footprints className="h-3.5 w-3.5" />,
  ONBOARDING_COMPLETED: <UserCheck className="h-3.5 w-3.5" />,
  REFERRAL_MADE: <Shuffle className="h-3.5 w-3.5" />,
  REFERRAL_REWARD_EARNED: <Gift className="h-3.5 w-3.5" />,
  PROFILE_VIEWED: <Eye className="h-3.5 w-3.5" />,
  SYSTEM_ACTION: <Cog className="h-3.5 w-3.5" />,
  MEMBER_CREATED: <User className="h-3.5 w-3.5" />,
  AGREEMENT_SIGNED: <FileSignature className="h-3.5 w-3.5" />,
};

const activityDotColors: Record<MemberActivityType, string> = {
  STATUS_CHANGED: "bg-amber-500",
  SUBSCRIPTION_CREATED: "bg-emerald-500",
  SUBSCRIPTION_RENEWED: "bg-primary",
  SUBSCRIPTION_FROZEN: "bg-blue-500",
  SUBSCRIPTION_UNFROZEN: "bg-yellow-500",
  SUBSCRIPTION_CANCELLED: "bg-red-500",
  SUBSCRIPTION_EXPIRED: "bg-gray-500",
  SUBSCRIPTION_UPGRADED: "bg-emerald-500",
  SUBSCRIPTION_DOWNGRADED: "bg-orange-500",
  PROFILE_UPDATED: "bg-purple-500",
  PHOTO_UPDATED: "bg-purple-500",
  HEALTH_INFO_UPDATED: "bg-purple-500",
  PREFERENCES_UPDATED: "bg-purple-500",
  PAYMENT_RECEIVED: "bg-emerald-500",
  PAYMENT_FAILED: "bg-red-500",
  REFUND_ISSUED: "bg-orange-500",
  WALLET_CREDITED: "bg-emerald-500",
  WALLET_DEBITED: "bg-amber-500",
  INVOICE_CREATED: "bg-blue-500",
  CHECK_IN: "bg-emerald-500",
  CHECK_OUT: "bg-amber-500",
  EMAIL_SENT: "bg-cyan-500",
  SMS_SENT: "bg-cyan-500",
  WHATSAPP_SENT: "bg-cyan-500",
  CALL_LOGGED: "bg-cyan-500",
  NOTE_ADDED: "bg-orange-500",
  TASK_CREATED: "bg-orange-500",
  TASK_COMPLETED: "bg-emerald-500",
  DOCUMENT_UPLOADED: "bg-orange-500",
  CONTRACT_SIGNED: "bg-gray-500",
  CONTRACT_TERMINATED: "bg-red-500",
  ONBOARDING_STEP_COMPLETED: "bg-gray-500",
  ONBOARDING_COMPLETED: "bg-emerald-500",
  REFERRAL_MADE: "bg-violet-500",
  REFERRAL_REWARD_EARNED: "bg-violet-500",
  PROFILE_VIEWED: "bg-gray-400",
  SYSTEM_ACTION: "bg-gray-500",
  MEMBER_CREATED: "bg-emerald-500",
  AGREEMENT_SIGNED: "bg-gray-500",
};

const PAGE_SIZE = 20;

export function MemberHistoryTimeline({
  memberId,
}: MemberHistoryTimelineProps) {
  const locale = useLocale();
  const [categoryFilter, setCategoryFilter] = useState<
    MemberActivityCategory | "all"
  >("all");
  const [page, setPage] = useState(0);

  const typesFilter =
    categoryFilter !== "all" ? CATEGORY_TYPES[categoryFilter] : undefined;

  const { data, isLoading } = useMemberActivities(memberId, {
    types: typesFilter,
    page,
    size: PAGE_SIZE,
  });

  const activities = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const texts = {
    title: locale === "ar" ? "سجل العضو" : "Member History",
    noHistory: locale === "ar"
      ? "لا يوجد سجل للأحداث بعد"
      : "No activity history yet",
    noHistoryHint: locale === "ar"
      ? "ستظهر الأحداث هنا عندما تحدث تغييرات"
      : "Events will appear here as changes occur",
    employee: locale === "ar" ? "الموظف" : "Employee",
    system: locale === "ar" ? "النظام" : "System",
    allCategories: locale === "ar" ? "جميع الفئات" : "All Categories",
    filterBy: locale === "ar" ? "تصفية حسب" : "Filter by",
    loadMore: locale === "ar" ? "تحميل المزيد" : "Load More",
    showing: locale === "ar" ? "عرض" : "Showing",
    of: locale === "ar" ? "من" : "of",
    previous: locale === "ar" ? "السابق" : "Previous",
    next: locale === "ar" ? "التالي" : "Next",
  };

  if (isLoading && page === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            {texts.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-6 w-6 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          {texts.title}
          {totalElements > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({totalElements})
            </span>
          )}
        </CardTitle>

        {/* Category filter */}
        <Select
          value={categoryFilter}
          onValueChange={(val) => {
            setCategoryFilter(val as MemberActivityCategory | "all");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 me-2 shrink-0" />
            <SelectValue placeholder={texts.allCategories} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{texts.allCategories}</SelectItem>
            {(Object.keys(categoryLabels) as MemberActivityCategory[]).map(
              (cat) => (
                <SelectItem key={cat} value={cat}>
                  {locale === "ar"
                    ? categoryLabels[cat].ar
                    : categoryLabels[cat].en}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {activities.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
            <p className="text-muted-foreground">{texts.noHistory}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {texts.noHistoryHint}
            </p>
          </div>
        ) : (
          <>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute start-3 top-2 bottom-2 w-px bg-border" />

              <div className="space-y-4">
                {activities.map((activity) => {
                  const cat = getCategory(activity.activityType);
                  const catInfo = categoryLabels[cat];
                  const icon =
                    activityIcons[activity.activityType] ??
                    <Cog className="h-3.5 w-3.5" />;
                  const dotColor =
                    activityDotColors[activity.activityType] ?? "bg-gray-500";

                  return (
                    <div
                      key={activity.id}
                      className="relative flex gap-4 ps-0"
                    >
                      {/* Dot */}
                      <div
                        className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${dotColor} text-white`}
                      >
                        {icon}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 pb-1">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="text-sm font-medium">
                            {activity.title}
                          </p>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 shrink-0 ${catInfo.color}`}
                          >
                            {locale === "ar" ? catInfo.ar : catInfo.en}
                          </Badge>
                        </div>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{formatDate(activity.createdAt, locale)}</span>
                          <span className="text-muted-foreground/50">
                            &middot;
                          </span>
                          <span>
                            {activity.performedByName ?? texts.system}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  {texts.showing} {page * PAGE_SIZE + 1}-
                  {Math.min((page + 1) * PAGE_SIZE, totalElements)} {texts.of}{" "}
                  {totalElements}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0 || isLoading}
                  >
                    {texts.previous}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1 || isLoading}
                  >
                    {texts.next}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
