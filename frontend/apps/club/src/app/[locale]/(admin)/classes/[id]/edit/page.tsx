"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  Clock,
  Users,
  UserCheck,
  MapPin,
  AlertTriangle,
  Power,
  Archive,
  ChevronDown,
  ChevronUp,
  Edit2,
  X,
  Check,
} from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@liyaqa/shared/components/ui/collapsible";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useClass,
  useUpdateClass,
  useActivateClass,
  useDeactivateClass,
  useLocations,
  useUsers,
} from "@liyaqa/shared/queries";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api";

const texts = {
  en: {
    back: "Back to Class",
    title: "Edit Class",
    save: "Save Changes",
    saving: "Saving...",
    cancel: "Cancel",
    edit: "Edit",
    basicInfo: "Basic Information",
    basicInfoDesc: "Class name, description, duration, and capacity",
    nameEn: "Class Name (English)",
    nameAr: "Class Name (Arabic)",
    descriptionEn: "Description (English)",
    descriptionAr: "Description (Arabic)",
    duration: "Duration",
    durationHint: "in minutes",
    capacity: "Capacity",
    capacityHint: "Maximum members per session",
    settings: "Settings",
    settingsDesc: "Trainer and location assignment",
    trainer: "Trainer",
    selectTrainer: "Select trainer",
    noTrainer: "No trainer assigned",
    location: "Location",
    selectLocation: "Select location",
    noLocation: "No location assigned",
    dangerZone: "Danger Zone",
    dangerZoneDesc: "Irreversible and destructive actions",
    deactivate: "Deactivate Class",
    deactivateDesc: "Temporarily disable this class. It can be reactivated later.",
    activate: "Activate Class",
    activateDesc: "Re-enable this class for booking.",
    archive: "Archive Class",
    archiveDesc: "Permanently archive this class. This action cannot be undone.",
    saved: "Changes saved successfully",
    activated: "Class activated",
    deactivated: "Class deactivated",
    error: "An error occurred",
    confirmDeactivate: "Are you sure you want to deactivate this class?",
    confirmArchive: "Are you sure you want to archive this class? This cannot be undone.",
  },
  ar: {
    back: "العودة للفصل",
    title: "تعديل الفصل",
    save: "حفظ التغييرات",
    saving: "جاري الحفظ...",
    cancel: "إلغاء",
    edit: "تعديل",
    basicInfo: "المعلومات الأساسية",
    basicInfoDesc: "اسم الفصل والوصف والمدة والسعة",
    nameEn: "اسم الفصل (إنجليزي)",
    nameAr: "اسم الفصل (عربي)",
    descriptionEn: "الوصف (إنجليزي)",
    descriptionAr: "الوصف (عربي)",
    duration: "المدة",
    durationHint: "بالدقائق",
    capacity: "السعة",
    capacityHint: "الحد الأقصى للأعضاء في كل جلسة",
    settings: "الإعدادات",
    settingsDesc: "تعيين المدرب والموقع",
    trainer: "المدرب",
    selectTrainer: "اختر المدرب",
    noTrainer: "لم يتم تعيين مدرب",
    location: "الموقع",
    selectLocation: "اختر الموقع",
    noLocation: "لم يتم تحديد الموقع",
    dangerZone: "منطقة الخطر",
    dangerZoneDesc: "إجراءات لا يمكن التراجع عنها",
    deactivate: "إلغاء تفعيل الفصل",
    deactivateDesc: "تعطيل هذا الفصل مؤقتًا. يمكن إعادة تفعيله لاحقًا.",
    activate: "تفعيل الفصل",
    activateDesc: "إعادة تمكين هذا الفصل للحجز.",
    archive: "أرشفة الفصل",
    archiveDesc: "أرشفة هذا الفصل نهائيًا. لا يمكن التراجع عن هذا الإجراء.",
    saved: "تم حفظ التغييرات بنجاح",
    activated: "تم تفعيل الفصل",
    deactivated: "تم إلغاء تفعيل الفصل",
    error: "حدث خطأ",
    confirmDeactivate: "هل أنت متأكد من إلغاء تفعيل هذا الفصل؟",
    confirmArchive: "هل أنت متأكد من أرشفة هذا الفصل؟ لا يمكن التراجع عن هذا الإجراء.",
  },
};

