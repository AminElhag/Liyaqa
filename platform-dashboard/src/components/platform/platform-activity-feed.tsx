import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Building2,
  Handshake,
  CreditCard,
  Receipt,
  UserPlus,
  Settings,
  Bell,
  Filter,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { RecentActivity } from "@/types";

interface PlatformActivityFeedProps {
  activities: RecentActivity[] | undefined;
  isLoading?: boolean;
  maxActivities?: number;
}

type ActivityFilter = "all" | "client" | "deal" | "subscription" | "invoice" | "user";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const, delay: 0.35 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10, height: 0 },
  visible: {
    opacity: 1,
    x: 0,
    height: "auto",
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    x: 10,
    height: 0,
    transition: { duration: 0.2 },
  },
};

interface ActivityConfig {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  labelEn: string;
  labelAr: string;
}

const activityConfigs: Record<string, ActivityConfig> = {
  CLIENT_CREATED: {
    icon: Building2,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    labelEn: "New Client",
    labelAr: "عميل جديد",
  },
  CLIENT_UPDATED: {
    icon: Building2,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    labelEn: "Client Updated",
    labelAr: "تحديث العميل",
  },
  DEAL_CREATED: {
    icon: Handshake,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    labelEn: "New Deal",
    labelAr: "صفقة جديدة",
  },
  DEAL_WON: {
    icon: Handshake,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    labelEn: "Deal Won",
    labelAr: "صفقة مربوحة",
  },
  DEAL_LOST: {
    icon: Handshake,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10 dark:bg-red-500/20",
    labelEn: "Deal Lost",
    labelAr: "صفقة خاسرة",
  },
  SUBSCRIPTION_CREATED: {
    icon: CreditCard,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
    labelEn: "Subscription",
    labelAr: "اشتراك جديد",
  },
  SUBSCRIPTION_RENEWED: {
    icon: CreditCard,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    labelEn: "Renewed",
    labelAr: "تجديد",
  },
  SUBSCRIPTION_CANCELLED: {
    icon: CreditCard,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10 dark:bg-red-500/20",
    labelEn: "Cancelled",
    labelAr: "ملغي",
  },
  INVOICE_CREATED: {
    icon: Receipt,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-500/10 dark:bg-violet-500/20",
    labelEn: "Invoice",
    labelAr: "فاتورة",
  },
  INVOICE_PAID: {
    icon: Receipt,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    labelEn: "Paid",
    labelAr: "مدفوعة",
  },
  USER_CREATED: {
    icon: UserPlus,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
    labelEn: "User Added",
    labelAr: "مستخدم جديد",
  },
  SETTINGS_UPDATED: {
    icon: Settings,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-500/10 dark:bg-slate-500/20",
    labelEn: "Settings",
    labelAr: "الإعدادات",
  },
};

const defaultConfig: ActivityConfig = {
  icon: Activity,
  color: "text-slate-600 dark:text-slate-400",
  bgColor: "bg-slate-500/10 dark:bg-slate-500/20",
  labelEn: "Activity",
  labelAr: "نشاط",
};

function getActivityConfig(type: string): ActivityConfig {
  return activityConfigs[type] || defaultConfig;
}

function getEntityFilter(entityType: string): ActivityFilter {
  const type = entityType.toUpperCase();
  if (type.includes("CLIENT") || type.includes("ORGANIZATION")) return "client";
  if (type.includes("DEAL")) return "deal";
  if (type.includes("SUBSCRIPTION")) return "subscription";
  if (type.includes("INVOICE")) return "invoice";
  if (type.includes("USER")) return "user";
  return "all";
}

function formatTimeAgo(timestamp: string, locale: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (locale === "ar") {
    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString("ar-SA");
  }

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-SA");
}

