"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckSquare,
  List,
  LayoutGrid,
  Calendar,
  Plus,
  Filter,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useMyTasks, useTaskStats } from "@/queries/use-tasks";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskFilters } from "@/components/tasks/task-filters";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import type { TaskStatus, TaskType, TaskPriority } from "@/lib/api/tasks";

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.2, 0, 0, 1] as const },
  },
};

type ViewMode = "list" | "board" | "calendar";

export default function TasksPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRtl = locale === "ar";

  const [viewMode, setViewMode] = React.useState<ViewMode>(
    (searchParams.get("view") as ViewMode) || "list"
  );
  const [showFilters, setShowFilters] = React.useState(false);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filters state
  const [selectedStatuses, setSelectedStatuses] = React.useState<TaskStatus[]>([
    "PENDING",
    "IN_PROGRESS",
  ]);
  const [selectedTypes, setSelectedTypes] = React.useState<TaskType[]>([]);
  const [selectedPriorities, setSelectedPriorities] = React.useState<TaskPriority[]>([]);

  // Fetch tasks
  const { data: tasksData, isLoading } = useMyTasks({
    statuses: selectedStatuses,
    page: 0,
    size: 100,
  });

  // Fetch stats
  const { data: stats } = useTaskStats();

  const texts = {
    title: locale === "ar" ? "المهام" : "Tasks",
    subtitle: locale === "ar"
      ? "إدارة المهام والمتابعات"
      : "Manage tasks and follow-ups",
    search: locale === "ar" ? "البحث عن مهمة..." : "Search tasks...",
    newTask: locale === "ar" ? "مهمة جديدة" : "New Task",
    filters: locale === "ar" ? "الفلاتر" : "Filters",
    list: locale === "ar" ? "قائمة" : "List",
    board: locale === "ar" ? "لوحة" : "Board",
    calendar: locale === "ar" ? "تقويم" : "Calendar",
    pending: locale === "ar" ? "قيد الانتظار" : "Pending",
    inProgress: locale === "ar" ? "قيد التنفيذ" : "In Progress",
    overdue: locale === "ar" ? "متأخر" : "Overdue",
    dueToday: locale === "ar" ? "مستحق اليوم" : "Due Today",
  };

  // Filter tasks by search query
  const filteredTasks = React.useMemo(() => {
    const tasks = tasksData?.content || [];
    if (!searchQuery.trim()) return tasks;

    const query = searchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.memberName?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
    );
  }, [tasksData?.content, searchQuery]);

  // Update URL when view mode changes
  const handleViewChange = (view: ViewMode) => {
    setViewMode(view);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={sectionVariants}>
        <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between")}>
          <div className={cn(isRtl && "text-right")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse justify-end")}>
              <CheckSquare className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">{texts.title}</h1>
            </div>
            <p className="text-muted-foreground mt-1">{texts.subtitle}</p>
          </div>

          <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 me-2" />
              {texts.newTask}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={sectionVariants}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label={texts.pending}
            value={stats?.totalPending || 0}
            color="bg-yellow-500"
          />
          <StatCard
            label={texts.inProgress}
            value={stats?.totalInProgress || 0}
            color="bg-blue-500"
          />
          <StatCard
            label={texts.overdue}
            value={stats?.totalOverdue || 0}
            color="bg-red-500"
          />
          <StatCard
            label={texts.dueToday}
            value={stats?.totalDueToday || 0}
            color="bg-orange-500"
          />
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div variants={sectionVariants}>
        <div
          className={cn(
            "flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
            "p-4 rounded-md3-lg border bg-card"
          )}
        >
          {/* Search */}
          <div className={cn("relative flex-1 max-w-md", isRtl && "order-2 md:order-1")}>
            <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRtl ? "right-3" : "left-3")} />
            <Input
              placeholder={texts.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("h-10", isRtl ? "pr-10" : "pl-10")}
            />
          </div>

          {/* View Tabs & Filter */}
          <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse order-1 md:order-2")}>
            <Tabs value={viewMode} onValueChange={(v) => handleViewChange(v as ViewMode)}>
              <TabsList className="h-10">
                <TabsTrigger value="list" className="gap-1.5">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">{texts.list}</span>
                </TabsTrigger>
                <TabsTrigger value="board" className="gap-1.5">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">{texts.board}</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">{texts.calendar}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <TaskFilters
            selectedStatuses={selectedStatuses}
            onStatusChange={setSelectedStatuses}
            selectedTypes={selectedTypes}
            onTypeChange={setSelectedTypes}
            selectedPriorities={selectedPriorities}
            onPriorityChange={setSelectedPriorities}
          />
        </motion.div>
      )}

      {/* Task Views */}
      <motion.div variants={sectionVariants}>
        {viewMode === "list" && (
          <TaskListView
            tasks={filteredTasks}
            isLoading={isLoading}
          />
        )}
        {viewMode === "board" && (
          <TaskBoard
            tasks={filteredTasks}
            isLoading={isLoading}
          />
        )}
        {viewMode === "calendar" && (
          <div className="p-8 text-center text-muted-foreground border rounded-md3-lg">
            <Calendar className="h-12 w-12 mx-auto mb-4" />
            <p>{locale === "ar" ? "قريبا - عرض التقويم" : "Coming Soon - Calendar View"}</p>
          </div>
        )}
      </motion.div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="p-4 rounded-md3-md border bg-card">
      <div className="flex items-center gap-3">
        <div className={cn("h-2 w-2 rounded-full", color)} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
