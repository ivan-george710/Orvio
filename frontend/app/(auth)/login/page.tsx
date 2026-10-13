import { safeReturnPath } from "@/lib/registrations";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const redirectTo = safeReturnPath((await searchParams).redirectTo);
  return (
    <AuthLayout title="Welcome back" subtitle="Login to continue to Orvio.">
      <LoginForm redirectTo={redirectTo} />
    </AuthLayout>
  );
}
