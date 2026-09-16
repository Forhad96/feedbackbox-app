import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";
import { SITE } from "@/lib/config";
import { getServerLang } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const lang = await getServerLang();

  return (
    <html lang={lang} dir="ltr">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
        <SiteNav lang={lang} />
        <div className="flex-1">{children}</div>
        <SiteFooter lang={lang} />
      </body>
    </html>
  );
}
