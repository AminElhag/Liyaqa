export enum AlertType {
  IMPOSSIBLE_TRAVEL = "IMPOSSIBLE_TRAVEL",
  NEW_DEVICE = "NEW_DEVICE",
  BRUTE_FORCE = "BRUTE_FORCE",
  UNUSUAL_TIME = "UNUSUAL_TIME",
  NEW_LOCATION = "NEW_LOCATION",
  MULTIPLE_FAILED_MFA = "MULTIPLE_FAILED_MFA",
  SESSION_HIJACKING = "SESSION_HIJACKING",
}

export enum AlertSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface SecurityAlert {
  id: string;
  alertType: AlertType;
  severity: AlertSeverity;
  details: string | null;
  resolved: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
}

export interface SecurityAlertResponse {
  id: string;
  alertType: string;
  severity: AlertSeverity;
  details: string | null;
  resolved: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
}

export interface AlertCountResponse {
  count: number;
}
