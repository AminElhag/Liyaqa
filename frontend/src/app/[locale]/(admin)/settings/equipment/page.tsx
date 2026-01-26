"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Plus,
  Settings,
  Dumbbell,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  Edit,
  Link,
  CheckCircle,
  AlertCircle,
  Clock,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  useEquipmentProviders,
  useProviderConfigs,
  useCreateProviderConfig,
  useDeleteProviderConfig,
  useEquipmentUnits,
  useCreateEquipmentUnit,
  useUpdateEquipmentUnit,
  useDeleteEquipmentUnit,
  useStartSync,
} from "@/queries/use-equipment";
import { useLocations } from "@/queries/use-locations";
import type {
  EquipmentType,
  EquipmentStatus,
  EquipmentUnit,
} from "@/types/equipment";
import {
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_TYPE_LABELS_AR,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_LABELS_AR,
} from "@/types/equipment";

const EQUIPMENT_TYPES: EquipmentType[] = [
  "TREADMILL",
  "ELLIPTICAL",
  "BIKE",
  "SPIN_BIKE",
  "ROWER",
  "STAIR_CLIMBER",
  "CROSS_TRAINER",
  "STRENGTH_MACHINE",
  "FREE_WEIGHTS",
  "CABLE_MACHINE",
  "SMITH_MACHINE",
  "OTHER",
];

