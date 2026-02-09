import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { useChangeTicketStatus } from "@/hooks/use-support-tickets";
import { useToast } from "@/stores/toast-store";
import type {
  SupportTicketSummary,
  TicketStatus,
} from "@/types";

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
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const toast = useToast();
  const changeStatus = useChangeTicketStatus();
  const [newStatus, setNewStatus] = useState<TicketStatus | "">("");
  const [resolution, setResolution] = useState("");

  const texts = {
    title: locale === "ar" ? "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062D\u0627\u0644\u0629" : "Change Status",
    description:
      locale === "ar"
        ? "\u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0647\u0630\u0647 \u0627\u0644\u062A\u0630\u0643\u0631\u0629"
        : "Change the status of this ticket",
    newStatus: locale === "ar" ? "\u0627\u0644\u062D\u0627\u0644\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629" : "New Status",
    selectStatus: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u062D\u0627\u0644\u0629" : "Select status",
    resolution:
      locale === "ar" ? "\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u062D\u0644 (\u0644\u0644\u062D\u0644/\u0627\u0644\u0625\u063A\u0644\u0627\u0642)" : "Resolution Notes (for Resolved/Closed)",
    resolutionPlaceholder:
      locale === "ar"
        ? "\u0623\u062F\u062E\u0644 \u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u062D\u0644..."
        : "Enter resolution notes...",
    cancel: locale === "ar" ? "\u0625\u0644\u063A\u0627\u0621" : "Cancel",
    update: locale === "ar" ? "\u062A\u062D\u062F\u064A\u062B" : "Update",
    updating: locale === "ar" ? "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u062F\u064A\u062B..." : "Updating...",
    successDesc:
      locale === "ar"
        ? "\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u0628\u0646\u062C\u0627\u062D"
        : "Ticket status updated successfully",
    open: locale === "ar" ? "\u0645\u0641\u062A\u0648\u062D\u0629" : "Open",
    inProgress: locale === "ar" ? "\u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630" : "In Progress",
    waitingOnClient: locale === "ar" ? "\u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0639\u0645\u064A\u0644" : "Waiting on Client",
    resolved: locale === "ar" ? "\u062A\u0645 \u0627\u0644\u062D\u0644" : "Resolved",
    closed: locale === "ar" ? "\u0645\u063A\u0644\u0642\u0629" : "Closed",
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
          toast.success(texts.successDesc);
          setNewStatus("");
          setResolution("");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message);
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
