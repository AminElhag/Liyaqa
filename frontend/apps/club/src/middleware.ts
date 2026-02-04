import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@liyaqa/shared/i18n/config";

/**
 * JWT Payload interface
 */
interface JWTPayload {
  exp?: number;
  role?: string;
  [key: string]: unknown;
}

/**
 * Routes that require authentication
 */
const PROTECTED_ROUTES = ["/admin", "/trainer", "/security"];

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
];

/**
 * Checks if a path is protected
 */
function isProtectedRoute(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, "");
  return PROTECTED_ROUTES.some((route) => pathWithoutLocale.startsWith(route));
}

/**
 * Checks if a path is public
 */
function isPublicRoute(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, "");
  return PUBLIC_ROUTES.some(
    (route) =>
      pathWithoutLocale === route || pathWithoutLocale.startsWith(route + "/")
  );
}

/**
 * Extracts and validates JWT token from request
 */
function getTokenFromRequest(request: NextRequest): string | null {
  // Try to get token from cookie (HTTPOnly cookie auth)
  const cookieToken = request.cookies.get("access_token")?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Try to get token from Authorization header (Bearer auth)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Decodes JWT token (without verification - just for checking expiry)
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(
      Buffer.from(payload, "base64").toString("utf-8")
    ) as JWTPayload;

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Checks if JWT token is expired
 */
function isTokenExpired(token: JWTPayload | null): boolean {
  if (!token || !token.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return token.exp < now;
}

/**
 * Authentication middleware
 */
async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for public routes
  if (isPublicRoute(pathname)) {
    return null;
  }

  // Check if route is protected
  if (!isProtectedRoute(pathname)) {
    return null;
  }

  // Get token from request
  const token = getTokenFromRequest(request);

  // No token found - redirect to login
  if (!token) {
    const locale = pathname.split("/")[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode and validate token
  const decodedToken = decodeJWT(token);

  // Invalid token - redirect to login
  if (!decodedToken) {
    const locale = pathname.split("/")[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if token is expired
  if (isTokenExpired(decodedToken)) {
    const locale = pathname.split("/")[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("expired", "true");
    return NextResponse.redirect(loginUrl);
  }

  // Token is valid - continue
  return null;
}

/**
 * Create i18n middleware
 */
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

/**
 * Main middleware - chains auth and i18n middlewares
 */
export default async function middleware(request: NextRequest) {
  // First, run authentication middleware
  const authResponse = await authMiddleware(request);
  if (authResponse) {
    return authResponse;
  }

  // Then, run i18n middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