export default function EquipmentSettingsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [activeTab, setActiveTab] = useState("units");
  const [page, setPage] = useState(0);
  const [configPage, setConfigPage] = useState(0);
  const [createUnitOpen, setCreateUnitOpen] = useState(false);
  const [createConfigOpen, setCreateConfigOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<EquipmentUnit | null>(null);
  const [deleteUnitId, setDeleteUnitId] = useState<string | null>(null);
  const [deleteConfigId, setDeleteConfigId] = useState<string | null>(null);

  const { data: providers } = useEquipmentProviders();
  const { data: configsData, isLoading: configsLoading } = useProviderConfigs(configPage, 20);
  const { data: unitsData, isLoading: unitsLoading } = useEquipmentUnits(page, 50);
  const { data: locationsData } = useLocations({ page: 0, size: 100 });

  const createConfigMutation = useCreateProviderConfig();
  const deleteConfigMutation = useDeleteProviderConfig();
  const createUnitMutation = useCreateEquipmentUnit();
  const updateUnitMutation = useUpdateEquipmentUnit();
  const deleteUnitMutation = useDeleteEquipmentUnit();
  const startSyncMutation = useStartSync();

  const [unitForm, setUnitForm] = useState({
    locationId: "",
    providerId: "",
    equipmentType: "" as EquipmentType | "",
    name: "",
    nameAr: "",
    model: "",
    serialNumber: "",
    manufacturer: "",
    zone: "",
  });

  const [configForm, setConfigForm] = useState({
    providerId: "",
    apiKey: "",
    apiSecret: "",
    oauthClientId: "",
    oauthClientSecret: "",
    syncIntervalMinutes: 60,
  });

  const typeLabels = isArabic ? EQUIPMENT_TYPE_LABELS_AR : EQUIPMENT_TYPE_LABELS;
  const statusLabels = isArabic ? EQUIPMENT_STATUS_LABELS_AR : EQUIPMENT_STATUS_LABELS;

  const configs = configsData?.content || [];
  const units = unitsData?.content || [];
  const locations = locationsData?.content || [];

  const connectedCount = units.filter((u) => u.isConnected).length;
  const activeCount = units.filter((u) => u.status === "ACTIVE").length;
  const maintenanceCount = units.filter((u) => u.status === "MAINTENANCE").length;

  const getStatusBadge = (status: EquipmentStatus, isConnected: boolean) => {
    if (status === "MAINTENANCE") {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          {statusLabels[status]}
        </Badge>
      );
    }
    if (status === "OFFLINE" || status === "RETIRED") {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
          {statusLabels[status]}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className={
          isConnected
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-gray-50 text-gray-600 border-gray-200"
        }
      >
        {isConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
        {isConnected ? (isArabic ? "متصل" : "Connected") : (isArabic ? "غير متصل" : "Disconnected")}
      </Badge>
    );
  };

  const handleCreateUnit = async () => {
    if (!unitForm.locationId || !unitForm.providerId || !unitForm.equipmentType || !unitForm.name) {
      toast.error(isArabic ? "يرجى ملء الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    try {
      await createUnitMutation.mutateAsync({
        locationId: unitForm.locationId,
        providerId: unitForm.providerId,
        equipmentType: unitForm.equipmentType as EquipmentType,
        name: unitForm.name,
        nameAr: unitForm.nameAr || undefined,
        model: unitForm.model || undefined,
        serialNumber: unitForm.serialNumber || undefined,
        manufacturer: unitForm.manufacturer || undefined,
        zone: unitForm.zone || undefined,
      });
      toast.success(isArabic ? "تم إضافة المعدات" : "Equipment added");
      setCreateUnitOpen(false);
      resetUnitForm();
    } catch {
      toast.error(isArabic ? "فشل في إضافة المعدات" : "Failed to add equipment");
    }
  };

  const handleUpdateUnit = async () => {
    if (!editUnit) return;
    try {
      await updateUnitMutation.mutateAsync({
        id: editUnit.id,
        data: {
          name: unitForm.name || undefined,
          nameAr: unitForm.nameAr || undefined,
          equipmentType: unitForm.equipmentType as EquipmentType || undefined,
          model: unitForm.model || undefined,
          serialNumber: unitForm.serialNumber || undefined,
          zone: unitForm.zone || undefined,
        },
      });
      toast.success(isArabic ? "تم تحديث المعدات" : "Equipment updated");
      setEditUnit(null);
      resetUnitForm();
    } catch {
      toast.error(isArabic ? "فشل في تحديث المعدات" : "Failed to update equipment");
    }
  };

  const handleDeleteUnit = async () => {
    if (!deleteUnitId) return;
    try {
      await deleteUnitMutation.mutateAsync(deleteUnitId);
      toast.success(isArabic ? "تم حذف المعدات" : "Equipment deleted");
      setDeleteUnitId(null);
    } catch {
      toast.error(isArabic ? "فشل في حذف المعدات" : "Failed to delete equipment");
    }
  };

  const handleCreateConfig = async () => {
    if (!configForm.providerId) {
      toast.error(isArabic ? "يرجى اختيار مزود" : "Please select a provider");
      return;
    }
    try {
      await createConfigMutation.mutateAsync({
        providerId: configForm.providerId,
        apiKey: configForm.apiKey || undefined,
        apiSecret: configForm.apiSecret || undefined,
        oauthClientId: configForm.oauthClientId || undefined,
        oauthClientSecret: configForm.oauthClientSecret || undefined,
        syncIntervalMinutes: configForm.syncIntervalMinutes,
      });
      toast.success(isArabic ? "تم إضافة التكوين" : "Configuration added");
      setCreateConfigOpen(false);
      resetConfigForm();
    } catch {
      toast.error(isArabic ? "فشل في إضافة التكوين" : "Failed to add configuration");
    }
  };

  const handleDeleteConfig = async () => {
    if (!deleteConfigId) return;
    try {
      await deleteConfigMutation.mutateAsync(deleteConfigId);
      toast.success(isArabic ? "تم حذف التكوين" : "Configuration deleted");
      setDeleteConfigId(null);
    } catch {
      toast.error(isArabic ? "فشل في حذف التكوين" : "Failed to delete configuration");
    }
  };

  const handleSync = async (configId: string) => {
    try {
      await startSyncMutation.mutateAsync({ configId });
      toast.success(isArabic ? "بدأت المزامنة" : "Sync started");
    } catch {
      toast.error(isArabic ? "فشل في بدء المزامنة" : "Failed to start sync");
    }
  };

  const resetUnitForm = () => {
    setUnitForm({
      locationId: "",
      providerId: "",
      equipmentType: "",
      name: "",
      nameAr: "",
      model: "",
      serialNumber: "",
      manufacturer: "",
      zone: "",
    });
  };

  const resetConfigForm = () => {
    setConfigForm({
      providerId: "",
      apiKey: "",
      apiSecret: "",
      oauthClientId: "",
      oauthClientSecret: "",
      syncIntervalMinutes: 60,
    });
  };

  const openEditUnit = (unit: EquipmentUnit) => {
    setUnitForm({
      locationId: unit.locationId,
      providerId: unit.providerId,
      equipmentType: unit.equipmentType,
      name: unit.name,
      nameAr: unit.nameAr || "",
      model: unit.model || "",
      serialNumber: unit.serialNumber || "",
      manufacturer: unit.manufacturer || "",
      zone: unit.zone || "",
    });
    setEditUnit(unit);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isArabic ? "تكامل المعدات" : "Equipment Integration"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إدارة أجهزة اللياقة المتصلة وتكامل المزودين"
              : "Manage connected fitness equipment and provider integrations"}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "إجمالي المعدات" : "Total Equipment"}
                </p>
                <p className="text-2xl font-bold">{units.length}</p>
              </div>
              <Dumbbell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "متصل" : "Connected"}
                </p>
                <p className="text-2xl font-bold text-green-600">{connectedCount}</p>
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
                  {isArabic ? "مزودين متصلين" : "Providers"}
                </p>
                <p className="text-2xl font-bold text-purple-600">{configs.length}</p>
              </div>
              <Link className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="units">
            {isArabic ? "المعدات" : "Equipment Units"}
          </TabsTrigger>
          <TabsTrigger value="providers">
            {isArabic ? "المزودين" : "Providers"}
          </TabsTrigger>
        </TabsList>

        {/* Equipment Units Tab */}
        <TabsContent value="units">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{isArabic ? "المعدات" : "Equipment Units"}</CardTitle>
              <Dialog open={createUnitOpen} onOpenChange={setCreateUnitOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetUnitForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isArabic ? "إضافة معدات" : "Add Equipment"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{isArabic ? "إضافة معدات جديدة" : "Add New Equipment"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isArabic ? "الموقع" : "Location"} *</Label>
                        <Select
                          value={unitForm.locationId}
                          onValueChange={(v) => setUnitForm((f) => ({ ...f, locationId: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isArabic ? "اختر" : "Select"} />
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
                      <div className="space-y-2">
                        <Label>{isArabic ? "المزود" : "Provider"} *</Label>
                        <Select
                          value={unitForm.providerId}
                          onValueChange={(v) => setUnitForm((f) => ({ ...f, providerId: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isArabic ? "اختر" : "Select"} />
                          </SelectTrigger>
                          <SelectContent>
                            {providers?.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{isArabic ? "نوع المعدات" : "Equipment Type"} *</Label>
                      <Select
                        value={unitForm.equipmentType}
                        onValueChange={(v) => setUnitForm((f) => ({ ...f, equipmentType: v as EquipmentType }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isArabic ? "اختر" : "Select"} />
                        </SelectTrigger>
                        <SelectContent>
                          {EQUIPMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {typeLabels[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isArabic ? "الاسم" : "Name"} *</Label>
                        <Input
                          value={unitForm.name}
                          onChange={(e) => setUnitForm((f) => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{isArabic ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                        <Input
                          value={unitForm.nameAr}
                          onChange={(e) => setUnitForm((f) => ({ ...f, nameAr: e.target.value }))}
                          dir="rtl"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isArabic ? "الموديل" : "Model"}</Label>
                        <Input
                          value={unitForm.model}
                          onChange={(e) => setUnitForm((f) => ({ ...f, model: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{isArabic ? "الرقم التسلسلي" : "Serial Number"}</Label>
                        <Input
                          value={unitForm.serialNumber}
                          onChange={(e) => setUnitForm((f) => ({ ...f, serialNumber: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isArabic ? "الشركة المصنعة" : "Manufacturer"}</Label>
                        <Input
                          value={unitForm.manufacturer}
                          onChange={(e) => setUnitForm((f) => ({ ...f, manufacturer: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{isArabic ? "المنطقة" : "Zone"}</Label>
                        <Input
                          value={unitForm.zone}
                          onChange={(e) => setUnitForm((f) => ({ ...f, zone: e.target.value }))}
                          placeholder={isArabic ? "مثال: الطابق 1 - كارديو" : "e.g., Floor 1 - Cardio"}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateUnitOpen(false)}>
                      {isArabic ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button onClick={handleCreateUnit} disabled={createUnitMutation.isPending}>
                      {createUnitMutation.isPending
                        ? isArabic ? "جاري الإضافة..." : "Adding..."
                        : isArabic ? "إضافة" : "Add"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {unitsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isArabic ? "جاري التحميل..." : "Loading..."}
                </div>
              ) : units.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isArabic ? "لا توجد معدات" : "No equipment found"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isArabic ? "المعدات" : "Equipment"}</TableHead>
                      <TableHead>{isArabic ? "النوع" : "Type"}</TableHead>
                      <TableHead>{isArabic ? "المزود" : "Provider"}</TableHead>
                      <TableHead>{isArabic ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isArabic ? "المنطقة" : "Zone"}</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {isArabic ? unit.nameAr || unit.name : unit.name}
                            </p>
                            {unit.model && (
                              <p className="text-xs text-muted-foreground">{unit.model}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{typeLabels[unit.equipmentType]}</Badge>
                        </TableCell>
                        <TableCell>{unit.providerName || "-"}</TableCell>
                        <TableCell>{getStatusBadge(unit.status, unit.isConnected)}</TableCell>
                        <TableCell>{unit.zone || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditUnit(unit)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteUnitId(unit.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{isArabic ? "تكوينات المزودين" : "Provider Configurations"}</CardTitle>
              <Dialog open={createConfigOpen} onOpenChange={setCreateConfigOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetConfigForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isArabic ? "إضافة مزود" : "Add Provider"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isArabic ? "إضافة تكوين مزود" : "Add Provider Configuration"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{isArabic ? "المزود" : "Provider"} *</Label>
                      <Select
                        value={configForm.providerId}
                        onValueChange={(v) => setConfigForm((f) => ({ ...f, providerId: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isArabic ? "اختر مزود" : "Select provider"} />
                        </SelectTrigger>
                        <SelectContent>
                          {providers?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{isArabic ? "مفتاح API" : "API Key"}</Label>
                      <Input
                        value={configForm.apiKey}
                        onChange={(e) => setConfigForm((f) => ({ ...f, apiKey: e.target.value }))}
                        type="password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isArabic ? "فترة المزامنة (دقائق)" : "Sync Interval (minutes)"}</Label>
                      <Input
                        type="number"
                        value={configForm.syncIntervalMinutes}
                        onChange={(e) => setConfigForm((f) => ({ ...f, syncIntervalMinutes: parseInt(e.target.value) || 60 }))}
                        min={5}
                        max={1440}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateConfigOpen(false)}>
                      {isArabic ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button onClick={handleCreateConfig} disabled={createConfigMutation.isPending}>
                      {createConfigMutation.isPending
                        ? isArabic ? "جاري الإضافة..." : "Adding..."
                        : isArabic ? "إضافة" : "Add"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {configsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isArabic ? "جاري التحميل..." : "Loading..."}
                </div>
              ) : configs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isArabic ? "لا توجد تكوينات" : "No configurations found"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isArabic ? "المزود" : "Provider"}</TableHead>
                      <TableHead>{isArabic ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isArabic ? "آخر مزامنة" : "Last Sync"}</TableHead>
                      <TableHead>{isArabic ? "فترة المزامنة" : "Sync Interval"}</TableHead>
                      <TableHead className="w-[150px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {configs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{config.providerName}</TableCell>
                        <TableCell>
                          {config.isActive ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {isArabic ? "نشط" : "Active"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                              {isArabic ? "غير نشط" : "Inactive"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {config.lastSyncAt ? (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(config.lastSyncAt).toLocaleString(locale)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {config.syncIntervalMinutes} {isArabic ? "دقيقة" : "min"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSync(config.id)}
                              disabled={startSyncMutation.isPending}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              {isArabic ? "مزامنة" : "Sync"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfigId(config.id)}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Unit Dialog */}
      <Dialog open={!!editUnit} onOpenChange={(open) => !open && setEditUnit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isArabic ? "تعديل المعدات" : "Edit Equipment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isArabic ? "الاسم" : "Name"}</Label>
                <Input
                  value={unitForm.name}
                  onChange={(e) => setUnitForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                <Input
                  value={unitForm.nameAr}
                  onChange={(e) => setUnitForm((f) => ({ ...f, nameAr: e.target.value }))}
                  dir="rtl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isArabic ? "نوع المعدات" : "Equipment Type"}</Label>
              <Select
                value={unitForm.equipmentType}
                onValueChange={(v) => setUnitForm((f) => ({ ...f, equipmentType: v as EquipmentType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isArabic ? "الموديل" : "Model"}</Label>
                <Input
                  value={unitForm.model}
                  onChange={(e) => setUnitForm((f) => ({ ...f, model: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "المنطقة" : "Zone"}</Label>
                <Input
                  value={unitForm.zone}
                  onChange={(e) => setUnitForm((f) => ({ ...f, zone: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUnit(null)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleUpdateUnit} disabled={updateUnitMutation.isPending}>
              {updateUnitMutation.isPending
                ? isArabic ? "جاري الحفظ..." : "Saving..."
                : isArabic ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Unit Confirmation */}
      <AlertDialog open={!!deleteUnitId} onOpenChange={(open) => !open && setDeleteUnitId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isArabic ? "هل أنت متأكد؟" : "Are you sure?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? "سيتم حذف هذا الجهاز نهائياً."
                : "This equipment will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUnit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isArabic ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Config Confirmation */}
      <AlertDialog open={!!deleteConfigId} onOpenChange={(open) => !open && setDeleteConfigId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isArabic ? "هل أنت متأكد؟" : "Are you sure?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? "سيتم حذف تكوين هذا المزود نهائياً."
                : "This provider configuration will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfig}
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
