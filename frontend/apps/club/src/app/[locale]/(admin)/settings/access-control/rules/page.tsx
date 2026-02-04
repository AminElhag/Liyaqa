"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@liyaqa/shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@liyaqa/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import {
  useTimeRules,
  useZones,
  useCreateTimeRule,
  useUpdateTimeRule,
  useDeleteTimeRule,
} from "@liyaqa/shared/queries/use-access-control";
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_LABELS_AR,
  type AccessRuleType,
  type CreateTimeRuleRequest,
  type AccessTimeRule,
} from "@liyaqa/shared/types/access-control";

export default function TimeRulesPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [page, setPage] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CreateTimeRuleRequest>>({
    accessType: "ALLOW",
    startTime: "08:00",
    endTime: "22:00",
    priority: 0,
  });

  const { data: rulesPage, isLoading } = useTimeRules(page, 20);
  const { data: zonesPage } = useZones(0, 100);
  const createMutation = useCreateTimeRule();
  const updateMutation = useUpdateTimeRule();
  const deleteMutation = useDeleteTimeRule();

  const getDayLabel = (day: number | null) => {
    if (day === null) return isArabic ? "كل الأيام" : "All days";
    return isArabic ? DAY_OF_WEEK_LABELS_AR[day] : DAY_OF_WEEK_LABELS[day];
  };

  const handleCreate = () => {
    if (!formData.name || !formData.startTime || !formData.endTime) return;

    createMutation.mutate(formData as CreateTimeRuleRequest, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setFormData({ accessType: "ALLOW", startTime: "08:00", endTime: "22:00", priority: 0 });
      },
    });
  };

  const handleUpdate = () => {
    if (!editingRule) return;

    updateMutation.mutate(
      { id: editingRule, data: formData },
      {
        onSuccess: () => {
          setEditingRule(null);
          setFormData({ accessType: "ALLOW", startTime: "08:00", endTime: "22:00", priority: 0 });
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm(isArabic ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (rule: AccessTimeRule) => {
    setFormData({
      name: rule.name,
      nameAr: rule.nameAr ?? undefined,
      zoneId: rule.zoneId ?? undefined,
      dayOfWeek: rule.dayOfWeek ?? undefined,
      startTime: rule.startTime,
      endTime: rule.endTime,
      accessType: rule.accessType,
      priority: rule.priority,
      isActive: rule.isActive,
    });
    setEditingRule(rule.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic ? "قواعد الوقت" : "Time Rules"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "تحديد أوقات السماح والحظر للوصول"
              : "Configure allowed and restricted access times"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/settings/access-control">
            <Button variant="outline">
              {isArabic ? "العودة" : "Back"}
            </Button>
          </Link>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-2" />
                {isArabic ? "إضافة قاعدة" : "Add Rule"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {isArabic ? "إضافة قاعدة جديدة" : "Add New Rule"}
                </DialogTitle>
                <DialogDescription>
                  {isArabic
                    ? "أدخل تفاصيل قاعدة الوقت"
                    : "Enter the time rule details"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isArabic ? "اسم القاعدة" : "Rule Name"}</Label>
                    <Input
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isArabic ? "الاسم بالعربية" : "Arabic Name"}</Label>
                    <Input
                      value={formData.nameAr || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, nameAr: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isArabic ? "نوع القاعدة" : "Rule Type"}</Label>
                    <Select
                      value={formData.accessType}
                      onValueChange={(v) =>
                        setFormData({ ...formData, accessType: v as AccessRuleType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALLOW">{isArabic ? "سماح" : "Allow"}</SelectItem>
                        <SelectItem value="DENY">{isArabic ? "حظر" : "Deny"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{isArabic ? "المنطقة" : "Zone"}</Label>
                    <Select
                      value={formData.zoneId || ""}
                      onValueChange={(v) =>
                        setFormData({ ...formData, zoneId: v || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isArabic ? "جميع المناطق" : "All zones"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{isArabic ? "جميع المناطق" : "All zones"}</SelectItem>
                        {zonesPage?.content.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {isArabic && zone.nameAr ? zone.nameAr : zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{isArabic ? "يوم الأسبوع" : "Day of Week"}</Label>
                    <Select
                      value={formData.dayOfWeek?.toString() ?? ""}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          dayOfWeek: v ? parseInt(v) : undefined,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isArabic ? "كل الأيام" : "All days"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{isArabic ? "كل الأيام" : "All days"}</SelectItem>
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {getDayLabel(day)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{isArabic ? "من" : "Start Time"}</Label>
                    <Input
                      type="time"
                      value={formData.startTime || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isArabic ? "إلى" : "End Time"}</Label>
                    <Input
                      type="time"
                      value={formData.endTime || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? "الأولوية" : "Priority"}</Label>
                  <Input
                    type="number"
                    value={formData.priority ?? 0}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {isArabic
                      ? "القواعد ذات الأولوية الأعلى تطبق أولاً"
                      : "Higher priority rules are applied first"}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  {isArabic ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending
                    ? isArabic ? "جارٍ الإضافة..." : "Adding..."
                    : isArabic ? "إضافة" : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "قائمة القواعد" : "Rules List"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : rulesPage?.content.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {isArabic ? "لا توجد قواعد" : "No rules found"}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isArabic ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isArabic ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{isArabic ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isArabic ? "اليوم" : "Day"}</TableHead>
                    <TableHead>{isArabic ? "الوقت" : "Time"}</TableHead>
                    <TableHead>{isArabic ? "الأولوية" : "Priority"}</TableHead>
                    <TableHead>{isArabic ? "إجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rulesPage?.content.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        {rule.isActive ? (
                          <Badge className="bg-green-500">{isArabic ? "نشط" : "Active"}</Badge>
                        ) : (
                          <Badge variant="secondary">{isArabic ? "غير نشط" : "Inactive"}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {isArabic && rule.nameAr ? rule.nameAr : rule.name}
                      </TableCell>
                      <TableCell>
                        {rule.accessType === "ALLOW" ? (
                          <Badge className="bg-green-500">
                            <Check className="h-3 w-3 me-1" />
                            {isArabic ? "سماح" : "Allow"}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <X className="h-3 w-3 me-1" />
                            {isArabic ? "حظر" : "Deny"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getDayLabel(rule.dayOfWeek)}</TableCell>
                      <TableCell className="font-mono">
                        {rule.startTime} - {rule.endTime}
                      </TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(rule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {rulesPage && rulesPage.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    {isArabic
                      ? `صفحة ${page + 1} من ${rulesPage.totalPages}`
                      : `Page ${page + 1} of ${rulesPage.totalPages}`}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={rulesPage.first}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={rulesPage.last}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isArabic ? "تعديل القاعدة" : "Edit Rule"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isArabic ? "اسم القاعدة" : "Rule Name"}</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الاسم بالعربية" : "Arabic Name"}</Label>
                <Input
                  value={formData.nameAr || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, nameAr: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{isArabic ? "يوم الأسبوع" : "Day of Week"}</Label>
                <Select
                  value={formData.dayOfWeek?.toString() ?? ""}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      dayOfWeek: v ? parseInt(v) : undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isArabic ? "كل الأيام" : "All days"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{isArabic ? "كل الأيام" : "All days"}</SelectItem>
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {getDayLabel(day)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "من" : "Start Time"}</Label>
                <Input
                  type="time"
                  value={formData.startTime || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "إلى" : "End Time"}</Label>
                <Input
                  type="time"
                  value={formData.endTime || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label>{isArabic ? "نشط" : "Active"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRule(null)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending
                ? isArabic ? "جارٍ الحفظ..." : "Saving..."
                : isArabic ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
