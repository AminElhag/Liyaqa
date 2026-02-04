import { Badge } from "./badge";
import { cn } from "../../lib/utils";
import { AlertSeverity } from "../../types/security";

interface SeverityBadgeProps {
  severity: AlertSeverity;
  className?: string;
}

const SEVERITY_CONFIG = {
  [AlertSeverity.CRITICAL]: {
    label: "Critical",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-500/20",
  },
  [AlertSeverity.HIGH]: {
    label: "High",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-500/20",
  },
  [AlertSeverity.MEDIUM]: {
    label: "Medium",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-500/20",
  },
  [AlertSeverity.LOW]: {
    label: "Low",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-500/20",
  },
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
