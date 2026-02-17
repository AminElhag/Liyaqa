'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, Clock, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Button } from '@liyaqa/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@liyaqa/shared/components/ui/card';
import { Input } from '@liyaqa/shared/components/ui/input';
import { Label } from '@liyaqa/shared/components/ui/label';
import { Textarea } from '@liyaqa/shared/components/ui/textarea';
import { Badge } from '@liyaqa/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@liyaqa/shared/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@liyaqa/shared/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@liyaqa/shared/components/ui/dialog';
import { useAddCampaignStep, useUpdateCampaignStep, useDeleteCampaignStep } from '@liyaqa/shared/queries/use-marketing';
import { useToast } from '@liyaqa/shared/hooks/use-toast';
import type { CampaignStep, MarketingChannel, CreateCampaignStepRequest, UpdateCampaignStepRequest } from '@liyaqa/shared/types/marketing';
import { CHANNEL_LABELS } from '@liyaqa/shared/types/marketing';
import type { UUID } from '@liyaqa/shared/types/api';

interface CampaignStepEditorProps {
  campaignId: UUID;
  steps: CampaignStep[];
  readOnly?: boolean;
}

interface StepFormData {
  name: string;
  channel: MarketingChannel;
  delayDays: number;
  delayHours: number;
  subjectEn: string;
  subjectAr: string;
  bodyEn: string;
  bodyAr: string;
}

const defaultFormData: StepFormData = {
  name: '',
  channel: 'EMAIL',
  delayDays: 0,
  delayHours: 0,
  subjectEn: '',
  subjectAr: '',
  bodyEn: '',
  bodyAr: '',
};

