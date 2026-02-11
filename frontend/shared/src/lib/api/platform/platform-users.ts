import { api } from "../client";
import type {
  PlatformUser,
  PlatformUserSummary,
  PlatformUserStats,
  PlatformUserPage,
  PlatformUserActivity,
  PlatformUserActivityPage,
  CreatePlatformUserRequest,
  UpdatePlatformUserRequest,
  ChangeUserStatusRequest,
  ResetUserPasswordRequest,
  PlatformUserQueryParams,
  PlatformUserRole,
  PlatformUserStatus,
} from "../../../types/platform/platform-user";

// Toggle mock data - set to false when backend is implemented
const USE_MOCK = false;

// ============================================================================
// Mock Data Generators
// ============================================================================

function generateMockUsers(): PlatformUserSummary[] {
  const roles: PlatformUserRole[] = ["PLATFORM_SUPER_ADMIN", "PLATFORM_ADMIN", "ACCOUNT_MANAGER", "SUPPORT_LEAD", "SUPPORT_AGENT", "PLATFORM_VIEWER"];
  const statuses: PlatformUserStatus[] = ["ACTIVE", "ACTIVE", "ACTIVE", "INACTIVE", "SUSPENDED"];

  const mockUsers: PlatformUserSummary[] = [
    {
      id: "user-001",
      email: "admin@liyaqa.com",
      displayNameEn: "Ahmed Al-Rashid",
      displayNameAr: "أحمد الراشد",
      role: "PLATFORM_ADMIN",
      status: "ACTIVE",
      lastLoginAt: new Date().toISOString(),
      createdAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "user-002",
      email: "sarah.sales@liyaqa.com",
      displayNameEn: "Sarah Johnson",
      displayNameAr: "سارة جونسون",
      role: "ACCOUNT_MANAGER",
      status: "ACTIVE",
      lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: "2024-02-20T14:30:00Z",
    },
    {
      id: "user-003",
      email: "omar.support@liyaqa.com",
      displayNameEn: "Omar Khalid",
      displayNameAr: "عمر خالد",
      role: "SUPPORT_AGENT",
      status: "ACTIVE",
      lastLoginAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: "2024-03-10T09:15:00Z",
    },
    {
      id: "user-004",
      email: "fatima.sales@liyaqa.com",
      displayNameEn: "Fatima Hassan",
      displayNameAr: "فاطمة حسن",
      role: "ACCOUNT_MANAGER",
      status: "INACTIVE",
      createdAt: "2024-04-05T11:45:00Z",
    },
    {
      id: "user-005",
      email: "khalid.admin@liyaqa.com",
      displayNameEn: "Khalid Al-Mansour",
      displayNameAr: "خالد المنصور",
      role: "PLATFORM_ADMIN",
      status: "ACTIVE",
      lastLoginAt: new Date(Date.now() - 7200000).toISOString(),
      createdAt: "2024-01-20T08:00:00Z",
    },
    {
      id: "user-006",
      email: "noor.support@liyaqa.com",
      displayNameEn: "Noor Ahmed",
      displayNameAr: "نور أحمد",
      role: "SUPPORT_LEAD",
      status: "SUSPENDED",
      createdAt: "2024-05-12T16:20:00Z",
    },
    {
      id: "user-007",
      email: "ali.sales@liyaqa.com",
      displayNameEn: "Ali Mohammed",
      displayNameAr: "علي محمد",
      role: "ACCOUNT_MANAGER",
      status: "ACTIVE",
      lastLoginAt: new Date(Date.now() - 172800000).toISOString(),
      createdAt: "2024-06-01T10:30:00Z",
    },
    {
      id: "user-008",
      email: "layla.support@liyaqa.com",
      displayNameEn: "Layla Ibrahim",
      displayNameAr: "ليلى إبراهيم",
      role: "SUPPORT_AGENT",
      status: "ACTIVE",
      lastLoginAt: new Date(Date.now() - 43200000).toISOString(),
      createdAt: "2024-06-15T13:00:00Z",
    },
  ];

  return mockUsers;
}

function getMockUser(id: string): PlatformUser | null {
  const users = generateMockUsers();
  const summary = users.find((u) => u.id === id);
  if (!summary) return null;

  return {
    ...summary,
    phoneNumber: "+966 50 123 4567",
    updatedAt: new Date().toISOString(),
    createdById: "user-001",
    createdByName: "Ahmed Al-Rashid",
  };
}

function getMockStats(): PlatformUserStats {
  return {
    total: 8,
    active: 5,
    inactive: 1,
    suspended: 2,
    byRole: {
      PLATFORM_SUPER_ADMIN: 1,
      PLATFORM_ADMIN: 1,
      ACCOUNT_MANAGER: 3,
      SUPPORT_LEAD: 1,
      SUPPORT_AGENT: 2,
      PLATFORM_VIEWER: 0,
    },
  };
}

