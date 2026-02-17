"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useTenantById,
  useUpdateTenant,
} from "@liyaqa/shared/queries/platform/use-tenants";

export default function EditTenantPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const tenantId = params.id as string;

  // Form state — aligned with backend UpdateTenantRequest
  const [facilityName, setFacilityName] = useState("");
  const [facilityNameAr, setFacilityNameAr] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");

  // Fetch tenant data
  const { data: tenant, isLoading, error } = useTenantById(tenantId);

  // Update mutation
  const updateTenant = useUpdateTenant();

  // Populate form when data loads
  useEffect(() => {
    if (tenant) {
      setFacilityName(tenant.facilityName || "");
      setFacilityNameAr(tenant.facilityNameAr || "");
      setSubdomain(tenant.subdomain || "");
      setContactEmail(tenant.contactEmail || "");
      setContactPhone(tenant.contactPhone || "");
      setCrNumber(tenant.crNumber || "");
      setVatNumber(tenant.vatNumber || "");
      setAddress(tenant.address || "");
      setCity(tenant.city || "");
      setRegion(tenant.region || "");
    }
  }, [tenant]);

  const texts = {
    title: locale === "ar" ? "تعديل المستأجر" : "Edit Tenant",
    back: locale === "ar" ? "العودة للمستأجر" : "Back to Tenant",
    facilityName: locale === "ar" ? "اسم المنشأة (إنجليزي)" : "Facility Name (English)",
    facilityNameAr: locale === "ar" ? "اسم المنشأة (عربي)" : "Facility Name (Arabic)",
    subdomain: locale === "ar" ? "النطاق الفرعي" : "Subdomain",
    contactInfo: locale === "ar" ? "معلومات الاتصال" : "Contact Information",
    contactEmail: locale === "ar" ? "البريد الإلكتروني للتواصل" : "Contact Email",
    contactPhone: locale === "ar" ? "رقم الهاتف" : "Contact Phone",
    businessDetails: locale === "ar" ? "تفاصيل العمل" : "Business Details",
    crNumber: locale === "ar" ? "رقم السجل التجاري" : "CR Number",
    vatNumber: locale === "ar" ? "الرقم الضريبي" : "VAT Number",
    address: locale === "ar" ? "العنوان" : "Address",
    city: locale === "ar" ? "المدينة" : "City",
    region: locale === "ar" ? "المنطقة" : "Region",
    save: locale === "ar" ? "حفظ التغييرات" : "Save Changes",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
    errorMsg: locale === "ar" ? "حدث خطأ أثناء تحميل المستأجر" : "Error loading tenant",
    notFound: locale === "ar" ? "المستأجر غير موجود" : "Tenant not found",
    successTitle: locale === "ar" ? "تم التحديث" : "Updated",
    successDesc:
      locale === "ar"
        ? "تم تحديث المستأجر بنجاح"
        : "Tenant updated successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    errorDesc:
      locale === "ar"
        ? "حدث خطأ أثناء تحديث المستأجر"
        : "Error updating tenant",
    nameRequired:
      locale === "ar"
        ? "اسم المنشأة بالإنجليزية مطلوب"
        : "Facility name (English) is required",
    tenantDetails: locale === "ar" ? "تفاصيل المستأجر" : "Tenant Details",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!facilityName.trim()) {
      toast({
        title: texts.errorTitle,
        description: texts.nameRequired,
        variant: "destructive",
      });
      return;
    }

    updateTenant.mutate(
      {
        id: tenantId,
        data: {
          facilityName: facilityName.trim(),
          facilityNameAr: facilityNameAr.trim() || undefined,
          subdomain: subdomain.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          crNumber: crNumber.trim() || undefined,
          vatNumber: vatNumber.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          region: region.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.successDesc,
          });
          router.push(`/${locale}/tenants/${tenantId}`);
        },
        onError: (err) => {
          toast({
            title: texts.errorTitle,
            description: err.message || texts.errorDesc,
            variant: "destructive",
          });
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

  if (error || !tenant) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.errorMsg : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/tenants/${tenantId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">
            {tenant.facilityName}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tenant Details */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.tenantDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="facilityName">{texts.facilityName} *</Label>
                <Input
                  id="facilityName"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilityNameAr">{texts.facilityNameAr}</Label>
                <Input
                  id="facilityNameAr"
                  value={facilityNameAr}
                  onChange={(e) => setFacilityNameAr(e.target.value)}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">{texts.subdomain}</Label>
              <Input
                id="subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.contactInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">{texts.contactEmail}</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">{texts.contactPhone}</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.businessDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="crNumber">{texts.crNumber}</Label>
                <Input
                  id="crNumber"
                  value={crNumber}
                  onChange={(e) => setCrNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatNumber">{texts.vatNumber}</Label>
                <Input
                  id="vatNumber"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{texts.address}</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">{texts.city}</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">{texts.region}</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href={`/${locale}/tenants/${tenantId}`}>
              {texts.cancel}
            </Link>
          </Button>
          <Button type="submit" disabled={updateTenant.isPending}>
            {updateTenant.isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="me-2 h-4 w-4" />
            )}
            {updateTenant.isPending ? texts.saving : texts.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
