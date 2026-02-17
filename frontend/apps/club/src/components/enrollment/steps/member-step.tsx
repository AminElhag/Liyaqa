"use client";

import { useLocale } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@liyaqa/shared/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@liyaqa/shared/components/ui/select";
import { useMembers } from "@liyaqa/shared/queries/use-members";
import { cn } from "@liyaqa/shared/utils";
import type { EnrollmentFormData } from "../enrollment-schemas";
import { useState } from "react";

interface MemberStepProps {
  form: UseFormReturn<EnrollmentFormData>;
}

export function MemberStep({ form }: MemberStepProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [memberSearch, setMemberSearch] = useState("");

  const memberType = form.watch("memberType");

  const { data: membersData } = useMembers(
    { search: memberSearch, page: 0, size: 10 },
    { enabled: memberType === "existing" && memberSearch.length >= 2 }
  );

  const texts = {
    memberType: isAr ? "نوع العضو" : "Member Type",
    existing: isAr ? "عضو حالي" : "Existing Member",
    new: isAr ? "عضو جديد" : "New Member",
    searchMember: isAr ? "ابحث عن عضو..." : "Search for a member...",
    selectMember: isAr ? "اختر عضو" : "Select a member",
    firstName: isAr ? "الاسم الأول" : "First Name",
    firstNameAr: isAr ? "الاسم الأول (عربي)" : "First Name (Arabic)",
    lastName: isAr ? "اسم العائلة" : "Last Name",
    lastNameAr: isAr ? "اسم العائلة (عربي)" : "Last Name (Arabic)",
    email: isAr ? "البريد الإلكتروني" : "Email",
    phone: isAr ? "رقم الهاتف" : "Phone",
    dob: isAr ? "تاريخ الميلاد" : "Date of Birth",
    gender: isAr ? "الجنس" : "Gender",
    male: isAr ? "ذكر" : "Male",
    female: isAr ? "أنثى" : "Female",
    nationalId: isAr ? "رقم الهوية" : "National ID",
  };

  const members = membersData?.content ?? [];
  const errors = form.formState.errors;

  return (
    <div className="space-y-6">
      {/* Member type toggle */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{texts.memberType}</Label>
        <RadioGroup
          value={memberType}
          onValueChange={(v) => {
            form.setValue("memberType", v as "existing" | "new");
            if (v === "existing") {
              form.setValue("firstNameEn", "");
              form.setValue("lastNameEn", "");
              form.setValue("email", "");
            } else {
              form.setValue("existingMemberId", "");
            }
          }}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="existing" id="type-existing" />
            <Label htmlFor="type-existing" className="cursor-pointer font-normal">
              {texts.existing}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="new" id="type-new" />
            <Label htmlFor="type-new" className="cursor-pointer font-normal">
              {texts.new}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {memberType === "existing" ? (
        /* Existing member search */
        <div className="space-y-3">
          <Label>{texts.searchMember}</Label>
          <Input
            placeholder={texts.searchMember}
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            autoFocus
          />
          {members.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-md border">
              {members.map((m) => {
                const name = isAr
                  ? `${m.firstName.ar || m.firstName.en} ${m.lastName.ar || m.lastName.en}`
                  : `${m.firstName.en} ${m.lastName.en}`;
                const isSelected = form.watch("existingMemberId") === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => form.setValue("existingMemberId", m.id, { shouldValidate: true })}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-start text-sm transition-colors hover:bg-muted",
                      isSelected && "bg-primary/10 font-medium"
                    )}
                  >
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    {m.phone && (
                      <span className="text-xs text-muted-foreground">{m.phone}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {errors.existingMemberId && (
            <p className="text-sm text-destructive">{errors.existingMemberId.message}</p>
          )}
        </div>
      ) : (
        /* New member form */
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{texts.firstName} *</Label>
            <Input
              {...form.register("firstNameEn")}
              placeholder={texts.firstName}
              autoFocus
            />
            {errors.firstNameEn && (
              <p className="text-sm text-destructive">{errors.firstNameEn.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{texts.lastName} *</Label>
            <Input {...form.register("lastNameEn")} placeholder={texts.lastName} />
            {errors.lastNameEn && (
              <p className="text-sm text-destructive">{errors.lastNameEn.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{texts.firstNameAr}</Label>
            <Input {...form.register("firstNameAr")} placeholder={texts.firstNameAr} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label>{texts.lastNameAr}</Label>
            <Input {...form.register("lastNameAr")} placeholder={texts.lastNameAr} dir="rtl" />
          </div>
          <div className="space-y-2">
            <Label>{texts.email} *</Label>
            <Input {...form.register("email")} type="email" placeholder={texts.email} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{texts.phone}</Label>
            <Input {...form.register("phone")} type="tel" placeholder="+966..." />
          </div>
          <div className="space-y-2">
            <Label>{texts.dob}</Label>
            <Input {...form.register("dateOfBirth")} type="date" />
          </div>
          <div className="space-y-2">
            <Label>{texts.gender}</Label>
            <Select
              value={form.watch("gender") ?? ""}
              onValueChange={(v) => form.setValue("gender", v as "MALE" | "FEMALE")}
            >
              <SelectTrigger>
                <SelectValue placeholder={texts.gender} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">{texts.male}</SelectItem>
                <SelectItem value="FEMALE">{texts.female}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{texts.nationalId}</Label>
            <Input {...form.register("nationalId")} placeholder={texts.nationalId} />
          </div>
        </div>
      )}
    </div>
  );
}
