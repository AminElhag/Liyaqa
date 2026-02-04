'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useCampaign, useUpdateCampaign } from '@liyaqa/shared/queries/use-marketing';
import { PageHeader } from '@liyaqa/shared/components/page-header';
import { CampaignStepEditor } from '@/components/admin/campaign-step-editor';
import { Button } from '@liyaqa/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@liyaqa/shared/components/ui/card';
import { Input } from '@liyaqa/shared/components/ui/input';
import { Label } from '@liyaqa/shared/components/ui/label';
import { Textarea } from '@liyaqa/shared/components/ui/textarea';
import { Skeleton } from '@liyaqa/shared/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@liyaqa/shared/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@liyaqa/shared/hooks/use-toast';
import { useSegments } from '@liyaqa/shared/queries/use-marketing';
import type { TriggerConfig, UpdateCampaignRequest } from '@liyaqa/shared/types/marketing';
import { CAMPAIGN_TYPE_LABELS, TRIGGER_TYPE_LABELS } from '@liyaqa/shared/types/marketing';

export default function CampaignEditPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const campaignId = params.id as string;

  const { data, isLoading, error } = useCampaign(campaignId);
  const { data: segmentsData } = useSegments({ page: 0, size: 100 });
  const updateMutation = useUpdateCampaign();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerDays: '',
    triggerTime: '',
    segmentId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (data?.campaign) {
      const campaign = data.campaign;
      setFormData({
        name: campaign.name,
        description: campaign.description || '',
        triggerDays: campaign.triggerConfig?.days?.toString() || '',
        triggerTime: campaign.triggerConfig?.time || '',
        segmentId: campaign.segmentId || '',
        startDate: campaign.startDate || '',
        endDate: campaign.endDate || '',
      });
    }
  }, [data]);

  const handleSave = async () => {
    try {
      const triggerConfig: TriggerConfig | undefined = formData.triggerDays || formData.triggerTime
        ? {
            days: formData.triggerDays ? parseInt(formData.triggerDays) : undefined,
            time: formData.triggerTime || undefined,
          }
        : undefined;

      const updateData: UpdateCampaignRequest = {
        name: formData.name,
        description: formData.description || undefined,
        triggerConfig,
        segmentId: formData.segmentId || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      };

      await updateMutation.mutateAsync({ id: campaignId, data: updateData });
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('marketing.campaignUpdated', { defaultValue: 'Campaign updated successfully' }),
      });
      router.push(`/marketing/campaigns/${campaignId}`);
    } catch (error) {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('marketing.updateFailed', { defaultValue: 'Failed to update campaign' }),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
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

  // Check if campaign can be edited
  if (campaign.status !== 'DRAFT' && campaign.status !== 'PAUSED') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {t('marketing.cannotEditActiveCampaign', {
            defaultValue: 'This campaign cannot be edited. Only DRAFT or PAUSED campaigns can be edited.',
          })}
        </p>
        <Button className="mt-4" asChild>
          <Link href={`/marketing/campaigns/${campaignId}`}>{t('common.goBack', { defaultValue: 'Go Back' })}</Link>
        </Button>
      </div>
    );
  }

  const needsDaysConfig = ['DAYS_BEFORE_EXPIRY', 'DAYS_AFTER_EXPIRY', 'DAYS_INACTIVE'].includes(campaign.triggerType);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/marketing/campaigns/${campaignId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title={t('marketing.editCampaign', { defaultValue: 'Edit Campaign' })}
          description={campaign.name}
        >
          <Button onClick={handleSave} disabled={updateMutation.isPending || !formData.name}>
            <Save className="mr-2 h-4 w-4" />
            {t('common.saveChanges', { defaultValue: 'Save Changes' })}
          </Button>
        </PageHeader>
      </div>

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t('marketing.campaignDetails', { defaultValue: 'Campaign Details' })}</CardTitle>
          <CardDescription>
            {t('marketing.editDetailsDescription', { defaultValue: 'Update the basic campaign information' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t('common.name', { defaultValue: 'Name' })}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Campaign name"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('marketing.campaignType', { defaultValue: 'Campaign Type' })}</Label>
              <Input value={CAMPAIGN_TYPE_LABELS[campaign.campaignType]?.en || campaign.campaignType} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('common.description', { defaultValue: 'Description' })}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Campaign description"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('marketing.trigger', { defaultValue: 'Trigger' })}</Label>
              <Input value={TRIGGER_TYPE_LABELS[campaign.triggerType]?.en || campaign.triggerType} disabled />
            </div>

            {needsDaysConfig && (
              <div className="space-y-2">
                <Label htmlFor="triggerDays">{t('marketing.triggerDays', { defaultValue: 'Trigger Days' })}</Label>
                <Input
                  id="triggerDays"
                  type="number"
                  min="1"
                  value={formData.triggerDays}
                  onChange={(e) => setFormData({ ...formData, triggerDays: e.target.value })}
                  placeholder="e.g., 7"
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="segment">{t('marketing.segment', { defaultValue: 'Target Segment' })}</Label>
              <Select
                value={formData.segmentId}
                onValueChange={(value) => setFormData({ ...formData, segmentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('marketing.noSegment', { defaultValue: 'All members (no segment)' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {t('marketing.noSegment', { defaultValue: 'All members (no segment)' })}
                  </SelectItem>
                  {segmentsData?.content.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id}>
                      {segment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="triggerTime">{t('marketing.preferredTime', { defaultValue: 'Preferred Send Time' })}</Label>
              <Input
                id="triggerTime"
                type="time"
                value={formData.triggerTime}
                onChange={(e) => setFormData({ ...formData, triggerTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('common.startDate', { defaultValue: 'Start Date' })}</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">{t('common.endDate', { defaultValue: 'End Date' })}</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Steps */}
      <CampaignStepEditor campaignId={campaignId} steps={steps} />
    </div>
  );
}
