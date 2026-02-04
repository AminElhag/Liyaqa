import { apiClient } from "./client";

export interface UserSession {
  id: string;
  sessionId: string;
  deviceName: string | null;
  os: string | null;
  browser: string | null;
  ipAddress: string;
  country: string | null;
  city: string | null;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isActive: boolean;
  isCurrent: boolean;
}

export const sessionApi = {
  async listSessions(): Promise<UserSession[]> {
    return apiClient.get("api/auth/sessions").json<UserSession[]>();
  },

  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.post(`api/auth/sessions/${sessionId}/revoke`).json();
  },

  async revokeAllOtherSessions(currentSessionId?: string): Promise<void> {
    await apiClient.post("api/auth/sessions/revoke-all", {
      json: currentSessionId ? { sessionId: currentSessionId } : {},
    }).json();
  },
};
