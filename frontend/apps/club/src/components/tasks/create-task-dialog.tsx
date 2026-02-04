"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Search, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@liyaqa/shared/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Calendar } from "@liyaqa/shared/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@liyaqa/shared/components/ui/popover";
import { cn } from "@liyaqa/shared/utils";
import { useCreateTask } from "@liyaqa/shared/queries/use-tasks";
import { useMembers } from "@liyaqa/shared/queries/use-members";
import type { TaskType, TaskPriority } from "@liyaqa/shared/lib/api/tasks";

const taskTypes: { value: TaskType; labelEn: string; labelAr: string }[] = [
  { value: "GENERAL_FOLLOWUP", labelEn: "General Follow-up", labelAr: "متابعة عامة" },
  { value: "ONBOARDING_CALL", labelEn: "Onboarding Call", labelAr: "مكالمة تأهيل" },
  { value: "RENEWAL_FOLLOWUP", labelEn: "Renewal Follow-up", labelAr: "متابعة تجديد" },
  { value: "PAYMENT_COLLECTION", labelEn: "Payment Collection", labelAr: "تحصيل دفعة" },
  { value: "RETENTION_OUTREACH", labelEn: "Retention Outreach", labelAr: "تواصل استبقاء" },
  { value: "WIN_BACK", labelEn: "Win Back", labelAr: "استعادة عميل" },
  { value: "TOUR_SCHEDULED", labelEn: "Tour Scheduled", labelAr: "جولة مجدولة" },
  { value: "TRIAL_FOLLOWUP", labelEn: "Trial Follow-up", labelAr: "متابعة تجربة" },
  { value: "FEEDBACK_CALL", labelEn: "Feedback Call", labelAr: "مكالمة ملاحظات" },
  { value: "UPSELL_OPPORTUNITY", labelEn: "Upsell Opportunity", labelAr: "فرصة بيع إضافي" },
];

const priorities: { value: TaskPriority; labelEn: string; labelAr: string }[] = [
  { value: "LOW", labelEn: "Low", labelAr: "منخفض" },
  { value: "MEDIUM", labelEn: "Medium", labelAr: "متوسط" },
  { value: "HIGH", labelEn: "High", labelAr: "مرتفع" },
  { value: "URGENT", labelEn: "Urgent", labelAr: "عاجل" },
];

const formSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  taskType: z.string().min(1, "Task type is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId?: string;
}

export function CreateTaskDialog({ open, onOpenChange, memberId }: CreateTaskDialogProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const createTaskMutation = useCreateTask();

  const [memberSearch, setMemberSearch] = React.useState("");
  const { data: membersData } = useMembers({ search: memberSearch, page: 0, size: 10 });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: memberId || "",
      taskType: "",
      title: "",
      description: "",
      priority: "MEDIUM",
    },
  });

  const texts = {
    title: locale === "ar" ? "إنشاء مهمة جديدة" : "Create New Task",
    description: locale === "ar"
      ? "أضف مهمة جديدة لمتابعة عضو"
      : "Add a new task to follow up with a member",
    member: locale === "ar" ? "العضو" : "Member",
    searchMember: locale === "ar" ? "البحث عن عضو..." : "Search for a member...",
    taskType: locale === "ar" ? "نوع المهمة" : "Task Type",
    selectType: locale === "ar" ? "اختر نوع المهمة" : "Select task type",
    taskTitle: locale === "ar" ? "عنوان المهمة" : "Task Title",
    taskTitlePlaceholder: locale === "ar" ? "أدخل عنوان المهمة" : "Enter task title",
    taskDescription: locale === "ar" ? "الوصف" : "Description",
    taskDescriptionPlaceholder: locale === "ar" ? "أدخل وصف المهمة (اختياري)" : "Enter task description (optional)",
    dueDate: locale === "ar" ? "تاريخ الاستحقاق" : "Due Date",
    selectDate: locale === "ar" ? "اختر تاريخ" : "Select date",
    priority: locale === "ar" ? "الأولوية" : "Priority",
    selectPriority: locale === "ar" ? "اختر الأولوية" : "Select priority",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    create: locale === "ar" ? "إنشاء" : "Create Task",
    creating: locale === "ar" ? "جاري الإنشاء..." : "Creating...",
  };

  const onSubmit = async (data: FormValues) => {
    try {
      await createTaskMutation.mutateAsync({
        memberId: data.memberId,
        taskType: data.taskType as TaskType,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : undefined,
        priority: (data.priority as TaskPriority) || "MEDIUM",
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className={cn(isRtl && "text-right")}>{texts.title}</DialogTitle>
          <DialogDescription className={cn(isRtl && "text-right")}>
            {texts.description}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Member Selection */}
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(isRtl && "text-right block")}>{texts.member}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={texts.searchMember} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="p-2">
                        <div className="relative">
                          <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRtl ? "right-3" : "left-3")} />
                          <Input
                            placeholder={texts.searchMember}
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className={cn("h-9", isRtl ? "pr-9" : "pl-9")}
                          />
                        </div>
                      </div>
                      {membersData?.content.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                            <User className="h-4 w-4" />
                            <span>{locale === "ar" ? (member.firstName.ar || member.firstName.en) : member.firstName.en} {locale === "ar" ? (member.lastName.ar || member.lastName.en) : member.lastName.en}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Task Type */}
            <FormField
              control={form.control}
              name="taskType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(isRtl && "text-right block")}>{texts.taskType}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={texts.selectType} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {taskTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {locale === "ar" ? type.labelAr : type.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(isRtl && "text-right block")}>{texts.taskTitle}</FormLabel>
                  <FormControl>
                    <Input placeholder={texts.taskTitlePlaceholder} {...field} className={cn(isRtl && "text-right")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(isRtl && "text-right block")}>{texts.taskDescription}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={texts.taskDescriptionPlaceholder}
                      {...field}
                      className={cn(isRtl && "text-right")}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date & Priority */}
            <div className="grid grid-cols-2 gap-4">
              {/* Due Date */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn(isRtl && "text-right block")}>{texts.dueDate}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "MMM d, yyyy") : texts.selectDate}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn(isRtl && "text-right block")}>{texts.priority}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={texts.selectPriority} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {locale === "ar" ? priority.labelAr : priority.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className={cn(isRtl && "flex-row-reverse")}>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {texts.cancel}
              </Button>
              <Button type="submit" disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? texts.creating : texts.create}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
