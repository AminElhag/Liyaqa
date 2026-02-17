import { redirect } from "next/navigation";

/**
 * Root locale page — redirects to login.
 * The auth system handles post-login routing by role.
 */
export default async function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/login`);
}
