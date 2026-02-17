import { api } from "../client";
import type {
  InviteTeamMemberRequest,
  ChangeRoleRequest,
} from "../../../types/platform/team";

const BASE_URL = "api/v1/platform/team";

/**
 * Invite a new team member
 */
export async function inviteMember(data: InviteTeamMemberRequest): Promise<void> {
  await api.post(`${BASE_URL}/invite`, { json: data });
}

/**
 * Change a team member's role
 */
export async function changeRole(userId: string, data: ChangeRoleRequest): Promise<void> {
  await api.put(`${BASE_URL}/${userId}/role`, { json: data });
}

/**
 * Deactivate a team member
 */
export async function deactivateTeamUser(userId: string): Promise<void> {
  await api.post(`${BASE_URL}/${userId}/deactivate`);
}

/**
 * Reset a team member's password (admin-initiated)
 */
export async function resetTeamUserPassword(userId: string): Promise<void> {
  await api.post(`${BASE_URL}/${userId}/reset-password`);
}
