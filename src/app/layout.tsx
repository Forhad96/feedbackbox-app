import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";
import ToasterProvider from "@/components/toaster";
import { SITE } from "@/lib/config";
import { getServerLang } from "@/lib/i18n/server";

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali",
  display: "swap",
});

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
    <html lang={lang} dir="ltr" className={notoBengali.variable}>
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
        <SiteNav lang={lang} />
        <ToasterProvider>
          <div className="flex-1">{children}</div>
        </ToasterProvider>
        <SiteFooter lang={lang} />
      </body>
    </html>
  );
}
