"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Plus,
  Edit,
  Trash2,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useDevices,
  useZones,
  useCreateDevice,
  useUpdateDevice,
  useDeleteDevice,
} from "@/queries/use-access-control";
import {
  DEVICE_TYPE_LABELS,
  DEVICE_TYPE_LABELS_AR,
  DEVICE_STATUS_LABELS,
  DEVICE_STATUS_LABELS_AR,
  type DeviceType,
  type DeviceDirection,
  type DeviceStatus,
  type CreateDeviceRequest,
  type AccessDevice,
} from "@/types/access-control";

export default function DevicesPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [page, setPage] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CreateDeviceRequest>>({
    deviceType: "TURNSTILE",
    direction: "BIDIRECTIONAL",
  });

  const { data: devicesPage, isLoading } = useDevices(page, 20);
  const { data: zonesPage } = useZones(0, 100);
  const createMutation = useCreateDevice();
  const updateMutation = useUpdateDevice();
  const deleteMutation = useDeleteDevice();

  const deviceTypes: DeviceType[] = [
    "TURNSTILE",
    "SPEED_GATE",
    "BIOMETRIC_TERMINAL",
    "RFID_READER",
    "QR_SCANNER",
  ];

  const directions: DeviceDirection[] = ["ENTRY", "EXIT", "BIDIRECTIONAL"];

  const getTypeLabel = (type: DeviceType) =>
    isArabic ? DEVICE_TYPE_LABELS_AR[type] : DEVICE_TYPE_LABELS[type];

  const getStatusLabel = (status: DeviceStatus) =>
    isArabic ? DEVICE_STATUS_LABELS_AR[status] : DEVICE_STATUS_LABELS[status];

  const handleCreate = () => {
    if (!formData.locationId || !formData.deviceName || !formData.deviceType) return;

    createMutation.mutate(formData as CreateDeviceRequest, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setFormData({ deviceType: "TURNSTILE", direction: "BIDIRECTIONAL" });
      },
    });
  };

  const handleUpdate = () => {
    if (!editingDevice) return;

    updateMutation.mutate(
      { id: editingDevice, data: formData },
      {
        onSuccess: () => {
          setEditingDevice(null);
          setFormData({ deviceType: "TURNSTILE", direction: "BIDIRECTIONAL" });
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm(isArabic ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (device: AccessDevice) => {
    setFormData({
      deviceName: device.deviceName,
      deviceNameAr: device.deviceNameAr ?? undefined,
      deviceType: device.deviceType,
      direction: device.direction,
      ipAddress: device.ipAddress ?? undefined,
      zoneId: device.zoneId ?? undefined,
    });
    setEditingDevice(device.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic ? "أجهزة التحكم في الوصول" : "Access Control Devices"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إدارة البوابات والأجهزة البيومترية"
              : "Manage turnstiles and biometric devices"}
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
                {isArabic ? "إضافة جهاز" : "Add Device"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {isArabic ? "إضافة جهاز جديد" : "Add New Device"}
                </DialogTitle>
                <DialogDescription>
                  {isArabic
                    ? "أدخل تفاصيل الجهاز الجديد"
                    : "Enter the details of the new device"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isArabic ? "اسم الجهاز" : "Device Name"}</Label>
                    <Input
                      value={formData.deviceName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, deviceName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isArabic ? "الاسم بالعربية" : "Arabic Name"}</Label>
                    <Input
                      value={formData.deviceNameAr || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, deviceNameAr: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isArabic ? "نوع الجهاز" : "Device Type"}</Label>
                    <Select
                      value={formData.deviceType}
                      onValueChange={(v) =>
                        setFormData({ ...formData, deviceType: v as DeviceType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {getTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{isArabic ? "الاتجاه" : "Direction"}</Label>
                    <Select
                      value={formData.direction}
                      onValueChange={(v) =>
                        setFormData({ ...formData, direction: v as DeviceDirection })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {directions.map((dir) => (
                          <SelectItem key={dir} value={dir}>
                            {dir}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isArabic ? "عنوان IP" : "IP Address"}</Label>
                    <Input
                      value={formData.ipAddress || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, ipAddress: e.target.value })
                      }
                      placeholder="192.168.1.100"
                    />
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
                        <SelectValue placeholder={isArabic ? "اختر منطقة" : "Select zone"} />
                      </SelectTrigger>
                      <SelectContent>
                        {zonesPage?.content.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {isArabic && zone.nameAr ? zone.nameAr : zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "قائمة الأجهزة" : "Devices List"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : devicesPage?.content.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {isArabic ? "لا توجد أجهزة" : "No devices found"}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isArabic ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isArabic ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{isArabic ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isArabic ? "الاتجاه" : "Direction"}</TableHead>
                    <TableHead>{isArabic ? "عنوان IP" : "IP Address"}</TableHead>
                    <TableHead>{isArabic ? "آخر اتصال" : "Last Heartbeat"}</TableHead>
                    <TableHead>{isArabic ? "إجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devicesPage?.content.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        {device.isOnline ? (
                          <Badge className="bg-green-500">
                            <Wifi className="h-3 w-3 me-1" />
                            {isArabic ? "متصل" : "Online"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <WifiOff className="h-3 w-3 me-1" />
                            {isArabic ? "غير متصل" : "Offline"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {isArabic && device.deviceNameAr
                          ? device.deviceNameAr
                          : device.deviceName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTypeLabel(device.deviceType)}</Badge>
                      </TableCell>
                      <TableCell>{device.direction}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {device.ipAddress || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {device.lastHeartbeat
                          ? new Date(device.lastHeartbeat).toLocaleString(
                              isArabic ? "ar-SA" : "en-US"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(device)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(device.id)}
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
              {devicesPage && devicesPage.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    {isArabic
                      ? `صفحة ${page + 1} من ${devicesPage.totalPages}`
                      : `Page ${page + 1} of ${devicesPage.totalPages}`}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={devicesPage.first}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={devicesPage.last}
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
      <Dialog open={!!editingDevice} onOpenChange={() => setEditingDevice(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isArabic ? "تعديل الجهاز" : "Edit Device"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isArabic ? "اسم الجهاز" : "Device Name"}</Label>
                <Input
                  value={formData.deviceName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, deviceName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الاسم بالعربية" : "Arabic Name"}</Label>
                <Input
                  value={formData.deviceNameAr || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, deviceNameAr: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isArabic ? "الاتجاه" : "Direction"}</Label>
                <Select
                  value={formData.direction}
                  onValueChange={(v) =>
                    setFormData({ ...formData, direction: v as DeviceDirection })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {directions.map((dir) => (
                      <SelectItem key={dir} value={dir}>
                        {dir}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "عنوان IP" : "IP Address"}</Label>
                <Input
                  value={formData.ipAddress || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, ipAddress: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDevice(null)}>
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
