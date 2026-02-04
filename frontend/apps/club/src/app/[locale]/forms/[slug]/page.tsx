"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Checkbox } from "@liyaqa/shared/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { usePublicForm, useSubmitPublicForm } from "@liyaqa/shared/queries/use-lead-capture-forms";
import type { PublicFormField } from "@liyaqa/shared/types/lead-capture-form";

export default function PublicFormPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const params = useParams();
  const slug = params.slug as string;

  const { data: form, isLoading, error } = usePublicForm(slug);
  const submitMutation = useSubmitPublicForm();

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    thankYouMessageEn: string;
    thankYouMessageAr: string;
    redirectUrl?: string;
  } | null>(null);

  const handleFieldChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get UTM params from URL
    const urlParams = new URLSearchParams(window.location.search);

    try {
      const result = await submitMutation.mutateAsync({
        slug,
        data: {
          data: formData,
          utmSource: urlParams.get("utm_source") || undefined,
          utmMedium: urlParams.get("utm_medium") || undefined,
          utmCampaign: urlParams.get("utm_campaign") || undefined,
        },
      });

      setSubmitResult(result);
      setSubmitted(true);

      // Redirect if configured
      if (result.redirectUrl) {
        setTimeout(() => {
          window.location.href = result.redirectUrl!;
        }, 2000);
      }
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{isArabic ? "جاري التحميل..." : "Loading..."}</span>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-center text-muted-foreground">
              {isArabic
                ? "النموذج غير موجود أو غير نشط"
                : "Form not found or inactive"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted && submitResult) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundColor: form.styling.backgroundColor || "#f5f5f5",
          fontFamily: form.styling.fontFamily,
        }}
      >
        <Card
          className="max-w-md w-full"
          style={{
            borderRadius: form.styling.borderRadius,
          }}
        >
          <CardContent className="flex flex-col items-center py-12">
            <div
              className="p-3 rounded-full mb-4"
              style={{ backgroundColor: `${form.styling.primaryColor}20` }}
            >
              <CheckCircle2
                className="h-12 w-12"
                style={{ color: form.styling.primaryColor }}
              />
            </div>
            <p className="text-lg font-medium text-center mb-2">
              {isArabic ? "شكراً لك!" : "Thank you!"}
            </p>
            <p className="text-center text-muted-foreground">
              {isArabic
                ? submitResult.thankYouMessageAr
                : submitResult.thankYouMessageEn}
            </p>
            {submitResult.redirectUrl && (
              <p className="text-sm text-muted-foreground mt-4">
                {isArabic
                  ? "جاري إعادة التوجيه..."
                  : "Redirecting..."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: form.styling.backgroundColor || "#f5f5f5",
        fontFamily: form.styling.fontFamily,
        color: form.styling.textColor,
      }}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Card
        className="max-w-md w-full"
        style={{
          borderRadius: form.styling.borderRadius,
        }}
      >
        <CardHeader>
          <CardTitle className="text-center">
            {isArabic ? "تواصل معنا" : "Get in Touch"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {form.fields.map((field) => (
              <FormFieldRenderer
                key={field.name}
                field={field}
                value={formData[field.name]}
                onChange={(value) => handleFieldChange(field.name, value)}
                isArabic={isArabic}
              />
            ))}

            {form.showPrivacyConsent && form.privacyPolicyUrl && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="privacy"
                  required
                  onCheckedChange={(checked) =>
                    handleFieldChange("privacyConsent", checked)
                  }
                />
                <Label htmlFor="privacy" className="text-sm text-muted-foreground">
                  {isArabic ? (
                    <>
                      أوافق على{" "}
                      <a
                        href={form.privacyPolicyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        سياسة الخصوصية
                      </a>
                    </>
                  ) : (
                    <>
                      I agree to the{" "}
                      <a
                        href={form.privacyPolicyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Privacy Policy
                      </a>
                    </>
                  )}
                </Label>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={submitMutation.isPending}
              style={{
                backgroundColor: form.styling.primaryColor,
                borderRadius: form.styling.borderRadius,
              }}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {isArabic ? "جاري الإرسال..." : "Submitting..."}
                </>
              ) : isArabic ? (
                form.submitButtonText.ar || "إرسال"
              ) : (
                form.submitButtonText.en || "Submit"
              )}
            </Button>

            {submitMutation.isError && (
              <p className="text-sm text-destructive text-center">
                {isArabic
                  ? "حدث خطأ. يرجى المحاولة مرة أخرى."
                  : "An error occurred. Please try again."}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface FormFieldRendererProps {
  field: PublicFormField;
  value: unknown;
  onChange: (value: unknown) => void;
  isArabic: boolean;
}

function FormFieldRenderer({
  field,
  value,
  onChange,
  isArabic,
}: FormFieldRendererProps) {
  const label = isArabic ? field.label.ar || field.label.en : field.label.en;
  const placeholder = field.placeholder
    ? isArabic
      ? field.placeholder.ar || field.placeholder.en
      : field.placeholder.en
    : undefined;

  switch (field.type) {
    case "TEXTAREA":
      return (
        <div className="space-y-2">
          <Label htmlFor={field.name}>
            {label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Textarea
            id={field.name}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={field.required}
            rows={4}
          />
        </div>
      );

    case "SELECT":
      return (
        <div className="space-y-2">
          <Label htmlFor={field.name}>
            {label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={(value as string) || ""}
            onValueChange={onChange}
            required={field.required}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder || (isArabic ? "اختر..." : "Select...")} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {isArabic ? option.label.ar || option.label.en : option.label.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "CHECKBOX":
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={field.name}
            checked={(value as boolean) || false}
            onCheckedChange={onChange}
            required={field.required}
          />
          <Label htmlFor={field.name}>
            {label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <Label htmlFor={field.name}>
            {label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id={field.name}
            type={field.type.toLowerCase()}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={field.required}
          />
        </div>
      );
  }
}
