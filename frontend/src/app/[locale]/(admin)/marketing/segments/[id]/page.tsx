'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useSegment, useSegmentPreview, useRecalculateSegment, useDeleteSegment } from '@/queries/use-marketing';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Trash2, RefreshCw, Users } from 'lucide-react';
import Link from 'next/link';
import { SEGMENT_TYPE_LABELS } from '@/types/marketing';
import { useToast } from '@/hooks/use-toast';

export default function SegmentDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const segmentId = params.id as string;

  const { data: segment, isLoading, error } = useSegment(segmentId);
  const { data: members, isLoading: membersLoading } = useSegmentPreview(segmentId, 0, 10);
  const recalculateMutation = useRecalculateSegment();
  const deleteMutation = useDeleteSegment();

  const handleRecalculate = async () => {
    try {
      const result = await recalculateMutation.mutateAsync(segmentId);
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('marketing.segmentRecalculated', {
          defaultValue: `Segment recalculated: ${result.memberCount} members`,
        }),
      });
    } catch (error) {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('marketing.recalculateFailed', { defaultValue: 'Failed to recalculate segment' }),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('marketing.confirmDeleteSegment', { defaultValue: 'Are you sure you want to delete this segment?' }))) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(segmentId);
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('marketing.segmentDeleted', { defaultValue: 'Segment deleted' }),
      });
      router.push('/marketing/segments');
    } catch (error) {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('marketing.deleteSegmentFailed', { defaultValue: 'Failed to delete segment' }),
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

  if (error || !segment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {t('marketing.segmentNotFound', { defaultValue: 'Segment not found' })}
        </p>
        <Button className="mt-4" asChild>
          <Link href="/marketing/segments">{t('common.goBack', { defaultValue: 'Go Back' })}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/marketing/segments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title={segment.name}
          description={segment.description || SEGMENT_TYPE_LABELS[segment.segmentType]?.en}
        >
          <div className="flex gap-2">
            {segment.segmentType === 'DYNAMIC' && (
              <Button
                variant="outline"
                onClick={handleRecalculate}
                disabled={recalculateMutation.isPending}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
                {t('marketing.recalculate', { defaultValue: 'Recalculate' })}
              </Button>
            )}
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common.delete', { defaultValue: 'Delete' })}
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('common.type', { defaultValue: 'Type' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{SEGMENT_TYPE_LABELS[segment.segmentType]?.en}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('common.status', { defaultValue: 'Status' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={segment.isActive ? 'default' : 'secondary'}>
              {segment.isActive ? t('common.active', { defaultValue: 'Active' }) : t('common.inactive', { defaultValue: 'Inactive' })}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('marketing.members', { defaultValue: 'Members' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{segment.memberCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Criteria */}
      {segment.segmentType === 'DYNAMIC' && segment.criteria && (
        <Card>
          <CardHeader>
            <CardTitle>{t('marketing.segmentCriteria', { defaultValue: 'Segment Criteria' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {segment.criteria?.memberStatuses && segment.criteria.memberStatuses.length > 0 && (
                <>
                  <dt className="text-muted-foreground">{t('marketing.memberStatus', { defaultValue: 'Member Status' })}</dt>
                  <dd>{segment.criteria.memberStatuses.join(', ')}</dd>
                </>
              )}
              {segment.criteria?.inactiveDays && (
                <>
                  <dt className="text-muted-foreground">{t('marketing.inactiveDays', { defaultValue: 'Inactive Days' })}</dt>
                  <dd>{segment.criteria.inactiveDays} days</dd>
                </>
              )}
              {segment.criteria?.joinedAfterDays && (
                <>
                  <dt className="text-muted-foreground">{t('marketing.joinedWithinDays', { defaultValue: 'Joined Within' })}</dt>
                  <dd>{segment.criteria.joinedAfterDays} days</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Member Preview */}
      <Card>
        <CardHeader>
          <CardTitle>{t('marketing.memberPreview', { defaultValue: 'Member Preview' })}</CardTitle>
          <CardDescription>
            {t('marketing.memberPreviewDescription', { defaultValue: 'Sample of members in this segment' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : members?.content.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('marketing.noMembersInSegment', { defaultValue: 'No members match this segment' })}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name', { defaultValue: 'Name' })}</TableHead>
                  <TableHead>{t('common.email', { defaultValue: 'Email' })}</TableHead>
                  <TableHead>{t('common.phone', { defaultValue: 'Phone' })}</TableHead>
                  <TableHead>{t('common.status', { defaultValue: 'Status' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members?.content.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>{member.email || '-'}</TableCell>
                    <TableCell>{member.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {members && members.totalElements > 10 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {t('marketing.showingOf', {
                defaultValue: 'Showing 10 of {total} members',
                total: members.totalElements,
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