function getMockActivities(userId: string): PlatformUserActivity[] {
  return [
    {
      id: "act-001",
      userId,
      action: "LOGIN",
      description: "User logged in successfully",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      createdAt: new Date().toISOString(),
    },
    {
      id: "act-002",
      userId,
      action: "VIEW_DEAL",
      description: "Viewed deal #DEAL-001",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "act-003",
      userId,
      action: "UPDATE_TICKET",
      description: "Updated support ticket #TKT-0045",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "act-004",
      userId,
      action: "ASSIGN_TICKET",
      description: "Assigned ticket #TKT-0044 to Omar Khalid",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a new platform user.
 */
export async function createPlatformUser(
  data: CreatePlatformUserRequest
): Promise<PlatformUser> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      id: `user-${Date.now()}`,
      email: data.email,
      displayNameEn: data.displayNameEn,
      displayNameAr: data.displayNameAr,
      role: data.role,
      status: "ACTIVE",
      phoneNumber: data.phoneNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return api.post("api/platform/users", { json: data }).json<PlatformUser>();
}

/**
 * Get a platform user by ID.
 */
export async function getPlatformUser(id: string): Promise<PlatformUser> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const user = getMockUser(id);
    if (!user) throw new Error("User not found");
    return user;
  }

  return api.get(`api/platform/users/${id}`).json<PlatformUser>();
}

/**
 * Get paginated list of platform users.
 */
export async function getPlatformUsers(
  params: PlatformUserQueryParams = {}
): Promise<PlatformUserPage> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    let users = generateMockUsers();

    // Filter by status
    if (params.status) {
      users = users.filter((u) => u.status === params.status);
    }

    // Filter by role
    if (params.role) {
      users = users.filter((u) => u.role === params.role);
    }

    // Filter by search
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(searchLower) ||
          u.displayNameEn.toLowerCase().includes(searchLower) ||
          u.displayNameAr?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (params.sortBy) {
      users.sort((a, b) => {
        const aVal = a[params.sortBy as keyof PlatformUserSummary] || "";
        const bVal = b[params.sortBy as keyof PlatformUserSummary] || "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return params.sortDirection === "desc" ? -cmp : cmp;
      });
    }

    // Paginate
    const page = params.page || 0;
    const size = params.size || 10;
    const start = page * size;
    const end = start + size;
    const pagedUsers = users.slice(start, end);

    return {
      content: pagedUsers,
      totalElements: users.length,
      totalPages: Math.ceil(users.length / size),
      number: page,
      size,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { sorted: false, unsorted: true, empty: true },
        offset: start,
        paged: true,
        unpaged: false,
      },
      first: page === 0,
      last: end >= users.length,
      numberOfElements: pagedUsers.length,
      empty: pagedUsers.length === 0,
    };
  }

  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  if (params.status) searchParams.set("status", params.status);
  if (params.role) searchParams.set("role", params.role);
  if (params.search) searchParams.set("search", params.search);

  const queryString = searchParams.toString();
  const url = queryString ? `api/platform/users?${queryString}` : "api/platform/users";
  return api.get(url).json<PlatformUserPage>();
}

/**
 * Get platform user statistics.
 */
export async function getPlatformUserStats(): Promise<PlatformUserStats> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return getMockStats();
  }

  return api.get("api/platform/users/stats").json<PlatformUserStats>();
}

/**
 * Update a platform user.
 */
export async function updatePlatformUser(
  id: string,
  data: UpdatePlatformUserRequest
): Promise<PlatformUser> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const user = getMockUser(id);
    if (!user) throw new Error("User not found");
    return {
      ...user,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  }

  return api.patch(`api/platform/users/${id}`, { json: data }).json<PlatformUser>();
}

/**
 * Change platform user status (activate/suspend/deactivate).
 */
export async function changePlatformUserStatus(
  id: string,
  data: ChangeUserStatusRequest
): Promise<PlatformUser> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const user = getMockUser(id);
    if (!user) throw new Error("User not found");
    return {
      ...user,
      status: data.status,
      updatedAt: new Date().toISOString(),
    };
  }

  return api.post(`api/platform/users/${id}/status`, { json: data }).json<PlatformUser>();
}

/**
 * Reset platform user password (admin-initiated).
 */
export async function resetPlatformUserPassword(
  id: string,
  data: ResetUserPasswordRequest
): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return;
  }

  await api.post(`api/platform/users/${id}/reset-password`, { json: data });
}

/**
 * Get activity log for a platform user.
 */
export async function getPlatformUserActivities(
  id: string,
  params: { page?: number; size?: number } = {}
): Promise<PlatformUserActivityPage> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const activities = getMockActivities(id);
    const page = params.page || 0;
    const size = params.size || 10;

    return {
      content: activities,
      totalElements: activities.length,
      totalPages: 1,
      number: page,
      size,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { sorted: false, unsorted: true, empty: true },
        offset: 0,
        paged: true,
        unpaged: false,
      },
      first: true,
      last: true,
      numberOfElements: activities.length,
      empty: activities.length === 0,
    };
  }

  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/platform/users/${id}/activities?${queryString}`
    : `api/platform/users/${id}/activities`;
  return api.get(url).json<PlatformUserActivityPage>();
}

/**
 * Delete a platform user.
 */
export async function deletePlatformUser(id: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return;
  }

  await api.delete(`api/platform/users/${id}`);
}
