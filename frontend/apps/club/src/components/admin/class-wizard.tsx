"use client";

import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Users,
  MapPin,
  UserCheck,
  Calendar,
  Plus,
  Trash2,
  Loader2,
  DollarSign,
  Settings,
  Shield,
  LayoutGrid,
  Palette,
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
import { Switch } from "@liyaqa/shared/components/ui/switch";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { useLocations, useUsers, usePlans, useActiveClassCategories } from "@liyaqa/shared/queries";
import { useActiveRoomLayouts } from "@liyaqa/shared/queries/use-gx";
import type {
  DayOfWeek,
  ClassType,
  DifficultyLevel,
  ClassAccessPolicy,
} from "@liyaqa/shared/types/scheduling";

// Class type options
const CLASS_TYPES: ClassType[] = [
  "GROUP_FITNESS",
  "YOGA",
  "PILATES",
  "SPINNING",
  "CROSSFIT",
  "SWIMMING",
  "MARTIAL_ARTS",
  "DANCE",
  "OTHER",
];

// Difficulty level options
const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  "ALL_LEVELS",
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
];

// Gender restriction options
const GENDER_RESTRICTIONS = ["MIXED", "MALE_ONLY", "FEMALE_ONLY"] as const;
type GenderRestriction = (typeof GENDER_RESTRICTIONS)[number];

// Access policy options
const ACCESS_POLICIES: ClassAccessPolicy[] = [
  "MEMBERS_ONLY",
  "SPECIFIC_MEMBERSHIPS",
  "OPEN_TO_ANYONE",
];

// Pricing model options
const PRICING_MODELS = [
  "INCLUDED_IN_MEMBERSHIP",
  "PAY_PER_ENTRY",
  "CLASS_PACK_ONLY",
  "HYBRID",
] as const;

type PricingModel = (typeof PRICING_MODELS)[number];

// Color presets for class color selection
const COLOR_PRESETS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

const DAYS_OF_WEEK: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

// Zod schema for class form
const classFormSchema = z.object({
  name: z.object({
    en: z.string().min(1, "Class name is required"),
    ar: z.string().optional(),
  }),
  description: z
    .object({
      en: z.string().optional(),
      ar: z.string().optional(),
    })
    .optional(),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  durationMinutes: z.coerce.number().min(15, "Duration must be at least 15 minutes"),
  // Identity fields
  classType: z.string().optional(),
  difficultyLevel: z.string().default("ALL_LEVELS"),
  colorCode: z.string().optional(),
  genderRestriction: z.enum(["MIXED", "MALE_ONLY", "FEMALE_ONLY"]).default("MIXED"),
  // Category
  categoryId: z.string().optional(),
  // Assignment
  trainerId: z.string().optional(),
  locationId: z.string().optional(),
  // GX access policy
  accessPolicy: z.enum(["MEMBERS_ONLY", "SPECIFIC_MEMBERSHIPS", "OPEN_TO_ANYONE"]).default("MEMBERS_ONLY"),
  eligiblePlanIds: z.array(z.string()).optional(),
  // Pricing settings
  pricingModel: z.enum(PRICING_MODELS).default("INCLUDED_IN_MEMBERSHIP"),
  dropInPriceAmount: z.coerce.number().min(0).optional(),
  dropInPriceCurrency: z.string().default("SAR"),
  taxRate: z.coerce.number().min(0).max(100).default(15),
  allowNonSubscribers: z.boolean().default(false),
  // Booking settings
  advanceBookingDays: z.coerce.number().min(1).max(365).default(7),
  cancellationDeadlineHours: z.coerce.number().min(0).max(72).default(2),
  lateCancellationFeeAmount: z.coerce.number().min(0).optional(),
  lateCancellationFeeCurrency: z.string().default("SAR"),
  // No-show fee
  noShowFeeAmount: z.coerce.number().min(0).optional(),
  noShowFeeCurrency: z.string().default("SAR"),
  // Spot booking
  onlineBookableSpots: z.coerce.number().min(0).optional(),
  spotBookingEnabled: z.boolean().default(false),
  roomLayoutId: z.string().optional(),
  // Schedules
  schedules: z
    .array(
      z.object({
        dayOfWeek: z.enum([
          "SUNDAY",
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
        ]),
        startTime: z.string().min(1, "Start time is required"),
        endTime: z.string().min(1, "End time is required"),
      })
    )
    .optional(),
});

export type ClassWizardData = z.infer<typeof classFormSchema>;

