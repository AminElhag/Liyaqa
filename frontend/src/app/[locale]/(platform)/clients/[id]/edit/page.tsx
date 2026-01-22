"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { ClientEditForm, type EditClientFormValues } from "@/components/platform/client-edit-form";
import { usePlatformClient, platformClientKeys } from "@/queries/platform/use-platform-clients";
import { updateOrganization } from "@/lib/api/organizations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getLocalizedText } from "@/lib/utils";
import type { UpdateOrganizationRequest } from "@/types/organization";

export default function EditClientPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const clientId = params.id as string;

  const texts = {
    title: locale === "ar" ? "تعديل العميل" : "Edit Client",
    back: locale === "ar" ? "العودة للعميل" : "Back to Client",
    errorMsg: locale === "ar" ? "حدث خطأ أثناء تحميل العميل" : "Error loading client",
    notFound: locale === "ar" ? "العميل غير موجود" : "Client not found",
    successTitle: locale === "ar" ? "تم التحديث" : "Updated",
    successDesc: locale === "ar" ? "تم تحديث العميل بنجاح" : "Client updated successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    errorDesc: locale === "ar" ? "حدث خطأ أثناء تحديث العميل" : "Error updating client",
  };

  // Fetch client data
  const { data: client, isLoading, error } = usePlatformClient(clientId);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateOrganizationRequest) => updateOrganization(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformClientKeys.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: platformClientKeys.lists() });
      toast({
        title: texts.successTitle,
        description: texts.successDesc,
      });
      router.push(`/${locale}/clients/${clientId}`);
    },
    onError: (err) => {
      toast({
        title: texts.errorTitle,
        description: err instanceof Error ? err.message : texts.errorDesc,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EditClientFormValues) => {
    const request: UpdateOrganizationRequest = {
      name: {
        en: data.nameEn,
        ar: data.nameAr || undefined,
      },
      email: data.email || undefined,
      phone: data.phone || undefined,
      website: data.website || undefined,
    };

    updateMutation.mutate(request);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/clients/${clientId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">
            {getLocalizedText(client.name, locale)}
          </p>
        </div>
      </div>

      {/* Form */}
      <ClientEditForm
        client={client}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
