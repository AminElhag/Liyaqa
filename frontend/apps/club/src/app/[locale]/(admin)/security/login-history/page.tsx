"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLoginHistory,
  getSuspiciousAttempts,
  getLoginStats,
  acknowledgeSuspiciousLogin,
  type LoginAttempt,
  LoginAttemptType,
} from "@liyaqa/shared/lib/api/login-history";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@liyaqa/shared/components/ui/table";
import {
  Monitor,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Shield,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";

export default function LoginHistoryPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(0);
  const pageSize = 20;

  // Fetch login history
  const { data: loginHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["loginHistory", page],
    queryFn: () => getLoginHistory(page, pageSize),
  });

  // Fetch suspicious attempts
  const { data: suspiciousAttempts, isLoading: suspiciousLoading } = useQuery({
    queryKey: ["suspiciousAttempts", page],
    queryFn: () => getSuspiciousAttempts(page, pageSize),
  });

  // Fetch login stats
  const { data: stats } = useQuery({
    queryKey: ["loginStats"],
    queryFn: getLoginStats,
  });

  // Acknowledge suspicious login mutation
  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeSuspiciousLogin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suspiciousAttempts"] });
      queryClient.invalidateQueries({ queryKey: ["loginHistory"] });
      queryClient.invalidateQueries({ queryKey: ["loginStats"] });
      toast({
        title: locale === "ar" ? "تم التأكيد" : "Acknowledged",
        description:
          locale === "ar"
            ? "تم تأكيد محاولة تسجيل الدخول"
            : "Login attempt acknowledged",
      });
    },
    onError: () => {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل تأكيد محاولة تسجيل الدخول"
            : "Failed to acknowledge login attempt",
        variant: "destructive",
      });
    },
  });

  const getAttemptTypeBadge = (type: LoginAttemptType) => {
    switch (type) {
      case LoginAttemptType.SUCCESS:
      case LoginAttemptType.MFA_SUCCESS:
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 me-1" />
            {locale === "ar" ? "نجح" : "Success"}
          </Badge>
        );
      case LoginAttemptType.FAILED:
      case LoginAttemptType.MFA_FAILED:
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 me-1" />
            {locale === "ar" ? "فشل" : "Failed"}
          </Badge>
        );
      case LoginAttemptType.LOCKED:
        return (
          <Badge variant="destructive">
            <Shield className="h-3 w-3 me-1" />
            {locale === "ar" ? "محظور" : "Locked"}
          </Badge>
        );
      case LoginAttemptType.MFA_REQUIRED:
        return (
          <Badge variant="secondary">
            <Shield className="h-3 w-3 me-1" />
            {locale === "ar" ? "مطلوب MFA" : "MFA Required"}
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getDeviceIcon = (deviceName: string | null) => {
    const name = deviceName?.toLowerCase() || "";
    if (name.includes("mobile") || name.includes("phone")) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const renderLoginHistoryTable = (attempts: LoginAttempt[] | undefined) => {
    if (!attempts || attempts.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {locale === "ar"
            ? "لا توجد محاولات تسجيل دخول"
            : "No login attempts found"}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              {locale === "ar" ? "التاريخ والوقت" : "Date & Time"}
            </TableHead>
            <TableHead>{locale === "ar" ? "الجهاز" : "Device"}</TableHead>
            <TableHead>{locale === "ar" ? "الموقع" : "Location"}</TableHead>
            <TableHead>
              {locale === "ar" ? "عنوان IP" : "IP Address"}
            </TableHead>
            <TableHead>{locale === "ar" ? "الحالة" : "Status"}</TableHead>
            <TableHead>{locale === "ar" ? "الإجراءات" : "Actions"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.map((attempt) => (
            <TableRow
              key={attempt.id}
              className={
                attempt.flaggedAsSuspicious ? "bg-red-50 dark:bg-red-950/20" : ""
              }
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">
                      {format(new Date(attempt.timestamp), "MMM d, yyyy")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(attempt.timestamp), "h:mm a")}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getDeviceIcon(attempt.deviceName)}
                  <div>
                    <div className="font-medium">{attempt.deviceDescription}</div>
                    {attempt.browser && (
                      <div className="text-xs text-gray-500">
                        {attempt.browser}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{attempt.locationDescription}</span>
                </div>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {attempt.ipAddress}
                </code>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getAttemptTypeBadge(attempt.attemptType)}
                  {attempt.flaggedAsSuspicious && !attempt.acknowledgedAt && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                {attempt.flaggedAsSuspicious && !attempt.acknowledgedAt && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeMutation.mutate(attempt.id)}
                    disabled={acknowledgeMutation.isPending}
                  >
                    {locale === "ar" ? "كان أنا" : "Was This You?"}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {locale === "ar" ? "سجل تسجيل الدخول" : "Login History"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {locale === "ar"
            ? "راجع محاولات تسجيل الدخول الأخيرة وإدارة الأنشطة المشبوهة"
            : "Review recent login attempts and manage suspicious activity"}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                {locale === "ar" ? "تسجيلات الدخول الناجحة" : "Successful Logins"}
              </CardDescription>
              <CardTitle className="text-3xl">{stats.successfulLogins30Days}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">
                {locale === "ar" ? "آخر 30 يومًا" : "Last 30 days"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                {locale === "ar" ? "محاولات فاشلة" : "Failed Attempts"}
              </CardDescription>
              <CardTitle className="text-3xl">{stats.failedLogins30Days}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">
                {locale === "ar" ? "آخر 30 يومًا" : "Last 30 days"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                {locale === "ar" ? "محاولات مشبوهة" : "Suspicious Attempts"}
              </CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {stats.suspiciousLogins}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">
                {locale === "ar" ? "تتطلب المراجعة" : "Requires review"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                {locale === "ar" ? "الأجهزة الفريدة" : "Unique Devices"}
              </CardDescription>
              <CardTitle className="text-3xl">{stats.uniqueDevices}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">
                {locale === "ar" ? "تم التعرف عليها" : "Recognized"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for All History vs Suspicious */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            <Activity className="h-4 w-4 me-2" />
            {locale === "ar" ? "جميع المحاولات" : "All Attempts"}
          </TabsTrigger>
          <TabsTrigger value="suspicious">
            <AlertTriangle className="h-4 w-4 me-2" />
            {locale === "ar" ? "مشبوه" : "Suspicious"}
            {stats && stats.suspiciousLogins > 0 && (
              <Badge variant="destructive" className="ms-2">
                {stats.suspiciousLogins}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "ar" ? "جميع محاولات تسجيل الدخول" : "All Login Attempts"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "سجل كامل لمحاولات تسجيل الدخول الناجحة والفاشلة"
                  : "Complete record of successful and failed login attempts"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">
                  {locale === "ar" ? "جاري التحميل..." : "Loading..."}
                </div>
              ) : (
                renderLoginHistoryTable(loginHistory?.content)
              )}

              {/* Pagination */}
              {loginHistory && loginHistory.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={loginHistory.isFirst}
                  >
                    {locale === "ar" ? "السابق" : "Previous"}
                  </Button>
                  <span className="text-sm text-gray-600">
                    {locale === "ar" ? "صفحة" : "Page"} {page + 1}{" "}
                    {locale === "ar" ? "من" : "of"} {loginHistory.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loginHistory.isLast}
                  >
                    {locale === "ar" ? "التالي" : "Next"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suspicious">
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "ar"
                  ? "محاولات تسجيل دخول مشبوهة"
                  : "Suspicious Login Attempts"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "تم وضع علامة على هذه المحاولات بواسطة نظام الكشف عن الحالات الشاذة"
                  : "These attempts were flagged by our anomaly detection system"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suspiciousLoading ? (
                <div className="text-center py-8">
                  {locale === "ar" ? "جاري التحميل..." : "Loading..."}
                </div>
              ) : (
                renderLoginHistoryTable(suspiciousAttempts?.content)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
