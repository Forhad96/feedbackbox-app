import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { SITE } from "@/lib/config";
import { getDictionary, type Lang } from "@/lib/i18n";
import { Container } from "@/design-system";
import LanguageSwitcher from "@/components/language-switcher";

export default async function SiteNav({ lang }: { lang: Lang }) {
  const user = await getSessionUser();
  const t = getDictionary(lang);
  const nav = t.common.nav;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/80 backdrop-blur">
      <Container>
        <nav className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-neutral-900"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-950 text-white">
            <MessageSquare className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="text-lg tracking-tight">{SITE.name}</span>
        </Link>

        <div className="flex items-center gap-1.5 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="btn-ghost px-3 py-2">
                {nav.dashboard}
              </Link>
              <Link href={`/u/${user.username}`} className="btn-ghost px-3 py-2">
                {nav.myLink}
              </Link>
              <Link href="/dashboard" className="btn-primary ml-1 px-4 py-2">
                {nav.inbox}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost px-3 py-2">
                {nav.logIn}
              </Link>
              <Link href="/signup" className="btn-primary ml-1 px-4 py-2">
                {nav.getStarted}
              </Link>
            </>
          )}
          <div className="ml-2 border-l border-neutral-200 pl-2">
            <LanguageSwitcher current={lang} ariaLabel={t.common.language} />
          </div>
        </div>
        </nav>
      </Container>
    </header>
  );
}
