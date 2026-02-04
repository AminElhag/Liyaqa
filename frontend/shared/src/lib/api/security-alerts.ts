import { api } from "./client";
import type { SecurityAlertResponse, AlertCountResponse } from "../types/security";

/**
 * Fetches security alerts for the authenticated user
 * @param unreadOnly - If true, only returns unread alerts
 */
export async function fetchSecurityAlerts(unreadOnly?: boolean): Promise<SecurityAlertResponse[]> {
  const params = new URLSearchParams();
  if (unreadOnly) {
    params.append("unreadOnly", "true");
  }

  const url = params.toString() ? `api/security/alerts?${params}` : "api/security/alerts";
  return api.get(url).json<SecurityAlertResponse[]>();
}

/**
 * Fetches the count of unread security alerts
 */
export async function fetchUnreadAlertCount(): Promise<number> {
  const response = await api.get("api/security/alerts/count").json<AlertCountResponse>();
  return response.count;
}

/**
 * Acknowledges a security alert (marks it as read/resolved)
 * @param alertId - The ID of the alert to acknowledge
 */
export async function acknowledgeSecurityAlert(alertId: string): Promise<void> {
  await api.post(`api/security/alerts/${alertId}/acknowledge`);
}
