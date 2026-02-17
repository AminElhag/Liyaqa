"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  User,
  Users,
  Home,
  Building2,
} from "lucide-react";
import { cn, getLocalizedText } from "@liyaqa/shared/utils";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useCreatePTClass } from "@liyaqa/shared/queries/use-pt-sessions";
import { useTrainers } from "@liyaqa/shared/queries/use-trainers";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api";

// ---------------------------------------------------------------------------
// Bilingual texts
// ---------------------------------------------------------------------------

const texts = {
  en: {
    back: "Back to PT Classes",
    title: "Create PT Class",
    subtitle: "Set up a new personal training class template",
    // Form labels
    nameEn: "Name (English)",
    nameAr: "Name (Arabic)",
    descriptionEn: "Description (English)",
    descriptionAr: "Description (Arabic)",
    trainer: "Trainer",
    selectTrainer: "Select a trainer",
    sessionType: "Session Type",
    oneOnOne: "1:1 (One-on-One)",
    semiPrivate: "Semi-Private (Small Group)",
    locationType: "Location Type",
    club: "Club",
    home: "Home (Client Location)",
    duration: "Duration (minutes)",
    maxCapacity: "Max Capacity",
    minCapacity: "Min Capacity",
    pricingModel: "Pricing Model",
    dropInPrice: "Drop-in Price",
    travelFee: "Travel Fee",
    taxRate: "Tax Rate (%)",
    category: "Category",
    // Pricing model options
    payPerEntry: "Pay Per Entry",
    includedInMembership: "Included in Membership",
    classPackOnly: "Class Pack Only",
    hybrid: "Hybrid",
    // Section headers
    basicInfo: "Basic Information",
    basicInfoDesc: "Name and description for the PT class",
    trainerSection: "Trainer & Type",
    trainerSectionDesc: "Assign a trainer and configure session settings",
    pricingSection: "Pricing",
    pricingSectionDesc: "Set the pricing model and fees",
    // Actions
    create: "Create PT Class",
    creating: "Creating...",
    cancel: "Cancel",
    // Validation
    nameRequired: "Name (English) is required",
    trainerRequired: "Please select a trainer",
    // Hints
    maxCapacityHint: "Only shown for semi-private sessions",
    travelFeeHint: "Only applicable for home sessions",
    optional: "Optional",
  },
  ar: {
    back: "العودة لفصول التدريب الشخصي",
    title: "إنشاء فصل تدريب شخصي",
    subtitle: "إعداد قالب جديد لفصل تدريب شخصي",
    // Form labels
    nameEn: "الاسم (إنجليزي)",
    nameAr: "الاسم (عربي)",
    descriptionEn: "الوصف (إنجليزي)",
    descriptionAr: "الوصف (عربي)",
    trainer: "المدرب",
    selectTrainer: "اختر مدرب",
    sessionType: "نوع الجلسة",
    oneOnOne: "1:1 (جلسة فردية)",
    semiPrivate: "شبه خاص (مجموعة صغيرة)",
    locationType: "نوع الموقع",
    club: "النادي",
    home: "المنزل (موقع العميل)",
    duration: "المدة (دقائق)",
    maxCapacity: "السعة القصوى",
    minCapacity: "الحد الأدنى للسعة",
    pricingModel: "نموذج التسعير",
    dropInPrice: "سعر الجلسة الواحدة",
    travelFee: "رسوم التنقل",
    taxRate: "نسبة الضريبة (%)",
    category: "الفئة",
    // Pricing model options
    payPerEntry: "الدفع لكل جلسة",
    includedInMembership: "مشمول في العضوية",
    classPackOnly: "باقة حصص فقط",
    hybrid: "مختلط",
    // Section headers
    basicInfo: "المعلومات الأساسية",
    basicInfoDesc: "الاسم والوصف لفصل التدريب الشخصي",
    trainerSection: "المدرب والنوع",
    trainerSectionDesc: "تعيين مدرب وتهيئة إعدادات الجلسة",
    pricingSection: "التسعير",
    pricingSectionDesc: "تحديد نموذج التسعير والرسوم",
    // Actions
    create: "إنشاء فصل التدريب الشخصي",
    creating: "جاري الإنشاء...",
    cancel: "إلغاء",
    // Validation
    nameRequired: "الاسم (الإنجليزي) مطلوب",
    trainerRequired: "يرجى اختيار مدرب",
    // Hints
    maxCapacityHint: "يظهر فقط للجلسات شبه الخاصة",
    travelFeeHint: "ينطبق فقط على الجلسات المنزلية",
    optional: "اختياري",
  },
};

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function NewPTClassPage() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const t = texts[locale];
  const isRTL = locale === "ar";

  // Form state
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [sessionType, setSessionType] = useState<"ONE_ON_ONE" | "SEMI_PRIVATE">("ONE_ON_ONE");
  const [locationType, setLocationType] = useState<"CLUB" | "HOME">("CLUB");
  const [duration, setDuration] = useState(60);
  const [maxCapacity, setMaxCapacity] = useState(4);
  const [minCapacity, setMinCapacity] = useState(1);
  const [pricingModel, setPricingModel] = useState("PAY_PER_ENTRY");
  const [dropInPrice, setDropInPrice] = useState<number | undefined>();
  const [travelFee, setTravelFee] = useState<number | undefined>();
  const [taxRate, setTaxRate] = useState(15);
  const [categoryId, setCategoryId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const createPTClass = useCreatePTClass();

  // Fetch trainers for dropdown
  const { data: trainersData, isLoading: trainersLoading } = useTrainers({ size: 100 });
  const trainers = trainersData?.content ?? [];

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!nameEn.trim()) errors.nameEn = t.nameRequired;
    if (!trainerId) errors.trainerId = t.trainerRequired;
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setError(null);
    try {
      await createPTClass.mutateAsync({
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        descriptionAr: descriptionAr.trim() || undefined,
        trainerId,
        ptSessionType: sessionType,
        ptLocationType: locationType,
        durationMinutes: duration,
        maxCapacity: sessionType === "SEMI_PRIVATE" ? maxCapacity : 1,
        minCapacity: minCapacity,
        pricingModel: pricingModel as "PAY_PER_ENTRY" | "INCLUDED_IN_MEMBERSHIP" | "CLASS_PACK_ONLY" | "HYBRID",
        dropInPriceAmount: dropInPrice,
        dropInPriceCurrency: "SAR",
        travelFeeAmount: locationType === "HOME" ? travelFee : undefined,
        travelFeeCurrency: locationType === "HOME" && travelFee ? "SAR" : undefined,
        taxRate,
        categoryId: categoryId || undefined,
      });
      router.push(`/${locale}/pt-classes`);
    } catch (err) {
      const apiError = await parseApiError(err);
      setError(getLocalizedErrorMessage(apiError, locale));
    }
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/${locale}/pt-classes`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackArrow className="h-4 w-4" />
          {t.back}
        </Link>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              "bg-gradient-to-br from-amber-100 to-orange-100",
              "dark:from-amber-900/40 dark:to-orange-900/40"
            )}
          >
            <Dumbbell className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t.basicInfo}</CardTitle>
            <CardDescription>{t.basicInfoDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nameEn">{t.nameEn} *</Label>
                <Input
                  id="nameEn"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Premium PT Session"
                  className={validationErrors.nameEn ? "border-destructive" : ""}
                />
                {validationErrors.nameEn && (
                  <p className="text-sm text-destructive">{validationErrors.nameEn}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr">
                  {t.nameAr}{" "}
                  <span className="text-muted-foreground text-xs">({t.optional})</span>
                </Label>
                <Input
                  id="nameAr"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  dir="rtl"
                  placeholder="مثال: جلسة تدريب شخصي مميزة"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="descEn">
                  {t.descriptionEn}{" "}
                  <span className="text-muted-foreground text-xs">({t.optional})</span>
                </Label>
                <Textarea
                  id="descEn"
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descAr">
                  {t.descriptionAr}{" "}
                  <span className="text-muted-foreground text-xs">({t.optional})</span>
                </Label>
                <Textarea
                  id="descAr"
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  rows={3}
                  dir="rtl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trainer & Type */}
        <Card>
          <CardHeader>
            <CardTitle>{t.trainerSection}</CardTitle>
            <CardDescription>{t.trainerSectionDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trainer */}
            <div className="space-y-2">
              <Label>{t.trainer} *</Label>
              {trainersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={trainerId} onValueChange={setTrainerId}>
                  <SelectTrigger
                    className={validationErrors.trainerId ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder={t.selectTrainer} />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.displayName
                          ? getLocalizedText(trainer.displayName, locale)
                          : trainer.userName || trainer.userEmail || trainer.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {validationErrors.trainerId && (
                <p className="text-sm text-destructive">{validationErrors.trainerId}</p>
              )}
            </div>

            {/* Session Type */}
            <div className="space-y-2">
              <Label>{t.sessionType}</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSessionType("ONE_ON_ONE")}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border-2 p-4 transition-colors text-start",
                    sessionType === "ONE_ON_ONE"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <User className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{t.oneOnOne}</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSessionType("SEMI_PRIVATE")}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border-2 p-4 transition-colors text-start",
                    sessionType === "SEMI_PRIVATE"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <Users className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{t.semiPrivate}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Location Type */}
            <div className="space-y-2">
              <Label>{t.locationType}</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setLocationType("CLUB")}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border-2 p-4 transition-colors text-start",
                    locationType === "CLUB"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <Building2 className="h-5 w-5 shrink-0 text-primary" />
                  <p className="font-medium">{t.club}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType("HOME")}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border-2 p-4 transition-colors text-start",
                    locationType === "HOME"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <Home className="h-5 w-5 shrink-0 text-primary" />
                  <p className="font-medium">{t.home}</p>
                </button>
              </div>
            </div>

            {/* Duration */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="duration">{t.duration}</Label>
                <Select
                  value={String(duration)}
                  onValueChange={(v) => setDuration(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="45">45</SelectItem>
                    <SelectItem value="60">60</SelectItem>
                    <SelectItem value="90">90</SelectItem>
                    <SelectItem value="120">120</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Capacity - only for semi-private */}
              {sessionType === "SEMI_PRIVATE" && (
                <div className="space-y-2">
                  <Label htmlFor="maxCapacity">{t.maxCapacity}</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    min={2}
                    max={10}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.maxCapacityHint}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="minCapacity">{t.minCapacity}</Label>
                <Input
                  id="minCapacity"
                  type="number"
                  min={1}
                  max={sessionType === "SEMI_PRIVATE" ? maxCapacity : 1}
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>{t.pricingSection}</CardTitle>
            <CardDescription>{t.pricingSectionDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pricing Model */}
            <div className="space-y-2">
              <Label>{t.pricingModel}</Label>
              <Select value={pricingModel} onValueChange={setPricingModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAY_PER_ENTRY">{t.payPerEntry}</SelectItem>
                  <SelectItem value="INCLUDED_IN_MEMBERSHIP">{t.includedInMembership}</SelectItem>
                  <SelectItem value="CLASS_PACK_ONLY">{t.classPackOnly}</SelectItem>
                  <SelectItem value="HYBRID">{t.hybrid}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Drop-in Price */}
              <div className="space-y-2">
                <Label htmlFor="dropInPrice">{t.dropInPrice} (SAR)</Label>
                <Input
                  id="dropInPrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={dropInPrice ?? ""}
                  onChange={(e) =>
                    setDropInPrice(e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="0.00"
                />
              </div>

              {/* Travel Fee - only for home */}
              {locationType === "HOME" && (
                <div className="space-y-2">
                  <Label htmlFor="travelFee">{t.travelFee} (SAR)</Label>
                  <Input
                    id="travelFee"
                    type="number"
                    min={0}
                    step={0.01}
                    value={travelFee ?? ""}
                    onChange={(e) =>
                      setTravelFee(e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.travelFeeHint}
                  </p>
                </div>
              )}

              {/* Tax Rate */}
              <div className="space-y-2">
                <Label htmlFor="taxRate">{t.taxRate}</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${locale}/pt-classes`)}
          >
            {t.cancel}
          </Button>
          <Button type="submit" disabled={createPTClass.isPending}>
            <Dumbbell className="me-2 h-4 w-4" />
            {createPTClass.isPending ? t.creating : t.create}
          </Button>
        </div>
      </form>
    </div>
  );
}
