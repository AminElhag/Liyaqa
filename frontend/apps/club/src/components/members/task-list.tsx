"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  User,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@liyaqa/shared/components/ui/dialog";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  useMemberTasks,
  useCompleteTask,
  useStartTask,
  useCancelTask,
} from "@liyaqa/shared/queries/use-tasks";
import type { TaskStatus, TaskType, TaskPriority } from "@liyaqa/shared/lib/api/tasks";

interface TaskListProps {
  memberId: string;
  showCreateButton?: boolean;
  onCreateTask?: () => void;
}

const taskTypeConfig: Record<
  TaskType,
  { icon: React.ReactNode; labelEn: string; labelAr: string }
> = {
  ONBOARDING_CALL: {
    icon: <Phone className="h-4 w-4" />,
    labelEn: "Onboarding Call",
    labelAr: "مكالمة الإعداد",
  },
  RENEWAL_FOLLOWUP: {
    icon: <Calendar className="h-4 w-4" />,
    labelEn: "Renewal Follow-up",
    labelAr: "متابعة التجديد",
  },
  PAYMENT_COLLECTION: {
    icon: <AlertCircle className="h-4 w-4" />,
    labelEn: "Payment Collection",
    labelAr: "تحصيل الدفع",
  },
  RETENTION_OUTREACH: {
    icon: <User className="h-4 w-4" />,
    labelEn: "Retention Outreach",
    labelAr: "التواصل للاحتفاظ",
  },
  WIN_BACK: {
    icon: <MessageSquare className="h-4 w-4" />,
    labelEn: "Win Back",
    labelAr: "استعادة العميل",
  },
  GENERAL_FOLLOWUP: {
    icon: <Mail className="h-4 w-4" />,
    labelEn: "General Follow-up",
    labelAr: "متابعة عامة",
  },
  TOUR_SCHEDULED: {
    icon: <Calendar className="h-4 w-4" />,
    labelEn: "Tour Scheduled",
    labelAr: "جولة مجدولة",
  },
  TRIAL_FOLLOWUP: {
    icon: <Phone className="h-4 w-4" />,
    labelEn: "Trial Follow-up",
    labelAr: "متابعة التجربة",
  },
  FEEDBACK_CALL: {
    icon: <MessageSquare className="h-4 w-4" />,
    labelEn: "Feedback Call",
    labelAr: "مكالمة ملاحظات",
  },
  UPSELL_OPPORTUNITY: {
    icon: <AlertCircle className="h-4 w-4" />,
    labelEn: "Upsell Opportunity",
    labelAr: "فرصة ترقية",
  },
};

const statusConfig: Record<
  TaskStatus,
  { color: string; bgColor: string; labelEn: string; labelAr: string }
> = {
  PENDING: {
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    labelEn: "Pending",
    labelAr: "قيد الانتظار",
  },
  IN_PROGRESS: {
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    labelEn: "In Progress",
    labelAr: "قيد التنفيذ",
  },
  COMPLETED: {
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    labelEn: "Completed",
    labelAr: "مكتمل",
  },
  CANCELLED: {
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    labelEn: "Cancelled",
    labelAr: "ملغى",
  },
  SNOOZED: {
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    labelEn: "Snoozed",
    labelAr: "مؤجل",
  },
};

const priorityConfig: Record<TaskPriority, { color: string; labelEn: string; labelAr: string }> = {
  LOW: { color: "text-gray-500", labelEn: "Low", labelAr: "منخفض" },
  MEDIUM: { color: "text-yellow-600", labelEn: "Medium", labelAr: "متوسط" },
  HIGH: { color: "text-orange-600", labelEn: "High", labelAr: "مرتفع" },
  URGENT: { color: "text-red-600", labelEn: "Urgent", labelAr: "عاجل" },
};

