"use client";

import { cn } from "@/lib/utils";
import type { RiskLikelihood, RiskImpact, IdentifiedRisk } from "@/types/risk";

interface RiskMatrixProps {
  risks?: IdentifiedRisk[];
  onCellClick?: (likelihood: RiskLikelihood, impact: RiskImpact) => void;
  isArabic?: boolean;
}

const likelihoodLevels: RiskLikelihood[] = [
  "ALMOST_CERTAIN",
  "LIKELY",
  "POSSIBLE",
  "UNLIKELY",
  "RARE",
];

const impactLevels: RiskImpact[] = [
  "INSIGNIFICANT",
  "MINOR",
  "MODERATE",
  "MAJOR",
  "CATASTROPHIC",
];

const likelihoodLabels: Record<RiskLikelihood, { en: string; ar: string }> = {
  RARE: { en: "Rare", ar: "نادر" },
  UNLIKELY: { en: "Unlikely", ar: "غير محتمل" },
  POSSIBLE: { en: "Possible", ar: "محتمل" },
  LIKELY: { en: "Likely", ar: "مرجح" },
  ALMOST_CERTAIN: { en: "Almost Certain", ar: "شبه مؤكد" },
};

const impactLabels: Record<RiskImpact, { en: string; ar: string }> = {
  INSIGNIFICANT: { en: "Insignificant", ar: "ضئيل" },
  MINOR: { en: "Minor", ar: "طفيف" },
  MODERATE: { en: "Moderate", ar: "معتدل" },
  MAJOR: { en: "Major", ar: "كبير" },
  CATASTROPHIC: { en: "Catastrophic", ar: "كارثي" },
};

const getCellColor = (likelihoodIdx: number, impactIdx: number) => {
  const score = (4 - likelihoodIdx + 1) * (impactIdx + 1);
  if (score >= 15) return "bg-red-500 hover:bg-red-600";
  if (score >= 10) return "bg-orange-500 hover:bg-orange-600";
  if (score >= 5) return "bg-yellow-500 hover:bg-yellow-600";
  return "bg-green-500 hover:bg-green-600";
};

export function RiskMatrix({
  risks = [],
  onCellClick,
  isArabic = false,
}: RiskMatrixProps) {
  const getRiskCount = (likelihood: RiskLikelihood, impact: RiskImpact) => {
    return risks.filter(
      (r) => r.likelihood === likelihood && r.impact === impact
    ).length;
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        {/* Header row */}
        <div className="grid grid-cols-6 gap-1 mb-1">
          <div className="text-center text-xs font-medium p-2">
            {isArabic ? "الاحتمالية / الأثر" : "Likelihood / Impact"}
          </div>
          {impactLevels.map((impact) => (
            <div
              key={impact}
              className="text-center text-xs font-medium p-2 bg-muted rounded"
            >
              {isArabic ? impactLabels[impact].ar : impactLabels[impact].en}
            </div>
          ))}
        </div>

        {/* Matrix rows */}
        {likelihoodLevels.map((likelihood, likelihoodIdx) => (
          <div key={likelihood} className="grid grid-cols-6 gap-1 mb-1">
            <div className="text-xs font-medium p-2 bg-muted rounded flex items-center justify-center">
              {isArabic
                ? likelihoodLabels[likelihood].ar
                : likelihoodLabels[likelihood].en}
            </div>
            {impactLevels.map((impact, impactIdx) => {
              const count = getRiskCount(likelihood, impact);
              return (
                <button
                  key={impact}
                  onClick={() => onCellClick?.(likelihood, impact)}
                  className={cn(
                    "h-12 rounded text-white font-bold text-sm transition-colors",
                    getCellColor(likelihoodIdx, impactIdx),
                    "flex items-center justify-center"
                  )}
                >
                  {count > 0 ? count : ""}
                </button>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>{isArabic ? "منخفض" : "Low"}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span>{isArabic ? "متوسط" : "Medium"}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span>{isArabic ? "عالي" : "High"}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>{isArabic ? "حرج" : "Critical"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
