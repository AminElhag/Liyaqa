"use client";

import { UseFormReturn } from "react-hook-form";
import { useLocale } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { RegistrationData } from "../schemas/registration-schema";
import { needsMedicalClearance } from "../schemas/registration-schema";
import type { BloodType } from "@/types/health";

interface HealthInfoStepProps {
  form: UseFormReturn<RegistrationData>;
}

export function HealthInfoStep({ form }: HealthInfoStepProps) {
  const locale = useLocale();
  const { register, setValue, watch } = form;

  const healthData = watch("health");
  const requiresClearance = healthData ? needsMedicalClearance(healthData) : false;

  const texts = {
    parqTitle: locale === "ar" ? "استبيان الجاهزية البدنية (PAR-Q)" : "Physical Activity Readiness Questionnaire (PAR-Q)",
    parqDescription:
      locale === "ar"
        ? "يرجى الإجابة على هذه الأسئلة بصدق"
        : "Please answer these questions honestly",
    q1: locale === "ar"
      ? "هل أخبرك الطبيب من قبل أن لديك مشكلة في القلب؟"
      : "Has your doctor ever said you have a heart condition?",
    q2: locale === "ar"
      ? "هل تشعر بألم في صدرك أثناء النشاط البدني؟"
      : "Do you feel pain in your chest during physical activity?",
    q3: locale === "ar"
      ? "هل شعرت بألم في صدرك في الشهر الماضي وأنت في حالة راحة؟"
      : "Have you had chest pain when not doing physical activity in the past month?",
    q4: locale === "ar"
      ? "هل تفقد توازنك بسبب الدوخة أو فقدان الوعي؟"
      : "Do you lose your balance because of dizziness or ever lose consciousness?",
    q5: locale === "ar"
      ? "هل لديك مشكلة في العظام أو المفاصل يمكن أن تزداد سوءًا بالتمارين؟"
      : "Do you have a bone or joint problem that could be made worse by exercise?",
    q6: locale === "ar"
      ? "هل تتناول أدوية لضغط الدم أو أمراض القلب؟"
      : "Are you currently taking medication for blood pressure or heart condition?",
    q7: locale === "ar"
      ? "هل هناك أي سبب آخر يمنعك من ممارسة الرياضة؟"
      : "Is there any other reason why you should not do physical activity?",
    healthDetailsTitle: locale === "ar" ? "التفاصيل الصحية" : "Health Details",
    healthDetailsDescription:
      locale === "ar"
        ? "معلومات إضافية حول صحة العضو"
        : "Additional information about the member's health",
    medicalConditions: locale === "ar" ? "الحالات الطبية" : "Medical Conditions",
    allergies: locale === "ar" ? "الحساسية" : "Allergies",
    currentMedications: locale === "ar" ? "الأدوية الحالية" : "Current Medications",
    injuriesAndLimitations: locale === "ar" ? "الإصابات والقيود" : "Injuries & Limitations",
    bloodType: locale === "ar" ? "فصيلة الدم" : "Blood Type",
    selectBloodType: locale === "ar" ? "اختر فصيلة الدم" : "Select blood type",
    emergencyMedicalNotes: locale === "ar" ? "ملاحظات طبية طارئة" : "Emergency Medical Notes",
    doctorInfoTitle: locale === "ar" ? "معلومات الطبيب" : "Doctor Information",
    doctorInfoDescription:
      locale === "ar"
        ? "معلومات الطبيب للتخليص الطبي"
        : "Doctor's information for medical clearance",
    doctorName: locale === "ar" ? "اسم الطبيب" : "Doctor's Name",
    doctorPhone: locale === "ar" ? "هاتف الطبيب" : "Doctor's Phone",
    warningTitle: locale === "ar" ? "يتطلب تخليصًا طبيًا" : "Medical Clearance Required",
    warningDescription:
      locale === "ar"
        ? "بناءً على إجاباتك، يُنصح بالحصول على تصريح طبي من طبيبك قبل البدء في أي برنامج تمارين."
        : "Based on your answers, it is recommended to obtain medical clearance from your doctor before starting any exercise program.",
    yes: locale === "ar" ? "نعم" : "Yes",
    no: locale === "ar" ? "لا" : "No",
  };

  const bloodTypes: { value: BloodType; label: string }[] = [
    { value: "A_POSITIVE", label: "A+" },
    { value: "A_NEGATIVE", label: "A-" },
    { value: "B_POSITIVE", label: "B+" },
    { value: "B_NEGATIVE", label: "B-" },
    { value: "AB_POSITIVE", label: "AB+" },
    { value: "AB_NEGATIVE", label: "AB-" },
    { value: "O_POSITIVE", label: "O+" },
    { value: "O_NEGATIVE", label: "O-" },
    { value: "UNKNOWN", label: locale === "ar" ? "غير معروف" : "Unknown" },
  ];

  const parqQuestions = [
    { key: "hasHeartCondition" as const, label: texts.q1 },
    { key: "hasChestPainDuringActivity" as const, label: texts.q2 },
    { key: "hasChestPainAtRest" as const, label: texts.q3 },
    { key: "hasDizzinessOrBalance" as const, label: texts.q4 },
    { key: "hasBoneJointProblem" as const, label: texts.q5 },
    { key: "takesBloodPressureMedication" as const, label: texts.q6 },
    { key: "hasOtherReasonNotToExercise" as const, label: texts.q7 },
  ];

  return (
    <div className="space-y-6">
      {/* Medical Clearance Warning */}
      {requiresClearance && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{texts.warningTitle}</AlertTitle>
          <AlertDescription>{texts.warningDescription}</AlertDescription>
        </Alert>
      )}

      {/* PAR-Q Questions */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.parqTitle}</CardTitle>
          <CardDescription>{texts.parqDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {parqQuestions.map((q) => (
            <div
              key={q.key}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <Label
                htmlFor={`health.${q.key}`}
                className="flex-1 cursor-pointer"
              >
                {q.label}
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{texts.no}</span>
                <Switch
                  id={`health.${q.key}`}
                  checked={healthData?.[q.key] ?? false}
                  onCheckedChange={(checked) =>
                    setValue(`health.${q.key}`, checked)
                  }
                />
                <span className="text-sm text-muted-foreground">{texts.yes}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Health Details */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.healthDetailsTitle}</CardTitle>
          <CardDescription>{texts.healthDetailsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="health.medicalConditions">
                {texts.medicalConditions}
              </Label>
              <Textarea
                id="health.medicalConditions"
                {...register("health.medicalConditions")}
                placeholder="Diabetes, Asthma, etc."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="health.allergies">{texts.allergies}</Label>
              <Textarea
                id="health.allergies"
                {...register("health.allergies")}
                placeholder="Peanuts, Penicillin, etc."
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="health.currentMedications">
                {texts.currentMedications}
              </Label>
              <Textarea
                id="health.currentMedications"
                {...register("health.currentMedications")}
                placeholder="Metformin, Ibuprofen, etc."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="health.injuriesAndLimitations">
                {texts.injuriesAndLimitations}
              </Label>
              <Textarea
                id="health.injuriesAndLimitations"
                {...register("health.injuriesAndLimitations")}
                placeholder="Knee injury, back problems, etc."
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{texts.bloodType}</Label>
              <Select
                value={healthData?.bloodType}
                onValueChange={(value) =>
                  setValue("health.bloodType", value as BloodType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectBloodType} />
                </SelectTrigger>
                <SelectContent>
                  {bloodTypes.map((bt) => (
                    <SelectItem key={bt.value} value={bt.value}>
                      {bt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="health.emergencyMedicalNotes">
                {texts.emergencyMedicalNotes}
              </Label>
              <Textarea
                id="health.emergencyMedicalNotes"
                {...register("health.emergencyMedicalNotes")}
                placeholder="Important medical info for emergencies..."
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Doctor Information */}
      {requiresClearance && (
        <Card>
          <CardHeader>
            <CardTitle>{texts.doctorInfoTitle}</CardTitle>
            <CardDescription>{texts.doctorInfoDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="health.doctorName">{texts.doctorName}</Label>
                <Input
                  id="health.doctorName"
                  {...register("health.doctorName")}
                  placeholder="Dr. John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="health.doctorPhone">{texts.doctorPhone}</Label>
                <Input
                  id="health.doctorPhone"
                  {...register("health.doctorPhone")}
                  placeholder="+966 11 123 4567"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