export function CampaignStepEditor({ campaignId, steps, readOnly = false }: CampaignStepEditorProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<CampaignStep | null>(null);
  const [formData, setFormData] = useState<StepFormData>(defaultFormData);

  const addStepMutation = useAddCampaignStep();
  const updateStepMutation = useUpdateCampaignStep();
  const deleteStepMutation = useDeleteCampaignStep();

  const toggleExpand = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const handleOpenAddDialog = () => {
    setFormData(defaultFormData);
    setEditingStep(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (step: CampaignStep) => {
    setFormData({
      name: step.name,
      channel: step.channel,
      delayDays: step.delayDays,
      delayHours: step.delayHours,
      subjectEn: step.subjectEn || '',
      subjectAr: step.subjectAr || '',
      bodyEn: step.bodyEn,
      bodyAr: step.bodyAr,
    });
    setEditingStep(step);
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingStep(null);
    setFormData(defaultFormData);
  };

  const handleSave = async () => {
    try {
      if (editingStep) {
        const updateData: UpdateCampaignStepRequest = {
          name: formData.name,
          channel: formData.channel,
          delayDays: formData.delayDays,
          delayHours: formData.delayHours,
          subjectEn: formData.subjectEn || undefined,
          subjectAr: formData.subjectAr || undefined,
          bodyEn: formData.bodyEn,
          bodyAr: formData.bodyAr,
        };
        await updateStepMutation.mutateAsync({
          campaignId,
          stepId: editingStep.id,
          data: updateData,
        });
        toast({
          title: t('common.success', { defaultValue: 'Success' }),
          description: t('marketing.stepUpdated', { defaultValue: 'Step updated successfully' }),
        });
      } else {
        const createData: CreateCampaignStepRequest = {
          name: formData.name,
          channel: formData.channel,
          delayDays: formData.delayDays,
          delayHours: formData.delayHours,
          subjectEn: formData.subjectEn || undefined,
          subjectAr: formData.subjectAr || undefined,
          bodyEn: formData.bodyEn,
          bodyAr: formData.bodyAr,
        };
        await addStepMutation.mutateAsync({
          campaignId,
          data: createData,
        });
        toast({
          title: t('common.success', { defaultValue: 'Success' }),
          description: t('marketing.stepAdded', { defaultValue: 'Step added successfully' }),
        });
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('marketing.stepSaveFailed', { defaultValue: 'Failed to save step' }),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (stepId: UUID) => {
    if (!confirm(t('marketing.confirmDeleteStep', { defaultValue: 'Are you sure you want to delete this step?' }))) {
      return;
    }
    try {
      await deleteStepMutation.mutateAsync({ campaignId, stepId });
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('marketing.stepDeleted', { defaultValue: 'Step deleted' }),
      });
    } catch (error) {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('marketing.stepDeleteFailed', { defaultValue: 'Failed to delete step' }),
        variant: 'destructive',
      });
    }
  };

  const formatDelay = (days: number, hours: number) => {
    if (days === 0 && hours === 0) return 'Immediately';
    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    return parts.join(' ');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('marketing.campaignSteps', { defaultValue: 'Campaign Steps' })}</CardTitle>
        {!readOnly && (
          <Button onClick={handleOpenAddDialog} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('marketing.addStep', { defaultValue: 'Add Step' })}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {steps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('marketing.noSteps', { defaultValue: 'No steps configured yet. Add a step to get started.' })}
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step) => (
              <Collapsible
                key={step.id}
                open={expandedSteps.has(step.id)}
                onOpenChange={() => toggleExpand(step.id)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <div className="w-full cursor-pointer flex items-center gap-4 p-4" role="button" tabIndex={0}>
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-medium text-sm">
                        {step.stepNumber}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{step.name}</span>
                          <Badge variant="outline">{CHANNEL_LABELS[step.channel]?.en}</Badge>
                          {step.isAbTest && <Badge variant="secondary">A/B</Badge>}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3" />
                          {formatDelay(step.delayDays, step.delayHours)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!readOnly && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditDialog(step);
                              }}
                            >
                              <span className="sr-only">Edit</span>
                              <ChevronDown className="h-4 w-4 rotate-0" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(step.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        {expandedSteps.has(step.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-0 border-t">
                      <div className="grid gap-4 mt-4">
                        {step.subjectEn && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Subject (English)</Label>
                            <p className="text-sm">{step.subjectEn}</p>
                          </div>
                        )}
                        {step.subjectAr && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Subject (Arabic)</Label>
                            <p className="text-sm" dir="rtl">{step.subjectAr}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-xs text-muted-foreground">Body (English)</Label>
                          <p className="text-sm whitespace-pre-wrap">{step.bodyEn}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Body (Arabic)</Label>
                          <p className="text-sm whitespace-pre-wrap" dir="rtl">{step.bodyAr}</p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Step Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStep
                ? t('marketing.editStep', { defaultValue: 'Edit Step' })
                : t('marketing.addStep', { defaultValue: 'Add Step' })}
            </DialogTitle>
            <DialogDescription>
              {t('marketing.stepDialogDescription', {
                defaultValue: 'Configure the message content and timing for this step.',
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('common.name', { defaultValue: 'Name' })}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel">{t('marketing.channel', { defaultValue: 'Channel' })}</Label>
                <Select
                  value={formData.channel}
                  onValueChange={(value) => setFormData({ ...formData, channel: value as MarketingChannel })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="PUSH">Push Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delayDays">{t('marketing.delayDays', { defaultValue: 'Delay (Days)' })}</Label>
                <Input
                  id="delayDays"
                  type="number"
                  min="0"
                  value={formData.delayDays}
                  onChange={(e) => setFormData({ ...formData, delayDays: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delayHours">{t('marketing.delayHours', { defaultValue: 'Delay (Hours)' })}</Label>
                <Input
                  id="delayHours"
                  type="number"
                  min="0"
                  max="23"
                  value={formData.delayHours}
                  onChange={(e) => setFormData({ ...formData, delayHours: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {(formData.channel === 'EMAIL') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subjectEn">{t('marketing.subjectEnglish', { defaultValue: 'Subject (English)' })}</Label>
                  <Input
                    id="subjectEn"
                    value={formData.subjectEn}
                    onChange={(e) => setFormData({ ...formData, subjectEn: e.target.value })}
                    placeholder="Enter email subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjectAr">{t('marketing.subjectArabic', { defaultValue: 'Subject (Arabic)' })}</Label>
                  <Input
                    id="subjectAr"
                    value={formData.subjectAr}
                    onChange={(e) => setFormData({ ...formData, subjectAr: e.target.value })}
                    placeholder="Enter email subject in Arabic"
                    dir="rtl"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="bodyEn">{t('marketing.bodyEnglish', { defaultValue: 'Body (English)' })}</Label>
              <Textarea
                id="bodyEn"
                value={formData.bodyEn}
                onChange={(e) => setFormData({ ...formData, bodyEn: e.target.value })}
                placeholder="Enter message content. Use {{firstName}}, {{lastName}}, {{clubName}} for personalization."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyAr">{t('marketing.bodyArabic', { defaultValue: 'Body (Arabic)' })}</Label>
              <Textarea
                id="bodyAr"
                value={formData.bodyAr}
                onChange={(e) => setFormData({ ...formData, bodyAr: e.target.value })}
                placeholder="Enter message content in Arabic"
                rows={6}
                dir="rtl"
              />
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm">
              <strong>{t('marketing.availableVariables', { defaultValue: 'Available Variables:' })}</strong>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{'{{firstName}}'}</Badge>
                <Badge variant="secondary">{'{{lastName}}'}</Badge>
                <Badge variant="secondary">{'{{fullName}}'}</Badge>
                <Badge variant="secondary">{'{{clubName}}'}</Badge>
                <Badge variant="secondary">{'{{email}}'}</Badge>
                <Badge variant="secondary">{'{{phone}}'}</Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.bodyEn || !formData.bodyAr || addStepMutation.isPending || updateStepMutation.isPending}
            >
              {editingStep
                ? t('common.save', { defaultValue: 'Save Changes' })
                : t('marketing.addStep', { defaultValue: 'Add Step' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
