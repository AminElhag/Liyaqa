"use client";

import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { FileCheck } from "lucide-react";
import { useTemplates } from "@liyaqa/shared/queries/platform/use-templates";

export default function TemplatesPage() {
  const locale = useLocale();
  const { data, isLoading } = useTemplates();

  const texts = {
    title: locale === "ar" ? "القوالب" : "Templates",
    description: locale === "ar" ? "إدارة قوالب الوثائق والبريد الإلكتروني" : "Manage document and email templates",
    active: locale === "ar" ? "نشط" : "Active",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
    noTemplates: locale === "ar" ? "لا توجد قوالب" : "No templates found",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />
      </div>
    );
  }

  const templates = Array.isArray(data) ? data : (data?.content ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileCheck className="h-6 w-6" />
          {texts.title}
        </h1>
        <p className="text-muted-foreground">{texts.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{texts.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{texts.noTemplates}</p>
          ) : (
            <div className="space-y-3">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm">
                      {locale === "ar" && tpl.nameAr ? tpl.nameAr : tpl.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{tpl.type}</Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">{tpl.key}</span>
                    </div>
                  </div>
                  <Badge variant={tpl.isActive ? "default" : "secondary"}>
                    {tpl.isActive ? texts.active : texts.inactive}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
