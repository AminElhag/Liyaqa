"use client";

import { useLocale } from "next-intl";
import { Trophy, TrendingUp, TrendingDown, Minus, FlaskConical, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Progress } from "@liyaqa/shared/components/ui/progress";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { cn } from "@liyaqa/shared/utils";
import type { AbTestResult, AbTestVariant } from "@liyaqa/shared/types/marketing";

interface AbTestResultsProps {
  results: AbTestResult[];
  isLoading?: boolean;
  className?: string;
}

export function AbTestResults({ results, isLoading, className }: AbTestResultsProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            {isArabic ? "نتائج اختبار A/B" : "A/B Test Results"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">
              {isArabic
                ? "لا توجد اختبارات A/B نشطة في هذه الحملة"
                : "No active A/B tests in this campaign"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-purple-600" />
          {isArabic ? "نتائج اختبار A/B" : "A/B Test Results"}
        </CardTitle>
        <CardDescription>
          {isArabic
            ? `${results.length} اختبار(ات) نشطة`
            : `${results.length} active test(s)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {results.map((result) => (
          <StepAbTestResult
            key={result.stepNumber}
            result={result}
            isArabic={isArabic}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface StepAbTestResultProps {
  result: AbTestResult;
  isArabic: boolean;
}

function StepAbTestResult({ result, isArabic }: StepAbTestResultProps) {
  const hasWinner = result.winner != null;
  const variantA = result.variants.find((v) => v.variant === "A");
  const variantB = result.variants.find((v) => v.variant === "B");

  const totalSent = (variantA?.sent || 0) + (variantB?.sent || 0);
  const hasEnoughData = totalSent >= 200; // Need at least 100 per variant

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium">
            {result.stepNumber}
          </span>
          <span className="font-medium">{result.stepName}</span>
        </div>
        {hasWinner ? (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Trophy className="h-3 w-3 me-1" />
            {isArabic ? `الفائز: ${result.winner}` : `Winner: Variant ${result.winner}`}
          </Badge>
        ) : hasEnoughData ? (
          <Badge variant="outline" className="text-muted-foreground">
            {isArabic ? "لا يوجد فائز واضح" : "No clear winner"}
          </Badge>
        ) : (
          <Badge variant="secondary">
            {isArabic ? "جمع البيانات..." : "Gathering data..."}
          </Badge>
        )}
      </div>

      {!hasEnoughData && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {isArabic
            ? `يلزم 200 رسالة على الأقل لتحديد الفائز (${totalSent} حالياً)`
            : `Need at least 200 messages to determine winner (${totalSent} sent)`}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {variantA && (
          <VariantResultCard
            variant={variantA}
            isWinner={result.winner === "A"}
            otherVariant={variantB}
            isArabic={isArabic}
          />
        )}
        {variantB && (
          <VariantResultCard
            variant={variantB}
            isWinner={result.winner === "B"}
            otherVariant={variantA}
            isArabic={isArabic}
          />
        )}
      </div>
    </div>
  );
}

interface VariantResultCardProps {
  variant: AbTestVariant;
  isWinner: boolean;
  otherVariant?: AbTestVariant;
  isArabic: boolean;
}

function VariantResultCard({ variant, isWinner, otherVariant, isArabic }: VariantResultCardProps) {
  const variantColor = variant.variant === "A"
    ? "border-blue-200 bg-blue-50/30"
    : "border-purple-200 bg-purple-50/30";

  const winnerBorder = isWinner ? "ring-2 ring-green-500 ring-offset-2" : "";

  // Calculate difference from other variant
  const openRateDiff = otherVariant
    ? variant.openRate - otherVariant.openRate
    : 0;
  const clickRateDiff = otherVariant
    ? variant.clickRate - otherVariant.clickRate
    : 0;

  const getDiffIcon = (diff: number) => {
    if (diff > 0.5) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (diff < -0.5) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const formatDiff = (diff: number) => {
    if (Math.abs(diff) < 0.1) return "";
    const prefix = diff > 0 ? "+" : "";
    return `${prefix}${diff.toFixed(1)}%`;
  };

  return (
    <div className={cn("border rounded-lg p-4 space-y-3", variantColor, winnerBorder)}>
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={
            variant.variant === "A"
              ? "bg-blue-100 text-blue-800 border-blue-200"
              : "bg-purple-100 text-purple-800 border-purple-200"
          }
        >
          {isArabic ? `النسخة ${variant.variant}` : `Variant ${variant.variant}`}
        </Badge>
        {isWinner && (
          <Trophy className="h-5 w-5 text-amber-500" />
        )}
      </div>

      {/* Sent/Delivered */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {isArabic ? "مرسل / تم التوصيل" : "Sent / Delivered"}
          </span>
          <span className="font-medium">
            {variant.sent} / {variant.delivered}
          </span>
        </div>
      </div>

      {/* Open Rate */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {isArabic ? "معدل الفتح" : "Open Rate"}
          </span>
          <div className="flex items-center gap-1">
            <span className="font-medium">{variant.openRate.toFixed(1)}%</span>
            {openRateDiff !== 0 && (
              <span className={cn("text-xs", openRateDiff > 0 ? "text-green-600" : "text-red-600")}>
                {formatDiff(openRateDiff)}
              </span>
            )}
            {getDiffIcon(openRateDiff)}
          </div>
        </div>
        <Progress value={variant.openRate} className="h-2" />
      </div>

      {/* Click Rate */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {isArabic ? "معدل النقر" : "Click Rate"}
          </span>
          <div className="flex items-center gap-1">
            <span className="font-medium">{variant.clickRate.toFixed(1)}%</span>
            {clickRateDiff !== 0 && (
              <span className={cn("text-xs", clickRateDiff > 0 ? "text-green-600" : "text-red-600")}>
                {formatDiff(clickRateDiff)}
              </span>
            )}
            {getDiffIcon(clickRateDiff)}
          </div>
        </div>
        <Progress value={variant.clickRate} className="h-2" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
        <div>
          <div className="text-lg font-semibold">{variant.opened}</div>
          <div className="text-xs text-muted-foreground">
            {isArabic ? "مفتوح" : "Opened"}
          </div>
        </div>
        <div>
          <div className="text-lg font-semibold">{variant.clicked}</div>
          <div className="text-xs text-muted-foreground">
            {isArabic ? "نقرات" : "Clicked"}
          </div>
        </div>
        <div>
          <div className="text-lg font-semibold">
            {variant.sent - variant.delivered}
          </div>
          <div className="text-xs text-muted-foreground">
            {isArabic ? "فشل" : "Failed"}
          </div>
        </div>
      </div>
    </div>
  );
}
