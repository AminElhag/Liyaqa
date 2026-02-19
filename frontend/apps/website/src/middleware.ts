import createIntlMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@liyaqa/shared/i18n/config";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export default intlMiddleware;

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
