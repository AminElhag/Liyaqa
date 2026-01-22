"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  Pencil,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building,
  Plus,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useOrganization } from "@/queries/use-organizations";
import { useOrganizationClubs } from "@/queries/use-clubs";
import { formatDate, getLocalizedText } from "@/lib/utils";
import type { OrganizationStatus, ClubStatus } from "@/types/organization";

interface OrganizationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrganizationDetailPage({
  params,
}: OrganizationDetailPageProps) {
  const { id } = use(params);
  const locale = useLocale();

  const { data: organization, isLoading, error } = useOrganization(id);
  const { data: clubs, isLoading: clubsLoading } = useOrganizationClubs(id);

  const getStatusBadge = (status: OrganizationStatus | ClubStatus) => {
    const statusConfig: Record<
      string,
      { variant: "success" | "warning" | "destructive" | "secondary"; labelEn: string; labelAr: string }
    > = {
      PENDING: { variant: "secondary", labelEn: "Pending", labelAr: "قيد الانتظار" },
      ACTIVE: { variant: "success", labelEn: "Active", labelAr: "نشط" },
      SUSPENDED: { variant: "warning", labelEn: "Suspended", labelAr: "موقوف" },
      CLOSED: { variant: "destructive", labelEn: "Closed", labelAr: "مغلق" },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant}>
        {locale === "ar" ? config.labelAr : config.labelEn}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/organizations`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمنظمات" : "Back to organizations"}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>
              {locale === "ar"
                ? "لم يتم العثور على المنظمة"
                : "Organization not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/organizations`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمنظمات" : "Back to organizations"}
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
              <Building2 className="h-6 w-6" />
              {getLocalizedText(organization.name, locale)}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(organization.status)}
              <span className="text-sm text-neutral-500">
                {locale === "ar" ? "أُنشئت:" : "Created:"}{" "}
                {formatDate(organization.createdAt, locale)}
              </span>
            </div>
          </div>
          <Button asChild>
            <Link href={`/${locale}/organizations/${id}/edit`}>
              <Pencil className="h-4 w-4 me-2" />
              {locale === "ar" ? "تعديل" : "Edit"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "المعلومات الأساسية" : "Basic Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-sm text-neutral-500">
                  {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                </p>
                <p className="font-medium">{organization.email}</p>
              </div>
            </div>
            {organization.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-500">
                    {locale === "ar" ? "الهاتف" : "Phone"}
                  </p>
                  <p className="font-medium">{organization.phone}</p>
                </div>
              </div>
            )}
            {organization.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-500">
                    {locale === "ar" ? "الموقع الإلكتروني" : "Website"}
                  </p>
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {organization.website}
                  </a>
                </div>
              </div>
            )}
            {organization.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-500">
                    {locale === "ar" ? "العنوان" : "Address"}
                  </p>
                  <p className="font-medium">
                    {getLocalizedText(organization.address, locale)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {(organization.zatcaSellerName || organization.zatcaVatNumber) && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">
                  {locale === "ar" ? "معلومات الفوترة الإلكترونية" : "E-Invoicing (ZATCA)"}
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {organization.zatcaSellerName && (
                    <div>
                      <p className="text-sm text-neutral-500">
                        {locale === "ar" ? "اسم البائع" : "Seller Name"}
                      </p>
                      <p className="font-medium">{organization.zatcaSellerName}</p>
                    </div>
                  )}
                  {organization.zatcaVatNumber && (
                    <div>
                      <p className="text-sm text-neutral-500">
                        {locale === "ar" ? "رقم ضريبة القيمة المضافة" : "VAT Number"}
                      </p>
                      <p className="font-medium font-mono">
                        {organization.zatcaVatNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Clubs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {locale === "ar" ? "الأندية" : "Clubs"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? `${clubs?.totalElements || 0} نادي`
                  : `${clubs?.totalElements || 0} club(s)`}
              </CardDescription>
            </div>
            <Button size="sm" asChild>
              <Link href={`/${locale}/clubs/new?organizationId=${id}`}>
                <Plus className="h-4 w-4 me-2" />
                {locale === "ar" ? "إضافة نادي" : "Add Club"}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {clubsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : clubs?.content.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <Building className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
              <p>
                {locale === "ar"
                  ? "لا توجد أندية لهذه المنظمة"
                  : "No clubs for this organization"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clubs?.content.map((club) => (
                <Link
                  key={club.id}
                  href={`/${locale}/clubs/${club.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-neutral-50"
                >
                  <div>
                    <p className="font-medium">
                      {getLocalizedText(club.name, locale)}
                    </p>
                    <p className="text-sm text-neutral-500">{club.email}</p>
                  </div>
                  {getStatusBadge(club.status)}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
