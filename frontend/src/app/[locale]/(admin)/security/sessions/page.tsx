'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  Monitor, 
  MapPin, 
  Clock, 
  AlertTriangle,
  LogOut,
  Shield
} from 'lucide-react';
import { useActiveSessions, useRevokeSession, useRevokeAllSessions } from '@/queries/use-user-sessions';
import type { UserSession } from '@/lib/api/user-sessions';
import { formatDistanceToNow } from 'date-fns';

export default function SessionManagementPage() {
  const t = useTranslations('security');
  const { data, isLoading, error } = useActiveSessions();
  const revokeSessionMutation = useRevokeSession();
  const revokeAllMutation = useRevokeAllSessions();
  
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);

  const handleRevokeSession = (sessionId: string) => {
    revokeSessionMutation.mutate(sessionId, {
      onSuccess: () => setSessionToRevoke(null),
    });
  };

  const handleRevokeAllSessions = () => {
    // Get current session ID (if available) to keep it active
    // For now, we'll revoke all except the first one (current)
    const currentSessionId = data?.sessions[0]?.sessionId;
    revokeAllMutation.mutate(currentSessionId, {
      onSuccess: () => setShowRevokeAllDialog(false),
    });
  };

  const getDeviceIcon = (session: UserSession) => {
    const deviceName = session.deviceName?.toLowerCase() || '';
    if (deviceName.includes('iphone') || deviceName.includes('android phone')) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (deviceName.includes('ipad') || deviceName.includes('tablet')) {
      return <Tablet className="h-5 w-5" />;
    }
    if (deviceName.includes('mac') || deviceName.includes('windows') || deviceName.includes('linux')) {
      return <Monitor className="h-5 w-5" />;
    }
    return <Laptop className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Error Loading Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {(error as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load sessions'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sessions = data?.sessions || [];
  const sessionCount = data?.count || 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Sessions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your active login sessions across devices
          </p>
        </div>
        {sessionCount > 1 && (
          <Button
            variant="destructive"
            onClick={() => setShowRevokeAllDialog(true)}
            disabled={revokeAllMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out All Other Devices
          </Button>
        )}
      </div>

      {/* Session Count */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Session Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-bold">{sessionCount}</p>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <p className="text-sm text-muted-foreground">
                Maximum allowed: <span className="font-semibold">5 devices</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No active sessions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map((session, index) => {
            const isCurrentSession = index === 0; // First session is current
            const lastActive = session.lastActiveAt ? 
              formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true }) : 
              'Unknown';

            return (
              <Card key={session.sessionId} className={isCurrentSession ? 'border-primary' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session)}
                      <div>
                        <CardTitle className="text-base">
                          {session.deviceDescription || 'Unknown Device'}
                        </CardTitle>
                        {isCurrentSession && (
                          <Badge variant="default" className="mt-1">
                            This Device
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!isCurrentSession && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSessionToRevoke(session.sessionId)}
                        disabled={revokeSessionMutation.isPending}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {/* Location */}
                  {session.locationDescription !== 'Unknown Location' && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{session.locationDescription}</span>
                    </div>
                  )}
                  
                  {/* IP Address */}
                  {session.ipAddress && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs font-mono">{session.ipAddress}</span>
                    </div>
                  )}
                  
                  {/* Last Active */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Active {lastActive}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Revoke Single Session Dialog */}
      <AlertDialog open={sessionToRevoke !== null} onOpenChange={(open) => !open && setSessionToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out from this device. You&apos;ll need to log in again to access your account from that device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToRevoke && handleRevokeSession(sessionToRevoke)}
              disabled={revokeSessionMutation.isPending}
            >
              {revokeSessionMutation.isPending ? 'Revoking...' : 'Revoke Session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out All Other Devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke all active sessions except this device. You&apos;ll need to log in again on those devices.
              This is useful if you suspect unauthorized access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAllSessions}
              disabled={revokeAllMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {revokeAllMutation.isPending ? 'Revoking...' : 'Sign Out All Others'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
