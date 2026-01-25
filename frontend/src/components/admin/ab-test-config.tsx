"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { FlaskConical, Percent, Copy } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export interface AbTestVariantData {
  subjectEn: string;
  subjectAr: string;
  bodyEn: string;
  bodyAr: string;
}

export interface AbTestConfigData {
  isAbTest: boolean;
  splitPercentage: number;
  variantA: AbTestVariantData;
  variantB: AbTestVariantData;
}

interface AbTestConfigProps {
  channel: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  splitPercentage: number;
  onSplitChange: (value: number) => void;
  variantA: AbTestVariantData;
  onVariantAChange: (data: AbTestVariantData) => void;
  variantB: AbTestVariantData;
  onVariantBChange: (data: AbTestVariantData) => void;
  readOnly?: boolean;
}

export function AbTestConfig({
  channel,
  enabled,
  onEnabledChange,
  splitPercentage,
  onSplitChange,
  variantA,
  onVariantAChange,
  variantB,
  onVariantBChange,
  readOnly = false,
}: AbTestConfigProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [activeVariant, setActiveVariant] = useState<"A" | "B">("A");

  const showSubject = channel === "EMAIL";

  const handleCopyToVariant = (from: "A" | "B") => {
    if (from === "A") {
      onVariantBChange({ ...variantA });
    } else {
      onVariantAChange({ ...variantB });
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">
              {isArabic ? "اختبار A/B" : "A/B Testing"}
            </CardTitle>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            disabled={readOnly}
          />
        </div>
        <CardDescription>
          {isArabic
            ? "اختبر نسختين مختلفتين من رسالتك لمعرفة أيهما يحقق أداءً أفضل"
            : "Test two different versions of your message to see which performs better"}
        </CardDescription>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4">
          {/* Split Percentage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                {isArabic ? "نسبة التقسيم" : "Split Percentage"}
              </Label>
              <span className="text-sm text-muted-foreground">
                A: {splitPercentage}% / B: {100 - splitPercentage}%
              </span>
            </div>
            <Slider
              value={[splitPercentage]}
              onValueChange={([value]) => onSplitChange(value)}
              min={10}
              max={90}
              step={5}
              disabled={readOnly}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{isArabic ? "المزيد للنسخة A" : "More to Variant A"}</span>
              <span>{isArabic ? "المزيد للنسخة B" : "More to Variant B"}</span>
            </div>
          </div>

          {/* Variant Tabs */}
          <Tabs value={activeVariant} onValueChange={(v) => setActiveVariant(v as "A" | "B")}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="A" className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">A</Badge>
                  {isArabic ? "النسخة A" : "Variant A"}
                </TabsTrigger>
                <TabsTrigger value="B" className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">B</Badge>
                  {isArabic ? "النسخة B" : "Variant B"}
                </TabsTrigger>
              </TabsList>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyToVariant(activeVariant)}
                >
                  <Copy className="h-4 w-4 me-1" />
                  {isArabic
                    ? `نسخ إلى ${activeVariant === "A" ? "B" : "A"}`
                    : `Copy to ${activeVariant === "A" ? "B" : "A"}`}
                </Button>
              )}
            </div>

            <TabsContent value="A" className="space-y-4 mt-4">
              <VariantEditor
                variant="A"
                data={variantA}
                onChange={onVariantAChange}
                showSubject={showSubject}
                readOnly={readOnly}
                isArabic={isArabic}
              />
            </TabsContent>

            <TabsContent value="B" className="space-y-4 mt-4">
              <VariantEditor
                variant="B"
                data={variantB}
                onChange={onVariantBChange}
                showSubject={showSubject}
                readOnly={readOnly}
                isArabic={isArabic}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}

interface VariantEditorProps {
  variant: "A" | "B";
  data: AbTestVariantData;
  onChange: (data: AbTestVariantData) => void;
  showSubject: boolean;
  readOnly: boolean;
  isArabic: boolean;
}

function VariantEditor({ variant, data, onChange, showSubject, readOnly, isArabic }: VariantEditorProps) {
  const variantColor = variant === "A" ? "border-blue-200" : "border-purple-200";

  return (
    <div className={`space-y-4 p-4 rounded-lg border-2 ${variantColor}`}>
      {showSubject && (
        <>
          <div className="space-y-2">
            <Label>
              {isArabic ? "العنوان (إنجليزي)" : "Subject (English)"}
            </Label>
            <Input
              value={data.subjectEn}
              onChange={(e) => onChange({ ...data, subjectEn: e.target.value })}
              placeholder={isArabic ? "أدخل عنوان البريد" : "Enter email subject"}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label>
              {isArabic ? "العنوان (عربي)" : "Subject (Arabic)"}
            </Label>
            <Input
              value={data.subjectAr}
              onChange={(e) => onChange({ ...data, subjectAr: e.target.value })}
              placeholder={isArabic ? "أدخل عنوان البريد بالعربية" : "Enter email subject in Arabic"}
              dir="rtl"
              disabled={readOnly}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label>
          {isArabic ? "المحتوى (إنجليزي)" : "Body (English)"}
        </Label>
        <Textarea
          value={data.bodyEn}
          onChange={(e) => onChange({ ...data, bodyEn: e.target.value })}
          placeholder={isArabic ? "أدخل محتوى الرسالة" : "Enter message content"}
          rows={5}
          disabled={readOnly}
        />
      </div>

      <div className="space-y-2">
        <Label>
          {isArabic ? "المحتوى (عربي)" : "Body (Arabic)"}
        </Label>
        <Textarea
          value={data.bodyAr}
          onChange={(e) => onChange({ ...data, bodyAr: e.target.value })}
          placeholder={isArabic ? "أدخل محتوى الرسالة بالعربية" : "Enter message content in Arabic"}
          rows={5}
          dir="rtl"
          disabled={readOnly}
        />
      </div>
    </div>
  );
}
