"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Settings,
  Save,
  RefreshCw,
  Clock,
  Plus,
  XCircle,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { cn } from "@liyaqa/shared/utils";
import {
  useAllSettingsGrouped,
  useUpdateSetting,
  useAllMaintenanceWindows,
  useCreateMaintenanceWindow,
  useCancelMaintenanceWindow,
} from "@liyaqa/shared/queries/platform/use-platform-config";
import type { SettingCategory, GlobalSettingResponse } from "@liyaqa/shared/types/platform/platform-config";

const CATEGORY_LABELS: Record<SettingCategory, { en: string; ar: string }> = {
  GENERAL: { en: "General", ar: "عام" },
  BILLING: { en: "Billing", ar: "الفوترة" },
  SECURITY: { en: "Security", ar: "الأمان" },
  LOCALIZATION: { en: "Localization", ar: "التوطين" },
  NOTIFICATIONS: { en: "Notifications", ar: "الإشعارات" },
  SYSTEM: { en: "System", ar: "النظام" },
  COMPLIANCE: { en: "Compliance", ar: "الامتثال" },
};

export default function SettingsConfigPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [activeCategory, setActiveCategory] = useState<SettingCategory | "ALL">("ALL");
  const [showNewWindow, setShowNewWindow] = useState(false);
  const [newWindow, setNewWindow] = useState({ title: "", titleAr: "", startAt: "", endAt: "", description: "" });

  const texts = {
    title: isRtl ? "إعدادات المنصة" : "Platform Configuration",
    subtitle: isRtl ? "إدارة إعدادات النظام ونوافذ الصيانة" : "Manage system settings and maintenance windows",
    settings: isRtl ? "الإعدادات" : "Settings",
    maintenance: isRtl ? "نوافذ الصيانة" : "Maintenance Windows",
    all: isRtl ? "الكل" : "All",
    save: isRtl ? "حفظ" : "Save",
    cancel: isRtl ? "إلغاء" : "Cancel",
    edit: isRtl ? "تعديل" : "Edit",
    key: isRtl ? "المفتاح" : "Key",
    value: isRtl ? "القيمة" : "Value",
    type: isRtl ? "النوع" : "Type",
    updatedBy: isRtl ? "تم التحديث بواسطة" : "Updated by",
    newWindow: isRtl ? "نافذة صيانة جديدة" : "New Maintenance Window",
    windowTitle: isRtl ? "العنوان" : "Title",
    startAt: isRtl ? "يبدأ في" : "Start At",
    endAt: isRtl ? "ينتهي في" : "End At",
    create: isRtl ? "إنشاء" : "Create",
    cancelWindow: isRtl ? "إلغاء النافذة" : "Cancel Window",
    active: isRtl ? "نشط" : "Active",
    scheduled: isRtl ? "مجدول" : "Scheduled",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
    noSettings: isRtl ? "لا توجد إعدادات" : "No settings found",
    noWindows: isRtl ? "لا توجد نوافذ صيانة" : "No maintenance windows",
    readOnly: isRtl ? "للقراءة فقط" : "Read-only",
  };

  const { data: settingsGroups, isLoading: settingsLoading } = useAllSettingsGrouped();
  const updateSetting = useUpdateSetting();
  const { data: windows, isLoading: windowsLoading } = useAllMaintenanceWindows();
  const createWindow = useCreateMaintenanceWindow();
  const cancelWindowMutation = useCancelMaintenanceWindow();

  const handleEdit = (setting: GlobalSettingResponse) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const handleSave = () => {
    if (editingKey) {
      updateSetting.mutate({ key: editingKey, value: editValue });
      setEditingKey(null);
      setEditValue("");
    }
  };

  const handleCreateWindow = () => {
    if (newWindow.title && newWindow.startAt && newWindow.endAt) {
      createWindow.mutate({
        title: newWindow.title,
        titleAr: newWindow.titleAr || null,
        startAt: newWindow.startAt,
        endAt: newWindow.endAt,
        description: newWindow.description || null,
      });
      setShowNewWindow(false);
      setNewWindow({ title: "", titleAr: "", startAt: "", endAt: "", description: "" });
    }
  };

  const filteredSettings = settingsGroups?.filter(
    (g) => activeCategory === "ALL" || g.category === activeCategory
  ) || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className={isRtl ? "text-right" : ""}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          {texts.title}
        </h1>
        <p className="text-muted-foreground">{texts.subtitle}</p>
      </div>

      {/* Settings Section */}
      <div className="space-y-4">
        <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {texts.settings}
          </h2>
          <Select
            value={activeCategory}
            onValueChange={(v) => setActiveCategory(v as SettingCategory | "ALL")}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{texts.all}</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, labels]) => (
                <SelectItem key={key} value={key}>
                  {isRtl ? labels.ar : labels.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {settingsLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">{texts.loading}</p>
          </div>
        ) : filteredSettings.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">{texts.noSettings}</p>
            </CardContent>
          </Card>
        ) : (
          filteredSettings.map((group) => (
            <Card key={group.category}>
              <CardHeader>
                <CardTitle className="text-base">
                  {isRtl
                    ? CATEGORY_LABELS[group.category]?.ar || group.category
                    : CATEGORY_LABELS[group.category]?.en || group.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.settings.map((setting) => (
                    <div
                      key={setting.key}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        isRtl && "flex-row-reverse"
                      )}
                    >
                      <div className={cn("flex-1", isRtl && "text-right")}>
                        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                          <p className="text-sm font-medium font-mono">{setting.key}</p>
                          <Badge variant="outline" className="text-xs">{setting.valueType}</Badge>
                          {!setting.isEditable && (
                            <Badge variant="secondary" className="text-xs">{texts.readOnly}</Badge>
                          )}
                        </div>
                        {setting.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {isRtl ? setting.descriptionAr || setting.description : setting.description}
                          </p>
                        )}
                      </div>
                      <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                        {editingKey === setting.key ? (
                          <>
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-48 h-8"
                            />
                            <Button size="sm" onClick={handleSave} disabled={updateSetting.isPending}>
                              <Save className="h-3 w-3 me-1" />
                              {texts.save}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingKey(null)}>
                              {texts.cancel}
                            </Button>
                          </>
                        ) : (
                          <>
                            <code className="text-sm bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                              {setting.value}
                            </code>
                            {setting.isEditable && (
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(setting)}>
                                {texts.edit}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Maintenance Windows Section */}
      <div className="space-y-4">
        <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {texts.maintenance}
          </h2>
          <Button size="sm" onClick={() => setShowNewWindow(true)}>
            <Plus className="h-4 w-4 me-1" />
            {texts.newWindow}
          </Button>
        </div>

        {showNewWindow && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-base">{texts.newWindow}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{texts.windowTitle} (EN)</label>
                  <Input
                    value={newWindow.title}
                    onChange={(e) => setNewWindow({ ...newWindow, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{texts.windowTitle} (AR)</label>
                  <Input
                    value={newWindow.titleAr}
                    onChange={(e) => setNewWindow({ ...newWindow, titleAr: e.target.value })}
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{texts.startAt}</label>
                  <Input
                    type="datetime-local"
                    value={newWindow.startAt}
                    onChange={(e) => setNewWindow({ ...newWindow, startAt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{texts.endAt}</label>
                  <Input
                    type="datetime-local"
                    value={newWindow.endAt}
                    onChange={(e) => setNewWindow({ ...newWindow, endAt: e.target.value })}
                  />
                </div>
              </div>
              <div className={cn("flex gap-2 mt-4", isRtl && "flex-row-reverse")}>
                <Button onClick={handleCreateWindow} disabled={createWindow.isPending}>
                  {texts.create}
                </Button>
                <Button variant="outline" onClick={() => setShowNewWindow(false)}>
                  {texts.cancel}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {windowsLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : !windows?.length ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">{texts.noWindows}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {windows.map((window) => (
              <Card key={window.id}>
                <CardContent className="pt-6">
                  <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
                    <div className={isRtl ? "text-right" : ""}>
                      <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                        <h3 className="font-medium">
                          {isRtl ? window.titleAr || window.title : window.title}
                        </h3>
                        {window.isCurrentlyActive ? (
                          <Badge variant="destructive" className="text-xs">{texts.active}</Badge>
                        ) : window.isActive ? (
                          <Badge variant="default" className="text-xs">{texts.scheduled}</Badge>
                        ) : null}
                      </div>
                      {window.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {isRtl ? window.descriptionAr || window.description : window.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(window.startAt).toLocaleString(locale)} — {new Date(window.endAt).toLocaleString(locale)}
                      </p>
                    </div>
                    {window.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelWindowMutation.mutate(window.id)}
                        disabled={cancelWindowMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 me-1" />
                        {texts.cancelWindow}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
