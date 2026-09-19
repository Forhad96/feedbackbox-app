import Link from "next/link";
import { Code2, ExternalLink, MessagesSquare } from "lucide-react";
import { SITE } from "@/lib/config";
import { getSessionUser } from "@/lib/auth";
import { getDictionary, type Lang } from "@/lib/i18n";
import { Container } from "@/design-system";

export default async function SiteFooter({ lang }: { lang: Lang }) {
  const year = new Date().getFullYear();
  const user = await getSessionUser();
  const t = getDictionary(lang).common.footer;

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <Container className="flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 font-semibold text-neutral-900">
            <MessagesSquare className="h-5 w-5" />
            {SITE.name}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            {t.tagline}
          </p>
          <p className="mt-3 text-sm text-neutral-500">
            {t.builtBy.replace("{name}", SITE.author.name)}
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <span className="eyebrow">{t.project}</span>
          <a
            href={SITE.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-medium text-neutral-700 hover:underline"
          >
            <Code2 className="h-4 w-4" /> {t.github}
          </a>
          {user ? (
            <Link
              href="/dashboard"
              className="font-medium text-neutral-700 hover:underline"
            >
              {t.dashboardLink}
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="font-medium text-neutral-700 hover:underline"
              >
                {t.createBox}
              </Link>
              <Link
                href="/login"
                className="font-medium text-neutral-700 hover:underline"
              >
                {t.signIn}
              </Link>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <span className="eyebrow">{t.connect}</span>
          <a
            href={SITE.author.facebook}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-medium text-neutral-700 hover:underline"
          >
            Facebook <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={SITE.author.linkedin}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-medium text-neutral-700 hover:underline"
          >
            LinkedIn <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </Container>

      <Container className="border-t border-neutral-100 text-center">
        <p className="py-5 text-xs text-neutral-400">
          {t.copyright.replace("{year}", String(year)).replace("{name}", SITE.name)}
        </p>
      </Container>
    </footer>
  );
}
