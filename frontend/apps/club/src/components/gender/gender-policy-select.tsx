"use client";

import { useLocale } from "next-intl";
import { Users, User, UserCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { GENDER_POLICIES, type GenderPolicy } from "@liyaqa/shared/types/gender-policy";
import { cn } from "@liyaqa/shared/utils";

interface GenderPolicySelectProps {
  value: GenderPolicy | null;
  onChange: (value: GenderPolicy) => void;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}

const POLICY_ICONS: Record<GenderPolicy, React.ReactNode> = {
  MIXED: <Users className="h-4 w-4" />,
  MALE_ONLY: <User className="h-4 w-4 text-blue-500" />,
  FEMALE_ONLY: <User className="h-4 w-4 text-pink-500" />,
  TIME_BASED: <UserCheck className="h-4 w-4 text-amber-500" />,
};

export function GenderPolicySelect({
  value,
  onChange,
  disabled = false,
  showLabel = true,
  className,
}: GenderPolicySelectProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const texts = {
    label: isArabic ? "سياسة الجنس" : "Gender Policy",
    placeholder: isArabic ? "اختر السياسة" : "Select policy",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && <Label>{texts.label}</Label>}
      <Select
        value={value || undefined}
        onValueChange={(v) => onChange(v as GenderPolicy)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={texts.placeholder}>
            {value && (
              <div className="flex items-center gap-2">
                {POLICY_ICONS[value]}
                <span>{isArabic ? GENDER_POLICIES[value].ar : GENDER_POLICIES[value].en}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(GENDER_POLICIES) as GenderPolicy[]).map((policy) => (
            <SelectItem key={policy} value={policy}>
              <div className="flex items-center gap-2">
                {POLICY_ICONS[policy]}
                <span>{isArabic ? GENDER_POLICIES[policy].ar : GENDER_POLICIES[policy].en}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface GenderRestrictionSelectProps {
  value: "MIXED" | "MALE_ONLY" | "FEMALE_ONLY" | null;
  onChange: (value: "MIXED" | "MALE_ONLY" | "FEMALE_ONLY" | null) => void;
  disabled?: boolean;
  allowNull?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function GenderRestrictionSelect({
  value,
  onChange,
  disabled = false,
  allowNull = true,
  showLabel = true,
  className,
}: GenderRestrictionSelectProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const texts = {
    label: isArabic ? "تقييد الجنس" : "Gender Restriction",
    placeholder: isArabic ? "اختر التقييد" : "Select restriction",
    noRestriction: isArabic ? "لا يوجد تقييد (حسب الموقع)" : "No restriction (follows location)",
    maleOnly: isArabic ? "رجال فقط" : "Male Only",
    femaleOnly: isArabic ? "نساء فقط" : "Female Only",
    mixed: isArabic ? "مختلط" : "Mixed",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && <Label>{texts.label}</Label>}
      <Select
        value={value || "null"}
        onValueChange={(v) => onChange(v === "null" ? null : (v as "MIXED" | "MALE_ONLY" | "FEMALE_ONLY"))}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={texts.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowNull && (
            <SelectItem value="null">
              <span className="text-muted-foreground">{texts.noRestriction}</span>
            </SelectItem>
          )}
          <SelectItem value="MIXED">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {texts.mixed}
            </div>
          </SelectItem>
          <SelectItem value="MALE_ONLY">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              {texts.maleOnly}
            </div>
          </SelectItem>
          <SelectItem value="FEMALE_ONLY">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-pink-500" />
              {texts.femaleOnly}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

interface GenderStatusBadgeProps {
  policy: GenderPolicy;
  currentGender?: "MALE" | "FEMALE" | null;
  size?: "sm" | "default";
}

export function GenderStatusBadge({ policy, currentGender, size = "default" }: GenderStatusBadgeProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const getVariant = (): "default" | "secondary" | "outline" => {
    if (policy === "MALE_ONLY" || currentGender === "MALE") return "default";
    if (policy === "FEMALE_ONLY" || currentGender === "FEMALE") return "secondary";
    return "outline";
  };

  const getText = () => {
    if (policy === "TIME_BASED" && currentGender) {
      return currentGender === "MALE"
        ? isArabic
          ? "ساعات الرجال"
          : "Male Hours"
        : isArabic
        ? "ساعات النساء"
        : "Female Hours";
    }
    return isArabic ? GENDER_POLICIES[policy].ar : GENDER_POLICIES[policy].en;
  };

  const getColorClass = () => {
    if (policy === "MALE_ONLY" || currentGender === "MALE") return "bg-blue-100 text-blue-800 border-blue-200";
    if (policy === "FEMALE_ONLY" || currentGender === "FEMALE") return "bg-pink-100 text-pink-800 border-pink-200";
    if (policy === "TIME_BASED") return "bg-amber-100 text-amber-800 border-amber-200";
    return "";
  };

  return (
    <Badge
      variant={getVariant()}
      className={cn(
        "flex items-center gap-1",
        getColorClass(),
        size === "sm" && "text-xs py-0.5"
      )}
    >
      {POLICY_ICONS[policy]}
      {getText()}
    </Badge>
  );
}
