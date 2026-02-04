"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { format, isPast, isToday } from "date-fns";
import {
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
  MoreVertical,
  Play,
  CheckCheck,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { cn } from "@liyaqa/shared/utils";
import { useStartTask, useCompleteTask } from "@liyaqa/shared/queries/use-tasks";
import type { MemberTask, TaskPriority, TaskStatus } from "@liyaqa/shared/lib/api/tasks";

interface TaskBoardProps {
  tasks: MemberTask[];
  isLoading?: boolean;
}

const columns: { status: TaskStatus; labelEn: string; labelAr: string; color: string }[] = [
  { status: "PENDING", labelEn: "Pending", labelAr: "قيد الانتظار", color: "bg-gray-100" },
  { status: "IN_PROGRESS", labelEn: "In Progress", labelAr: "قيد التنفيذ", color: "bg-blue-100" },
  { status: "COMPLETED", labelEn: "Completed", labelAr: "مكتمل", color: "bg-green-100" },
];

const priorityColors: Record<TaskPriority, string> = {
  LOW: "bg-gray-200 text-gray-700",
  MEDIUM: "bg-yellow-200 text-yellow-800",
  HIGH: "bg-orange-200 text-orange-800",
  URGENT: "bg-red-200 text-red-800",
};

export function TaskBoard({ tasks, isLoading }: TaskBoardProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // Group tasks by status - must be before any early returns
  const tasksByStatus = React.useMemo(() => {
    const grouped: Record<TaskStatus, MemberTask[]> = {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: [],
      CANCELLED: [],
      SNOOZED: [],
    };

    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    }

    return grouped;
  }, [tasks]);

  if (isLoading) {
    return <TaskBoardSkeleton />;
  }

  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-3 gap-4",
      isRtl && "direction-rtl"
    )}>
      {columns.map((column) => (
        <BoardColumn
          key={column.status}
          column={column}
          tasks={tasksByStatus[column.status]}
          locale={locale}
          isRtl={isRtl}
        />
      ))}
    </div>
  );
}

interface BoardColumnProps {
  column: { status: TaskStatus; labelEn: string; labelAr: string; color: string };
  tasks: MemberTask[];
  locale: string;
  isRtl: boolean;
}

function BoardColumn({ column, tasks, locale, isRtl }: BoardColumnProps) {
  return (
    <div className={cn(
      "rounded-md3-lg p-4",
      column.color
    )}>
      {/* Column Header */}
      <div className={cn("flex items-center justify-between mb-4", isRtl && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
          <h3 className="font-semibold">
            {locale === "ar" ? column.labelAr : column.labelEn}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            {locale === "ar" ? "لا توجد مهام" : "No tasks"}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} locale={locale} isRtl={isRtl} />
          ))
        )}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: MemberTask;
  locale: string;
  isRtl: boolean;
}

function TaskCard({ task, locale, isRtl }: TaskCardProps) {
  const router = useRouter();
  const startTaskMutation = useStartTask();
  const completeTaskMutation = useCompleteTask();

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTaskMutation.mutate(task.id);
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeTaskMutation.mutate({ taskId: task.id, request: { outcome: "SUCCESSFUL" } });
  };

  const texts = {
    start: locale === "ar" ? "بدء" : "Start",
    complete: locale === "ar" ? "إكمال" : "Complete",
    viewMember: locale === "ar" ? "عرض العضو" : "View Member",
    overdue: locale === "ar" ? "متأخر" : "Overdue",
    dueToday: locale === "ar" ? "اليوم" : "Today",
  };

  return (
    <div
      className={cn(
        "rounded-md3-md bg-white dark:bg-card p-3 shadow-md3-1 hover:shadow-md3-2 transition-shadow cursor-pointer",
        isOverdue && "ring-2 ring-red-300"
      )}
      onClick={() => router.push(`/${locale}/members/${task.memberId}`)}
    >
      {/* Priority & Status */}
      <div className={cn("flex items-center justify-between mb-2", isRtl && "flex-row-reverse")}>
        <Badge className={cn("text-xs", priorityColors[task.priority])}>
          {task.priority}
        </Badge>
        {isOverdue && (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 me-1" />
            {texts.overdue}
          </Badge>
        )}
        {isDueToday && !isOverdue && (
          <Badge className="text-xs bg-orange-100 text-orange-700">
            {texts.dueToday}
          </Badge>
        )}
      </div>

      {/* Title */}
      <h4 className={cn("font-medium text-sm mb-2 line-clamp-2", isRtl && "text-right")}>
        {task.title}
      </h4>

      {/* Member */}
      <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground mb-2", isRtl && "flex-row-reverse justify-end")}>
        <User className="h-3 w-3" />
        <span>{task.memberName || "Unknown"}</span>
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <div className={cn(
          "flex items-center gap-1.5 text-xs mb-3",
          isOverdue ? "text-red-600" : "text-muted-foreground",
          isRtl && "flex-row-reverse justify-end"
        )}>
          <Calendar className="h-3 w-3" />
          <span>{format(new Date(task.dueDate), "MMM d")}</span>
        </div>
      )}

      {/* Actions */}
      <div className={cn("flex items-center justify-between pt-2 border-t", isRtl && "flex-row-reverse")}>
        {task.status === "PENDING" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleStart}
            disabled={startTaskMutation.isPending}
          >
            <Play className="h-3 w-3 me-1" />
            {texts.start}
          </Button>
        )}
        {task.status === "IN_PROGRESS" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-green-600"
            onClick={handleComplete}
            disabled={completeTaskMutation.isPending}
          >
            <CheckCheck className="h-3 w-3 me-1" />
            {texts.complete}
          </Button>
        )}
        {task.status === "COMPLETED" && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            {locale === "ar" ? "مكتمل" : "Done"}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              router.push(`/${locale}/members/${task.memberId}`);
            }}>
              <User className="h-4 w-4 me-2" />
              {texts.viewMember}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function TaskBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((column) => (
        <div key={column.status} className={cn("rounded-md3-lg p-4", column.color)}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-8" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-md3-md bg-white dark:bg-card p-3 shadow-sm">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
