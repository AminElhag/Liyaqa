'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSegments, useDeleteSegment } from '@/queries/use-marketing';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, MoreHorizontal, Eye, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { SEGMENT_TYPE_LABELS } from '@/types/marketing';
import { useToast } from '@/hooks/use-toast';

export default function SegmentsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useSegments({
    search: search || undefined,
    page,
    size: 20,
  });

  const deleteMutation = useDeleteSegment();

  const handleDelete = async (id: string) => {
    if (!confirm(t('marketing.confirmDeleteSegment', { defaultValue: 'Are you sure you want to delete this segment?' }))) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('marketing.segmentDeleted', { defaultValue: 'Segment deleted' }),
      });
    } catch (error) {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('marketing.deleteSegmentFailed', { defaultValue: 'Failed to delete segment' }),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('marketing.segments', { defaultValue: 'Segments' })}
        description={t('marketing.segmentsDescription', {
          defaultValue: 'Create and manage member segments for targeted campaigns',
        })}
      >
        <Button asChild>
          <Link href="/marketing/segments/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('marketing.newSegment', { defaultValue: 'New Segment' })}
          </Link>
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('marketing.searchSegments', { defaultValue: 'Search segments...' })}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.name', { defaultValue: 'Name' })}</TableHead>
              <TableHead>{t('common.type', { defaultValue: 'Type' })}</TableHead>
              <TableHead className="text-right">{t('marketing.members', { defaultValue: 'Members' })}</TableHead>
              <TableHead>{t('common.status', { defaultValue: 'Status' })}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : data?.content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t('marketing.noSegments', { defaultValue: 'No segments found' })}
                </TableCell>
              </TableRow>
            ) : (
              data?.content.map((segment) => (
                <TableRow key={segment.id}>
                  <TableCell>
                    <Link href={`/marketing/segments/${segment.id}`} className="font-medium hover:underline">
                      {segment.name}
                    </Link>
                    {segment.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {segment.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{SEGMENT_TYPE_LABELS[segment.segmentType]?.en}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {segment.memberCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={segment.isActive ? 'default' : 'secondary'}>
                      {segment.isActive ? t('common.active', { defaultValue: 'Active' }) : t('common.inactive', { defaultValue: 'Inactive' })}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/marketing/segments/${segment.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('common.view', { defaultValue: 'View' })}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(segment.id)}
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
            Page {page + 1} of {data.totalPages}
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
