"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useTrainerClient,
  useUpdateTrainerClient,
} from "@liyaqa/shared/queries/use-trainer-portal";
import { ClientEditForm } from "@/components/trainer/client-edit-form";
import type { UpdateClientFormValues } from "@liyaqa/shared/lib/validations/trainer-client";
import type { UUID } from "@liyaqa/shared/types/api";

export default function ClientEditPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();

  const clientId = params.id as UUID;

  const { data: client, isLoading } = useTrainerClient(clientId);
  const updateMutation = useUpdateTrainerClient();

  const texts = {
    back: locale === "ar" ? "رجوع" : "Back",
    editClient: locale === "ar" ? "تعديل العميل" : "Edit Client",
    editClientDescription: locale === "ar"
      ? "قم بتحديث أهداف العميل وملاحظاته وحالته"
      : "Update client goals, notes, and status",
    successTitle: locale === "ar" ? "تم التحديث بنجاح" : "Update Successful",
    successDescription: locale === "ar"
      ? "تم تحديث بيانات العميل بنجاح"
      : "Client information updated successfully",
    errorTitle: locale === "ar" ? "حدث خطأ" : "Error",
    errorDescription: locale === "ar"
      ? "فشل تحديث بيانات العميل. يرجى المحاولة مرة أخرى."
      : "Failed to update client information. Please try again.",
    loadingError: locale === "ar"
      ? "حدث خطأ أثناء تحميل بيانات العميل"
      : "Error loading client data",
  };

  const handleSubmit = (data: UpdateClientFormValues) => {
    updateMutation.mutate(
      { clientId, data },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.successDescription,
          });
          router.push(`/${locale}/trainer/clients/${clientId}`);
        },
        onError: (error) => {
          toast({
            title: texts.errorTitle,
            description: error.message || texts.errorDescription,
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/${locale}/trainer/clients`)}
        >
          <ArrowLeft className="me-2 h-4 w-4" />
          {texts.back}
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{texts.loadingError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${locale}/trainer/clients/${clientId}`)}
        >
          <ArrowLeft className="me-2 h-4 w-4" />
          {texts.back}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{texts.editClient}</h1>
          <p className="text-muted-foreground">{texts.editClientDescription}</p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>{client.memberName}</CardTitle>
          <CardDescription>{client.memberEmail}</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientEditForm
            client={client}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
