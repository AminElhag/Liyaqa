'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMarketingOverview, useCampaigns } from '@liyaqa/shared/queries/use-marketing';
import { PageHeader } from '@liyaqa/shared/components/page-header';
import { Button } from '@liyaqa/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@liyaqa/shared/components/ui/card';
import { Skeleton } from '@liyaqa/shared/components/ui/skeleton';
import { Badge } from '@liyaqa/shared/components/ui/badge';
import {
  Mail,
  Users,
  BarChart3,
  Target,
  Plus,
  TrendingUp,
  MousePointerClick,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_TYPE_LABELS } from '@liyaqa/shared/types/marketing';

export default function MarketingPage() {
  const t = useTranslations();
  const router = useRouter();

  const { data: overview, isLoading: overviewLoading } = useMarketingOverview();
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns({
    size: 5,
    sortBy: 'updatedAt',
    sortDir: 'desc',
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('marketing.title', { defaultValue: 'Marketing Automation' })}
        description={t('marketing.description', {
          defaultValue: 'Create and manage automated marketing campaigns',
        })}
      >
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/marketing/segments">
              <Users className="mr-2 h-4 w-4" />
              {t('marketing.segments', { defaultValue: 'Segments' })}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/marketing/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('marketing.newCampaign', { defaultValue: 'New Campaign' })}
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('marketing.activeCampaigns', { defaultValue: 'Active Campaigns' })}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{overview?.activeCampaigns ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('marketing.messagesSent', { defaultValue: 'Messages Sent (30d)' })}
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {overview?.messagesSentLast30Days?.toLocaleString() ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('marketing.openRate', { defaultValue: 'Open Rate' })}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {((overview?.openRate ?? 0) * 100).toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('marketing.clickRate', { defaultValue: 'Click Rate' })}
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {((overview?.clickRate ?? 0) * 100).toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {t('marketing.recentCampaigns', { defaultValue: 'Recent Campaigns' })}
            </CardTitle>
            <CardDescription>
              {t('marketing.recentCampaignsDescription', {
                defaultValue: 'Your most recently updated campaigns',
              })}
            </CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/marketing/campaigns">
              {t('common.viewAll', { defaultValue: 'View All' })}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : campaigns?.content.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="mx-auto h-12 w-12 mb-4" />
              <p>{t('marketing.noCampaigns', { defaultValue: 'No campaigns yet' })}</p>
              <Button className="mt-4" asChild>
                <Link href="/marketing/campaigns/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('marketing.createFirst', { defaultValue: 'Create your first campaign' })}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns?.content.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/marketing/campaigns/${campaign.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="font-medium">{campaign.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {CAMPAIGN_TYPE_LABELS[campaign.campaignType]?.en}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <div>{campaign.totalEnrolled} enrolled</div>
                      <div className="text-muted-foreground">
                        {campaign.totalCompleted} completed
                      </div>
                    </div>
                    <Badge
                      variant={
                        campaign.status === 'ACTIVE'
                          ? 'default'
                          : campaign.status === 'PAUSED'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {CAMPAIGN_STATUS_LABELS[campaign.status]?.en}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push('/marketing/campaigns/new')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('marketing.welcomeSequence', { defaultValue: 'Welcome Sequence' })}
            </CardTitle>
            <CardDescription>
              {t('marketing.welcomeSequenceDesc', {
                defaultValue: 'Onboard new members with a series of welcome emails',
              })}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push('/marketing/campaigns/new')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('marketing.expiryReminder', { defaultValue: 'Expiry Reminder' })}
            </CardTitle>
            <CardDescription>
              {t('marketing.expiryReminderDesc', {
                defaultValue: 'Remind members before their subscription expires',
              })}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push('/marketing/campaigns/new')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('marketing.winBack', { defaultValue: 'Win Back Campaign' })}
            </CardTitle>
            <CardDescription>
              {t('marketing.winBackDesc', {
                defaultValue: 'Re-engage members whose subscriptions have expired',
              })}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
