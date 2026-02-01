'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOAuthProviders } from '@/queries/use-oauth';
import { oauthApi } from '@/lib/api/oauth';
import { Chrome, Github } from 'lucide-react';
import Image from 'next/image';

interface OAuthLoginButtonsProps {
  organizationId?: string;
  className?: string;
}

/**
 * OAuth login buttons component.
 * Displays enabled OAuth providers with appropriate branding.
 */
export function OAuthLoginButtons({ organizationId, className }: OAuthLoginButtonsProps) {
  const { data: providers, isLoading, error } = useOAuthProviders(organizationId);

  const handleOAuthLogin = (providerId: string) => {
    oauthApi.initiateOAuth(providerId);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toUpperCase()) {
      case 'GOOGLE':
        return <Chrome className="h-5 w-5" />;
      case 'GITHUB':
        return <Github className="h-5 w-5" />;
      case 'MICROSOFT':
        return (
          <svg className="h-5 w-5" viewBox="0 0 23 23" fill="none">
            <path fill="#F35325" d="M0 0h11v11H0z" />
            <path fill="#81BC06" d="M12 0h11v11H12z" />
            <path fill="#05A6F0" d="M0 12h11v11H0z" />
            <path fill="#FFBA08" d="M12 12h11v11H12z" />
          </svg>
        );
      default:
        return <Chrome className="h-5 w-5" />;
    }
  };

  const getProviderDisplayName = (provider: string, displayName: string | null) => {
    if (displayName) return displayName;

    switch (provider.toUpperCase()) {
      case 'GOOGLE':
        return 'Continue with Google';
      case 'MICROSOFT':
        return 'Continue with Microsoft';
      case 'GITHUB':
        return 'Continue with GitHub';
      case 'OKTA':
        return 'Continue with Okta';
      default:
        return `Continue with ${provider}`;
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

  return (
    <div className={className}>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <div className="space-y-2">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            variant="outline"
            type="button"
            className="w-full"
            onClick={() => handleOAuthLogin(provider.id)}
          >
            {provider.iconUrl ? (
              <Image src={provider.iconUrl} alt={provider.provider} width={20} height={20} className="mr-2" />
            ) : (
              <span className="mr-2">{getProviderIcon(provider.provider)}</span>
            )}
            {getProviderDisplayName(provider.provider, provider.displayName)}
          </Button>
        ))}
      </div>
    </div>
  );
}