interface ClassWizardProps {
  onSubmit: (data: ClassWizardData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const texts = {
  en: {
    step1: "Basic Info",
    step2: "Settings",
    step3: "Schedule",
    step4: "Review",
    next: "Next",
    back: "Back",
    skip: "Skip",
    create: "Create Class",
    creating: "Creating...",
    cancel: "Cancel",
    // Step 1
    classNameEn: "Class Name (English)",
    classNameAr: "Class Name (Arabic)",
    descriptionEn: "Description (English)",
    descriptionAr: "Description (Arabic)",
    capacity: "Capacity",
    capacityHint: "Maximum number of members per session",
    duration: "Duration",
    durationHint: "Class duration in minutes",
    minutes: "min",
    // Step 1 - Identity enhancements
    classType: "Class Type",
    classTypeHint: "Category of this class",
    selectClassType: "Select class type",
    difficultyLevel: "Difficulty Level",
    selectDifficulty: "Select difficulty",
    colorCode: "Color",
    category: "Category",
    categoryHint: "Assign a class category for credit allocation",
    selectCategory: "Select category",
    noCategory: "No category",
    colorHint: "Timetable color for this class",
    genderRestriction: "Gender Restriction",
    genderMixed: "Mixed",
    genderMaleOnly: "Men Only",
    genderFemaleOnly: "Women Only",
    // Class types
    typeGroupFitness: "Group Fitness",
    typeYoga: "Yoga",
    typePilates: "Pilates",
    typeSpinning: "Spinning",
    typeCrossFit: "CrossFit",
    typeSwimming: "Swimming",
    typeMartialArts: "Martial Arts",
    typeDance: "Dance",
    typeOther: "Other",
    // Difficulty levels
    levelAllLevels: "All Levels",
    levelBeginner: "Beginner",
    levelIntermediate: "Intermediate",
    levelAdvanced: "Advanced",
    // Step 2 - Access Policy
    accessPolicyTitle: "Access Policy",
    accessPolicy: "Who Can Book",
    accessPolicyHint: "Control who is allowed to book this class",
    accessMembersOnly: "Members Only",
    accessMembersOnlyHint: "Any member with an active subscription",
    accessSpecific: "Specific Memberships",
    accessSpecificHint: "Only members on selected plans",
    accessOpen: "Open to Anyone",
    accessOpenHint: "Anyone can book including non-members",
    eligiblePlans: "Eligible Plans",
    eligiblePlansHint: "Select which membership plans can book this class",
    selectPlans: "Select plans...",
    // Step 2 - Spot Booking
    spotBookingTitle: "Spot Booking",
    spotBookingEnabled: "Enable Spot Selection",
    spotBookingEnabledHint: "Members can choose their exact position in the room",
    roomLayout: "Room Layout",
    roomLayoutHint: "Layout template for spot selection",
    selectRoomLayout: "Select room layout",
    noRoomLayout: "No layout (generic spots)",
    onlineBookableSpots: "Online Bookable Spots",
    onlineBookableSpotsHint: "Reserve remaining spots for walk-ins",
    noShowFee: "No-Show Fee",
    noShowFeeHint: "Fee charged when a member doesn't show up",
    // Step 2 - Assignment
    trainer: "Trainer",
    trainerHint: "Assign a trainer to this class",
    selectTrainer: "Select trainer",
    noTrainer: "No trainer assigned",
    location: "Location",
    locationHint: "Where will this class be held",
    selectLocation: "Select location",
    noLocation: "No location assigned",
    // Step 2 - Pricing
    pricingSettingsTitle: "Pricing Settings",
    pricingModel: "Pricing Model",
    pricingModelHint: "How members pay for this class",
    selectPricingModel: "Select pricing model",
    pricingIncluded: "Included in Membership",
    pricingPayPerEntry: "Pay per Entry",
    pricingClassPackOnly: "Class Pack Only",
    pricingHybrid: "Hybrid (Any Method)",
    dropInPrice: "Drop-in Price",
    dropInPriceHint: "Price for single class purchase",
    taxRate: "Tax Rate (%)",
    taxRateHint: "VAT percentage to apply",
    allowNonSubscribers: "Allow Non-Subscribers",
    allowNonSubscribersHint: "Let non-members book this class",
    // Step 2 - Booking
    bookingSettingsTitle: "Booking Settings",
    advanceBookingDays: "Advance Booking",
    advanceBookingDaysHint: "How far in advance members can book",
    days: "days",
    cancellationDeadline: "Cancellation Deadline",
    cancellationDeadlineHint: "Hours before class to cancel without penalty",
    hours: "hours",
    lateCancellationFee: "Late Cancellation Fee",
    lateCancellationFeeHint: "Fee charged for late cancellations (optional)",
    // Step 3
    scheduleTitle: "Weekly Schedule",
    scheduleHint: "Add recurring time slots for this class",
    addSchedule: "Add Time Slot",
    dayOfWeek: "Day",
    startTime: "Start",
    endTime: "End",
    noSchedules: "No schedules added yet",
    noSchedulesHint: "You can add schedules later from the class details page",
    // Step 4
    reviewTitle: "Review & Create",
    reviewHint: "Review the class details before creating",
    basicInfo: "Basic Information",
    settings: "Settings",
    pricingSettings: "Pricing",
    bookingSettings: "Booking Rules",
    schedules: "Schedules",
    notSet: "Not set",
    // Days
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunShort: "Sun",
    monShort: "Mon",
    tueShort: "Tue",
    wedShort: "Wed",
    thuShort: "Thu",
    friShort: "Fri",
    satShort: "Sat",
  },
  ar: {
    step1: "المعلومات الأساسية",
    step2: "الإعدادات",
    step3: "الجدول",
    step4: "المراجعة",
    next: "التالي",
    back: "السابق",
    skip: "تخطي",
    create: "إنشاء الفصل",
    creating: "جاري الإنشاء...",
    cancel: "إلغاء",
    // Step 1
    classNameEn: "اسم الفصل (إنجليزي)",
    classNameAr: "اسم الفصل (عربي)",
    descriptionEn: "الوصف (إنجليزي)",
    descriptionAr: "الوصف (عربي)",
    capacity: "السعة",
    capacityHint: "الحد الأقصى لعدد الأعضاء في كل جلسة",
    duration: "المدة",
    durationHint: "مدة الفصل بالدقائق",
    minutes: "دقيقة",
    // Step 1 - Identity enhancements
    classType: "نوع الفصل",
    classTypeHint: "تصنيف هذا الفصل",
    selectClassType: "اختر نوع الفصل",
    difficultyLevel: "مستوى الصعوبة",
    selectDifficulty: "اختر المستوى",
    colorCode: "اللون",
    category: "الفئة",
    categoryHint: "تعيين فئة الفصل لتوزيع الحصص",
    selectCategory: "اختر الفئة",
    noCategory: "بدون فئة",
    colorHint: "لون الفصل في الجدول الزمني",
    genderRestriction: "قيد الجنس",
    genderMixed: "مختلط",
    genderMaleOnly: "رجال فقط",
    genderFemaleOnly: "نساء فقط",
    // Class types
    typeGroupFitness: "تمارين جماعية",
    typeYoga: "يوغا",
    typePilates: "بيلاتس",
    typeSpinning: "سبينينغ",
    typeCrossFit: "كروس فت",
    typeSwimming: "سباحة",
    typeMartialArts: "فنون قتالية",
    typeDance: "رقص",
    typeOther: "أخرى",
    // Difficulty levels
    levelAllLevels: "جميع المستويات",
    levelBeginner: "مبتدئ",
    levelIntermediate: "متوسط",
    levelAdvanced: "متقدم",
    // Step 2 - Access Policy
    accessPolicyTitle: "سياسة الوصول",
    accessPolicy: "من يمكنه الحجز",
    accessPolicyHint: "تحكم في من يُسمح له بحجز هذا الفصل",
    accessMembersOnly: "الأعضاء فقط",
    accessMembersOnlyHint: "أي عضو لديه اشتراك نشط",
    accessSpecific: "اشتراكات محددة",
    accessSpecificHint: "فقط الأعضاء في الخطط المحددة",
    accessOpen: "مفتوح للجميع",
    accessOpenHint: "يمكن لأي شخص الحجز بما في ذلك غير الأعضاء",
    eligiblePlans: "الخطط المؤهلة",
    eligiblePlansHint: "اختر خطط العضوية التي يمكنها حجز هذا الفصل",
    selectPlans: "اختر الخطط...",
    // Step 2 - Spot Booking
    spotBookingTitle: "حجز الأماكن",
    spotBookingEnabled: "تفعيل اختيار المكان",
    spotBookingEnabledHint: "يمكن للأعضاء اختيار مكانهم المحدد في الغرفة",
    roomLayout: "تخطيط الغرفة",
    roomLayoutHint: "قالب التخطيط لاختيار المكان",
    selectRoomLayout: "اختر تخطيط الغرفة",
    noRoomLayout: "بدون تخطيط (أماكن عامة)",
    onlineBookableSpots: "الأماكن القابلة للحجز عبر الإنترنت",
    onlineBookableSpotsHint: "احتفظ بالأماكن المتبقية للحضور المباشر",
    noShowFee: "رسوم عدم الحضور",
    noShowFeeHint: "الرسوم المفروضة عند عدم حضور العضو",
    // Step 2 - Assignment
    trainer: "المدرب",
    trainerHint: "تعيين مدرب لهذا الفصل",
    selectTrainer: "اختر المدرب",
    noTrainer: "لم يتم تعيين مدرب",
    location: "الموقع",
    locationHint: "أين سيعقد هذا الفصل",
    selectLocation: "اختر الموقع",
    noLocation: "لم يتم تحديد الموقع",
    // Step 2 - Pricing
    pricingSettingsTitle: "إعدادات التسعير",
    pricingModel: "نموذج التسعير",
    pricingModelHint: "كيف يدفع الأعضاء لهذا الفصل",
    selectPricingModel: "اختر نموذج التسعير",
    pricingIncluded: "مضمّن في العضوية",
    pricingPayPerEntry: "الدفع لكل حصة",
    pricingClassPackOnly: "باقة الحصص فقط",
    pricingHybrid: "مختلط (أي طريقة)",
    dropInPrice: "سعر الحصة الواحدة",
    dropInPriceHint: "السعر لشراء حصة واحدة",
    taxRate: "نسبة الضريبة (%)",
    taxRateHint: "نسبة ضريبة القيمة المضافة",
    allowNonSubscribers: "السماح لغير المشتركين",
    allowNonSubscribersHint: "السماح لغير الأعضاء بحجز هذا الفصل",
    // Step 2 - Booking
    bookingSettingsTitle: "إعدادات الحجز",
    advanceBookingDays: "الحجز المسبق",
    advanceBookingDaysHint: "كم يوم مسبقاً يمكن للأعضاء الحجز",
    days: "أيام",
    cancellationDeadline: "موعد الإلغاء",
    cancellationDeadlineHint: "ساعات قبل الحصة للإلغاء بدون غرامة",
    hours: "ساعات",
    lateCancellationFee: "غرامة الإلغاء المتأخر",
    lateCancellationFeeHint: "الرسوم المفروضة على الإلغاء المتأخر (اختياري)",
    // Step 3
    scheduleTitle: "الجدول الأسبوعي",
    scheduleHint: "أضف أوقات متكررة لهذا الفصل",
    addSchedule: "إضافة وقت",
    dayOfWeek: "اليوم",
    startTime: "البداية",
    endTime: "النهاية",
    noSchedules: "لم تتم إضافة جداول بعد",
    noSchedulesHint: "يمكنك إضافة الجداول لاحقًا من صفحة تفاصيل الفصل",
    // Step 4
    reviewTitle: "المراجعة والإنشاء",
    reviewHint: "راجع تفاصيل الفصل قبل الإنشاء",
    basicInfo: "المعلومات الأساسية",
    settings: "الإعدادات",
    pricingSettings: "التسعير",
    bookingSettings: "قواعد الحجز",
    schedules: "الجداول",
    notSet: "غير محدد",
    // Days
    sunday: "الأحد",
    monday: "الإثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
    sunShort: "أحد",
    monShort: "اثن",
    tueShort: "ثلا",
    wedShort: "أرب",
    thuShort: "خمي",
    friShort: "جمع",
    satShort: "سبت",
  },
};

const STEPS = [
  { id: 1, icon: Clock },
  { id: 2, icon: UserCheck },
  { id: 3, icon: Calendar },
  { id: 4, icon: Check },
];

export function ClassWizard({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ClassWizardProps) {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const isRTL = locale === "ar";

  const [currentStep, setCurrentStep] = useState(1);

  // Fetch data for dropdowns
  const { data: locationsData } = useLocations({ size: 100 });
  const { data: usersData } = useUsers({ size: 100 });
  const { data: plansData } = usePlans({ size: 100 });
  const { data: roomLayouts } = useActiveRoomLayouts();
  const { data: classCategories = [] } = useActiveClassCategories();

  // Filter users to get trainers (STAFF role or any user for now)
  const trainers = useMemo(() => {
    return usersData?.content?.filter((u) => u.role === "STAFF") ?? [];
  }, [usersData]);

  const locations = locationsData?.content ?? [];
  const plans = plansData?.content ?? [];
  const activeLayouts = roomLayouts ?? [];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ClassWizardData>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: { en: "", ar: "" },
      description: { en: "", ar: "" },
      capacity: 20,
      durationMinutes: 60,
      // Identity defaults
      classType: undefined,
      difficultyLevel: "ALL_LEVELS",
      colorCode: undefined,
      genderRestriction: "MIXED",
      categoryId: undefined,
      trainerId: undefined,
      locationId: undefined,
      // Access policy defaults
      accessPolicy: "MEMBERS_ONLY",
      eligiblePlanIds: [],
      // Pricing defaults
      pricingModel: "INCLUDED_IN_MEMBERSHIP",
      dropInPriceAmount: undefined,
      dropInPriceCurrency: "SAR",
      taxRate: 15,
      allowNonSubscribers: false,
      // Booking defaults
      advanceBookingDays: 7,
      cancellationDeadlineHours: 2,
      lateCancellationFeeAmount: undefined,
      lateCancellationFeeCurrency: "SAR",
      // No-show fee
      noShowFeeAmount: undefined,
      noShowFeeCurrency: "SAR",
      // Spot booking
      onlineBookableSpots: undefined,
      spotBookingEnabled: false,
      roomLayoutId: undefined,
      schedules: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedules",
  });

  const formValues = watch();

  const dayLabels: Record<DayOfWeek, string> = {
    SUNDAY: t.sunday,
    MONDAY: t.monday,
    TUESDAY: t.tuesday,
    WEDNESDAY: t.wednesday,
    THURSDAY: t.thursday,
    FRIDAY: t.friday,
    SATURDAY: t.saturday,
  };

  const dayShortLabels: Record<DayOfWeek, string> = {
    SUNDAY: t.sunShort,
    MONDAY: t.monShort,
    TUESDAY: t.tueShort,
    WEDNESDAY: t.wedShort,
    THURSDAY: t.thuShort,
    FRIDAY: t.friShort,
    SATURDAY: t.satShort,
  };

  const classTypeLabels: Record<string, string> = {
    GROUP_FITNESS: t.typeGroupFitness,
    YOGA: t.typeYoga,
    PILATES: t.typePilates,
    SPINNING: t.typeSpinning,
    CROSSFIT: t.typeCrossFit,
    SWIMMING: t.typeSwimming,
    MARTIAL_ARTS: t.typeMartialArts,
    DANCE: t.typeDance,
    OTHER: t.typeOther,
  };

  const difficultyLabels: Record<string, string> = {
    ALL_LEVELS: t.levelAllLevels,
    BEGINNER: t.levelBeginner,
    INTERMEDIATE: t.levelIntermediate,
    ADVANCED: t.levelAdvanced,
  };

  const genderLabels: Record<string, string> = {
    MIXED: t.genderMixed,
    MALE_ONLY: t.genderMaleOnly,
    FEMALE_ONLY: t.genderFemaleOnly,
  };

  const accessPolicyLabels: Record<string, string> = {
    MEMBERS_ONLY: t.accessMembersOnly,
    SPECIFIC_MEMBERSHIPS: t.accessSpecific,
    OPEN_TO_ANYONE: t.accessOpen,
  };

  const stepTitles = [t.step1, t.step2, t.step3, t.step4];

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await trigger(["name.en", "capacity", "durationMinutes"]);
      if (!isValid) return;
    }
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFormSubmit = handleSubmit(onSubmit);

