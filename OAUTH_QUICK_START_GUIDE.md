# OAuth/SSO Quick Start Guide

## For Developers

This guide provides quick instructions for working with the OAuth/SSO implementation.

## Quick Integration

### Add OAuth Buttons to Any Login Page

```tsx
import { OAuthLoginButtons } from "@/components/auth/oauth-login-buttons";

// In your login page component
<OAuthLoginButtons organizationId={tenantId} />
```

That's it! The component handles everything else.

## Component Props

### OAuthLoginButtons

```typescript
interface OAuthLoginButtonsProps {
  organizationId?: string;  // Optional: Filter providers by organization
  className?: string;       // Optional: Custom CSS classes
}
```

## API Functions

### Fetch Providers

```typescript
import { oauthApi } from "@/lib/api/oauth";

const providers = await oauthApi.fetchOAuthProviders(organizationId);
// Returns: OAuthProvider[]
```

### Initiate OAuth Login

```typescript
import { oauthApi } from "@/lib/api/oauth";

// This will redirect the browser to the OAuth provider
oauthApi.initiateOAuthLogin("google", organizationId);
```

### Handle Callback (Automatic)

The callback is handled automatically by the `/oauth/callback` page.

### Link OAuth Account

```typescript
import { oauthApi } from "@/lib/api/oauth";

await oauthApi.linkOAuthAccount({
  provider: "google",
  code: "auth_code",
  state: "state_token"
});
```

### Unlink OAuth Account

```typescript
import { oauthApi } from "@/lib/api/oauth";

await oauthApi.unlinkOAuthAccount("google");
```

## React Query Hooks

### Fetch Providers (Query)

```typescript
import { useOAuthProviders } from "@/queries/use-oauth";

function MyComponent() {
  const { data: providers, isLoading, error } = useOAuthProviders(organizationId);

  return (
    <div>
      {providers?.map(p => (
        <div key={p.id}>{p.provider}</div>
      ))}
    </div>
  );
}
```

### Initiate OAuth (Mutation)

```typescript
import { useInitiateOAuth } from "@/queries/use-oauth";

function MyComponent() {
  const { mutate: initiateOAuth } = useInitiateOAuth();

  const handleLogin = () => {
    initiateOAuth({ provider: "google", organizationId });
  };

  return <button onClick={handleLogin}>Login with Google</button>;
}
```

### Handle Callback (Mutation)

```typescript
import { useOAuthCallback } from "@/queries/use-oauth";

function CallbackPage() {
  const { mutateAsync: handleCallback } = useOAuthCallback();

  useEffect(() => {
    const processCallback = async () => {
      const response = await handleCallback({ code, state });
      // Store tokens and redirect
    };
    processCallback();
  }, []);
}
```

### Link Account (Mutation)

```typescript
import { useLinkOAuthAccount } from "@/queries/use-oauth";

function SettingsPage() {
  const { mutate: linkAccount } = useLinkOAuthAccount();

  const handleLink = () => {
    linkAccount({ provider: "google", code, state });
  };

  return <button onClick={handleLink}>Link Google Account</button>;
}
```

### Unlink Account (Mutation)

```typescript
import { useUnlinkOAuthAccount } from "@/queries/use-oauth";

function SettingsPage() {
  const { mutate: unlinkAccount } = useUnlinkOAuthAccount();

  const handleUnlink = () => {
    unlinkAccount("google");
  };

  return <button onClick={handleUnlink}>Unlink Google</button>;
}
```

## TypeScript Types

### Import Types

```typescript
import type {
  OAuthProvider,
  ProviderType,
  OAuthLoginResponse,
  OAuthCallbackParams,
  LinkOAuthAccountRequest
} from "@/types/oauth";
```

### ProviderType Enum

```typescript
enum ProviderType {
  GOOGLE = "GOOGLE",
  MICROSOFT = "MICROSOFT",
  OKTA = "OKTA",
  GITHUB = "GITHUB",
  CUSTOM = "CUSTOM"
}
```

### OAuthProvider Interface

```typescript
interface OAuthProvider {
  id: string;
  provider: ProviderType | string;
  displayName?: string | null;
  iconUrl?: string | null;
  enabled: boolean;
}
```

### OAuthLoginResponse Interface

```typescript
interface OAuthLoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
```

## Common Patterns

### Check If Provider Is Enabled

```typescript
const { data: providers } = useOAuthProviders();
const isGoogleEnabled = providers?.some(p =>
  p.provider === ProviderType.GOOGLE && p.enabled
);
```

### Custom Provider Icon

```typescript
// In your backend, set iconUrl for a provider
{
  id: "custom-sso",
  provider: "CUSTOM",
  displayName: "Company SSO",
  iconUrl: "https://example.com/sso-icon.png",
  enabled: true
}
```

### Hide OAuth Buttons If No Providers

The component automatically hides itself when no providers are available:

```typescript
// OAuthLoginButtons returns null when:
// - No providers available
// - All providers disabled
// - Error fetching providers
```

### Conditional Rendering

