"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ArrowRightCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChangeTicketStatus } from "@/queries/platform/use-support-tickets";
import { useToast } from "@/hooks/use-toast";
import type {
  SupportTicketSummary,
  TicketStatus,
} from "@/types/platform/support-ticket";

interface ChangeStatusDialogProps {
  ticket: SupportTicketSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeStatusDialog({
  ticket,
  open,
  onOpenChange,
}: ChangeStatusDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const changeStatus = useChangeTicketStatus();
  const [newStatus, setNewStatus] = useState<TicketStatus | "">("");
  const [resolution, setResolution] = useState("");

  const texts = {
    title: locale === "ar" ? "تغيير الحالة" : "Change Status",
    description:
      locale === "ar"
        ? "تغيير حالة هذه التذكرة"
        : "Change the status of this ticket",
    newStatus: locale === "ar" ? "الحالة الجديدة" : "New Status",
    selectStatus: locale === "ar" ? "اختر الحالة" : "Select status",
    resolution:
      locale === "ar" ? "ملاحظات الحل (للحل/الإغلاق)" : "Resolution Notes (for Resolved/Closed)",
    resolutionPlaceholder:
      locale === "ar"
        ? "أدخل ملاحظات الحل..."
        : "Enter resolution notes...",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    update: locale === "ar" ? "تحديث" : "Update",
    updating: locale === "ar" ? "جاري التحديث..." : "Updating...",
    successTitle: locale === "ar" ? "تم التحديث" : "Updated",
    successDesc:
      locale === "ar"
        ? "تم تغيير حالة التذكرة بنجاح"
        : "Ticket status updated successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    open: locale === "ar" ? "مفتوحة" : "Open",
    inProgress: locale === "ar" ? "قيد التنفيذ" : "In Progress",
    waitingOnClient: locale === "ar" ? "بانتظار العميل" : "Waiting on Client",
    resolved: locale === "ar" ? "تم الحل" : "Resolved",
    closed: locale === "ar" ? "مغلقة" : "Closed",
  };

  const handleChangeStatus = () => {
    if (!ticket || !newStatus) return;

    const requiresResolution =
      newStatus === "RESOLVED" || newStatus === "CLOSED";
    if (requiresResolution && !resolution.trim()) return;

    changeStatus.mutate(
      {
        id: ticket.id,
        data: {
          status: newStatus,
          resolution: requiresResolution ? resolution.trim() : undefined,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.successDesc,
          });
          setNewStatus("");
          setResolution("");
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            title: texts.errorTitle,
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const showResolution = newStatus === "RESOLVED" || newStatus === "CLOSED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightCircle className="h-5 w-5" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newStatus">{texts.newStatus}</Label>
            <Select
              value={newStatus}
              onValueChange={(value) => setNewStatus(value as TicketStatus)}
            >
              <SelectTrigger id="newStatus">
                <SelectValue placeholder={texts.selectStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">{texts.open}</SelectItem>
                <SelectItem value="IN_PROGRESS">{texts.inProgress}</SelectItem>
                <SelectItem value="WAITING_ON_CLIENT">
                  {texts.waitingOnClient}
                </SelectItem>
                <SelectItem value="RESOLVED">{texts.resolved}</SelectItem>
                <SelectItem value="CLOSED">{texts.closed}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showResolution && (
            <div className="space-y-2">
              <Label htmlFor="resolution">
                {texts.resolution} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder={texts.resolutionPlaceholder}
                rows={3}
                dir={locale === "ar" ? "rtl" : "ltr"}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {texts.cancel}
          </Button>
          <Button
            onClick={handleChangeStatus}
            disabled={
              changeStatus.isPending ||
              !newStatus ||
              (showResolution && !resolution.trim())
            }
          >
            {changeStatus.isPending ? texts.updating : texts.update}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
