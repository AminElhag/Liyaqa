import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAssignTicket } from "@/hooks/use-support-tickets";
import { useToast } from "@/stores/toast-store";
import type { SupportTicketSummary } from "@/types";

interface AssignTicketDialogProps {
  ticket: SupportTicketSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignTicketDialog({
  ticket,
  open,
  onOpenChange,
}: AssignTicketDialogProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const toast = useToast();
  const assignTicket = useAssignTicket();
  const [assigneeId, setAssigneeId] = useState("");

  const texts = {
    title: locale === "ar" ? "\u0625\u0633\u0646\u0627\u062F \u0627\u0644\u062A\u0630\u0643\u0631\u0629" : "Assign Ticket",
    description:
      locale === "ar"
        ? "\u0625\u0633\u0646\u0627\u062F \u0647\u0630\u0647 \u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u0625\u0644\u0649 \u0623\u062D\u062F \u0623\u0639\u0636\u0627\u0621 \u0641\u0631\u064A\u0642 \u0627\u0644\u0645\u0646\u0635\u0629"
        : "Assign this ticket to a platform team member",
    assigneeId: locale === "ar" ? "\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0633\u0624\u0648\u0644" : "Assignee ID",
    assigneePlaceholder:
      locale === "ar"
        ? "\u0623\u062F\u062E\u0644 \u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645"
        : "Enter user ID",
    cancel: locale === "ar" ? "\u0625\u0644\u063A\u0627\u0621" : "Cancel",
    assign: locale === "ar" ? "\u0625\u0633\u0646\u0627\u062F" : "Assign",
    assigning: locale === "ar" ? "\u062C\u0627\u0631\u064A \u0627\u0644\u0625\u0633\u0646\u0627\u062F..." : "Assigning...",
    successDesc:
      locale === "ar"
        ? "\u062A\u0645 \u0625\u0633\u0646\u0627\u062F \u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u0628\u0646\u062C\u0627\u062D"
        : "Ticket assigned successfully",
  };

  const handleAssign = () => {
    if (!ticket || !assigneeId.trim()) return;

    assignTicket.mutate(
      { id: ticket.id, data: { assignedToId: assigneeId.trim() } },
      {
        onSuccess: () => {
          toast.success(texts.successDesc);
          setAssigneeId("");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="assigneeId">{texts.assigneeId}</Label>
            <Input
              id="assigneeId"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              placeholder={texts.assigneePlaceholder}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {texts.cancel}
          </Button>
          <Button
            onClick={handleAssign}
            disabled={assignTicket.isPending || !assigneeId.trim()}
          >
            {assignTicket.isPending ? texts.assigning : texts.assign}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
