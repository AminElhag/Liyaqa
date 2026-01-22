"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  ArrowRight,
  XCircle,
  RotateCcw,
  Building2,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Percent,
  User,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/spinner";
import { DealStatusBadge } from "@/components/platform/deal-status-badge";
import { LoseDealDialog } from "@/components/platform/lose-deal-dialog";
import {
  useDeal,
  useAdvanceDeal,
  useQualifyDeal,
  useSendProposal,
  useStartNegotiation,
  useLoseDeal,
  useReopenDeal,
  useDeleteDeal,
} from "@/queries/platform/use-deals";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency, formatDate, getLocalizedText } from "@/lib/utils";
import type { LoseDealRequest } from "@/types/platform";

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();

  const canEdit = user?.role === "PLATFORM_ADMIN" || user?.role === "SALES_REP";

  const [loseDealDialogOpen, setLoseDealDialogOpen] = useState(false);

  const { data: deal, isLoading, error } = useDeal(dealId);

  // Mutations
  const advanceDeal = useAdvanceDeal();
  const qualifyDeal = useQualifyDeal();
  const sendProposal = useSendProposal();
  const startNegotiation = useStartNegotiation();
  const loseDeal = useLoseDeal();
  const reopenDeal = useReopenDeal();
  const deleteDeal = useDeleteDeal();

  const texts = {
    back: locale === "ar" ? "العودة إلى الصفقات" : "Back to Deals",
    edit: locale === "ar" ? "تعديل" : "Edit",
    delete: locale === "ar" ? "حذف" : "Delete",
    advance: locale === "ar" ? "تقدم للمرحلة التالية" : "Advance to Next Stage",
    qualify: locale === "ar" ? "تأهيل" : "Qualify",
    sendProposal: locale === "ar" ? "إرسال عرض" : "Send Proposal",
    startNegotiation: locale === "ar" ? "بدء التفاوض" : "Start Negotiation",
    convert: locale === "ar" ? "تحويل إلى عميل" : "Convert to Client",
    lose: locale === "ar" ? "تسجيل خسارة" : "Mark as Lost",
    reopen: locale === "ar" ? "إعادة فتح" : "Reopen",
    contactInfo: locale === "ar" ? "معلومات الاتصال" : "Contact Information",
    dealDetails: locale === "ar" ? "تفاصيل الصفقة" : "Deal Details",
    notes: locale === "ar" ? "ملاحظات" : "Notes",
    lostReason: locale === "ar" ? "سبب الخسارة" : "Lost Reason",
    conversion: locale === "ar" ? "التحويل" : "Conversion",
    viewClient: locale === "ar" ? "عرض العميل" : "View Client",
    contactName: locale === "ar" ? "اسم جهة الاتصال" : "Contact Name",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    company: locale === "ar" ? "الشركة" : "Company",
    source: locale === "ar" ? "المصدر" : "Source",
    value: locale === "ar" ? "القيمة المقدرة" : "Estimated Value",
    weightedValue: locale === "ar" ? "القيمة المرجحة" : "Weighted Value",
    probability: locale === "ar" ? "الاحتمالية" : "Probability",
    expectedClose: locale === "ar" ? "تاريخ الإغلاق المتوقع" : "Expected Close",
    actualClose: locale === "ar" ? "تاريخ الإغلاق الفعلي" : "Actual Close",
    salesRep: locale === "ar" ? "مندوب المبيعات" : "Sales Rep",
    createdAt: locale === "ar" ? "تاريخ الإنشاء" : "Created",
    updatedAt: locale === "ar" ? "آخر تحديث" : "Last Updated",
    overdue: locale === "ar" ? "متأخر" : "Overdue",
    daysToClose: locale === "ar" ? "أيام للإغلاق" : "Days to Close",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل الصفقة" : "Error loading deal",
    notFound: locale === "ar" ? "الصفقة غير موجودة" : "Deal not found",
    deleteConfirm:
      locale === "ar"
        ? "هل أنت متأكد من حذف هذه الصفقة؟"
        : "Are you sure you want to delete this deal?",
    na: locale === "ar" ? "غير محدد" : "N/A",
  };

  const SOURCE_LABELS: Record<string, { en: string; ar: string }> = {
    WEBSITE: { en: "Website", ar: "الموقع" },
    REFERRAL: { en: "Referral", ar: "إحالة" },
    COLD_CALL: { en: "Cold Call", ar: "اتصال بارد" },
    MARKETING_CAMPAIGN: { en: "Marketing Campaign", ar: "حملة تسويقية" },
    EVENT: { en: "Event", ar: "حدث" },
    PARTNER: { en: "Partner", ar: "شريك" },
    OTHER: { en: "Other", ar: "أخرى" },
  };

  const handleDelete = () => {
    if (confirm(texts.deleteConfirm)) {
      deleteDeal.mutate(dealId, {
        onSuccess: () => {
          router.push(`/${locale}/deals`);
        },
      });
    }
  };

  const handleLoseConfirm = (data: LoseDealRequest) => {
    loseDeal.mutate(
      { id: dealId, data },
      {
        onSuccess: () => {
          setLoseDealDialogOpen(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.error : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  const isOpen = deal.isOpen;
  const canDelete = deal.status === "LEAD" || deal.status === "LOST";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/deals`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {getLocalizedText(deal.title, locale)}
              </h1>
              <DealStatusBadge status={deal.status} />
              {deal.isOverdue && (
                <Badge variant="destructive">{texts.overdue}</Badge>
              )}
            </div>
            {deal.companyName && (
              <p className="text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {deal.companyName}
              </p>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            {isOpen && (
              <Button variant="outline" asChild>
                <Link href={`/${locale}/deals/${dealId}/edit`}>
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </Link>
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="me-2 h-4 w-4" />
                {texts.delete}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {canEdit && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-2">
              {deal.status === "LEAD" && (
                <Button onClick={() => qualifyDeal.mutate(dealId)}>
                  <ArrowRight className="me-2 h-4 w-4" />
                  {texts.qualify}
                </Button>
              )}
              {deal.status === "QUALIFIED" && (
                <Button onClick={() => sendProposal.mutate(dealId)}>
                  <ArrowRight className="me-2 h-4 w-4" />
                  {texts.sendProposal}
                </Button>
              )}
              {deal.status === "PROPOSAL" && (
                <Button onClick={() => startNegotiation.mutate(dealId)}>
                  <ArrowRight className="me-2 h-4 w-4" />
                  {texts.startNegotiation}
                </Button>
              )}
              {deal.status === "NEGOTIATION" && (
                <Button asChild>
                  <Link href={`/${locale}/deals/${dealId}/convert`}>
                    <ArrowRight className="me-2 h-4 w-4" />
                    {texts.convert}
                  </Link>
                </Button>
              )}
              {isOpen && (
                <Button
                  variant="destructive"
                  onClick={() => setLoseDealDialogOpen(true)}
                >
                  <XCircle className="me-2 h-4 w-4" />
                  {texts.lose}
                </Button>
              )}
              {deal.status === "LOST" && (
                <Button onClick={() => reopenDeal.mutate(dealId)}>
                  <RotateCcw className="me-2 h-4 w-4" />
                  {texts.reopen}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.contactInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{texts.contactName}</p>
                <p className="font-medium">{deal.contactName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{texts.email}</p>
                <a
                  href={`mailto:${deal.contactEmail}`}
                  className="font-medium text-primary hover:underline"
                >
                  {deal.contactEmail}
                </a>
              </div>
            </div>
            {deal.contactPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.phone}</p>
                  <p className="font-medium">{deal.contactPhone}</p>
                </div>
              </div>
            )}
            {deal.companyName && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.company}</p>
                  <p className="font-medium">{deal.companyName}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deal Details */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.dealDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{texts.source}</p>
                <p className="font-medium">
                  {locale === "ar"
                    ? SOURCE_LABELS[deal.source].ar
                    : SOURCE_LABELS[deal.source].en}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{texts.value}</p>
                <p className="font-medium">
                  {formatCurrency(
                    deal.estimatedValue.amount,
                    deal.estimatedValue.currency,
                    locale
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{texts.weightedValue}</p>
                <p className="font-medium">
                  {formatCurrency(
                    deal.weightedValue.amount,
                    deal.weightedValue.currency,
                    locale
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{texts.probability}</p>
                <p className="font-medium">{deal.probability}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{texts.expectedClose}</p>
                <p className="font-medium">
                  {deal.expectedCloseDate
                    ? formatDate(deal.expectedCloseDate, locale)
                    : texts.na}
                  {deal.daysToClose !== undefined && deal.daysToClose !== null && (
                    <span className="text-muted-foreground text-sm ms-2">
                      ({deal.daysToClose} {texts.daysToClose})
                    </span>
                  )}
                </p>
              </div>
            </div>
            {deal.actualCloseDate && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{texts.actualClose}</p>
                  <p className="font-medium">
                    {formatDate(deal.actualCloseDate, locale)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {deal.notes && (deal.notes.en || deal.notes.ar) && (
          <Card>
            <CardHeader>
              <CardTitle>{texts.notes}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">
                {getLocalizedText(deal.notes, locale)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lost Reason */}
        {deal.status === "LOST" && deal.lostReason && (
          <Card>
            <CardHeader>
              <CardTitle>{texts.lostReason}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">
                {getLocalizedText(deal.lostReason, locale)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Conversion Info */}
        {deal.status === "WON" && deal.convertedOrganizationId && (
          <Card>
            <CardHeader>
              <CardTitle>{texts.conversion}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href={`/${locale}/clients/${deal.convertedOrganizationId}`}>
                  <ExternalLink className="me-2 h-4 w-4" />
                  {texts.viewClient}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Timestamps */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">{texts.createdAt}:</span>{" "}
              {formatDate(deal.createdAt, locale)}
            </div>
            <div>
              <span className="font-medium">{texts.updatedAt}:</span>{" "}
              {formatDate(deal.updatedAt, locale)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lose Deal Dialog */}
      <LoseDealDialog
        deal={deal ? { ...deal, title: deal.title } : null}
        open={loseDealDialogOpen}
        onOpenChange={setLoseDealDialogOpen}
        onConfirm={handleLoseConfirm}
        isLoading={loseDeal.isPending}
      />
    </div>
  );
}
