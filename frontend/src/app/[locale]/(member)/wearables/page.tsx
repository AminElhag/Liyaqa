"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Watch,
  Link2,
  Link2Off,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { useMyProfile } from "@/queries/use-me";
import {
  useWearablePlatforms,
  useMemberWearableConnections,
  useCreateWearableConnection,
  useDisconnectWearable,
  useDeleteWearableConnection,
  useStartWearableSync,
} from "@/queries/use-wearable";
import type { SyncStatus, WearablePlatform } from "@/types/wearable";
import {
  SYNC_STATUS_LABELS,
  SYNC_STATUS_LABELS_AR,
} from "@/types/wearable";

export default function MemberWearablesPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const { data: profile } = useMyProfile();
  const memberId = profile?.id;

  const [connectPlatformOpen, setConnectPlatformOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<WearablePlatform | null>(null);
  const [disconnectConnectionId, setDisconnectConnectionId] = useState<string | null>(null);

  const { data: platforms } = useWearablePlatforms();
  const { data: connections, isLoading } = useMemberWearableConnections(memberId || "");

  const createMutation = useCreateWearableConnection();
  const disconnectMutation = useDisconnectWearable();
  const deleteMutation = useDeleteWearableConnection();
  const syncMutation = useStartWearableSync();

  const syncStatusLabels = isArabic ? SYNC_STATUS_LABELS_AR : SYNC_STATUS_LABELS;

  const connectedPlatformIds = new Set(connections?.map((c) => c.platformId));

  const getSyncStatusBadge = (status: SyncStatus | null, isExpired: boolean, hasTokens: boolean) => {
    if (!hasTokens) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          {isArabic ? "في انتظار الاتصال" : "Pending Connection"}
        </Badge>
      );
    }
    if (isExpired) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          {isArabic ? "يحتاج إعادة الاتصال" : "Needs Reconnection"}
        </Badge>
      );
    }
    if (!status) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          {isArabic ? "متصل" : "Connected"}
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
      default:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {isArabic ? "متصل" : "Connected"}
          </Badge>
        );
    }
  };

  const handleConnectPlatform = async (platform: WearablePlatform) => {
    if (!memberId) return;

    if (platform.supportsOAuth && platform.oauthAuthUrl) {
      // For OAuth platforms, we create the connection first, then redirect
      try {
        const connection = await createMutation.mutateAsync({
          memberId,
          platformId: platform.id,
        });
        // In a real app, redirect to OAuth URL
        // For now, show a message
        toast.info(
          isArabic
            ? `يرجى إكمال الاتصال بـ ${platform.displayName}`
            : `Please complete the connection to ${platform.displayName}`
        );
        setSelectedPlatform(platform);
      } catch {
        toast.error(isArabic ? "فشل في إنشاء الاتصال" : "Failed to create connection");
      }
    } else {
      // For SDK platforms (Apple Health), create connection
      try {
        await createMutation.mutateAsync({
          memberId,
          platformId: platform.id,
        });
        toast.success(
          isArabic
            ? `تم إضافة ${platform.displayName}`
            : `${platform.displayName} added`
        );
      } catch {
        toast.error(isArabic ? "فشل في إنشاء الاتصال" : "Failed to create connection");
      }
    }
    setConnectPlatformOpen(false);
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

  const handleDelete = async (connectionId: string) => {
    try {
      await deleteMutation.mutateAsync(connectionId);
      toast.success(isArabic ? "تم الحذف" : "Removed successfully");
    } catch {
      toast.error(isArabic ? "فشل في الحذف" : "Failed to remove");
    }
  };

  const availablePlatforms = platforms?.filter((p) => !connectedPlatformIds.has(p.id)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isArabic ? "الأجهزة القابلة للارتداء" : "Wearable Devices"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "اربط أجهزتك القابلة للارتداء لتتبع نشاطك"
              : "Connect your wearable devices to track your activity"}
          </p>
        </div>
        <Button onClick={() => setConnectPlatformOpen(true)} disabled={availablePlatforms.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          {isArabic ? "ربط جهاز" : "Connect Device"}
        </Button>
      </div>

      {/* Connected Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {isArabic ? "جاري التحميل..." : "Loading..."}
          </div>
        ) : connections && connections.length > 0 ? (
          connections.map((connection) => (
            <Card key={connection.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {connection.platformLogoUrl && (
                        <AvatarImage src={connection.platformLogoUrl} />
                      )}
                      <AvatarFallback>
                        <Watch className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{connection.platformDisplayName}</p>
                      {connection.externalUsername && (
                        <p className="text-sm text-muted-foreground">
                          {connection.externalUsername}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  {getSyncStatusBadge(
                    connection.lastSyncStatus,
                    connection.isTokenExpired,
                    connection.hasOAuthTokens
                  )}
                </div>

                {connection.lastSyncAt && (
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {isArabic ? "آخر مزامنة: " : "Last sync: "}
                    {new Date(connection.lastSyncAt).toLocaleString(locale)}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  {connection.hasOAuthTokens && !connection.isTokenExpired ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSync(connection.id)}
                        disabled={syncMutation.isPending}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        {isArabic ? "مزامنة الآن" : "Sync Now"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDisconnectConnectionId(connection.id)}
                      >
                        <Link2Off className="h-4 w-4" />
                      </Button>
                    </>
                  ) : connection.isTokenExpired ? (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Link2 className="h-4 w-4 mr-1" />
                      {isArabic ? "إعادة الاتصال" : "Reconnect"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(connection.id)}
                    >
                      {isArabic ? "إزالة" : "Remove"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Watch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">
                {isArabic ? "لا توجد أجهزة متصلة" : "No connected devices"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isArabic
                  ? "اربط أجهزتك القابلة للارتداء لبدء تتبع نشاطك"
                  : "Connect your wearable devices to start tracking your activity"}
              </p>
              <Button onClick={() => setConnectPlatformOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {isArabic ? "ربط جهازك الأول" : "Connect Your First Device"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Connect Platform Dialog */}
      <Dialog open={connectPlatformOpen} onOpenChange={setConnectPlatformOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isArabic ? "ربط جهاز" : "Connect a Device"}</DialogTitle>
            <DialogDescription>
              {isArabic
                ? "اختر جهازاً أو تطبيقاً صحياً للربط"
                : "Select a device or health app to connect"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {availablePlatforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleConnectPlatform(platform)}
                disabled={createMutation.isPending}
                className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                <Avatar className="h-12 w-12 mb-2">
                  {platform.logoUrl && <AvatarImage src={platform.logoUrl} />}
                  <AvatarFallback>
                    <Watch className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium">{platform.displayName}</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {platform.supportsOAuth ? "OAuth" : isArabic ? "التطبيق" : "App"}
                </Badge>
              </button>
            ))}
          </div>
          {availablePlatforms.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              {isArabic
                ? "جميع المنصات المتاحة متصلة بالفعل"
                : "All available platforms are already connected"}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* OAuth Redirect Dialog */}
      <Dialog open={!!selectedPlatform} onOpenChange={() => setSelectedPlatform(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isArabic ? `الاتصال بـ ${selectedPlatform?.displayName}` : `Connect to ${selectedPlatform?.displayName}`}
            </DialogTitle>
            <DialogDescription>
              {isArabic
                ? "ستتم إعادة توجيهك لتسجيل الدخول ومنح الإذن"
                : "You will be redirected to log in and grant permission"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <Avatar className="h-16 w-16 mx-auto mb-4">
              {selectedPlatform?.logoUrl && <AvatarImage src={selectedPlatform.logoUrl} />}
              <AvatarFallback>
                <Watch className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground mb-4">
              {isArabic
                ? "انقر على الزر أدناه للمتابعة إلى صفحة تسجيل الدخول"
                : "Click the button below to continue to the login page"}
            </p>
            <Button asChild>
              <a
                href={selectedPlatform?.oauthAuthUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {isArabic ? "المتابعة إلى " : "Continue to "}{selectedPlatform?.displayName}
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                ? "سيتم إيقاف مزامنة البيانات. يمكنك إعادة الاتصال في أي وقت."
                : "Data syncing will stop. You can reconnect anytime."}
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
    </div>
  );
}
