import AuthForm from "@/components/auth-form";
import { GOOGLE_OAUTH } from "@/lib/config";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const dict = await getServerDictionary();
  return (
    <AuthForm mode="login" googleEnabled={GOOGLE_OAUTH.enabled} dict={dict.auth} />
  );
}
