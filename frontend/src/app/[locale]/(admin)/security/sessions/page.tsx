"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Monitor, Smartphone, Tablet, MapPin, Clock, Shield, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSessions, useRevokeSession, useRevokeAllOtherSessions } from "@/queries/use-sessions";
import { toast } from "sonner";
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

export default function SessionsPage() {
  const t = useTranslations();
  const { data: sessions, isLoading } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeAllOther = useRevokeAllOtherSessions();
  
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);

  const getDeviceIcon = (deviceName: string | null) => {
    const name = (deviceName || "").toLowerCase();
    if (name.includes("mobile") || name.includes("iphone") || name.includes("android")) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (name.includes("tablet") || name.includes("ipad")) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession.mutateAsync(sessionId);
      toast.success("Session revoked successfully");
      setSessionToRevoke(null);
    } catch (error) {
      toast.error("Failed to revoke session");
    }
  };

  const handleRevokeAllOther = async () => {
    const currentSession = sessions?.find((s) => s.isCurrent);
    try {
      await revokeAllOther.mutateAsync(currentSession?.sessionId);
      toast.success("All other sessions revoked successfully");
      setShowRevokeAllDialog(false);
    } catch (error) {
      toast.error("Failed to revoke sessions");
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-6">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          <Separator />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeSessions = sessions?.filter((s) => s.isActive) || [];
  const currentSession = activeSessions.find((s) => s.isCurrent);
  const otherSessions = activeSessions.filter((s) => !s.isCurrent);

  return (
    <div className="container max-w-4xl py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Sessions</h1>
          <p className="text-muted-foreground mt-2">
            Manage your active sessions across all devices. You can revoke access from any device.
          </p>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {activeSessions.length} active {activeSessions.length === 1 ? "session" : "sessions"}
            </span>
          </div>

          {otherSessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRevokeAllDialog(true)}
              disabled={revokeAllOther.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Revoke All Other Devices
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {currentSession && (
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getDeviceIcon(currentSession.deviceName)}</div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {currentSession.deviceName || "Unknown Device"}
                        <Badge variant="default" className="ml-2">
                          This Device
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {currentSession.browser} on {currentSession.os}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {currentSession.city && currentSession.country
                        ? `${currentSession.city}, ${currentSession.country}`
                        : currentSession.ipAddress}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Last active:{" "}
                      {format(new Date(currentSession.lastActiveAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {otherSessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getDeviceIcon(session.deviceName)}</div>
                    <div>
                      <CardTitle className="text-base">
                        {session.deviceName || "Unknown Device"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {session.browser} on {session.os}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSessionToRevoke(session.sessionId)}
                    disabled={revokeSession.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {session.city && session.country
                        ? `${session.city}, ${session.country}`
                        : session.ipAddress}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Last active: {format(new Date(session.lastActiveAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeSessions.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No active sessions found
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!sessionToRevoke} onOpenChange={() => setSessionToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign out this device. You'll need to sign in again on that device to regain
              access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToRevoke && handleRevokeSession(sessionToRevoke)}
            >
              Revoke Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke All Other Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign out all other devices except this one. You'll need to sign in again on
              those devices to regain access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeAllOther}>Revoke All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
