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
  AlertTriangle,
  Shield,
  MapPin,
  Monitor,
  Clock,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import {
  useSecurityAlerts,
  useUnreadAlerts,
  useAcknowledgeAlert,
  useDismissAlert,
  useAcknowledgeAllAlerts
} from '@/queries/use-security-alerts';
import type { SecurityAlert } from '@/lib/api/security-alerts';
import { formatDistanceToNow } from 'date-fns';

export default function SecurityAlertsPage() {
  const t = useTranslations('security');
  const [page, setPage] = useState(0);
  const [showResolved, setShowResolved] = useState(false);

  const { data, isLoading, error } = useSecurityAlerts(page, 20, showResolved ? undefined : false);
  const { data: unreadAlerts } = useUnreadAlerts();

  const acknowledgeMutation = useAcknowledgeAlert();
  const dismissMutation = useDismissAlert();
  const acknowledgeAllMutation = useAcknowledgeAllAlerts();

  const [alertToAcknowledge, setAlertToAcknowledge] = useState<string | null>(null);

  const getSeverityColor = (severity: string): "destructive" | "default" | "secondary" => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'destructive';
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'default';
      case 'LOW':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'MEDIUM':
        return <Info className="h-5 w-5 text-yellow-500" />;
      case 'LOW':
        return <Shield className="h-5 w-5 text-blue-500" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getAlertTypeDescription = (type: string) => {
    switch (type) {
      case 'IMPOSSIBLE_TRAVEL':
        return 'Impossible Travel';
      case 'NEW_DEVICE':
        return 'New Device';
      case 'BRUTE_FORCE':
        return 'Brute Force Attack';
      case 'UNUSUAL_TIME':
        return 'Unusual Login Time';
      case 'NEW_LOCATION':
        return 'New Location';
      case 'MULTIPLE_SESSIONS':
        return 'Multiple Sessions';
      case 'PASSWORD_SPRAY':
        return 'Password Spray Attack';
      default:
        return type;
    }
  };

  const handleAcknowledge = (alertId: string) => {
    acknowledgeMutation.mutate(alertId, {
      onSuccess: () => setAlertToAcknowledge(null),
    });
  };

  const handleDismiss = (alertId: string) => {
    dismissMutation.mutate(alertId);
  };

  const handleAcknowledgeAll = () => {
    acknowledgeAllMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
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
              Error Loading Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {(error as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load security alerts'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const alerts = data?.content || [];
  const unreadCount = unreadAlerts?.length || 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Review and acknowledge suspicious activity on your account
          </p>
        </div>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleAcknowledgeAll}
              disabled={acknowledgeAllMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Acknowledge All ({unreadCount})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? 'Show Unresolved Only' : 'Show All'}
          </Button>
        </div>
      </div>

      {/* Unread Count */}
      {unreadCount > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                You have {unreadCount} unread security {unreadCount === 1 ? 'alert' : 'alerts'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No security alerts found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your account activity looks normal
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const isUnread = !alert.acknowledgedAt && !alert.resolved;
            const createdDate = new Date(alert.createdAt);
            const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true });

            return (
              <Card
                key={alert.id}
                className={isUnread ? 'border-l-4 border-l-yellow-500' : ''}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">
                            {getAlertTypeDescription(alert.alertType)}
                          </CardTitle>
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          {isUnread && (
                            <Badge variant="outline" className="bg-yellow-50">
                              New
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{alert.description}</CardDescription>
                      </div>
                    </div>
                    {!alert.resolved && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAlertToAcknowledge(alert.id)}
                          disabled={acknowledgeMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Acknowledge
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(alert.id)}
                          disabled={dismissMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {/* Details */}
                  {alert.details && (
                    <div className="text-muted-foreground">
                      {alert.details}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground pt-2 border-t">
                    {alert.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{alert.location}</span>
                      </div>
                    )}
                    {alert.ipAddress && (
                      <div className="flex items-center gap-1">
                        <Monitor className="h-4 w-4" />
                        <span className="font-mono text-xs">{alert.ipAddress}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <div className="flex items-center px-4">
            Page {page + 1} of {data.totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
            disabled={page >= data.totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}

      {/* Acknowledge Confirmation Dialog */}
      <AlertDialog open={alertToAcknowledge !== null} onOpenChange={(open) => !open && setAlertToAcknowledge(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acknowledge Alert?</AlertDialogTitle>
            <AlertDialogDescription>
              This confirms that you&apos;re aware of this security alert and that it was authorized activity.
              The alert will be marked as resolved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => alertToAcknowledge && handleAcknowledge(alertToAcknowledge)}
              disabled={acknowledgeMutation.isPending}
            >
              {acknowledgeMutation.isPending ? 'Acknowledging...' : 'Yes, This Was Me'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
