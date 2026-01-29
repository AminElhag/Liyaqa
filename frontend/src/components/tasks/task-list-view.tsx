"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { format, isPast, isToday } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  MoreVertical,
  Play,
  CheckCheck,
  XCircle,
  Calendar,
  User,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useStartTask, useCompleteTask, useCancelTask } from "@/queries/use-tasks";
import type { MemberTask, TaskPriority, TaskStatus } from "@/lib/api/tasks";

interface TaskListViewProps {
  tasks: MemberTask[];
  isLoading?: boolean;
  selectedTasks?: string[];
  onSelectTask?: (taskId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

const priorityConfig: Record<TaskPriority, { color: string; label: { en: string; ar: string } }> = {
  LOW: { color: "bg-gray-100 text-gray-600", label: { en: "Low", ar: "منخفض" } },
  MEDIUM: { color: "bg-yellow-100 text-yellow-700", label: { en: "Medium", ar: "متوسط" } },
  HIGH: { color: "bg-orange-100 text-orange-700", label: { en: "High", ar: "مرتفع" } },
  URGENT: { color: "bg-red-100 text-red-700", label: { en: "Urgent", ar: "عاجل" } },
};

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string }> = {
  PENDING: { icon: Circle, color: "text-gray-400" },
  IN_PROGRESS: { icon: Clock, color: "text-blue-500" },
  COMPLETED: { icon: CheckCircle2, color: "text-green-500" },
  CANCELLED: { icon: XCircle, color: "text-gray-400" },
  SNOOZED: { icon: Clock, color: "text-purple-500" },
};

export function TaskListView({
  tasks,
  isLoading,
  selectedTasks = [],
  onSelectTask,
  onSelectAll,
}: TaskListViewProps) {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";

  const startTaskMutation = useStartTask();
  const completeTaskMutation = useCompleteTask();
  const cancelTaskMutation = useCancelTask();

  const texts = {
    noTasks: locale === "ar" ? "لا توجد مهام" : "No tasks found",
    overdue: locale === "ar" ? "متأخر" : "Overdue",
    dueToday: locale === "ar" ? "مستحق اليوم" : "Due Today",
    start: locale === "ar" ? "بدء" : "Start",
    complete: locale === "ar" ? "إكمال" : "Complete",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    viewMember: locale === "ar" ? "عرض العضو" : "View Member",
    selectAll: locale === "ar" ? "تحديد الكل" : "Select All",
    task: locale === "ar" ? "المهمة" : "Task",
    member: locale === "ar" ? "العضو" : "Member",
    dueDate: locale === "ar" ? "تاريخ الاستحقاق" : "Due Date",
    priority: locale === "ar" ? "الأولوية" : "Priority",
    status: locale === "ar" ? "الحالة" : "Status",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
  };

  if (isLoading) {
    return <TaskListSkeleton />;
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mb-4 text-green-500" />
        <p>{texts.noTasks}</p>
      </div>
    );
  }

  const handleStart = (taskId: string) => {
    startTaskMutation.mutate(taskId);
  };

  const handleComplete = (taskId: string) => {
    completeTaskMutation.mutate({ taskId, request: { outcome: "SUCCESSFUL" } });
  };

  const handleCancel = (taskId: string) => {
    cancelTaskMutation.mutate({ taskId });
  };

  return (
    <div className="rounded-md3-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className={cn(
        "grid grid-cols-12 gap-4 px-4 py-3 border-b bg-muted/50 text-sm font-medium text-muted-foreground",
        isRtl && "text-right"
      )}>
        {onSelectTask && (
          <div className="col-span-1 flex items-center">
            <Checkbox
              checked={selectedTasks.length === tasks.length && tasks.length > 0}
              onCheckedChange={(checked) => onSelectAll?.(!!checked)}
            />
          </div>
        )}
        <div className={cn("col-span-4", onSelectTask ? "col-span-3" : "col-span-4")}>{texts.task}</div>
        <div className="col-span-2">{texts.member}</div>
        <div className="col-span-2">{texts.dueDate}</div>
        <div className="col-span-1">{texts.priority}</div>
        <div className="col-span-1">{texts.status}</div>
        <div className="col-span-2 text-center">{texts.actions}</div>
      </div>

      {/* Rows */}
      <div className="divide-y">
        {tasks.map((task) => {
          const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
          const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
          const StatusIcon = statusConfig[task.status]?.icon || Circle;
          const priorityStyle = priorityConfig[task.priority];

          return (
            <div
              key={task.id}
              className={cn(
                "grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/30 transition-colors",
                isOverdue && "bg-red-50 dark:bg-red-950/20",
                isRtl && "text-right"
              )}
            >
              {onSelectTask && (
                <div className="col-span-1 flex items-center">
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={(checked) => onSelectTask(task.id, !!checked)}
                  />
                </div>
              )}

              {/* Task Title */}
              <div className={cn("col-span-4 flex items-center gap-3", onSelectTask ? "col-span-3" : "col-span-4")}>
                <StatusIcon className={cn("h-5 w-5 shrink-0", statusConfig[task.status]?.color)} />
                <div className="min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                  )}
                </div>
              </div>

              {/* Member */}
              <div className="col-span-2 flex items-center">
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => router.push(`/${locale}/members/${task.memberId}`)}
                >
                  <User className="h-3 w-3 me-1" />
                  {task.memberName || "Unknown"}
                </Button>
              </div>

              {/* Due Date */}
              <div className="col-span-2 flex items-center gap-2">
                {task.dueDate ? (
                  <>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                      "text-sm",
                      isOverdue && "text-red-600 font-medium",
                      isDueToday && !isOverdue && "text-orange-600 font-medium"
                    )}>
                      {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </span>
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs">
                        {texts.overdue}
                      </Badge>
                    )}
                    {isDueToday && !isOverdue && (
                      <Badge className="text-xs bg-orange-100 text-orange-700">
                        {texts.dueToday}
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>

              {/* Priority */}
              <div className="col-span-1 flex items-center">
                <Badge className={cn("text-xs", priorityStyle.color)}>
                  {locale === "ar" ? priorityStyle.label.ar : priorityStyle.label.en}
                </Badge>
              </div>

              {/* Status */}
              <div className="col-span-1 flex items-center">
                <Badge variant="outline" className="text-xs">
                  {task.status.replace("_", " ")}
                </Badge>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-center gap-1">
                {task.status === "PENDING" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStart(task.id)}
                    disabled={startTaskMutation.isPending}
                  >
                    <Play className="h-4 w-4 me-1" />
                    {texts.start}
                  </Button>
                )}
                {task.status === "IN_PROGRESS" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600"
                    onClick={() => handleComplete(task.id)}
                    disabled={completeTaskMutation.isPending}
                  >
                    <CheckCheck className="h-4 w-4 me-1" />
                    {texts.complete}
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/${locale}/members/${task.memberId}`)}>
                      <User className="h-4 w-4 me-2" />
                      {texts.viewMember}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleCancel(task.id)}
                      >
                        <XCircle className="h-4 w-4 me-2" />
                        {texts.cancel}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskListSkeleton() {
  return (
    <div className="rounded-md3-lg border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/50">
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
