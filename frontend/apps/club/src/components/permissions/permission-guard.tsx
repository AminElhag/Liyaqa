"use client";

import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import type { PermissionCode } from "@liyaqa/shared/types/permission";

interface PermissionGuardProps {
  /** Required permission(s). If array, user needs ANY of them (OR logic). */
  permission: PermissionCode | PermissionCode[];
  /** Content to render if user has permission. */
  children: React.ReactNode;
  /** Optional fallback content if user doesn't have permission. */
  fallback?: React.ReactNode;
  /** If true, requires ALL permissions instead of ANY (AND logic). */
  requireAll?: boolean;
}

/**
 * Component that conditionally renders children based on user permissions.
 *
 * @example
 * ```tsx
 * // Single permission
 * <PermissionGuard permission="members_create">
 *   <Button>Add Member</Button>
 * </PermissionGuard>
 *
 * // Multiple permissions (user needs ANY)
 * <PermissionGuard permission={["members_view", "members_create"]}>
 *   <MemberSection />
 * </PermissionGuard>
 *
 * // Multiple permissions (user needs ALL)
 * <PermissionGuard permission={["members_view", "members_delete"]} requireAll>
 *   <DeleteButton />
 * </PermissionGuard>
 *
 * // With fallback
 * <PermissionGuard permission="invoices_view" fallback={<AccessDenied />}>
 *   <InvoiceList />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
  requireAll = false,
}: PermissionGuardProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);
  const hasAllPermissions = useAuthStore((state) => state.hasAllPermissions);

  const permissionCodes = Array.isArray(permission) ? permission : [permission];

  let hasAccess: boolean;

  if (permissionCodes.length === 1) {
    hasAccess = hasPermission(permissionCodes[0]);
  } else if (requireAll) {
    hasAccess = hasAllPermissions(permissionCodes);
  } else {
    hasAccess = hasAnyPermission(permissionCodes);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Hook to check if user has a specific permission.
 *
 * @example
 * ```tsx
 * const canCreateMember = useHasPermission("members_create");
 *
 * if (canCreateMember) {
 *   // Show create button
 * }
 * ```
 */
export function useHasPermission(permissionCode: PermissionCode): boolean {
  return useAuthStore((state) => state.hasPermission(permissionCode));
}

/**
 * Hook to check if user has any of the specified permissions.
 *
 * @example
 * ```tsx
 * const canManageMembers = useHasAnyPermission(["members_create", "members_update", "members_delete"]);
 * ```
 */
export function useHasAnyPermission(permissionCodes: PermissionCode[]): boolean {
  return useAuthStore((state) => state.hasAnyPermission(permissionCodes));
}

/**
 * Hook to check if user has all of the specified permissions.
 *
 * @example
 * ```tsx
 * const canFullyManageMembers = useHasAllPermissions(["members_view", "members_create", "members_update", "members_delete"]);
 * ```
 */
export function useHasAllPermissions(permissionCodes: PermissionCode[]): boolean {
  return useAuthStore((state) => state.hasAllPermissions(permissionCodes));
}
