"use client";

import { useLocale } from "next-intl";
import { format, isPast, isToday } from "date-fns";
import { useRouter } from "next/navigation";
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
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyTasksToday, useCompleteTask, useStartTask } from "@/queries/use-tasks";
import type { TaskType, TaskPriority } from "@/lib/api/tasks";

const taskTypeIcons: Partial<Record<TaskType, React.ReactNode>> = {
  ONBOARDING_CALL: <Phone className="h-3 w-3" />,
  RENEWAL_FOLLOWUP: <Calendar className="h-3 w-3" />,
  PAYMENT_COLLECTION: <AlertCircle className="h-3 w-3" />,
  RETENTION_OUTREACH: <User className="h-3 w-3" />,
  WIN_BACK: <MessageSquare className="h-3 w-3" />,
  GENERAL_FOLLOWUP: <Mail className="h-3 w-3" />,
  TOUR_SCHEDULED: <Calendar className="h-3 w-3" />,
  TRIAL_FOLLOWUP: <Phone className="h-3 w-3" />,
  FEEDBACK_CALL: <MessageSquare className="h-3 w-3" />,
  UPSELL_OPPORTUNITY: <AlertCircle className="h-3 w-3" />,
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export function MyTasksWidget() {
  const locale = useLocale();
  const router = useRouter();
  const { data: tasks, isLoading, error } = useMyTasksToday();
  const startTaskMutation = useStartTask();
  const completeTaskMutation = useCompleteTask();

  const texts = {
    title: locale === "ar" ? "مهامي اليوم" : "My Tasks Today",
    noTasks: locale === "ar" ? "لا توجد مهام لليوم" : "No tasks for today",
    viewAll: locale === "ar" ? "عرض الكل" : "View All",
    overdue: locale === "ar" ? "متأخر" : "Overdue",
    dueToday: locale === "ar" ? "مستحق اليوم" : "Due Today",
    start: locale === "ar" ? "بدء" : "Start",
    done: locale === "ar" ? "تم" : "Done",
    tasks: locale === "ar" ? "مهام" : "tasks",
    pending: locale === "ar" ? "قيد الانتظار" : "pending",
    inProgress: locale === "ar" ? "قيد التنفيذ" : "in progress",
    errorLoading: locale === "ar" ? "خطأ في تحميل المهام" : "Error loading tasks",
    errorMessage: locale === "ar" ? "تعذر تحميل المهام. يرجى المحاولة مرة أخرى." : "Failed to load tasks. Please try again.",
  };

  const handleStartTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    startTaskMutation.mutate(taskId);
  };

  const handleCompleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    completeTaskMutation.mutate({ taskId, request: { outcome: "SUCCESSFUL" } });
  };

  const handleTaskClick = (memberId: string) => {
    router.push(`/${locale}/members/${memberId}`);
  };

  if (error) {
    return (
      <Card className="border-muted-foreground/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {texts.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground mb-1">{texts.errorLoading}</p>
          <p className="text-xs text-muted-foreground">{texts.errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Combine all tasks from the response
  const taskList = [
    ...(tasks?.overdue || []),
    ...(tasks?.dueToday || []),
    ...(tasks?.upcoming || []),
  ];
  const pendingCount = tasks?.stats?.totalPending || 0;
  const inProgressCount = tasks?.stats?.totalInProgress || 0;
  const overdueCount = tasks?.stats?.totalOverdue || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {texts.title}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => router.push(`/${locale}/tasks`)}>
          {texts.viewAll}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Summary badges */}
        <div className="flex gap-2 mb-4">
          <Badge variant="secondary">
            {taskList.length} {texts.tasks}
          </Badge>
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-gray-600">
              {pendingCount} {texts.pending}
            </Badge>
          )}
          {inProgressCount > 0 && (
            <Badge variant="outline" className="text-blue-600">
              {inProgressCount} {texts.inProgress}
            </Badge>
          )}
          {overdueCount > 0 && (
            <Badge variant="destructive">
              {overdueCount} {texts.overdue}
            </Badge>
          )}
        </div>

        {taskList.length > 0 ? (
          <div className="space-y-2">
            {taskList.slice(0, 5).map((task) => {
              const isOverdue =
                task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
              const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors ${
                    isOverdue
                      ? "bg-red-50 dark:bg-red-950/20 border border-red-200"
                      : "bg-muted/50"
                  }`}
                  onClick={() => handleTaskClick(task.memberId)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`flex items-center justify-center h-8 w-8 rounded-full ${
                        task.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {task.status === "IN_PROGRESS" ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{task.title}</span>
                        <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                          {taskTypeIcons[task.taskType]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{task.memberName}</span>
                        {isOverdue && (
                          <span className="text-red-600 font-medium">{texts.overdue}</span>
                        )}
                        {isDueToday && !isOverdue && (
                          <span className="text-orange-600 font-medium">{texts.dueToday}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleStartTask(task.id, e)}
                        disabled={startTaskMutation.isPending}
                      >
                        {texts.start}
                      </Button>
                    )}
                    {task.status === "IN_PROGRESS" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleCompleteTask(task.id, e)}
                        disabled={completeTaskMutation.isPending}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {texts.done}
                      </Button>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
            {taskList.length > 5 && (
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => router.push(`/${locale}/tasks`)}
              >
                +{taskList.length - 5} more {texts.tasks}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>{texts.noTasks}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
