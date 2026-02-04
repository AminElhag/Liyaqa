"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Check, Loader2, Shield, ShieldCheck, ShieldX } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Checkbox } from "@liyaqa/shared/components/ui/checkbox";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  usePermissionsByModule,
  useUserPermissions,
  useSetUserPermissions,
} from "@liyaqa/shared/queries/use-permissions";
import {
  getLocalizedPermissionName,
  MODULE_NAMES,
  type Permission,
  type PermissionModule,
} from "@liyaqa/shared/types/permission";

interface PermissionManagerProps {
  userId: string;
  userName?: string;
}

export function PermissionManager({ userId, userName }: PermissionManagerProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  const { data: permissionsByModule, isLoading: isLoadingPermissions } = usePermissionsByModule();
  const { data: userPermissions, isLoading: isLoadingUserPermissions } = useUserPermissions(userId);
  const setUserPermissions = useSetUserPermissions();

  // Initialize selected permissions when user permissions load
  useEffect(() => {
    if (userPermissions?.permissionCodes) {
      setSelectedPermissions(new Set(userPermissions.permissionCodes));
      setHasChanges(false);
    }
  }, [userPermissions]);

  const texts = {
    title: locale === "ar" ? "إدارة الصلاحيات" : "Manage Permissions",
    description: locale === "ar"
      ? `إدارة الصلاحيات لـ ${userName || "المستخدم"}`
      : `Manage permissions for ${userName || "user"}`,
    saveChanges: locale === "ar" ? "حفظ التغييرات" : "Save Changes",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
    saved: locale === "ar" ? "تم الحفظ" : "Saved",
    savedDesc: locale === "ar" ? "تم تحديث الصلاحيات بنجاح" : "Permissions updated successfully",
    error: locale === "ar" ? "خطأ" : "Error",
    errorDesc: locale === "ar" ? "فشل في تحديث الصلاحيات" : "Failed to update permissions",
    selectAll: locale === "ar" ? "تحديد الكل" : "Select All",
    deselectAll: locale === "ar" ? "إلغاء تحديد الكل" : "Deselect All",
    noPermissions: locale === "ar" ? "لا توجد صلاحيات" : "No permissions found",
  };

  const handlePermissionToggle = (code: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
    setHasChanges(true);
  };

  const handleModuleSelectAll = (permissions: Permission[]) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      permissions.forEach((p) => newSet.add(p.code));
      return newSet;
    });
    setHasChanges(true);
  };

  const handleModuleDeselectAll = (permissions: Permission[]) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      permissions.forEach((p) => newSet.delete(p.code));
      return newSet;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await setUserPermissions.mutateAsync({
        userId,
        request: { permissionCodes: Array.from(selectedPermissions) },
      });
      toast({
        title: texts.saved,
        description: texts.savedDesc,
      });
      setHasChanges(false);
    } catch {
      toast({
        title: texts.error,
        description: texts.errorDesc,
        variant: "destructive",
      });
    }
  };

  const isModuleFullySelected = (permissions: Permission[]) => {
    return permissions.every((p) => selectedPermissions.has(p.code));
  };

  const isModulePartiallySelected = (permissions: Permission[]) => {
    const selected = permissions.filter((p) => selectedPermissions.has(p.code));
    return selected.length > 0 && selected.length < permissions.length;
  };

  if (isLoadingPermissions || isLoadingUserPermissions) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-8 w-full" />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!permissionsByModule?.modules?.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-neutral-500">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{texts.noPermissions}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {texts.title}
          </CardTitle>
          <CardDescription>{texts.description}</CardDescription>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || setUserPermissions.isPending}
        >
          {setUserPermissions.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {texts.saving}
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {texts.saveChanges}
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {permissionsByModule.modules.map((moduleGroup) => {
          const moduleName = MODULE_NAMES[moduleGroup.module as PermissionModule];
          const displayName = locale === "ar" && moduleName?.ar
            ? moduleName.ar
            : moduleName?.en || moduleGroup.module;
          const isFullySelected = isModuleFullySelected(moduleGroup.permissions);
          const isPartiallySelected = isModulePartiallySelected(moduleGroup.permissions);

          return (
            <div key={moduleGroup.module} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  {isFullySelected ? (
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                  ) : isPartiallySelected ? (
                    <Shield className="h-4 w-4 text-amber-500" />
                  ) : (
                    <ShieldX className="h-4 w-4 text-neutral-400" />
                  )}
                  {displayName}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleModuleSelectAll(moduleGroup.permissions)}
                    disabled={isFullySelected}
                    className="text-xs h-7"
                  >
                    {texts.selectAll}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleModuleDeselectAll(moduleGroup.permissions)}
                    disabled={!isFullySelected && !isPartiallySelected}
                    className="text-xs h-7"
                  >
                    {texts.deselectAll}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {moduleGroup.permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className={`flex items-center space-x-2 rtl:space-x-reverse rounded-md border p-3 transition-colors ${
                      selectedPermissions.has(permission.code)
                        ? "bg-primary/5 border-primary/20"
                        : "hover:bg-neutral-50"
                    }`}
                  >
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.has(permission.code)}
                      onCheckedChange={() => handlePermissionToggle(permission.code)}
                    />
                    <Label
                      htmlFor={permission.id}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {getLocalizedPermissionName(permission, locale)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