export function TaskList({ memberId, showCreateButton = true, onCreateTask }: TaskListProps) {
  const locale = useLocale();
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState("");

  const { data: tasks, isLoading } = useMemberTasks(memberId);
  const startTaskMutation = useStartTask();
  const completeTaskMutation = useCompleteTask();
  const cancelTaskMutation = useCancelTask();

  const texts = {
    title: locale === "ar" ? "المهام" : "Tasks",
    noTasks: locale === "ar" ? "لا توجد مهام" : "No tasks",
    addTask: locale === "ar" ? "إضافة مهام" : "Add Task",
    dueDate: locale === "ar" ? "تاريخ الاستحقاق" : "Due",
    assignedTo: locale === "ar" ? "مسند إلى" : "Assigned to",
    overdue: locale === "ar" ? "متأخر" : "Overdue",
    dueToday: locale === "ar" ? "مستحق اليوم" : "Due Today",
    start: locale === "ar" ? "بدء" : "Start",
    complete: locale === "ar" ? "إكمال" : "Complete",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    outcome: locale === "ar" ? "النتيجة" : "Outcome",
    completeTask: locale === "ar" ? "إكمال المهمة" : "Complete Task",
    outcomeNote: locale === "ar" ? "ملاحظات حول النتيجة (اختياري)" : "Notes about outcome (optional)",
    confirm: locale === "ar" ? "تأكيد" : "Confirm",
    unassigned: locale === "ar" ? "غير مسند" : "Unassigned",
  };

  const handleStartTask = (taskId: string) => {
    startTaskMutation.mutate(taskId);
  };

  const handleCompleteClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setOutcome("");
    setCompleteDialogOpen(true);
  };

  const handleCompleteConfirm = () => {
    if (selectedTaskId) {
      completeTaskMutation.mutate(
        { taskId: selectedTaskId, request: { outcome: (outcome || "SUCCESSFUL") as import("@/lib/api/tasks").TaskOutcome } },
        {
          onSuccess: () => {
            setCompleteDialogOpen(false);
            setSelectedTaskId(null);
            setOutcome("");
          },
        }
      );
    }
  };

  const handleCancelTask = (taskId: string) => {
    cancelTaskMutation.mutate({ taskId });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeTasks = tasks?.content?.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED"
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {texts.title}
          </CardTitle>
          {showCreateButton && onCreateTask && (
            <Button variant="outline" size="sm" onClick={onCreateTask}>
              <Plus className="h-4 w-4 mr-2" />
              {texts.addTask}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {activeTasks && activeTasks.length > 0 ? (
            <div className="space-y-3">
              {activeTasks.map((task) => {
                const typeConfig = taskTypeConfig[task.taskType];
                const statusCfg = statusConfig[task.status];
                const priorityCfg = priorityConfig[task.priority];
                const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
                const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

                return (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between p-3 rounded-lg border ${
                      isOverdue ? "border-red-200 bg-red-50 dark:bg-red-950/20" : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${statusCfg.color}`}>
                        {task.status === "COMPLETED" ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : task.status === "IN_PROGRESS" ? (
                          <Clock className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{task.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {typeConfig.icon}
                            <span className="ml-1">
                              {locale === "ar" ? typeConfig.labelAr : typeConfig.labelEn}
                            </span>
                          </Badge>
                          <span className={`text-xs font-medium ${priorityCfg.color}`}>
                            {locale === "ar" ? priorityCfg.labelAr : priorityCfg.labelEn}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span className={isOverdue ? "text-red-600 font-medium" : isDueToday ? "text-orange-600 font-medium" : ""}>
                                {isOverdue
                                  ? texts.overdue
                                  : isDueToday
                                  ? texts.dueToday
                                  : `${texts.dueDate}: ${format(new Date(task.dueDate), "MMM d")}`}
                              </span>
                            </div>
                          )}
                          {task.assignedToName ? (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{task.assignedToName}</span>
                            </div>
                          ) : (
                            <span className="text-yellow-600">{texts.unassigned}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {task.status === "PENDING" && (
                          <DropdownMenuItem onClick={() => handleStartTask(task.id)}>
                            {texts.start}
                          </DropdownMenuItem>
                        )}
                        {(task.status === "PENDING" || task.status === "IN_PROGRESS") && (
                          <DropdownMenuItem onClick={() => handleCompleteClick(task.id)}>
                            {texts.complete}
                          </DropdownMenuItem>
                        )}
                        {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                          <DropdownMenuItem
                            onClick={() => handleCancelTask(task.id)}
                            className="text-red-600"
                          >
                            {texts.cancel}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">{texts.noTasks}</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{texts.completeTask}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="outcome">{texts.outcomeNote}</Label>
              <Textarea
                id="outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder={locale === "ar" ? "أدخل ملاحظات..." : "Enter notes..."}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              {texts.cancel}
            </Button>
            <Button onClick={handleCompleteConfirm} disabled={completeTaskMutation.isPending}>
              {texts.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
