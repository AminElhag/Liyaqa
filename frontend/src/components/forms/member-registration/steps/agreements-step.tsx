"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useLocale } from "next-intl";
import { Check, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActiveAgreements } from "@/queries/use-agreements";
import type { RegistrationData } from "../schemas/registration-schema";
import type { Agreement } from "@/types/agreement";

interface AgreementsStepProps {
  form: UseFormReturn<RegistrationData>;
}

export function AgreementsStep({ form }: AgreementsStepProps) {
  const locale = useLocale();
  const { setValue, watch } = form;
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);

  const { data: agreements = [], isLoading } = useActiveAgreements();
  const signedIds = watch("agreements.signedAgreementIds") || [];

  const texts = {
    title: locale === "ar" ? "الاتفاقيات والإقرارات" : "Agreements & Waivers",
    description:
      locale === "ar"
        ? "يرجى مراجعة وقبول الاتفاقيات التالية"
        : "Please review and accept the following agreements",
    mandatory: locale === "ar" ? "إلزامي" : "Mandatory",
    optional: locale === "ar" ? "اختياري" : "Optional",
    viewFull: locale === "ar" ? "عرض كامل" : "View Full",
    close: locale === "ar" ? "إغلاق" : "Close",
    iAgree: locale === "ar" ? "أوافق على" : "I agree to",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading agreements...",
    noAgreements:
      locale === "ar"
        ? "لا توجد اتفاقيات نشطة"
        : "No active agreements found",
    mandatorySection:
      locale === "ar" ? "الاتفاقيات الإلزامية" : "Mandatory Agreements",
    optionalSection:
      locale === "ar" ? "الاتفاقيات الاختيارية" : "Optional Agreements",
  };

  const handleToggleAgreement = (agreementId: string, checked: boolean) => {
    const currentIds = signedIds;
    if (checked) {
      setValue("agreements.signedAgreementIds", [...currentIds, agreementId]);
    } else {
      setValue(
        "agreements.signedAgreementIds",
        currentIds.filter((id) => id !== agreementId)
      );
    }
  };

  const mandatoryAgreements = agreements.filter((a) => a.isMandatory);
  const optionalAgreements = agreements.filter((a) => !a.isMandatory);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{texts.loading}</p>
        </CardContent>
      </Card>
    );
  }

  if (agreements.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{texts.noAgreements}</p>
        </CardContent>
      </Card>
    );
  }

  const AgreementCard = ({ agreement }: { agreement: Agreement }) => {
    const isSigned = signedIds.includes(agreement.id);
    const title = locale === "ar" ? agreement.title.ar || agreement.title.en : agreement.title.en;

    return (
      <div
        className={`p-4 rounded-lg border transition-colors ${
          isSigned ? "bg-primary/5 border-primary" : "bg-background"
        }`}
      >
        <div className="flex items-start gap-4">
          <Checkbox
            id={`agreement-${agreement.id}`}
            checked={isSigned}
            onCheckedChange={(checked) =>
              handleToggleAgreement(agreement.id, checked as boolean)
            }
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Label
                htmlFor={`agreement-${agreement.id}`}
                className="font-medium cursor-pointer"
              >
                {title}
              </Label>
              <Badge variant={agreement.isMandatory ? "destructive" : "secondary"}>
                {agreement.isMandatory ? texts.mandatory : texts.optional}
              </Badge>
              {isSigned && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAgreement(agreement)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {texts.viewFull}
              </Button>
            </div>
          </div>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{texts.title}</CardTitle>
            <CardDescription>{texts.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mandatory Agreements */}
            {mandatoryAgreements.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">
                  {texts.mandatorySection}
                </h3>
                <div className="space-y-3">
                  {mandatoryAgreements.map((agreement) => (
                    <AgreementCard key={agreement.id} agreement={agreement} />
                  ))}
                </div>
              </div>
            )}

            {/* Optional Agreements */}
            {optionalAgreements.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">
                  {texts.optionalSection}
                </h3>
                <div className="space-y-3">
                  {optionalAgreements.map((agreement) => (
                    <AgreementCard key={agreement.id} agreement={agreement} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agreement Content Dialog */}
      <Dialog
        open={!!selectedAgreement}
        onOpenChange={() => setSelectedAgreement(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedAgreement &&
                (locale === "ar"
                  ? selectedAgreement.title.ar || selectedAgreement.title.en
                  : selectedAgreement.title.en)}
            </DialogTitle>
            <DialogDescription>
              Version {selectedAgreement?.agreementVersion}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: selectedAgreement
                  ? locale === "ar"
                    ? selectedAgreement.content.ar || selectedAgreement.content.en
                    : selectedAgreement.content.en
                  : "",
              }}
            />
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedAgreement(null)}
            >
              {texts.close}
            </Button>
            {selectedAgreement && !signedIds.includes(selectedAgreement.id) && (
              <Button
                type="button"
                onClick={() => {
                  handleToggleAgreement(selectedAgreement.id, true);
                  setSelectedAgreement(null);
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                {texts.iAgree}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