```typescript
const { data: providers } = useOAuthProviders();

return (
  <div>
    {providers && providers.length > 0 ? (
      <OAuthLoginButtons />
    ) : (
      <p>No SSO providers configured</p>
    )}
  </div>
);
```

## Bilingual Content

### Get Localized Provider Name

The component handles this automatically, but you can use:

```typescript
import { useLocale } from "next-intl";

const locale = useLocale();
const displayName = locale === "ar"
  ? "تسجيل الدخول بواسطة Google"
  : "Sign in with Google";
```

### Supported Locales

- `en`: English
- `ar`: Arabic (RTL support included)

## Error Handling

### API Errors

```typescript
import { parseApiError } from "@/lib/api/client";

try {
  await oauthApi.linkOAuthAccount(data);
} catch (err) {
  const apiError = await parseApiError(err);
  console.error(apiError.message); // English
  console.error(apiError.messageAr); // Arabic
}
```

### Hook Errors

```typescript
const { data, error } = useOAuthProviders();

if (error) {
  // Handle error
  console.error("Failed to fetch providers:", error);
}
```

## Styling

### Custom Styling Example

```typescript
<OAuthLoginButtons
  className="space-y-3 my-8"
  organizationId={tenantId}
/>
```

### Override Button Styles

```css
/* In your CSS/Tailwind */
.oauth-buttons button {
  @apply rounded-xl shadow-lg;
}
```

## Testing

### Mock Providers

```typescript
const mockProviders: OAuthProvider[] = [
  {
    id: "google",
    provider: ProviderType.GOOGLE,
    displayName: "Google SSO",
    iconUrl: null,
    enabled: true
  }
];
```

### Mock OAuth Response

```typescript
const mockOAuthResponse: OAuthLoginResponse = {
  user: { /* user object */ },
  accessToken: "mock_access_token",
  refreshToken: "mock_refresh_token",
  tokenType: "Bearer",
  expiresIn: 3600
};
```

## Debugging

### Enable OAuth Debug Logging

```typescript
// In your component
useEffect(() => {
  console.log("[OAuth] Providers:", providers);
  console.log("[OAuth] Organization ID:", organizationId);
}, [providers, organizationId]);
```

### Check API Calls

Open browser DevTools Network tab and filter by:
- `oauth/providers`
- `oauth/authorize`
- `oauth/callback`

### Inspect Stored Tokens

```typescript
import { getAccessToken, getRefreshToken } from "@/lib/api/client";

console.log("Access Token:", getAccessToken());
console.log("Refresh Token:", getRefreshToken());
```

## Backend Integration

### Required Backend Endpoints

1. `GET /api/auth/oauth/providers` - List available providers
2. `GET /api/auth/oauth/authorize/{provider}` - Start OAuth flow
3. `GET /api/auth/oauth/callback` - Handle OAuth callback
4. `POST /api/auth/oauth/link` - Link OAuth to account
5. `DELETE /api/auth/oauth/unlink/{provider}` - Unlink OAuth

### Expected Backend Response Format

```json
{
  "providers": [
    {
      "id": "google-sso",
      "provider": "GOOGLE",
      "displayName": "Google Workspace",
      "iconUrl": null,
      "enabled": true
    }
  ]
}
```

## Common Issues

### OAuth Button Not Showing

1. Check if providers are enabled in backend
2. Verify organization ID is correct
3. Check browser console for errors
4. Ensure backend endpoint is accessible

### Redirect Not Working

1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check OAuth provider configuration in backend
3. Ensure callback URL is whitelisted
4. Check browser console for redirect errors

### Tokens Not Stored

1. Check browser localStorage and sessionStorage
2. Verify auth store is properly initialized
3. Check for conflicting auth state
4. Look for errors in callback page

## Performance Tips

### Lazy Load OAuth Buttons

```typescript
import dynamic from "next/dynamic";

const OAuthLoginButtons = dynamic(
  () => import("@/components/auth/oauth-login-buttons").then(m => m.OAuthLoginButtons),
  { loading: () => <Skeleton className="h-10 w-full" /> }
);
```

### Cache Provider List

The hook already caches providers for 5 minutes:

```typescript
// Defined in use-oauth.ts
staleTime: 5 * 60 * 1000, // 5 minutes
```

## Security Considerations

1. **State Parameter**: Always validated server-side to prevent CSRF
2. **HTTPS Only**: OAuth callbacks must use HTTPS in production
3. **Token Storage**: Access tokens in sessionStorage, refresh tokens in localStorage
4. **No Sensitive URLs**: Never pass tokens in URL parameters
5. **Error Messages**: Don't expose sensitive info in error messages

## Support

For issues or questions:
1. Check the main documentation: `OAUTH_FRONTEND_IMPLEMENTATION_COMPLETE.md`
2. Review backend OAuth implementation
3. Check browser console for errors
4. Verify OAuth provider configuration

## Additional Resources

- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [OpenID Connect](https://openid.net/connect/)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [React Query Documentation](https://tanstack.com/query/latest)
