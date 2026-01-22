"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
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
import { useActiveClientPlans } from "@/queries/platform/use-client-plans";
import { getLocalizedText } from "@/lib/utils";
import type { OrganizationType } from "@/types/organization";
import type { BillingCycle } from "@/types/platform/client-plan";

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
  { value: "LLC", labelEn: "LLC", labelAr: "ذ.م.م" },
  { value: "SOLE_PROPRIETORSHIP", labelEn: "Sole Proprietorship", labelAr: "مؤسسة فردية" },
  { value: "PARTNERSHIP", labelEn: "Partnership", labelAr: "شراكة" },
  { value: "CORPORATION", labelEn: "Corporation", labelAr: "شركة مساهمة" },
  { value: "OTHER", labelEn: "Other", labelAr: "أخرى" },
];

const BILLING_CYCLES: { value: BillingCycle; labelEn: string; labelAr: string }[] = [
  { value: "MONTHLY", labelEn: "Monthly", labelAr: "شهري" },
  { value: "QUARTERLY", labelEn: "Quarterly", labelAr: "ربع سنوي" },
  { value: "ANNUAL", labelEn: "Annual", labelAr: "سنوي" },
];

export function ClientOnboardingForm({ onSubmit, isLoading }: ClientOnboardingFormProps) {
  const locale = useLocale();
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
    resolver: zodResolver(onboardingSchema),
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
    organization: locale === "ar" ? "المنظمة" : "Organization",
    club: locale === "ar" ? "النادي" : "Club",
    admin: locale === "ar" ? "المسؤول" : "Admin User",
    subscription: locale === "ar" ? "الاشتراك" : "Subscription",
    organizationDetails: locale === "ar" ? "تفاصيل المنظمة" : "Organization Details",
    organizationDesc:
      locale === "ar"
        ? "المعلومات الأساسية للعميل"
        : "Basic information about the client",
    nameEn: locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)",
    nameAr: locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)",
    tradeNameEn: locale === "ar" ? "الاسم التجاري (إنجليزي)" : "Trade Name (English)",
    tradeNameAr: locale === "ar" ? "الاسم التجاري (عربي)" : "Trade Name (Arabic)",
    type: locale === "ar" ? "النوع" : "Type",
    selectType: locale === "ar" ? "اختر النوع" : "Select type",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    website: locale === "ar" ? "الموقع الإلكتروني" : "Website",
    vatNumber: locale === "ar" ? "رقم السجل الضريبي" : "VAT Registration Number",
    crNumber: locale === "ar" ? "رقم السجل التجاري" : "Commercial Registration Number",
    clubDetails: locale === "ar" ? "تفاصيل النادي" : "Club Details",
    clubDesc: locale === "ar" ? "النادي الأول للعميل" : "First club for the client",
    description: locale === "ar" ? "الوصف" : "Description",
    subdomain: locale === "ar" ? "النطاق الفرعي" : "Subdomain",
    subdomainHint:
      locale === "ar"
        ? "اتركه فارغاً للإنشاء التلقائي من اسم النادي"
        : "Leave empty to auto-generate from club name",
    subdomainPreview: locale === "ar" ? "معاينة الرابط" : "URL Preview",
    adminDetails: locale === "ar" ? "بيانات المسؤول" : "Admin User Details",
    adminDesc:
      locale === "ar"
        ? "حساب المسؤول الرئيسي للعميل"
        : "Primary admin account for the client",
    displayName: locale === "ar" ? "اسم العرض" : "Display Name",
    password: locale === "ar" ? "كلمة المرور" : "Password",
    subscriptionDetails: locale === "ar" ? "تفاصيل الاشتراك" : "Subscription Details",
    subscriptionDesc:
      locale === "ar"
        ? "اشتراك العميل في المنصة (اختياري)"
        : "Client subscription to the platform (optional)",
    createSub: locale === "ar" ? "إنشاء اشتراك" : "Create Subscription",
    plan: locale === "ar" ? "الخطة" : "Plan",
    selectPlan: locale === "ar" ? "اختر الخطة" : "Select plan",
    agreedPrice: locale === "ar" ? "السعر المتفق عليه" : "Agreed Price",
    billingCycle: locale === "ar" ? "دورة الفوترة" : "Billing Cycle",
    contractMonths: locale === "ar" ? "مدة العقد (شهور)" : "Contract Months",
    trial: locale === "ar" ? "بدء بفترة تجريبية" : "Start with Trial",
    trialDays: locale === "ar" ? "أيام التجربة" : "Trial Days",
    discount: locale === "ar" ? "نسبة الخصم (%)" : "Discount (%)",
    submit: locale === "ar" ? "إنشاء العميل" : "Create Client",
    submitting: locale === "ar" ? "جاري الإنشاء..." : "Creating...",
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
                  <Input
                    id="clubSlug"
                    placeholder="fitness-gym"
                    {...register("clubSlug")}
                    className="flex-1"
                  />
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
                  <Input
                    id="adminPassword"
                    type={showPassword ? "text" : "password"}
                    {...register("adminPassword")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute end-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
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
                    {locale === "ar"
                      ? "إنشاء اشتراك للعميل في المنصة"
                      : "Create a platform subscription for this client"}
                  </p>
                </div>
                <Switch
                  checked={createSubscription}
                  onCheckedChange={(checked) => setValue("createSubscription", checked)}
                />
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
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
                        {locale === "ar"
                          ? "بدء الاشتراك بفترة تجريبية مجانية"
                          : "Start subscription with a free trial period"}
                      </p>
                    </div>
                    <Switch
                      checked={startWithTrial}
                      onCheckedChange={(checked) => setValue("startWithTrial", checked)}
                    />
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
