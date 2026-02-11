"use client";

import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Key } from "lucide-react";
import { useApiKeys } from "@liyaqa/shared/queries/platform/use-api-keys";

export default function ApiKeysPage() {
  const locale = useLocale();
  const { data: keys, isLoading } = useApiKeys();

  const texts = {
    title: locale === "ar" ? "مفاتيح API" : "API Keys",
    description: locale === "ar" ? "إدارة مفاتيح API للعملاء" : "Manage API keys for clients",
    active: locale === "ar" ? "نشط" : "Active",
    revoked: locale === "ar" ? "ملغي" : "Revoked",
    noKeys: locale === "ar" ? "لا توجد مفاتيح API" : "No API keys found",
    lastUsed: locale === "ar" ? "آخر استخدام" : "Last used",
    expires: locale === "ar" ? "ينتهي" : "Expires",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />
      </div>
    );
  }

  const apiKeys = Array.isArray(keys) ? keys : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Key className="h-6 w-6" />
          {texts.title}
        </h1>
        <p className="text-muted-foreground">{texts.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{texts.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{texts.noKeys}</p>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm">{key.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{key.keyMasked}</p>
                    {key.lastUsedAt && (
                      <p className="text-[10px] text-muted-foreground">
                        {texts.lastUsed}: {new Date(key.lastUsedAt).toLocaleString(locale)}
                      </p>
                    )}
                  </div>
                  <Badge variant={key.isActive ? "default" : "secondary"}>
                    {key.isActive ? texts.active : texts.revoked}
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
