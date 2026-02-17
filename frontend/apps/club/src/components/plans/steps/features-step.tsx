"use client";

import { useLocale } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@liyaqa/shared/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Waves, Flame, Lock, Dumbbell, Snowflake, Users, LayoutGrid, UserCheck } from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import type { PlanWizardFormData } from "../plan-schemas";

interface FeaturesStepProps {
  form: UseFormReturn<PlanWizardFormData>;
}

interface FacilityTileProps {
  icon: typeof Waves;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function FacilityTile({ icon: Icon, label, checked, onChange }: FacilityTileProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
        checked
          ? "border-primary bg-primary/5 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-primary/30"
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-sm font-medium">{label}</span>
      <div
        className={cn(
          "h-2 w-2 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      />
    </button>
  );
}

export function FeaturesStep({ form }: FeaturesStepProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { watch, setValue, register } = form;

  const hasGuestPasses = watch("hasGuestPasses");
  const maxClasses = watch("maxClassesPerPeriod");
  const isUnlimited = maxClasses === null || maxClasses === undefined;

  return (
    <div className="space-y-8">
      {/* Facility Access */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">
          {isAr ? "الوصول للمرافق" : "Facility Access"}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <FacilityTile
            icon={Waves}
            label={isAr ? "مسبح" : "Pool"}
            checked={watch("hasPoolAccess")}
            onChange={(v) => setValue("hasPoolAccess", v)}
          />
          <FacilityTile
            icon={Flame}
            label={isAr ? "ساونا" : "Sauna"}
            checked={watch("hasSaunaAccess")}
            onChange={(v) => setValue("hasSaunaAccess", v)}
          />
          <FacilityTile
            icon={Lock}
            label={isAr ? "خزانة" : "Locker"}
            checked={watch("hasLockerAccess")}
            onChange={(v) => setValue("hasLockerAccess", v)}
          />
        </div>
      </div>

      {/* GX Class Access */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">
          <LayoutGrid className="inline h-4 w-4 me-2" />
          {isAr ? "الوصول للحصص الجماعية" : "Group Exercise Access"}
        </h3>

        {/* Class Access Level */}
        <RadioGroup
          value={watch("classAccessLevel") || "UNLIMITED"}
          onValueChange={(v) => {
            setValue("classAccessLevel", v as "UNLIMITED" | "LIMITED" | "NO_ACCESS");
            if (v === "UNLIMITED") {
              setValue("maxClassesPerPeriod", null);
            } else if (v === "LIMITED") {
              setValue("maxClassesPerPeriod", maxClasses ?? 10);
            } else {
              setValue("maxClassesPerPeriod", null);
            }
          }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="UNLIMITED" id="access-unlimited" />
            <Label htmlFor="access-unlimited" className="font-normal cursor-pointer">
              <Users className="inline h-4 w-4 me-1" />
              {isAr ? "حصص غير محدودة" : "Unlimited classes"}
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="LIMITED" id="access-limited" />
            <Label htmlFor="access-limited" className="font-normal cursor-pointer">
              {isAr ? "محدود:" : "Limited:"}
            </Label>
            {watch("classAccessLevel") === "LIMITED" && (
              <>
                <Input
                  type="number"
                  min="1"
                  className="w-24"
                  {...register("maxClassesPerPeriod")}
                />
                <span className="text-sm text-muted-foreground">
                  {isAr ? "حصة لكل فترة" : "classes per period"}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="NO_ACCESS" id="access-none" />
            <Label htmlFor="access-none" className="font-normal cursor-pointer">
              {isAr ? "بدون حصص جماعية" : "No GX access (gym floor only)"}
            </Label>
          </div>
        </RadioGroup>

        {/* Eligible Class Categories */}
        {watch("classAccessLevel") !== "NO_ACCESS" && (
          <div className="space-y-2 ps-6">
            <Label className="text-sm font-normal text-muted-foreground">
              {isAr ? "تصنيفات الحصص المؤهلة" : "Eligible Class Categories"}
            </Label>
            <Select
              value={watch("eligibleClassCategories") || "ALL"}
              onValueChange={(v) =>
                setValue("eligibleClassCategories", v === "ALL" ? null : v)
              }
            >
              <SelectTrigger className="w-64">
                <SelectValue
                  placeholder={isAr ? "جميع الأنواع" : "All class types"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {isAr ? "جميع الأنواع" : "All class types"}
                </SelectItem>
                <SelectItem value="YOGA,PILATES">
                  {isAr ? "يوغا وبيلاتس" : "Yoga & Pilates"}
                </SelectItem>
                <SelectItem value="SPINNING,CROSSFIT">
                  {isAr ? "سبينينغ وكروس فت" : "Spinning & CrossFit"}
                </SelectItem>
                <SelectItem value="GROUP_FITNESS">
                  {isAr ? "تمارين جماعية فقط" : "Group Fitness only"}
                </SelectItem>
                <SelectItem value="SWIMMING">
                  {isAr ? "سباحة فقط" : "Swimming only"}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "اختر أنواع الحصص التي يمكن لأعضاء هذه الباقة حجزها"
                : "Select which class types members on this plan can book"}
            </p>
          </div>
        )}
      </div>

      {/* PT Access */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">
          <UserCheck className="inline h-4 w-4 me-2" />
          {isAr ? "الوصول للتدريب الشخصي" : "Personal Training Access"}
        </h3>

        <RadioGroup
          value={watch("ptAccessLevel") || "NO_ACCESS"}
          onValueChange={(v) => {
            setValue("ptAccessLevel", v as "UNLIMITED" | "LIMITED" | "NO_ACCESS");
            if (v === "UNLIMITED") {
              setValue("maxPtSessionsPerPeriod", null);
            } else if (v === "LIMITED") {
              setValue("maxPtSessionsPerPeriod", watch("maxPtSessionsPerPeriod") ?? 4);
            } else {
              setValue("maxPtSessionsPerPeriod", null);
              setValue("ptSessionsIncluded", null);
            }
          }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="UNLIMITED" id="pt-access-unlimited" />
            <Label htmlFor="pt-access-unlimited" className="font-normal cursor-pointer">
              {isAr ? "جلسات غير محدودة" : "Unlimited PT sessions"}
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="LIMITED" id="pt-access-limited" />
            <Label htmlFor="pt-access-limited" className="font-normal cursor-pointer">
              {isAr ? "محدود:" : "Limited:"}
            </Label>
            {watch("ptAccessLevel") === "LIMITED" && (
              <>
                <Input
                  type="number"
                  min="1"
                  className="w-24"
                  {...register("maxPtSessionsPerPeriod")}
                />
                <span className="text-sm text-muted-foreground">
                  {isAr ? "جلسة لكل فترة" : "sessions per period"}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="NO_ACCESS" id="pt-access-none" />
            <Label htmlFor="pt-access-none" className="font-normal cursor-pointer">
              {isAr ? "بدون تدريب شخصي" : "No PT access"}
            </Label>
          </div>
        </RadioGroup>

        {watch("ptAccessLevel") !== "NO_ACCESS" && (
          <div className="space-y-2 ps-6">
            <Label className="text-sm font-normal text-muted-foreground">
              {isAr ? "جلسات مشمولة لكل فترة فوترة" : "Included PT sessions per billing period"}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                className="w-24"
                placeholder="0"
                {...register("ptSessionsIncluded")}
              />
              <span className="text-sm text-muted-foreground">
                {isAr ? "جلسة مشمولة" : "sessions included"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "عدد جلسات التدريب الشخصي المشمولة في سعر الاشتراك"
                : "Number of PT sessions included in the subscription price (0 = member pays per session)"}
            </p>
          </div>
        )}
      </div>

      {/* Guest Access */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">
          <Dumbbell className="inline h-4 w-4 me-2" />
          {isAr ? "ضيوف" : "Guest Access"}
        </h3>
        <div className="flex items-center gap-4">
          <Switch
            checked={hasGuestPasses}
            onCheckedChange={(v) => {
              setValue("hasGuestPasses", v);
              if (!v) setValue("guestPassesCount", 0);
            }}
          />
          <Label className="font-normal">
            {isAr ? "تذاكر ضيوف" : "Guest Passes"}
          </Label>
          {hasGuestPasses && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                className="w-20"
                {...register("guestPassesCount")}
              />
              <span className="text-sm text-muted-foreground">
                {isAr ? "لكل فترة" : "per period"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Freeze Policy */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">
          <Snowflake className="inline h-4 w-4 me-2" />
          {isAr ? "سياسة التجميد" : "Freeze Policy"}
        </h3>
        <div className="flex items-center gap-3">
          <Label className="font-normal">
            {isAr ? "أيام التجميد المسموحة:" : "Freeze Days Allowed:"}
          </Label>
          <Input
            type="number"
            min="0"
            className="w-20"
            {...register("freezeDaysAllowed")}
          />
          <span className="text-sm text-muted-foreground">
            {isAr ? "في السنة" : "per year"}
          </span>
        </div>
      </div>
    </div>
  );
}
