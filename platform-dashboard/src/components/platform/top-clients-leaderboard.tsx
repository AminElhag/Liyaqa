import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, Award, Building2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AnimatedCurrency } from "@/components/ui/animated-number";
import type { TopClient } from "@/types";

interface TopClientsLeaderboardProps {
  clients: TopClient[] | undefined;
  isLoading?: boolean;
  maxClients?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const, delay: 0.3 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.4 + i * 0.1, duration: 0.3 },
  }),
};

const barVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { delay: 0.5, duration: 0.6, ease: "easeOut" as const },
  },
};

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-4 w-4 text-amber-500" />;
    case 2:
      return <Medal className="h-4 w-4 text-slate-400" />;
    case 3:
      return <Award className="h-4 w-4 text-amber-700" />;
    default:
      return (
        <span className="text-xs font-medium text-muted-foreground w-4 text-center">
          {rank}
        </span>
      );
  }
}

function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "TRIAL":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "SUSPENDED":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
  }
}

export function TopClientsLeaderboard({
  clients,
  isLoading,
  maxClients = 5,
}: TopClientsLeaderboardProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const isRtl = locale === "ar";

  const texts = {
    title: locale === "ar" ? "أفضل العملاء" : "Top Clients",
    viewAll: locale === "ar" ? "عرض الكل" : "View All",
    revenue: locale === "ar" ? "الإيرادات" : "Revenue",
    invoices: locale === "ar" ? "فواتير" : "invoices",
    noClients: locale === "ar" ? "لا يوجد عملاء بعد" : "No clients yet",
  };

  if (isLoading) {
    return <TopClientsLeaderboardSkeleton />;
  }

  const displayClients = (clients || []).slice(0, maxClients);
  const maxRevenue = Math.max(...displayClients.map((c) => c.totalRevenue), 1);

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Card className="h-full dark:border-neutral-800">
        <CardHeader className={cn("pb-3", isRtl && "text-right")}>
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-lg font-semibold">{texts.title}</CardTitle>
            </div>
            <Link to="/clients">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                {texts.viewAll}
                <ChevronRight className={cn("h-3 w-3", isRtl && "rotate-180")} />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {displayClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Building2 className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">{texts.noClients}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayClients.map((client, index) => {
                const percent = (client.totalRevenue / maxRevenue) * 100;
                const clientName =
                  locale === "ar" && client.organizationNameAr
                    ? client.organizationNameAr
                    : client.organizationNameEn;

                return (
                  <motion.div
                    key={client.organizationId}
                    custom={index}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Link to={`/clients/${client.organizationId}`}>
                      <div
                        className={cn(
                          "group relative rounded-lg p-3 transition-all hover:bg-muted/50 cursor-pointer",
                          "dark:hover:bg-muted/20"
                        )}
                      >
                        {/* Rank + Name + Status */}
                        <div
                          className={cn(
                            "flex items-center gap-3 mb-2",
                            isRtl && "flex-row-reverse"
                          )}
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            {getRankIcon(index + 1)}
                          </div>
                          <div className={cn("flex-1 min-w-0", isRtl && "text-right")}>
                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {clientName}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0.5",
                              getStatusColor(client.subscriptionStatus)
                            )}
                          >
                            {client.subscriptionStatus}
                          </Badge>
                        </div>

                        {/* Revenue Bar */}
                        <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
                          <div className="w-6" /> {/* Spacer for alignment */}
                          <div className="flex-1 relative">
                            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                              <motion.div
                                variants={barVariants}
                                initial="hidden"
                                animate="visible"
                                className={cn(
                                  "h-full rounded-full origin-left",
                                  index === 0
                                    ? "bg-gradient-to-r from-amber-500 to-amber-400"
                                    : index === 1
                                    ? "bg-gradient-to-r from-slate-400 to-slate-300"
                                    : index === 2
                                    ? "bg-gradient-to-r from-amber-700 to-amber-600"
                                    : "bg-gradient-to-r from-blue-500 to-blue-400",
                                  isRtl && "origin-right"
                                )}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                          <div
                            className={cn(
                              "flex flex-col items-end shrink-0 min-w-[80px]",
                              isRtl && "items-start"
                            )}
                          >
                            <span className="font-display text-sm font-bold">
                              <AnimatedCurrency
                                value={client.totalRevenue}
                                currency="SAR"
                                locale={locale === "ar" ? "ar-SA" : "en-SA"}
                                compact
                              />
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {client.invoiceCount} {texts.invoices}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TopClientsLeaderboardSkeleton() {
  return (
    <Card className="h-full dark:border-neutral-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-6 w-28" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-4 w-32 flex-1" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6" />
                <Skeleton className="h-2 flex-1 rounded-full" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { TopClientsLeaderboardSkeleton };
