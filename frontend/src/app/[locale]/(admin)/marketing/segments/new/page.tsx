'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateSegment } from '@/queries/use-marketing';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SEGMENT_TYPE_LABELS, type SegmentType } from '@/types/marketing';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  segmentType: z.string().min(1, 'Segment type is required'),
  // Criteria fields for dynamic segments
  memberStatuses: z.array(z.string()).optional(),
  inactiveDays: z.coerce.number().min(0).optional(),
  joinedAfterDays: z.coerce.number().min(0).optional(),
  hasActiveSubscription: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewSegmentPage() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();

  const createMutation = useCreateSegment();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      segmentType: 'DYNAMIC',
      memberStatuses: [],
      inactiveDays: undefined,
      joinedAfterDays: undefined,
      hasActiveSubscription: undefined,
    },
  });

  const selectedType = form.watch('segmentType') as SegmentType;

  const onSubmit = async (values: FormValues) => {
    try {
      const criteria = selectedType === 'DYNAMIC' ? {
        memberStatuses: values.memberStatuses?.length ? values.memberStatuses : undefined,
        inactiveDays: values.inactiveDays || undefined,
        joinedAfterDays: values.joinedAfterDays || undefined,
        hasActiveSubscription: values.hasActiveSubscription,
      } : undefined;

      const segment = await createMutation.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        segmentType: values.segmentType as SegmentType,
        criteria,
      });

      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('marketing.segmentCreated', { defaultValue: 'Segment created successfully' }),
      });

      router.push(`/marketing/segments/${segment.id}`);
    } catch (error) {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('marketing.createSegmentFailed', { defaultValue: 'Failed to create segment' }),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/marketing/segments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title={t('marketing.newSegment', { defaultValue: 'New Segment' })}
          description={t('marketing.newSegmentDescription', {
            defaultValue: 'Create a new member segment',
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
                      <Input placeholder={t('marketing.segmentNamePlaceholder', { defaultValue: 'e.g., Active Members' })} {...field} />
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
                        placeholder={t('marketing.segmentDescriptionPlaceholder', {
                          defaultValue: 'Describe who belongs in this segment',
                        })}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="segmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('marketing.segmentType', { defaultValue: 'Segment Type' })}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(SEGMENT_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {selectedType === 'DYNAMIC'
                        ? t('marketing.dynamicDescription', { defaultValue: 'Members are automatically added based on criteria' })
                        : t('marketing.staticDescription', { defaultValue: 'Members are manually added to this segment' })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {selectedType === 'DYNAMIC' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('marketing.segmentCriteria', { defaultValue: 'Segment Criteria' })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="memberStatuses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('marketing.memberStatus', { defaultValue: 'Member Status' })}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? [value] : [])}
                        value={field.value?.[0] || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('marketing.selectStatus', { defaultValue: 'Select status' })} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">{t('common.any', { defaultValue: 'Any' })}</SelectItem>
                          <SelectItem value="ACTIVE">{t('common.active', { defaultValue: 'Active' })}</SelectItem>
                          <SelectItem value="INACTIVE">{t('common.inactive', { defaultValue: 'Inactive' })}</SelectItem>
                          <SelectItem value="SUSPENDED">{t('common.suspended', { defaultValue: 'Suspended' })}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inactiveDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('marketing.inactiveDays', { defaultValue: 'Inactive for (days)' })}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="e.g., 14" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('marketing.inactiveDaysDescription', { defaultValue: 'Members who have not checked in for this many days' })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="joinedAfterDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('marketing.joinedWithinDays', { defaultValue: 'Joined within (days)' })}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="e.g., 30" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('marketing.joinedWithinDescription', { defaultValue: 'Members who joined within this many days' })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/marketing/segments">{t('common.cancel', { defaultValue: 'Cancel' })}</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.create', { defaultValue: 'Create Segment' })}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
