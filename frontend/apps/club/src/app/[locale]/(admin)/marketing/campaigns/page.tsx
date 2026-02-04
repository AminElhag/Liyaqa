'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCampaigns, useDeleteCampaign, useActivateCampaign, usePauseCampaign } from '@liyaqa/shared/queries/use-marketing';
import { PageHeader } from '@liyaqa/shared/components/page-header';
import { Button } from '@liyaqa/shared/components/ui/button';
import { Input } from '@liyaqa/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@liyaqa/shared/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@liyaqa/shared/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@liyaqa/shared/components/ui/dropdown-menu';
import { Badge } from '@liyaqa/shared/components/ui/badge';
import { Skeleton } from '@liyaqa/shared/components/ui/skeleton';
import {
  Plus,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Eye,
  Copy,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
  type CampaignStatus,
  type CampaignType,
} from '@liyaqa/shared/types/marketing';
import { useToast } from '@liyaqa/shared/hooks/use-toast';

export default function CampaignsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CampaignStatus | ''>('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useCampaigns({
    search: search || undefined,
    status: status || undefined,
    page,
    size: 20,
  });

  const deleteMutation = useDeleteCampaign();
  const activateMutation = useActivateCampaign();
  const pauseMutation = usePauseCampaign();

  const handleActivate = async (id: string) => {
    try {
      await activateMutation.mutateAsync(id);
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

  const handlePause = async (id: string) => {
    try {
      await pauseMutation.mutateAsync(id);
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

  const handleDelete = async (id: string) => {
    if (!confirm(t('marketing.confirmDelete', { defaultValue: 'Are you sure you want to delete this campaign?' }))) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('marketing.campaignDeleted', { defaultValue: 'Campaign deleted' }),
      });
    } catch (error) {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('marketing.deleteFailed', { defaultValue: 'Failed to delete campaign' }),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('marketing.campaigns', { defaultValue: 'Campaigns' })}
        description={t('marketing.campaignsDescription', {
          defaultValue: 'Manage your marketing campaigns',
        })}
      >
        <Button asChild>
          <Link href="/marketing/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('marketing.newCampaign', { defaultValue: 'New Campaign' })}
          </Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('marketing.searchCampaigns', { defaultValue: 'Search campaigns...' })}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as CampaignStatus | '')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('common.status', { defaultValue: 'Status' })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('common.all', { defaultValue: 'All' })}</SelectItem>
            {Object.entries(CAMPAIGN_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.name', { defaultValue: 'Name' })}</TableHead>
              <TableHead>{t('common.type', { defaultValue: 'Type' })}</TableHead>
              <TableHead>{t('common.status', { defaultValue: 'Status' })}</TableHead>
              <TableHead className="text-right">{t('marketing.enrolled', { defaultValue: 'Enrolled' })}</TableHead>
              <TableHead className="text-right">{t('marketing.completed', { defaultValue: 'Completed' })}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : data?.content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t('marketing.noCampaigns', { defaultValue: 'No campaigns found' })}
                </TableCell>
              </TableRow>
            ) : (
              data?.content.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <Link href={`/marketing/campaigns/${campaign.id}`} className="font-medium hover:underline">
                      {campaign.name}
                    </Link>
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {campaign.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{CAMPAIGN_TYPE_LABELS[campaign.campaignType]?.en}</TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-right">{campaign.totalEnrolled}</TableCell>
                  <TableCell className="text-right">{campaign.totalCompleted}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/marketing/campaigns/${campaign.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('common.view', { defaultValue: 'View' })}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/marketing/campaigns/${campaign.id}/analytics`)}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          {t('common.analytics', { defaultValue: 'Analytics' })}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {campaign.status === 'ACTIVE' ? (
                          <DropdownMenuItem onClick={() => handlePause(campaign.id)}>
                            <Pause className="mr-2 h-4 w-4" />
                            {t('common.pause', { defaultValue: 'Pause' })}
                          </DropdownMenuItem>
                        ) : campaign.status === 'DRAFT' || campaign.status === 'PAUSED' ? (
                          <DropdownMenuItem onClick={() => handleActivate(campaign.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            {t('common.activate', { defaultValue: 'Activate' })}
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(campaign.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete', { defaultValue: 'Delete' })}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            {t('common.previous', { defaultValue: 'Previous' })}
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            {t('common.pageOf', {
              defaultValue: 'Page {current} of {total}',
              current: page + 1,
              total: data.totalPages,
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            {t('common.next', { defaultValue: 'Next' })}
          </Button>
        </div>
      )}
    </div>
  );
}
