"use client";

import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import { Flag } from "lucide-react";
import { useFeatureFlags, useUpdateFeatureFlag } from "@liyaqa/shared/queries/platform/use-feature-flags";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import type { FeatureFlagResponse } from "@liyaqa/shared/types/platform/feature-flags";

export default function FeatureFlagsPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const { data: flagGroups, isLoading } = useFeatureFlags();
  const updateFlag = useUpdateFeatureFlag();

  const texts = {
    title: locale === "ar" ? "أعلام الميزات" : "Feature Flags",
    description: locale === "ar" ? "تمكين أو تعطيل ميزات المنصة" : "Enable or disable platform features",
    enabled: locale === "ar" ? "مفعّل" : "Enabled",
    disabled: locale === "ar" ? "معطّل" : "Disabled",
  };

  const handleToggle = async (flag: FeatureFlagResponse) => {
    try {
      await updateFlag.mutateAsync({
        id: flag.id,
        data: { defaultEnabled: !flag.defaultEnabled },
      });
      toast({
        title: locale === "ar" ? "تم التحديث" : "Updated",
        description: `${flag.name} ${!flag.defaultEnabled ? texts.enabled : texts.disabled}`,
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />
      </div>
    );
  }

  const groups = Array.isArray(flagGroups) ? flagGroups : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flag className="h-6 w-6" />
          {texts.title}
        </h1>
        <p className="text-muted-foreground">{texts.description}</p>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {locale === "ar" ? "لا توجد أعلام ميزات" : "No feature flags configured"}
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.category}>
            <CardHeader>
              <CardTitle className="text-base">{group.category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.flags.map((flag: FeatureFlagResponse) => (
                <div key={flag.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{flag.name}</p>
                      <Badge variant={flag.isActive ? "default" : "secondary"} className="text-[10px]">
                        {flag.isActive ? texts.enabled : texts.disabled}
                      </Badge>
                    </div>
                    {flag.description && (
                      <p className="text-xs text-muted-foreground">{flag.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground font-mono">{flag.key}</p>
                  </div>
                  <Switch
                    checked={flag.defaultEnabled}
                    onCheckedChange={() => handleToggle(flag)}
                    disabled={updateFlag.isPending}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
