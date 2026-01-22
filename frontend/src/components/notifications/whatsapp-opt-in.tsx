"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  MessageCircle,
  Check,
  Zap,
  Shield,
  Users,
  Bell,
  CreditCard,
  Calendar,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { WHATSAPP_TEXTS } from "@/types/whatsapp";
import { cn } from "@/lib/utils";

// Form schema
const whatsappFormSchema = z.object({
  optedIn: z.boolean(),
  whatsappNumber: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        // Saudi phone number validation
        const cleaned = val.replace(/\D/g, "");
        return cleaned.length >= 9 && cleaned.length <= 15;
      },
      { message: "Please enter a valid phone number" }
    ),
});

type WhatsAppFormValues = z.infer<typeof whatsappFormSchema>;

interface WhatsAppOptInProps {
  initialOptedIn?: boolean;
  initialNumber?: string;
  onSave?: (optedIn: boolean, number?: string) => Promise<void>;
  className?: string;
  compact?: boolean;
}

export function WhatsAppOptIn({
  initialOptedIn = false,
  initialNumber = "",
  onSave,
  className,
  compact = false,
}: WhatsAppOptInProps) {
  const locale = useLocale() as "en" | "ar";
  const texts = WHATSAPP_TEXTS[locale];
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<WhatsAppFormValues>({
    resolver: zodResolver(whatsappFormSchema),
    defaultValues: {
      optedIn: initialOptedIn,
      whatsappNumber: initialNumber,
    },
  });

  const optedIn = form.watch("optedIn");

  const handleSubmit = async (values: WhatsAppFormValues) => {
    if (!onSave) return;

    setIsLoading(true);
    try {
      await onSave(values.optedIn, values.whatsappNumber);
      toast({
        title: texts.success,
      });
    } catch (error) {
      toast({
        title: texts.error,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div className={cn("flex items-center justify-between p-4 rounded-lg border", className)}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <div className="font-medium">{texts.title}</div>
            <div className="text-sm text-muted-foreground">{texts.description}</div>
          </div>
        </div>
        <Switch
          checked={optedIn}
          onCheckedChange={(checked) => {
            form.setValue("optedIn", checked);
            if (onSave) {
              onSave(checked, form.getValues("whatsappNumber"));
            }
          }}
        />
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <CardTitle>{texts.title}</CardTitle>
            <CardDescription>{texts.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Benefits */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>{texts.benefits.fast}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span>{texts.benefits.reliable}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-blue-500" />
            <span>{texts.benefits.popular}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-purple-500" />
            <span>{texts.benefits.secure}</span>
          </div>
        </div>

        {/* Notification Types */}
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="font-medium mb-3">{texts.notificationTypes.title}</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span>{texts.notificationTypes.subscription}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>{texts.notificationTypes.invoice}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{texts.notificationTypes.class}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span>{texts.notificationTypes.account}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Opt-in Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="whatsapp-optin">{texts.optIn}</Label>
              <div className="text-sm text-muted-foreground">
                {optedIn ? texts.enabled : texts.disabled}
              </div>
            </div>
            <Switch
              id="whatsapp-optin"
              checked={optedIn}
              onCheckedChange={(checked) => form.setValue("optedIn", checked)}
            />
          </div>

          {/* Phone Number Input */}
          {optedIn && (
            <div className="space-y-2">
              <Label htmlFor="whatsapp-number">{texts.phoneNumber}</Label>
              <Input
                id="whatsapp-number"
                type="tel"
                placeholder={texts.phonePlaceholder}
                {...form.register("whatsappNumber")}
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">{texts.phoneHint}</p>
              {form.formState.errors.whatsappNumber && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.whatsappNumber.message}
                </p>
              )}
            </div>
          )}

          {/* Status Badge */}
          {optedIn && initialNumber && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="h-3 w-3 mr-1" />
                {texts.verified}
              </Badge>
            </div>
          )}

          {/* Submit Button */}
          {onSave && (
            <div className="flex gap-2 justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "..." : texts.save}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