const editFormSchema = z.object({
  name: z.object({
    en: z.string().min(1, "Class name is required"),
    ar: z.string().optional(),
  }),
  description: z.object({
    en: z.string().optional(),
    ar: z.string().optional(),
  }),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  durationMinutes: z.coerce.number().min(15, "Duration must be at least 15 minutes"),
  trainerId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
});

type EditFormData = z.infer<typeof editFormSchema>;

export default function EditClassPage() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;
  const t = texts[locale];
  const isRTL = locale === "ar";

  const [error, setError] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>("basicInfo");
  const [isEditing, setIsEditing] = useState(false);

  // Queries
  const { data: gymClass, isLoading } = useClass(id);
  const { data: locationsData } = useLocations({ size: 100 });
  const { data: usersData } = useUsers({ size: 100 });

  // Mutations
  const updateClass = useUpdateClass();
  const activateClass = useActivateClass();
  const deactivateClass = useDeactivateClass();

  // Filter users for trainers
  const trainers = usersData?.content?.filter((u) => u.role === "STAFF") ?? [];
  const locations = locationsData?.content ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: { en: "", ar: "" },
      description: { en: "", ar: "" },
      capacity: 20,
      durationMinutes: 60,
      trainerId: null,
      locationId: null,
    },
  });

  // Reset form when gymClass loads
  useEffect(() => {
    if (gymClass) {
      reset({
        name: {
          en: gymClass.name?.en || "",
          ar: gymClass.name?.ar || "",
        },
        description: {
          en: gymClass.description?.en || "",
          ar: gymClass.description?.ar || "",
        },
        capacity: gymClass.capacity,
        durationMinutes: gymClass.durationMinutes,
        trainerId: gymClass.trainerId || null,
        locationId: gymClass.locationId || null,
      });
    }
  }, [gymClass, reset]);

  const formValues = watch();

  const handleSave = handleSubmit(async (data) => {
    setError(null);
    try {
      await updateClass.mutateAsync({
        id,
        data: {
          name: {
            en: data.name.en,
            ar: data.name.ar || undefined,
          },
          description: data.description?.en
            ? {
                en: data.description.en,
                ar: data.description.ar || undefined,
              }
            : undefined,
          capacity: data.capacity,
          durationMinutes: data.durationMinutes,
          trainerId: data.trainerId || undefined,
          locationId: data.locationId || undefined,
        },
      });
      toast({ title: t.saved });
      setIsEditing(false);
    } catch (err) {
      const apiError = await parseApiError(err);
      setError(getLocalizedErrorMessage(apiError, locale));
      toast({ title: t.error, variant: "destructive" });
    }
  });

  const handleActivate = async () => {
    try {
      await activateClass.mutateAsync(id);
      toast({ title: t.activated });
    } catch {
      toast({ title: t.error, variant: "destructive" });
    }
  };

  const handleDeactivate = async () => {
    if (!confirm(t.confirmDeactivate)) return;
    try {
      await deactivateClass.mutateAsync(id);
      toast({ title: t.deactivated });
    } catch {
      toast({ title: t.error, variant: "destructive" });
    }
  };

  const handleArchive = () => {
    if (!confirm(t.confirmArchive)) return;
    // Archive would be handled by a separate mutation
    router.push(`/${locale}/classes`);
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (!gymClass) {
    return null;
  }

  // Find selected trainer and location names
  const selectedTrainer = trainers.find((t) => t.id === formValues.trainerId);
  const selectedLocation = locations.find((l) => l.id === formValues.locationId);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Link
            href={`/${locale}/classes/${id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BackArrow className="h-4 w-4" />
            {t.back}
          </Link>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl",
                "bg-gradient-to-br from-violet-100 to-sky-100",
                "dark:from-violet-900/40 dark:to-sky-900/40"
              )}
            >
              🧘
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-muted-foreground">
                <LocalizedText text={gymClass.name} />
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        {isDirty && (
          <Button onClick={handleSave} disabled={updateClass.isPending}>
            {updateClass.isPending ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 me-2" />
                {t.save}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Information Section */}
      <Collapsible
        open={openSection === "basicInfo"}
        onOpenChange={(open) => setOpenSection(open ? "basicInfo" : null)}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t.basicInfo}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t.basicInfoDesc}
                    </p>
                  </div>
                </div>
                {openSection === "basicInfo" ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {/* Name fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name.en">{t.nameEn} *</Label>
                  <Input
                    id="name.en"
                    {...register("name.en")}
                    className={cn(errors.name?.en && "border-destructive")}
                  />
                  {errors.name?.en && (
                    <p className="text-sm text-destructive">
                      {errors.name.en.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name.ar">{t.nameAr}</Label>
                  <Input id="name.ar" {...register("name.ar")} dir="rtl" />
                </div>
              </div>

              {/* Description fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description.en">{t.descriptionEn}</Label>
                  <Textarea
                    id="description.en"
                    {...register("description.en")}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description.ar">{t.descriptionAr}</Label>
                  <Textarea
                    id="description.ar"
                    {...register("description.ar")}
                    rows={3}
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Duration and Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">{t.duration} *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="durationMinutes"
                      type="number"
                      min={15}
                      step={15}
                      {...register("durationMinutes")}
                      className="ps-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.durationHint}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">{t.capacity} *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="capacity"
                      type="number"
                      min={1}
                      {...register("capacity")}
                      className="ps-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.capacityHint}</p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Settings Section */}
      <Collapsible
        open={openSection === "settings"}
        onOpenChange={(open) => setOpenSection(open ? "settings" : null)}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t.settings}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t.settingsDesc}
                    </p>
                  </div>
                </div>
                {openSection === "settings" ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {/* Trainer */}
              <div className="space-y-2">
                <Label>{t.trainer}</Label>
                <Select
                  value={formValues.trainerId || ""}
                  onValueChange={(value) =>
                    setValue("trainerId", value || null, { shouldDirty: true })
                  }
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={t.selectTrainer} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.displayName?.en || trainer.displayName?.ar || trainer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>{t.location}</Label>
                <Select
                  value={formValues.locationId || ""}
                  onValueChange={(value) =>
                    setValue("locationId", value || null, { shouldDirty: true })
                  }
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={t.selectLocation} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name?.en || location.name?.ar || "Unnamed"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-destructive">
                {t.dangerZone}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{t.dangerZoneDesc}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Activate/Deactivate */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">
                {gymClass.status === "ACTIVE" ? t.deactivate : t.activate}
              </p>
              <p className="text-sm text-muted-foreground">
                {gymClass.status === "ACTIVE" ? t.deactivateDesc : t.activateDesc}
              </p>
            </div>
            {gymClass.status === "ACTIVE" ? (
              <Button
                variant="outline"
                onClick={handleDeactivate}
                disabled={deactivateClass.isPending}
              >
                <Power className="h-4 w-4 me-2" />
                {t.deactivate}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleActivate}
                disabled={activateClass.isPending}
              >
                <Power className="h-4 w-4 me-2" />
                {t.activate}
              </Button>
            )}
          </div>

          {/* Archive */}
          {gymClass.status === "INACTIVE" && (
            <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5">
              <div>
                <p className="font-medium text-destructive">{t.archive}</p>
                <p className="text-sm text-muted-foreground">{t.archiveDesc}</p>
              </div>
              <Button variant="destructive" onClick={handleArchive}>
                <Archive className="h-4 w-4 me-2" />
                {t.archive}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
