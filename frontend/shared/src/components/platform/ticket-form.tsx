"use client";

import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, FileText, Tag, UserCheck } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { usePlatformClients, useClientClubs } from "@liyaqa/shared/queries/platform/use-platform-clients";
import { usePlatformUsers } from "@liyaqa/shared/queries/platform/use-platform-users";
import type {
  SupportTicket,
  TicketCategory,
  TicketPriority,
} from "@liyaqa/shared/types/platform/support-ticket";
import type { LocalizedText } from "@liyaqa/shared/types/api";

/**
 * Zod validation schema for ticket form.
 */
const ticketFormSchema = z.object({
  // Client
  organizationId: z.string().min(1, "Organization is required"),
  clubId: z.string().optional(),

  // Ticket Details
  subject: z.string().min(1, "Subject is required").max(200),
  description: z.string().min(1, "Description is required"),
  category: z.enum([
    "BILLING",
    "TECHNICAL",
    "ACCOUNT",
    "FEATURE_REQUEST",
    "BUG_REPORT",
    "GENERAL",
  ] as const),

  // Classification
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).default("MEDIUM"),
  tags: z.string().optional(),

  // Assignment
  assignedToId: z.string().optional(),
  isInternal: z.boolean().default(false),
});

export type TicketFormValues = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  defaultValues?: Partial<TicketFormValues>;
  ticket?: SupportTicket;
  onSubmit: (data: TicketFormValues) => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}

/**
 * Get localized text based on locale.
 */
function getLocalizedText(
  text: LocalizedText | undefined,
  locale: string
): string {
  if (!text) return "";
  return locale === "ar" ? text.ar || text.en : text.en;
}

/**
 * Form component for creating and editing support tickets.
 */
