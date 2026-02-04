"use client";

import { UseFormReturn } from "react-hook-form";
import { useLocale } from "next-intl";
import {
  User,
  MapPin,
  Heart,
  FileText,
  CreditCard,
  Check,
  AlertCircle,
  Edit,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@liyaqa/shared/components/ui/alert";
import { usePlans } from "@liyaqa/shared/queries/use-plans";
import { useActiveAgreements } from "@liyaqa/shared/queries/use-agreements";
import type { RegistrationData } from "../schemas/registration-schema";
import { needsMedicalClearance } from "../schemas/registration-schema";

interface ReviewStepProps {
  form: UseFormReturn<RegistrationData>;
  onEditStep: (step: number) => void;
}

export function ReviewStep({ form, onEditStep }: ReviewStepProps) {
  const locale = useLocale();
  const formData = form.watch();

  const { data: plansData } = usePlans({ active: true });
  const { data: agreements = [] } = useActiveAgreements();

  const plans = plansData?.content || [];
  const selectedPlan = plans.find((p) => p.id === formData.subscription?.planId);
  const signedIds = formData.agreements?.signedAgreementIds || [];
  const signedAgreements = agreements.filter((a) => signedIds.includes(a.id));
  const mandatoryAgreements = agreements.filter((a) => a.isMandatory);
  const allMandatorySigned = mandatoryAgreements.every((a) =>
    signedIds.includes(a.id)
  );
  const requiresClearance = formData.health
    ? needsMedicalClearance(formData.health)
    : false;

  const texts = {
    title: locale === "ar" ? "مراجعة التسجيل" : "Review Registration",
    description:
      locale === "ar"
        ? "يرجى مراجعة جميع المعلومات قبل الإرسال"
        : "Please review all information before submitting",
    personalInfo: locale === "ar" ? "المعلومات الشخصية" : "Personal Information",
    contactInfo: locale === "ar" ? "معلومات الاتصال" : "Contact Information",
    healthInfo: locale === "ar" ? "المعلومات الصحية" : "Health Information",
    agreements: locale === "ar" ? "الاتفاقيات" : "Agreements",
    subscription: locale === "ar" ? "الاشتراك" : "Subscription",
    edit: locale === "ar" ? "تعديل" : "Edit",
    name: locale === "ar" ? "الاسم" : "Name",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    dateOfBirth: locale === "ar" ? "تاريخ الميلاد" : "Date of Birth",
    gender: locale === "ar" ? "الجنس" : "Gender",
    nationality: locale === "ar" ? "الجنسية" : "Nationality",
    nationalId: locale === "ar" ? "رقم الهوية" : "National ID",
    language: locale === "ar" ? "اللغة المفضلة" : "Preferred Language",
    address: locale === "ar" ? "العنوان" : "Address",
    emergencyContact: locale === "ar" ? "جهة اتصال الطوارئ" : "Emergency Contact",
    medicalClearance:
      locale === "ar" ? "يتطلب تخليصًا طبيًا" : "Requires Medical Clearance",
    noHealthIssues:
      locale === "ar"
        ? "لا توجد مشاكل صحية معروفة"
        : "No known health issues reported",
    signedAgreements:
      locale === "ar" ? "الاتفاقيات الموقعة" : "Signed Agreements",
    plan: locale === "ar" ? "الخطة" : "Plan",
    startDate: locale === "ar" ? "تاريخ البدء" : "Start Date",
    discount: locale === "ar" ? "الخصم" : "Discount",
    price: locale === "ar" ? "السعر" : "Price",
    notProvided: locale === "ar" ? "غير محدد" : "Not provided",
    male: locale === "ar" ? "ذكر" : "Male",
    female: locale === "ar" ? "أنثى" : "Female",
    english: locale === "ar" ? "الإنجليزية" : "English",
    arabic: locale === "ar" ? "العربية" : "Arabic",
    warningTitle:
      locale === "ar"
        ? "الاتفاقيات الإلزامية مفقودة"
        : "Missing Mandatory Agreements",
    warningDescription:
      locale === "ar"
        ? "يجب توقيع جميع الاتفاقيات الإلزامية قبل المتابعة"
        : "All mandatory agreements must be signed before proceeding",
  };

  const SectionHeader = ({
    icon: Icon,
    title,
    step,
  }: {
    icon: React.ElementType;
    title: string;
    step: number;
  }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onEditStep(step)}
      >
        <Edit className="h-4 w-4 mr-1" />
        {texts.edit}
      </Button>
    </div>
  );

  const InfoRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | undefined | null;
  }) => (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || texts.notProvided}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{texts.title}</CardTitle>
          <CardDescription>{texts.description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Missing Mandatory Agreements Warning */}
      {!allMandatorySigned && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{texts.warningTitle}</AlertTitle>
          <AlertDescription>{texts.warningDescription}</AlertDescription>
        </Alert>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={User} title={texts.personalInfo} step={0} />
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow
            label={texts.name}
            value={`${formData.firstName?.en || ""} ${formData.lastName?.en || ""}`}
          />
          <InfoRow label={texts.email} value={formData.email} />
          <InfoRow label={texts.phone} value={formData.phone} />
          <InfoRow label={texts.dateOfBirth} value={formData.dateOfBirth} />
          <InfoRow
            label={texts.gender}
            value={
              formData.gender === "MALE"
                ? texts.male
                : formData.gender === "FEMALE"
                ? texts.female
                : undefined
            }
          />
          <InfoRow label={texts.nationality} value={formData.nationality} />
          <InfoRow label={texts.nationalId} value={formData.nationalId} />
          <InfoRow
            label={texts.language}
            value={
              formData.preferredLanguage === "EN"
                ? texts.english
                : texts.arabic
            }
          />
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={MapPin} title={texts.contactInfo} step={1} />
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow label={texts.address} value={formData.address?.en} />
          <InfoRow
            label={texts.emergencyContact}
            value={
              formData.emergencyContactName
                ? `${formData.emergencyContactName} (${formData.emergencyContactPhone || texts.notProvided})`
                : undefined
            }
          />
        </CardContent>
      </Card>

      {/* Health Information */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={Heart} title={texts.healthInfo} step={2} />
        </CardHeader>
        <CardContent>
          {requiresClearance ? (
            <Badge variant="destructive">{texts.medicalClearance}</Badge>
          ) : (
            <Badge variant="secondary">{texts.noHealthIssues}</Badge>
          )}
        </CardContent>
      </Card>

      {/* Agreements */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={FileText} title={texts.agreements} step={3} />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {texts.signedAgreements}: {signedAgreements.length}
            </p>
            <div className="flex flex-wrap gap-2">
              {signedAgreements.map((agreement) => (
                <Badge key={agreement.id} variant="outline">
                  <Check className="h-3 w-3 mr-1" />
                  {locale === "ar"
                    ? agreement.title.ar || agreement.title.en
                    : agreement.title.en}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader icon={CreditCard} title={texts.subscription} step={4} />
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow
            label={texts.plan}
            value={
              selectedPlan
                ? locale === "ar"
                  ? selectedPlan.name.ar || selectedPlan.name.en
                  : selectedPlan.name.en
                : undefined
            }
          />
          <InfoRow
            label={texts.startDate}
            value={formData.subscription?.startDate}
          />
          {formData.subscription?.discountPercentage &&
            formData.subscription.discountPercentage > 0 && (
              <InfoRow
                label={texts.discount}
                value={`${formData.subscription.discountPercentage}%`}
              />
            )}
          {selectedPlan && (
            <InfoRow
              label={texts.price}
              value={`${selectedPlan.price.amount} ${selectedPlan.price.currency}`}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