  // Get selected trainer and location names for review
  const selectedTrainer = trainers.find((t) => t.id === formValues.trainerId);
  const selectedLocation = locations.find((l) => l.id === formValues.locationId);

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center">
                {/* Step circle */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    isCompleted &&
                      "bg-emerald-500 border-emerald-500 text-white",
                    isCurrent &&
                      "bg-primary border-primary text-primary-foreground",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-muted border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-12 h-0.5 mx-2",
                      currentStep > step.id
                        ? "bg-emerald-500"
                        : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Title */}
      <div className="text-center">
        <h2 className="text-xl font-semibold">
          {locale === "ar" ? "الخطوة" : "Step"} {currentStep}: {stepTitles[currentStep - 1]}
        </h2>
      </div>

      {/* Step Content */}
      <form onSubmit={handleFormSubmit}>
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {t.step1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name.en">{t.classNameEn} *</Label>
                  <Input
                    id="name.en"
                    {...register("name.en")}
                    placeholder="Yoga Class"
                    className={cn(errors.name?.en && "border-destructive")}
                  />
                  {errors.name?.en && (
                    <p className="text-sm text-destructive">
                      {errors.name.en.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name.ar">{t.classNameAr}</Label>
                  <Input
                    id="name.ar"
                    {...register("name.ar")}
                    placeholder="فصل اليوغا"
                    dir="rtl"
                  />
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
                    placeholder="A relaxing yoga class for all levels..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description.ar">{t.descriptionAr}</Label>
                  <Textarea
                    id="description.ar"
                    {...register("description.ar")}
                    rows={3}
                    dir="rtl"
                    placeholder="فصل يوغا مريح لجميع المستويات..."
                  />
                </div>
              </div>

              {/* Capacity and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="capacity">{t.capacity} *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="capacity"
                      type="number"
                      min={1}
                      {...register("capacity")}
                      className={cn(
                        "ps-10",
                        errors.capacity && "border-destructive"
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.capacityHint}</p>
                  {errors.capacity && (
                    <p className="text-sm text-destructive">
                      {errors.capacity.message}
                    </p>
                  )}
                </div>
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
                      className={cn(
                        "ps-10",
                        errors.durationMinutes && "border-destructive"
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {t.minutes}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.durationHint}</p>
                  {errors.durationMinutes && (
                    <p className="text-sm text-destructive">
                      {errors.durationMinutes.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Class Type and Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t.classType}</Label>
                  <Select
                    value={formValues.classType || ""}
                    onValueChange={(value) =>
                      setValue("classType", value || undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectClassType} />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {classTypeLabels[type] || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t.classTypeHint}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t.difficultyLevel}</Label>
                  <Select
                    value={formValues.difficultyLevel || "ALL_LEVELS"}
                    onValueChange={(value) => setValue("difficultyLevel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectDifficulty} />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {difficultyLabels[level] || level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category */}
              {classCategories.length > 0 && (
                <div className="space-y-2">
                  <Label>{t.category}</Label>
                  <Select
                    value={formValues.categoryId || ""}
                    onValueChange={(value) =>
                      setValue("categoryId", value || undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectCategory} />
                    </SelectTrigger>
                    <SelectContent>
                      {classCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            {cat.colorCode && (
                              <span
                                className="inline-block h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: cat.colorCode }}
                              />
                            )}
                            {locale === "ar" ? cat.name.ar || cat.name.en : cat.name.en}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t.categoryHint}</p>
                </div>
              )}

              {/* Color and Gender Restriction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t.colorCode}</Label>
                  <div className="flex items-center gap-2">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setValue("colorCode", color)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          formValues.colorCode === color
                            ? "border-foreground scale-110"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <Input
                      type="color"
                      value={formValues.colorCode || "#3b82f6"}
                      onChange={(e) => setValue("colorCode", e.target.value)}
                      className="w-8 h-8 p-0 border-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.colorHint}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t.genderRestriction}</Label>
                  <Select
                    value={formValues.genderRestriction || "MIXED"}
                    onValueChange={(value) =>
                      setValue("genderRestriction", value as GenderRestriction)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_RESTRICTIONS.map((gender) => (
                        <SelectItem key={gender} value={gender}>
                          {genderLabels[gender] || gender}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Settings */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Assignment Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  {t.step2}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Trainer */}
                <div className="space-y-2">
                  <Label>{t.trainer}</Label>
                  <Select
                    value={formValues.trainerId || ""}
                    onValueChange={(value) =>
                      setValue("trainerId", value || undefined)
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
                  <p className="text-xs text-muted-foreground">{t.trainerHint}</p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label>{t.location}</Label>
                  <Select
                    value={formValues.locationId || ""}
                    onValueChange={(value) =>
                      setValue("locationId", value || undefined)
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
                  <p className="text-xs text-muted-foreground">{t.locationHint}</p>
                </div>
              </CardContent>
            </Card>

            {/* Access Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {t.accessPolicyTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Access Policy Selection */}
                <div className="space-y-3">
                  <Label>{t.accessPolicy}</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {ACCESS_POLICIES.map((policy) => (
                      <div
                        key={policy}
                        role="button"
                        tabIndex={0}
                        onClick={() => setValue("accessPolicy", policy)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setValue("accessPolicy", policy);
                          }
                        }}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          formValues.accessPolicy === policy
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/30"
                        )}
                      >
                        <div
                          className={cn(
                            "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                            formValues.accessPolicy === policy
                              ? "border-primary"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {formValues.accessPolicy === policy && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {accessPolicyLabels[policy]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {policy === "MEMBERS_ONLY"
                              ? t.accessMembersOnlyHint
                              : policy === "SPECIFIC_MEMBERSHIPS"
                              ? t.accessSpecificHint
                              : t.accessOpenHint}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.accessPolicyHint}</p>
                </div>

                {/* Eligible Plans (only for SPECIFIC_MEMBERSHIPS) */}
                {formValues.accessPolicy === "SPECIFIC_MEMBERSHIPS" && (
                  <div className="space-y-2">
                    <Label>{t.eligiblePlans}</Label>
                    <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                      {plans.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t.selectPlans}</p>
                      ) : (
                        plans.map((plan) => {
                          const isSelected = formValues.eligiblePlanIds?.includes(plan.id) ?? false;
                          return (
                            <div
                              key={plan.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                const current = formValues.eligiblePlanIds ?? [];
                                if (isSelected) {
                                  setValue(
                                    "eligiblePlanIds",
                                    current.filter((id) => id !== plan.id)
                                  );
                                } else {
                                  setValue("eligiblePlanIds", [...current, plan.id]);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  const current = formValues.eligiblePlanIds ?? [];
                                  if (isSelected) {
                                    setValue(
                                      "eligiblePlanIds",
                                      current.filter((id) => id !== plan.id)
                                    );
                                  } else {
                                    setValue("eligiblePlanIds", [...current, plan.id]);
                                  }
                                }
                              }}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                                isSelected
                                  ? "bg-primary/10"
                                  : "hover:bg-muted"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                                  isSelected
                                    ? "bg-primary border-primary"
                                    : "border-muted-foreground/30"
                                )}
                              >
                                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              <span className="text-sm">
                                {locale === "ar" && plan.name?.ar
                                  ? plan.name.ar
                                  : plan.name?.en || "Unnamed Plan"}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{t.eligiblePlansHint}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  {t.pricingSettingsTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pricing Model */}
                <div className="space-y-2">
                  <Label>{t.pricingModel}</Label>
                  <Select
                    value={formValues.pricingModel || "INCLUDED_IN_MEMBERSHIP"}
                    onValueChange={(value) =>
                      setValue("pricingModel", value as PricingModel)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectPricingModel} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCLUDED_IN_MEMBERSHIP">
                        {t.pricingIncluded}
                      </SelectItem>
                      <SelectItem value="PAY_PER_ENTRY">
                        {t.pricingPayPerEntry}
                      </SelectItem>
                      <SelectItem value="CLASS_PACK_ONLY">
                        {t.pricingClassPackOnly}
                      </SelectItem>
                      <SelectItem value="HYBRID">
                        {t.pricingHybrid}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t.pricingModelHint}</p>
                </div>

                {/* Drop-in Price - shown for PAY_PER_ENTRY and HYBRID */}
                {(formValues.pricingModel === "PAY_PER_ENTRY" ||
                  formValues.pricingModel === "HYBRID") && (
                  <div className="space-y-2">
                    <Label>{t.dropInPrice}</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          {...register("dropInPriceAmount")}
                          className="ps-10"
                          placeholder="0.00"
                        />
                      </div>
                      <Select
                        value={formValues.dropInPriceCurrency || "SAR"}
                        onValueChange={(value) =>
                          setValue("dropInPriceCurrency", value)
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SAR">SAR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">{t.dropInPriceHint}</p>
                  </div>
                )}

                {/* Tax Rate */}
                <div className="space-y-2">
                  <Label>{t.taxRate}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      {...register("taxRate")}
                      className="pe-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.taxRateHint}</p>
                </div>

                {/* Allow Non-Subscribers - shown for PAY_PER_ENTRY and HYBRID */}
                {(formValues.pricingModel === "PAY_PER_ENTRY" ||
                  formValues.pricingModel === "HYBRID") && (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>{t.allowNonSubscribers}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t.allowNonSubscribersHint}
                      </p>
                    </div>
                    <Switch
                      checked={formValues.allowNonSubscribers || false}
                      onCheckedChange={(checked) =>
                        setValue("allowNonSubscribers", checked)
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  {t.bookingSettingsTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Advance Booking Days */}
                <div className="space-y-2">
                  <Label>{t.advanceBookingDays}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      {...register("advanceBookingDays")}
                      className="pe-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {t.days}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.advanceBookingDaysHint}</p>
                </div>

                {/* Cancellation Deadline */}
                <div className="space-y-2">
                  <Label>{t.cancellationDeadline}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={72}
                      {...register("cancellationDeadlineHours")}
                      className="pe-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {t.hours}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.cancellationDeadlineHint}</p>
                </div>

                {/* Late Cancellation Fee */}
                <div className="space-y-2">
                  <Label>{t.lateCancellationFee}</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        {...register("lateCancellationFeeAmount")}
                        className="ps-10"
                        placeholder="0.00"
                      />
                    </div>
                    <Select
                      value={formValues.lateCancellationFeeCurrency || "SAR"}
                      onValueChange={(value) =>
                        setValue("lateCancellationFeeCurrency", value)
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.lateCancellationFeeHint}</p>
                </div>

                {/* No-Show Fee */}
                <div className="space-y-2">
                  <Label>{t.noShowFee}</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        {...register("noShowFeeAmount")}
                        className="ps-10"
                        placeholder="0.00"
                      />
                    </div>
                    <Select
                      value={formValues.noShowFeeCurrency || "SAR"}
                      onValueChange={(value) =>
                        setValue("noShowFeeCurrency", value)
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.noShowFeeHint}</p>
                </div>

                {/* Online Bookable Spots */}
                <div className="space-y-2">
                  <Label>{t.onlineBookableSpots}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={formValues.capacity || 100}
                    {...register("onlineBookableSpots")}
                    placeholder={String(formValues.capacity || 20)}
                  />
                  <p className="text-xs text-muted-foreground">{t.onlineBookableSpotsHint}</p>
                </div>
              </CardContent>
            </Card>

            {/* Spot Booking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                  {t.spotBookingTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable Spot Booking */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>{t.spotBookingEnabled}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t.spotBookingEnabledHint}
                    </p>
                  </div>
                  <Switch
                    checked={formValues.spotBookingEnabled || false}
                    onCheckedChange={(checked) =>
                      setValue("spotBookingEnabled", checked)
                    }
                  />
                </div>

                {/* Room Layout - only when spot booking is enabled */}
                {formValues.spotBookingEnabled && (
                  <div className="space-y-2">
                    <Label>{t.roomLayout}</Label>
                    <Select
                      value={formValues.roomLayoutId || ""}
                      onValueChange={(value) =>
                        setValue("roomLayoutId", value || undefined)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.selectRoomLayout} />
                      </SelectTrigger>
                      <SelectContent>
                        {activeLayouts.map((layout) => (
                          <SelectItem key={layout.id} value={layout.id}>
                            {locale === "ar" && layout.name?.ar
                              ? layout.name.ar
                              : layout.name?.en || "Unnamed Layout"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{t.roomLayoutHint}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Schedule */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {t.scheduleTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{t.scheduleHint}</p>

              {fields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">{t.noSchedules}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.noSchedulesHint}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex flex-col sm:flex-row gap-3 p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          {t.dayOfWeek}
                        </Label>
                        <Select
                          value={watch(`schedules.${index}.dayOfWeek`)}
                          onValueChange={(value) =>
                            setValue(
                              `schedules.${index}.dayOfWeek`,
                              value as DayOfWeek
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem key={day} value={day}>
                                {dayLabels[day]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          {t.startTime}
                        </Label>
                        <Input
                          type="time"
                          {...register(`schedules.${index}.startTime`)}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          {t.endTime}
                        </Label>
                        <Input
                          type="time"
                          {...register(`schedules.${index}.endTime`)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    dayOfWeek: "MONDAY",
                    startTime: "09:00",
                    endTime: "10:00",
                  })
                }
                className="w-full"
              >
                <Plus className="h-4 w-4 me-2" />
                {t.addSchedule}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  {t.reviewTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">{t.reviewHint}</p>

                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t.basicInfo}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 ps-6">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t.classNameEn}
                      </p>
                      <p className="font-medium">
                        {formValues.name?.en || t.notSet}
                      </p>
                    </div>
                    {formValues.name?.ar && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t.classNameAr}
                        </p>
                        <p className="font-medium" dir="rtl">
                          {formValues.name.ar}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">{t.capacity}</p>
                      <p className="font-medium">{formValues.capacity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.duration}</p>
                      <p className="font-medium">
                        {formValues.durationMinutes} {t.minutes}
                      </p>
                    </div>
                    {formValues.classType && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t.classType}</p>
                        <p className="font-medium">{classTypeLabels[formValues.classType] || formValues.classType}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">{t.difficultyLevel}</p>
                      <p className="font-medium">{difficultyLabels[formValues.difficultyLevel || "ALL_LEVELS"]}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.genderRestriction}</p>
                      <p className="font-medium">{genderLabels[formValues.genderRestriction || "MIXED"]}</p>
                    </div>
                    {formValues.colorCode && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t.colorCode}</p>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full border"
                            style={{ backgroundColor: formValues.colorCode }}
                          />
                          <span className="font-medium text-xs">{formValues.colorCode}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t my-4" />

                {/* Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    {t.settings}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 ps-6">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.trainer}</p>
                      <p className="font-medium">
                        {selectedTrainer
                          ? selectedTrainer.displayName?.en || selectedTrainer.displayName?.ar || selectedTrainer.email
                          : t.noTrainer}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.location}</p>
                      <p className="font-medium">
                        {selectedLocation
                          ? selectedLocation.name?.en ||
                            selectedLocation.name?.ar ||
                            "Unnamed"
                          : t.noLocation}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t my-4" />

                {/* Access Policy */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t.accessPolicyTitle}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 ps-6">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.accessPolicy}</p>
                      <p className="font-medium">
                        {accessPolicyLabels[formValues.accessPolicy || "MEMBERS_ONLY"]}
                      </p>
                    </div>
                    {formValues.accessPolicy === "SPECIFIC_MEMBERSHIPS" &&
                      formValues.eligiblePlanIds &&
                      formValues.eligiblePlanIds.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.eligiblePlans}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {formValues.eligiblePlanIds.map((planId) => {
                              const plan = plans.find((p) => p.id === planId);
                              return (
                                <Badge key={planId} variant="secondary" className="text-xs">
                                  {plan
                                    ? locale === "ar" && plan.name?.ar
                                      ? plan.name.ar
                                      : plan.name?.en || "Unnamed"
                                    : planId.slice(0, 8)}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                <div className="border-t my-4" />

                {/* Pricing Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {t.pricingSettings}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 ps-6">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.pricingModel}</p>
                      <p className="font-medium">
                        {formValues.pricingModel === "INCLUDED_IN_MEMBERSHIP"
                          ? t.pricingIncluded
                          : formValues.pricingModel === "PAY_PER_ENTRY"
                          ? t.pricingPayPerEntry
                          : formValues.pricingModel === "CLASS_PACK_ONLY"
                          ? t.pricingClassPackOnly
                          : t.pricingHybrid}
                      </p>
                    </div>
                    {(formValues.pricingModel === "PAY_PER_ENTRY" ||
                      formValues.pricingModel === "HYBRID") &&
                      formValues.dropInPriceAmount && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t.dropInPrice}</p>
                          <p className="font-medium">
                            {formValues.dropInPriceAmount} {formValues.dropInPriceCurrency || "SAR"}
                          </p>
                        </div>
                      )}
                    <div>
                      <p className="text-sm text-muted-foreground">{t.taxRate}</p>
                      <p className="font-medium">{formValues.taxRate || 15}%</p>
                    </div>
                    {(formValues.pricingModel === "PAY_PER_ENTRY" ||
                      formValues.pricingModel === "HYBRID") && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t.allowNonSubscribers}</p>
                        <p className="font-medium">
                          {formValues.allowNonSubscribers
                            ? locale === "ar"
                              ? "نعم"
                              : "Yes"
                            : locale === "ar"
                            ? "لا"
                            : "No"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t my-4" />

                {/* Booking Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {t.bookingSettings}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 ps-6">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.advanceBookingDays}</p>
                      <p className="font-medium">
                        {formValues.advanceBookingDays || 7} {t.days}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.cancellationDeadline}</p>
                      <p className="font-medium">
                        {formValues.cancellationDeadlineHours || 2} {t.hours}
                      </p>
                    </div>
                    {formValues.lateCancellationFeeAmount && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t.lateCancellationFee}</p>
                        <p className="font-medium">
                          {formValues.lateCancellationFeeAmount} {formValues.lateCancellationFeeCurrency || "SAR"}
                        </p>
                      </div>
                    )}
                    {formValues.noShowFeeAmount && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t.noShowFee}</p>
                        <p className="font-medium">
                          {formValues.noShowFeeAmount} {formValues.noShowFeeCurrency || "SAR"}
                        </p>
                      </div>
                    )}
                    {formValues.onlineBookableSpots && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t.onlineBookableSpots}</p>
                        <p className="font-medium">{formValues.onlineBookableSpots}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Spot Booking */}
                {formValues.spotBookingEnabled && (
                  <>
                    <div className="border-t my-4" />
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        {t.spotBookingTitle}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 ps-6">
                        <div>
                          <p className="text-sm text-muted-foreground">{t.spotBookingEnabled}</p>
                          <p className="font-medium">
                            {locale === "ar" ? "نعم" : "Yes"}
                          </p>
                        </div>
                        {formValues.roomLayoutId && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t.roomLayout}</p>
                            <p className="font-medium">
                              {(() => {
                                const layout = activeLayouts.find(
                                  (l) => l.id === formValues.roomLayoutId
                                );
                                return layout
                                  ? locale === "ar" && layout.name?.ar
                                    ? layout.name.ar
                                    : layout.name?.en || "Unnamed"
                                  : t.notSet;
                              })()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="border-t my-4" />

                {/* Schedules */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t.schedules}
                  </h3>
                  <div className="ps-6">
                    {formValues.schedules && formValues.schedules.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formValues.schedules.map((schedule, index) => (
                          <Badge key={index} variant="secondary" className="gap-1">
                            {dayShortLabels[schedule.dayOfWeek]}:{" "}
                            {schedule.startTime} - {schedule.endTime}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">{t.noSchedules}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <div>
            {currentStep > 1 ? (
              <Button type="button" variant="outline" onClick={handleBack}>
                {isRTL ? (
                  <ArrowRight className="h-4 w-4 me-2" />
                ) : (
                  <ArrowLeft className="h-4 w-4 me-2" />
                )}
                {t.back}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t.cancel}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep === 3 && (
              <Button type="button" variant="ghost" onClick={handleNext}>
                {t.skip}
              </Button>
            )}
            {currentStep < 4 ? (
              <Button type="button" onClick={handleNext}>
                {t.next}
                {isRTL ? (
                  <ArrowLeft className="h-4 w-4 ms-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 ms-2" />
                )}
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {t.creating}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 me-2" />
                    {t.create}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
