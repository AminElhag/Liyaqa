"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ComplianceScoreCardProps {
  title: string;
  description?: string;
  score: number;
  totalControls?: number;
  compliantControls?: number;
  isArabic?: boolean;
}

export function ComplianceScoreCard({
  title,
  description,
  score,
  totalControls,
  compliantControls,
  isArabic = false,
}: ComplianceScoreCardProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-green-500";
    if (value >= 60) return "text-yellow-500";
    if (value >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return "stroke-green-500";
    if (value >= 60) return "stroke-yellow-500";
    if (value >= 40) return "stroke-orange-500";
    return "stroke-red-500";
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              className="stroke-muted"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={getProgressColor(score)}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                transition: "stroke-dashoffset 0.5s ease-in-out",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {Math.round(score)}%
            </span>
          </div>
        </div>
        {totalControls !== undefined && compliantControls !== undefined && (
          <p className="text-xs text-muted-foreground mt-2">
            {compliantControls}/{totalControls}{" "}
            {isArabic ? "ضوابط ممتثلة" : "controls compliant"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
