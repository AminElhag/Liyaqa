import { apiClient } from './client';

/**
 * User session data from backend (authentication sessions, not class sessions)
 */
export interface UserSession {
  sessionId: string;
  deviceName: string | null;
  os: string | null;
  browser: string | null;
  deviceDescription: string;
  ipAddress: string | null;
  country: string | null;
  city: string | null;
  locationDescription: string;
  lastActiveAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Response from list sessions endpoint
 */
export interface SessionListResponse {
  sessions: UserSession[];
  count: number;
}

/**
 * Response from session count endpoint
 */
export interface SessionCountResponse {
  count: number;
}

/**
 * Request for revoking all sessions except one
 */
export interface RevokeAllSessionsRequest {
  exceptSessionId?: string;
}

/**
 * Generic message response
 */
export interface MessageResponse {
  message: string;
}

/**
 * User Session API functions (for authentication session management)
 */
export const userSessionApi = {
  /**
   * List all active sessions for the current user
   */
  async listActiveSessions(): Promise<SessionListResponse> {
    return apiClient.get('/auth/sessions').json<SessionListResponse>();
  },

  /**
   * List all sessions (including inactive) for the current user
   */
  async listAllSessions(): Promise<SessionListResponse> {
    return apiClient.get('/auth/sessions/all').json<SessionListResponse>();
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<MessageResponse> {
    return apiClient.post(
      `/auth/sessions/${sessionId}/revoke`
    ).json<MessageResponse>();
  },

  /**
   * Revoke all sessions except optionally one
   */
  async revokeAllSessions(exceptSessionId?: string): Promise<MessageResponse> {
    return apiClient.post(
      '/auth/sessions/revoke-all',
      { json: { exceptSessionId } }
    ).json<MessageResponse>();
  },

  /**
   * Get count of active sessions
   */
  async getActiveSessionCount(): Promise<number> {
    const response = await apiClient.get('/auth/sessions/count').json<SessionCountResponse>();
    return response.count;
  },
};
