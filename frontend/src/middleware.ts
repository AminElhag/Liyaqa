import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/config";

export default createMiddleware({
  // List of all locales that are supported
  locales,

  // Default locale
  defaultLocale,

  // Always use locale prefix in URL
  localePrefix: "always",
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - api routes
    // - _next (Next.js internals)
    // - static files (files with extensions)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
