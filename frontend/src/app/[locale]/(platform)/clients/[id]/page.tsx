"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Edit,
  CheckCircle,
  XCircle,
  Store,
  Mail,
  Phone,
  Globe,
  Calendar,
  FileText,
  CreditCard,
  Plus,
  Copy,
  ExternalLink,
  Activity,
  Ticket,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loading } from "@/components/ui/spinner";
import { ClientStatusBadge } from "@/components/platform/client-status-badge";
import { ClientHealthCard } from "@/components/platform/client-health-card";
import { ClientActivityTab } from "@/components/platform/client-activity-tab";
import { ClientSupportTab } from "@/components/platform/client-support-tab";
import { ClientNotesTab } from "@/components/platform/client-notes-tab";
import { useToast } from "@/hooks/use-toast";
import {
  usePlatformClient,
  useClientClubs,
  useActivateClient,
  useSuspendClient,
} from "@/queries/platform/use-platform-clients";
import { useSubscriptionsByOrganization } from "@/queries/platform/use-client-subscriptions";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate, getLocalizedText } from "@/lib/utils";
import type { OrganizationType } from "@/types/organization";

const ORG_TYPE_LABELS: Record<OrganizationType, { en: string; ar: string }> = {
  LLC: { en: "LLC", ar: "ذ.م.م" },
  SOLE_PROPRIETORSHIP: { en: "Sole Proprietorship", ar: "مؤسسة فردية" },
  PARTNERSHIP: { en: "Partnership", ar: "شراكة" },
  CORPORATION: { en: "Corporation", ar: "شركة مساهمة" },
  OTHER: { en: "Other", ar: "أخرى" },
};

