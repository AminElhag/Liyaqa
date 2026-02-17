import { api } from "../client";

const BASE_URL = "api/v1/platform/auth";

/**
 * Accept a team invite using token
 */
export async function acceptInvite(data: {
  token: string;
  password: string;
  displayNameEn?: string;
  displayNameAr?: string;
}): Promise<void> {
  await api.post(`${BASE_URL}/accept-invite`, { json: data });
}

/**
 * Reset password using token
 */
export async function resetPasswordFromToken(data: {
  token: string;
  newPassword: string;
}): Promise<void> {
  await api.post(`${BASE_URL}/reset-password`, { json: data });
}
