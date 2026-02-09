import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { DealPipelineOverview } from "@/types";

interface DealPipelineStatsProps {
  pipeline: DealPipelineOverview;
}

const STAGE_COLORS = {
  leads: "#94a3b8", // slate-400
  qualified: "#60a5fa", // blue-400
  proposal: "#f59e0b", // amber-500
  negotiation: "#22c55e", // green-500
};

export function DealPipelineStats({ pipeline }: DealPipelineStatsProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const stages = [
    {
      key: "leads",
      nameEn: "Leads",
      nameAr: "العملاء المحتملون",
      count: pipeline.leads,
      color: STAGE_COLORS.leads,
    },
    {
      key: "qualified",
      nameEn: "Qualified",
      nameAr: "المؤهلون",
      count: pipeline.qualified,
      color: STAGE_COLORS.qualified,
    },
    {
      key: "proposal",
      nameEn: "Proposal",
      nameAr: "العروض",
      count: pipeline.proposal,
      color: STAGE_COLORS.proposal,
    },
    {
      key: "negotiation",
      nameEn: "Negotiation",
      nameAr: "التفاوض",
      count: pipeline.negotiation,
      color: STAGE_COLORS.negotiation,
    },
  ];

  const chartData = stages.map((stage) => ({
    name: locale === "ar" ? stage.nameAr : stage.nameEn,
    count: stage.count,
    color: stage.color,
  }));

  const totalDeals = stages.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>
            {locale === "ar" ? "مسار الصفقات" : "Deal Pipeline"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "نظرة عامة على مراحل الصفقات"
              : "Overview of deal stages"}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/deals">
            {locale === "ar" ? "عرض الكل" : "View All"}
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pipeline Stages Visual */}
        <div className="flex items-center justify-between gap-2">
          {stages.map((stage, index) => (
            <div key={stage.key} className="flex items-center flex-1">
              <div className="flex-1 text-center">
                <div
                  className="mx-auto w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-1"
                  style={{ backgroundColor: stage.color }}
                >
                  {stage.count}
                </div>
                <div className="text-xs font-medium">
                  {locale === "ar" ? stage.nameAr : stage.nameEn}
                </div>
              </div>
              {index < stages.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        {totalDeals > 0 && (
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  className="stroke-muted"
                />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(value) => [
                    Number(value) || 0,
                    locale === "ar" ? "عدد الصفقات" : "Deals",
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Value Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-sm text-muted-foreground">
              {locale === "ar" ? "القيمة الإجمالية" : "Total Value"}
            </div>
            <div className="text-lg font-bold">
              {formatCurrency(pipeline.totalValue, pipeline.currency, locale)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">
              {locale === "ar" ? "القيمة المرجحة" : "Weighted Value"}
            </div>
            <div className="text-lg font-bold">
              {formatCurrency(
                pipeline.weightedValue,
                pipeline.currency,
                locale
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