export default function ClientDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const clientId = params.id as string;

  // Check if user can edit
  const canEdit = user?.role === "PLATFORM_ADMIN" || user?.role === "SALES_REP";

  // Fetch client data
  const { data: client, isLoading, error } = usePlatformClient(clientId);
  const { data: clubsData } = useClientClubs(clientId);
  const { data: subscriptionsData } = useSubscriptionsByOrganization(clientId);

  // Mutations
  const activateClient = useActivateClient();
  const suspendClient = useSuspendClient();

  const texts = {
    back: locale === "ar" ? "العودة للعملاء" : "Back to Clients",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    suspend: locale === "ar" ? "إيقاف" : "Suspend",
    overview: locale === "ar" ? "نظرة عامة" : "Overview",
    clubs: locale === "ar" ? "الأندية" : "Clubs",
    subscriptions: locale === "ar" ? "الاشتراكات" : "Subscriptions",
    activity: locale === "ar" ? "النشاط" : "Activity",
    support: locale === "ar" ? "الدعم" : "Support",
    notes: locale === "ar" ? "الملاحظات" : "Notes",
    invoices: locale === "ar" ? "الفواتير" : "Invoices",
    organizationInfo: locale === "ar" ? "معلومات المنظمة" : "Organization Info",
    contactInfo: locale === "ar" ? "معلومات الاتصال" : "Contact Information",
    registrationInfo: locale === "ar" ? "معلومات التسجيل" : "Registration Info",
    type: locale === "ar" ? "النوع" : "Type",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    website: locale === "ar" ? "الموقع الإلكتروني" : "Website",
    vatNumber: locale === "ar" ? "رقم السجل الضريبي" : "VAT Registration",
    crNumber: locale === "ar" ? "رقم السجل التجاري" : "Commercial Registration",
    createdAt: locale === "ar" ? "تاريخ الإنشاء" : "Created At",
    updatedAt: locale === "ar" ? "آخر تحديث" : "Last Updated",
    na: locale === "ar" ? "غير محدد" : "N/A",
    noClubs: locale === "ar" ? "لا توجد أندية" : "No clubs found",
    noSubscriptions: locale === "ar" ? "لا توجد اشتراكات" : "No subscriptions found",
    addClub: locale === "ar" ? "إضافة نادي" : "Add Club",
    addSubscription: locale === "ar" ? "إضافة اشتراك" : "Add Subscription",
    errorMsg: locale === "ar" ? "حدث خطأ أثناء تحميل العميل" : "Error loading client",
    notFound: locale === "ar" ? "العميل غير موجود" : "Client not found",
    activateConfirm:
      locale === "ar"
        ? "هل أنت متأكد من تفعيل هذا العميل؟"
        : "Are you sure you want to activate this client?",
    suspendConfirm:
      locale === "ar"
        ? "هل أنت متأكد من إيقاف هذا العميل؟"
        : "Are you sure you want to suspend this client?",
    successTitle: locale === "ar" ? "تم بنجاح" : "Success",
    activatedDesc: locale === "ar" ? "تم تفعيل العميل" : "Client activated successfully",
    suspendedDesc: locale === "ar" ? "تم إيقاف العميل" : "Client suspended successfully",
    status: locale === "ar" ? "الحالة" : "Status",
    startDate: locale === "ar" ? "تاريخ البدء" : "Start Date",
    endDate: locale === "ar" ? "تاريخ الانتهاء" : "End Date",
    price: locale === "ar" ? "السعر" : "Price",
    tenantId: locale === "ar" ? "معرف المستأجر" : "Tenant ID",
    subdomainUrl: locale === "ar" ? "رابط النطاق الفرعي" : "Subdomain URL",
    copySuccess: locale === "ar" ? "تم النسخ" : "Copied",
  };

  // Get dynamic base domain from current location
  const getBaseDomain = () => {
    if (typeof window === "undefined") return "liyaqa.com";
    const { hostname, port } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "liyaqa.local";
    }
    const parts = hostname.split(".");
    return parts.length > 2 ? parts.slice(-2).join(".") : hostname + (port && port !== "80" && port !== "443" ? `:${port}` : "");
  };

  const getSubdomainUrl = (slug: string) => {
    if (typeof window === "undefined") return `https://${slug}.liyaqa.com`;
    const { protocol, hostname, port } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${slug}.liyaqa.local:3000`;
    }
    const baseDomain = getBaseDomain();
    const portPart = port && port !== "80" && port !== "443" ? `:${port}` : "";
    return `${protocol}//${slug}.${baseDomain}${portPart}`;
  };

  // Copy text to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: texts.copySuccess,
        description: text.length > 30 ? `${text.substring(0, 30)}...` : text,
      });
    } catch {
      // Silently fail
    }
  };

  const handleActivate = () => {
    if (confirm(texts.activateConfirm)) {
      activateClient.mutate(clientId, {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.activatedDesc,
          });
        },
      });
    }
  };

  const handleSuspend = () => {
    if (confirm(texts.suspendConfirm)) {
      suspendClient.mutate(clientId, {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.suspendedDesc,
          });
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !client) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.errorMsg : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  const canActivate = client.status === "PENDING" || client.status === "SUSPENDED";
  const canSuspend = client.status === "ACTIVE";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/clients`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {getLocalizedText(client.name, locale)}
                </h1>
                <ClientStatusBadge status={client.status} />
              </div>
              {client.tradeName && (
                <p className="text-muted-foreground">
                  {getLocalizedText(client.tradeName, locale)}
                </p>
              )}
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            {canActivate && (
              <Button
                variant="outline"
                onClick={handleActivate}
                disabled={activateClient.isPending}
              >
                <CheckCircle className="me-2 h-4 w-4" />
                {texts.activate}
              </Button>
            )}
            {canSuspend && (
              <Button
                variant="outline"
                onClick={handleSuspend}
                disabled={suspendClient.isPending}
                className="text-destructive border-destructive hover:bg-destructive/10"
              >
                <XCircle className="me-2 h-4 w-4" />
                {texts.suspend}
              </Button>
            )}
            <Button asChild>
              <Link href={`/${locale}/clients/${clientId}/edit`}>
                <Edit className="me-2 h-4 w-4" />
                {texts.edit}
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Health Card */}
      <ClientHealthCard clientId={clientId} />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">{texts.overview}</TabsTrigger>
          <TabsTrigger value="clubs">{texts.clubs}</TabsTrigger>
          <TabsTrigger value="subscriptions">{texts.subscriptions}</TabsTrigger>
          <TabsTrigger value="activity" className="text-indigo-600">
            <Activity className="me-1 h-4 w-4" />
            {texts.activity}
          </TabsTrigger>
          <TabsTrigger value="support" className="text-rose-600">
            <Ticket className="me-1 h-4 w-4" />
            {texts.support}
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-teal-600">
            <StickyNote className="me-1 h-4 w-4" />
            {texts.notes}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Organization Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {texts.organizationInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{texts.type}</span>
                  <span className="font-medium">
                    {locale === "ar"
                      ? ORG_TYPE_LABELS[client.organizationType]?.ar || texts.na
                      : ORG_TYPE_LABELS[client.organizationType]?.en || texts.na}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{texts.createdAt}</span>
                  <span className="font-medium">
                    {formatDate(client.createdAt, locale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{texts.updatedAt}</span>
                  <span className="font-medium">
                    {formatDate(client.updatedAt, locale)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {texts.contactInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email || texts.na}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone || texts.na}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {client.website ? (
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {client.website}
                    </a>
                  ) : (
                    <span>{texts.na}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Registration Info */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {texts.registrationInfo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">{texts.vatNumber}</span>
                    <span className="font-medium font-mono">
                      {client.vatRegistrationNumber || texts.na}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">{texts.crNumber}</span>
                    <span className="font-medium font-mono">
                      {client.commercialRegistrationNumber || texts.na}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clubs Tab */}
        <TabsContent value="clubs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{texts.clubs}</h3>
            {canEdit && (
              <Button size="sm">
                <Plus className="me-2 h-4 w-4" />
                {texts.addClub}
              </Button>
            )}
          </div>

          {clubsData?.content && clubsData.content.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clubsData.content.map((club) => (
                <Card
                  key={club.id}
                  className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer"
                  onClick={() => router.push(`/${locale}/view-clubs/${club.id}?clientId=${clientId}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {getLocalizedText(club.name, locale)}
                        </CardTitle>
                        <CardDescription>
                          <ClientStatusBadge status={club.status} />
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {club.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {getLocalizedText(club.description, locale)}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(club.createdAt, locale)}
                    </div>

                    {/* Tenant ID & Subdomain URL */}
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {/* Tenant ID */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{texts.tenantId}:</span>
                        <div className="flex items-center gap-1">
                          <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono">
                            {club.id.substring(0, 8)}...
                          </code>
                          <button
                            type="button"
                            className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                            onClick={(e) => { e.stopPropagation(); handleCopy(club.id); }}
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Subdomain URL */}
                      {club.slug && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{texts.subdomainUrl}:</span>
                          <div className="flex items-center gap-1">
                            <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                              {club.slug}.{getBaseDomain()}
                            </code>
                            <button
                              type="button"
                              className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                              onClick={(e) => { e.stopPropagation(); handleCopy(getSubdomainUrl(club.slug!)); }}
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                              onClick={(e) => { e.stopPropagation(); window.open(getSubdomainUrl(club.slug!), '_blank'); }}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                {texts.noClubs}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{texts.subscriptions}</h3>
            {canEdit && (
              <Button size="sm" asChild>
                <Link href={`/${locale}/client-subscriptions/new?organizationId=${clientId}`}>
                  <Plus className="me-2 h-4 w-4" />
                  {texts.addSubscription}
                </Link>
              </Button>
            )}
          </div>

          {subscriptionsData?.content && subscriptionsData.content.length > 0 ? (
            <div className="space-y-4">
              {subscriptionsData.content.map((sub) => (
                <Card key={sub.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {sub.agreedPrice.amount} {sub.agreedPrice.currency}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                sub.status === "ACTIVE"
                                  ? "bg-green-100 text-green-700"
                                  : sub.status === "TRIAL"
                                  ? "bg-blue-100 text-blue-700"
                                  : sub.status === "SUSPENDED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(sub.startDate, locale)} - {formatDate(sub.endDate, locale)}
                          </p>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className="text-sm text-muted-foreground">
                          {sub.remainingDays} {locale === "ar" ? "يوم متبقي" : "days remaining"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                {texts.noSubscriptions}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <ClientActivityTab organizationId={clientId} />
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support">
          <ClientSupportTab organizationId={clientId} />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <ClientNotesTab organizationId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