export function TicketForm({
  defaultValues,
  ticket,
  onSubmit,
  isLoading = false,
  mode,
}: TicketFormProps) {
  const locale = useLocale();

  // Fetch organizations for selector
  const { data: clientsData } = usePlatformClients({ size: 100 });
  const clients = clientsData?.content || [];

  // Fetch platform users for assignee dropdown
  const { data: usersData } = usePlatformUsers({ size: 100 });
  const platformUsers = usersData?.content || [];

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      organizationId: ticket?.organizationId || "",
      clubId: ticket?.clubId || "",
      subject: ticket?.subject || "",
      description: ticket?.description || "",
      category: ticket?.category || "GENERAL",
      priority: ticket?.priority || "MEDIUM",
      tags: ticket?.tags?.join(", ") || "",
      assignedToId: ticket?.assignedToId || "",
      isInternal: ticket?.isInternal || false,
      ...defaultValues,
    },
  });

  // Watch values
  const watchOrgId = watch("organizationId");
  const watchCategory = watch("category");
  const watchPriority = watch("priority");
  const watchIsInternal = watch("isInternal");

  // Fetch clubs for selected organization
  const { data: clubsData } = useClientClubs(watchOrgId, { size: 100 });
  const clubs = clubsData?.content || [];

  const texts = {
    // Section headers
    clientSection: locale === "ar" ? "العميل" : "Client",
    clientSectionDesc:
      locale === "ar"
        ? "اختر المؤسسة المرتبطة بهذه التذكرة"
        : "Select the organization related to this ticket",
    ticketDetails: locale === "ar" ? "تفاصيل التذكرة" : "Ticket Details",
    ticketDetailsDesc:
      locale === "ar"
        ? "الموضوع ووصف المشكلة"
        : "Subject and issue description",
    classification: locale === "ar" ? "التصنيف" : "Classification",
    classificationDesc:
      locale === "ar"
        ? "الأولوية والتصنيف"
        : "Priority and category",
    assignment: locale === "ar" ? "الإسناد" : "Assignment",
    assignmentDesc:
      locale === "ar"
        ? "إسناد التذكرة وخيارات الرؤية"
        : "Ticket assignment and visibility options",

    // Fields
    organization: locale === "ar" ? "المؤسسة" : "Organization",
    selectOrganization: locale === "ar" ? "اختر المؤسسة" : "Select organization",
    club: locale === "ar" ? "النادي" : "Club",
    selectClub: locale === "ar" ? "اختر النادي (اختياري)" : "Select club (optional)",
    subject: locale === "ar" ? "الموضوع" : "Subject",
    subjectPlaceholder:
      locale === "ar"
        ? "أدخل موضوع التذكرة"
        : "Enter ticket subject",
    description: locale === "ar" ? "الوصف" : "Description",
    descriptionPlaceholder:
      locale === "ar"
        ? "صف المشكلة بالتفصيل..."
        : "Describe the issue in detail...",
    category: locale === "ar" ? "التصنيف" : "Category",
    selectCategory: locale === "ar" ? "اختر التصنيف" : "Select category",
    priority: locale === "ar" ? "الأولوية" : "Priority",
    selectPriority: locale === "ar" ? "اختر الأولوية" : "Select priority",
    tags: locale === "ar" ? "العلامات" : "Tags",
    tagsPlaceholder:
      locale === "ar"
        ? "علامات مفصولة بفواصل"
        : "Comma-separated tags",
    assignTo: locale === "ar" ? "إسناد إلى" : "Assign To",
    selectAssignee: locale === "ar" ? "اختر شخص للإسناد" : "Select assignee",
    internalTicket: locale === "ar" ? "تذكرة داخلية" : "Internal Ticket",
    internalTicketDesc:
      locale === "ar"
        ? "تذكرة أنشئت من قبل فريق المنصة"
        : "Ticket created by platform team",

    // Categories
    categoryBilling: locale === "ar" ? "الفوترة" : "Billing",
    categoryTechnical: locale === "ar" ? "تقني" : "Technical",
    categoryAccount: locale === "ar" ? "الحساب" : "Account",
    categoryFeatureRequest: locale === "ar" ? "طلب ميزة" : "Feature Request",
    categoryBugReport: locale === "ar" ? "تقرير خطأ" : "Bug Report",
    categoryGeneral: locale === "ar" ? "عام" : "General",

    // Priorities
    priorityLow: locale === "ar" ? "منخفضة" : "Low",
    priorityMedium: locale === "ar" ? "متوسطة" : "Medium",
    priorityHigh: locale === "ar" ? "عالية" : "High",
    priorityUrgent: locale === "ar" ? "عاجلة" : "Urgent",

    // Buttons
    submit:
      mode === "create"
        ? locale === "ar"
          ? "إنشاء التذكرة"
          : "Create Ticket"
        : locale === "ar"
          ? "حفظ التغييرات"
          : "Save Changes",
    submitting: locale === "ar" ? "جاري الحفظ..." : "Saving...",

    // Other
    noOrganizations:
      locale === "ar"
        ? "لا توجد مؤسسات"
        : "No organizations available",
    noClub: locale === "ar" ? "بدون نادي" : "No club",
    unassigned: locale === "ar" ? "غير مسند" : "Unassigned",
  };

  const categoryOptions: { value: TicketCategory; label: string }[] = [
    { value: "BILLING", label: texts.categoryBilling },
    { value: "TECHNICAL", label: texts.categoryTechnical },
    { value: "ACCOUNT", label: texts.categoryAccount },
    { value: "FEATURE_REQUEST", label: texts.categoryFeatureRequest },
    { value: "BUG_REPORT", label: texts.categoryBugReport },
    { value: "GENERAL", label: texts.categoryGeneral },
  ];

  const priorityOptions: { value: TicketPriority; label: string }[] = [
    { value: "LOW", label: texts.priorityLow },
    { value: "MEDIUM", label: texts.priorityMedium },
    { value: "HIGH", label: texts.priorityHigh },
    { value: "URGENT", label: texts.priorityUrgent },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Client Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>{texts.clientSection}</CardTitle>
          </div>
          <CardDescription>{texts.clientSectionDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organization Selector */}
            <div className="space-y-2">
              <Label htmlFor="organizationId">
                {texts.organization} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watchOrgId}
                onValueChange={(value) => setValue("organizationId", value)}
                disabled={mode === "edit"}
              >
                <SelectTrigger id="organizationId">
                  <SelectValue placeholder={texts.selectOrganization} />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="py-2 px-3 text-sm text-muted-foreground">
                      {texts.noOrganizations}
                    </div>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {getLocalizedText(client.name, locale)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.organizationId && (
                <p className="text-sm text-destructive">
                  {errors.organizationId.message}
                </p>
              )}
            </div>

            {/* Club Selector (optional) */}
            <div className="space-y-2">
              <Label htmlFor="clubId">{texts.club}</Label>
              <Select
                value={watch("clubId") || ""}
                onValueChange={(value) => setValue("clubId", value === "none" ? "" : value)}
                disabled={!watchOrgId}
              >
                <SelectTrigger id="clubId">
                  <SelectValue placeholder={texts.selectClub} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{texts.noClub}</SelectItem>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {getLocalizedText(club.name, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>{texts.ticketDetails}</CardTitle>
          </div>
          <CardDescription>{texts.ticketDetailsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              {texts.subject} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              placeholder={texts.subjectPlaceholder}
              {...register("subject")}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {texts.description} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder={texts.descriptionPlaceholder}
              rows={5}
              dir={locale === "ar" ? "rtl" : "ltr"}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              {texts.category} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watchCategory}
              onValueChange={(value) => setValue("category", value as TicketCategory)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder={texts.selectCategory} />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Classification Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <CardTitle>{texts.classification}</CardTitle>
          </div>
          <CardDescription>{texts.classificationDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">
                {texts.priority} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watchPriority}
                onValueChange={(value) =>
                  setValue("priority", value as TicketPriority)
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder={texts.selectPriority} />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-sm text-destructive">
                  {errors.priority.message}
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">{texts.tags}</Label>
              <Input
                id="tags"
                placeholder={texts.tagsPlaceholder}
                {...register("tags")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <CardTitle>{texts.assignment}</CardTitle>
          </div>
          <CardDescription>{texts.assignmentDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Assign To */}
          <div className="space-y-2">
            <Label htmlFor="assignedToId">{texts.assignTo}</Label>
            <Select
              value={watch("assignedToId") || ""}
              onValueChange={(value) => setValue("assignedToId", value === "none" ? "" : value)}
            >
              <SelectTrigger id="assignedToId">
                <SelectValue placeholder={texts.selectAssignee} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{texts.unassigned}</SelectItem>
                {platformUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {locale === "ar" ? user.displayNameAr || user.displayNameEn : user.displayNameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Internal Ticket Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="isInternal" className="cursor-pointer">
                {texts.internalTicket}
              </Label>
              <p className="text-sm text-muted-foreground">
                {texts.internalTicketDesc}
              </p>
            </div>
            <Switch
              id="isInternal"
              checked={watchIsInternal}
              onCheckedChange={(checked) => setValue("isInternal", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? texts.submitting : texts.submit}
        </Button>
      </div>
    </form>
  );
}
