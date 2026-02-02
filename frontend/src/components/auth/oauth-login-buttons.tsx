"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOAuthProviders, useInitiateOAuth } from "@/queries/use-oauth";
import { ProviderType } from "@/types/oauth";
import { Chrome, Github, Loader2 } from "lucide-react";
import Image from "next/image";

interface OAuthLoginButtonsProps {
  organizationId?: string;
  className?: string;
}

/**
 * OAuth login buttons component.
 * Displays enabled OAuth providers with appropriate branding.
 * Supports bilingual text (English/Arabic).
 */
export function OAuthLoginButtons({
  organizationId,
  className,
}: OAuthLoginButtonsProps) {
  const locale = useLocale();
  const { data: providers, isLoading, error } = useOAuthProviders(organizationId);
  const { mutate: initiateOAuth, isPending } = useInitiateOAuth();

  const handleOAuthLogin = (providerId: string) => {
    initiateOAuth({ provider: providerId, organizationId });
  };

  const getProviderIcon = (provider: string) => {
    const providerUpper = provider.toUpperCase();

    switch (providerUpper) {
      case ProviderType.GOOGLE:
        return <Chrome className="h-5 w-5" />;
      case ProviderType.GITHUB:
        return <Github className="h-5 w-5" />;
      case ProviderType.MICROSOFT:
        return (
          <svg className="h-5 w-5" viewBox="0 0 23 23" fill="none">
            <path fill="#F35325" d="M0 0h11v11H0z" />
            <path fill="#81BC06" d="M12 0h11v11H12z" />
            <path fill="#05A6F0" d="M0 12h11v11H0z" />
            <path fill="#FFBA08" d="M12 12h11v11H12z" />
          </svg>
        );
      case ProviderType.OKTA:
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 16c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z" />
          </svg>
        );
      default:
        return <Chrome className="h-5 w-5" />;
    }
  };

  const getProviderDisplayName = (provider: string, displayName?: string | null) => {
    if (displayName) return displayName;

    const providerUpper = provider.toUpperCase();
    const isArabic = locale === "ar";

    switch (providerUpper) {
      case ProviderType.GOOGLE:
        return isArabic ? "تسجيل الدخول بواسطة Google" : "Sign in with Google";
      case ProviderType.MICROSOFT:
        return isArabic ? "تسجيل الدخول بواسطة Microsoft" : "Sign in with Microsoft";
      case ProviderType.GITHUB:
        return isArabic ? "تسجيل الدخول بواسطة GitHub" : "Sign in with GitHub";
      case ProviderType.OKTA:
        return isArabic ? "تسجيل الدخول بواسطة Okta" : "Sign in with Okta";
      default:
        return isArabic
          ? `تسجيل الدخول بواسطة ${provider}`
          : `Sign in with ${provider}`;
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error || !providers || providers.length === 0) {
    return null;
  }

  const dividerText = locale === "ar" ? "أو" : "or";

  return (
    <div className={className}>
      <div className="space-y-2">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            variant="outline"
            type="button"
            className="w-full"
            onClick={() => handleOAuthLogin(provider.id)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : provider.iconUrl ? (
              <Image
                src={provider.iconUrl}
                alt={provider.provider}
                width={20}
                height={20}
                className="ltr:mr-2 rtl:ml-2"
              />
            ) : (
              <span className="ltr:mr-2 rtl:ml-2">{getProviderIcon(provider.provider)}</span>
            )}
            {getProviderDisplayName(provider.provider, provider.displayName)}
          </Button>
        ))}
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {dividerText}
          </span>
        </div>
      </div>
    </div>
  );
}
