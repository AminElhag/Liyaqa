"use client";

import { useLocale } from "next-intl";
import { Target, Globe, Megaphone, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/types/lead";

interface CampaignAttributionCardProps {
  lead: Lead;
  className?: string;
}

export function CampaignAttributionCard({ lead, className }: CampaignAttributionCardProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const hasAttribution = lead.campaignSource || lead.campaignMedium || lead.campaignName;

  if (!hasAttribution) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {isArabic ? "إسناد الحملة" : "Campaign Attribution"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {isArabic
              ? "لا توجد بيانات إسناد حملة لهذا العميل المحتمل"
              : "No campaign attribution data for this lead"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const attributionItems = [
    {
      icon: Globe,
      label: isArabic ? "المصدر" : "Source",
      value: lead.campaignSource,
      color: "bg-blue-100 text-blue-800",
    },
    {
      icon: Megaphone,
      label: isArabic ? "الوسيط" : "Medium",
      value: lead.campaignMedium,
      color: "bg-purple-100 text-purple-800",
    },
    {
      icon: Tag,
      label: isArabic ? "الحملة" : "Campaign",
      value: lead.campaignName,
      color: "bg-green-100 text-green-800",
    },
  ].filter((item) => item.value);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {isArabic ? "إسناد الحملة" : "Campaign Attribution"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {attributionItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <item.icon className="h-4 w-4" />
                <span className="text-sm">{item.label}</span>
              </div>
              <Badge variant="outline" className={item.color}>
                {item.value}
              </Badge>
            </div>
          ))}
        </div>

        {/* UTM URL Preview */}
        {lead.campaignSource && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-1">
              {isArabic ? "رابط التتبع" : "Tracking URL"}
            </p>
            <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
              ?utm_source={lead.campaignSource}
              {lead.campaignMedium && `&utm_medium=${lead.campaignMedium}`}
              {lead.campaignName && `&utm_campaign=${lead.campaignName}`}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
