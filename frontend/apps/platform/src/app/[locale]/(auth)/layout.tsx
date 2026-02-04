import { AuthLayout } from "@liyaqa/shared/components/layouts/auth-layout";

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
