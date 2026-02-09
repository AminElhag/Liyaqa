import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, FileText, Tag, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useClients, useClientClubs } from "@/hooks/use-clients";
import { usePlatformUsers } from "@/hooks/use-platform-users";
import type {
  SupportTicket,
  TicketCategory,
  TicketPriority,
} from "@/types";
import type { LocalizedText } from "@/types";

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
  const { i18n } = useTranslation();
  const locale = i18n.language;

  // Fetch organizations for selector
  const { data: clientsData } = useClients({ size: 100 });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ticketFormSchema) as any,
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
    clientSection: locale === "ar" ? "\u0627\u0644\u0639\u0645\u064A\u0644" : "Client",
    clientSectionDesc:
      locale === "ar"
        ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0627\u0644\u0645\u0631\u062A\u0628\u0637\u0629 \u0628\u0647\u0630\u0647 \u0627\u0644\u062A\u0630\u0643\u0631\u0629"
        : "Select the organization related to this ticket",
    ticketDetails: locale === "ar" ? "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062A\u0630\u0643\u0631\u0629" : "Ticket Details",
    ticketDetailsDesc:
      locale === "ar"
        ? "\u0627\u0644\u0645\u0648\u0636\u0648\u0639 \u0648\u0648\u0635\u0641 \u0627\u0644\u0645\u0634\u0643\u0644\u0629"
        : "Subject and issue description",
    classification: locale === "ar" ? "\u0627\u0644\u062A\u0635\u0646\u064A\u0641" : "Classification",
    classificationDesc:
      locale === "ar"
        ? "\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629 \u0648\u0627\u0644\u062A\u0635\u0646\u064A\u0641"
        : "Priority and category",
    assignment: locale === "ar" ? "\u0627\u0644\u0625\u0633\u0646\u0627\u062F" : "Assignment",
    assignmentDesc:
      locale === "ar"
        ? "\u0625\u0633\u0646\u0627\u062F \u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u0648\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0631\u0624\u064A\u0629"
        : "Ticket assignment and visibility options",

    // Fields
    organization: locale === "ar" ? "\u0627\u0644\u0645\u0624\u0633\u0633\u0629" : "Organization",
    selectOrganization: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u0645\u0624\u0633\u0633\u0629" : "Select organization",
    club: locale === "ar" ? "\u0627\u0644\u0646\u0627\u062F\u064A" : "Club",
    selectClub: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u0646\u0627\u062F\u064A (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)" : "Select club (optional)",
    subject: locale === "ar" ? "\u0627\u0644\u0645\u0648\u0636\u0648\u0639" : "Subject",
    subjectPlaceholder:
      locale === "ar"
        ? "\u0623\u062F\u062E\u0644 \u0645\u0648\u0636\u0648\u0639 \u0627\u0644\u062A\u0630\u0643\u0631\u0629"
        : "Enter ticket subject",
    description: locale === "ar" ? "\u0627\u0644\u0648\u0635\u0641" : "Description",
    descriptionPlaceholder:
      locale === "ar"
        ? "\u0635\u0641 \u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u0628\u0627\u0644\u062A\u0641\u0635\u064A\u0644..."
        : "Describe the issue in detail...",
    category: locale === "ar" ? "\u0627\u0644\u062A\u0635\u0646\u064A\u0641" : "Category",
    selectCategory: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u062A\u0635\u0646\u064A\u0641" : "Select category",
    priority: locale === "ar" ? "\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629" : "Priority",
    selectPriority: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629" : "Select priority",
    tags: locale === "ar" ? "\u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062A" : "Tags",
    tagsPlaceholder:
      locale === "ar"
        ? "\u0639\u0644\u0627\u0645\u0627\u062A \u0645\u0641\u0635\u0648\u0644\u0629 \u0628\u0641\u0648\u0627\u0635\u0644"
        : "Comma-separated tags",
    assignTo: locale === "ar" ? "\u0625\u0633\u0646\u0627\u062F \u0625\u0644\u0649" : "Assign To",
    selectAssignee: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0634\u062E\u0635 \u0644\u0644\u0625\u0633\u0646\u0627\u062F" : "Select assignee",
    internalTicket: locale === "ar" ? "\u062A\u0630\u0643\u0631\u0629 \u062F\u0627\u062E\u0644\u064A\u0629" : "Internal Ticket",
    internalTicketDesc:
      locale === "ar"
        ? "\u062A\u0630\u0643\u0631\u0629 \u0623\u0646\u0634\u0626\u062A \u0645\u0646 \u0642\u0628\u0644 \u0641\u0631\u064A\u0642 \u0627\u0644\u0645\u0646\u0635\u0629"
        : "Ticket created by platform team",

    // Categories
    categoryBilling: locale === "ar" ? "\u0627\u0644\u0641\u0648\u062A\u0631\u0629" : "Billing",
    categoryTechnical: locale === "ar" ? "\u062A\u0642\u0646\u064A" : "Technical",
    categoryAccount: locale === "ar" ? "\u0627\u0644\u062D\u0633\u0627\u0628" : "Account",
    categoryFeatureRequest: locale === "ar" ? "\u0637\u0644\u0628 \u0645\u064A\u0632\u0629" : "Feature Request",
    categoryBugReport: locale === "ar" ? "\u062A\u0642\u0631\u064A\u0631 \u062E\u0637\u0623" : "Bug Report",
    categoryGeneral: locale === "ar" ? "\u0639\u0627\u0645" : "General",

    // Priorities
    priorityLow: locale === "ar" ? "\u0645\u0646\u062E\u0641\u0636\u0629" : "Low",
    priorityMedium: locale === "ar" ? "\u0645\u062A\u0648\u0633\u0637\u0629" : "Medium",
    priorityHigh: locale === "ar" ? "\u0639\u0627\u0644\u064A\u0629" : "High",
    priorityUrgent: locale === "ar" ? "\u0639\u0627\u062C\u0644\u0629" : "Urgent",

    // Buttons
    submit:
      mode === "create"
        ? locale === "ar"
          ? "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062A\u0630\u0643\u0631\u0629"
          : "Create Ticket"
        : locale === "ar"
          ? "\u062D\u0641\u0638 \u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A"
          : "Save Changes",
    submitting: locale === "ar" ? "\u062C\u0627\u0631\u064A \u0627\u0644\u062D\u0641\u0638..." : "Saving...",

    // Other
    noOrganizations:
      locale === "ar"
        ? "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0624\u0633\u0633\u0627\u062A"
        : "No organizations available",
    noClub: locale === "ar" ? "\u0628\u062F\u0648\u0646 \u0646\u0627\u062F\u064A" : "No club",
    unassigned: locale === "ar" ? "\u063A\u064A\u0631 \u0645\u0633\u0646\u062F" : "Unassigned",
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
