"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useZones,
  useAllOccupancies,
  useCreateZone,
  useUpdateZone,
  useDeleteZone,
} from "@/queries/use-access-control";
import {
  ZONE_TYPE_LABELS,
  ZONE_TYPE_LABELS_AR,
  type ZoneType,
  type GenderRestriction,
  type CreateZoneRequest,
  type AccessZone,
} from "@/types/access-control";

export default function ZonesPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [page, setPage] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CreateZoneRequest>>({
    zoneType: "GYM_FLOOR",
  });

  const { data: zonesPage, isLoading } = useZones(page, 20);
  const { data: occupancies } = useAllOccupancies();
  const createMutation = useCreateZone();
  const updateMutation = useUpdateZone();
  const deleteMutation = useDeleteZone();

  const zoneTypes: ZoneType[] = [
    "GYM_FLOOR",
    "LOCKER_ROOM",
    "POOL",
    "STUDIO",
    "SPA",
    "RESTRICTED",
    "LOBBY",
    "CAFE",
    "KIDS_AREA",
  ];

  const genderOptions: (GenderRestriction | "")[] = ["", "MALE", "FEMALE"];

  const getTypeLabel = (type: ZoneType) =>
    isArabic ? ZONE_TYPE_LABELS_AR[type] : ZONE_TYPE_LABELS[type];

  const handleCreate = () => {
    if (!formData.locationId || !formData.name || !formData.zoneType) return;

    createMutation.mutate(formData as CreateZoneRequest, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setFormData({ zoneType: "GYM_FLOOR" });
      },
    });
  };

  const handleUpdate = () => {
    if (!editingZone) return;

    updateMutation.mutate(
      { id: editingZone, data: formData },
      {
        onSuccess: () => {
          setEditingZone(null);
          setFormData({ zoneType: "GYM_FLOOR" });
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm(isArabic ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (zone: AccessZone) => {
    setFormData({
      name: zone.name,
      nameAr: zone.nameAr ?? undefined,
      zoneType: zone.zoneType,
      maxOccupancy: zone.maxOccupancy ?? undefined,
      genderRestriction: zone.genderRestriction ?? undefined,
      isActive: zone.isActive,
    });
    setEditingZone(zone.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic ? "مناطق الوصول" : "Access Zones"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "تحديد مناطق المنشأة والسعة القصوى"
              : "Define facility zones and maximum capacity"}
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
                {isArabic ? "إضافة منطقة" : "Add Zone"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {isArabic ? "إضافة منطقة جديدة" : "Add New Zone"}
                </DialogTitle>
                <DialogDescription>
                  {isArabic
                    ? "أدخل تفاصيل المنطقة الجديدة"
                    : "Enter the details of the new zone"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isArabic ? "اسم المنطقة" : "Zone Name"}</Label>
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
                    <Label>{isArabic ? "نوع المنطقة" : "Zone Type"}</Label>
                    <Select
                      value={formData.zoneType}
                      onValueChange={(v) =>
                        setFormData({ ...formData, zoneType: v as ZoneType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {zoneTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {getTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{isArabic ? "السعة القصوى" : "Max Occupancy"}</Label>
                    <Input
                      type="number"
                      value={formData.maxOccupancy || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxOccupancy: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isArabic ? "قيد الجنس" : "Gender Restriction"}</Label>
                    <Select
                      value={formData.genderRestriction || ""}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          genderRestriction: v ? (v as GenderRestriction) : undefined,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isArabic ? "بدون قيد" : "No restriction"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{isArabic ? "بدون قيد" : "No restriction"}</SelectItem>
                        <SelectItem value="MALE">{isArabic ? "رجال فقط" : "Male Only"}</SelectItem>
                        <SelectItem value="FEMALE">{isArabic ? "نساء فقط" : "Female Only"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{isArabic ? "معرف الموقع" : "Location ID"}</Label>
                    <Input
                      value={formData.locationId || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, locationId: e.target.value })
                      }
                      placeholder="UUID"
                    />
                  </div>
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

      {/* Zones Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "قائمة المناطق" : "Zones List"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : zonesPage?.content.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {isArabic ? "لا توجد مناطق" : "No zones found"}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isArabic ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isArabic ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{isArabic ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isArabic ? "الإشغال" : "Occupancy"}</TableHead>
                    <TableHead>{isArabic ? "السعة القصوى" : "Max Capacity"}</TableHead>
                    <TableHead>{isArabic ? "قيد الجنس" : "Gender"}</TableHead>
                    <TableHead>{isArabic ? "إجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zonesPage?.content.map((zone) => {
                    const occupancy = occupancies?.find((o) => o.zoneId === zone.id);
                    const percentage = zone.maxOccupancy
                      ? Math.round(((occupancy?.currentCount ?? 0) / zone.maxOccupancy) * 100)
                      : null;

                    return (
                      <TableRow key={zone.id}>
                        <TableCell>
                          {zone.isActive ? (
                            <Badge className="bg-green-500">{isArabic ? "نشط" : "Active"}</Badge>
                          ) : (
                            <Badge variant="secondary">{isArabic ? "غير نشط" : "Inactive"}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {isArabic && zone.nameAr ? zone.nameAr : zone.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTypeLabel(zone.zoneType)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{occupancy?.currentCount ?? 0}</span>
                            {percentage !== null && (
                              <span
                                className={`text-xs ${
                                  percentage > 90
                                    ? "text-destructive"
                                    : percentage > 70
                                    ? "text-yellow-500"
                                    : "text-green-500"
                                }`}
                              >
                                ({percentage}%)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{zone.maxOccupancy ?? "-"}</TableCell>
                        <TableCell>
                          {zone.genderRestriction
                            ? zone.genderRestriction === "MALE"
                              ? isArabic ? "رجال" : "Male"
                              : isArabic ? "نساء" : "Female"
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(zone)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(zone.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {zonesPage && zonesPage.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    {isArabic
                      ? `صفحة ${page + 1} من ${zonesPage.totalPages}`
                      : `Page ${page + 1} of ${zonesPage.totalPages}`}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={zonesPage.first}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={zonesPage.last}
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
      <Dialog open={!!editingZone} onOpenChange={() => setEditingZone(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isArabic ? "تعديل المنطقة" : "Edit Zone"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isArabic ? "اسم المنطقة" : "Zone Name"}</Label>
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
                <Label>{isArabic ? "السعة القصوى" : "Max Occupancy"}</Label>
                <Input
                  type="number"
                  value={formData.maxOccupancy || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxOccupancy: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "قيد الجنس" : "Gender Restriction"}</Label>
                <Select
                  value={formData.genderRestriction || ""}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      genderRestriction: v ? (v as GenderRestriction) : undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isArabic ? "بدون قيد" : "No restriction"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{isArabic ? "بدون قيد" : "No restriction"}</SelectItem>
                    <SelectItem value="MALE">{isArabic ? "رجال فقط" : "Male Only"}</SelectItem>
                    <SelectItem value="FEMALE">{isArabic ? "نساء فقط" : "Female Only"}</SelectItem>
                  </SelectContent>
                </Select>
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
            <Button variant="outline" onClick={() => setEditingZone(null)}>
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
