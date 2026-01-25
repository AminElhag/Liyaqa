'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useCampaign, useActivateCampaign, usePauseCampaign, useDeleteCampaign } from '@/queries/use-marketing';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  Trash2,
  Edit,
  BarChart3,
  Clock,
  Mail,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
  TRIGGER_TYPE_LABELS,
  CHANNEL_LABELS,
} from '@/types/marketing';
import { useToast } from '@/hooks/use-toast';

export default function CampaignDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const campaignId = params.id as string;

  const { data, isLoading, error } = useCampaign(campaignId);
  const activateMutation = useActivateCampaign();
  const pauseMutation = usePauseCampaign();
  const deleteMutation = useDeleteCampaign();

  const handleActivate = async () => {
    try {
      await activateMutation.mutateAsync(campaignId);
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('marketing.campaignActivated', { defaultValue: 'Campaign activated' }),
      });
    } catch (error) {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('marketing.activationFailed', { defaultValue: 'Failed to activate campaign' }),
        variant: 'destructive',
      });
    }
  };

  const handlePause = async () => {
    try {
      await pauseMutation.mutateAsync(campaignId);
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('marketing.campaignPaused', { defaultValue: 'Campaign paused' }),
      });
    } catch (error) {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('marketing.pauseFailed', { defaultValue: 'Failed to pause campaign' }),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('marketing.confirmDelete', { defaultValue: 'Are you sure you want to delete this campaign?' }))) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(campaignId);
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('marketing.campaignDeleted', { defaultValue: 'Campaign deleted' }),
      });
      router.push('/marketing/campaigns');
    } catch (error) {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('marketing.deleteFailed', { defaultValue: 'Failed to delete campaign' }),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {t('marketing.campaignNotFound', { defaultValue: 'Campaign not found' })}
        </p>
        <Button className="mt-4" asChild>
          <Link href="/marketing/campaigns">{t('common.goBack', { defaultValue: 'Go Back' })}</Link>
        </Button>
      </div>
    );
  }

  const { campaign, steps } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/marketing/campaigns">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title={campaign.name}
          description={campaign.description || CAMPAIGN_TYPE_LABELS[campaign.campaignType]?.en}
        >
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/marketing/campaigns/${campaignId}/analytics`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                {t('common.analytics', { defaultValue: 'Analytics' })}
              </Link>
            </Button>
            {campaign.status === 'DRAFT' || campaign.status === 'PAUSED' ? (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/marketing/campaigns/${campaignId}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('common.edit', { defaultValue: 'Edit' })}
                  </Link>
                </Button>
                <Button onClick={handleActivate} disabled={activateMutation.isPending}>
                  <Play className="mr-2 h-4 w-4" />
                  {t('common.activate', { defaultValue: 'Activate' })}
                </Button>
              </>
            ) : campaign.status === 'ACTIVE' ? (
              <Button variant="secondary" onClick={handlePause} disabled={pauseMutation.isPending}>
                <Pause className="mr-2 h-4 w-4" />
                {t('common.pause', { defaultValue: 'Pause' })}
              </Button>
            ) : null}
          </div>
        </PageHeader>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('common.status', { defaultValue: 'Status' })}</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('marketing.trigger', { defaultValue: 'Trigger' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium">{TRIGGER_TYPE_LABELS[campaign.triggerType]?.en}</div>
            {campaign.triggerConfig?.days && (
              <div className="text-sm text-muted-foreground">{campaign.triggerConfig.days} days</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('marketing.enrolled', { defaultValue: 'Enrolled' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.totalEnrolled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('marketing.completed', { defaultValue: 'Completed' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.totalCompleted}</div>
            {campaign.totalEnrolled > 0 && (
              <div className="text-sm text-muted-foreground">
                {((campaign.totalCompleted / campaign.totalEnrolled) * 100).toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>{t('marketing.campaignSteps', { defaultValue: 'Campaign Steps' })}</CardTitle>
          <CardDescription>
            {t('marketing.stepsDescription', { defaultValue: 'The sequence of messages in this campaign' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('marketing.noSteps', { defaultValue: 'No steps configured yet' })}
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-medium">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{step.name}</span>
                      <Badge variant="outline">{CHANNEL_LABELS[step.channel]?.en}</Badge>
                      {step.isAbTest && <Badge variant="secondary">A/B Test</Badge>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {step.delayDays > 0 ? `${step.delayDays}d` : ''}{' '}
                        {step.delayHours > 0 ? `${step.delayHours}h` : ''}
                        {step.delayDays === 0 && step.delayHours === 0 ? 'Immediately' : ' delay'}
                      </span>
                    </div>
                    {step.subjectEn && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Subject:</span> {step.subjectEn}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Button */}
      {(campaign.status === 'DRAFT' || campaign.status === 'ARCHIVED') && (
        <div className="flex justify-end">
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('common.delete', { defaultValue: 'Delete Campaign' })}
          </Button>
        </div>
      )}
    </div>
  );
}
