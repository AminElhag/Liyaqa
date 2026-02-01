import { apiClient } from './client';

/**
 * Security alert from backend
 */
export interface SecurityAlert {
  id: string;
  alertType: string;
  severity: string;
  description: string;
  details: string | null;
  ipAddress: string | null;
  deviceInfo: string | null;
  location: string | null;
  resolved: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
}

/**
 * Paginated response for security alerts
 */
export interface SecurityAlertPageResponse {
  content: SecurityAlert[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Response for list of alerts
 */
export interface SecurityAlertsResponse {
  alerts: SecurityAlert[];
  count: number;
}

/**
 * Response for unread count
 */
export interface UnreadCountResponse {
  count: number;
}

/**
 * Security Alerts API functions
 */
export const securityAlertsApi = {
  /**
   * Get all security alerts (paginated)
   */
  async getAlerts(page: number = 0, size: number = 20, resolved?: boolean): Promise<SecurityAlertPageResponse> {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', size.toString());
    if (resolved !== undefined) {
      params.set('resolved', resolved.toString());
    }

    return apiClient.get(
      `/security/alerts?${params.toString()}`
    ).json<SecurityAlertPageResponse>();
  },

  /**
   * Get unread security alerts
   */
  async getUnreadAlerts(): Promise<SecurityAlert[]> {
    const response = await apiClient.get('/security/alerts/unread').json<SecurityAlertsResponse>();
    return response.alerts;
  },

  /**
   * Get count of unread alerts
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/security/alerts/unread/count').json<UnreadCountResponse>();
    return response.count;
  },

  /**
   * Acknowledge a specific alert
   */
  async acknowledgeAlert(alertId: string): Promise<{ message: string }> {
    return apiClient.post(
      `/security/alerts/${alertId}/acknowledge`
    ).json<{ message: string }>();
  },

  /**
   * Dismiss a specific alert
   */
  async dismissAlert(alertId: string): Promise<{ message: string }> {
    return apiClient.post(
      `/security/alerts/${alertId}/dismiss`
    ).json<{ message: string }>();
  },

  /**
   * Acknowledge all unread alerts
   */
  async acknowledgeAllAlerts(): Promise<{ message: string }> {
    return apiClient.post('/security/alerts/acknowledge-all').json<{ message: string }>();
  },
};
