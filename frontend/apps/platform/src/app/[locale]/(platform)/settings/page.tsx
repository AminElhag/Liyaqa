"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Settings, Flag, Key, FileCheck, Clock } from "lucide-react";
import {
  useAllSettingsGrouped,
  useUpdateSetting,
  useAllMaintenanceWindows,
  useCancelMaintenanceWindow,
} from "@liyaqa/shared/queries/platform/use-platform-config";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import type { SettingCategory } from "@liyaqa/shared/types/platform/platform-config";

export default function SettingsPage() {
  const locale = useLocale();
  const { toast } = useToast();

  const { data: settings, isLoading: isLoadingSettings } = useAllSettingsGrouped();
  const { data: maintenanceWindows } = useAllMaintenanceWindows();
  const updateSettingMutation = useUpdateSetting();
  const cancelMaintenanceMutation = useCancelMaintenanceWindow();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const texts = {
    title: locale === "ar" ? "الإعدادات" : "Settings",
    description: locale === "ar" ? "إدارة إعدادات المنصة العامة" : "Manage global platform settings",
    featureFlags: locale === "ar" ? "أعلام الميزات" : "Feature Flags",
    apiKeys: locale === "ar" ? "مفاتيح API" : "API Keys",
    templates: locale === "ar" ? "القوالب" : "Templates",
    maintenanceWindows: locale === "ar" ? "نوافذ الصيانة" : "Maintenance Windows",
    save: locale === "ar" ? "حفظ" : "Save",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    edit: locale === "ar" ? "تعديل" : "Edit",
    active: locale === "ar" ? "نشط" : "Active",
    upcoming: locale === "ar" ? "قادم" : "Upcoming",
    cancelMaintenance: locale === "ar" ? "إلغاء الصيانة" : "Cancel Maintenance",
  };

  const categoryLabels: Record<SettingCategory, { en: string; ar: string }> = {
    GENERAL: { en: "General", ar: "عام" },
    BILLING: { en: "Billing", ar: "الفوترة" },
    SECURITY: { en: "Security", ar: "الأمان" },
    LOCALIZATION: { en: "Localization", ar: "الترجمة" },
    NOTIFICATIONS: { en: "Notifications", ar: "الإشعارات" },
    SYSTEM: { en: "System", ar: "النظام" },
    COMPLIANCE: { en: "Compliance", ar: "الامتثال" },
  };

  const handleSave = async (key: string) => {
    try {
      await updateSettingMutation.mutateAsync({ key, value: editingValue });
      setEditingKey(null);
      toast({ title: locale === "ar" ? "تم" : "Success", description: locale === "ar" ? "تم حفظ الإعداد" : "Setting saved" });
    } catch (error) {
      toast({ title: locale === "ar" ? "خطأ" : "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleCancelMaintenance = async (id: string) => {
    if (!confirm(locale === "ar" ? "هل تريد إلغاء نافذة الصيانة؟" : "Cancel maintenance window?")) return;
    try {
      await cancelMaintenanceMutation.mutateAsync(id);
      toast({ title: locale === "ar" ? "تم" : "Success", description: locale === "ar" ? "تم إلغاء نافذة الصيانة" : "Maintenance window cancelled" });
    } catch (error) {
      toast({ title: locale === "ar" ? "خطأ" : "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          {texts.title}
        </h1>
        <p className="text-muted-foreground">{texts.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <Link href={`/${locale}/settings/feature-flags`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Flag className="h-5 w-5" />
                {texts.featureFlags}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "إدارة أعلام الميزات والتحكم في الوصول" : "Manage feature flags and access control"}
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href={`/${locale}/settings/api-keys`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-5 w-5" />
                {texts.apiKeys}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "إدارة مفاتيح API للعملاء" : "Manage API keys for clients"}
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href={`/${locale}/settings/templates`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileCheck className="h-5 w-5" />
                {texts.templates}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "إدارة قوالب الوثائق والبريد الإلكتروني" : "Manage document and email templates"}
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {settings?.map((category) => (
        <Card key={category.category}>
          <CardHeader>
            <CardTitle>
              {locale === "ar" ? categoryLabels[category.category].ar : categoryLabels[category.category].en}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {category.settings.map((setting) => (
              <div key={setting.key} className="flex items-start justify-between p-3 rounded-lg border">
                <div className="flex-1 space-y-1">
                  <Label htmlFor={setting.key}>{setting.key}</Label>
                  {setting.description && (
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar" && setting.descriptionAr ? setting.descriptionAr : setting.description}
                    </p>
                  )}
                  {editingKey === setting.key ? (
                    <div className="flex gap-2 mt-2">
                      <Input id={setting.key} value={editingValue} onChange={(e) => setEditingValue(e.target.value)} className="max-w-xs" />
                      <Button size="sm" onClick={() => handleSave(setting.key)} disabled={updateSettingMutation.isPending}>{texts.save}</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingKey(null)}>{texts.cancel}</Button>
                    </div>
                  ) : (
                    <p className="font-mono text-sm">{setting.value}</p>
                  )}
                </div>
                {setting.isEditable && editingKey !== setting.key && (
                  <Button variant="ghost" size="sm" onClick={() => { setEditingKey(setting.key); setEditingValue(setting.value); }}>
                    {texts.edit}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {maintenanceWindows && maintenanceWindows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {texts.maintenanceWindows}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {maintenanceWindows.map((window) => (
              <div key={window.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium">{window.title}</p>
                  {window.description && <p className="text-sm text-muted-foreground">{window.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(window.startAt).toLocaleString(locale)} - {new Date(window.endAt).toLocaleString(locale)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={window.isCurrentlyActive ? "destructive" : "secondary"}>
                    {window.isCurrentlyActive ? texts.active : texts.upcoming}
                  </Badge>
                  {window.isActive && (
                    <Button variant="outline" size="sm" onClick={() => handleCancelMaintenance(window.id)} disabled={cancelMaintenanceMutation.isPending}>
                      {texts.cancelMaintenance}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
