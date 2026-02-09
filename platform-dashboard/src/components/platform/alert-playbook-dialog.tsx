import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Send,
  Phone,
  CreditCard,
  TrendingUp,
  Users,
  FileText,
  Percent,
  Lightbulb,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type {
  PlatformAlert,
  AlertSeverity,
  PlaybookAction,
  PlaybookActionType,
} from "@/types";
import { ALERT_PLAYBOOKS, ALERT_SEVERITY_CONFIG } from "@/types";

/**
 * Props for AlertPlaybookDialog
 */
interface AlertPlaybookDialogProps {
  alert?: PlatformAlert;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (alert: PlatformAlert, actionType: PlaybookActionType) => Promise<void>;
  onAcknowledge?: (alertId: string) => Promise<void>;
  onResolve?: (alertId: string) => Promise<void>;
}

/**
 * Severity icon component
 */
function SeverityIcon({ severity }: { severity: AlertSeverity }) {
  switch (severity) {
    case "CRITICAL":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case "WARNING":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "INFO":
      return <Info className="h-5 w-5 text-blue-500" />;
    case "SUCCESS":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
  }
}

/**
 * Action icon component
 */
function ActionIcon({ actionType }: { actionType: PlaybookActionType }) {
  switch (actionType) {
    case "SEND_EMAIL":
      return <Send className="h-4 w-4" />;
    case "SEND_SMS":
      return <Send className="h-4 w-4" />;
    case "SCHEDULE_CALL":
      return <Phone className="h-4 w-4" />;
    case "CREATE_TICKET":
      return <FileText className="h-4 w-4" />;
    case "SHOW_UPGRADE_OPTIONS":
      return <TrendingUp className="h-4 w-4" />;
    case "VIEW_DETAILS":
      return <ExternalLink className="h-4 w-4" />;
    case "ASSIGN_CSM":
      return <Users className="h-4 w-4" />;
    case "SEND_PAYMENT_LINK":
      return <CreditCard className="h-4 w-4" />;
    case "OFFER_DISCOUNT":
      return <Percent className="h-4 w-4" />;
    case "SEND_TIPS":
      return <Lightbulb className="h-4 w-4" />;
  }
}

/**
 * Playbook action button
 */
function PlaybookActionButton({
  action,
  alert,
  onAction,
  locale,
  isLoading,
}: {
  action: PlaybookAction;
  alert: PlatformAlert;
  onAction?: (alert: PlatformAlert, actionType: PlaybookActionType) => Promise<void>;
  locale: string;
  isLoading?: boolean;
}) {
  const isRtl = locale === "ar";
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!onAction) return;
    setLoading(true);
    try {
      await onAction(alert, action.type);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={action.isPrimary ? "default" : "outline"}
      className={cn(
        "w-full justify-start gap-3 h-auto py-3",
        isRtl && "flex-row-reverse"
      )}
      onClick={handleClick}
      disabled={loading || isLoading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ActionIcon actionType={action.type} />
      )}
      <div className={cn("flex-1 text-left", isRtl && "text-right")}>
        <div className="font-medium">
          {isRtl ? action.labelAr : action.labelEn}
        </div>
        <div className="text-xs text-muted-foreground">
          {isRtl ? action.descriptionAr : action.descriptionEn}
        </div>
      </div>
    </Button>
  );
}

/**
 * AlertPlaybookDialog Component
 * Dialog showing recommended actions based on alert type.
 */
