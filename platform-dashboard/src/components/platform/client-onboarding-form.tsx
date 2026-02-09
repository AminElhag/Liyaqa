import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Building2, Store, UserCog, CreditCard, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveClientPlans } from "@/hooks/use-client-plans";
import { getLocalizedText } from "@/lib/utils";
import type { OrganizationType } from "@/types/organization";
import type { BillingCycle } from "@/types/client-plan";

// Form validation schema
const onboardingSchema = z.object({
  // Organization
  organizationNameEn: z.string().min(1, "English name is required"),
  organizationNameAr: z.string().optional(),
  organizationTradeNameEn: z.string().optional(),
  organizationTradeNameAr: z.string().optional(),
  organizationType: z.string().optional(),
  organizationEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  organizationPhone: z.string().optional(),
  organizationWebsite: z.string().url("Invalid URL").optional().or(z.literal("")),
  vatRegistrationNumber: z.string().optional(),
  commercialRegistrationNumber: z.string().optional(),

  // Club
  clubNameEn: z.string().min(1, "Club English name is required"),
  clubNameAr: z.string().optional(),
  clubDescriptionEn: z.string().optional(),
  clubDescriptionAr: z.string().optional(),
  clubSlug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(63, "Slug must be at most 63 characters")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Slug must be lowercase alphanumeric with hyphens"
    )
    .optional()
    .or(z.literal("")),

  // Admin User
  adminEmail: z.string().email("Invalid admin email"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  adminDisplayNameEn: z.string().min(1, "Admin display name is required"),
  adminDisplayNameAr: z.string().optional(),

  // Subscription (optional)
  createSubscription: z.boolean().default(false),
  clientPlanId: z.string().optional(),
  agreedPriceAmount: z.coerce.number().min(0).optional(),
  agreedPriceCurrency: z.string().default("SAR"),
  billingCycle: z.string().optional(),
  contractMonths: z.coerce.number().min(1).optional(),
  startWithTrial: z.boolean().default(false),
  trialDays: z.coerce.number().min(1).optional(),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

interface ClientOnboardingFormProps {
  onSubmit: (data: OnboardingFormValues) => void;
  isLoading?: boolean;
}

const ORG_TYPES: { value: OrganizationType; labelEn: string; labelAr: string }[] = [
  { value: "LLC", labelEn: "LLC", labelAr: "\u0630.\u0645.\u0645" },
  { value: "SOLE_PROPRIETORSHIP", labelEn: "Sole Proprietorship", labelAr: "\u0645\u0624\u0633\u0633\u0629 \u0641\u0631\u062F\u064A\u0629" },
  { value: "PARTNERSHIP", labelEn: "Partnership", labelAr: "\u0634\u0631\u0627\u0643\u0629" },
  { value: "CORPORATION", labelEn: "Corporation", labelAr: "\u0634\u0631\u0643\u0629 \u0645\u0633\u0627\u0647\u0645\u0629" },
  { value: "OTHER", labelEn: "Other", labelAr: "\u0623\u062E\u0631\u0649" },
];

const BILLING_CYCLES: { value: BillingCycle; labelEn: string; labelAr: string }[] = [
  { value: "MONTHLY", labelEn: "Monthly", labelAr: "\u0634\u0647\u0631\u064A" },
  { value: "QUARTERLY", labelEn: "Quarterly", labelAr: "\u0631\u0628\u0639 \u0633\u0646\u0648\u064A" },
  { value: "ANNUAL", labelEn: "Annual", labelAr: "\u0633\u0646\u0648\u064A" },
];

export function ClientOnboardingForm({ onSubmit, isLoading }: ClientOnboardingFormProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const [activeTab, setActiveTab] = useState("organization");
  const [showPassword, setShowPassword] = useState(false);

  // Fetch active plans for subscription dropdown
  const { data: activePlans } = useActiveClientPlans();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(onboardingSchema) as any,
    defaultValues: {
      organizationNameEn: "",
      organizationNameAr: "",
      organizationTradeNameEn: "",
      organizationTradeNameAr: "",
      organizationType: "",
      organizationEmail: "",
      organizationPhone: "",
      organizationWebsite: "",
      vatRegistrationNumber: "",
      commercialRegistrationNumber: "",
      clubNameEn: "",
      clubNameAr: "",
      clubDescriptionEn: "",
      clubDescriptionAr: "",
      clubSlug: "",
      adminEmail: "",
      adminPassword: "",
      adminDisplayNameEn: "",
      adminDisplayNameAr: "",
      createSubscription: false,
      clientPlanId: "",
      agreedPriceAmount: 0,
      agreedPriceCurrency: "SAR",
      billingCycle: "MONTHLY",
      contractMonths: 12,
      startWithTrial: false,
      trialDays: 14,
      discountPercentage: 0,
    },
  });

  const createSubscription = watch("createSubscription");
  const startWithTrial = watch("startWithTrial");
  const watchOrgType = watch("organizationType");
  const watchBillingCycle = watch("billingCycle");
  const watchClientPlanId = watch("clientPlanId");
  const watchClubSlug = watch("clubSlug");

  const texts = {
    organization: locale === "ar" ? "\u0627\u0644\u0645\u0646\u0638\u0645\u0629" : "Organization",
    club: locale === "ar" ? "\u0627\u0644\u0646\u0627\u062F\u064A" : "Club",
    admin: locale === "ar" ? "\u0627\u0644\u0645\u0633\u0624\u0648\u0644" : "Admin User",
    subscription: locale === "ar" ? "\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643" : "Subscription",
    organizationDetails: locale === "ar" ? "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0645\u0646\u0638\u0645\u0629" : "Organization Details",
    organizationDesc: locale === "ar" ? "\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0644\u0639\u0645\u064A\u0644" : "Basic information about the client",
    nameEn: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 (\u0625\u0646\u062C\u0644\u064A\u0632\u064A)" : "Name (English)",
    nameAr: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 (\u0639\u0631\u0628\u064A)" : "Name (Arabic)",
    tradeNameEn: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u062A\u062C\u0627\u0631\u064A (\u0625\u0646\u062C\u0644\u064A\u0632\u064A)" : "Trade Name (English)",
    tradeNameAr: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u062A\u062C\u0627\u0631\u064A (\u0639\u0631\u0628\u064A)" : "Trade Name (Arabic)",
    type: locale === "ar" ? "\u0627\u0644\u0646\u0648\u0639" : "Type",
    selectType: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u0646\u0648\u0639" : "Select type",
    email: locale === "ar" ? "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" : "Email",
    phone: locale === "ar" ? "\u0627\u0644\u0647\u0627\u062A\u0641" : "Phone",
    website: locale === "ar" ? "\u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" : "Website",
    vatNumber: locale === "ar" ? "\u0631\u0642\u0645 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0636\u0631\u064A\u0628\u064A" : "VAT Registration Number",
    crNumber: locale === "ar" ? "\u0631\u0642\u0645 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u062A\u062C\u0627\u0631\u064A" : "Commercial Registration Number",
    clubDetails: locale === "ar" ? "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0646\u0627\u062F\u064A" : "Club Details",
    clubDesc: locale === "ar" ? "\u0627\u0644\u0646\u0627\u062F\u064A \u0627\u0644\u0623\u0648\u0644 \u0644\u0644\u0639\u0645\u064A\u0644" : "First club for the client",
    description: locale === "ar" ? "\u0627\u0644\u0648\u0635\u0641" : "Description",
    subdomain: locale === "ar" ? "\u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0641\u0631\u0639\u064A" : "Subdomain",
    subdomainHint: locale === "ar" ? "\u0627\u062A\u0631\u0643\u0647 \u0641\u0627\u0631\u063A\u0627\u064B \u0644\u0644\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0645\u0646 \u0627\u0633\u0645 \u0627\u0644\u0646\u0627\u062F\u064A" : "Leave empty to auto-generate from club name",
    subdomainPreview: locale === "ar" ? "\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0631\u0627\u0628\u0637" : "URL Preview",
    adminDetails: locale === "ar" ? "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0633\u0624\u0648\u0644" : "Admin User Details",
    adminDesc: locale === "ar" ? "\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0644\u0644\u0639\u0645\u064A\u0644" : "Primary admin account for the client",
    displayName: locale === "ar" ? "\u0627\u0633\u0645 \u0627\u0644\u0639\u0631\u0636" : "Display Name",
    password: locale === "ar" ? "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" : "Password",
    subscriptionDetails: locale === "ar" ? "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643" : "Subscription Details",
    subscriptionDesc: locale === "ar" ? "\u0627\u0634\u062A\u0631\u0627\u0643 \u0627\u0644\u0639\u0645\u064A\u0644 \u0641\u064A \u0627\u0644\u0645\u0646\u0635\u0629 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)" : "Client subscription to the platform (optional)",
    createSub: locale === "ar" ? "\u0625\u0646\u0634\u0627\u0621 \u0627\u0634\u062A\u0631\u0627\u0643" : "Create Subscription",
    plan: locale === "ar" ? "\u0627\u0644\u062E\u0637\u0629" : "Plan",
    selectPlan: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u062E\u0637\u0629" : "Select plan",
    agreedPrice: locale === "ar" ? "\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647" : "Agreed Price",
    billingCycle: locale === "ar" ? "\u062F\u0648\u0631\u0629 \u0627\u0644\u0641\u0648\u062A\u0631\u0629" : "Billing Cycle",
    contractMonths: locale === "ar" ? "\u0645\u062F\u0629 \u0627\u0644\u0639\u0642\u062F (\u0634\u0647\u0648\u0631)" : "Contract Months",
    trial: locale === "ar" ? "\u0628\u062F\u0621 \u0628\u0641\u062A\u0631\u0629 \u062A\u062C\u0631\u064A\u0628\u064A\u0629" : "Start with Trial",
    trialDays: locale === "ar" ? "\u0623\u064A\u0627\u0645 \u0627\u0644\u062A\u062C\u0631\u0628\u0629" : "Trial Days",
    discount: locale === "ar" ? "\u0646\u0633\u0628\u0629 \u0627\u0644\u062E\u0635\u0645 (%)" : "Discount (%)",
    submit: locale === "ar" ? "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0639\u0645\u064A\u0644" : "Create Client",
    submitting: locale === "ar" ? "\u062C\u0627\u0631\u064A \u0627\u0644\u0625\u0646\u0634\u0627\u0621..." : "Creating...",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.organization}</span>
          </TabsTrigger>
          <TabsTrigger value="club" className="gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.club}</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.admin}</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.subscription}</span>
          </TabsTrigger>
        </TabsList>

        {/* Organization Tab */}
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>{texts.organizationDetails}</CardTitle>
              <CardDescription>{texts.organizationDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationNameEn">{texts.nameEn} *</Label>
                  <Input id="organizationNameEn" {...register("organizationNameEn")} />
                  {errors.organizationNameEn && (
                    <p className="text-sm text-destructive">{errors.organizationNameEn.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationNameAr">{texts.nameAr}</Label>
                  <Input id="organizationNameAr" {...register("organizationNameAr")} dir="rtl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationTradeNameEn">{texts.tradeNameEn}</Label>
                  <Input id="organizationTradeNameEn" {...register("organizationTradeNameEn")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationTradeNameAr">{texts.tradeNameAr}</Label>
                  <Input id="organizationTradeNameAr" {...register("organizationTradeNameAr")} dir="rtl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{texts.type}</Label>
                <Select value={watchOrgType} onValueChange={(v) => setValue("organizationType", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={texts.selectType} />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {locale === "ar" ? type.labelAr : type.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationEmail">{texts.email}</Label>
                  <Input id="organizationEmail" type="email" {...register("organizationEmail")} />
                  {errors.organizationEmail && (
                    <p className="text-sm text-destructive">{errors.organizationEmail.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationPhone">{texts.phone}</Label>
                  <Input id="organizationPhone" type="tel" {...register("organizationPhone")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationWebsite">{texts.website}</Label>
                <Input id="organizationWebsite" type="url" placeholder="https://" {...register("organizationWebsite")} />
                {errors.organizationWebsite && (
                  <p className="text-sm text-destructive">{errors.organizationWebsite.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vatRegistrationNumber">{texts.vatNumber}</Label>
                  <Input id="vatRegistrationNumber" {...register("vatRegistrationNumber")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commercialRegistrationNumber">{texts.crNumber}</Label>
                  <Input id="commercialRegistrationNumber" {...register("commercialRegistrationNumber")} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Club Tab */}
        <TabsContent value="club">
          <Card>
            <CardHeader>
              <CardTitle>{texts.clubDetails}</CardTitle>
              <CardDescription>{texts.clubDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clubNameEn">{texts.nameEn} *</Label>
                  <Input id="clubNameEn" {...register("clubNameEn")} />
                  {errors.clubNameEn && (
                    <p className="text-sm text-destructive">{errors.clubNameEn.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clubNameAr">{texts.nameAr}</Label>
                  <Input id="clubNameAr" {...register("clubNameAr")} dir="rtl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clubDescriptionEn">{texts.description} (English)</Label>
                  <Textarea id="clubDescriptionEn" rows={4} {...register("clubDescriptionEn")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clubDescriptionAr">{texts.description} (Arabic)</Label>
                  <Textarea id="clubDescriptionAr" rows={4} {...register("clubDescriptionAr")} dir="rtl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clubSlug">{texts.subdomain}</Label>
                <div className="flex items-center gap-2">
                  <Input id="clubSlug" placeholder="fitness-gym" {...register("clubSlug")} className="flex-1" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">.liyaqa.com</span>
                </div>
                <p className="text-xs text-muted-foreground">{texts.subdomainHint}</p>
                {watchClubSlug && (
                  <p className="text-xs text-primary">
                    {texts.subdomainPreview}: https://{watchClubSlug}.liyaqa.com
                  </p>
                )}
                {errors.clubSlug && (
                  <p className="text-sm text-destructive">{errors.clubSlug.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tab */}
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>{texts.adminDetails}</CardTitle>
              <CardDescription>{texts.adminDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">{texts.email} *</Label>
                <Input id="adminEmail" type="email" {...register("adminEmail")} />
                {errors.adminEmail && (
                  <p className="text-sm text-destructive">{errors.adminEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">{texts.password} *</Label>
                <div className="relative">
                  <Input id="adminPassword" type={showPassword ? "text" : "password"} {...register("adminPassword")} />
                  <Button type="button" variant="ghost" size="icon" className="absolute end-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.adminPassword && (
                  <p className="text-sm text-destructive">{errors.adminPassword.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminDisplayNameEn">{texts.displayName} (English) *</Label>
                  <Input id="adminDisplayNameEn" {...register("adminDisplayNameEn")} />
                  {errors.adminDisplayNameEn && (
                    <p className="text-sm text-destructive">{errors.adminDisplayNameEn.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminDisplayNameAr">{texts.displayName} (Arabic)</Label>
                  <Input id="adminDisplayNameAr" {...register("adminDisplayNameAr")} dir="rtl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>{texts.subscriptionDetails}</CardTitle>
              <CardDescription>{texts.subscriptionDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">{texts.createSub}</Label>
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar" ? "\u0625\u0646\u0634\u0627\u0621 \u0627\u0634\u062A\u0631\u0627\u0643 \u0644\u0644\u0639\u0645\u064A\u0644 \u0641\u064A \u0627\u0644\u0645\u0646\u0635\u0629" : "Create a platform subscription for this client"}
                  </p>
                </div>
                <Switch checked={createSubscription} onCheckedChange={(checked) => setValue("createSubscription", checked)} />
              </div>

              {createSubscription && (
                <>
                  <div className="space-y-2">
                    <Label>{texts.plan} *</Label>
                    <Select value={watchClientPlanId} onValueChange={(v) => setValue("clientPlanId", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={texts.selectPlan} />
                      </SelectTrigger>
                      <SelectContent>
                        {activePlans?.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {getLocalizedText(plan.name, locale)} - {plan.monthlyPrice.amount} {plan.monthlyPrice.currency}/mo
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agreedPriceAmount">{texts.agreedPrice}</Label>
                      <Input id="agreedPriceAmount" type="number" min={0} step={0.01} {...register("agreedPriceAmount")} />
                    </div>
                    <div className="space-y-2">
                      <Label>{texts.billingCycle}</Label>
                      <Select value={watchBillingCycle} onValueChange={(v) => setValue("billingCycle", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BILLING_CYCLES.map((cycle) => (
                            <SelectItem key={cycle.value} value={cycle.value}>
                              {locale === "ar" ? cycle.labelAr : cycle.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contractMonths">{texts.contractMonths}</Label>
                      <Input id="contractMonths" type="number" min={1} {...register("contractMonths")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discountPercentage">{texts.discount}</Label>
                      <Input id="discountPercentage" type="number" min={0} max={100} {...register("discountPercentage")} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">{texts.trial}</Label>
                      <p className="text-sm text-muted-foreground">
                        {locale === "ar" ? "\u0628\u062F\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0628\u0641\u062A\u0631\u0629 \u062A\u062C\u0631\u064A\u0628\u064A\u0629 \u0645\u062C\u0627\u0646\u064A\u0629" : "Start subscription with a free trial period"}
                      </p>
                    </div>
                    <Switch checked={startWithTrial} onCheckedChange={(checked) => setValue("startWithTrial", checked)} />
                  </div>

                  {startWithTrial && (
                    <div className="space-y-2">
                      <Label htmlFor="trialDays">{texts.trialDays}</Label>
                      <Input id="trialDays" type="number" min={1} {...register("trialDays")} />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? texts.submitting : texts.submit}
        </Button>
      </div>
    </form>
  );
}

export type { OnboardingFormValues };
