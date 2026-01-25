"use client";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { AssignmentRule, AssignmentRuleType } from "@/types/lead-rules";
import { ASSIGNMENT_TYPE_LABELS, LEAD_SOURCE_LABELS } from "@/types/lead-rules";
import { useUsers } from "@/queries/use-users";

const assignmentRuleFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  ruleType: z.enum(["ROUND_ROBIN", "LOCATION_BASED", "SOURCE_BASED", "MANUAL"]),
  priority: z.number().min(0).max(100),
  isActive: z.boolean().default(true),
  config: z.object({
    userIds: z.array(z.string()).optional(),
    locationMappings: z
      .array(
        z.object({
          location: z.string().min(1),
          userId: z.string().min(1),
        })
      )
      .optional(),
    sourceMappings: z
      .array(
        z.object({
          source: z.string().min(1),
          userId: z.string().min(1),
        })
      )
      .optional(),
    defaultUserId: z.string().nullable().optional(),
  }),
});

export type AssignmentRuleFormData = z.infer<typeof assignmentRuleFormSchema>;

interface AssignmentRuleFormProps {
  rule?: AssignmentRule;
  onSubmit: (data: AssignmentRuleFormData) => void;
  isPending?: boolean;
}

export function AssignmentRuleForm({
  rule,
  onSubmit,
  isPending,
}: AssignmentRuleFormProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const { data: usersData } = useUsers({ size: 100, active: true });
  const users = usersData?.content ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<AssignmentRuleFormData>({
    resolver: zodResolver(assignmentRuleFormSchema),
    defaultValues: {
      name: rule?.name || "",
      ruleType: rule?.ruleType || "ROUND_ROBIN",
      priority: rule?.priority || 0,
      isActive: rule?.isActive ?? true,
      config: {
        userIds: rule?.config.userIds || [],
        locationMappings: rule?.config.locationMappings || [],
        sourceMappings: rule?.config.sourceMappings || [],
        defaultUserId: rule?.config.defaultUserId || null,
      },
    },
  });

  const ruleType = watch("ruleType");
  const selectedUserIds = watch("config.userIds") || [];

  const {
    fields: locationFields,
    append: appendLocation,
    remove: removeLocation,
  } = useFieldArray({
    control,
    name: "config.locationMappings",
  });

  const {
    fields: sourceFields,
    append: appendSource,
    remove: removeSource,
  } = useFieldArray({
    control,
    name: "config.sourceMappings",
  });

  const handleUserToggle = (
    userId: string,
    checked: boolean,
    currentUserIds: string[],
    onChange: (value: string[]) => void
  ) => {
    if (checked) {
      onChange([...currentUserIds, userId]);
    } else {
      onChange(currentUserIds.filter((id) => id !== userId));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isArabic ? "معلومات القاعدة" : "Rule Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {isArabic ? "الاسم" : "Name"}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder={
                isArabic
                  ? "مثال: التوزيع الدوري الافتراضي"
                  : "e.g., Default Round Robin"
              }
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ruleType">
                {isArabic ? "نوع القاعدة" : "Rule Type"}
                <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="ruleType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!rule}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(ASSIGNMENT_TYPE_LABELS) as AssignmentRuleType[]
                      ).map((type) => (
                        <SelectItem key={type} value={type}>
                          {isArabic
                            ? ASSIGNMENT_TYPE_LABELS[type].ar
                            : ASSIGNMENT_TYPE_LABELS[type].en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {!!rule && (
                <p className="text-xs text-muted-foreground">
                  {isArabic
                    ? "لا يمكن تغيير نوع القاعدة بعد الإنشاء"
                    : "Rule type cannot be changed after creation"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">
                {isArabic ? "الأولوية" : "Priority"}
              </Label>
              <Input
                id="priority"
                type="number"
                {...register("priority", { valueAsNumber: true })}
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                {isArabic
                  ? "القواعد ذات الأولوية الأعلى تُنفذ أولاً"
                  : "Higher priority rules are evaluated first"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isActive">{isArabic ? "مفعل" : "Active"}</Label>
          </div>
        </CardContent>
      </Card>

      {/* Configuration based on rule type */}
      {ruleType === "ROUND_ROBIN" && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isArabic ? "إعدادات التوزيع الدوري" : "Round Robin Settings"}
            </CardTitle>
            <CardDescription>
              {isArabic
                ? "اختر المستخدمين لتوزيع العملاء المحتملين عليهم بالتناوب"
                : "Select users to distribute leads among in rotation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              name="config.userIds"
              control={control}
              render={({ field }) => (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={field.value?.includes(user.id)}
                        onCheckedChange={(checked) =>
                          handleUserToggle(
                            user.id,
                            !!checked,
                            field.value || [],
                            field.onChange
                          )
                        }
                      />
                      <Label
                        htmlFor={`user-${user.id}`}
                        className="text-sm font-normal"
                      >
                        {isArabic
                          ? user.displayName?.ar || user.displayName?.en
                          : user.displayName?.en || user.displayName?.ar}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            />
            {selectedUserIds.length === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {isArabic
                  ? "يجب اختيار مستخدم واحد على الأقل"
                  : "Select at least one user"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {ruleType === "LOCATION_BASED" && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isArabic ? "تعيينات الموقع" : "Location Mappings"}
            </CardTitle>
            <CardDescription>
              {isArabic
                ? "تعيين مستخدمين لمواقع محددة"
                : "Assign users to specific locations"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {locationFields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>{isArabic ? "الموقع" : "Location"}</Label>
                  <Input
                    {...register(`config.locationMappings.${index}.location`)}
                    placeholder={isArabic ? "مثال: الرياض" : "e.g., Riyadh"}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>{isArabic ? "المستخدم" : "User"}</Label>
                  <Controller
                    name={`config.locationMappings.${index}.userId`}
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={isArabic ? "اختر مستخدم" : "Select user"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {isArabic
                                ? user.displayName?.ar || user.displayName?.en
                                : user.displayName?.en || user.displayName?.ar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLocation(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendLocation({ location: "", userId: "" })}
            >
              <Plus className="h-4 w-4 me-2" />
              {isArabic ? "إضافة موقع" : "Add Location"}
            </Button>

            <div className="pt-4 border-t">
              <div className="space-y-2">
                <Label>{isArabic ? "المستخدم الافتراضي" : "Default User"}</Label>
                <Controller
                  name="config.defaultUserId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={(val) => field.onChange(val || null)}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={isArabic ? "اختر مستخدم" : "Select user"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {isArabic
                              ? user.displayName?.ar || user.displayName?.en
                              : user.displayName?.en || user.displayName?.ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {isArabic
                    ? "يُستخدم عندما لا يوجد تعيين مطابق"
                    : "Used when no matching location is found"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {ruleType === "SOURCE_BASED" && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isArabic ? "تعيينات المصدر" : "Source Mappings"}
            </CardTitle>
            <CardDescription>
              {isArabic
                ? "تعيين مستخدمين لمصادر العملاء المحتملين"
                : "Assign users to lead sources"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sourceFields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>{isArabic ? "المصدر" : "Source"}</Label>
                  <Controller
                    name={`config.sourceMappings.${index}.source`}
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={isArabic ? "اختر مصدر" : "Select source"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(LEAD_SOURCE_LABELS).map(
                            ([value, labels]) => (
                              <SelectItem key={value} value={value}>
                                {isArabic ? labels.ar : labels.en}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>{isArabic ? "المستخدم" : "User"}</Label>
                  <Controller
                    name={`config.sourceMappings.${index}.userId`}
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={isArabic ? "اختر مستخدم" : "Select user"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {isArabic
                                ? user.displayName?.ar || user.displayName?.en
                                : user.displayName?.en || user.displayName?.ar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSource(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendSource({ source: "", userId: "" })}
            >
              <Plus className="h-4 w-4 me-2" />
              {isArabic ? "إضافة مصدر" : "Add Source"}
            </Button>

            <div className="pt-4 border-t">
              <div className="space-y-2">
                <Label>{isArabic ? "المستخدم الافتراضي" : "Default User"}</Label>
                <Controller
                  name="config.defaultUserId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={(val) => field.onChange(val || null)}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={isArabic ? "اختر مستخدم" : "Select user"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {isArabic
                              ? user.displayName?.ar || user.displayName?.en
                              : user.displayName?.en || user.displayName?.ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {isArabic
                    ? "يُستخدم عندما لا يوجد تعيين مطابق"
                    : "Used when no matching source is found"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {ruleType === "MANUAL" && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isArabic ? "التعيين اليدوي" : "Manual Assignment"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {isArabic
                ? "هذه القاعدة تتيح التعيين اليدوي للعملاء المحتملين. لا يوجد إعدادات إضافية مطلوبة."
                : "This rule allows manual assignment of leads. No additional configuration needed."}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isArabic
              ? "جارٍ الحفظ..."
              : "Saving..."
            : rule
            ? isArabic
              ? "تحديث"
              : "Update"
            : isArabic
            ? "إنشاء"
            : "Create"}
        </Button>
      </div>
    </form>
  );
}