export function AlertPlaybookDialog({
  alert,
  isOpen,
  onClose,
  onAction,
  onAcknowledge,
  onResolve,
}: AlertPlaybookDialogProps) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language;
  const isRtl = locale === "ar";
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const texts = {
    playbook: isRtl ? "\u062f\u0644\u064a\u0644 \u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a" : "Action Playbook",
    recommendedActions: isRtl ? "\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0627\u0644\u0645\u0648\u0635\u0649 \u0628\u0647\u0627" : "Recommended Actions",
    acknowledge: isRtl ? "\u062a\u0645 \u0627\u0644\u0627\u0637\u0644\u0627\u0639" : "Acknowledge",
    resolve: isRtl ? "\u062a\u0645 \u0627\u0644\u062d\u0644" : "Mark Resolved",
    viewClient: isRtl ? "\u0639\u0631\u0636 \u0627\u0644\u0639\u0645\u064a\u0644" : "View Client",
    acknowledged: isRtl ? "\u062a\u0645 \u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u064a\u0647" : "Acknowledged",
    close: isRtl ? "\u0625\u063a\u0644\u0627\u0642" : "Close",
  };

  if (!alert) return null;

  const playbook = ALERT_PLAYBOOKS[alert.type];
  const alertSeverityConfig = ALERT_SEVERITY_CONFIG[alert.severity];
  const isNew = !alert.acknowledgedAt;

  const handleAcknowledge = async () => {
    if (!onAcknowledge) return;
    setIsAcknowledging(true);
    try {
      await onAcknowledge(alert.id);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleResolve = async () => {
    if (!onResolve) return;
    setIsResolving(true);
    try {
      await onResolve(alert.id);
      onClose();
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div
            className={cn(
              "flex items-center gap-3",
              isRtl && "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "p-2 rounded-lg",
                alertSeverityConfig.bgColor,
                alertSeverityConfig.color
              )}
            >
              <SeverityIcon severity={alert.severity} />
            </div>
            <div className={cn("flex-1", isRtl && "text-right")}>
              <DialogTitle className="flex items-center gap-2">
                {isRtl ? alert.titleAr || alert.title : alert.title}
                {isNew && (
                  <Badge variant="secondary" className="ms-2">
                    {isRtl ? "\u062c\u062f\u064a\u062f" : "New"}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {alert.organizationNameEn && (
                  <span className="font-medium">
                    {isRtl
                      ? alert.organizationNameAr || alert.organizationNameEn
                      : alert.organizationNameEn}
                    {" \u2022 "}
                  </span>
                )}
                {isRtl ? alertSeverityConfig.labelAr : alertSeverityConfig.labelEn}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alert message */}
          <div
            className={cn(
              "p-3 rounded-lg bg-muted text-sm",
              isRtl && "text-right"
            )}
          >
            {isRtl ? alert.messageAr || alert.message : alert.message}
          </div>

          {/* Playbook section */}
          {playbook && (
            <>
              <Separator />
              <div>
                <h4
                  className={cn(
                    "text-sm font-medium mb-3 flex items-center gap-2",
                    isRtl && "flex-row-reverse"
                  )}
                >
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  {texts.recommendedActions}
                </h4>
                <div className="space-y-2">
                  {playbook.recommendedActions.map((action, index) => (
                    <PlaybookActionButton
                      key={index}
                      action={action}
                      alert={alert}
                      onAction={onAction}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Footer actions */}
          <div
            className={cn(
              "flex items-center gap-2",
              isRtl ? "flex-row-reverse" : "justify-end"
            )}
          >
            {/* View client button */}
            {alert.organizationId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate(`/platform/clients/${alert.organizationId}`);
                  onClose();
                }}
              >
                <ExternalLink className="h-4 w-4 me-1" />
                {texts.viewClient}
              </Button>
            )}

            {/* Acknowledge button */}
            {isNew && onAcknowledge && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcknowledge}
                disabled={isAcknowledging}
              >
                {isAcknowledging ? (
                  <Loader2 className="h-4 w-4 me-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 me-1" />
                )}
                {texts.acknowledge}
              </Button>
            )}

            {/* Already acknowledged badge */}
            {!isNew && (
              <Badge variant="secondary">
                <CheckCircle className="h-3 w-3 me-1" />
                {texts.acknowledged}
              </Badge>
            )}

            {/* Resolve button */}
            {onResolve && alert.status !== "RESOLVED" && (
              <Button
                variant="default"
                size="sm"
                onClick={handleResolve}
                disabled={isResolving}
              >
                {isResolving ? (
                  <Loader2 className="h-4 w-4 me-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 me-1" />
                )}
                {texts.resolve}
              </Button>
            )}

            {/* Close button */}
            <Button variant="ghost" size="sm" onClick={onClose}>
              {texts.close}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AlertPlaybookDialog;
