"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  Snowflake,
  Edit,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  FileCheck,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalizedText } from "@/components/ui/localized-text";
import {
  useFreezePackage,
  useActivateFreezePackage,
  useDeactivateFreezePackage,
} from "@/queries/use-freeze-packages";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { Money } from "@/types/api";

function formatCurrency(money: Money, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(money.amount);
}

export default function FreezePackageDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const { data: pkg, isLoading, error, refetch } = useFreezePackage(id);

  const activatePackage = useActivateFreezePackage();
  const deactivatePackage = useDeactivateFreezePackage();

  const texts = {
    back: locale === "ar" ? "العودة للباقات" : "Back to Packages",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    deactivate: locale === "ar" ? "إيقاف" : "Deactivate",
    active: locale === "ar" ? "نشط" : "Active",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
    packageDetails: locale === "ar" ? "تفاصيل الباقة" : "Package Details",
    pricing: locale === "ar" ? "التسعير" : "Pricing",
    settings: locale === "ar" ? "الإعدادات" : "Settings",
    freezeDays: locale === "ar" ? "أيام التجميد" : "Freeze Days",
    price: locale === "ar" ? "السعر" : "Price",
    pricePerDay: locale === "ar" ? "السعر لكل يوم" : "Price per Day",
    extendsContract: locale === "ar" ? "تمديد العقد" : "Extends Contract",
    requiresDocs: locale === "ar" ? "يتطلب مستندات" : "Requires Documentation",
    sortOrder: locale === "ar" ? "ترتيب العرض" : "Display Order",
    createdAt: locale === "ar" ? "تاريخ الإنشاء" : "Created At",
    updatedAt: locale === "ar" ? "آخر تحديث" : "Last Updated",
    days: locale === "ar" ? "يوم" : "days",
    yes: locale === "ar" ? "نعم" : "Yes",
    no: locale === "ar" ? "لا" : "No",
    loadError: locale === "ar" ? "فشل في تحميل الباقة" : "Failed to load package",
    activated: locale === "ar" ? "تم التفعيل" : "Activated",
    activatedDesc: locale === "ar" ? "تم تفعيل الباقة بنجاح" : "Package activated successfully",
    deactivated: locale === "ar" ? "تم الإيقاف" : "Deactivated",
    deactivatedDesc: locale === "ar" ? "تم إيقاف الباقة بنجاح" : "Package deactivated successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    activateError: locale === "ar" ? "فشل في تفعيل الباقة" : "Failed to activate package",
    deactivateError: locale === "ar" ? "فشل في إيقاف الباقة" : "Failed to deactivate package",
  };

  const handleActivate = async () => {
    try {
      await activatePackage.mutateAsync(id);
      toast({
        title: texts.activated,
        description: texts.activatedDesc,
      });
      refetch();
    } catch {
      toast({
        title: texts.errorTitle,
        description: texts.activateError,
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivatePackage.mutateAsync(id);
      toast({
        title: texts.deactivated,
        description: texts.deactivatedDesc,
      });
      refetch();
    } catch {
      toast({
        title: texts.errorTitle,
        description: texts.deactivateError,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/freeze-packages`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {texts.loadError}
          </CardContent>
        </Card>
      </div>
    );
  }

  const pricePerDay = pkg.freezeDays > 0 ? pkg.price.amount / pkg.freezeDays : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/freeze-packages`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Snowflake className="h-6 w-6 text-blue-500" />
              <LocalizedText text={pkg.name} />
            </h1>
            <Badge
              variant={pkg.isActive ? "default" : "secondary"}
              className={pkg.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
            >
              {pkg.isActive ? texts.active : texts.inactive}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {pkg.isActive ? (
            <Button
              variant="outline"
              onClick={handleDeactivate}
              disabled={deactivatePackage.isPending}
            >
              <XCircle className="me-2 h-4 w-4" />
              {texts.deactivate}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleActivate}
              disabled={activatePackage.isPending}
            >
              <CheckCircle className="me-2 h-4 w-4" />
              {texts.activate}
            </Button>
          )}
          <Button asChild>
            <Link href={`/${locale}/freeze-packages/${id}/edit`}>
              <Edit className="me-2 h-4 w-4" />
              {texts.edit}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Package Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-blue-500" />
              {texts.packageDetails}
            </CardTitle>
            {pkg.description && (
              <CardDescription>
                <LocalizedText text={pkg.description} />
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="text-muted-foreground">{texts.freezeDays}</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {pkg.freezeDays} {texts.days}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              {texts.pricing}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-muted-foreground">{texts.price}</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(pkg.price, locale)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-muted-foreground">{texts.pricePerDay}</span>
              <span className="font-semibold">
                {formatCurrency({ amount: pricePerDay, currency: pkg.price.currency }, locale)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{texts.settings}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <CalendarPlus className={`h-5 w-5 ${pkg.extendsContract ? "text-green-500" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium">{texts.extendsContract}</p>
                  <p className="text-sm text-muted-foreground">
                    {pkg.extendsContract ? texts.yes : texts.no}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <FileCheck className={`h-5 w-5 ${pkg.requiresDocumentation ? "text-amber-500" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium">{texts.requiresDocs}</p>
                  <p className="text-sm text-muted-foreground">
                    {pkg.requiresDocumentation ? texts.yes : texts.no}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <span className="h-5 w-5 flex items-center justify-center text-muted-foreground font-bold">
                  #
                </span>
                <div>
                  <p className="font-medium">{texts.sortOrder}</p>
                  <p className="text-sm text-muted-foreground">{pkg.sortOrder}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card className="md:col-span-2">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">{texts.createdAt}: </span>
                {formatDate(pkg.createdAt, locale)}
              </div>
              <div>
                <span className="font-medium">{texts.updatedAt}: </span>
                {formatDate(pkg.updatedAt, locale)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