export function PlatformActivityFeed({
  activities,
  isLoading,
  maxActivities = 8,
}: PlatformActivityFeedProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const isRtl = locale === "ar";
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const texts = {
    title: locale === "ar" ? "النشاط الأخير" : "Recent Activity",
    viewAll: locale === "ar" ? "عرض الكل" : "View All",
    filter: locale === "ar" ? "تصفية" : "Filter",
    all: locale === "ar" ? "الكل" : "All",
    client: locale === "ar" ? "العملاء" : "Clients",
    deal: locale === "ar" ? "الصفقات" : "Deals",
    subscription: locale === "ar" ? "الاشتراكات" : "Subscriptions",
    invoice: locale === "ar" ? "الفواتير" : "Invoices",
    user: locale === "ar" ? "المستخدمين" : "Users",
    noActivity: locale === "ar" ? "لا يوجد نشاط" : "No activity yet",
    by: locale === "ar" ? "بواسطة" : "by",
  };

  const filterOptions: { value: ActivityFilter; label: string }[] = [
    { value: "all", label: texts.all },
    { value: "client", label: texts.client },
    { value: "deal", label: texts.deal },
    { value: "subscription", label: texts.subscription },
    { value: "invoice", label: texts.invoice },
    { value: "user", label: texts.user },
  ];

  if (isLoading) {
    return <PlatformActivityFeedSkeleton />;
  }

  const filteredActivities = (activities || [])
    .filter((a) => filter === "all" || getEntityFilter(a.entityType) === filter)
    .slice(0, maxActivities);

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Card className="dark:border-neutral-800">
        <CardHeader className={cn("pb-3", isRtl && "text-right")}>
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle className="text-lg font-semibold">{texts.title}</CardTitle>
            </div>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Filter className="h-3 w-3" />
                    {filterOptions.find((f) => f.value === filter)?.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRtl ? "start" : "end"}>
                  {filterOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                      className={cn(filter === option.value && "bg-accent")}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link to="/activity">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  {texts.viewAll}
                  <ChevronRight className={cn("h-3 w-3", isRtl && "rotate-180")} />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">{texts.noActivity}</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div
                className={cn(
                  "absolute top-0 bottom-0 w-px bg-border",
                  isRtl ? "right-[18px]" : "left-[18px]"
                )}
              />

              <AnimatePresence mode="popLayout">
                <div className="space-y-1">
                  {filteredActivities.map((activity) => {
                    const config = getActivityConfig(activity.activityType);
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={`${activity.entityId}-${activity.timestamp}`}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                      >
                        <div
                          className={cn(
                            "relative flex items-start gap-3 p-2 rounded-lg transition-colors hover:bg-muted/30",
                            isRtl && "flex-row-reverse"
                          )}
                        >
                          {/* Icon */}
                          <div
                            className={cn(
                              "relative z-10 flex items-center justify-center w-9 h-9 rounded-full border-2 border-background shrink-0",
                              config.bgColor
                            )}
                          >
                            <Icon className={cn("h-4 w-4", config.color)} />
                          </div>

                          {/* Content */}
                          <div className={cn("flex-1 min-w-0 pt-1", isRtl && "text-right")}>
                            <p className="text-sm leading-relaxed">
                              <span className="font-medium">{activity.description}</span>
                            </p>
                            <div
                              className={cn(
                                "flex items-center gap-2 mt-1 text-xs text-muted-foreground",
                                isRtl && "flex-row-reverse"
                              )}
                            >
                              <span>{formatTimeAgo(activity.timestamp, locale)}</span>
                              {activity.userEmail && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                  <span>
                                    {texts.by} {activity.userEmail.split("@")[0]}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Badge */}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 shrink-0",
                              config.bgColor,
                              config.color.replace("text-", "border-").replace("/", "-")
                            )}
                          >
                            {locale === "ar" ? config.labelAr : config.labelEn}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PlatformActivityFeedSkeleton() {
  return (
    <Card className="dark:border-neutral-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-7 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-2">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-4 w-full max-w-[250px]" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { PlatformActivityFeedSkeleton };
