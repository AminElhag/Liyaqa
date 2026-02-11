"use client";

import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { FileText } from "lucide-react";

export default function AuditLogPage() {
  const locale = useLocale();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {locale === "ar" ? "سجل المراجعة" : "Audit Log"}
        </h1>
        <p className="text-muted-foreground">
          {locale === "ar" ? "تتبع جميع الإجراءات والتغييرات في المنصة" : "Track all actions and changes across the platform"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {locale === "ar" ? "سجل المراجعة" : "Audit Log"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {locale === "ar" ? "قريباً..." : "Coming soon..."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
