"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { UserCheck } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Label } from "@liyaqa/shared/components/ui/label";
import { useAssignTicket } from "@liyaqa/shared/queries/platform/use-support-tickets";
import { usePlatformUsers } from "@liyaqa/shared/queries/platform/use-platform-users";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import type { SupportTicketSummary } from "@liyaqa/shared/types/platform/support-ticket";

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
  const locale = useLocale();
  const { toast } = useToast();
  const assignTicket = useAssignTicket();
  const { data: usersData } = usePlatformUsers({ size: 100 });
  const platformUsers = usersData?.content || [];
  const [assigneeId, setAssigneeId] = useState("");

  const texts = {
    title: locale === "ar" ? "إسناد التذكرة" : "Assign Ticket",
    description:
      locale === "ar"
        ? "إسناد هذه التذكرة إلى أحد أعضاء فريق المنصة"
        : "Assign this ticket to a platform team member",
    assignee: locale === "ar" ? "المسؤول" : "Assignee",
    selectAssignee:
      locale === "ar"
        ? "اختر عضو الفريق"
        : "Select team member",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    assign: locale === "ar" ? "إسناد" : "Assign",
    assigning: locale === "ar" ? "جاري الإسناد..." : "Assigning...",
    successTitle: locale === "ar" ? "تم الإسناد" : "Assigned",
    successDesc:
      locale === "ar"
        ? "تم إسناد التذكرة بنجاح"
        : "Ticket assigned successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
  };

  const handleAssign = () => {
    if (!ticket || !assigneeId.trim()) return;

    assignTicket.mutate(
      { id: ticket.id, data: { assignedToId: assigneeId.trim() } },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.successDesc,
          });
          setAssigneeId("");
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
            <Label htmlFor="assigneeId">{texts.assignee}</Label>
            <Select
              value={assigneeId}
              onValueChange={(value) => setAssigneeId(value)}
            >
              <SelectTrigger id="assigneeId">
                <SelectValue placeholder={texts.selectAssignee} />
              </SelectTrigger>
              <SelectContent>
                {platformUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {locale === "ar" ? user.displayNameAr || user.displayNameEn : user.displayNameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
