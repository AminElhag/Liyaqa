"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Watch,
  Link2,
  Link2Off,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Activity,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  useWearablePlatforms,
  useWearableConnections,
  useDisconnectWearable,
  useDeleteWearableConnection,
  useStartWearableSync,
} from "@/queries/use-wearable";
import type { SyncStatus, MemberWearableConnection } from "@/types/wearable";
import {
  WEARABLE_PLATFORM_LABELS,
  WEARABLE_PLATFORM_LABELS_AR,
  SYNC_STATUS_LABELS,
  SYNC_STATUS_LABELS_AR,
} from "@/types/wearable";

export default function WearablesSettingsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [page, setPage] = useState(0);
  const [deleteConnectionId, setDeleteConnectionId] = useState<string | null>(null);
  const [disconnectConnectionId, setDisconnectConnectionId] = useState<string | null>(null);

  const { data: platforms } = useWearablePlatforms();
  const { data: connectionsData, isLoading } = useWearableConnections(page, 20);

  const disconnectMutation = useDisconnectWearable();
  const deleteMutation = useDeleteWearableConnection();
  const syncMutation = useStartWearableSync();

  const platformLabels = isArabic ? WEARABLE_PLATFORM_LABELS_AR : WEARABLE_PLATFORM_LABELS;
  const syncStatusLabels = isArabic ? SYNC_STATUS_LABELS_AR : SYNC_STATUS_LABELS;

  const connections = connectionsData?.content || [];
  const totalConnections = connectionsData?.totalElements || 0;

  const connectedCount = connections.filter((c) => c.hasOAuthTokens && !c.isTokenExpired).length;
  const activePlatforms = new Set(connections.map((c) => c.platformName)).size;

  const getSyncStatusBadge = (status: SyncStatus | null, isExpired: boolean) => {
    if (isExpired) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          {isArabic ? "انتهت الصلاحية" : "Expired"}
        </Badge>
      );
    }
    if (!status) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
          {isArabic ? "لم تتم المزامنة" : "Not synced"}
        </Badge>
      );
    }
    switch (status) {
      case "SUCCESS":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {syncStatusLabels[status]}
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            {syncStatusLabels[status]}
          </Badge>
        );
      case "PARTIAL":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {syncStatusLabels[status]}
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleSync = async (connectionId: string) => {
    try {
      await syncMutation.mutateAsync({ connectionId });
      toast.success(isArabic ? "بدأت المزامنة" : "Sync started");
    } catch {
      toast.error(isArabic ? "فشل في بدء المزامنة" : "Failed to start sync");
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectConnectionId) return;
    try {
      await disconnectMutation.mutateAsync(disconnectConnectionId);
      toast.success(isArabic ? "تم قطع الاتصال" : "Disconnected successfully");
      setDisconnectConnectionId(null);
    } catch {
      toast.error(isArabic ? "فشل في قطع الاتصال" : "Failed to disconnect");
    }
  };

  const handleDelete = async () => {
    if (!deleteConnectionId) return;
    try {
      await deleteMutation.mutateAsync(deleteConnectionId);
      toast.success(isArabic ? "تم الحذف" : "Deleted successfully");
      setDeleteConnectionId(null);
    } catch {
      toast.error(isArabic ? "فشل في الحذف" : "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isArabic ? "تكامل الأجهزة القابلة للارتداء" : "Wearable Integration"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إدارة اتصالات الأعضاء بالأجهزة القابلة للارتداء"
              : "Manage member wearable device connections"}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "إجمالي الاتصالات" : "Total Connections"}
                </p>
                <p className="text-2xl font-bold">{totalConnections}</p>
              </div>
              <Watch className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "متصل" : "Connected"}
                </p>
                <p className="text-2xl font-bold text-green-600">{connectedCount}</p>
              </div>
              <Link2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "المنصات النشطة" : "Active Platforms"}
                </p>
                <p className="text-2xl font-bold text-purple-600">{activePlatforms}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "المنصات المتاحة" : "Available Platforms"}
                </p>
                <p className="text-2xl font-bold text-blue-600">{platforms?.length || 0}</p>
              </div>
              <Heart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supported Platforms */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "المنصات المدعومة" : "Supported Platforms"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "الأجهزة القابلة للارتداء والتطبيقات الصحية المتاحة للاتصال"
              : "Wearable devices and health apps available for connection"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {platforms?.map((platform) => (
              <div
                key={platform.id}
                className="flex flex-col items-center p-4 border rounded-lg"
              >
                <Avatar className="h-12 w-12 mb-2">
                  {platform.logoUrl ? (
                    <AvatarImage src={platform.logoUrl} alt={platform.displayName} />
                  ) : null}
                  <AvatarFallback>
                    <Watch className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium text-center">{platform.displayName}</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {platform.supportsOAuth ? "OAuth" : "SDK"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Member Connections */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "اتصالات الأعضاء" : "Member Connections"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "جميع اتصالات الأعضاء بالأجهزة القابلة للارتداء"
              : "All member wearable device connections"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {isArabic ? "جاري التحميل..." : "Loading..."}
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isArabic ? "لا توجد اتصالات" : "No connections found"}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isArabic ? "العضو" : "Member"}</TableHead>
                    <TableHead>{isArabic ? "المنصة" : "Platform"}</TableHead>
                    <TableHead>{isArabic ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isArabic ? "آخر مزامنة" : "Last Sync"}</TableHead>
                    <TableHead className="w-[150px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.map((connection) => (
                    <TableRow key={connection.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {connection.externalUsername || connection.memberId.slice(0, 8)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {connection.platformLogoUrl && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={connection.platformLogoUrl} />
                              <AvatarFallback>
                                <Watch className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span>
                            {connection.platformName
                              ? platformLabels[connection.platformName]
                              : connection.platformDisplayName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSyncStatusBadge(connection.lastSyncStatus, connection.isTokenExpired)}
                      </TableCell>
                      <TableCell>
                        {connection.lastSyncAt ? (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(connection.lastSyncAt).toLocaleString(locale)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(connection.id)}
                            disabled={syncMutation.isPending || !connection.hasOAuthTokens}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            {isArabic ? "مزامنة" : "Sync"}
                          </Button>
                          {connection.hasOAuthTokens && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDisconnectConnectionId(connection.id)}
                            >
                              <Link2Off className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConnectionId(connection.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {connectionsData && connectionsData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    {isArabic ? "السابق" : "Previous"}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page + 1} / {connectionsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={connectionsData.last}
                  >
                    {isArabic ? "التالي" : "Next"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Disconnect Confirmation */}
      <AlertDialog
        open={!!disconnectConnectionId}
        onOpenChange={(open) => !open && setDisconnectConnectionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isArabic ? "قطع الاتصال؟" : "Disconnect?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? "سيتم إزالة الرموز المميزة. يمكن للعضو إعادة الاتصال لاحقاً."
                : "This will remove the OAuth tokens. The member can reconnect later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect}>
              {isArabic ? "قطع الاتصال" : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConnectionId}
        onOpenChange={(open) => !open && setDeleteConnectionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isArabic ? "هل أنت متأكد؟" : "Are you sure?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? "سيتم حذف هذا الاتصال وجميع البيانات المرتبطة نهائياً."
                : "This connection and all associated data will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isArabic ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
