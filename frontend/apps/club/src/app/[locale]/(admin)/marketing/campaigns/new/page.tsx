'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCampaign, useSegments } from '@liyaqa/shared/queries/use-marketing';
import { PageHeader } from '@liyaqa/shared/components/page-header';
import { Button } from '@liyaqa/shared/components/ui/button';
import { Input } from '@liyaqa/shared/components/ui/input';
import { Textarea } from '@liyaqa/shared/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@liyaqa/shared/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@liyaqa/shared/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@liyaqa/shared/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  CAMPAIGN_TYPE_LABELS,
  TRIGGER_TYPE_LABELS,
  type CampaignType,
  type TriggerType,
} from '@liyaqa/shared/types/marketing';
import { useToast } from '@liyaqa/shared/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  campaignType: z.string().min(1, 'Campaign type is required'),
  triggerType: z.string().min(1, 'Trigger type is required'),
  triggerDays: z.coerce.number().min(0).optional(),
  segmentId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewCampaignPage() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();

  const createMutation = useCreateCampaign();
  const { data: segments } = useSegments({ isActive: true });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      campaignType: '',
      triggerType: '',
      triggerDays: 0,
      segmentId: '',
      startDate: '',
      endDate: '',
    },
  });

  const selectedTriggerType = form.watch('triggerType') as TriggerType;
  const showDaysInput = ['DAYS_BEFORE_EXPIRY', 'DAYS_AFTER_EXPIRY', 'DAYS_INACTIVE'].includes(
    selectedTriggerType
  );

  const onSubmit = async (values: FormValues) => {
    try {
      const campaign = await createMutation.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        campaignType: values.campaignType as CampaignType,
        triggerType: values.triggerType as TriggerType,
        triggerConfig: showDaysInput ? { days: values.triggerDays } : undefined,
        segmentId: values.segmentId || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      });

      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('marketing.campaignCreated', { defaultValue: 'Campaign created successfully' }),
      });

      router.push(`/marketing/campaigns/${campaign.id}`);
    } catch (error) {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('marketing.createFailed', { defaultValue: 'Failed to create campaign' }),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/marketing/campaigns">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title={t('marketing.newCampaign', { defaultValue: 'New Campaign' })}
          description={t('marketing.newCampaignDescription', {
            defaultValue: 'Create a new marketing campaign',
          })}
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('marketing.basicInfo', { defaultValue: 'Basic Information' })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.name', { defaultValue: 'Name' })}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('marketing.campaignNamePlaceholder', { defaultValue: 'e.g., Welcome Series' })} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.description', { defaultValue: 'Description' })}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('marketing.campaignDescriptionPlaceholder', {
                          defaultValue: 'Describe the purpose of this campaign',
                        })}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('marketing.campaignSettings', { defaultValue: 'Campaign Settings' })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="campaignType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('marketing.campaignType', { defaultValue: 'Campaign Type' })}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('marketing.selectCampaignType', { defaultValue: 'Select campaign type' })} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CAMPAIGN_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="triggerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('marketing.triggerType', { defaultValue: 'Trigger Type' })}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('marketing.selectTriggerType', { defaultValue: 'Select trigger type' })} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TRIGGER_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('marketing.triggerTypeDescription', {
                        defaultValue: 'When should members be enrolled in this campaign?',
                      })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showDaysInput && (
                <FormField
                  control={form.control}
                  name="triggerDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('marketing.triggerDays', { defaultValue: 'Days' })}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormDescription>
                        {selectedTriggerType === 'DAYS_BEFORE_EXPIRY'
                          ? t('marketing.daysBeforeExpiry', { defaultValue: 'Days before subscription expires' })
                          : selectedTriggerType === 'DAYS_AFTER_EXPIRY'
                          ? t('marketing.daysAfterExpiry', { defaultValue: 'Days after subscription expired' })
                          : t('marketing.daysInactive', { defaultValue: 'Days of inactivity' })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="segmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('marketing.targetSegment', { defaultValue: 'Target Segment (Optional)' })}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('marketing.selectSegment', { defaultValue: 'Select segment' })} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{t('marketing.allMembers', { defaultValue: 'All Members' })}</SelectItem>
                        {segments?.content.map((segment) => (
                          <SelectItem key={segment.id} value={segment.id}>
                            {segment.name} ({segment.memberCount})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('marketing.segmentDescription', {
                        defaultValue: 'Optionally limit this campaign to a specific segment',
                      })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/marketing/campaigns">{t('common.cancel', { defaultValue: 'Cancel' })}</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.create', { defaultValue: 'Create Campaign' })}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
