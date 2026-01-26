"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Plus,
  Monitor,
  Activity,
  Settings,
  Trash2,
  Edit,
  Power,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  useKioskDevices,
  useCreateKioskDevice,
  useUpdateKioskDevice,
  useDeleteKioskDevice,
} from "@/queries/use-kiosk";
import { useLocations } from "@/queries/use-locations";
import type { KioskDevice, KioskStatus, KioskAction } from "@/types/kiosk";
import {
  KIOSK_STATUS_LABELS,
  KIOSK_STATUS_LABELS_AR,
  KIOSK_ACTION_LABELS,
  KIOSK_ACTION_LABELS_AR,
} from "@/types/kiosk";

const ALL_ACTIONS: KioskAction[] = [
  "CHECK_IN",
  "CLASS_BOOKING",
  "PAYMENT",
  "MEMBERSHIP_VIEW",
  "AGREEMENT_SIGN",
  "PROFILE_UPDATE",
  "RECEIPT_PRINT",
];

export default function KioskSettingsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<KioskDevice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: devicesData, isLoading } = useKioskDevices(page, 20);
  const { data: locationsData } = useLocations({ page: 0, size: 100 });
  const createMutation = useCreateKioskDevice();
  const updateMutation = useUpdateKioskDevice();
  const deleteMutation = useDeleteKioskDevice();

  const [formData, setFormData] = useState({
    locationId: "",
    deviceName: "",
    deviceNameAr: "",
    deviceCode: "",
    hardwareId: "",
    allowedActions: ALL_ACTIONS.slice(0, 3) as KioskAction[],
  });

  const statusLabels = isArabic ? KIOSK_STATUS_LABELS_AR : KIOSK_STATUS_LABELS;
  const actionLabels = isArabic ? KIOSK_ACTION_LABELS_AR : KIOSK_ACTION_LABELS;

  const getStatusBadge = (status: KioskStatus, isOnline: boolean) => {
    if (status === "MAINTENANCE") {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {statusLabels[status]}
        </Badge>
      );
    }
    if (status === "INACTIVE") {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
          <Power className="h-3 w-3 mr-1" />
          {statusLabels[status]}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className={
          isOnline
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"
        }
      >
        {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
        {isOnline ? (isArabic ? "متصل" : "Online") : (isArabic ? "غير متصل" : "Offline")}
      </Badge>
    );
  };

  const handleCreate = async () => {
    if (!formData.locationId || !formData.deviceName || !formData.deviceCode) {
      toast.error(isArabic ? "يرجى ملء الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    try {
      await createMutation.mutateAsync({
        locationId: formData.locationId,
        deviceName: formData.deviceName,
        deviceNameAr: formData.deviceNameAr || undefined,
        deviceCode: formData.deviceCode,
        hardwareId: formData.hardwareId || undefined,
        allowedActions: formData.allowedActions,
      });
      toast.success(isArabic ? "تم إنشاء الجهاز بنجاح" : "Device created successfully");
      setCreateOpen(false);
      resetForm();
    } catch {
      toast.error(isArabic ? "فشل في إنشاء الجهاز" : "Failed to create device");
    }
  };

  const handleUpdate = async () => {
    if (!editDevice) return;
    try {
      await updateMutation.mutateAsync({
        id: editDevice.id,
        data: {
          deviceName: formData.deviceName || undefined,
          deviceNameAr: formData.deviceNameAr || undefined,
          allowedActions: formData.allowedActions,
        },
      });
      toast.success(isArabic ? "تم تحديث الجهاز" : "Device updated");
      setEditDevice(null);
      resetForm();
    } catch {
      toast.error(isArabic ? "فشل في تحديث الجهاز" : "Failed to update device");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success(isArabic ? "تم حذف الجهاز" : "Device deleted");
      setDeleteId(null);
    } catch {
      toast.error(isArabic ? "فشل في حذف الجهاز" : "Failed to delete device");
    }
  };

  const handleStatusChange = async (device: KioskDevice, status: KioskStatus) => {
    try {
      await updateMutation.mutateAsync({
        id: device.id,
        data: { status },
      });
      toast.success(isArabic ? "تم تحديث الحالة" : "Status updated");
    } catch {
      toast.error(isArabic ? "فشل في تحديث الحالة" : "Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      locationId: "",
      deviceName: "",
      deviceNameAr: "",
      deviceCode: "",
      hardwareId: "",
      allowedActions: ALL_ACTIONS.slice(0, 3),
    });
  };

  const openEdit = (device: KioskDevice) => {
    setFormData({
      locationId: device.locationId,
      deviceName: device.deviceName,
      deviceNameAr: device.deviceNameAr || "",
      deviceCode: device.deviceCode,
      hardwareId: device.hardwareId || "",
      allowedActions: (device.allowedActions as KioskAction[]) || ALL_ACTIONS.slice(0, 3),
    });
    setEditDevice(device);
  };

  const toggleAction = (action: KioskAction) => {
    setFormData((prev) => ({
      ...prev,
      allowedActions: prev.allowedActions.includes(action)
        ? prev.allowedActions.filter((a) => a !== action)
        : [...prev.allowedActions, action],
    }));
  };

  const devices = devicesData?.content || [];
  const locations = locationsData?.content || [];
  const onlineCount = devices.filter((d) => d.isOnline).length;
  const activeCount = devices.filter((d) => d.status === "ACTIVE").length;
  const maintenanceCount = devices.filter((d) => d.status === "MAINTENANCE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isArabic ? "إدارة أجهزة الكيوسك" : "Kiosk Device Management"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إدارة أجهزة الخدمة الذاتية في مواقعك"
              : "Manage self-service kiosk devices across your locations"}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? "إضافة جهاز" : "Add Device"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{isArabic ? "إضافة جهاز كيوسك جديد" : "Add New Kiosk Device"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{isArabic ? "الموقع" : "Location"} *</Label>
                <Select
                  value={formData.locationId}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, locationId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isArabic ? "اختر موقع" : "Select location"} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {isArabic ? loc.name.ar || loc.name.en : loc.name.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isArabic ? "اسم الجهاز" : "Device Name"} *</Label>
                  <Input
                    value={formData.deviceName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deviceName: e.target.value }))}
                    placeholder={isArabic ? "كيوسك الاستقبال" : "Reception Kiosk"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? "اسم الجهاز (عربي)" : "Device Name (Arabic)"}</Label>
                  <Input
                    value={formData.deviceNameAr}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deviceNameAr: e.target.value }))}
                    placeholder="كيوسك الاستقبال"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isArabic ? "رمز الجهاز" : "Device Code"} *</Label>
                  <Input
                    value={formData.deviceCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deviceCode: e.target.value.toUpperCase() }))}
                    placeholder="KIOSK-001"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? "معرف الأجهزة" : "Hardware ID"}</Label>
                  <Input
                    value={formData.hardwareId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hardwareId: e.target.value }))}
                    placeholder="MAC / Serial"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الإجراءات المسموحة" : "Allowed Actions"}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ACTIONS.map((action) => (
                    <div key={action} className="flex items-center space-x-2">
                      <Checkbox
                        id={action}
                        checked={formData.allowedActions.includes(action)}
                        onCheckedChange={() => toggleAction(action)}
                      />
                      <label htmlFor={action} className="text-sm cursor-pointer">
                        {actionLabels[action]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? isArabic ? "جاري الإنشاء..." : "Creating..."
                  : isArabic ? "إنشاء" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "إجمالي الأجهزة" : "Total Devices"}
                </p>
                <p className="text-2xl font-bold">{devices.length}</p>
              </div>
              <Monitor className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "متصل الآن" : "Online Now"}
                </p>
                <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
              </div>
              <Wifi className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "نشط" : "Active"}
                </p>
                <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "صيانة" : "Maintenance"}
                </p>
                <p className="text-2xl font-bold text-yellow-600">{maintenanceCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "الأجهزة" : "Devices"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {isArabic ? "جاري التحميل..." : "Loading..."}
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isArabic ? "لا توجد أجهزة" : "No devices found"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isArabic ? "الجهاز" : "Device"}</TableHead>
                  <TableHead>{isArabic ? "الرمز" : "Code"}</TableHead>
                  <TableHead>{isArabic ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isArabic ? "آخر نبضة" : "Last Heartbeat"}</TableHead>
                  <TableHead>{isArabic ? "الإجراءات" : "Actions"}</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {isArabic ? device.deviceNameAr || device.deviceName : device.deviceName}
                        </p>
                        {device.hardwareId && (
                          <p className="text-xs text-muted-foreground">{device.hardwareId}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-sm">{device.deviceCode}</code>
                    </TableCell>
                    <TableCell>{getStatusBadge(device.status, device.isOnline)}</TableCell>
                    <TableCell>
                      {device.lastHeartbeat ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(device.lastHeartbeat).toLocaleString(locale)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(device.allowedActions || []).slice(0, 3).map((action) => (
                          <Badge key={action} variant="secondary" className="text-xs">
                            {actionLabels[action as KioskAction] || action}
                          </Badge>
                        ))}
                        {(device.allowedActions || []).length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(device.allowedActions || []).length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={device.status}
                          onValueChange={(v) => handleStatusChange(device, v as KioskStatus)}
                        >
                          <SelectTrigger className="w-[100px] h-8">
                            <Settings className="h-3 w-3" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">{statusLabels.ACTIVE}</SelectItem>
                            <SelectItem value="INACTIVE">{statusLabels.INACTIVE}</SelectItem>
                            <SelectItem value="MAINTENANCE">{statusLabels.MAINTENANCE}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(device)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(device.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {devicesData && devicesData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? `عرض ${devices.length} من ${devicesData.totalElements}`
                  : `Showing ${devices.length} of ${devicesData.totalElements}`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={devicesData.first}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {isArabic ? "السابق" : "Previous"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={devicesData.last}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {isArabic ? "التالي" : "Next"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editDevice} onOpenChange={(open) => !open && setEditDevice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isArabic ? "تعديل الجهاز" : "Edit Device"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isArabic ? "اسم الجهاز" : "Device Name"}</Label>
                <Input
                  value={formData.deviceName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deviceName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "اسم الجهاز (عربي)" : "Device Name (Arabic)"}</Label>
                <Input
                  value={formData.deviceNameAr}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deviceNameAr: e.target.value }))}
                  dir="rtl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isArabic ? "الإجراءات المسموحة" : "Allowed Actions"}</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_ACTIONS.map((action) => (
                  <div key={action} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${action}`}
                      checked={formData.allowedActions.includes(action)}
                      onCheckedChange={() => toggleAction(action)}
                    />
                    <label htmlFor={`edit-${action}`} className="text-sm cursor-pointer">
                      {actionLabels[action]}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDevice(null)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending
                ? isArabic ? "جاري الحفظ..." : "Saving..."
                : isArabic ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArabic ? "هل أنت متأكد؟" : "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? "سيتم حذف هذا الجهاز نهائياً. لا يمكن التراجع عن هذا الإجراء."
                : "This device will be permanently deleted. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isArabic ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
