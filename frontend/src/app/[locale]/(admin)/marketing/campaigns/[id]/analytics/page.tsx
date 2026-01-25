'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  useCampaign,
  useCampaignAnalytics,
  useCampaignTimeline,
  useAbTestResults,
  useCampaignSteps,
} from '@/queries/use-marketing';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { CAMPAIGN_STATUS_LABELS } from '@/types/marketing';
import { CampaignAnalyticsOverview } from '@/components/admin/campaign-analytics-overview';
import { CampaignTimelineChart } from '@/components/admin/campaign-timeline-chart';
import { CampaignChannelBreakdown } from '@/components/admin/campaign-channel-breakdown';
import { AbTestResults } from '@/components/admin/ab-test-results';
import type { CampaignAnalytics } from '@/types/marketing';

export default function CampaignAnalyticsPage() {
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const params = useParams();
  const campaignId = params.id as string;
  const [days, setDays] = useState(7);

  const { data: campaignData } = useCampaign(campaignId);
  const { data: steps, isLoading: stepsLoading } = useCampaignSteps(campaignId);
  const {
    data: analytics,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useCampaignAnalytics(campaignId);
  const {
    data: timeline,
    isLoading: timelineLoading,
    refetch: refetchTimeline,
  } = useCampaignTimeline(campaignId, days);
  const {
    data: abResults,
    isLoading: abLoading,
    refetch: refetchAbResults,
  } = useAbTestResults(campaignId);

  const handleRefresh = () => {
    refetchAnalytics();
    refetchTimeline();
    refetchAbResults();
  };

  // Transform analytics data to percentages for components
  const transformedAnalytics: CampaignAnalytics | null = analytics
    ? {
        ...analytics,
        completionRate: analytics.completionRate * 100,
        deliveryRate: analytics.deliveryRate * 100,
        openRate: analytics.openRate * 100,
        clickRate: analytics.clickRate * 100,
      }
    : null;

  // Transform A/B test results to percentages
  const transformedAbResults = abResults?.map((result) => ({
    ...result,
    variants: result.variants.map((variant) => ({
      ...variant,
      openRate: variant.openRate * 100,
      clickRate: variant.clickRate * 100,
    })),
  }));

  const campaignName = campaignData?.campaign?.name || '';
  const campaignStatus = campaignData?.campaign?.status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/marketing/campaigns/${campaignId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title={isArabic ? 'تحليلات الحملة' : 'Campaign Analytics'}
          description={campaignName}
        >
          <div className="flex items-center gap-2">
            {campaignStatus && (
              <Badge
                variant={
                  campaignStatus === 'ACTIVE'
                    ? 'default'
                    : campaignStatus === 'PAUSED'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {isArabic
                  ? CAMPAIGN_STATUS_LABELS[campaignStatus]?.ar
                  : CAMPAIGN_STATUS_LABELS[campaignStatus]?.en}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 me-2" />
              {isArabic ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Analytics Overview */}
      <CampaignAnalyticsOverview
        analytics={transformedAnalytics}
        isLoading={analyticsLoading}
      />

      {/* Timeline & Channel Breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Select
                value={days.toString()}
                onValueChange={(v) => setDays(parseInt(v))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">
                    {isArabic ? 'آخر 7 أيام' : 'Last 7 days'}
                  </SelectItem>
                  <SelectItem value="14">
                    {isArabic ? 'آخر 14 يوم' : 'Last 14 days'}
                  </SelectItem>
                  <SelectItem value="30">
                    {isArabic ? 'آخر 30 يوم' : 'Last 30 days'}
                  </SelectItem>
                  <SelectItem value="90">
                    {isArabic ? 'آخر 90 يوم' : 'Last 90 days'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CampaignTimelineChart
              data={timeline || []}
              isLoading={timelineLoading}
              days={days}
            />
          </div>
        </div>
        <CampaignChannelBreakdown
          steps={steps || []}
          isLoading={stepsLoading}
        />
      </div>

      {/* A/B Test Results */}
      <AbTestResults
        results={transformedAbResults || []}
        isLoading={abLoading}
      />
    </div>
  );
}
